import assert from 'node:assert/strict'
import { mergeChanges, projectLearning, scopedKey, storageEvents } from '../src/lib/cloud-model.ts'

const snapshot = {
  sessions: [{ at: 10, title: '旧练习', words: 2, seconds: 8, accuracy: 90, wpm: 15, kind: 'sentence', lessonId: 'l1' }],
  lessonScores: { l1: 90 }, independentScores: { l2: 100 },
  book: { 'كِتَاب': { ar: 'كِتَاب', tr: 'kitab', zh: '书', count: 3, last: 10 } },
  tajweed: { t1: { score: 70, at: 10 } }, settings: { sound: false }, learningGoal: { id: 'grammar' },
}
const imported = { seq: 1, import: { id: 'import-1', snapshot } }
const event = (id, type, payload, at = 20) => ({ id, at, type, payload })
const round = event('round', 'session', { at: 20, roundId: 'round-id', title: '新练习', words: 3, seconds: 10, accuracy: 80, wpm: 0, kind: 'sentence', assisted: false, lessonId: 'l1' })
const remove = event('remove', 'mistake-remove', { ar: 'كِتَاب' })
let state = projectLearning([imported, { seq: 2, event: round }, { seq: 3, event: remove }], [round])
assert.equal(state.sessions.length, 2, 'A pending event acknowledged by the server must not count twice')
assert.equal(state.sessions[0].source, 'legacy_import')
assert.equal(state.sessions[0].at, 10, 'Import must preserve original learning time')
assert.deepEqual(state.independentScores, { l1: 80 }, 'Legacy best scores must not become fresh independent results')
assert.equal(state.lessonScores.l2, 100, 'Legacy independent aggregates remain viewable as historical scores')
assert.deepEqual(state.book, {}, 'Rebuilding an existing import must not resurrect a later removed mistake')
state = projectLearning([imported, imported, { seq: 2, event: remove }])
assert.equal(state.sessions.length, 1, 'A retried import is idempotent')
assert.deepEqual(state.book, {})
state = projectLearning([{ seq: 1, event: remove }, { ...imported, seq: 2 }])
assert.deepEqual(state.book, {}, 'A late historical import must not resurrect a live removed mistake')
state = projectLearning([{ seq: 1, event: round }, { seq: 2, event: event('clear', 'history-clear', {}) }], [event('next', 'session', { ...round.payload, at: 30, roundId: 'other-round' })])
assert.equal(state.sessions.length, 1)
assert.equal(state.sessions[0].at, 30)
const otherDevice = event('other-device', 'session', { ...round.payload, roundId: 'device-b' })
state = projectLearning([{ seq: 2, event: otherDevice }, { seq: 1, event: round }])
assert.equal(state.sessions.length, 2, 'Two devices append attempts rather than overwriting each other')
const merged = mergeChanges([{ seq: 1, event: round }], [{ seq: 1, event: round }, { seq: 2, event: otherDevice }], [round, event('offline', 'history-clear', {})])
assert.equal(merged.changes.length, 2)
assert.deepEqual(merged.pending.map((item) => item.id), ['offline'], 'Only acknowledged IDs leave the retry queue')
assert.notEqual(scopedKey('account-a', 'qalam.sessions'), scopedKey('account-b', 'qalam.sessions'))
assert.equal(scopedKey(null, 'qalam.sessions'), 'qalam.sessions', 'Guest keys must remain intact')
let number = 0
const uuid = () => `id-${number++}`
const before = snapshot.book
const after = { 'كِتَاب': { ...before['كِتَاب'], count: 4 } }
assert.equal(storageEvents('qalam.mistakes', before, after, uuid).length, 1)
assert.deepEqual(storageEvents('qalam.settings', { sound: true, shuffle: true }, { sound: false, shuffle: true }, uuid)[0].payload.value, { sound: false })
const tajweed = event('tajweed', 'tajweed-check', { lessonId: 't1', score: 100, at: 30 })
state = projectLearning([{ seq: 1, event: tajweed }])
assert.equal(state.sessions.length, 0, 'Tajweed results must never count as typing sessions or WPM')
assert.equal(state.tajweed.t1.score, 100)

// Check real persistent namespaces and frozen imports with a small in-memory Storage implementation.
const memory = new Map()
globalThis.localStorage = {
  get length() { return memory.size }, key: (index) => [...memory.keys()][index] ?? null,
  getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key),
}
// A shared LockManager mock models the browser lock shared by separate tabs.
const lockTails = new Map()
const locks = {
  request(name, options, callback) {
    const action = typeof options === 'function' ? options : callback
    const previous = lockTails.get(name) ?? Promise.resolve()
    const result = previous.catch(() => {}).then(action)
    lockTails.set(name, result.catch(() => {}))
    return result
  },
}
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks } })
const store = await import('../src/lib/cloud-store.ts')
const importTab = await import('../src/lib/cloud-store.ts?import-tab')
localStorage.setItem('qalam.sessions', JSON.stringify(snapshot.sessions))
store.setScope('account-a')
// Hold the same lock while both tabs request their first snapshot. Neither may create an ID yet.
let releaseImportLock
const importGate = new Promise((resolve) => { releaseImportLock = resolve })
const heldLock = locks.request('qalam-guest-import-v1', () => importGate)
const firstImport = store.prepareImport('account-a')
const concurrentImport = importTab.prepareImport('account-a')
await Promise.resolve()
assert.equal(store.getImportDraft(), null, 'Snapshot creation must wait for the shared import lock')
releaseImportLock()
await heldLock
const [frozen, concurrentFrozen] = await Promise.all([firstImport, concurrentImport])
assert.deepEqual(concurrentFrozen, frozen, 'Two tabs must use one frozen snapshot and one migration ID')
localStorage.setItem('qalam.sessions', '[]')
assert.deepEqual(await store.prepareImport('account-a'), frozen, 'Retry must use the frozen original snapshot')
await assert.rejects(store.prepareImport('account-b'), /另一账号/)
// Competing accounts must not each create a separate draft from the same empty browser state.
localStorage.removeItem('qalam.cloud.import-draft.v1')
const contenders = await Promise.allSettled([store.prepareImport('account-a'), importTab.prepareImport('account-b')])
assert.equal(contenders[0].status, 'fulfilled')
assert.equal(contenders[1].status, 'rejected')
assert.match(contenders[1].reason.message, /另一账号/)
assert.equal(store.getImportDraft().ownerId, 'account-a')
await assert.rejects(store.prepareImport('account-a', () => false), /账号已切换/)
navigator.locks = undefined
await assert.rejects(store.prepareImport('account-a'), /安全导入/)
navigator.locks = locks
store.enqueueEvent('account-a', round)
store.setScope('account-b')
assert.equal(store.getJournal('account-b').pending.length, 0)
assert.equal(store.getJournal('account-a').pending.length, 1)
store.acceptPage('account-a', { changes: [{ seq: 2, event: round }], nextCursor: 2, hasMore: false })
store.acceptPage('account-a', { changes: [], nextCursor: 1, hasMore: false })
assert.equal(store.getJournal('account-a').cursor, 2, 'A slower concurrent response must not roll back the cursor')
assert.equal(store.getJournal('account-a').pending.length, 0)
assert.equal(store.getScope(), 'account-b', 'An old account response must not change the active account')
assert.equal(store.readStored('account-b', 'qalam.sessions'), '[]')
assert.equal(JSON.parse(store.readStored('account-a', 'qalam.sessions')).length, 1)
assert.deepEqual(JSON.parse(localStorage.getItem('qalam.sessions')), [], 'Cloud changes must never overwrite guest records')
localStorage.setItem = () => { throw new Error('quota') }
store.enqueueEvent('account-a', event('retry-after-quota', 'history-clear', {}))
assert.match(store.getStorageError(), /本地保存失败/)
assert.equal(store.getJournal('account-a').pending.length, 1, 'Storage failure must retain the in-memory retry queue')
localStorage.setItem = (key, value) => memory.set(key, value)
store.retryLocalWrites()
assert.equal(store.getStorageError(), null)
assert.equal(store.getJournal('account-a').pending[0].id, 'retry-after-quota')
assert.ok(memory.has('qalam.cloud.pending.v1.account-a.retry-after-quota'))
// Two independent module instances emulate tabs that have not received storage events yet.
const tabB = await import('../src/lib/cloud-store.ts?other-tab')
store.setScope('parallel')
tabB.setScope('parallel')
store.enqueueEvent('parallel', event('tab-a', 'history-clear', {}))
tabB.enqueueEvent('parallel', event('tab-b', 'mistakes-clear', {}))
assert.deepEqual(new Set(store.getJournal('parallel').pending.map((item) => item.id)), new Set(['tab-a', 'tab-b']))
assert.equal(tabB.getJournal('parallel').pending.length, 2, 'A second tab must not overwrite the first tab pending record')
store.acceptPage('parallel', { changes: [{ seq: 100, event: event('tab-a', 'history-clear', {}) }], nextCursor: 100, hasMore: false })
tabB.acceptPage('parallel', { changes: [{ seq: 50, event: event('tab-b', 'mistakes-clear', {}) }], nextCursor: 50, hasMore: false })
assert.equal(store.getJournal('parallel').cursor, 100)
assert.equal(tabB.getJournal('parallel').cursor, 100, 'Receipts written by a slower tab cannot roll back the shared cursor')
assert.equal(tabB.getJournal('parallel').pending.length, 0)
assert.equal([...memory.keys()].filter((key) => key.startsWith('qalam.cloud.pending.v1.parallel.')).length, 0, 'ACK removes individual pending keys')

const { syncJournal } = await import('../src/lib/cloud-sync.ts')
const feed = []
let appended = false
const uploaded = []
store.enqueueEvent('during-sync', event('first-upload', 'history-clear', {}))
const request = async (_owner, method, body, cursor) => {
  if (method === 'POST') {
    uploaded.push(...body.events.map((item) => item.id))
    if (!appended) {
      appended = true
      store.enqueueEvent('during-sync', event('appended-during-upload', 'mistakes-clear', {}))
    }
    for (const item of body.events) feed.push({ seq: feed.length + 1, event: item })
    return { ok: true }
  }
  return { changes: feed.filter((change) => change.seq > cursor), nextCursor: feed.length, hasMore: false }
}
await syncJournal('during-sync', request, () => true)
assert.deepEqual(uploaded, ['first-upload'])
assert.deepEqual(store.getJournal('during-sync').pending.map((item) => item.id), ['appended-during-upload'])
await syncJournal('during-sync', request, () => true)
assert.deepEqual(uploaded, ['first-upload', 'appended-during-upload'])
assert.equal(store.getJournal('during-sync').pending.length, 0)
store.enqueueEvent('switch-during-sync', event('switch-event', 'history-clear', {}))
let sameOwner = true
let getCalls = 0
await assert.rejects(syncJournal('switch-during-sync', async (_owner, method) => {
  if (method === 'POST') sameOwner = false
  else getCalls++
  return { ok: true }
}, () => sameOwner), /账号已切换/)
assert.equal(getCalls, 0)
assert.equal(store.getJournal('switch-during-sync').pending.length, 1)
console.log('Cloud sync checks passed: projections, retry deduplication, legacy provenance, account isolation and import ownership.')
