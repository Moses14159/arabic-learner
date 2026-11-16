import assert from 'node:assert/strict'
import { sessionMetrics } from '../src/lib/session.ts'

// No input, including an entirely skipped round, must not become 100% or 56 years.
assert.deepEqual(sessionMetrics(0, Date.now(), 0, 0, 0, 0), { seconds: 0, accuracy: 0, wpm: 0 })
assert.deepEqual(sessionMetrics(1_000, 61_000, 12, 24, 30), { seconds: 60, accuracy: 80, wpm: 12 })
// Correctly copying half a list and skipping the rest cannot earn a perfect score.
assert.equal(sessionMetrics(1_000, 61_000, 5, 20, 20, 0.5).accuracy, 50)
// Sentence accuracy counts each completed sentence once, independent of its length.
assert.equal(sessionMetrics(1_000, 91_000, 17, 2, 3).accuracy, 67)
console.log('Session metrics regression checks passed.')
