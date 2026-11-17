import { handleLearning } from '../server/learning.ts'

export default { fetch: (request: Request) => handleLearning(request) }
