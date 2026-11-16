import assert from 'node:assert/strict'
import { TAJWEED_LESSONS, TAJWEED_SCOPE, TAJWEED_SOURCES } from '../src/data/tajweed.ts'
assert.match(TAJWEED_SCOPE, /哈夫斯|Ḥafṣ|Hafs/i)
assert.equal(new Set(TAJWEED_LESSONS.map((lesson) => lesson.id)).size, TAJWEED_LESSONS.length)
const positions = new Set()
for (const lesson of TAJWEED_LESSONS) {
  assert.ok(lesson.title && lesson.summary && lesson.rules.length, `Missing teaching content: ${lesson.id}`)
  assert.ok(lesson.quiz.length >= 2, `Insufficient rule checks: ${lesson.id}`)
  for (const question of lesson.quiz) {
    assert.ok(question.question && question.explanation)
    assert.ok(Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < question.options.length)
    assert.equal(new Set(question.options).size, question.options.length)
    positions.add(question.correctIndex)
  }
}
assert.ok(positions.size > 1, 'Correct answer must not always occupy one position')
assert.ok(TAJWEED_SOURCES.length)
for (const source of TAJWEED_SOURCES) assert.equal(new URL(source.url).protocol, 'https:')
console.log(`Tajweed content checks passed: ${TAJWEED_LESSONS.length} units, ${TAJWEED_LESSONS.reduce((sum, lesson) => sum + lesson.quiz.length, 0)} rule questions.`)
