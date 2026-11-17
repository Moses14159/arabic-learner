import type { CloudChange, CloudEvent, LegacySnapshot, PracticeSummary } from '../../shared/cloud.ts'

export const LEARNING_KEYS = ['qalam.sessions', 'qalam.lessons', 'qalam.independent-lessons.v1', 'qalam.mistakes', 'qalam.tajweed-checks.v1', 'qalam.settings', 'qalam.learning-goal'] as const
export type LearningKey = typeof LEARNING_KEYS[number]
export interface LearningState {
  sessions: (PracticeSummary & { id?: string; source?: string })[]
  lessonScores: Record<string, number>
  independentScores: Record<string, number>
  book: LegacySnapshot['book']
  tajweed: LegacySnapshot['tajweed']
  settings: Record<string, boolean>
  learningGoal: { id: string }
}
const maxScores = (target: Record<string, number>, source: Record<string, number>) => {
  for (const [key, score] of Object.entries(source)) if (Number.isFinite(score)) target[key] = Math.max(target[key] ?? 0, score)
}

/** A projection can always be rebuilt. Imported summaries never create fictitious attempts. */
export function projectLearning(changes: CloudChange[], pending: CloudEvent[] = []): LearningState {
  const state: LearningState = { sessions: [], lessonScores: {}, independentScores: {}, book: {}, tajweed: {}, settings: {}, learningGoal: { id: 'daily' } }
  const seenEvents = new Set<string>()
  const seenImports = new Set<string>()
  const seenRounds = new Set<string>()
  const addSession = (session: PracticeSummary, id: string, source: 'legacy_import' | 'client_reported') => {
    const key = session.roundId ?? id
    if (seenRounds.has(key)) return
    seenRounds.add(key)
    state.sessions.push({ ...session, id, source })
    if (session.lessonId && session.kind === 'sentence') {
      maxScores(state.lessonScores, { [session.lessonId]: session.accuracy })
      if (source !== 'legacy_import' && !session.assisted) maxScores(state.independentScores, { [session.lessonId]: session.accuracy })
    }
  }
  const applyEvent = (event: CloudEvent) => {
    if (seenEvents.has(event.id)) return
    seenEvents.add(event.id)
    const payload = event.payload
    switch (event.type) {
      case 'session': addSession(payload as unknown as PracticeSummary, event.id, 'client_reported'); break
      case 'history-clear': state.sessions = []; break
      case 'mistake': {
        const word = payload.word as { ar: string; tr: string; zh: string }
        const prior = state.book[word.ar]
        state.book[word.ar] = { ...word, count: (prior?.count ?? 0) + 1, last: event.at }
        break
      }
      case 'mistake-remove': delete state.book[payload.ar as string]; break
      case 'mistakes-clear': state.book = {}; break
      case 'preference':
        if (payload.key === 'qalam.settings') Object.assign(state.settings, payload.value)
        if (payload.key === 'qalam.learning-goal') state.learningGoal = payload.value as { id: string }
        break
      case 'tajweed-check': state.tajweed[payload.lessonId as string] = { score: payload.score as number, at: payload.at as number }; break
      // Canonical question attempts are retained in the journal, never counted as typing words.
      case 'attempt': break
    }
  }
  const ordered = [...changes].sort((a, b) => a.seq - b.seq)
  // Imports are historical baselines. A late import must not undo a newer live removal or preference.
  for (const change of ordered) {
    if (change.import && !seenImports.has(change.import.id)) {
      seenImports.add(change.import.id)
      const snapshot = change.import.snapshot
      snapshot.sessions.forEach((session, i) => addSession(session, `legacy:${change.import!.id}:${i}`, 'legacy_import'))
      maxScores(state.lessonScores, snapshot.lessonScores)
      maxScores(state.lessonScores, snapshot.independentScores)
      for (const [ar, word] of Object.entries(snapshot.book)) {
        const prior = state.book[ar]
        // Separate snapshots may contain the same old cumulative counter. Do not sum them.
        state.book[ar] = { ...word, count: Math.max(prior?.count ?? 0, word.count), last: Math.max(prior?.last ?? 0, word.last) }
      }
      for (const [id, result] of Object.entries(snapshot.tajweed)) if (!state.tajweed[id] || result.at > state.tajweed[id].at) state.tajweed[id] = result
      Object.assign(state.settings, snapshot.settings)
      state.learningGoal = snapshot.learningGoal
    }
  }
  for (const change of ordered) if (change.event) applyEvent(change.event)
  pending.forEach(applyEvent)
  state.sessions.sort((a, b) => a.at - b.at)
  return state
}

export function projectionValues(state: LearningState): Record<LearningKey, unknown> {
  return {
    'qalam.sessions': state.sessions,
    'qalam.lessons': state.lessonScores,
    'qalam.independent-lessons.v1': state.independentScores,
    'qalam.mistakes': state.book,
    'qalam.tajweed-checks.v1': state.tajweed,
    'qalam.settings': state.settings,
    'qalam.learning-goal': state.learningGoal,
  }
}

export function storageEvents(key: string, previous: unknown, next: unknown, uuid: () => string, now = Date.now()): CloudEvent[] {
  const events: CloudEvent[] = []
  const add = (type: CloudEvent['type'], payload: Record<string, unknown>) => events.push({ id: uuid(), at: now, type, payload })
  if (key === 'qalam.sessions') {
    const before = previous as PracticeSummary[]
    const after = next as PracticeSummary[]
    if (!after.length && before.length) add('history-clear', {})
    else {
      const known = new Set(before.map((session) => JSON.stringify(session)))
      for (const session of after) if (!known.has(JSON.stringify(session))) add('session', { ...session })
    }
  } else if (key === 'qalam.mistakes') {
    const before = previous as LegacySnapshot['book']
    const after = next as LegacySnapshot['book']
    if (!Object.keys(after).length && Object.keys(before).length) add('mistakes-clear', {})
    else {
      for (const ar of Object.keys(before)) if (!after[ar]) add('mistake-remove', { ar })
      for (const [ar, word] of Object.entries(after)) {
        const count = Math.max(0, word.count - (before[ar]?.count ?? 0))
        for (let i = 0; i < count; i++) add('mistake', { word: { ar, tr: word.tr, zh: word.zh } })
      }
    }
  } else if (key === 'qalam.tajweed-checks.v1') {
    const before = previous as LegacySnapshot['tajweed']
    for (const [lessonId, value] of Object.entries(next as LegacySnapshot['tajweed'])) {
      if (JSON.stringify(before[lessonId]) !== JSON.stringify(value)) add('tajweed-check', { lessonId, ...value })
    }
  } else if (key === 'qalam.settings' || key === 'qalam.learning-goal') {
    // Settings are field patches so changes on one device do not reset another device's options.
    const before = previous as Record<string, unknown>
    const value = Object.fromEntries(Object.entries(next as Record<string, unknown>).filter(([name, item]) => before[name] !== item))
    if (Object.keys(value).length) add('preference', { key, value })
  }
  return events
}

export function mergeChanges(existing: CloudChange[], incoming: CloudChange[], pending: CloudEvent[]) {
  const changes = [...new Map([...existing, ...incoming].map((change) => [change.seq, change])).values()].sort((a, b) => a.seq - b.seq)
  const delivered = new Set(changes.flatMap((change) => change.event ? [change.event.id] : []))
  return { changes, pending: pending.filter((event) => !delivered.has(event.id)) }
}

export function scopedKey(scope: string | null, key: string) {
  return scope ? `qalam.account.${scope}:${key}` : key
}
