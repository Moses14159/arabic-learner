/** Accuracy includes unfinished words; skipping the whole list is never 100%. */
export function sessionMetrics(start: number, end: number, words: number, correct: number, attempts: number, completion = 1) {
  const seconds = start > 0 ? Math.max(1, Math.round((end - start) / 1000)) : 0
  const accuracy = attempts > 0 ? Math.round((correct / attempts) * Math.max(0, Math.min(1, completion)) * 100) : 0
  return { seconds, accuracy, wpm: seconds > 0 ? Math.round((words / seconds) * 600) / 10 : 0 }
}
