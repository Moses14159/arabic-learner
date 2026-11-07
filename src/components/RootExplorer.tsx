import { useEffect, useState } from 'react'
import { ROOT_FAMILIES, VERB_PARADIGMS, WAZN_TEMPLATES } from '../data/roots'
import type { RootFamily, VerbParadigm } from '../data/roots'
import { BROKEN_PLURAL_PATTERNS, DECLENSION_NOUNS, GRAMMAR_QUIZ_BANK, TEN_VERB_FORMS } from '../data/morphology'
import type { DeclensionNoun, NounDeclensionCell, VerbFormEntry } from '../data/morphology'
import type { Word } from '../data/words'
import { formatPronunciation, speak } from '../lib/audio'
import {
  IconArrowRight,
  IconBook,
  IconCheck,
  IconFlame,
  IconGitBranch,
  IconKeyboard,
  IconLayers,
  IconPuzzle,
  IconRefresh,
  IconSparkles,
  IconVolume,
} from './Icons'

interface Props {
  onPracticeWords: (title: string, words: Word[]) => void
}

type SubTab = 'roots' | 'verbs' | 'declension' | 'tenforms' | 'wazn' | 'quiz'

function NounDeclensionSandbox({ onPracticeWords }: { onPracticeWords: (title: string, words: Word[]) => void }) {
  const [noun, setNoun] = useState<DeclensionNoun>(DECLENSION_NOUNS[0])
  const [gender, setGender] = useState<'masculine' | 'feminine'>('masculine')
  const [defState, setDefState] = useState<'indef' | 'def'>('indef')
  const [activeCell, setActiveCell] = useState<NounDeclensionCell | null>(null)

  const groups = noun[gender][defState]
  const currentCell = activeCell ?? groups[0].nom

  const practiceAll = () => {
    const words: Word[] = groups.flatMap((g) => [
      { ar: g.nom.ar, tr: g.nom.tr, zh: `${noun.zh}·${g.numberLabel.split(' ')[0]}·主格` },
      { ar: g.acc.ar, tr: g.acc.tr, zh: `${noun.zh}·${g.numberLabel.split(' ')[0]}·宾格` },
      { ar: g.gen.ar, tr: g.gen.tr, zh: `${noun.zh}·${g.numberLabel.split(' ')[0]}·属格` },
    ])
    onPracticeWords(`名词变格：${noun.zh}（${gender === 'masculine' ? '阳性' : '阴性'}·${defState === 'indef' ? '泛指' : '定指'}）`, words)
  }

  return (
    <div className="verb-lab">
      <div className="verb-lab__bar glass">
        <div>
          <h2>名词「性 · 数 · 格」三维变形沙盒（الإِعْرَاب وَالتَّثْنِيَة وَالْجَمْع）</h2>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            切换<b>阳性/阴性</b>与<b>泛指/定指</b>，观察同一个名词在<b>单数、双数（2人）、完整复数（3人以上）</b>以及<b>主格、宾格、属格</b>下的词尾规律。点击任意格子试听发音并查看变尾解析。
          </p>
        </div>
        <button className="btn btn--gold btn--sm" onClick={practiceAll}>
          <IconKeyboard size={15} /> 打字特训当前表格 (9 词)
        </button>
      </div>

      {/* Controls Bar */}
      <div className="declension-controls glass">
        <div className="declension-control-group">
          <span className="muted">1. 选择基础名词：</span>
          <div className="verb-lab__picks">
            {DECLENSION_NOUNS.map((n) => (
              <button
                key={n.id}
                className={'btn btn--sm ' + (noun.id === n.id ? 'btn--gold' : 'btn--ghost')}
                onClick={() => {
                  setNoun(n)
                  setActiveCell(null)
                }}
              >
                <span className="ar">{n.baseAr}</span> · {n.zh}
              </button>
            ))}
          </div>
        </div>

        <div className="declension-control-group">
          <span className="muted">2. 性别 (الجِنْس)：</span>
          <div className="seg">
            <button
              className={gender === 'masculine' ? 'on' : ''}
              onClick={() => {
                setGender('masculine')
                setActiveCell(null)
              }}
            >
              阳性 (مُذَكَّر)
            </button>
            <button
              className={gender === 'feminine' ? 'on' : ''}
              onClick={() => {
                setGender('feminine')
                setActiveCell(null)
              }}
            >
              阴性 (مُؤَنَّث · +ة)
            </button>
          </div>
        </div>

        <div className="declension-control-group">
          <span className="muted">3. 指代状态：</span>
          <div className="seg">
            <button
              className={defState === 'indef' ? 'on' : ''}
              onClick={() => {
                setDefState('indef')
                setActiveCell(null)
              }}
            >
              泛指 (نَكِرَة · a/an)
            </button>
            <button
              className={defState === 'def' ? 'on' : ''}
              onClick={() => {
                setDefState('def')
                setActiveCell(null)
              }}
            >
              定指 (مَعْرِفَة · +الـ)
            </button>
          </div>
        </div>
      </div>

      {/* 3x3 Declension Matrix */}
      <div className="table-wrap glass">
        <table className="table verb-table">
          <thead>
            <tr>
              <th>数量 (العَدَد)</th>
              <th>
                <span className="case-pill case-pill--nom">主格 (مَرْفُوع · 起词/主语)</span>
              </th>
              <th>
                <span className="case-pill case-pill--acc">宾格 (مَنْصُوب · 动词宾语)</span>
              </th>
              <th>
                <span className="case-pill case-pill--gen">属格 (مَجْرُور · 介词后/偏次)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.number}>
                <td>
                  <b>{g.numberLabel}</b>
                </td>
                {(['nom', 'acc', 'gen'] as const).map((caseKey) => {
                  const cell = g[caseKey]
                  const isSel = currentCell.ar === cell.ar && currentCell.rule === cell.rule
                  return (
                    <td key={caseKey}>
                      <button
                        className={'declension-cell' + (isSel ? ' is-on' : '')}
                        onClick={() => {
                          setActiveCell(cell)
                          speak(cell.ar)
                        }}
                      >
                        <span className="declension-cell__ar ar">{cell.ar}</span>
                        <span className="word-tr" style={{ fontSize: 13 }}>
                          {cell.tr}
                        </span>
                        <span className={`case-badge case-badge--${caseKey}`}>{cell.suffix}</span>
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active Cell Explanation Callout */}
      <div className="xray__detail glass">
        <button className="xray__detail-ar ar" onClick={() => speak(currentCell.ar)}>
          {currentCell.ar}
        </button>
        <div>
          <div>
            <b>{currentCell.tr}</b> · 音节：<span className="gold-text">{formatPronunciation(currentCell.tr).syllables}</span> · 谐音：【{formatPronunciation(currentCell.tr).zhPhonetic}】 · 词尾标志 <span className="gold-text">{currentCell.suffix}</span>
          </div>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            规律解析：{currentCell.rule}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="btn btn--ghost btn--sm" onClick={() => speak(currentCell.ar, 0.55)}>
            0.55x 慢读
          </button>
          <button className="icon-btn" aria-label="朗读" onClick={() => speak(currentCell.ar)}>
            <IconVolume size={18} />
          </button>
        </div>
      </div>

      {/* Broken Plural Atlas */}
      <div className="verb-lab__bar glass" style={{ marginTop: 12 }}>
        <div>
          <h3>附：破碎复数（جَمْعُ التَّكْسِير）8 种高频词型</h3>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            阿拉伯语约半数常用名词不通过加词尾后缀（ـُونَ / ـَات）构成复数，而是通过<b>改变词干内部元音或增减长音字母</b>构成「破碎复数」。掌握以下 8 种典型词型即可归纳绝大多数常用破碎复数。
          </p>
        </div>
        <button
          className="btn btn--gold btn--sm"
          onClick={() =>
            onPracticeWords(
              '破碎复数 24 组高频单复数练习',
              BROKEN_PLURAL_PATTERNS.flatMap((bp) =>
                bp.pairs.map((p) => ({
                  ar: p.plurAr,
                  tr: p.plurTr,
                  zh: `${p.zh}（复数 ← 单数 ${p.singAr}）`,
                })),
              ),
            )
          }
        >
          <IconKeyboard size={15} /> 打字练习 24 组破碎复数
        </button>
      </div>

      <div className="wazn-grid">
        {BROKEN_PLURAL_PATTERNS.map((bp) => (
          <div key={bp.pattern} className="wazn-card glass">
            <div className="wazn-card__head">
              <span className="wazn-card__ar ar">{bp.pattern}</span>
              <div>
                <b>{bp.tr}</b>
                <div className="muted" style={{ fontSize: 12 }}>
                  {bp.singularHint}
                </div>
              </div>
            </div>
            <p className="muted" style={{ fontSize: 13, margin: '8px 0' }}>
              {bp.desc}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              {bp.pairs.map((p) => (
                <button
                  key={p.plurAr}
                  className="grammar-ex"
                  style={{ padding: '6px 10px' }}
                  onClick={() => speak(`${p.singAr} ، ${p.plurAr}`)}
                >
                  <div className="grammar-ex__main" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <span className="ar" style={{ fontSize: 22 }}>
                      {p.singAr} <span className="muted">←</span> <span className="gold-text">{p.plurAr}</span>
                    </span>
                    <span style={{ fontSize: 13 }}>
                      <b>{p.zh}</b> <small className="muted">({p.plurTr})</small>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TenFormsAtlas({ onPracticeWords }: { onPracticeWords: (title: string, words: Word[]) => void }) {
  const [sel, setSel] = useState<VerbFormEntry>(TEN_VERB_FORMS[0])

  const practiceTenForms = () => {
    const words: Word[] = TEN_VERB_FORMS.map((f) => ({
      ar: f.example.pastAr,
      tr: f.example.tr.split(' ')[0],
      zh: `[${f.form}·${f.coreNuance}] ${f.example.zh}`,
    }))
    onPracticeWords('阿语十式动词代表词特训 (Form I ~ X)', words)
  }

  return (
    <div className="verb-lab">
      <div className="verb-lab__bar glass">
        <div>
          <h2>三母简式与复式「十式动词」词型总表（الأَوْزَانُ الْعَشَرَة · I ~ X 式）</h2>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            以三母简式动词（第 I 式 فَعَلَ）为基础，通过<b>双写中母、延长元音、添加前缀（أَ / تَ / اِنْـ / اِسْتَـ）或中缀（ـتَـ）</b>，派生出第 II 至第 X 式三母复式动词，各自对应明确的语义范畴。
          </p>
        </div>
        <button className="btn btn--gold btn--sm" onClick={practiceTenForms}>
          <IconKeyboard size={15} /> 打字练习十式代表词
        </button>
      </div>

      <div className="tenforms-layout">
        <div className="tenforms-grid">
          {TEN_VERB_FORMS.map((f) => (
            <button
              key={f.roman}
              className={'tenform-card glass' + (sel.roman === f.roman ? ' is-on' : '')}
              onClick={() => {
                setSel(f)
                speak(f.example.pastAr)
              }}
            >
              <div className="tenform-card__top">
                <span className="chapter__num">FORM {f.roman}</span>
                <span className="xray-token__badge">{f.coreNuance}</span>
              </div>
              <div className="tenform-card__ar ar">{f.pastPattern}</div>
              <div className="tenform-card__sub">
                <b>{f.form}</b>
                <small className="muted">例：{f.example.pastAr} ({f.example.zh})</small>
              </div>
            </button>
          ))}
        </div>

        <div className="letter-detail glass" key={sel.roman}>
          <div className="letter-detail__head">
            <button
              className="letter-detail__big ar"
              style={{ fontSize: 44 }}
              onClick={() => speak(sel.example.pastAr)}
              title="点击朗读过去式"
            >
              {sel.pastPattern}
            </button>
            <div>
              <span className="chip chip--on">
                {sel.form} (Form {sel.roman}) · {sel.coreNuance}
              </span>
              <h2 style={{ marginTop: 8 }}>{sel.addition}</h2>
              <p className="muted">{sel.desc}</p>
            </div>
          </div>

          <div className="forms" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="form">
              <span className="form__glyph ar" style={{ fontSize: 30 }}>
                {sel.presentPattern}
              </span>
              <span className="form__label">现在式词型</span>
            </div>
            <div className="form">
              <span className="form__glyph ar" style={{ fontSize: 30 }}>
                {sel.masdarPattern}
              </span>
              <span className="form__label">词源 (المَصْدَر)</span>
            </div>
            <div className="form">
              <span className="form__glyph ar" style={{ fontSize: 30 }}>
                {sel.activeParticiple}
              </span>
              <span className="form__label">主动名词 (اسْم الفَاعِل)</span>
            </div>
          </div>

          <div className="grammar-callout">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>经典派生实例（词根 {sel.example.root}）：</b>
              <span className="word-tr" style={{ fontSize: 14 }}>
                {sel.example.tr}
              </span>
            </div>
            <div className="sunmoon-card__transform ar" style={{ margin: '10px 0' }} dir="rtl">
              <span className="gold-text">{sel.example.pastAr}</span>
              <span className="muted">·</span>
              <span>{sel.example.presentAr}</span>
              <span className="muted">·</span>
              <span style={{ color: 'var(--emerald)' }}>{sel.example.masdarAr}</span>
            </div>
            <p style={{ margin: 0 }}>
              <b>词义：</b>
              {sel.example.zh} —— <span className="muted">{sel.example.contrast}</span>
            </p>
          </div>

          <button className="example" onClick={() => speak(`${sel.example.pastAr} ، ${sel.example.presentAr} ، ${sel.example.masdarAr}`)}>
            <span className="ar">{sel.example.pastAr}</span>
            <span>连读：过去式 · 现在式 · 词源（动名词）</span>
            <IconVolume size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

const QUIZ_CATEGORIES = ['全部', '句法变格', '正偏与定语', '动词变位', '词根与词法'] as const
type QuizCategory = (typeof QUIZ_CATEGORIES)[number]

function GrammarQuizLab() {
  const [cat, setCat] = useState<QuizCategory>('全部')
  const [qIdx, setQIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0, best: 0 })

  const pool = cat === '全部' ? GRAMMAR_QUIZ_BANK : GRAMMAR_QUIZ_BANK.filter((item) => item.category === cat)
  const q = pool[qIdx % pool.length]
  const isCorrect = picked === q.correctIndex
  const fullAr = [q.sentenceBefore, q.options[q.correctIndex].ar, q.sentenceAfter].filter(Boolean).join(' ')

  const choose = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    const ok = i === q.correctIndex
    speak(q.options[q.correctIndex].ar)
    setScore((s) => {
      const streak = ok ? s.streak + 1 : 0
      return { right: s.right + (ok ? 1 : 0), total: s.total + 1, streak, best: Math.max(s.best, streak) }
    })
  }

  const nextQ = () => {
    setPicked(null)
    setQIdx((idx) => (idx + 1) % pool.length)
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input,textarea,select')) return
      const n = Number(e.key)
      if (n >= 1 && n <= q.options.length && picked === null) {
        e.preventDefault()
        choose(n - 1)
      } else if (e.key === 'Enter' && picked !== null) {
        e.preventDefault()
        nextQ()
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  })

  return (
    <div className="quiz glass" style={{ maxWidth: 780, padding: 32 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 14 }}>
        {QUIZ_CATEGORIES.map((c) => {
          const count = c === '全部' ? GRAMMAR_QUIZ_BANK.length : GRAMMAR_QUIZ_BANK.filter((x) => x.category === c).length
          return (
            <button
              key={c}
              className={'chip' + (cat === c ? ' chip--on' : '')}
              onClick={() => {
                setCat(c)
                setQIdx(0)
                setPicked(null)
              }}
            >
              {c} ({count})
            </button>
          )
        })}
      </div>

      <div className="quiz__score">
        <span className="chip chip--on">{q.category}</span>
        <span>
          题目 {(qIdx % pool.length) + 1}/{pool.length}
        </span>
        <span>
          正确 {score.right}/{score.total}
        </span>
        <span>
          <IconFlame size={15} /> 连对 {score.streak}（最高 {score.best}）
        </span>
      </div>

      <h3 style={{ margin: '16px 0 8px', fontSize: 19 }}>{q.promptZh}</h3>

      <div className="grammar-quiz-sentence ar" dir="rtl">
        {q.sentenceBefore && <span>{q.sentenceBefore} </span>}
        <span className={'grammar-quiz-blank ' + (picked !== null ? 'is-filled' : '')}>
          {picked !== null ? q.options[q.correctIndex].ar : q.blankPlaceholder}
        </span>
        {q.sentenceAfter && <span> {q.sentenceAfter}</span>}
      </div>

      <div className="quiz__options" style={{ marginTop: 18 }}>
        {q.options.map((opt, i) => {
          const state =
            picked === null ? '' : i === q.correctIndex ? ' is-right' : i === picked ? ' is-wrong' : ' is-dim'
          return (
            <button key={i} className={'quiz__opt' + state} onClick={() => choose(i)}>
              <kbd>{i + 1}</kbd>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                <span className="ar" style={{ fontSize: 28 }}>
                  {opt.ar}
                </span>
                <small className="muted">
                  {opt.tr} {opt.label ? `· ${opt.label}` : ''}
                </small>
              </div>
              {picked !== null && i === q.correctIndex && <IconCheck size={18} />}
            </button>
          )
        })}
      </div>

      {picked !== null && (
        <div className="grammar-quiz-explain" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'left', flex: 1, minWidth: 240 }}>
            <b style={{ color: isCorrect ? 'var(--emerald)' : 'var(--gold-2)' }}>
              {isCorrect ? '回答正确！' : `正确答案：${q.options[q.correctIndex].ar}`}
            </b>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>
              {q.explanation}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--sm" onClick={() => speak(fullAr)}>
              <IconVolume size={15} /> 朗读答案
            </button>
            <button className="btn btn--gold btn--sm" onClick={nextQ}>
              下一题 (Enter) <IconArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function RootExplorer({ onPracticeWords }: Props) {
  const [sub, setSub] = useState<SubTab>('roots')
  const [selRoot, setSelRoot] = useState<RootFamily>(ROOT_FAMILIES[0])
  const [selVerb, setSelVerb] = useState<VerbParadigm>(VERB_PARADIGMS[0])

  return (
    <section className="letters">
      <div className="seg" role="tablist" aria-label="词法与语法实验室">
        <button role="tab" aria-selected={sub === 'roots'} className={sub === 'roots' ? 'on' : ''} onClick={() => setSub('roots')}>
          <IconGitBranch size={15} /> 三母词根魔方
        </button>
        <button
          role="tab"
          aria-selected={sub === 'declension'}
          className={sub === 'declension' ? 'on' : ''}
          onClick={() => setSub('declension')}
        >
          <IconBook size={15} /> 名词性·数·格沙盒
        </button>
        <button
          role="tab"
          aria-selected={sub === 'tenforms'}
          className={sub === 'tenforms' ? 'on' : ''}
          onClick={() => setSub('tenforms')}
        >
          <IconSparkles size={15} /> 十式动词图鉴 (I~X)
        </button>
        <button role="tab" aria-selected={sub === 'verbs'} className={sub === 'verbs' ? 'on' : ''} onClick={() => setSub('verbs')}>
          <IconRefresh size={15} /> 动词人称变位表
        </button>
        <button role="tab" aria-selected={sub === 'wazn'} className={sub === 'wazn' ? 'on' : ''} onClick={() => setSub('wazn')}>
          <IconLayers size={15} /> 派生词型 (الوَزْن)
        </button>
        <button role="tab" aria-selected={sub === 'quiz'} className={sub === 'quiz' ? 'on' : ''} onClick={() => setSub('quiz')}>
          <IconPuzzle size={15} /> 语法与变位测验
        </button>
      </div>

      {sub === 'declension' && <NounDeclensionSandbox onPracticeWords={onPracticeWords} />}
      {sub === 'tenforms' && <TenFormsAtlas onPracticeWords={onPracticeWords} />}
      {sub === 'quiz' && <GrammarQuizLab />}

      {sub === 'roots' && (
        <div className="root-layout">
          <div className="root-selector" role="listbox" aria-label="三母词根列表">
            {ROOT_FAMILIES.map((r) => (
              <button
                key={r.id}
                role="option"
                aria-selected={selRoot.id === r.id}
                className={'root-pill glass' + (selRoot.id === r.id ? ' is-on' : '')}
                onClick={() => {
                  setSelRoot(r)
                  speak(r.words[0].ar)
                }}
              >
                <span className="root-pill__ar ar">{r.display}</span>
                <b>{r.coreMeaning}</b>
                <small className="muted">{r.words.length} 词</small>
              </button>
            ))}
          </div>

          <div className="root-stage glass" key={selRoot.id}>
            <div className="root-stage__head">
              <div className="root-medallion" dir="rtl" aria-label={`词根字母 ${selRoot.display}`}>
                {selRoot.letters.map((ch, i) => (
                  <span key={i} className="root-medallion__char ar">
                    {ch}
                  </span>
                ))}
              </div>
              <div className="root-stage__info">
                <span className="chip chip--on">核心三母词根 · الجَذْر</span>
                <h2 style={{ marginTop: 6 }}>{selRoot.coreMeaning}</h2>
                <p className="muted">{selRoot.story}</p>
              </div>
              <button
                className="btn btn--gold"
                onClick={() => onPracticeWords(`词根特训：${selRoot.display}（${selRoot.coreMeaning}）`, selRoot.words)}
              >
                <IconKeyboard size={17} /> 打字特训本组同根词
              </button>
            </div>

            <div className="derived-grid">
              {selRoot.words.map((w) => {
                const pron = formatPronunciation(w.tr)
                return (
                  <button key={w.ar} className="derived-card" onClick={() => speak(w.ar)}>
                    <div className="derived-card__top">
                      <span className="xray-token__badge">{w.waznRole}</span>
                      <span className="ar muted" style={{ fontSize: 16 }}>
                        词型 {w.wazn}
                      </span>
                    </div>
                    <div className="derived-card__ar ar">{w.ar}</div>
                    <div className="word-tr" style={{ fontSize: 16 }}>
                      {pron.syllables}
                    </div>
                    <small className="muted" style={{ fontSize: 12 }}>
                      谐音：{pron.zhPhonetic}
                    </small>
                    <div className="derived-card__zh">
                      <b>{w.zh}</b>
                      <IconVolume size={16} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {sub === 'verbs' && (
        <div className="verb-lab">
          <div className="verb-lab__bar glass">
            <div>
              <h2>过去式 vs 现在式人称变位表</h2>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                记住规律：<b>过去式看词尾后缀</b>（ـتُ / ـتَ / ـتِ），<b>现在式看词首前缀</b>（أَ / نَ / تَ / يَ）。点击任意格子即可朗读。
              </p>
            </div>
            <div className="verb-lab__picks">
              {VERB_PARADIGMS.map((v) => (
                <button
                  key={v.id}
                  className={'btn btn--sm ' + (selVerb.id === v.id ? 'btn--gold' : 'btn--ghost')}
                  onClick={() => setSelVerb(v)}
                >
                  <span className="ar">{v.baseAr}</span> · {v.meaning}
                </button>
              ))}
              <button
                className="btn btn--sm"
                onClick={() =>
                  onPracticeWords(
                    `动词变位：${selVerb.meaning}`,
                    selVerb.rows.flatMap((r) => [
                      { ar: r.pastAr, tr: r.pastTr, zh: `${r.pronounZh}（过去）· ${selVerb.meaning}` },
                      { ar: r.presentAr, tr: r.presentTr, zh: `${r.pronounZh}（现在）· ${selVerb.meaning}` },
                    ]),
                  )
                }
              >
                <IconKeyboard size={15} /> 打字练习本表变位
              </button>
            </div>
          </div>

          <div className="table-wrap glass">
            <table className="table verb-table">
              <thead>
                <tr>
                  <th>人称代词</th>
                  <th>过去式（الْمَاضِي · 变词尾）</th>
                  <th>过去词尾标志</th>
                  <th>现在式（الْمُضَارِع · 变词首）</th>
                  <th>现在前缀标志</th>
                </tr>
              </thead>
              <tbody>
                {selVerb.rows.map((r) => (
                  <tr key={r.pronounAr}>
                    <td>
                      <button className="verb-cell" onClick={() => speak(r.pronounAr)}>
                        <span className="ar gold-text" style={{ fontSize: 24 }}>
                          {r.pronounAr}
                        </span>
                        <span>
                          {r.pronounZh} ({r.pronounTr})
                        </span>
                      </button>
                    </td>
                    <td>
                      <button className="verb-cell" onClick={() => speak(r.pastAr)}>
                        <span className="ar" style={{ fontSize: 28 }}>
                          {r.pastAr}
                        </span>
                        <small className="muted">{r.pastTr}</small>
                        <IconVolume size={14} />
                      </button>
                    </td>
                    <td>
                      <span className="xray-token__badge">{r.pastSuffix}</span>
                    </td>
                    <td>
                      <button className="verb-cell" onClick={() => speak(r.presentAr)}>
                        <span className="ar" style={{ fontSize: 28, color: 'var(--emerald)' }}>
                          {r.presentAr}
                        </span>
                        <small className="muted">{r.presentTr}</small>
                        <IconVolume size={14} />
                      </button>
                    </td>
                    <td>
                      <span className="xray-token__badge">{r.presentAffix}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sub === 'wazn' && (
        <div className="wazn-lab">
          <div className="verb-lab__bar glass">
            <div>
              <h2>什么是「词型（الْوَزْن Wazn）」？</h2>
              <p className="muted" style={{ marginTop: 6 }}>
                阿拉伯语语法学以 <b>ف - ع - ل (f - ʿ - l，「做」)</b> 三个字母作为词型范本：
                <b>ف</b> 代表第一词根字母，<b>ع</b> 代表第二词根字母，<b>ل</b> 代表第三词根字母。掌握以下 {WAZN_TEMPLATES.length} 个核心派生词型，即可从一个三母词根推导出整组同族词汇。
              </p>
            </div>
            <button
              className="btn btn--gold btn--sm"
              onClick={() =>
                onPracticeWords(
                  '十二种常用词型代表词',
                  WAZN_TEMPLATES.map((w) => {
                    const arWord = w.example.split(' ')[0]
                    return { ar: arWord, tr: w.tr, zh: `[${w.role}] ${w.example}` }
                  }),
                )
              }
            >
              <IconKeyboard size={15} /> 打字练习 12 词型代表词
            </button>
          </div>

          {/* Interactive Root x Wazn Forge */}
          <div className="glass" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <b>三母词根 × 词型推演台：将词根「{selRoot.display}（{selRoot.coreMeaning}）」套入不同词型</b>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
                  切换词根，观察 ف (<b>{selRoot.letters[0]}</b>) · ع (<b>{selRoot.letters[1]}</b>) · ل (<b>{selRoot.letters[2]}</b>) 如何按词型规则派生词汇：
                </p>
              </div>
              <div className="verb-lab__picks">
                {ROOT_FAMILIES.slice(0, 8).map((r) => (
                  <button
                    key={r.id}
                    className={'btn btn--sm ' + (selRoot.id === r.id ? 'btn--gold' : 'btn--ghost')}
                    onClick={() => setSelRoot(r)}
                  >
                    <span className="ar">{r.display}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="derived-grid" style={{ marginTop: 14 }}>
              {selRoot.words.map((w) => {
                const pron = formatPronunciation(w.tr)
                return (
                  <button key={w.ar} className="derived-card" onClick={() => speak(w.ar)}>
                    <div className="derived-card__top">
                      <span className="xray-token__badge">{w.waznRole}</span>
                      <span className="ar gold-text" style={{ fontSize: 18 }}>
                        {w.wazn}
                      </span>
                    </div>
                    <div className="derived-card__ar ar">{w.ar}</div>
                    <div className="word-tr" style={{ fontSize: 15 }}>
                      {pron.syllables}
                    </div>
                    <small className="muted" style={{ fontSize: 12 }}>
                      谐音：{pron.zhPhonetic}
                    </small>
                    <div className="derived-card__zh">
                      <b>{w.zh}</b>
                      <IconVolume size={15} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="wazn-grid">
            {WAZN_TEMPLATES.map((w) => {
              const sampleAr = w.example.split(' ')[0]
              return (
                <button
                  key={w.pattern}
                  className="wazn-card glass"
                  style={{ textAlign: 'left' }}
                  onClick={() => speak(sampleAr)}
                >
                  <div className="wazn-card__head">
                    <span className="wazn-card__ar ar">{w.pattern}</span>
                    <div>
                      <b>{w.role}</b>
                      <div className="word-tr" style={{ fontSize: 15 }}>
                        {w.tr}
                      </div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                      <IconVolume size={16} />
                    </span>
                  </div>
                  <p className="muted" style={{ fontSize: 14, margin: '8px 0' }}>
                    {w.desc}
                  </p>
                  <div className="wazn-card__ex">例：{w.example}（点击朗读）</div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
