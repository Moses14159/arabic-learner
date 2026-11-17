import type { AttemptPayload, CloudEvent, LegacyImport, LegacySnapshot, PracticeSummary, WordEntry } from '../shared/cloud.ts'
import { getExercise, gradeAttempt } from '../shared/catalog.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SETTINGS = new Set(['showMarks', 'requireMarks', 'showTranslit', 'dictation', 'autoSpeak', 'showKeyboard', 'sound', 'shuffle'])
const GOALS = new Set(['daily', 'grammar', 'tajweed'])
const MAX_BODY_BYTES = 1024 * 1024
const MAX_BATCH = 100
const PAGE_SIZE = 200

export class RequestError extends Error {
  status: number
  code: string
  eventId?: string
  constructor(status: number, message: string, code = 'invalid_request', eventId?: string) {
    super(message); this.status = status; this.code = code; this.eventId = eventId
  }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RequestError(422, '记录格式不正确。')
  return value as Record<string, unknown>
}
function text(value: unknown, max = 2048, empty = false): string {
  if (typeof value !== 'string' || (!empty && !value.length) || value.length > max) throw new RequestError(422, '记录文本缺失或过长。')
  return value
}
function number(value: unknown, max = Number.MAX_SAFE_INTEGER, min = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new RequestError(422, '记录数值不正确。')
  return value
}
function integer(value: unknown, max = Number.MAX_SAFE_INTEGER, min = 0): number {
  const result = number(value, max, min)
  if (!Number.isSafeInteger(result)) throw new RequestError(422, '记录数值必须为整数。')
  return result
}
function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new RequestError(422, '记录开关值不正确。')
  return value
}
function uuid(value: unknown): string {
  if (typeof value !== 'string' || !UUID.test(value)) throw new RequestError(422, '记录标识不正确。')
  return value.toLowerCase()
}
function word(value: unknown): WordEntry {
  const item = object(value)
  return { ar: text(item.ar, 1024), tr: text(item.tr, 2048, true), zh: text(item.zh, 2048, true) }
}
function settings(value: unknown): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const [key, item] of Object.entries(object(value))) {
    if (!SETTINGS.has(key)) throw new RequestError(422, '设置项目不正确。')
    result[key] = boolean(item)
  }
  return result
}
function summary(value: unknown): PracticeSummary {
  const item = object(value)
  if (item.kind !== undefined && item.kind !== 'typing' && item.kind !== 'sentence') throw new RequestError(422, '练习类型不正确。')
  const result: PracticeSummary = {
    at: integer(item.at), title: text(item.title, 512), words: integer(item.words, 100000),
    seconds: integer(item.seconds, 604800), accuracy: number(item.accuracy, 100), wpm: number(item.wpm, 100000),
  }
  if (item.kind !== undefined) result.kind = item.kind
  if (item.assisted !== undefined) result.assisted = boolean(item.assisted)
  if (item.lessonId !== undefined) result.lessonId = text(item.lessonId, 128)
  if (item.skipped !== undefined) result.skipped = integer(item.skipped, 100000)
  if (item.roundId !== undefined) result.roundId = uuid(item.roundId)
  return result
}
function scoreMap(value: unknown): Record<string, number> {
  const entries = Object.entries(object(value))
  if (entries.length > 200) throw new RequestError(422, '历史课程数量过多。')
  return Object.fromEntries(entries.map(([key, item]) => [text(key, 128), number(item, 100)]))
}

export function normalizeImport(value: unknown): LegacyImport {
  const item = object(value)
  const input = object(item.snapshot)
  if (!Array.isArray(input.sessions) || input.sessions.length > 500) throw new RequestError(422, '历史练习记录格式不正确（最多 500 轮）。')
  const bookEntries = Object.entries(object(input.book))
  if (bookEntries.length > 10000) throw new RequestError(422, '历史错词数量过多。')
  const book: LegacySnapshot['book'] = Object.fromEntries(bookEntries.map(([key, entry]) => {
    const data = object(entry)
    const value = { ...word(data), count: integer(data.count, 1000000000, 1), last: integer(data.last) }
    if (key !== value.ar) throw new RequestError(422, '历史错词的标识与内容不一致。')
    return [key, value]
  }))
  const tajweedEntries = Object.entries(object(input.tajweed))
  if (tajweedEntries.length > 200) throw new RequestError(422, '历史规则自测数量过多。')
  const tajweed = Object.fromEntries(tajweedEntries.map(([key, entry]) => {
    const data = object(entry)
    return [text(key, 128), { score: number(data.score, 100), at: integer(data.at) }]
  }))
  const goal = object(input.learningGoal)
  const id = goal.id === 'reading' ? 'tajweed' : text(goal.id, 32)
  if (!GOALS.has(id)) throw new RequestError(422, '历史学习目标不正确。')
  return { id: uuid(item.id), snapshot: {
    sessions: input.sessions.map(summary), lessonScores: scoreMap(input.lessonScores), independentScores: scoreMap(input.independentScores),
    book, tajweed, settings: settings(input.settings), learningGoal: { id },
  } }
}

export function normalizeEvent(value: unknown): CloudEvent {
  const item = object(value)
  const event: CloudEvent = { id: uuid(item.id), at: integer(item.at), type: item.type as CloudEvent['type'], payload: {} }
  try {
    const data = object(item.payload)
    switch (item.type) {
      case 'attempt': {
        const input: AttemptPayload = {
          exerciseId: text(data.exerciseId, 256), contentVersion: text(data.contentVersion, 128), roundId: uuid(data.roundId),
          mode: data.mode as AttemptPayload['mode'], answer: data.answer as string | number,
          assisted: boolean(data.assisted), hadError: boolean(data.hadError), durationMs: integer(data.durationMs, 604800000),
        }
        if (!['typing', 'sentence-build', 'sentence-type', 'tajweed'].includes(input.mode)) throw new RequestError(422, '作答方式不正确。')
        if (typeof input.answer === 'string') text(input.answer, 8192, true)
        else if (typeof input.answer === 'number') integer(input.answer, 1000)
        else throw new RequestError(422, '答案格式不正确。')
        if (data.skipped !== undefined) input.skipped = boolean(data.skipped)
        if (!getExercise(input.exerciseId, input.contentVersion)) throw new RequestError(409, '本条练习的内容版本暂不可用，请保留待同步记录并更新或重试。', 'content_unavailable', event.id)
        event.payload = { ...input }
        try { event.result = gradeAttempt(input) } catch { throw new RequestError(422, '作答内容与练习类型不一致。', 'invalid_event', event.id) }
        break
      }
      case 'session': event.payload = { ...summary(data), source: 'client_reported' }; break
      case 'mistake': event.payload = { word: word(data.word), ...(data.at === undefined ? {} : { at: integer(data.at) }) }; break
      case 'mistake-remove': event.payload = { ar: text(data.ar, 1024) }; break
      case 'mistakes-clear':
      case 'history-clear': break
      case 'preference': {
        if (data.key === 'qalam.settings') event.payload = { key: data.key, value: settings(data.value) }
        else if (data.key === 'qalam.learning-goal') {
          const goal = object(data.value)
          if (typeof goal.id !== 'string' || !GOALS.has(goal.id)) throw new RequestError(422, '学习目标不正确。')
          event.payload = { key: data.key, value: { id: goal.id } }
        } else throw new RequestError(422, '设置项目不正确。')
        break
      }
      case 'tajweed-check': event.payload = { lessonId: text(data.lessonId, 128), score: number(data.score, 100), at: integer(data.at), source: 'client_reported' }; break
      default: throw new RequestError(422, '不支持的学习记录类型。')
    }
  } catch (error) {
    if (error instanceof RequestError) { error.eventId ??= event.id; if (error.code === 'invalid_request') error.code = 'invalid_event' }
    throw error
  }
  // Client-supplied result / score validation flags are never copied.
  return event
}

type Environment = Record<string, string | undefined>
export interface HandlerDependencies { env?: Environment; fetch?: typeof globalThis.fetch }
function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' } })
}

export async function handleLearning(request: Request, dependencies: HandlerDependencies = {}): Promise<Response> {
  const env = dependencies.env ?? process.env
  const fetcher = dependencies.fetch ?? globalThis.fetch
  try {
    if (request.method !== 'GET' && request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'GET, POST', 'cache-control': 'no-store' } })
    const base = env.SUPABASE_URL || env.VITE_SUPABASE_URL
    const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
    const publicKey = env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY
    if (!base || !secret || !publicKey) throw new RequestError(503, '云端尚未配置，请先完成部署设置；本地学习记录仍保留。', 'cloud_not_configured')
    const url = new URL(base)
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new RequestError(503, '云端配置不正确。', 'cloud_not_configured')
    const authorization = request.headers.get('authorization') ?? ''
    if (!/^Bearer [^\s]{1,8192}$/.test(authorization)) throw new RequestError(401, '请先登录后同步。', 'unauthorized')
    const auth = await fetcher(new URL('/auth/v1/user', url), { headers: { apikey: publicKey, authorization }, signal: AbortSignal.timeout(12000) })
    if (auth.status === 401 || auth.status === 403) throw new RequestError(401, '登录已失效，请重新登录；待同步记录仍保留。', 'unauthorized')
    if (!auth.ok) throw new RequestError(503, '身份服务暂时不可用，请稍后重试。', 'cloud_unavailable')
    const user = await auth.json() as { id?: unknown }
    const userId = uuid(user.id)
    const rpc = async (name: string, payload: unknown) => {
      const headers: Record<string, string> = { apikey: secret, 'content-type': 'application/json' }
      // New sb_secret keys belong only in apikey; legacy JWT service keys also support Bearer.
      if (secret.startsWith('eyJ')) headers.authorization = `Bearer ${secret}`
      const response = await fetcher(new URL(`/rest/v1/rpc/${name}`, url), { method: 'POST', headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(12000) })
      if (!response.ok) throw new RequestError(503, '云端保存暂时失败，请检查数据库迁移或稍后重试；本地记录仍保留。', 'cloud_unavailable')
      return response.json()
    }
    if (request.method === 'GET') {
      const params = new URL(request.url).searchParams
      const rawCursor = params.get('cursor') ?? '0'
      if (!/^\d+$/.test(rawCursor)) throw new RequestError(400, '同步游标不正确。')
      const cursor = integer(Number(rawCursor))
      const page = await rpc('qalam_pull_learning', { p_user: userId, p_after: cursor, p_limit: PAGE_SIZE })
      return json(page)
    }
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new RequestError(415, '请使用 JSON 格式提交记录。')
    const declaredBytes = Number(request.headers.get('content-length') || 0)
    if (declaredBytes > MAX_BODY_BYTES) throw new RequestError(413, '本次同步内容过大，请分批同步。')
    const rawBody = await request.text()
    if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) throw new RequestError(413, '本次同步内容过大，请分批同步。')
    let input: Record<string, unknown>
    try { input = object(JSON.parse(rawBody)) } catch { throw new RequestError(400, '提交内容不是有效的 JSON 对象。') }
    if (Object.keys(input).some((key) => key !== 'events' && key !== 'import') || ('events' in input) === ('import' in input)) throw new RequestError(400, '每次请提交练习记录或一份历史快照。')
    if ('events' in input) {
      if (!Array.isArray(input.events) || !input.events.length || input.events.length > MAX_BATCH) throw new RequestError(422, '每批需提交 1–100 条记录。')
      const events = input.events.map(normalizeEvent)
      await rpc('qalam_append_learning', { p_user: userId, p_events: events })
    } else {
      const imported = normalizeImport(input.import)
      await rpc('qalam_import_learning', { p_user: userId, p_import: imported })
    }
    return json({ ok: true })
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message, code: error.code, ...(error.eventId ? { eventId: error.eventId } : {}) }, error.status)
    return json({ error: '云端连接暂时失败，请稍后重试；待同步记录仍保留。', code: 'cloud_unavailable' }, 503)
  }
}
