import assert from 'node:assert/strict'
import { EXERCISES, getExercise, getWordExercise, getSentenceExercise, getTajweedExercise, gradeAttempt } from '../shared/catalog.ts'
import { CONTENT_VERSION } from '../shared/cloud.ts'
import { CHAPTERS } from '../src/data/words.ts'
import { COURSE_LESSONS } from '../src/data/grammar.ts'
import { ROOT_FAMILIES, VERB_PARADIGMS, WAZN_TEMPLATES } from '../src/data/roots.ts'
import { DECLENSION_NOUNS, BROKEN_PLURAL_PATTERNS, TEN_VERB_FORMS } from '../src/data/morphology.ts'
import { TAJWEED_LESSONS } from '../src/data/tajweed.ts'

assert.equal(new Set(EXERCISES.map((exercise) => exercise.id)).size, EXERCISES.length)
const base = { contentVersion: CONTENT_VERSION, roundId: '12345678-1234-4234-8234-123456789abc', assisted: false, hadError: false, durationMs: 1200 }
const words = [
  ...CHAPTERS.flatMap((chapter) => chapter.words),
  ...COURSE_LESSONS.flatMap((lesson) => lesson.vocab),
  ...ROOT_FAMILIES.flatMap((root) => root.words),
  ...VERB_PARADIGMS.flatMap((verb) => verb.rows.flatMap((row) => [{ ar: row.pastAr }, { ar: row.presentAr }])),
  ...WAZN_TEMPLATES.map((template) => ({ ar: template.example.split(' ')[0] })),
  ...BROKEN_PLURAL_PATTERNS.flatMap((pattern) => pattern.pairs.map((pair) => ({ ar: pair.plurAr }))),
  ...TEN_VERB_FORMS.map((form) => ({ ar: form.example.pastAr })),
]
for (const noun of DECLENSION_NOUNS) for (const gender of [noun.masculine, noun.feminine]) {
  for (const state of [gender.indef, gender.def]) for (const group of state) words.push(group.nom, group.acc, group.gen)
}
for (const word of words) {
  const exercise = getWordExercise(word)
  assert.ok(exercise, `No server exercise for ${word.ar}`)
  assert.equal(gradeAttempt({ ...base, exerciseId: exercise.id, mode: 'typing', answer: word.ar }).correct, true)
}
for (const lesson of COURSE_LESSONS) for (const sentence of lesson.sentences) {
  const exercise = getSentenceExercise(sentence)
  assert.ok(exercise, `No server exercise for ${lesson.id}`)
  assert.equal(getSentenceExercise({ ar: sentence.ar }).id, exercise.id, 'ID must not depend on object identity or ordering')
  const attempt = { ...base, exerciseId: exercise.id, mode: 'sentence-build', answer: sentence.tokens.map((token) => token.ar).join(' ') }
  assert.equal(gradeAttempt(attempt).correct, true)
  assert.equal(gradeAttempt({ ...attempt, answer: 'جواب آخر' }).correct, false)
  assert.equal(gradeAttempt({ ...attempt, skipped: true }).correct, false)
  assert.throws(() => gradeAttempt({ ...attempt, mode: 'typing' }), /mode mismatch/)
}
for (const lesson of TAJWEED_LESSONS) for (const [index, question] of lesson.quiz.entries()) {
  const exercise = getTajweedExercise(lesson.id, question)
  assert.ok(exercise)
  assert.equal(getTajweedExercise(lesson.id, index).id, exercise.id)
  const attempt = { ...base, exerciseId: exercise.id, mode: 'tajweed', answer: question.correctIndex }
  assert.equal(gradeAttempt(attempt).correct, true)
  assert.equal(gradeAttempt({ ...attempt, answer: (question.correctIndex + 1) % question.options.length }).correct, false)
  assert.throws(() => gradeAttempt({ ...attempt, answer: question.options.length }), /Invalid choice/)
  assert.throws(() => gradeAttempt({ ...attempt, answer: String(question.correctIndex) }), /answer type/)
}
const wordExercise = getWordExercise({ ar: 'كَتَبَ' })
const attempt = { ...base, exerciseId: wordExercise.id, mode: 'typing', answer: 'كتب' }
assert.equal(gradeAttempt(attempt).correct, true, 'Default optional marks are accepted')
assert.equal(gradeAttempt({ ...attempt, skipped: true }).correct, false, 'A skipped item is never correct')
assert.equal(gradeAttempt({ ...attempt, answer: 'كذب' }).correct, false)
const hamza = getWordExercise({ ar: 'قَرَأَ' })
assert.equal(gradeAttempt({ ...attempt, exerciseId: hamza.id, answer: 'قرا' }).correct, false, 'Do not erase hamza distinctions')
assert.equal(getExercise(wordExercise.id, 'old-version'), undefined)
assert.throws(() => gradeAttempt({ ...attempt, contentVersion: 'old-version' }), /Unknown exercise/)
assert.throws(() => gradeAttempt({ ...attempt, exerciseId: 'made-up' }), /Unknown exercise/)
assert.throws(() => gradeAttempt({ ...attempt, mode: 'sentence' }), /Invalid exercise mode/)
console.log(`Cloud content checks passed: ${EXERCISES.length} versioned exercises; all current typing sources, sentences and Tajweed choices covered.`)
