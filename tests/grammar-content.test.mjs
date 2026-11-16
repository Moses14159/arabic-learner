import assert from 'node:assert/strict'
import { COURSE_LESSONS, caseTypeForToken } from '../src/data/grammar.ts'

const tokens = COURSE_LESSONS.flatMap((lesson) => lesson.sentences.flatMap((sentence) => sentence.tokens))
for (const ar of ['كِتَابُ', 'أَبْوَابُ']) {
  const token = tokens.find((item) => item.ar === ar && item.role.includes('主格'))
  assert.ok(token, `Missing regression example: ${ar}`)
  assert.equal(caseTypeForToken(token), 'nom', `${ar}: explanation must not override the token's own case`)
}

for (const lesson of COURSE_LESSONS) {
  for (const sentence of lesson.sentences) {
    assert.equal(sentence.tokens.map((token) => token.ar).join(' '), sentence.ar, `${lesson.id}: tiles must preserve sentence spacing`)
    for (const token of sentence.tokens) {
      const expected = token.role.includes('主格') ? 'nom' : token.role.includes('宾格') ? 'acc' : token.role.includes('属格') ? 'gen' : null
      if (expected) assert.equal(caseTypeForToken(token), expected, `${lesson.id}: ${token.ar}`)
    }
  }
}

console.log('Grammar content checks passed: token spacing and explicit case labels.')
