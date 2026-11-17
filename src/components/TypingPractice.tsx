import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { Word } from '../data/words'
import { clusterText, isMark, shuffle, toClusters } from '../lib/arabic'
import { charsFromEvent, KEY_FOR_CHAR, MARK_NAMES } from '../lib/keyboard'
import { formatPronunciation, sfx, speak } from '../lib/audio'
import type { SessionRecord, Settings } from '../lib/storage'
import { sessionMetrics } from '../lib/session'
import { recordAttempt } from '../lib/cloud'
import { getWordExercise } from '../../shared/catalog'
import { Keyboard } from './Keyboard'
import { IconArrowLeft, IconArrowRight, IconRefresh, IconTrophy, IconVolume } from './Icons'

interface Props {
  title: string
  words: Word[]
  settings: Settings
  setSettings: (fn: (s: Settings) => Settings) => void
  onMistake: (w: Word) => void
  onSession: (r: SessionRecord) => void
  onBack: () => void
  onNext?: () => void
}

interface Game {
  idx: number
  ci: number
  baseDone: boolean
  marksLeft: string[]
  wordHadError: boolean
  start: number
  end: number
  correct: number
  total: number
  done: number
  skipped: number
  assisted: boolean
  missed: Word[]
  locked: boolean
  roundId: string
  wordStartedAt: number
  wordRecorded: boolean
}

const freshGame = (): Game => ({
  idx: 0,
  ci: 0,
  baseDone: false,
  marksLeft: [],
  wordHadError: false,
  start: 0,
  end: 0,
  correct: 0,
  total: 0,
  done: 0,
  skipped: 0,
  assisted: false,
  missed: [],
  locked: false,
  roundId: crypto.randomUUID(),
  wordStartedAt: 0,
  wordRecorded: false,
})

const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export function TypingPractice({ title, words, settings, setSettings, onMistake, onSession, onBack, onNext }: Props) {
  const [round, setRound] = useState(0)
  const [source, setSource] = useState(words)
  // `round` forces a fresh list (and re-shuffle) on restart
  const list = useMemo(() => (settings.shuffle ? shuffle(source) : [...source]), [source, round, settings.shuffle]) // oxlint-disable-line react-hooks/exhaustive-deps

  const g = useRef<Game>(freshGame())
  const [, force] = useReducer((x: number) => x + 1, 0)
  const [shake, setShake] = useState(0)
  const [flash, setFlash] = useState(false)
  const [pressed, setPressed] = useState<{ code: string; ok: boolean } | null>(null)
  const pressTimer = useRef(0)
  const advanceTimer = useRef(0)
  const inputArea = useRef<HTMLDivElement>(null)

  const listRef = useRef(list)
  if (listRef.current !== list) {
    clearTimeout(advanceTimer.current)
    listRef.current = list
    g.current = freshGame()
  }

  const s = g.current
  if (!settings.dictation || settings.showKeyboard) s.assisted = true
  const finished = s.idx >= list.length
  const word = list[Math.min(s.idx, list.length - 1)]
  const clusters = useMemo(() => toClusters(word.ar), [word])

  // speak on new word
  useEffect(() => {
    if (!finished && (settings.autoSpeak || settings.dictation)) speak(word.ar)
  }, [word, list, finished, settings.autoSpeak, settings.dictation])

  // tick the timer
  useEffect(() => {
    if (finished) return
    const id = setInterval(force, 1000)
    return () => clearInterval(id)
  }, [finished])

  const play = useCallback((k: keyof typeof sfx) => settings.sound && sfx[k](), [settings.sound])

  const resetWord = () => {
    s.ci = 0
    s.baseDone = false
    s.marksLeft = []
  }

  const finishSession = () => {
    s.end = Date.now()
    onSession({
      at: s.end,
      title,
      words: s.done,
      ...sessionMetrics(s.start, s.end, s.done, s.correct, s.total, s.done / list.length),
      kind: 'typing',
      assisted: s.assisted,
      skipped: s.skipped,
      roundId: s.roundId,
    })
  }

  const advance = () => {
    s.idx++
    s.wordHadError = false
    s.wordStartedAt = 0
    s.wordRecorded = false
    s.locked = false
    resetWord()
    if (s.idx >= list.length) finishSession()
    force()
  }

  const fail = (code: string) => {
    if (!s.wordHadError) {
      s.missed.push(word)
      onMistake(word)
    }
    s.wordHadError = true
    resetWord()
    play('error')
    setShake((n) => n + 1)
    showPress(code, false)
    force()
  }

  const showPress = (code: string, ok: boolean) => {
    setPressed({ code, ok })
    clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => setPressed(null), 160)
  }

  const recordWord = (skipped: boolean) => {
    if (s.wordRecorded) return
    s.wordRecorded = true
    const exercise = getWordExercise(word)
    if (!exercise) return
    recordAttempt({
      exerciseId: exercise.id,
      contentVersion: exercise.version,
      roundId: s.roundId,
      mode: 'typing',
      answer: skipped ? '' : word.ar,
      assisted: s.assisted,
      hadError: s.wordHadError,
      durationMs: s.wordStartedAt ? Math.min(604_800_000, Math.max(0, Date.now() - s.wordStartedAt)) : 0,
      skipped,
    })
  }

  const handleChars = (chars: string, code: string) => {
    if (s.locked || finished) return
    if (!s.start) s.start = Date.now()
    if (!s.wordStartedAt) s.wordStartedAt = Date.now()
    for (const ch of chars) {
      if (ch === '\u0640') continue
      const cur = clusters[s.ci]
      if (!cur) break
      const mark = isMark(ch)
      if (mark && !settings.requireMarks) continue
      s.total++
      let ok = false
      if (!s.baseDone) {
        ok = !mark && ch === cur.base
        if (ok) {
          s.baseDone = true
          s.marksLeft = settings.requireMarks ? [...cur.marks] : []
        }
      } else {
        const k = s.marksLeft.indexOf(ch)
        ok = mark && k >= 0
        if (ok) s.marksLeft.splice(k, 1)
      }
      if (!ok) return fail(code)
      s.correct++
      if (s.baseDone && s.marksLeft.length === 0) {
        s.ci++
        s.baseDone = false
      }
      if (s.ci >= clusters.length) {
        s.done++
        s.locked = true
        recordWord(false)
        play('word')
        setFlash(true)
        showPress(code, true)
        advanceTimer.current = window.setTimeout(() => {
          setFlash(false)
          advance()
        }, settings.dictation ? 900 : 380)
        force()
        return
      }
    }
    play('key')
    showPress(code, true)
    force()
  }

  const skip = () => {
    if (finished || s.locked) return
    if (!s.start) s.start = Date.now()
    s.skipped++
    if (!s.wordHadError) {
      s.missed.push(word)
      onMistake(word)
    }
    recordWord(true)
    advance()
  }

  const handler = useRef<(e: KeyboardEvent) => void>(() => {})
  handler.current = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target?.closest?.('input,textarea,select,[contenteditable="true"]')) return
    if (target?.closest?.('button,a') && (e.key === 'Enter' || e.key === ' ')) return
    if (e.key === 'Enter') {
      e.preventDefault()
      if (finished) restart()
      else speak(word.ar)
      return
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      skip()
      return
    }
    if (e.key === 'Escape' || e.key === 'Backspace') {
      e.preventDefault()
      resetWord()
      force()
      return
    }
    const chars = charsFromEvent(e)
    if (chars == null) return
    e.preventDefault()
    inputArea.current?.focus({ preventScroll: true })
    handleChars(chars, e.code)
  }
  useEffect(() => {
    const fn = (e: KeyboardEvent) => handler.current(e)
    window.addEventListener('keydown', fn)
    return () => {
      window.removeEventListener('keydown', fn)
      clearTimeout(advanceTimer.current)
      clearTimeout(pressTimer.current)
    }
  }, [])

  const restart = (newSource?: Word[]) => {
    if (newSource) setSource(newSource)
    setRound((r) => r + 1)
  }

  // ---- derived view data ----
  const cur = clusters[s.ci]
  const expected = !cur ? null : !s.baseDone ? cur.base : s.marksLeft[0]
  const hint = expected ? (KEY_FOR_CHAR[expected] ?? null) : null
  const elapsed = s.start ? ((s.end || Date.now()) - s.start) / 1000 : 0
  const accuracy = sessionMetrics(s.start, s.end || Date.now(), s.done, s.correct, s.total, s.done / Math.max(1, s.idx + (s.locked ? 1 : 0))).accuracy
  const wpm = elapsed > 2 ? Math.round((s.done / elapsed) * 60 * 10) / 10 : 0
  const progress = (Math.min(s.idx, list.length) / list.length) * 100
  const revealed = flash || !settings.dictation
  const prevWord = s.idx > 0 ? list[s.idx - 1] : null
  const nextWord = list[s.idx + 1]

  const toggle = (k: keyof Settings, label: string) => (
    <button
      id={`opt-${k}`}
      aria-pressed={settings[k]}
      className={'chip' + (settings[k] ? ' chip--on' : '')}
      onClick={(e) => {
        if (k === 'requireMarks') resetWord()
        setSettings((x) => ({ ...x, [k]: !x[k] }))
        e.currentTarget.blur()
      }}
    >
      {label}
    </button>
  )

  if (finished) {
    const uniqMissed = [...new Map(s.missed.map((w) => [w.ar, w])).values()]
    return (
      <section className="practice">
        <div className="result glass">
          <div className="result__badge">
            <IconTrophy size={42} />
          </div>
          <h2>本轮练习结束：{title}</h2>
          <p className="muted">完成 {s.done} / {list.length} 个词{s.skipped > 0 ? `，跳过 ${s.skipped} 个；可以从下方复习。` : '，下次试试不看提示回忆。'}</p>
          <div className="result__stats">
            <div><b>{fmtTime(elapsed)}</b><span>用时</span></div>
            <div><b>{s.done}</b><span>单词</span></div>
            <div><b>{wpm}</b><span>词/分钟</span></div>
            <div title="击键正确率 × 完成词占比；跳过不计正确"><b>{accuracy}%</b><span>正确率（含跳过）</span></div>
          </div>
          {uniqMissed.length > 0 && (
            <div className="result__missed">
              <h3>本次出错 {uniqMissed.length} 个</h3>
              <div className="result__missed-list">
                {uniqMissed.map((w) => (
                  <button key={w.ar} className="mini-word" onClick={() => speak(w.ar)}>
                    <span className="ar">{w.ar}</span>
                    <small>{w.zh}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="result__actions">
            <button id="btn-repeat" className="btn" onClick={() => restart(words)}>
              <IconRefresh size={16} /> 再来一遍
            </button>
            {uniqMissed.length > 0 && (
              <button id="btn-retry-missed" className="btn" onClick={() => restart(uniqMissed)}>只练错词</button>
            )}
            {onNext && (
              <button id="btn-next-chapter" className="btn btn--gold" onClick={onNext}>
                下一章 <IconArrowRight size={16} />
              </button>
            )}
            <button id="btn-back-result" className="btn btn--ghost" onClick={onBack}>返回章节</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="practice">
      <div className="practice__top">
        <button id="btn-back" className="btn btn--ghost btn--sm" onClick={onBack}>
          <IconArrowLeft size={16} /> 返回章节
        </button>
        <h2 className="practice__title">{title}</h2>
        <div className="stats-bar">
          <div><b>{fmtTime(elapsed)}</b><span>时间</span></div>
          <div><b>{s.done}</b><span>完成</span></div>
          <div><b>{wpm}</b><span>WPM</span></div>
          <div title="击键正确率 × 完成词占比；跳过不计正确"><b>{accuracy}%</b><span>正确率</span></div>
        </div>
      </div>

      <div className="progress"><div className="progress__fill" style={{ width: `${progress}%` }} /></div>

      <div className="stage glass">
        <div className="stage__side stage__side--prev">
          {prevWord && <><span className="ar">{prevWord.ar}</span><small>{prevWord.zh}</small></>}
        </div>

        <div className="stage__main" ref={inputArea} tabIndex={0} role="group" aria-label="阿语键盘输入区">
          <div key={shake} className={'word-ar ar' + (shake ? ' shake' : '') + (flash ? ' word-ar--done' : '')} dir="rtl">
            {clusters.map((c, i) => {
              const state = i < s.ci ? 'done' : i === s.ci ? (s.baseDone ? 'partial' : 'current') : 'todo'
              if (!revealed && state === 'todo') return <span key={i} className="cl cl--blank">{c.base === ' ' ? ' ' : '_'}</span>
              if (!revealed && state === 'current') return <span key={i} className="cl cl--blank cl--current">_</span>
              return (
                <span key={i} className={`cl cl--${state}`}>
                  {clusterText(clusters, i, settings.showMarks || settings.requireMarks)}
                </span>
              )
            })}
          </div>
          {settings.showTranslit && revealed && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div className="word-tr">{word.tr}</div>
              {(() => {
                const p = formatPronunciation(word.tr)
                return (
                  <small className="muted" style={{ fontSize: 13 }}>
                    音节：<b>{p.syllables}</b> {p.zhHint ? `· 谐音助记：【${p.zhHint}】` : ''}
                  </small>
                )
              })()}
            </div>
          )}
          <div className="word-zh">{word.zh}</div>
          <div className="word-tools">
            <button className="btn btn--ghost btn--sm" onClick={skip}>跳过此词 (→)</button>
            <button
              id="btn-speak"
              className="btn btn--ghost btn--sm"
              aria-label="标准语速朗读单词 (Enter)"
              title="标准语速朗读 (Enter)"
              onClick={(e) => {
                speak(word.ar)
                e.currentTarget.blur()
              }}
            >
              <IconVolume size={16} /> 朗读 (Enter)
            </button>
            <button
              id="btn-speak-slow"
              className="btn btn--ghost btn--sm"
              aria-label="慢速跟读单词 (0.55x)"
              title="0.55x 慢速清晰跟读"
              onClick={(e) => {
                speak(word.ar, 0.55)
                e.currentTarget.blur()
              }}
            >
              <IconVolume size={15} /> 0.55x 慢读
            </button>
            {expected && isMark(expected) && <span className="mark-hint">下一个：{MARK_NAMES[expected]}</span>}
          </div>
        </div>

        <div className="stage__side stage__side--next">
          {nextWord && <><span className="ar">{settings.dictation ? '···' : nextWord.ar}</span><small>{nextWord.zh}</small></>}
        </div>
      </div>

      <div className="options">
        {toggle('showMarks', '元音符号')}
        {toggle('requireMarks', '必须输入元音')}
        {toggle('showTranslit', '拉丁转写')}
        {toggle('dictation', '默写模式')}
        {toggle('autoSpeak', '自动发音')}
        {toggle('shuffle', '乱序')}
        {toggle('sound', '音效')}
        {toggle('showKeyboard', '键盘')}
      </div>

      {settings.showKeyboard && <Keyboard
        hint={hint}
        pressed={pressed?.code ?? null}
        pressedOk={pressed?.ok ?? true}
        onInput={handleChars}
        onReset={() => { resetWord(); force() }}
        onSpeak={() => speak(word.ar)}
        onFocusInput={() => inputArea.current?.focus({ preventScroll: true })}
      />}

      <p className="shortcuts">
        点击屏幕键盘即可输入；<kbd>Shift</kbd> 输入一次上档字符或动符。<br />
        <kbd>Enter</kbd> 朗读 · <kbd>→</kbd> 跳过 · <kbd>Esc</kbd> 重打本词 · <kbd>Tab</kbd> 切换按钮 · 也可用英文键盘打字
      </p>
    </section>
  )
}
