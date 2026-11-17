import type { AttemptPayload, CloudChange, CloudEvent, LegacyImport, LegacySnapshot, SyncPage } from '../../shared/cloud.ts'
import { LEARNING_KEYS, projectLearning, projectionValues, scopedKey, storageEvents } from './cloud-model.ts'

interface Journal { changes: CloudChange[]; pending: CloudEvent[]; cursor: number; syncedAt: number }
interface ImportDraft extends LegacyImport { ownerId: string; completed: boolean }
const cache = new Map<string, string | null>()
const journals = new Map<string, Journal>()
const volatilePending = new Map<string, Map<string, CloudEvent>>()
const volatileChanges = new Map<string, Map<number, CloudChange>>()
const listeners = new Set<() => void>()
let scope: string | null = null
let revision = 0
let storageError: string | null = null
let hydrated = false
const draftKey = 'qalam.cloud.import-draft.v1'
export const subscribeStore = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export const getStoreRevision = () => revision
export const getScope = () => scope
export const getStorageError = () => storageError
function notify() { revision++; listeners.forEach((listener) => listener()) }
function readDisk(key: string): string | null {
  try { return localStorage.getItem(key) } catch { storageError = '浏览器不允许本地保存；请允许站点存储后再重试。'; return null }
}
function storeRead(key: string): string | null {
  if (cache.has(key)) return cache.get(key) ?? null
  const value = readDisk(key)
  cache.set(key, value)
  return value
}
function storeWrite(key: string, value: string) {
  cache.set(key, value)
  try { localStorage.setItem(key, value); return true } catch { storageError = '本地保存失败，待同步记录可能无法在关闭页面后保留。请释放浏览器存储空间并重试同步。'; return false }
}
function storeRemove(key: string) {
  cache.delete(key)
  try { localStorage.removeItem(key) } catch { storageError = '无法清理已同步缓存，请允许站点存储后重试。' }
}
function parseJSON<T>(raw: string | null, fallback: T): T {
  try { return raw ? JSON.parse(raw) as T : fallback } catch { return fallback }
}
export function readJSON<T>(key: string, fallback: T): T { return parseJSON(storeRead(key), fallback) }
export function readStored(scopeId: string | null, key: string) { return storeRead(scopedKey(scopeId, key)) }
function journalKey(userId: string) { return `qalam.cloud.journal.v1.${userId}` }
function pendingPrefix(userId: string) { return `qalam.cloud.pending.v1.${userId}.` }
function feedPrefix(userId: string) { return `qalam.cloud.feed.v1.${userId}.` }
function records<T>(prefix: string): T[] {
  const items: T[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) {
        const item = parseJSON<T | null>(localStorage.getItem(key), null)
        if (item) items.push(item)
      }
    }
  } catch { storageError = '读取同步缓存失败，请允许站点存储后重试。' }
  return items
}
function pendingMemory(userId: string) {
  let values = volatilePending.get(userId)
  if (!values) { values = new Map(); volatilePending.set(userId, values) }
  return values
}
function changeMemory(userId: string) {
  let values = volatileChanges.get(userId)
  if (!values) { values = new Map(); volatileChanges.set(userId, values) }
  return values
}
function savePending(userId: string, event: CloudEvent) {
  if (storeWrite(`${pendingPrefix(userId)}${event.id}`, JSON.stringify(event))) pendingMemory(userId).delete(event.id)
  else pendingMemory(userId).set(event.id, event)
}
function saveChange(userId: string, change: CloudChange) {
  if ([...changeMemory(userId).keys()].some((seq) => seq < change.seq)) { changeMemory(userId).set(change.seq, change); return }
  if (storeWrite(`${feedPrefix(userId)}${change.seq}`, JSON.stringify(change))) changeMemory(userId).delete(change.seq)
  else changeMemory(userId).set(change.seq, change)
}
export function getJournal(userId: string): Journal {
  let journal = journals.get(userId)
  if (!journal) {
    const saved = parseJSON<Partial<Journal>>(readDisk(journalKey(userId)), {})
    journal = { changes: [], pending: [], cursor: 0, syncedAt: typeof saved.syncedAt === 'number' ? saved.syncedAt : 0 }
    journals.set(userId, journal)
    // Migrate pre-release whole-journal caches once. New writes are append-only per record.
    for (const change of Array.isArray(saved.changes) ? saved.changes : []) saveChange(userId, change)
    for (const event of Array.isArray(saved.pending) ? saved.pending : []) savePending(userId, event)
    if (saved.changes?.length || saved.pending?.length) storeWrite(journalKey(userId), JSON.stringify({ syncedAt: journal.syncedAt }))
  }
  // ponytail: scanning this small local journal avoids a cross-tab read/modify/write race;
  // move the journal to IndexedDB transactions if long histories make these scans costly.
  const changes = [...new Map([...records<CloudChange>(feedPrefix(userId)), ...changeMemory(userId).values()].map((change) => [change.seq, change])).values()].sort((a, b) => a.seq - b.seq)
  const delivered = new Set(changes.flatMap((change) => change.event ? [change.event.id] : []))
  const pending = [...new Map([...records<CloudEvent>(pendingPrefix(userId)), ...pendingMemory(userId).values()].map((event) => [event.id, event])).values()].filter((event) => !delivered.has(event.id))
  journal.changes = changes
  journal.pending = pending
  journal.cursor = changes.at(-1)?.seq ?? 0
  const meta = parseJSON<{ syncedAt?: number }>(readDisk(journalKey(userId)), {})
  journal.syncedAt = Math.max(journal.syncedAt, meta.syncedAt ?? 0)
  return journal
}
function applyProjection(userId: string) {
  const journal = getJournal(userId)
  const values = projectionValues(projectLearning(journal.changes, journal.pending))
  for (const key of LEARNING_KEYS) storeWrite(scopedKey(userId, key), JSON.stringify(values[key]))
}
export function retryLocalWrites() {
  storageError = null
  for (const [key, value] of cache) if (value !== null) storeWrite(key, value)
  for (const [userId, items] of volatilePending) for (const event of [...items.values()]) savePending(userId, event)
  for (const [userId, items] of volatileChanges) for (const change of [...items.values()].sort((a, b) => a.seq - b.seq)) saveChange(userId, change)
  notify()
}
export function setScope(next: string | null) {
  if (scope === next && hydrated) return
  scope = next
  hydrated = true
  if (next) applyProjection(next)
  notify()
}
export function enqueueEvent(userId: string, event: CloudEvent) {
  savePending(userId, event)
  applyProjection(userId)
  notify()
}
export function queueAttempt(payload: AttemptPayload) {
  if (!scope) return
  enqueueEvent(scope, { id: crypto.randomUUID(), at: Date.now(), type: 'attempt', payload: { ...payload } })
}
export function writeStored(scopeId: string | null, key: string, previous: unknown, next: unknown) {
  if (scopeId) {
    const events = storageEvents(key, previous, next, () => crypto.randomUUID())
    if (events.length) {
      events.forEach((event) => savePending(scopeId, event))
      applyProjection(scopeId)
      notify()
      return
    }
  }
  storeWrite(scopedKey(scopeId, key), JSON.stringify(next))
  notify()
}
export function acceptPage(userId: string, page: SyncPage) {
  // Each receipt is persisted separately, so another tab cannot roll back the shared cursor.
  for (const change of page.changes) {
    saveChange(userId, change)
    if (change.event) {
      storeRemove(`${pendingPrefix(userId)}${change.event.id}`)
      pendingMemory(userId).delete(change.event.id)
    }
  }
  applyProjection(userId)
  notify()
}
export function markSynced(userId: string) {
  const journal = getJournal(userId)
  journal.syncedAt = Date.now()
  storeWrite(journalKey(userId), JSON.stringify({ syncedAt: journal.syncedAt }))
  notify()
}
export function guestSnapshot(): LegacySnapshot {
  return {
    sessions: readJSON('qalam.sessions', []),
    lessonScores: readJSON('qalam.lessons', {}),
    independentScores: readJSON('qalam.independent-lessons.v1', {}),
    book: readJSON('qalam.mistakes', {}),
    tajweed: readJSON('qalam.tajweed-checks.v1', {}),
    settings: readJSON('qalam.settings', {}),
    learningGoal: readJSON('qalam.learning-goal', { id: 'daily' }),
  }
}
export function getImportDraft() { return parseJSON<ImportDraft | null>(readDisk(draftKey), null) }
async function withImportLock<T>(action: () => T): Promise<T> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks
  if (!locks?.request) throw new Error('此浏览器暂不支持安全导入，请使用支持 Web Locks 的浏览器打开本站后重试。游客记录仍保留。')
  return locks.request('qalam-guest-import-v1', { mode: 'exclusive' }, action)
}
function freezeImport(userId: string): LegacyImport {
  const prior = getImportDraft()
  if (prior) {
    if (prior.ownerId !== userId) throw new Error('这份游客记录已绑定另一账号，不会自动导入当前账号。')
    if (!storeWrite(draftKey, JSON.stringify(prior))) throw new Error('无法保存导入凭据。请允许站点存储或释放空间后重试，原始记录仍保留。')
    return { id: prior.id, snapshot: prior.snapshot }
  }
  const draft: ImportDraft = { id: crypto.randomUUID(), snapshot: guestSnapshot(), ownerId: userId, completed: false }
  if (!storeWrite(draftKey, JSON.stringify(draft))) { notify(); throw new Error('无法保存导入凭据。请允许站点存储或释放空间后重试，原始记录仍保留。') }
  notify()
  return { id: draft.id, snapshot: draft.snapshot }
}
export function prepareImport(userId: string, stillActive: () => boolean = () => true): Promise<LegacyImport> {
  // The lock spans the initial read, ownership decision, ID creation and durable write in all tabs.
  return withImportLock(() => {
    if (!stillActive()) throw new Error('账号已切换，本次导入已停止。')
    return freezeImport(userId)
  })
}
export function completeImport(userId: string, importId: string): Promise<void> {
  return withImportLock(() => {
    const draft = getImportDraft()
    if (draft?.ownerId === userId && draft.id === importId) {
      if (!storeWrite(draftKey, JSON.stringify({ ...draft, completed: true }))) throw new Error('云端已接收记录，但无法保存本地导入状态；请释放存储空间后重试，重复导入不会重复计数。')
      notify()
    }
  })
}
if (typeof window !== 'undefined') window.addEventListener('storage', (event) => {
  if (!event.key) { cache.clear(); journals.clear() }
  else cache.delete(event.key)
  if (scope && (!event.key || event.key.startsWith(feedPrefix(scope)) || event.key.startsWith(pendingPrefix(scope)))) applyProjection(scope)
  notify()
})
