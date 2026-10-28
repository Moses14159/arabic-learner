import type { Joining } from '../data/letters'

const MARKS = new Set(['\u064B', '\u064C', '\u064D', '\u064E', '\u064F', '\u0650', '\u0651', '\u0652', '\u0670'])
export const isMark = (c: string) => MARKS.has(c)

const RIGHT_JOINING = new Set([...'اأإآدذرزوؤة'])
const NON_JOINING = new Set([...'ء '])
const ZWJ = '\u200D'

export const joinsNext = (b: string) => !RIGHT_JOINING.has(b) && !NON_JOINING.has(b)
export const joinsPrev = (b: string) => !NON_JOINING.has(b)

export interface Cluster {
  base: string
  marks: string[]
  text: string
}

/** Split a word into clusters of one base letter + its diacritics. */
export function toClusters(word: string): Cluster[] {
  const out: Cluster[] = []
  for (const c of word) {
    const last = out[out.length - 1]
    if (isMark(c) && last) {
      last.marks.push(c)
      last.text += c
    } else {
      out.push({ base: c, marks: [], text: c })
    }
  }
  return out
}

export const stripMarks = (s: string) => [...s].filter((c) => !isMark(c)).join('')

/**
 * Text for cluster i, padded with zero-width joiners so letters keep their
 * connected shape even when every cluster lives in its own <span>.
 */
export function clusterText(clusters: Cluster[], i: number, showMarks: boolean): string {
  const c = clusters[i]
  let t = showMarks ? c.text : c.base
  const prev = clusters[i - 1]
  const next = clusters[i + 1]
  if (prev && joinsNext(prev.base) && joinsPrev(c.base)) t = ZWJ + t
  if (next && joinsNext(c.base) && joinsPrev(next.base)) t = t + ZWJ
  return t
}

export type Form = 'isolated' | 'initial' | 'medial' | 'final'
export const FORM_LABEL: Record<Form, string> = { isolated: '独立', initial: '词首', medial: '词中', final: '词尾' }

export function letterForm(char: string, form: Form): string {
  switch (form) {
    case 'isolated':
      return char
    case 'initial':
      return char + ZWJ
    case 'medial':
      return ZWJ + char + ZWJ
    case 'final':
      return ZWJ + char
  }
}

export function formsFor(joining: Joining): Form[] {
  if (joining === 'dual') return ['isolated', 'initial', 'medial', 'final']
  if (joining === 'right') return ['isolated', 'final']
  return ['isolated']
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
