import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LessonSentence, WordToken } from '../data/grammar'
import { ALL_SENTENCES } from '../data/grammar'
import { clusterText, isMark, shuffle, toClusters } from '../lib/arabic'
import { charsFromEvent, KEY_FOR_CHAR, MARK_NAMES } from '../lib/keyboard'
import { sfx, speak } from '../lib/audio'
import type { Settings } from '../lib/storage'
import { Keyboard } from './Keyboard'
import {
  IconArrowLeft,
  IconArrowRight,
  IconEye,
  IconKeyboard,
  IconPuzzle,
  IconRefresh,
  IconTrophy,
  IconVolume,
} from './Icons'

interface Props {
  title: string
  sentences: LessonSentence[]
  settings: Settings
  setSettings: (fn: (s: Settings) => Settings) => void
  onComplete: (accuracy: number) => void
  onBack: () => void
}

export function SentencePractice({ title, sentences, settings, setSettings, onComplete, onBack }: Props) {
  const [mode, setMode] = useState<'build' | 'type'>('build')
  const [idx, setIdx] = useState(0)
  const [xray, setXray] = useState(true)
  const [activeTokenIdx, setActiveTokenIdx] = useState<number>(0)
  const [shake, setShake] = useState(0)
  const [solved, setSolved] = useState(false)
  const [stats, setStats] = useState({ right: 0, total: 0 })

  // ---- Build Mode (Word Tiles) State ----
  const [pickedIndices, setPickedIndices] = useState<number[]>([])
  const [wrongTile, setWrongTile] = useState<number | null>(null)

  // ---- Type Mode (Keyboard Stream) State ----
  const [ci, setCi] = useState(0)
  const [baseDone, setBaseDone] = useState(false)
  const [marksLeft, setMarksLeft] = useState<string[]>([])
  const [pressed, setPressed] = useState<{ code: string; ok: boolean } | null>(null)
  const pressTimer = useRef(0)

  const finished = idx >= sentences.length
  const current = sentences[Math.min(idx, sentences.length - 1)]

  // Build pool of word tiles (correct tokens + up to 3 distractors)
  const tilePool = useMemo(() => {
    const correct = current.tokens.map((t) => t.ar)
    const otherTokens = ALL_SENTENCES.flatMap((s) => s.tokens.map((t) => t.ar)).filter((ar) => !correct.includes(ar))
    const distractors = shuffle([...new Set(otherTokens)]).slice(0, 3)
    return shuffle([...correct, ...distractors])
  }, [current])

  // Clusters for full sentence typing
  const clusters = useMemo(() => toClusters(current.ar), [current])

  // Map each cluster index to its word token index so X-Ray follows the cursor
  const clusterToTokenIdx = useMemo(() => {
    const map: number[] = []
    let tIdx = 0
    for (const c of clusters) {
      map.push(tIdx)
      if (c.base === ' ') tIdx = Math.min(current.tokens.length - 1, tIdx + 1)
    }
    return map
  }, [clusters, current.tokens.length])

  const play = useCallback((k: keyof typeof sfx) => settings.sound && sfx[k](), [settings.sound])

  // Speak when sentence changes
  useEffect(() => {
    if (!finished && settings.autoSpeak) speak(current.ar)
  }, [current, finished, settings.autoSpeak])

  const resetSentenceState = () => {
    setPickedIndices([])
    setWrongTile(null)
    setCi(0)
    setBaseDone(false)
    setMarksLeft([])
    setSolved(false)
    setActiveTokenIdx(0)
  }

  const nextSentence = () => {
    const next = idx + 1
    if (next >= sentences.length) {
      const acc = stats.total ? Math.round((stats.right / stats.total) * 100) : 100
      onComplete(acc)
    }
    setIdx(next)
    resetSentenceState()
  }

  // ---- Build Mode Handlers ----
  const pickTile = (poolIdx: number) => {
    if (solved || pickedIndices.includes(poolIdx)) return
    const nextSlot = pickedIndices.length
    const expectedAr = current.tokens[nextSlot]?.ar
    const chosenAr = tilePool[poolIdx]

    setStats((s) => ({ right: s.right + (chosenAr === expectedAr ? 1 : 0), total: s.total + 1 }))

    if (chosenAr === expectedAr) {
      const nextPicked = [...pickedIndices, poolIdx]
      setPickedIndices(nextPicked)
      setActiveTokenIdx(nextSlot)
      speak(chosenAr)
      if (nextPicked.length === current.tokens.length) {
        play('word')
        setSolved(true)
        setTimeout(() => speak(current.ar), 250)
      } else {
        play('key')
      }
    } else {
      play('error')
      setWrongTile(poolIdx)
      setShake((n) => n + 1)
      setTimeout(() => setWrongTile(null), 400)
    }
  }

  // ---- Type Mode Handlers ----
  const showPress = (code: string, ok: boolean) => {
    setPressed({ code, ok })
    clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => setPressed(null), 160)
  }

  const handleKeyStream = (chars: string, code: string) => {
    if (solved || finished) return
    let curCi = ci
    let curBaseDone = baseDone
    let curMarks = [...marksLeft]

    for (const ch of chars) {
      if (ch === '\u0640') continue
      const cl = clusters[curCi]
      if (!cl) break
      const mark = isMark(ch)
      if (mark && !settings.requireMarks) continue

      let ok = false
      if (!curBaseDone) {
        ok = !mark && ch === cl.base
        if (ok) {
          curBaseDone = true
          curMarks = settings.requireMarks ? [...cl.marks] : []
        }
      } else {
        const k = curMarks.indexOf(ch)
        ok = mark && k >= 0
        if (ok) curMarks.splice(k, 1)
      }

      setStats((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }))

      if (!ok) {
        play('error')
        setShake((n) => n + 1)
        showPress(code, false)
        return
      }

      if (curBaseDone && curMarks.length === 0) {
        curCi++
        curBaseDone = false
      }

      if (curCi >= clusters.length) {
        setCi(curCi)
        setBaseDone(false)
        setMarksLeft([])
        setSolved(true)
        play('word')
        showPress(code, true)
        speak(current.ar)
        return
      }
    }

    setCi(curCi)
    setBaseDone(curBaseDone)
    setMarksLeft(curMarks)
    setActiveTokenIdx(clusterToTokenIdx[curCi] ?? 0)
    play('key')
    showPress(code, true)
  }

  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {})
  keyHandler.current = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.closest?.('input,textarea,select')) return
    if (e.key === 'Enter') {
      e.preventDefault()
      if (solved) nextSentence()
      else speak(current.ar)
      return
    }
    if (mode === 'build') {
      const n = Number(e.key)
      if (n >= 1 && n <= tilePool.length) {
        e.preventDefault()
        pickTile(n - 1)
      }
      return
    }
    if (e.key === 'Escape' || e.key === 'Backspace') {
      e.preventDefault()
      setCi(0)
      setBaseDone(false)
      setMarksLeft([])
      return
    }
    const chars = charsFromEvent(e)
    if (chars == null) return
    e.preventDefault()
    handleKeyStream(chars, e.code)
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => keyHandler.current(e)
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  if (finished) {
    const acc = stats.total ? Math.round((stats.right / stats.total) * 100) : 100
    return (
      <section className="practice">
        <div className="result glass">
          <div className="result__badge">
            <IconTrophy size={42} />
          </div>
          <h2>造句通关：{title}</h2>
          <p className="muted">مُمْتَاز！你已完成本课全部句法造句与解剖训练。</p>
          <div className="result__stats">
            <div>
              <b>{sentences.length}</b>
              <span>完成句子</span>
            </div>
            <div>
              <b>{acc}%</b>
              <span>造句正确率</span>
            </div>
          </div>
          <div className="result__actions">
            <button
              className="btn"
              onClick={() => {
                setIdx(0)
                setStats({ right: 0, total: 0 })
                resetSentenceState()
              }}
            >
              <IconRefresh size={16} /> 再练一遍
            </button>
            <button className="btn btn--gold" onClick={onBack}>
              返回课程主页 <IconArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    )
  }

  const curCluster = clusters[ci]
  const expectedChar = !curCluster ? null : !baseDone ? curCluster.base : marksLeft[0]
  const hint = mode === 'type' && !solved && expectedChar ? (KEY_FOR_CHAR[expectedChar] ?? null) : null
  const activeToken: WordToken = current.tokens[activeTokenIdx] ?? current.tokens[0]
  const progress = ((idx + (solved ? 1 : 0)) / sentences.length) * 100

  return (
    <section className="practice">
      <div className="practice__top">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>
          <IconArrowLeft size={16} /> 返回本课
        </button>
        <h2 className="practice__title">
          {title} · 句法工坊 ({idx + 1}/{sentences.length})
        </h2>
        <div className="seg" role="tablist" aria-label="造句练习模式">
          <button
            role="tab"
            aria-selected={mode === 'build'}
            className={mode === 'build' ? 'on' : ''}
            onClick={() => {
              setMode('build')
              resetSentenceState()
            }}
          >
            <IconPuzzle size={15} /> 词块连词成句
          </button>
          <button
            role="tab"
            aria-selected={mode === 'type'}
            className={mode === 'type' ? 'on' : ''}
            onClick={() => {
              setMode('type')
              resetSentenceState()
            }}
          >
            <IconKeyboard size={15} /> 整句键盘盲打
          </button>
        </div>
      </div>

      <div className="progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress__fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Main Sentence Stage */}
      <div className="sentence-stage glass">
        <div className="sentence-prompt">
          <span className="sentence-prompt__zh">{current.zh}</span>
          <button className="icon-btn" aria-label="朗读整句 (Enter)" title="朗读整句 (Enter)" onClick={() => speak(current.ar)}>
            <IconVolume size={18} />
          </button>
        </div>

        {mode === 'build' ? (
          <>
            {/* Assembled Slots */}
            <div key={shake} className={'sentence-slots' + (shake ? ' shake' : '')} dir="rtl">
              {current.tokens.map((tok, i) => {
                const filledPoolIdx = pickedIndices[i]
                const isFilled = filledPoolIdx !== undefined
                return (
                  <button
                    key={i}
                    className={'slot-token' + (isFilled ? ' slot-token--filled' : '') + (activeTokenIdx === i ? ' slot-token--active' : '')}
                    onClick={() => {
                      setActiveTokenIdx(i)
                      if (isFilled) speak(tok.ar)
                    }}
                  >
                    <span className="ar">{isFilled ? tok.ar : '···'}</span>
                    {isFilled && <small className="slot-token__role">{tok.role.split('·')[1] ?? tok.role}</small>}
                  </button>
                )
              })}
            </div>

            {/* Word Tile Pool */}
            {!solved && (
              <div className="tile-pool" dir="rtl">
                {tilePool.map((arText, pIdx) => {
                  const used = pickedIndices.includes(pIdx)
                  return (
                    <button
                      key={pIdx}
                      disabled={used}
                      className={'word-tile' + (used ? ' word-tile--used' : '') + (wrongTile === pIdx ? ' word-tile--wrong' : '')}
                      onClick={() => pickTile(pIdx)}
                    >
                      <kbd>{pIdx + 1}</kbd>
                      <span className="ar">{arText}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          /* Full Sentence Typing Stream */
          <div className="sentence-typing">
            <div key={shake} className={'sentence-ar ar' + (shake ? ' shake' : '') + (solved ? ' word-ar--done' : '')} dir="rtl">
              {clusters.map((c, i) => {
                const state = i < ci ? 'done' : i === ci ? (baseDone ? 'partial' : 'current') : 'todo'
                return (
                  <span key={i} className={`cl cl--${state}`}>
                    {c.base === ' ' ? (i === ci ? '␣' : ' ') : clusterText(clusters, i, settings.showMarks || settings.requireMarks)}
                  </span>
                )
              })}
            </div>
            {settings.showTranslit && <div className="word-tr">{current.tr}</div>}
            {expectedChar && isMark(expectedChar) && <span className="mark-hint">下一个动符：{MARK_NAMES[expectedChar]}</span>}
          </div>
        )}

        {solved && (
          <div className="sentence-solved">
            <div className="word-tr">{current.tr}</div>
            <button className="btn btn--gold" onClick={nextSentence}>
              {idx + 1 < sentences.length ? (
                <>
                  下一句 (Enter) <IconArrowRight size={16} />
                </>
              ) : (
                <>
                  完成本课 <IconTrophy size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Sentence X-Ray (语法解剖透视台) */}
      <div className="xray glass">
        <div className="xray__head">
          <div className="xray__title">
            <IconEye size={17} />
            <b>语法透视台（Sentence X-Ray）</b>
            <span className="muted"> · 点击句中任意单词查看它的格位、词性与变尾原因</span>
          </div>
          <div className="options">
            <button
              aria-pressed={xray}
              className={'chip' + (xray ? ' chip--on' : '')}
              onClick={() => setXray(!xray)}
            >
              {xray ? '已展开透视' : '展开透视'}
            </button>
            {mode === 'type' && (
              <>
                <button
                  aria-pressed={settings.requireMarks}
                  className={'chip' + (settings.requireMarks ? ' chip--on' : '')}
                  onClick={() => setSettings((s) => ({ ...s, requireMarks: !s.requireMarks }))}
                >
                  必须打元音
                </button>
                <button
                  aria-pressed={settings.showKeyboard}
                  className={'chip' + (settings.showKeyboard ? ' chip--on' : '')}
                  onClick={() => setSettings((s) => ({ ...s, showKeyboard: !s.showKeyboard }))}
                >
                  屏幕键盘
                </button>
              </>
            )}
          </div>
        </div>

        {xray && (
          <>
            <div className="xray__tokens" dir="rtl">
              {current.tokens.map((t, i) => (
                <button
                  key={i}
                  className={'xray-token' + (activeTokenIdx === i ? ' is-on' : '')}
                  onClick={() => {
                    setActiveTokenIdx(i)
                    speak(t.ar)
                  }}
                >
                  <span className="xray-token__ar ar">{t.ar}</span>
                  <span className="xray-token__tr">{t.tr}</span>
                  <span className="xray-token__zh">{t.zh}</span>
                  <span className="xray-token__badge">{t.role}</span>
                </button>
              ))}
            </div>
            {activeToken && (
              <div className="xray__detail">
                <button
                  className="xray__detail-ar ar"
                  aria-label={`朗读 ${activeToken.ar}`}
                  onClick={() => speak(activeToken.ar)}
                >
                  {activeToken.ar}
                </button>
                <div>
                  <div>
                    <b>{activeToken.zh}</b> ({activeToken.tr}) · <span className="gold-text">{activeToken.role}</span>
                  </div>
                  {activeToken.note && <p className="muted" style={{ margin: '4px 0 0' }}>解析：{activeToken.note}</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {mode === 'type' && settings.showKeyboard && !solved && (
        <Keyboard hint={hint} pressed={pressed?.code ?? null} pressedOk={pressed?.ok ?? true} />
      )}
    </section>
  )
}
