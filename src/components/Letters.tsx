import { useEffect, useMemo, useRef, useState } from 'react'
import { LETTERS, LOOKALIKE_GROUPS } from '../data/letters'
import type { Letter } from '../data/letters'
import { FORM_LABEL, formsFor, letterForm, shuffle } from '../lib/arabic'
import type { Form } from '../lib/arabic'
import { KEY_FOR_CHAR, KEY_BY_CODE } from '../lib/keyboard'
import { speak } from '../lib/audio'

const MAIN = LETTERS.filter((l) => !l.extra)
const EXTRA = LETTERS.filter((l) => l.extra)

function keyLabel(char: string) {
  const k = KEY_FOR_CHAR[char]
  if (!k) return '—'
  return (k.shift ? 'Shift + ' : '') + KEY_BY_CODE[k.code].latin
}

function LetterDetail({ letter }: { letter: Letter }) {
  const forms = formsFor(letter.joining)
  return (
    <div className="letter-detail glass" key={letter.char}>
      <div className="letter-detail__head">
        <button id="btn-letter-speak" className="letter-detail__big ar" onClick={() => speak(letter.name)} title="点击朗读">
          {letter.char}
        </button>
        <div>
          <h2>
            <span className="ar">{letter.name}</span> · {letter.nameLatin}
          </h2>
          <p className="letter-detail__tr">
            转写 <b>{letter.translit}</b> · 键位 <kbd>{keyLabel(letter.char)}</kbd>
          </p>
          <p>{letter.hint}</p>
        </div>
      </div>
      <div className="forms">
        {(['isolated', 'initial', 'medial', 'final'] as Form[]).map((f) => (
          <div key={f} className={'form' + (forms.includes(f) ? '' : ' form--na')}>
            <span className="form__glyph ar">{forms.includes(f) ? letterForm(letter.char, f) : '—'}</span>
            <span className="form__label">{FORM_LABEL[f]}</span>
          </div>
        ))}
      </div>
      {letter.joining === 'right' && <p className="note">⚠️ 这个字母不和后面的字母相连，所以只有独立和词尾两种形态。</p>}
      {letter.joining === 'none' && <p className="note">⚠️ 独立的 hamza 不与任何字母相连。</p>}
      <button id="btn-example-speak" className="example" onClick={() => speak(letter.example.ar)}>
        <span className="ar">{letter.example.ar}</span>
        <span>{letter.example.tr}</span>
        <span className="muted">{letter.example.zh}</span>
        <span>🔊</span>
      </button>
    </div>
  )
}

interface Q {
  letter: Letter
  form: Form
  options: Letter[]
}

function makeQuestion(prev?: Letter): Q {
  let letter: Letter
  do letter = MAIN[Math.floor(Math.random() * MAIN.length)]
  while (letter === prev)
  const forms = formsFor(letter.joining)
  const form = forms[Math.floor(Math.random() * forms.length)]
  const group = LOOKALIKE_GROUPS.find((g) => g.includes(letter.char)) ?? ''
  const lookalikes = shuffle(MAIN.filter((l) => l !== letter && group.includes(l.char)))
  const others = shuffle(MAIN.filter((l) => l !== letter && !group.includes(l.char)))
  const options = shuffle([letter, ...[...lookalikes, ...others].slice(0, 3)])
  return { letter, form, options }
}

function Quiz() {
  const [q, setQ] = useState<Q>(() => makeQuestion())
  const [picked, setPicked] = useState<Letter | null>(null)
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0, best: 0 })
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const answer = (l: Letter) => {
    if (picked) return
    setPicked(l)
    const ok = l === q.letter
    speak(q.letter.name)
    setScore((s) => {
      const streak = ok ? s.streak + 1 : 0
      return { right: s.right + (ok ? 1 : 0), total: s.total + 1, streak, best: Math.max(s.best, streak) }
    })
    timer.current = window.setTimeout(() => {
      setPicked(null)
      setQ(makeQuestion(q.letter))
    }, ok ? 700 : 1600)
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= 4) answer(q.options[n - 1])
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  })

  return (
    <div className="quiz glass">
      <div className="quiz__score">
        <span>正确 {score.right}/{score.total}</span>
        <span>连对 🔥 {score.streak}</span>
        <span>最佳 {score.best}</span>
      </div>
      <p className="muted">这是哪个字母的「{FORM_LABEL[q.form]}」形态？</p>
      <div className="quiz__glyph ar" key={q.letter.char + q.form}>{letterForm(q.letter.char, q.form)}</div>
      <div className="quiz__options">
        {q.options.map((o, i) => {
          const state = !picked ? '' : o === q.letter ? ' is-right' : o === picked ? ' is-wrong' : ' is-dim'
          return (
            <button id={`quiz-opt-${i + 1}`} key={o.char} className={'quiz__opt' + state} onClick={() => answer(o)}>
              <kbd>{i + 1}</kbd>
              <span className="ar">{o.char}</span>
              <span>{o.nameLatin}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Letters() {
  const [mode, setMode] = useState<'learn' | 'quiz'>('learn')
  const [sel, setSel] = useState<Letter>(MAIN[0])
  const grid = useMemo(() => [...MAIN, ...EXTRA], [])

  return (
    <section className="letters">
      <div className="seg">
        <button id="seg-learn" className={mode === 'learn' ? 'on' : ''} onClick={() => setMode('learn')}>认识字母</button>
        <button id="seg-quiz" className={mode === 'quiz' ? 'on' : ''} onClick={() => setMode('quiz')}>形态测验</button>
      </div>
      {mode === 'quiz' ? (
        <Quiz />
      ) : (
        <div className="letters__layout">
          <div className="letter-grid" dir="rtl">
            {grid.map((l) => (
              <button
                id={`letter-${l.nameLatin.replace(/\W/g, '')}`}
                key={l.char}
                className={'letter-card' + (l === sel ? ' is-on' : '') + (l.extra ? ' letter-card--extra' : '')}
                onClick={() => {
                  setSel(l)
                  speak(l.name)
                }}
              >
                <span className="ar">{l.char}</span>
                <small>{l.nameLatin}</small>
              </button>
            ))}
          </div>
          <LetterDetail letter={sel} />
        </div>
      )}
    </section>
  )
}
