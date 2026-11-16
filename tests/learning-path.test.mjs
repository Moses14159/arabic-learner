import assert from 'node:assert/strict'
import { COURSE_LESSONS } from '../src/data/grammar.ts'
import { LEARNING_GOALS, LEARNING_PATH, pathForGoal } from '../src/data/learningPath.ts'
const expectedIds = new Set(COURSE_LESSONS.map((lesson) => lesson.id))
assert.equal(LEARNING_PATH.length, expectedIds.size)
for (const goal of LEARNING_GOALS) {
  const path = pathForGoal(goal.id)
  assert.deepEqual(new Set(path.map((lesson) => lesson.id)), expectedIds)
  assert.equal(path.length, expectedIds.size)
  assert.deepEqual(path.slice(0, goal.firstIds.length).map((lesson) => lesson.id), [...goal.firstIds])
}
assert.deepEqual(pathForGoal('unknown'), pathForGoal('daily'))
console.log('Learning paths contain every lesson once, with goal-specific starting order.')
