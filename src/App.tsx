import { useState } from 'react'
import { ALL_WORDS, CHAPTERS } from './data/words'
import type { Word } from './data/words'
import type { CourseLesson, LessonSentence } from './data/grammar'
import { shuffle } from './lib/arabic'
import { DEFAULT_SETTINGS, useStored, useStoredList } from './lib/storage'
import type { MistakeBook, SessionRecord } from './lib/storage'
import { TypingPractice } from './components/TypingPractice'
import { SentencePractice } from './components/SentencePractice'
import { CourseMap } from './components/CourseMap'
import { RootExplorer } from './components/RootExplorer'
import { Letters } from './components/Letters'
import { Mistakes, Stats } from './components/Panels'

type Tab = 'course' | 'roots' | 'typing' | 'letters' | 'mistakes' | 'stats'
type Practice = { title: string; words: Word[]; chapter?: number; id: number } | null
type SentenceJob = { lessonId: string; title: string; sentences: LessonSentence[]; id: number } | null

const TABS: { id: Tab; label: string; ar: string }[] = [
  { id: 'course', label: '零到一课程', ar: 'مَنْهَج' },
  { id: 'roots', label: '词根与变位', ar: 'جُذُور' },
  { id: 'typing', label: '词库打字', ar: 'كَلِمَات' },
  { id: 'letters', label: '字母与拼读', ar: 'حُرُوف' },
  { id: 'mistakes', label: '错题本', ar: 'أَخْطَاء' },
  { id: 'stats', label: '统计', ar: 'إِحْصَاء' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('course')
  const [practice, setPractice] = useState<Practice>(null)
  const [sentenceJob, setSentenceJob] = useState<SentenceJob>(null)
  const [settings, setSettings] = useStored('qalam.settings', DEFAULT_SETTINGS)
  const [book, setBook] = useStored<MistakeBook>('qalam.mistakes', {})
  const [sessions, setSessions] = useStoredList<SessionRecord>('qalam.sessions')
  const [lessonScores, setLessonScores] = useStored<Record<string, number>>('qalam.lessons', {})

  const bestByTitle = new Map<string, number>()
  for (const s of sessions) bestByTitle.set(s.title, Math.max(bestByTitle.get(s.title) ?? 0, s.accuracy))

  const startChapter = (i: number) => {
    const c = CHAPTERS[i]
    setPractice({ title: c.title, words: c.words, chapter: i, id: Date.now() })
    setTab('typing')
  }

  const startCustomTyping = (title: string, words: Word[]) => {
    setPractice({ title, words, id: Date.now() })
    setTab('typing')
  }

  const startLessonSentences = (lesson: CourseLesson, sentences: LessonSentence[]) => {
    setSentenceJob({ lessonId: lesson.id, title: `${lesson.number} · ${lesson.title}`, sentences, id: Date.now() })
    setTab('course')
  }

  const recordMistake = (w: Word) =>
    setBook((b) => ({ ...b, [w.ar]: { ...w, count: (b[w.ar]?.count ?? 0) + 1, last: Date.now() } }))

  return (
    <div className="app">
      <div className="bg-pattern" aria-hidden />
      <header className="header">
        <button
          id="logo"
          className="logo"
          onClick={() => {
            setTab('course')
            setPractice(null)
            setSentenceJob(null)
          }}
        >
          <span className="logo__mark ar">قَلَم</span>
          <span className="logo__text">
            <b>Qalam</b>
            <small>从零到一学阿语</small>
          </span>
        </button>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              id={`tab-${t.id}`}
              key={t.id}
              className={'tab' + (tab === t.id ? ' tab--on' : '')}
              onClick={(e) => {
                setTab(t.id)
                if (t.id === 'course') setSentenceJob(null)
                if (t.id === 'typing') setPractice(null)
                e.currentTarget.blur()
              }}
            >
              <span>{t.label}</span>
              <small className="ar">{t.ar}</small>
              {t.id === 'mistakes' && Object.keys(book).length > 0 && <i className="badge">{Object.keys(book).length}</i>}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {tab === 'course' &&
          (sentenceJob ? (
            <SentencePractice
              key={sentenceJob.id}
              title={sentenceJob.title}
              sentences={sentenceJob.sentences}
              settings={settings}
              setSettings={setSettings}
              onComplete={(acc) => {
                setLessonScores((prev) => ({
                  ...prev,
                  [sentenceJob.lessonId]: Math.max(prev[sentenceJob.lessonId] ?? 0, acc),
                }))
                setSessions((s) => [
                  ...s,
                  {
                    at: Date.now(),
                    title: sentenceJob.title,
                    words: sentenceJob.sentences.length * 4,
                    seconds: 60,
                    accuracy: acc,
                    wpm: 15,
                  },
                ])
              }}
              onBack={() => setSentenceJob(null)}
            />
          ) : (
            <CourseMap
              lessonScores={lessonScores}
              onStartWordTyping={startCustomTyping}
              onStartSentencePractice={startLessonSentences}
              onJumpTab={(target) => setTab(target)}
            />
          ))}

        {tab === 'roots' && <RootExplorer onPracticeWords={startCustomTyping} />}

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
              onNext={
                practice.chapter != null && practice.chapter < CHAPTERS.length - 1
                  ? () => startChapter(practice.chapter! + 1)
                  : undefined
              }
            />
          ) : (
            <section className="home">
              <div className="hero">
                <h1>
                  阿语主题词库盲打
                  <span className="hero__ar ar">تَدْرِيبُ الْكَلِمَاتِ</span>
                </h1>
                <p className="muted">
                  参考 Qwerty Learner 的肌肉记忆背词法：听发音、看元音符号、认字母连写。直接使用普通英文键盘即可盲打。
                </p>
                <div className="hero__actions">
                  <button id="btn-start-alphabet" className="btn btn--gold" onClick={() => startChapter(0)}>
                    从 28 个字母开始热身
                  </button>
                  <button
                    id="btn-random-review"
                    className="btn"
                    onClick={() => setPractice({ title: '随机 20 词复习', words: shuffle(ALL_WORDS).slice(0, 20), id: Date.now() })}
                  >
                    🎲 随机抽取 20 词
                  </button>
                </div>
              </div>
              <h2 className="section-title">12 大主题章节（共 {ALL_WORDS.length + 28} 词）</h2>
              <div className="chapters">
                {CHAPTERS.map((c, i) => {
                  const best = bestByTitle.get(c.title)
                  return (
                    <button
                      id={`chapter-${c.id}`}
                      key={c.id}
                      className="chapter glass"
                      onClick={() => startChapter(i)}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <span className="chapter__icon">{c.icon}</span>
                      <span className="chapter__ar ar">{c.titleAr}</span>
                      <b>{c.title}</b>
                      <small className="muted">
                        {c.words.length} 个{i === 0 ? '字母' : '词'}
                      </small>
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
            onPractice={(words) => startCustomTyping('错词专项强化', words)}
          />
        )}

        {tab === 'stats' && <Stats sessions={sessions} onClear={() => setSessions([])} />}
      </main>
      <footer className="footer muted">
        Qalam · 融合 Earthworm 连词成句 + Qwerty Learner 肌肉记忆 + 麦地那阿语语法体系 · 数据仅存于本地
      </footer>
    </div>
  )
}
