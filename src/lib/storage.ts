import { useEffect, useState } from 'react'
import type { Word } from '../data/words'

export function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
    } catch {
      return fallback
    }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue] as const
}

/** Same as useStored but for arrays (no object-spread merge). */
export function useStoredList<T>(key: string) {
  const [value, setValue] = useState<T[]>(() => {
    try {
      const raw = localStorage.getItem(key)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue] as const
}

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
