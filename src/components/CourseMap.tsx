import { lazy, Suspense, useMemo, useState } from 'react'
import { COURSE_LESSONS, caseTypeForToken } from '../data/grammar'
import type { CourseLesson, LessonSentence } from '../data/grammar'
import { LEARNING_PATH, LEARNING_STAGES, LEARNING_GOALS, pathForGoal, shortLessonTitle } from '../data/learningPath'
import { useStored } from '../lib/storage'
import type { SessionRecord } from '../lib/storage'
import { LESSON_FUN_GUIDES } from '../data/funGuide'
import type { Word } from '../data/words'
import { shuffle } from '../lib/arabic'
import { formatPronunciation, speak } from '../lib/audio'
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook,
  IconCheck,
  IconCompass,
  IconFlame,
  IconGitBranch,
  IconKeyboard,
  IconLayers,
  IconPuzzle,
  IconSparkles,
  IconVolume,
} from './Icons'

const Tajweed = lazy(() => import('./Tajweed').then((module) => ({ default: module.Tajweed })))

interface Props {
  lessonScores: Record<string, number>
  independentScores: Record<string, number>
  step: 1 | 2 | 3 | 4
  setStep: (step: 1 | 2 | 3 | 4) => void
  sessions: SessionRecord[]
  mistakeCount: number
  activeLessonId: string | null
  onSelectLesson: (id: string | null) => void
  onStartWordTyping: (title: string, words: Word[]) => void
  onStartSentencePractice: (lesson: CourseLesson, sentences: LessonSentence[]) => void
  onJumpTab: (tab: 'letters' | 'roots' | 'mistakes' | 'stats') => void
}

function VocabMiniGame({ vocab }: { vocab: Word[] }) {
  const [qIdx, setQIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)

  const target = vocab[qIdx % vocab.length]
  const options = useMemo(() => {
    const others = shuffle(vocab.filter((w) => w.ar !== target.ar)).slice(0, 3)
    return shuffle([target, ...others])
  }, [target, vocab])

  const pron = formatPronunciation(target.tr)

  const choose = (w: Word) => {
    if (picked) return
    setPicked(w.ar)
    speak(target.ar)
    if (w.ar === target.ar) {
      setStreak((s) => s + 1)
    } else {
      setStreak(0)
    }
  }

  const nextQ = () => {
    setPicked(null)
    const next = (qIdx + 1) % vocab.length
    setQIdx(next)
    speak(vocab[next].ar)
  }

  return (
    <div className="glass" style={{ padding: 20, marginBottom: 18, border: '1px solid var(--border-gold)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span className="chip chip--on">
            <IconSparkles size={13} /> 词义热身 · 看词选义 ({(qIdx % vocab.length) + 1}/{vocab.length})
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="gold-text" style={{ fontWeight: 700, fontSize: 14 }}>
            <IconFlame size={14} /> 连对 {streak}
          </span>
          <button className="btn btn--ghost btn--sm" onClick={() => speak(target.ar)}>
            <IconVolume size={15} /> 再听一遍
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => speak(target.ar, 0.55)}>
            0.55x 慢读
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <button
          className="ar gold-text"
          style={{
            fontSize: 44,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
          }}
          onClick={() => speak(target.ar)}
          title="点击听发音"
        >
          {target.ar} <IconVolume size={22} />
        </button>
        <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          音节：<b>{pron.syllables}</b> {pron.zhHint ? `· 谐音：【${pron.zhHint}】` : ''}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        {options.map((opt) => {
          const isPicked = picked === opt.ar
          const isCorrect = opt.ar === target.ar
          let borderColor = 'var(--border)'
          let bg = 'var(--bg-elevated)'
          if (picked) {
            if (isCorrect) {
              borderColor = 'var(--ok)'
              bg = 'var(--ok-bg)'
            } else if (isPicked) {
              borderColor = 'var(--err)'
              bg = 'var(--err-bg)'
            }
          }
          return (
            <button
              key={opt.ar}
              onClick={() => choose(opt)}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                border: `1.5px solid ${borderColor}`,
                background: bg,
                color: 'var(--text)',
                cursor: picked ? 'default' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 600,
              }}
            >
              <span>{opt.zh}</span>
              {picked && isCorrect && <IconCheck size={16} />}
            </button>
          )
        })}
      </div>

      {picked && (
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: picked === target.ar ? 'var(--ok)' : 'var(--err)', fontWeight: 600 }}>
            {picked === target.ar ? '答对了！发音和词义已经对上号啦！' : `正确答案是：${target.zh}（${target.tr}）`}
          </span>
          <button className="btn btn--gold btn--sm" onClick={nextQ}>
            下一个词 <IconArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

export function CourseMap({ lessonScores, independentScores, step, setStep, sessions, mistakeCount, activeLessonId, onSelectLesson, onStartWordTyping, onStartSentencePractice, onJumpTab }: Props) {
  const [goalPreference, setGoalPreference] = useStored<{ id: string }>('qalam.learning-goal', { id: 'daily' })
  const goal = LEARNING_GOALS.find((item) => item.id === (goalPreference.id === 'reading' ? 'tajweed' : goalPreference.id)) ?? LEARNING_GOALS[0]
  const recommendedPath = pathForGoal(goal.id)
  const active = COURSE_LESSONS.find((lesson) => lesson.id === activeLessonId) ?? null
  const [today] = useState(() => new Date())
  const [pathFilter, setPathFilter] = useState<'foundation' | 'expression' | 'advanced' | 'all'>('foundation')
  const [viewMode, setViewMode] = useState<'guided' | 'all'>('guided')
  const [checkAnswers, setCheckAnswers] = useState<Record<number, number>>({})

  const practicedIds = new Set([
    ...Object.keys(lessonScores),
    ...Object.keys(independentScores),
    ...sessions.filter((session) => session.lessonId).map((session) => session.lessonId!),
  ])
  const completedCount = LEARNING_PATH.filter((lesson) => practicedIds.has(lesson.id)).length
  // Old scores used assisted answers and a different denominator; only new records guide advancement.
  const passedIds = new Set(Object.keys(independentScores).filter((id) => independentScores[id] >= 80))
  const nextRecommended = recommendedPath.find((lesson) => !passedIds.has(lesson.id)) ?? recommendedPath[0]
  const progressPct = Math.round((completedCount / LEARNING_PATH.length) * 100)
  const checkOptions = useMemo(() => active ? LESSON_FUN_GUIDES[active.id]?.miniChecks.map((check) => shuffle(check.options.map((text, index) => ({ text, index })))) ?? [] : [], [active])

  const openLesson = (lesson: CourseLesson) => {
    onSelectLesson(lesson.id)
    setStep(1)
    setCheckAnswers({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (active) {
    const score = lessonScores[active.id]
    const fun = LESSON_FUN_GUIDES[active.id]
    const activeIdx = recommendedPath.findIndex((l) => l.id === active.id)
    const prevLesson = activeIdx > 0 ? recommendedPath[activeIdx - 1] : null
    const nextLesson = activeIdx < recommendedPath.length - 1 ? recommendedPath[activeIdx + 1] : null

    const showStep1 = viewMode === 'all' || step === 1
    const showStep2 = viewMode === 'all' || step === 2
    const showStep3 = viewMode === 'all' || step === 3
    const showStep4 = viewMode === 'all' || step === 4

    return (
      <section className="lesson-view">
        <div className="practice__top" style={{ flexWrap: 'wrap', gap: 10 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => onSelectLesson(null)}>
            <IconArrowLeft size={16} /> 返回学习路线
          </button>
          <span className="chip chip--on">{active.stageTitle}</span>
          {score != null && (
            <span className="chapter__best">
              <IconCheck size={14} /> 历史练习最佳 {score}%
            </span>
          )}
          <div className="seg" style={{ marginLeft: 'auto' }} role="tablist" aria-label="教程浏览模式">
            <button
              role="tab"
              aria-selected={viewMode === 'guided'}
              className={viewMode === 'guided' ? 'on' : ''}
              onClick={() => setViewMode('guided')}
            >
              <IconSparkles size={14} /> 分步导学（由浅入深）
            </button>
            <button
              role="tab"
              aria-selected={viewMode === 'all'}
              className={viewMode === 'all' ? 'on' : ''}
              onClick={() => setViewMode('all')}
            >
              <IconBook size={14} /> 全文讲义
            </button>
          </div>
        </div>

        <div className="lesson-hero glass">
          <div className="lesson-hero__main">
            <div className="lesson-hero__title">
              <span className="lesson-hero__icon ar" aria-hidden="true">
                {active.number.replace(/\D/g, '') || '0'}
              </span>
              <div>
                <small className="gold-text">
                  {active.number} · <span className="ar">{active.titleAr}</span>
                </small>
                <h1>{active.title}</h1>
              </div>
            </div>
            <p className="muted" style={{ margin: '10px 0 0', maxWidth: 680 }}>
              {active.subtitle}
            </p>
          </div>
          <div className="lesson-hero__actions">
            <button
              className="btn"
              onClick={() => onStartWordTyping(`${active.number}生词：${active.title}`, active.vocab)}
            >
              <IconKeyboard size={17} /> 打字记本课生词 ({active.vocab.length})
            </button>
            <button
              className="btn btn--gold"
              onClick={() => onStartSentencePractice(active, active.sentences)}
            >
              <IconPuzzle size={17} /> 连词成句与整句盲打 ({active.sentences.length})
            </button>
          </div>
        </div>

        {/* Guided 4-Step Stepper Bar */}
        {viewMode === 'guided' && (
          <div
            className="glass"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 8,
              padding: 10,
              marginBottom: 18,
            }}
          >
            {[
              { s: 1 as const, label: '第一步 · 概念导读与情景对话', sub: '脉络梳理 + 核心纲要' },
              { s: 2 as const, label: '第二步 · 语法详解与随堂自测', sub: `${active.points.length} 个语法要点 + 概念辨析` },
              { s: 3 as const, label: '第三步 · 看词选义与本课词汇', sub: `${active.vocab.length} 个有声词卡 + 听音练习` },
              { s: 4 as const, label: '第四步 · 句法剖析与造句练习', sub: `${active.sentences.length} 句变格解析 + 键盘实操` },
            ].map((item) => {
              const isOn = step === item.s
              return (
                <button
                  key={item.s}
                  onClick={() => setStep(item.s)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: isOn ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                    background: isOn ? 'var(--gold-soft)' : 'transparent',
                    color: 'var(--text)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, color: isOn ? 'var(--gold)' : 'var(--text)' }}>
                    {item.label}
                  </div>
                  <small className="muted" style={{ fontSize: 12 }}>
                    {item.sub}
                  </small>
                </button>
              )
            })}
          </div>
        )}

        {/* STEP 1: Fun Story Hook, Mnemonic & Interactive Dialogue */}
        {showStep1 && fun && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div className="glass" style={{ padding: 24, borderLeft: '4px solid var(--gold)' }}>
              <span className="chip chip--on" style={{ marginBottom: 8 }}>
                <IconSparkles size={13} /> 本课概念导读
              </span>
              <h2 style={{ margin: '6px 0 10px' }}>{fun.hookTitle}</h2>
              <p style={{ fontSize: 15.5, lineHeight: 1.75, margin: 0 }}>{fun.story}</p>

              <div
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'var(--gold-soft)',
                  border: '1px solid var(--border-gold)',
                }}
              >
                <b className="gold-text" style={{ fontSize: 15 }}>
                  {fun.mnemonic}
                </b>
              </div>

              <p className="muted" style={{ margin: '12px 0 0', fontSize: 13.5 }}>
                {fun.culturalTip}
              </p>
            </div>

            {/* Interactive Mini Dialogue Theater */}
            <div className="glass" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0 }}>课堂情景对话（点击阿语可朗读）</h3>
                <span className="muted" style={{ fontSize: 13 }}>
                  结合语境体会句式结构
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {fun.dialogue.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: i % 2 === 0 ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <small className="muted" style={{ marginBottom: 4, fontWeight: 600 }}>
                      {d.speaker}
                    </small>
                    <div
                      style={{
                        maxWidth: '88%',
                        padding: '14px 18px',
                        borderRadius: 16,
                        background: i % 2 === 0 ? 'var(--bg-elevated)' : 'var(--gold-soft)',
                        border: i % 2 === 0 ? '1px solid var(--border)' : '1px solid var(--border-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        className="ar gold-text"
                        style={{
                          fontSize: 25,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          textAlign: 'right',
                        }}
                        onClick={() => speak(d.ar)}
                      >
                        {d.ar}
                      </button>
                      <div>
                        <div className="word-tr" style={{ fontSize: 14 }}>
                          {d.tr}
                        </div>
                        <div style={{ fontWeight: 600, marginTop: 2 }}>{d.zh}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => speak(d.ar, 0.55)}>
                          0.55x 慢读
                        </button>
                        <button className="icon-btn" aria-label="朗读对话" onClick={() => speak(d.ar)}>
                          <IconVolume size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {viewMode === 'guided' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn--gold" onClick={() => setStep(2)}>
                  进入第二步：语法详解与随堂自测 <IconArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Micro-Grammar Cards + Interactive Mini-Check */}
        {showStep2 && (
          <div style={{ marginBottom: 24 }}>
            <h2 className="section-title">
              <IconBook size={16} /> 核心语法讲义（点击任意阿语例句可朗读）
            </h2>
            <div className="grammar-points">
              {active.points.map((pt, i) => (
                <div key={i} className="grammar-card glass">
                  <h3>{pt.title}</h3>
                  {pt.formula && <div className="grammar-formula">{pt.formula}</div>}
                  <p className="muted">{pt.desc}</p>
                  <div className="grammar-examples">
                    {pt.examples.map((ex, j) => (
                      <div key={j} className="grammar-ex" style={{ cursor: 'default' }}>
                        <div className="grammar-ex__main" style={{ width: '100%' }}>
                          <button
                            className="ar gold-text"
                            style={{ fontSize: 26, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            onClick={() => speak(ex.ar)}
                          >
                            {ex.ar}
                          </button>
                          <span className="word-tr" style={{ fontSize: 15 }}>
                            {ex.tr}
                          </span>
                          <span>{ex.zh}</span>
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button className="btn btn--ghost btn--sm" onClick={() => speak(ex.ar, 0.55)}>
                              0.55x 慢读
                            </button>
                            <button className="icon-btn" onClick={() => speak(ex.ar)} aria-label="朗读例句">
                              <IconVolume size={16} />
                            </button>
                          </div>
                        </div>
                        {ex.highlight && <small className="grammar-ex__hi">解析：{ex.highlight}</small>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive 10-Second Mini-Checks */}
            {fun && fun.miniChecks.length > 0 && (
              <div className="glass" style={{ padding: 22, marginTop: 18, border: '1px solid var(--border-gold)' }}>
                <span className="chip chip--on">
                  <IconPuzzle size={13} /> 随堂概念辨析
                </span>
                <h3 style={{ margin: '8px 0 14px' }}>通过两道小题检验本课核心语法点：</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {fun.miniChecks.map((mc, idx) => {
                    const chosen = checkAnswers[idx]
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: 16,
                          borderRadius: 12,
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 10 }}>
                          Q{idx + 1}. {mc.question}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {checkOptions[idx].map(({ text: opt, index: oIdx }) => {
                            const isPicked = chosen === oIdx
                            const isRight = oIdx === mc.correctIndex
                            let border = '1px solid var(--border)'
                            let bg = 'transparent'
                            if (chosen !== undefined) {
                              if (isRight) {
                                border = '1.5px solid var(--ok)'
                                bg = 'var(--ok-bg)'
                              } else if (isPicked) {
                                border = '1.5px solid var(--err)'
                                bg = 'var(--err-bg)'
                              }
                            }
                            return (
                              <button
                                key={oIdx}
                                disabled={chosen !== undefined}
                                onClick={() => {
                                  setCheckAnswers((prev) => ({ ...prev, [idx]: oIdx }))
                                  speak(mc.speakAr)
                                }}
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: 10,
                                  border,
                                  background: bg,
                                  color: 'var(--text)',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  textAlign: 'left',
                                }}
                              >
                                {opt}
                              </button>
                            )
                          })}
                        </div>
                        {chosen !== undefined && (
                          <div
                            style={{
                              marginTop: 10,
                              fontSize: 13.5,
                              color: chosen === mc.correctIndex ? 'var(--ok)' : 'var(--gold)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <span>{mc.explanation}</span>
                            <button className="btn btn--ghost btn--sm" onClick={() => speak(mc.speakAr)}>
                              <IconVolume size={14} /> 听示范：{mc.speakAr}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {viewMode === 'guided' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
                <button className="btn btn--ghost" onClick={() => setStep(1)}>
                  <IconArrowLeft size={16} /> 上一步：概念导读
                </button>
                <button className="btn btn--gold" onClick={() => setStep(3)}>
                  下一步：本课词汇与听音辨词 <IconArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Interactive Vocab Mini-Game + Vocalized Word Cards */}
        {showStep3 && (
          <div style={{ marginBottom: 24 }}>
            <div className="lesson-sec-head">
              <h2 className="section-title">
                <IconKeyboard size={16} /> 本课生词表与听音辨词练习（点击词卡听发音）
              </h2>
              <button
                className="btn btn--gold btn--sm"
                onClick={() => onStartWordTyping(`${active.number}生词：${active.title}`, active.vocab)}
              >
                键盘拼写练习这 {active.vocab.length} 个词 <IconArrowRight size={15} />
              </button>
            </div>

            {active.vocab.length >= 4 && <VocabMiniGame vocab={active.vocab} />}

            <div className="vocab-grid">
              {active.vocab.map((w) => {
                const p = formatPronunciation(w.tr)
                return (
                  <div key={w.ar} className="vocab-item glass" style={{ alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        className="vocab-item__ar ar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => speak(w.ar)}
                      >
                        {w.ar}
                      </button>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => speak(w.ar, 0.55)} title="慢速朗读">
                          0.55x
                        </button>
                        <button className="icon-btn" onClick={() => speak(w.ar)} aria-label={`朗读 ${w.zh}`}>
                          <IconVolume size={15} />
                        </button>
                      </div>
                    </div>
                    <span className="word-tr" style={{ fontSize: 14 }}>
                      {w.tr}
                    </span>
                    <small className="muted" style={{ fontSize: 11.5 }}>
                      音节：{p.syllables} {p.zhHint ? `· 【${p.zhHint}】` : ''}
                    </small>
                    <b>{w.zh}</b>
                  </div>
                )
              })}
            </div>

            {viewMode === 'guided' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
                <button className="btn btn--ghost" onClick={() => setStep(2)}>
                  <IconArrowLeft size={16} /> 上一步：语法拆解
                </button>
                <button className="btn btn--gold" onClick={() => setStep(4)}>
                  下一步：积木造句透视与通关 <IconArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Lesson Sentences & X-Ray Preview + Final Challenge Actions */}
        {showStep4 && (
          <div>
            <div className="lesson-sec-head">
              <h2 className="section-title">
                <IconLayers size={16} /> 本课阶梯句型与逐词语法解剖（点击任意单词听发音）
              </h2>
              <button
                className="btn btn--gold btn--sm"
                onClick={() => onStartSentencePractice(active, active.sentences)}
              >
                启动连词成句与整句打字 <IconArrowRight size={15} />
              </button>
            </div>
            <div className="sentence-list">
              {active.sentences.map((s, idx) => (
                <div key={idx} className="sentence-preview glass">
                  <div className="sentence-preview__top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <button className="sentence-preview__ar ar" onClick={() => speak(s.ar)}>
                        <span>{s.ar}</span>
                        <IconVolume size={18} />
                      </button>
                      <button className="btn btn--ghost btn--sm" onClick={() => speak(s.ar, 0.55)}>
                        0.55x 慢读整句
                      </button>
                    </div>
                    <div className="sentence-preview__meta">
                      <span className="word-tr" style={{ fontSize: 16 }}>
                        {s.tr}
                      </span>
                      <b>{s.zh}</b>
                    </div>
                  </div>
                  <div className="xray__tokens" dir="rtl">
                    {s.tokens.map((t, tIdx) => {
                      const cType = caseTypeForToken(t)
                      return (
                        <button key={tIdx} className="xray-token" onClick={() => speak(t.ar)} title={t.note}>
                          <span className="xray-token__ar ar">{t.ar}</span>
                          <span className="xray-token__tr">{t.tr}</span>
                          <span className="xray-token__zh">{t.zh}</span>
                          <span className={'xray-token__badge' + (cType ? ` case-pill--${cType}` : '')}>{t.role}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Action Banner */}
            <div
              className="glass"
              style={{
                marginTop: 22,
                padding: 22,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                border: '1px solid var(--border-gold)',
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>准备好检验本课成果了吗？</h3>
                <p className="muted" style={{ margin: '4px 0 0' }}>
                  先用词块连词成句，再切换到整句键盘盲打，亲手敲出地道的阿语句子！
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {prevLesson && (
                  <button className="btn btn--ghost" onClick={() => openLesson(prevLesson)}>
                    <IconArrowLeft size={16} /> 上一课：{prevLesson.number}
                  </button>
                )}
                <button
                  className="btn"
                  onClick={() => onStartWordTyping(`${active.number}生词：${active.title}`, active.vocab)}
                >
                  <IconKeyboard size={16} /> 生词盲打 ({active.vocab.length})
                </button>
                <button className="btn btn--gold" onClick={() => onStartSentencePractice(active, active.sentences)}>
                  <IconPuzzle size={16} /> 造句通关 ({active.sentences.length})
                </button>
                {nextLesson && (
                  <button className="btn btn--ghost" onClick={() => openLesson(nextLesson)}>
                    下一课：{nextLesson.number} <IconArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    )
  }

  const validSessions = sessions.filter((session) => session.kind && session.words > 0)
  const todaySessions = validSessions.filter((session) => new Date(session.at).toDateString() === today.toDateString())
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() - 6 + index)
    return {
      label: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
      date: date.toLocaleDateString('zh-CN'),
      active: validSessions.some((session) => new Date(session.at).toDateString() === date.toDateString()),
    }
  })
  const stages = LEARNING_STAGES.filter((stage) => pathFilter === 'all' || (pathFilter === 'foundation' ? stage.index < 2 : pathFilter === 'expression' ? stage.index === 2 || stage.index === 3 : stage.index === 4))

  return (
    <section className="home learning-home">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">YOUR ARABIC JOURNEY · 你的阿语之旅</span>
          <h1>{todaySessions.length ? '今天，也向前了一点。' : '每天一点，离阿语更近一点。'}</h1>
          <p className="muted">从一句问候开始，让每次练习都有收获。</p>
        </div>
        <span className="dashboard-date">{today.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</span>
      </div>

      <div className="goal-picker" role="group" aria-label="选择学习目标">
        {LEARNING_GOALS.map((item) => <button key={item.id} aria-pressed={goal.id === item.id} className={goal.id === item.id ? 'is-active' : ''} onClick={() => setGoalPreference({ id: item.id })}><span>{item.title}</span><small>{item.subtitle}</small>{goal.id === item.id && <IconCheck size={16} />}</button>)}
      </div>
      <p className="goal-description">{goal.description}</p>
      {goal.id === 'tajweed' ? <Suspense fallback={<p role="status">正在打开 Tajweed 规则…</p>}><Tajweed onLetters={() => onJumpTab('letters')} /></Suspense> : <>
      <div className="learning-dashboard">
        <section className="today-card">
          <span className="eyebrow">{completedCount ? 'YOUR NEXT STEP · 下一步' : 'START SMALL · 从这里开始'}</span>
          <h2>{shortLessonTitle(nextRecommended.title)}</h2>
          <p className="today-description">{nextRecommended.subtitle}</p>
          <div className="today-meta"><span><IconBook size={15} /> {nextRecommended.number}</span><span>{nextRecommended.vocab.length} 个词 · {nextRecommended.sentences.length} 句练习</span></div>
          <div className="hero__actions">
            <button className="btn btn--gold" onClick={() => openLesson(nextRecommended)}>{completedCount ? '继续这段旅程' : goal.id === 'daily' ? '开始第一课' : '开始推荐课程'} <IconArrowRight size={17} /></button>
            <button className="btn btn--ghost" onClick={() => onJumpTab('letters')}>先认识字母</button>
          </div>
          <div className="today-art" aria-hidden="true"><span className="ar">قَلَم</span><small>一支笔，一段新旅程</small></div>
        </section>
        <aside className="rhythm-card">
          <div className="rhythm-card__head"><h2>找到你的学习节奏</h2><IconFlame size={20} /></div>
          <div className="week-rhythm" aria-label="最近七天的练习记录">
            {week.map((day, index) => <div key={day.date} className={'week-day' + (day.active ? ' is-active' : '') + (index === 6 ? ' is-today' : '')} aria-label={`${day.date}${day.active ? '，已练习' : '，暂无练习'}${index === 6 ? '，今天' : ''}`}><small>{day.label}</small><span>{day.active ? <IconCheck size={15} /> : index === 6 ? '今' : '·'}</span></div>)}
          </div>
          <div className="rhythm-summary"><strong>{week.filter((day) => day.active).length}<small> / 7 天</small></strong><span>最近一周有练习的日子</span></div>
          <p className="muted">{todaySessions.length ? '今日小目标已完成。明天再试试不看提示回忆。' : '今天的小目标：完成一组练习。不赶进度，学会一点就很好。'}</p>
        </aside>
      </div>

      <div className="learning-metrics">
        <div><span>已练习单元</span><strong>{completedCount}<small> / {LEARNING_PATH.length}</small></strong><small>记录探索，不等同于掌握</small></div>
        <div><span>今日完成</span><strong>{todaySessions.length}<small> 组练习</small></strong><small>从一组小练习开始</small></div>
        <div><span>待巩固词汇</span><strong>{mistakeCount}<small> 个词</small></strong><small>{mistakeCount ? '回想一次，比再看一次更有帮助' : '练习中遇到的错词会留在这里'}</small></div>
      </div>

      <div className="learning-workspace">
        <div className="course-path">
          <div className="path-heading"><div><span className="eyebrow">THE LEARNING PATH</span><h2>你的学习路线</h2></div><p className="muted">先会用，再慢慢理解规律。</p></div>
          <div className="stage-filter" role="group" aria-label="课程阶段筛选">
            {([{ id: 'foundation', label: '入门基础' }, { id: 'expression', label: '日常表达' }, { id: 'advanced', label: '进阶选学' }, { id: 'all', label: '全部课程' }] as const).map((filter) => <button key={filter.id} aria-pressed={pathFilter === filter.id} className={pathFilter === filter.id ? 'is-active' : ''} onClick={() => setPathFilter(filter.id)}>{filter.label}</button>)}
          </div>
          {stages.map((stage) => (
            <div key={stage.index} className="stage-block">
              <div className="stage-heading"><span className="stage-number">{String(stage.index + 1).padStart(2, '0')}</span><div><h3>{stage.title}</h3><p>{stage.summary}</p></div></div>
              <div className="course-grid">
                {stage.lessons.map((lesson, index) => {
                  const practiced = practicedIds.has(lesson.id)
                  const isNext = lesson.id === nextRecommended.id
                  return (
                    <article key={lesson.id} className={'course-card glass' + (isNext ? ' is-next' : '') + (practiced ? ' is-practiced' : '')}>
                      <div className="course-card__head"><span className="course-card__icon" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span className="lesson-status">{isNext ? '建议下一课' : practiced ? '已练习' : stage.index === 4 ? '选学专题' : lesson.number}</span></div>
                      <h3>{shortLessonTitle(lesson.title)}</h3>
                      <p className="muted course-card__desc">{lesson.subtitle}</p>
                      <div className="course-card__meta"><span><IconBook size={13} /> {lesson.vocab.length} 个核心词</span><span><IconLayers size={13} /> {lesson.sentences.length} 句练习</span></div>
                      <div className="course-card__actions"><button className={'btn btn--sm' + (isNext ? ' btn--gold' : '')} onClick={() => openLesson(lesson)}>{practiced ? '重温这一课' : '开始学习'} <IconArrowRight size={14} /></button><button className="btn btn--ghost btn--sm" onClick={() => onStartSentencePractice(lesson, lesson.sentences)}>造句练习</button></div>
                    </article>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <aside className="study-sidebar">
          <section className="study-card review-card"><span className="eyebrow">A LITTLE REVIEW</span><IconSparkles size={24} /><h3>{mistakeCount ? '让模糊的词，变清晰。' : '学过的，值得再想一次。'}</h3><p>{mistakeCount ? `错题本里有 ${mistakeCount} 个词。试着先回想意思，再听一次发音。` : '今天学完，明天再来回想。遇到不会的词，也是在发现下一步。'}</p><button className="btn" onClick={() => mistakeCount ? onJumpTab('mistakes') : openLesson(nextRecommended)}>{mistakeCount ? '复习错词' : '开始积累第一个词'} <IconArrowRight size={15} /></button></section>
          <section className="study-card"><span className="eyebrow">YOUR TOOLKIT</span><h3>需要时，来这里找找</h3><button className="resource-link" onClick={() => onJumpTab('letters')}><IconBook size={19} /><span>字母与拼读<small>听一听，认一认</small></span><IconArrowRight size={15} /></button><button className="resource-link" onClick={() => onJumpTab('roots')}><IconGitBranch size={19} /><span>词根与变位<small>发现词语的联系</small></span><IconArrowRight size={15} /></button><button className="resource-link" onClick={() => onJumpTab('stats')}><IconCompass size={19} /><span>学习记录<small>看看自己的积累</small></span><IconArrowRight size={15} /></button></section>
          <section className="study-card"><span className="eyebrow">ONE STEP AT A TIME</span><h3>练习过，不等于记住了</h3><p>完成后，试着不看答案说一句。隔天还能想起来，才是更扎实的一步。</p><div className="progress" role="progressbar" aria-label="已练习单元比例" aria-valuenow={completedCount} aria-valuemin={0} aria-valuemax={LEARNING_PATH.length}><div className="progress__fill" style={{ width: `${progressPct}%` }} /></div><p className="muted">现代标准阿语入门与语法练习</p></section>
        </aside>
      </div>
      </>}
    </section>
  )
}
