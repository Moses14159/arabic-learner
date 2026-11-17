import { lazy, Suspense, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ALL_WORDS, CHAPTERS } from './data/words'
import type { Word } from './data/words'
import type { CourseLesson, LessonSentence } from './data/grammar'
import { shuffle, stripMarks } from './lib/arabic'
import { formatPronunciation, getVoiceRate, setVoiceRate, speak } from './lib/audio'
import { DEFAULT_SETTINGS, useStored, useStoredList } from './lib/storage'
import type { MistakeBook, SessionRecord } from './lib/storage'
import { Mistakes, Stats } from './components/Panels'
import { Account } from './components/Account'
import { useCloud } from './lib/cloud'
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
  IconVolume,
} from './components/Icons'

const TypingPractice = lazy(() => import('./components/TypingPractice').then((module) => ({ default: module.TypingPractice })))
const SentencePractice = lazy(() => import('./components/SentencePractice').then((module) => ({ default: module.SentencePractice })))
const CourseMap = lazy(() => import('./components/CourseMap').then((module) => ({ default: module.CourseMap })))
const RootExplorer = lazy(() => import('./components/RootExplorer').then((module) => ({ default: module.RootExplorer })))
const Letters = lazy(() => import('./components/Letters').then((module) => ({ default: module.Letters })))

type Tab = 'course' | 'roots' | 'typing' | 'letters' | 'mistakes' | 'stats'
type Practice = { title: string; words: Word[]; chapter?: number; returnToLesson?: string; id: number } | null
type SentenceJob = { lessonId: string; title: string; sentences: LessonSentence[]; id: number } | null

const TABS: { id: Tab; label: string; ar: string; icon: ReactNode }[] = [
  { id: 'course', label: '学习路线', ar: 'مَنْهَج', icon: <IconCompass size={16} /> },
  { id: 'roots', label: '词根与变位', ar: 'جُذُور', icon: <IconGitBranch size={16} /> },
  { id: 'typing', label: '词库打字', ar: 'كَلِمَات', icon: <IconKeyboard size={16} /> },
  { id: 'letters', label: '字母与拼读', ar: 'حُرُوف', icon: <IconBook size={16} /> },
  { id: 'mistakes', label: '错题本', ar: 'أَخْطَاء', icon: <IconBookmark size={16} /> },
  { id: 'stats', label: '学习记录', ar: 'إِحْصَاء', icon: <IconChart size={16} /> },
]

export default function App() {
  const cloud = useCloud()
  const [tab, setTab] = useState<Tab>('course')
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [lessonStep, setLessonStep] = useState<1 | 2 | 3 | 4>(1)
  const [independentScores, setIndependentScores] = useStored<Record<string, number>>('qalam.independent-lessons.v1', {})
  const [practice, setPractice] = useState<Practice>(null)
  const [sentenceJob, setSentenceJob] = useState<SentenceJob>(null)
  const [settings, setSettings] = useStored('qalam.settings', DEFAULT_SETTINGS)
  const [book, setBook] = useStored<MistakeBook>('qalam.mistakes', {})
  const [sessions, setSessions] = useStoredList<SessionRecord>('qalam.sessions')
  const [lessonScores, setLessonScores] = useStored<Record<string, number>>('qalam.lessons', {})
  const [wordQuery, setWordQuery] = useState('')
  const [previewChap, setPreviewChap] = useState<number | null>(null)
  const [voiceRate, setRateState] = useState<number>(() => getVoiceRate())
  const [theme, setTheme] = useState<'night' | 'light' | 'emerald'>(() => {
    const saved = localStorage.getItem('qalam.theme')
    if (saved === 'light' || saved === 'emerald' || saved === 'night') return saved
    return 'light'
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
    setPractice({ title, words, returnToLesson: tab === 'course' ? activeLessonId ?? undefined : undefined, id: Date.now() })
    setTab('typing')
  }

  const startLessonSentences = (lesson: CourseLesson, sentences: LessonSentence[]) => {
    setActiveLessonId(lesson.id)
    setSentenceJob({ lessonId: lesson.id, title: `${lesson.number} · ${lesson.title}`, sentences, id: Date.now() })
    setTab('course')
  }

  const recordMistake = (w: Word) =>
    setBook((b) => ({ ...b, [w.ar]: { ...w, count: (b[w.ar]?.count ?? 0) + 1, last: Date.now() } }))

  return (
    <div className="app">
      <div className="bg-pattern" aria-hidden="true" />
      <a className="skip-link" href="#main-content">跳到学习内容</a>
      <header className="header app-sidebar">
        <button
          id="logo"
          className="logo"
          aria-label="回到首页零到一课程"
          onClick={() => {
            setTab('course')
            setActiveLessonId(null)
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

        <span className="sidebar-caption">你的阿语学习空间</span>
        <nav className="tabs" aria-label="主导航">
          {TABS.map((t) => (
            <button
              id={`tab-${t.id}`}
              key={t.id}
              aria-current={tab === t.id ? 'page' : undefined}
              className={'tab' + (tab === t.id ? ' tab--on' : '')}
              onClick={() => {
                setTab(t.id)
                if (t.id === 'course') { setSentenceJob(null); setActiveLessonId(null) }
                if (t.id === 'typing') setPractice(null)
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

        <div className="header-tools">
          <div className="theme-switcher" role="group" aria-label="语音语速控制">
            <button
              className="theme-pill"
              title="试听阿语发音"
              onClick={() => speak('مَرْحَبًا بِكَ فِي قَلَم')}
            >
              <IconVolume size={14} />
              <span>发音</span>
            </button>
            {[
              { r: 0.6, label: '0.6x' },
              { r: 0.85, label: '0.85x' },
              { r: 1.0, label: '1.0x' },
            ].map((item) => (
              <button
                key={item.r}
                aria-pressed={Math.abs(voiceRate - item.r) < 0.05}
                className={'theme-pill' + (Math.abs(voiceRate - item.r) < 0.05 ? ' is-on' : '')}
                title={`切换发音语速为 ${item.label}`}
                onClick={() => {
                  setRateState(item.r)
                  setVoiceRate(item.r)
                  speak('مَرْحَبًا', item.r)
                }}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="theme-switcher" role="group" aria-label="配色主题切换">
            <button
              id="btn-theme-night"
              aria-pressed={theme === 'night'}
              className={'theme-pill' + (theme === 'night' ? ' is-on' : '')}
              title="星夜蓝金 · Arabian Nights"
              aria-label="切换为星夜蓝金配色"
              onClick={() => {
                setTheme('night')
              }}
            >
              <IconMoon size={14} />
              <span>星夜</span>
            </button>
            <button
              id="btn-theme-light"
              aria-pressed={theme === 'light'}
              className={'theme-pill' + (theme === 'light' ? ' is-on' : '')}
              title="羊皮纸墨香 · Andalusian Daylight"
              aria-label="切换为羊皮纸浅色配色"
              onClick={() => {
                setTheme('light')
              }}
            >
              <IconSun size={14} />
              <span>浅色</span>
            </button>
            <button
              id="btn-theme-emerald"
              aria-pressed={theme === 'emerald'}
              className={'theme-pill' + (theme === 'emerald' ? ' is-on' : '')}
              title="翡翠流金 · Oasis Emerald"
              aria-label="切换为翡翠流金配色"
              onClick={() => {
                setTheme('emerald')
              }}
            >
              <IconSparkles size={14} />
              <span>翡翠</span>
            </button>
          </div>
        </div>
      </header>

      <main className="main" id="main-content" tabIndex={-1}>
        <Account />
        <Suspense fallback={<p role="status" className="muted">正在打开学习内容…</p>}>
        {tab === 'course' &&
          (sentenceJob ? (
            <SentencePractice
              key={sentenceJob.id}
              title={sentenceJob.title}
              sentences={sentenceJob.sentences}
              settings={settings}
              setSettings={setSettings}
              onComplete={(record) => {
                if (!record.assisted) {
                  setIndependentScores((prev) => ({ ...prev, [sentenceJob.lessonId]: Math.max(prev[sentenceJob.lessonId] ?? 0, record.accuracy) }))
                  setLessonScores((prev) => ({
                    ...prev,
                    [sentenceJob.lessonId]: Math.max(prev[sentenceJob.lessonId] ?? 0, record.accuracy),
                  }))
                }
                setSessions((s) => [...s, { ...record, lessonId: sentenceJob.lessonId }].slice(-500))
              }}
              onBack={() => setSentenceJob(null)}
            />
          ) : (
            <CourseMap
              lessonScores={lessonScores}
              independentScores={independentScores}
              step={lessonStep}
              setStep={setLessonStep}
              sessions={sessions}
              mistakeCount={Object.keys(book).length}
              activeLessonId={activeLessonId}
              onSelectLesson={setActiveLessonId}
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
              onBack={() => {
                setPractice(null)
                if (practice.returnToLesson) {
                  setActiveLessonId(practice.returnToLesson)
                  setTab('course')
                }
              }}
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
                    aria-label="搜索词库"
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
                        {matches.slice(0, 60).map((w, idx) => {
                          const p = formatPronunciation(w.tr)
                          return (
                            <button key={`${w.ar}-${idx}`} className="vocab-item glass" onClick={() => speak(w.ar)} title="点击听发音">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="vocab-item__ar ar">{w.ar}</span>
                                <IconVolume size={14} style={{ color: 'var(--gold)' }} />
                              </div>
                              <span className="word-tr" style={{ fontSize: 13 }}>
                                {w.tr}
                              </span>
                              <small className="muted" style={{ fontSize: 11 }}>
                                {p.syllables} {p.zhHint ? `· 【${p.zhHint}】` : ''}
                              </small>
                              <b>{w.zh}</b>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()
              ) : null}

              {previewChap != null && CHAPTERS[previewChap] && (
                <div className="glass" style={{ padding: 22, marginBottom: 24 }}>
                  <div className="lesson-sec-head" style={{ marginTop: 0, marginBottom: 14 }}>
                    <div>
                      <span className="chip chip--on">章节有声词表预览</span>
                      <h2 style={{ marginTop: 6 }}>
                        {CHAPTERS[previewChap].title} · <span className="ar gold-text">{CHAPTERS[previewChap].titleAr}</span>（共 {CHAPTERS[previewChap].words.length} 词）
                      </h2>
                      <small className="muted">点击任意单词即可听取标准阿语发音，并查看音节拆解与中文谐音助记</small>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn--gold btn--sm" onClick={() => startChapter(previewChap)}>
                        <IconKeyboard size={15} /> 开始本章盲打
                      </button>
                      <button className="btn btn--ghost btn--sm" onClick={() => setPreviewChap(null)}>
                        收起词表
                      </button>
                    </div>
                  </div>
                  <div className="vocab-grid">
                    {CHAPTERS[previewChap].words.map((w, idx) => {
                      const p = formatPronunciation(w.tr)
                      return (
                        <button key={`${w.ar}-${idx}`} className="vocab-item glass" onClick={() => speak(w.ar)} title="点击听发音">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="vocab-item__ar ar">{w.ar}</span>
                            <IconVolume size={14} style={{ color: 'var(--gold)' }} />
                          </div>
                          <span className="word-tr" style={{ fontSize: 13 }}>
                            {w.tr}
                          </span>
                          <small className="muted" style={{ fontSize: 11 }}>
                            {p.syllables} {p.zhHint ? `· 【${p.zhHint}】` : ''}
                          </small>
                          <b>{w.zh}</b>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <h2 className="section-title">{CHAPTERS.length} 大主题章节（共 {CHAPTERS.reduce((sum, chapter) => sum + chapter.words.length, 0)} 词 · 点击卡片盲打或点「有声词表」听发音）</h2>
              <div className="chapters">
                {CHAPTERS.map((c, i) => {
                  const best = bestByTitle.get(c.title)
                  return (
                    <div
                      id={`chapter-${c.id}`}
                      key={c.id}
                      className="chapter glass"
                      style={{ animationDelay: `${i * 35}ms`, cursor: 'default' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span className="chapter__num">CH.{String(i + 1).padStart(2, '0')}</span>
                        <button
                          className="chip"
                          style={{ padding: '2px 8px', fontSize: 11 }}
                          onClick={() => {
                            setPreviewChap(previewChap === i ? null : i)
                            speak(c.titleAr)
                          }}
                        >
                          <IconVolume size={12} /> 有声词表
                        </button>
                      </div>
                      <button
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', textAlign: 'left', gap: 4 }}
                        onClick={() => startChapter(i)}
                      >
                        <span className="chapter__ar ar">{c.titleAr}</span>
                        <b>{c.title}</b>
                        <small className="muted">
                          {c.words.length} 个{i === 0 ? '字母' : '词'} · 点击开始盲打
                        </small>
                      </button>
                      {best != null && <span className="chapter__best">最佳 {best}%</span>}
                    </div>
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
        </Suspense>
      </main>
      <footer className="footer muted">
        Qalam قَلَم · 一点一滴，读懂另一种语言。{cloud.user ? '已登录，学习记录将同步到云端。' : '游客记录保存在当前浏览器，登录后可导入云端。'}
      </footer>
    </div>
  )
}
