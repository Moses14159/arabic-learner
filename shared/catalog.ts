import { COURSE_LESSONS } from '../src/data/grammar.ts'
import { CHAPTERS } from '../src/data/words.ts'
import { ROOT_FAMILIES, VERB_PARADIGMS, WAZN_TEMPLATES } from '../src/data/roots.ts'
import { BROKEN_PLURAL_PATTERNS, DECLENSION_NOUNS, TEN_VERB_FORMS } from '../src/data/morphology.ts'
import { TAJWEED_LESSONS } from '../src/data/tajweed.ts'
import { CONTENT_VERSION } from './cloud.ts'
import type { AttemptPayload, WordEntry } from './cloud.ts'

export interface Exercise {
  id: string
  version: string
  kind: 'typing' | 'sentence' | 'tajweed'
  answer: string | number
  lessonId?: string
  optionsCount?: number
}

/** Content-derived IDs survive reordering; changing a prompt creates a new item. */
function contentId(kind: string, content: string) {
  let hash = 0xcbf29ce484222325n
  for (const char of content.normalize('NFC')) {
    hash ^= BigInt(char.codePointAt(0)!)
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  return `${kind}:${hash.toString(16).padStart(16, '0')}`
}

const catalog = new Map<string, Exercise>()
const identities = new Map<string, string>()
function add(kind: Exercise['kind'], identity: string, answer: string | number, lessonId?: string, optionsCount?: number) {
  const id = contentId(kind, identity)
  const existing = identities.get(id)
  if (existing !== undefined && existing !== identity) throw new Error(`Exercise ID collision: ${id}`)
  if (catalog.has(id)) return catalog.get(id)!
  const exercise: Exercise = { id, version: CONTENT_VERSION, kind, answer, ...(lessonId ? { lessonId } : {}), ...(optionsCount ? { optionsCount } : {}) }
  catalog.set(id, exercise)
  identities.set(id, identity)
  return exercise
}

const addWord = (word: { ar: string }) => add('typing', word.ar.normalize('NFC'), word.ar)
for (const chapter of CHAPTERS) for (const word of chapter.words) addWord(word)
for (const lesson of COURSE_LESSONS) {
  for (const word of lesson.vocab) addWord(word)
  for (const sentence of lesson.sentences) add('sentence', sentence.ar.normalize('NFC'), sentence.ar, lesson.id)
}
for (const root of ROOT_FAMILIES) for (const word of root.words) addWord(word)
for (const verb of VERB_PARADIGMS) for (const row of verb.rows) {
  addWord({ ar: row.pastAr })
  addWord({ ar: row.presentAr })
}
for (const template of WAZN_TEMPLATES) addWord({ ar: template.example.split(' ')[0] })
for (const noun of DECLENSION_NOUNS) for (const gender of [noun.masculine, noun.feminine]) {
  for (const state of [gender.indef, gender.def]) for (const group of state) {
    for (const cell of [group.nom, group.acc, group.gen]) addWord(cell)
  }
}
for (const pattern of BROKEN_PLURAL_PATTERNS) for (const pair of pattern.pairs) addWord({ ar: pair.plurAr })
for (const form of TEN_VERB_FORMS) addWord({ ar: form.example.pastAr })
for (const lesson of TAJWEED_LESSONS) for (const question of lesson.quiz) {
  add('tajweed', `${lesson.id}:${question.question.normalize('NFC')}`, question.correctIndex, lesson.id, question.options.length)
}

export const EXERCISES: readonly Exercise[] = [...catalog.values()]

export function getExercise(id: string, version: string) {
  if (version !== CONTENT_VERSION) return undefined
  return catalog.get(id)
}

export function getWordExercise(word: Pick<WordEntry, 'ar'>) {
  return catalog.get(contentId('typing', word.ar.normalize('NFC')))
}

export function getSentenceExercise(sentence: { ar: string }) {
  return catalog.get(contentId('sentence', sentence.ar.normalize('NFC')))
}

export function getTajweedExercise(lessonId: string, question: number | { question: string }) {
  const prompt = typeof question === 'number'
    ? TAJWEED_LESSONS.find((lesson) => lesson.id === lessonId)?.quiz[question]?.question
    : question.question
  return prompt ? catalog.get(contentId('tajweed', `${lessonId}:${prompt.normalize('NFC')}`)) : undefined
}

// Optional vowel marks match the default typing mode; hamza and letter identity remain significant.
const normalizedLetters = (answer: string) => answer.normalize('NFC').replace(/[\u064B-\u0652\u0670\u0640\u200C\u200D]/g, '').trim().replace(/\s+/g, ' ')

export function gradeAttempt(attempt: AttemptPayload): { correct: boolean; source: 'server_checked' } {
  if (!['typing', 'sentence-build', 'sentence-type', 'tajweed'].includes(attempt.mode)) throw new Error('Invalid exercise mode')
  const exercise = getExercise(attempt.exerciseId, attempt.contentVersion)
  if (!exercise) throw new Error('Unknown exercise or content version')
  const kind = attempt.mode === 'sentence-build' || attempt.mode === 'sentence-type' ? 'sentence' : attempt.mode
  if (kind !== exercise.kind) throw new Error('Exercise mode mismatch')
  if (typeof attempt.answer !== typeof exercise.answer) throw new Error('Invalid answer type')
  if (exercise.kind === 'tajweed' && (!Number.isInteger(attempt.answer) || Number(attempt.answer) < 0 || Number(attempt.answer) >= exercise.optionsCount!)) {
    throw new Error('Invalid choice')
  }
  const matches = typeof exercise.answer === 'number'
    ? attempt.answer === exercise.answer
    : normalizedLetters(attempt.answer as string) === normalizedLetters(exercise.answer)
  return { correct: !attempt.skipped && matches, source: 'server_checked' }
}
