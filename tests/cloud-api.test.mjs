import assert from 'node:assert/strict'
import { handleLearning, normalizeEvent, normalizeImport } from '../server/learning.ts'
import { EXERCISES } from '../shared/catalog.ts'

const userId = '20000000-0000-4000-8000-000000000001'
const id = '10000000-0000-4000-8000-000000000001'
const roundId = '30000000-0000-4000-8000-000000000001'
const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SECRET_KEY: 'sb_secret_server-only', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_browser' }
const calls = []
const page = { changes: [{ seq: 901, event: { id, at: 100, type: 'history-clear', payload: {} } }], nextCursor: 901, hasMore: true }
const fetcher = async (input, init = {}) => {
  const url = String(input)
  calls.push({ url, ...init, parsedBody: init.body ? JSON.parse(init.body) : undefined })
  if (url.endsWith('/auth/v1/user')) return Response.json({ id: userId })
  if (url.endsWith('/qalam_pull_learning')) return Response.json(page)
  return Response.json(1)
}
const deps = { env, fetch: fetcher }
const request = (body, options = {}) => new Request('https://qalam.example/api/learning', {
  method: 'POST', headers: { authorization: 'Bearer real-user-jwt', 'content-type': 'application/json', ...options.headers },
  body: JSON.stringify(body),
})
const attemptExercise = EXERCISES.find((exercise) => exercise.kind === 'typing')
const attempt = {
  id, type: 'attempt', at: 100,
  payload: { exerciseId: attemptExercise.id, contentVersion: attemptExercise.version, roundId, answer: 'wrong', mode: 'typing', assisted: false, hadError: false, durationMs: 100 },
  result: { correct: true, source: 'server_checked' },
}
const snapshot = {
  sessions: [], lessonScores: { 'l1-hadha': 80 }, independentScores: {}, book: {}, tajweed: {}, settings: {}, learningGoal: { id: 'daily' },
}

assert.equal((await handleLearning(request({ events: [attempt] }), { env: {}, fetch: () => { throw new Error('Must not call network') } })).status, 503)
assert.equal((await handleLearning(request({ events: [attempt] }, { headers: { authorization: '' } }), deps)).status, 401)
assert.equal(calls.length, 0)
let result = await handleLearning(request({ events: [attempt] }), { env, fetch: async () => Response.json({}, { status: 401 }) })
assert.equal(result.status, 401)
result = await handleLearning(request({ events: [attempt] }), { env, fetch: async () => Response.json({}, { status: 500 }) })
assert.equal(result.status, 503)

result = await handleLearning(request({ events: [attempt] }), deps)
assert.equal(result.status, 200)
assert.deepEqual(await result.json(), { ok: true })
let rpc = calls.at(-1)
assert.equal(rpc.parsedBody.p_user, userId, 'Identity comes from the verified Auth response')
assert.deepEqual(rpc.parsedBody.p_events[0].result, { correct: false, source: 'server_checked' }, 'Client cannot forge canonical correctness')
assert.equal(rpc.headers.apikey, env.SUPABASE_SECRET_KEY)
assert.equal(rpc.headers.authorization, undefined, 'sb_secret is an API key, not a JWT bearer token')
assert.equal(calls[0].headers.authorization, 'Bearer real-user-jwt')
assert.equal(calls[0].headers.apikey, env.VITE_SUPABASE_PUBLISHABLE_KEY)

const summary = normalizeEvent({ id, at: 100, type: 'session', payload: { at: 100, title: '练习', words: 1, seconds: 2, accuracy: 100, wpm: 30, kind: 'typing', source: 'server_checked' }, result: { correct: true, source: 'server_checked' } })
assert.equal(summary.payload.source, 'client_reported', 'Summary statistics are not promoted to server-verified skill evidence')
assert.equal(summary.result, undefined)
assert.equal(normalizeImport({ id, snapshot }).snapshot.lessonScores['l1-hadha'], 80)
assert.equal(normalizeImport({ id, snapshot: { ...snapshot, learningGoal: { id: 'reading' } } }).snapshot.learningGoal.id, 'tajweed')

const invalidEvents = [
  { ...attempt, type: 'unknown' },
  { ...attempt, payload: { ...attempt.payload, durationMs: -1 } },
  { ...attempt, payload: { ...attempt.payload, assisted: 'false' } },
  { ...attempt, payload: { ...attempt.payload, answer: {} } },
  { ...attempt, payload: { ...attempt.payload, roundId: 'not-a-uuid' } },
  { ...attempt, payload: { ...attempt.payload, mode: 'tajweed' } },
  { id, at: 100, type: 'preference', payload: { key: 'SUPABASE_SECRET_KEY', value: {} } },
]
for (const invalid of invalidEvents) {
  const countBefore = calls.length
  const response = await handleLearning(request({ events: [invalid] }), deps)
  assert.equal(response.status, 422)
  assert.equal(calls.length, countBefore + 1, 'Invalid data must not reach database RPC')
}
result = await handleLearning(request({ events: [{ ...attempt, payload: { ...attempt.payload, contentVersion: 'not-supported' } }] }), deps)
assert.equal(result.status, 409)
assert.deepEqual(await result.json(), { error: '本条练习的内容版本暂不可用，请保留待同步记录并更新或重试。', code: 'content_unavailable', eventId: id })

assert.equal((await handleLearning(request({ events: [] }), deps)).status, 422)
assert.equal((await handleLearning(request({ events: Array(101).fill(attempt) }), deps)).status, 422)
assert.equal((await handleLearning(request({ events: [attempt], import: { id, snapshot } }), deps)).status, 400)
assert.equal((await handleLearning(request({ events: [attempt], userId: 'attacker-selected-user' }), deps)).status, 400)
assert.equal((await handleLearning(request({ import: { id, snapshot: { ...snapshot, sessions: Array(501).fill({}) } } }), deps)).status, 422)
assert.equal((await handleLearning(request({ events: [attempt] }, { headers: { 'content-type': 'text/plain' } }), deps)).status, 415)
assert.equal((await handleLearning(request({ events: [attempt] }, { headers: { 'content-length': '1048577' } }), deps)).status, 413)
result = await handleLearning(new Request('https://qalam.example/api/learning', { method: 'POST', headers: { authorization: 'Bearer user', 'content-type': 'application/json' }, body: '{' }), deps)
assert.equal(result.status, 400)

result = await handleLearning(request({ import: { id, snapshot } }), deps)
assert.equal(result.status, 200)
rpc = calls.at(-1)
assert.equal(rpc.parsedBody.p_user, userId)
assert.equal(rpc.parsedBody.p_import.id, id)
assert.deepEqual(rpc.parsedBody.p_import.snapshot, snapshot)
assert.ok(!('events' in rpc.parsedBody), 'Legacy import remains a snapshot, without inventing historical attempts')

result = await handleLearning(new Request('https://qalam.example/api/learning?cursor=900', { headers: { authorization: 'Bearer real-user-jwt' } }), deps)
assert.equal(result.status, 200)
assert.deepEqual(await result.json(), page)
assert.deepEqual(calls.at(-1).parsedBody, { p_user: userId, p_after: 900, p_limit: 200 })
assert.equal(result.headers.get('cache-control'), 'private, no-store')
for (const cursor of ['-1', 'abc', '1.2', '9007199254740992']) {
  assert.ok((await handleLearning(new Request(`https://qalam.example/api/learning?cursor=${cursor}`, { headers: { authorization: 'Bearer user' } }), deps)).status >= 400)
}
result = await handleLearning(new Request('https://qalam.example/api/learning', { method: 'DELETE' }), deps)
assert.equal(result.status, 405)
assert.equal(result.headers.get('allow'), 'GET, POST')
result = await handleLearning(request({ events: [attempt] }), { env, fetch: async () => { throw new Error('private-provider-error-with-secret') } })
assert.equal(result.status, 503)
assert.ok(!(await result.text()).includes('private-provider-error-with-secret'))
console.log('Cloud API checks passed: verified identity, canonical grading, validation, scoped pagination, and safe legacy import.')
