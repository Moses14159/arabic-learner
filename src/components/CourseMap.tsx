import { useMemo, useState } from 'react'
import { COURSE_LESSONS, caseTypeForToken } from '../data/grammar'
import type { CourseLesson, LessonSentence } from '../data/grammar'
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

interface Props {
  lessonScores: Record<string, number>
  onStartWordTyping: (title: string, words: Word[]) => void
  onStartSentencePractice: (lesson: CourseLesson, sentences: LessonSentence[]) => void
  onJumpTab: (tab: 'letters' | 'roots') => void
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
            <IconSparkles size={13} /> 盲打前热身 · 听音辨词小游戏 ({(qIdx % vocab.length) + 1}/{vocab.length})
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

export function CourseMap({ lessonScores, onStartWordTyping, onStartSentencePractice, onJumpTab }: Props) {
  const [active, setActive] = useState<CourseLesson | null>(null)
  const [viewMode, setViewMode] = useState<'guided' | 'all'>('guided')
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [checkAnswers, setCheckAnswers] = useState<Record<number, number>>({})

  const completedCount = COURSE_LESSONS.filter((l) => (lessonScores[l.id] ?? 0) > 0).length
  const nextRecommended = COURSE_LESSONS.find((l) => !lessonScores[l.id]) ?? COURSE_LESSONS[0]
  const progressPct = Math.round((completedCount / COURSE_LESSONS.length) * 100)

  const openLesson = (lesson: CourseLesson) => {
    setActive(lesson)
    setStep(1)
    setCheckAnswers({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (active) {
    const score = lessonScores[active.id]
    const fun = LESSON_FUN_GUIDES[active.id]
    const activeIdx = COURSE_LESSONS.findIndex((l) => l.id === active.id)
    const prevLesson = activeIdx > 0 ? COURSE_LESSONS[activeIdx - 1] : null
    const nextLesson = activeIdx < COURSE_LESSONS.length - 1 ? COURSE_LESSONS[activeIdx + 1] : null

    const showStep1 = viewMode === 'all' || step === 1
    const showStep2 = viewMode === 'all' || step === 2
    const showStep3 = viewMode === 'all' || step === 3
    const showStep4 = viewMode === 'all' || step === 4

    return (
      <section className="lesson-view">
        <div className="practice__top" style={{ flexWrap: 'wrap', gap: 10 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => setActive(null)}>
            <IconArrowLeft size={16} /> 返回零到一课程地图
          </button>
          <span className="chip chip--on">{active.stageTitle}</span>
          {score != null && (
            <span className="chapter__best">
              <IconCheck size={14} /> 造句通关 {score}%
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
              { s: 3 as const, label: '第三步 · 听音辨词与本课词汇', sub: `${active.vocab.length} 个有声词卡 + 听音练习` },
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
                          {mc.options.map((opt, oIdx) => {
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

  // Group lessons by stage
  const stages = Array.from(new Set(COURSE_LESSONS.map((l) => l.stage))).map((st) => ({
    stage: st,
    title: COURSE_LESSONS.find((l) => l.stage === st)!.stageTitle,
    lessons: COURSE_LESSONS.filter((l) => l.stage === st),
  }))

  return (
    <section className="home">
      {/* Bento Grid Hero Dashboard */}
      <div className="bento-hero">
        <div className="bento-main glass">
          <span className="chip chip--on">
            <IconCompass size={14} /> 循序渐进 · 阿拉伯语系统课程
          </span>
          <h1>
            从零到一学阿拉伯语
            <span className="hero__ar ar">مِنَ الصِّفْرِ إِلَى الْإِتْقَانِ</span>
          </h1>
          <p className="muted">
            以《麦地那阿拉伯语教程》全三册语法体系为脉络，从 <b>文字连写与动符导引</b>、<b>28 字母同形分组辨析</b> 出发，
            结合情景对话、随堂概念自测、听音辨词与逐词句法剖析（الإِعْرَاب），扎实地掌握阿拉伯语词法与句法。
          </p>
          <div className="hero__actions">
            <button className="btn btn--gold" onClick={() => openLesson(nextRecommended)}>
              <IconSparkles size={17} />{' '}
              {completedCount > 0 ? `继续学习：${nextRecommended.number} · ${nextRecommended.title}` : `从导引课开始：${COURSE_LESSONS[0].title}`}
            </button>
            <button className="btn" onClick={() => onJumpTab('letters')}>
              <IconBook size={17} /> 28 字母分组与拼读
            </button>
            <button className="btn btn--ghost" onClick={() => onJumpTab('roots')}>
              <IconGitBranch size={17} /> 词根与词法工坊
            </button>
          </div>
        </div>

        <div className="bento-side">
          <div className="bento-card glass">
            <div className="bento-card__top">
              <span className="muted">课程学习进度</span>
              <b className="gold-text">
                {completedCount} / {COURSE_LESSONS.length} 课
              </b>
            </div>
            <div className="progress" style={{ height: 8, margin: '8px 0' }}>
              <div className="progress__fill" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              每课包含：概念导读与对话、语法讲义与随堂自测、有声词汇练习、逐词格位解析与造句。
            </p>
          </div>

          <button className="bento-card bento-card--action glass" onClick={() => openLesson(COURSE_LESSONS[0])}>
            <div className="bento-card__icon">
              <IconSparkles size={20} />
            </div>
            <div>
              <b>导引第一课 · 文字连写与动符拼读</b>
              <p className="muted">理清从右向左连写变形、开口/齐齿/合口三大动符，以及 6 个单向连写字母</p>
            </div>
            <IconArrowRight size={18} />
          </button>

          <button className="bento-card bento-card--action glass" onClick={() => onJumpTab('letters')}>
            <div className="bento-card__icon">
              <IconBook size={20} />
            </div>
            <div>
              <b>同形骨架分组 · 28 字母与四形态</b>
              <p className="muted">按 7 组同形骨架与发音部位对比记忆 28 个辅音字母，配连写拆解示例</p>
            </div>
            <IconArrowRight size={18} />
          </button>
        </div>
      </div>

      {stages.map((st) => (
        <div key={st.stage} className="stage-block">
          <h2 className="section-title">{st.title}</h2>
          <div className="course-grid">
            {st.lessons.map((lesson, idx) => {
              const score = lessonScores[lesson.id]
              const fun = LESSON_FUN_GUIDES[lesson.id]
              return (
                <article
                  key={lesson.id}
                  className="course-card glass"
                  style={st.stage === 0 ? { borderColor: 'var(--border-gold)' } : undefined}
                >
                  <div className="course-card__head">
                    <span className="course-card__icon ar" aria-hidden="true">
                      {st.stage}.{idx + 1}
                    </span>
                    <div>
                      <small className="gold-text">
                        {lesson.number} · <span className="ar">{lesson.titleAr}</span>
                      </small>
                      <h3>{lesson.title}</h3>
                    </div>
                    {score != null && (
                      <span className="chapter__best">
                        <IconCheck size={13} /> {score}%
                      </span>
                    )}
                  </div>
                  <p className="muted course-card__desc">{lesson.subtitle}</p>
                  {fun && (
                    <div
                      style={{
                        fontSize: 12.5,
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'var(--gold-soft)',
                        color: 'var(--gold)',
                        fontWeight: 600,
                      }}
                    >
                      {fun.mnemonic}
                    </div>
                  )}
                  <div className="course-card__meta">
                    <span>
                      <IconBook size={13} /> {lesson.points.length} 个语法点
                    </span>
                    <span>
                      <IconKeyboard size={13} /> {lesson.vocab.length} 个核心词
                    </span>
                    <span>
                      <IconLayers size={13} /> {lesson.sentences.length} 个解剖句
                    </span>
                  </div>
                  <div className="course-card__actions">
                    <button className="btn btn--sm" onClick={() => openLesson(lesson)}>
                      <IconBook size={15} /> 分步导学
                    </button>
                    <button
                      className="btn btn--gold btn--sm"
                      onClick={() => onStartSentencePractice(lesson, lesson.sentences)}
                    >
                      <IconPuzzle size={15} /> 造句练习
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}
