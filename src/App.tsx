import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ALL_WORDS, CHAPTERS } from './data/words'
import type { Word } from './data/words'
import type { CourseLesson, LessonSentence } from './data/grammar'
import { shuffle, stripMarks } from './lib/arabic'
import { speak } from './lib/audio'
import { DEFAULT_SETTINGS, useStored, useStoredList } from './lib/storage'
import type { MistakeBook, SessionRecord } from './lib/storage'
import { TypingPractice } from './components/TypingPractice'
import { SentencePractice } from './components/SentencePractice'
import { CourseMap } from './components/CourseMap'
import { RootExplorer } from './components/RootExplorer'
import { Letters } from './components/Letters'
import { Mistakes, Stats } from './components/Panels'
import {
  IconBook,
  IconBookmark,
  IconChart,
  IconCompass,
  IconGitBranch,
  IconKeyboard,
  IconMoon,
  IconRefresh,
  IconSparkles,
  IconSun,
} from './components/Icons'

type Tab = 'course' | 'roots' | 'typing' | 'letters' | 'mistakes' | 'stats'
type Practice = { title: string; words: Word[]; chapter?: number; id: number } | null
type SentenceJob = { lessonId: string; title: string; sentences: LessonSentence[]; id: number } | null

const TABS: { id: Tab; label: string; ar: string; icon: ReactNode }[] = [
  { id: 'course', label: '零到一课程', ar: 'مَنْهَج', icon: <IconCompass size={16} /> },
  { id: 'roots', label: '词根与变位', ar: 'جُذُور', icon: <IconGitBranch size={16} /> },
  { id: 'typing', label: '词库打字', ar: 'كَلِمَات', icon: <IconKeyboard size={16} /> },
  { id: 'letters', label: '字母与拼读', ar: 'حُرُوف', icon: <IconBook size={16} /> },
  { id: 'mistakes', label: '错题本', ar: 'أَخْطَاء', icon: <IconBookmark size={16} /> },
  { id: 'stats', label: '统计', ar: 'إِحْصَاء', icon: <IconChart size={16} /> },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('course')
  const [practice, setPractice] = useState<Practice>(null)
  const [sentenceJob, setSentenceJob] = useState<SentenceJob>(null)
  const [settings, setSettings] = useStored('qalam.settings', DEFAULT_SETTINGS)
  const [book, setBook] = useStored<MistakeBook>('qalam.mistakes', {})
  const [sessions, setSessions] = useStoredList<SessionRecord>('qalam.sessions')
  const [lessonScores, setLessonScores] = useStored<Record<string, number>>('qalam.lessons', {})
  const [wordQuery, setWordQuery] = useState('')
  const [theme, setTheme] = useState<'night' | 'light' | 'emerald'>(() => {
    const saved = localStorage.getItem('qalam.theme')
    if (saved === 'light' || saved === 'emerald' || saved === 'night') return saved
    return 'night'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('qalam.theme', theme)
  }, [theme])

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
      <div className="bg-pattern" aria-hidden="true" />
      <header className="header">
        <button
          id="logo"
          className="logo"
          aria-label="回到首页零到一课程"
          onClick={() => {
            setTab('course')
            setPractice(null)
            setSentenceJob(null)
          }}
        >
          <span className="logo__mark ar" aria-hidden="true">قَلَم</span>
          <span className="logo__text">
            <b>Qalam</b>
            <small>从零到一学阿语</small>
          </span>
        </button>

        <nav className="tabs" aria-label="主导航">
          {TABS.map((t) => (
            <button
              id={`tab-${t.id}`}
              key={t.id}
              aria-current={tab === t.id ? 'page' : undefined}
              className={'tab' + (tab === t.id ? ' tab--on' : '')}
              onClick={(e) => {
                setTab(t.id)
                if (t.id === 'course') setSentenceJob(null)
                if (t.id === 'typing') setPractice(null)
                e.currentTarget.blur()
              }}
            >
              <span className="tab__top">
                {t.icon}
                <span>{t.label}</span>
              </span>
              <small className="ar">{t.ar}</small>
              {t.id === 'mistakes' && Object.keys(book).length > 0 && (
                <i className="badge" aria-label={`${Object.keys(book).length} 个待复习错词`}>
                  {Object.keys(book).length}
                </i>
              )}
            </button>
          ))}
        </nav>

        <div className="theme-switcher" role="group" aria-label="配色主题切换">
          <button
            id="btn-theme-night"
            className={'theme-pill' + (theme === 'night' ? ' is-on' : '')}
            title="星夜蓝金 · Arabian Nights"
            aria-label="切换为星夜蓝金配色"
            onClick={(e) => {
              setTheme('night')
              e.currentTarget.blur()
            }}
          >
            <IconMoon size={14} />
            <span>星夜</span>
          </button>
          <button
            id="btn-theme-light"
            className={'theme-pill' + (theme === 'light' ? ' is-on' : '')}
            title="羊皮纸墨香 · Andalusian Daylight"
            aria-label="切换为羊皮纸浅色配色"
            onClick={(e) => {
              setTheme('light')
              e.currentTarget.blur()
            }}
          >
            <IconSun size={14} />
            <span>浅色</span>
          </button>
          <button
            id="btn-theme-emerald"
            className={'theme-pill' + (theme === 'emerald' ? ' is-on' : '')}
            title="翡翠流金 · Oasis Emerald"
            aria-label="切换为翡翠流金配色"
            onClick={(e) => {
              setTheme('emerald')
              e.currentTarget.blur()
            }}
          >
            <IconSparkles size={14} />
            <span>翡翠</span>
          </button>
        </div>
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
                    <IconSparkles size={17} /> 从 28 个字母开始热身
                  </button>
                  <button
                    id="btn-random-review"
                    className="btn"
                    onClick={() => setPractice({ title: '随机 25 词闪电复习', words: shuffle(ALL_WORDS).slice(0, 25), id: Date.now() })}
                  >
                    <IconRefresh size={17} /> 随机抽取 25 词
                  </button>
                </div>
              </div>

              {/* Live Dictionary Search Bar */}
              <div className="verb-lab__bar glass" style={{ marginBottom: 18 }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <b>全库词典检索（共 {ALL_WORDS.length} 词）</b>
                  <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
                    支持输入中文释义、拉丁转写或阿语字母快速查词，点击词卡即可朗读发音或一键加入盲打。
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="search"
                    value={wordQuery}
                    onChange={(e) => setWordQuery(e.target.value)}
                    placeholder="搜索中文 / 音标 / 阿语（如：学校、kitab、مسجد）…"
                    style={{
                      padding: '9px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border-hi)',
                      background: 'var(--surface-inset)',
                      color: 'var(--text)',
                      font: 'inherit',
                      minWidth: 280,
                    }}
                  />
                  {wordQuery.trim() && (
                    <button className="btn btn--ghost btn--sm" onClick={() => setWordQuery('')}>
                      清空
                    </button>
                  )}
                </div>
              </div>

              {wordQuery.trim() ? (
                (() => {
                  const q = wordQuery.trim().toLowerCase()
                  const matches = ALL_WORDS.filter(
                    (w) =>
                      w.zh.toLowerCase().includes(q) ||
                      w.tr.toLowerCase().includes(q) ||
                      w.ar.includes(q) ||
                      stripMarks(w.ar).includes(stripMarks(q)),
                  )
                  return (
                    <div style={{ marginBottom: 28 }}>
                      <div className="lesson-sec-head" style={{ marginBottom: 12 }}>
                        <h2 className="section-title">搜索结果：找到 {matches.length} 个词</h2>
                        {matches.length > 0 && (
                          <button
                            className="btn btn--gold btn--sm"
                            onClick={() => startCustomTyping(`搜索特训：${wordQuery.trim()}`, matches.slice(0, 40))}
                          >
                            <IconKeyboard size={15} /> 盲打这组搜索结果 ({Math.min(matches.length, 40)})
                          </button>
                        )}
                      </div>
                      <div className="vocab-grid">
                        {matches.slice(0, 60).map((w, idx) => (
                          <button key={`${w.ar}-${idx}`} className="vocab-item glass" onClick={() => speak(w.ar)}>
                            <span className="vocab-item__ar ar">{w.ar}</span>
                            <span className="word-tr" style={{ fontSize: 13 }}>
                              {w.tr}
                            </span>
                            <b>{w.zh}</b>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })()
              ) : null}

              <h2 className="section-title">{CHAPTERS.length} 大主题章节（共 {ALL_WORDS.length + 28} 词）</h2>
              <div className="chapters">
                {CHAPTERS.map((c, i) => {
                  const best = bestByTitle.get(c.title)
                  return (
                    <button
                      id={`chapter-${c.id}`}
                      key={c.id}
                      className="chapter glass"
                      onClick={() => startChapter(i)}
                      style={{ animationDelay: `${i * 35}ms` }}
                    >
                      <span className="chapter__num">CH.{String(i + 1).padStart(2, '0')}</span>
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
