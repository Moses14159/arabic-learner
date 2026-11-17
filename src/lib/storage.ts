import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Word } from '../data/words'
import { getScope, readStored, subscribeStore, writeStored } from './cloud-store'

function usePersistent<T>(key: string, fallback: T, list: boolean) {
  const scope = getScope()
  const [initial] = useState<T>(() => fallback)
  const raw = useSyncExternalStore(subscribeStore, () => readStored(scope, key), () => null)
  const parse = useCallback((value: string | null): T => {
    try {
      const parsed: unknown = value ? JSON.parse(value) : null
      if (list) return (Array.isArray(parsed) ? parsed : initial) as T
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return { ...initial, ...parsed }
      return initial
    } catch { return initial }
  }, [initial, list])
  const value = useMemo(() => parse(raw), [parse, raw])
  const setValue: Dispatch<SetStateAction<T>> = useCallback((update) => {
    const previous = parse(readStored(scope, key))
    const next = typeof update === 'function' ? (update as (previous: T) => T)(previous) : update
    writeStored(scope, key, previous, next)
  }, [key, parse, scope])
  return [value, setValue] as const
}

export function useStored<T>(key: string, fallback: T) { return usePersistent(key, fallback, false) }
export function useStoredList<T>(key: string) { return usePersistent<T[]>(key, [], true) }

export interface Settings {
  showMarks: boolean
  requireMarks: boolean
  showTranslit: boolean
  dictation: boolean
  autoSpeak: boolean
  showKeyboard: boolean
  sound: boolean
  shuffle: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  showMarks: true,
  requireMarks: false,
  showTranslit: true,
  dictation: false,
  autoSpeak: true,
  showKeyboard: true,
  sound: true,
  shuffle: false,
}

export interface MistakeEntry extends Word {
  count: number
  last: number
}
export type MistakeBook = Record<string, MistakeEntry>

export interface SessionRecord {
  roundId?: string
  source?: 'legacy_import' | 'client_reported'
  at: number
  title: string
  words: number
  seconds: number
  accuracy: number
  wpm: number
  kind?: 'typing' | 'sentence'
  assisted?: boolean
  lessonId?: string
  skipped?: number
}
