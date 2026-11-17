/** Versioned transport contract shared by the browser and Vercel API. */
export const CLOUD_PROTOCOL = 1
export const CONTENT_VERSION = '2026-11-16.1'
export interface PracticeSummary {
  at: number; title: string; words: number; seconds: number; accuracy: number; wpm: number
  kind?: 'typing' | 'sentence'; assisted?: boolean; lessonId?: string; skipped?: number
  roundId?: string
  source?: 'legacy_import' | 'client_reported'
}
export interface AttemptPayload {
  exerciseId: string
  contentVersion: string
  roundId: string
  mode: 'typing' | 'sentence-build' | 'sentence-type' | 'tajweed'
  answer: string | number
  assisted: boolean
  hadError: boolean
  durationMs: number
  skipped?: boolean
}
export interface WordEntry { ar: string; tr: string; zh: string }
export interface LegacySnapshot {
  sessions: PracticeSummary[]
  lessonScores: Record<string, number>
  independentScores: Record<string, number>
  book: Record<string, WordEntry & { count: number; last: number }>
  tajweed: Record<string, { score: number; at: number }>
  settings: Record<string, boolean>
  learningGoal: { id: string }
}
export type CloudEvent = {
  id: string
  at: number
  type: 'attempt' | 'session' | 'mistake' | 'mistake-remove' | 'mistakes-clear' | 'history-clear' | 'preference' | 'tajweed-check'
  payload: Record<string, unknown>
  /** Set by the API for attempts; session summaries remain client-reported. */
  result?: { correct: boolean; source: 'server_checked' }
}
export interface LegacyImport { id: string; snapshot: LegacySnapshot }
export interface CloudChange {
  seq: number
  event?: CloudEvent
  import?: LegacyImport
}
export interface SyncPage { changes: CloudChange[]; nextCursor: number; hasMore: boolean }
export interface SyncRequest { events?: CloudEvent[]; import?: LegacyImport }
