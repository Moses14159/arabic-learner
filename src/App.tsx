import { useState } from 'react'
import { ALL_WORDS, CHAPTERS } from './data/words'
import type { Word } from './data/words'
import { shuffle } from './lib/arabic'
import { DEFAULT_SETTINGS, useStored, useStoredList } from './lib/storage'
import type { MistakeBook, SessionRecord } from './lib/storage'
import { TypingPractice } from './components/TypingPractice'
import { Letters } from './components/Letters'
import { Mistakes, Stats } from './components/Panels'

type Tab = 'typing' | 'letters' | 'mistakes' | 'stats'
type Practice = { title: string; words: Word[]; chapter?: number; id: number } | null

const TABS: { id: Tab; label: string; ar: string }[] = [
  { id: 'typing', label: '打字背词', ar: 'كِتَابَة' },
  { id: 'letters', label: '字母表', ar: 'حُرُوف' },
  { id: 'mistakes', label: '错题本', ar: 'أَخْطَاء' },
  { id: 'stats', label: '统计', ar: 'إِحْصَاء' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('typing')
  const [practice, setPractice] = useState<Practice>(null)
  const [settings, setSettings] = useStored('qalam.settings', DEFAULT_SETTINGS)
  const [book, setBook] = useStored<MistakeBook>('qalam.mistakes', {})
  const [sessions, setSessions] = useStoredList<SessionRecord>('qalam.sessions')

  const bestByTitle = new Map<string, number>()
  for (const s of sessions) bestByTitle.set(s.title, Math.max(bestByTitle.get(s.title) ?? 0, s.accuracy))

  const startChapter = (i: number) => {
    const c = CHAPTERS[i]
    setPractice({ title: c.title, words: c.words, chapter: i, id: Date.now() })
  }

  const recordMistake = (w: Word) =>
    setBook((b) => ({ ...b, [w.ar]: { ...w, count: (b[w.ar]?.count ?? 0) + 1, last: Date.now() } }))

  return (
    <div className="app">
      <div className="bg-pattern" aria-hidden />
      <header className="header">
        <button id="logo" className="logo" onClick={() => { setTab('typing'); setPractice(null) }}>
          <span className="logo__mark ar">قَلَم</span>
          <span className="logo__text">
            <b>Qalam</b>
            <small>阿语打字背词</small>
          </span>
        </button>
        <nav className="tabs">
          {TABS.map((t) => (
            <button id={`tab-${t.id}`} key={t.id} className={'tab' + (tab === t.id ? ' tab--on' : '')} onClick={(e) => { setTab(t.id); e.currentTarget.blur() }}>
              <span>{t.label}</span>
              <small className="ar">{t.ar}</small>
              {t.id === 'mistakes' && Object.keys(book).length > 0 && <i className="badge">{Object.keys(book).length}</i>}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {tab === 'typing' &&
          (practice ? (
            <TypingPractice
              key={practice.id}
              title={practice.title}
              words={practice.words}
              settings={settings}
              setSettings={setSettings}
              onMistake={recordMistake}
              onSession={(r) => setSessions((s) => [...s, r].slice(-500))}
              onBack={() => setPractice(null)}
              onNext={practice.chapter != null && practice.chapter < CHAPTERS.length - 1 ? () => startChapter(practice.chapter! + 1) : undefined}
            />
          ) : (
            <section className="home">
              <div className="hero">
                <h1>
                  用键盘学阿拉伯语
                  <span className="hero__ar ar">تَعَلَّمِ الْعَرَبِيَّةَ</span>
                </h1>
                <p className="muted">
                  边打字边记单词：听发音、看元音符号、认字母形态。英文键盘直接用，按键位置对应标准阿语键盘。
                </p>
                <div className="hero__actions">
                  <button id="btn-start-alphabet" className="btn btn--gold" onClick={() => startChapter(0)}>从字母开始</button>
                  <button id="btn-random-review" className="btn" onClick={() => setPractice({ title: '随机复习', words: shuffle(ALL_WORDS).slice(0, 20), id: Date.now() })}>
                    随机 20 词
                  </button>
                </div>
              </div>
              <h2 className="section-title">章节</h2>
              <div className="chapters">
                {CHAPTERS.map((c, i) => {
                  const best = bestByTitle.get(c.title)
                  return (
                    <button id={`chapter-${c.id}`} key={c.id} className="chapter glass" onClick={() => startChapter(i)} style={{ animationDelay: `${i * 40}ms` }}>
                      <span className="chapter__icon">{c.icon}</span>
                      <span className="chapter__ar ar">{c.titleAr}</span>
                      <b>{c.title}</b>
                      <small className="muted">{c.words.length} 个{i === 0 ? '字母' : '词'}</small>
                      {best != null && <span className="chapter__best">最佳 {best}%</span>}
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        {tab === 'letters' && <Letters />}
        {tab === 'mistakes' && (
          <Mistakes
            book={book}
            setBook={setBook}
            onPractice={(words) => {
              setPractice({ title: '错词练习', words, id: Date.now() })
              setTab('typing')
            }}
          />
        )}
        {tab === 'stats' && <Stats sessions={sessions} onClear={() => setSessions([])} />}
      </main>
      <footer className="footer muted">Qalam · 灵感来自 Qwerty Learner · 数据仅存于本地</footer>
    </div>
  )
}
