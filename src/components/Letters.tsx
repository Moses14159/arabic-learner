import { useEffect, useMemo, useRef, useState } from 'react'
import { HARAKAT_RULES, LETTERS, LOOKALIKE_GROUPS, SUN_LETTERS, SUN_MOON_EXAMPLES } from '../data/letters'
import type { HarakatRule, Letter } from '../data/letters'
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
  const isSun = SUN_LETTERS.has(letter.char)
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
            {!letter.extra && (
              <span className={'sunmoon-tag ' + (isSun ? 'sunmoon-tag--sun' : 'sunmoon-tag--moon')}>
                {isSun ? '☀️ 太阳字母' : '🌙 月亮字母'}
              </span>
            )}
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
      {letter.joining === 'right' && <p className="note">⚠️ 单向连写字母：只连前面，不和后面的字母相连，因此只有独立和词尾两种形态。</p>}
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

function HarakatLab() {
  const [sel, setSel] = useState<HarakatRule>(HARAKAT_RULES[0])
  const groups = [
    { id: 'short', title: '1. 三短音（基础元音与格位标志）' },
    { id: 'long', title: '2. 三长音（延长 2 拍）' },
    { id: 'special', title: '3. 静符与叠音符（音节收尾与双辅音）' },
    { id: 'tanwin', title: '4. 三鼻音符（泛指名词 "a/an" 标志）' },
  ] as const

  return (
    <div className="letters__layout">
      <div className="harakat-groups">
        {groups.map((g) => (
          <div key={g.id} className="harakat-group glass">
            <h3>{g.title}</h3>
            <div className="harakat-cards">
              {HARAKAT_RULES.filter((r) => r.category === g.id).map((r) => (
                <button
                  key={r.id}
                  className={'harakat-card' + (sel.id === r.id ? ' is-on' : '')}
                  onClick={() => {
                    setSel(r)
                    speak(r.sampleWithBa)
                  }}
                >
                  <span className="harakat-card__ar ar">{r.sampleWithBa}</span>
                  <b>{r.sampleSound}</b>
                  <small>{r.nameZh}</small>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="letter-detail glass" key={sel.id}>
        <div className="letter-detail__head">
          <button className="letter-detail__big ar" onClick={() => speak(sel.sampleWithBa)} title="点击试听 ب 的拼读">
            {sel.sampleWithBa}
          </button>
          <div>
            <span className="chip chip--on">{sel.categoryLabel}</span>
            <h2 style={{ marginTop: 6 }}>
              {sel.nameZh} · <span className="ar">{sel.nameAr}</span>
            </h2>
            <p className="letter-detail__tr">
              读音 <b>{sel.sampleSound}</b> · 术语 <b>{sel.nameLatin}</b>
            </p>
          </div>
        </div>
        <div className="grammar-callout">
          <p><b>📖 拼读要领：</b>{sel.desc}</p>
          <p><b>🧭 语法作用：</b>{sel.grammarTip}</p>
        </div>
        <button className="example" onClick={() => speak(sel.example.ar)}>
          <span className="ar">{sel.example.ar}</span>
          <span>{sel.example.tr}</span>
          <span className="muted">{sel.example.zh}</span>
          <span>🔊</span>
        </button>
      </div>
    </div>
  )
}

function SunMoonLab() {
  const sunList = MAIN.filter((l) => SUN_LETTERS.has(l.char))
  const moonList = MAIN.filter((l) => !SUN_LETTERS.has(l.char))

  return (
    <div className="sunmoon-lab">
      <div className="glass" style={{ padding: 24 }}>
        <h2>☀️ 太阳字母 vs 🌙 月亮字母（الشَّمْسِيَّة وَالْقَمَرِيَّة）</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          阿语的定冠词 <b>الـ (al-)</b> 加在 28 个字母前面时，正好对半分（14 个太阳字母 + 14 个月亮字母）：
          舌尖靠近齿龈的 14 个字母会把冠词里的 <b>ل (l)</b> 「吃掉同化」，使首字母双写加叠音符 <b>ّ</b>；其余 14 个字母则清晰读出 <b>al-</b>。
        </p>
        <div className="sunmoon-split">
          <div className="sunmoon-box sunmoon-box--sun">
            <h3>☀️ 14 个太阳字母（冠词 ل 不发音，同化双写）</h3>
            <p className="muted">发音部位都在舌尖/齿龈，读 l 再读它们太绕口，干脆直接叠音！</p>
            <div className="sunmoon-pills" dir="rtl">
              {sunList.map((l) => (
                <button key={l.char} className="sunmoon-pill" onClick={() => speak(`ال${l.char}ّ`)}>
                  <span className="ar">{l.char}</span>
                  <small>{l.translit}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="sunmoon-box sunmoon-box--moon">
            <h3>🌙 14 个月亮字母（冠词 الْـ 清晰发 l 音）</h3>
            <p className="muted">发音部位在双唇、喉部或软腭，与舌尖 l 互不干扰，保持原音。</p>
            <div className="sunmoon-pills" dir="rtl">
              {moonList.map((l) => (
                <button key={l.char} className="sunmoon-pill" onClick={() => speak(l.example.ar)}>
                  <span className="ar">{l.char}</span>
                  <small>{l.translit}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="sunmoon-examples">
        {SUN_MOON_EXAMPLES.map((ex) => (
          <button key={ex.withAl} className="sunmoon-card glass" onClick={() => speak(ex.withAl)}>
            <div className="sunmoon-card__top">
              <span className={'sunmoon-tag ' + (ex.type === 'sun' ? 'sunmoon-tag--sun' : 'sunmoon-tag--moon')}>
                {ex.type === 'sun' ? '☀️ 太阳同化' : '🌙 月亮保留'}
              </span>
              <span className="muted">{ex.zh}</span>
              <span style={{ marginLeft: 'auto' }}>🔊</span>
            </div>
            <div className="sunmoon-card__transform ar" dir="rtl">
              <span>{ex.bare}</span>
              <span className="muted">←</span>
              <b className="gold-text">{ex.withAl}</b>
            </div>
            <div className="word-tr" style={{ fontSize: 16 }}>{ex.tr}</div>
            <p className="muted" style={{ fontSize: 13, margin: 0, textAlign: 'left' }}>{ex.ruleNote}</p>
          </button>
        ))}
      </div>
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
  const [mode, setMode] = useState<'learn' | 'harakat' | 'sunmoon' | 'quiz'>('learn')
  const [sel, setSel] = useState<Letter>(MAIN[0])
  const grid = useMemo(() => [...MAIN, ...EXTRA], [])

  return (
    <section className="letters">
      <div className="seg">
        <button id="seg-learn" className={mode === 'learn' ? 'on' : ''} onClick={() => setMode('learn')}>28 字母与四形态</button>
        <button id="seg-harakat" className={mode === 'harakat' ? 'on' : ''} onClick={() => setMode('harakat')}>动符与拼读规则</button>
        <button id="seg-sunmoon" className={mode === 'sunmoon' ? 'on' : ''} onClick={() => setMode('sunmoon')}>太阳与月亮字母</button>
        <button id="seg-quiz" className={mode === 'quiz' ? 'on' : ''} onClick={() => setMode('quiz')}>形态辨析测验</button>
      </div>
      {mode === 'quiz' && <Quiz />}
      {mode === 'harakat' && <HarakatLab />}
      {mode === 'sunmoon' && <SunMoonLab />}
      {mode === 'learn' && (
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
