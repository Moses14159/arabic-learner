import { useRef, useState } from 'react'
import { TAJWEED_LESSONS, TAJWEED_SCOPE, TAJWEED_SOURCES } from '../data/tajweed'
import { useStored } from '../lib/storage'
import { recordAttempt } from '../lib/cloud'
import { getTajweedExercise } from '../../shared/catalog'
import { IconArrowLeft, IconArrowRight, IconBook, IconCheck } from './Icons'

export function Tajweed({ onLetters }: { onLetters: () => void }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [saved, setSaved] = useState(false)
  const roundId = useRef('')
  const openedAt = useRef(0)
  const answered = useRef(new Set<number>())
  const [results, setResults] = useStored<Record<string, { score: number; at: number }>>('qalam.tajweed-checks.v1', {})
  const active = TAJWEED_LESSONS.find((lesson) => lesson.id === activeId)
  const reviewedCount = TAJWEED_LESSONS.filter((lesson) => results[lesson.id]).length
  const openLesson = (id: string | null) => {
    setActiveId(id)
    setAnswers({})
    setSaved(false)
    roundId.current = crypto.randomUUID()
    openedAt.current = Date.now()
    answered.current.clear()
  }

  const chooseAnswer = (index: number, optionIndex: number) => {
    if (!active || answered.current.has(index)) return
    answered.current.add(index)
    setAnswers((previous) => ({ ...previous, [index]: optionIndex }))
    const exercise = getTajweedExercise(active.id, active.quiz[index])
    if (!exercise) return
    recordAttempt({
      exerciseId: exercise.id,
      contentVersion: exercise.version,
      roundId: roundId.current,
      mode: 'tajweed',
      answer: optionIndex,
      assisted: false,
      hadError: optionIndex !== active.quiz[index].correctIndex,
      durationMs: Math.min(604_800_000, Math.max(0, Date.now() - openedAt.current)),
    })
  }

  if (active) {
    const complete = active.quiz.every((_, index) => answers[index] !== undefined)
    const right = active.quiz.filter((question, index) => answers[index] === question.correctIndex).length
    const next = TAJWEED_LESSONS[TAJWEED_LESSONS.indexOf(active) + 1]
    return <section className="tajweed lesson-view" aria-label="Tajweed 规则学习">
      <button className="btn btn--ghost btn--sm" onClick={() => openLesson(null)}><IconArrowLeft size={16} /> 返回 Tajweed 目录</button>
      <div className="lesson-hero glass"><div><span className="eyebrow">TAJWEED · 规则辨析</span><h2>{active.title}</h2><p className="muted">{active.summary}</p></div></div>
      <div className="grammar-points">
        {active.rules.map((rule) => <article className="grammar-point glass" key={rule.label}>
          <h3>{rule.label}</h3><p>{rule.explanation}</p>
          {rule.example && <div className="tajweed-example"><small className="muted">规则示意</small><p className="ar" lang="ar" dir="rtl">{rule.example}</p></div>}
          {rule.caution && <p className="tajweed-note">{rule.caution}</p>}
        </article>)}
      </div>
      <section className="study-card tajweed-quiz" aria-label="本课规则自测">
        <span className="eyebrow">CHECK YOUR UNDERSTANDING</span><h2>试着辨认规则</h2><p className="muted">先选一次，再看解释。这里记录规则理解，不评价实际诵读发音。</p>
        {active.quiz.map((question, index) => <fieldset key={question.question}>
          <legend>{index + 1}. {question.question}</legend>
          <div className="tajweed-options">
            {question.options.map((option, optionIndex) => <button key={option} className={'btn btn--ghost' + (answers[index] === optionIndex ? ' is-picked' : '')} disabled={answers[index] !== undefined} onClick={() => chooseAnswer(index, optionIndex)}>
              <span>{option}</span>{answers[index] !== undefined && optionIndex === question.correctIndex && <IconCheck size={17} />}
            </button>)}
          </div>
          {answers[index] !== undefined && <p role="status" className="tajweed-feedback"><b>{answers[index] === question.correctIndex ? '判断正确。' : `正确选项：${question.options[question.correctIndex]}。`}</b> {question.explanation}</p>}
        </fieldset>)}
        {complete && <div className="tajweed-result" aria-live="polite"><p>本次首次作答：{right} / {active.quiz.length} 题正确。实际发音还需要跟读与纠音。</p><div className="hero__actions"><button className="btn btn--gold" disabled={saved} onClick={() => {
          setResults((previous) => ({ ...previous, [active.id]: { score: Math.round(right / active.quiz.length * 100), at: Date.now() } }))
          setSaved(true)
        }}>{saved ? '本次自测已记录' : '记录本次自测'}</button><button className="btn btn--ghost" onClick={() => openLesson(active.id)}>重新练习</button>{next && <button className="btn" onClick={() => openLesson(next.id)}>下一单元 <IconArrowRight size={16} /></button>}</div></div>}
      </section>
    </section>
  }

  return <section className="tajweed" aria-label="Tajweed 入门课程">
    <div className="lesson-hero glass"><div><span className="eyebrow">TAJWEED · تَجْوِيد</span><h2>从清晰的字音，到正确的诵读规则。</h2><p className="muted">{TAJWEED_SCOPE}</p><p>已做规则自测 {reviewedCount} / {TAJWEED_LESSONS.length} 单元 · 不代表诵读发音已达标</p><div className="hero__actions"><button className="btn btn--gold" onClick={() => openLesson((TAJWEED_LESSONS.find((lesson) => !results[lesson.id]) ?? TAJWEED_LESSONS[0]).id)}>开始规则学习 <IconArrowRight size={16} /></button><button className="btn btn--ghost" onClick={onLetters}><IconBook size={16} /> 先复习字母与动符</button></div></div></div>
    <div className="course-grid">
      {TAJWEED_LESSONS.map((lesson, index) => <article className="course-card glass" key={lesson.id}><div className="course-card__head"><span className="course-card__icon">{String(index + 1).padStart(2, '0')}</span><span className="lesson-status">{results[lesson.id] ? `上次规则自测 ${results[lesson.id].score}%` : '规则入门'}</span></div><h3>{lesson.title}</h3><p className="muted course-card__desc">{lesson.summary}</p><div className="course-card__meta"><span>{lesson.rules.length} 个要点</span><span>{lesson.quiz.length} 道辨析题</span></div><button className="btn btn--sm" onClick={() => openLesson(lesson.id)}>学习本单元 <IconArrowRight size={15} /></button></article>)}
    </div>
    <div className="study-card tajweed-sources"><h3>配合示范与纠音学习</h3><p className="muted">本页不使用普通合成语音示范 Tajweed。字母发音、鼻音与延长的实际控制，需要合格教师或可靠诵读示范指导；文字自测无法替代听读训练。</p><p>资料参考：{TAJWEED_SOURCES.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}</p></div>
  </section>
}
