import { COURSE_LESSONS } from './grammar.ts'

// The introductory root lesson is an optional bridge after concrete everyday phrases.
const groups = [
  { title: '从第一声问候开始', summary: '认字、拼读，再介绍你自己。', ids: ['l0-script', 'l0-hello', 'l1-hadha'] },
  { title: '描述身边的人与物', summary: '说清楚是什么、在哪里、属于谁。', ids: ['l2-nominal', 'l3-prep', 'l4-idafa', 'l5-pronouns'] },
  { title: '让句子动起来', summary: '认识词根，表达动作，再回到日常对话。', ids: ['l0-lego', 'l6-past-verb', 'l7-present-neg', 'l8-dialogues'] },
  { title: '表达得更丰富', summary: '逐步加入数量、比较与简单指令。', ids: COURSE_LESSONS.filter((l) => l.stage === 5 && l.id !== 'l8-dialogues').map((l) => l.id) },
  { title: '进阶语法 · 按需选学', summary: '从句与词法专题；完成入门后再慢慢探索。', ids: COURSE_LESSONS.filter((l) => l.stage >= 6).map((l) => l.id) },
]

export const LEARNING_STAGES = groups.map((group, index) => ({
  ...group,
  index,
  lessons: group.ids.map((id) => COURSE_LESSONS.find((lesson) => lesson.id === id)!),
}))
export const LEARNING_PATH = LEARNING_STAGES.flatMap((stage) => stage.lessons)
export const shortLessonTitle = (title: string) => title.split('（')[0].replace('文字与拼读入门：连写变形与动符', '认识字母，读出第一个词').replace('构词法导论：三母词根', '发现词语之间的联系')

export const LEARNING_GOALS = [
  { id: 'daily', title: '日常交流入门', subtitle: '从问候到简单表达', description: '先练常用表达，再理解语法。当前以现代标准阿语为主，地区方言会话需另行补充。', firstIds: ['l0-script', 'l0-hello', 'l1-hadha'] },
  { id: 'tajweed', title: 'Tajweed 入门', subtitle: '字音、鼻音与诵读规则', description: '专注 Tajweed 诵读规则，不含经典精读、释义或注释。先理解规则，再配合可靠示范与教师纠音。', firstIds: ['l0-script'] },
  { id: 'grammar', title: '系统语法巩固', subtitle: '理解结构，查漏补缺', description: '适合已有拼读基础的学习者，从名词句逐步进入词法与复杂句法。可以直接选学需要巩固的专题。', firstIds: ['l1-hadha', 'l2-nominal', 'l3-prep', 'l4-idafa', 'l5-pronouns', 'l0-lego', 'l6-past-verb', 'l7-present-neg'] },
] as const

export function pathForGoal(goalId: string) {
  const goal = LEARNING_GOALS.find((item) => item.id === goalId) ?? LEARNING_GOALS[0]
  const orderedIds = [...new Set([...goal.firstIds, ...LEARNING_PATH.map((lesson) => lesson.id)])]
  return orderedIds.map((id) => LEARNING_PATH.find((lesson) => lesson.id === id)!)
}
