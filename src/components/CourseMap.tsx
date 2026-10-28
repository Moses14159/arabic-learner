import { useState } from 'react'
import { COURSE_LESSONS } from '../data/grammar'
import type { CourseLesson, LessonSentence } from '../data/grammar'
import type { Word } from '../data/words'
import { speak } from '../lib/audio'
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook,
  IconCheck,
  IconCompass,
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

export function CourseMap({ lessonScores, onStartWordTyping, onStartSentencePractice, onJumpTab }: Props) {
  const [active, setActive] = useState<CourseLesson | null>(null)

  const completedCount = COURSE_LESSONS.filter((l) => (lessonScores[l.id] ?? 0) > 0).length
  const nextRecommended = COURSE_LESSONS.find((l) => !lessonScores[l.id]) ?? COURSE_LESSONS[0]
  const progressPct = Math.round((completedCount / COURSE_LESSONS.length) * 100)

  if (active) {
    const score = lessonScores[active.id]
    return (
      <section className="lesson-view">
        <div className="practice__top">
          <button className="btn btn--ghost btn--sm" onClick={() => setActive(null)}>
            <IconArrowLeft size={16} /> 返回零到一课程地图
          </button>
          <span className="chip chip--on">{active.stageTitle}</span>
          {score != null && (
            <span className="chapter__best">
              <IconCheck size={14} /> 造句通关 {score}%
            </span>
          )}
        </div>

        <div className="lesson-hero glass">
          <div className="lesson-hero__main">
            <div className="lesson-hero__title">
              <span className="lesson-hero__icon ar" aria-hidden="true">
                {active.number.replace(/\D/g, '')}
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
              <IconKeyboard size={17} /> 第一步：打字记本课生词 ({active.vocab.length})
            </button>
            <button
              className="btn btn--gold"
              onClick={() => onStartSentencePractice(active, active.sentences)}
            >
              <IconPuzzle size={17} /> 第二步：连词成句与整句盲打 ({active.sentences.length})
            </button>
          </div>
        </div>

        {/* Step 1: Micro-Grammar Cards */}
        <h2 className="section-title">
          <IconBook size={16} /> 1. 核心语法讲义（点击阿语例句可发音）
        </h2>
        <div className="grammar-points">
          {active.points.map((pt, i) => (
            <div key={i} className="grammar-card glass">
              <h3>{pt.title}</h3>
              {pt.formula && <div className="grammar-formula">{pt.formula}</div>}
              <p className="muted">{pt.desc}</p>
              <div className="grammar-examples">
                {pt.examples.map((ex, j) => (
                  <button key={j} className="grammar-ex" onClick={() => speak(ex.ar)}>
                    <div className="grammar-ex__main">
                      <span className="ar gold-text" style={{ fontSize: 26 }}>
                        {ex.ar}
                      </span>
                      <span className="word-tr" style={{ fontSize: 15 }}>
                        {ex.tr}
                      </span>
                      <span>{ex.zh}</span>
                      <span className="grammar-ex__audio" aria-hidden="true">
                        <IconVolume size={16} />
                      </span>
                    </div>
                    {ex.highlight && <small className="grammar-ex__hi">要点：{ex.highlight}</small>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Step 2: Lesson Vocabulary */}
        <div className="lesson-sec-head">
          <h2 className="section-title">
            <IconKeyboard size={16} /> 2. 本课生词表（点击听发音）
          </h2>
          <button
            className="btn btn--sm"
            onClick={() => onStartWordTyping(`${active.number}生词：${active.title}`, active.vocab)}
          >
            打字背诵这 {active.vocab.length} 个词 <IconArrowRight size={15} />
          </button>
        </div>
        <div className="vocab-grid">
          {active.vocab.map((w) => (
            <button key={w.ar} className="vocab-item glass" onClick={() => speak(w.ar)}>
              <span className="vocab-item__ar ar">{w.ar}</span>
              <span className="word-tr" style={{ fontSize: 14 }}>
                {w.tr}
              </span>
              <b>{w.zh}</b>
            </button>
          ))}
        </div>

        {/* Step 3: Lesson Sentences & X-Ray Preview */}
        <div className="lesson-sec-head">
          <h2 className="section-title">
            <IconLayers size={16} /> 3. 本课阶梯句型与逐词语法解剖
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
                <button className="sentence-preview__ar ar" onClick={() => speak(s.ar)}>
                  <span>{s.ar}</span>
                  <IconVolume size={18} />
                </button>
                <div className="sentence-preview__meta">
                  <span className="word-tr" style={{ fontSize: 16 }}>
                    {s.tr}
                  </span>
                  <b>{s.zh}</b>
                </div>
              </div>
              <div className="xray__tokens" dir="rtl">
                {s.tokens.map((t, tIdx) => (
                  <button key={tIdx} className="xray-token" onClick={() => speak(t.ar)} title={t.note}>
                    <span className="xray-token__ar ar">{t.ar}</span>
                    <span className="xray-token__tr">{t.tr}</span>
                    <span className="xray-token__zh">{t.zh}</span>
                    <span className="xray-token__badge">{t.role}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
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
            <IconCompass size={14} /> 零基础阶梯式主线课程
          </span>
          <h1>
            从零到一学阿拉伯语
            <span className="hero__ar ar">مِنَ الصِّفْرِ إِلَى الْإِتْقَانِ</span>
          </h1>
          <p className="muted">
            融合 <b>麦地那阿语教程</b> 的语法阶梯、<b>Earthworm</b> 的连词成句与 <b>Qwerty Learner</b> 的键盘肌肉记忆：
            从 28 个字母与动符拼读出发，看懂三母词根与变格规律，亲手敲出地道的阿语句子。
          </p>
          <div className="hero__actions">
            <button className="btn btn--gold" onClick={() => setActive(nextRecommended)}>
              <IconSparkles size={17} /> {completedCount > 0 ? `继续学习：${nextRecommended.number}` : `开始第 1 课：${COURSE_LESSONS[0].title}`}
            </button>
            <button className="btn" onClick={() => onJumpTab('letters')}>
              <IconBook size={17} /> 28 字母与动符实验室
            </button>
            <button className="btn btn--ghost" onClick={() => onJumpTab('roots')}>
              <IconGitBranch size={17} /> 三母词根与变位魔方
            </button>
          </div>
        </div>

        <div className="bento-side">
          <div className="bento-card glass">
            <div className="bento-card__top">
              <span className="muted">主线闯关进度</span>
              <b className="gold-text">{completedCount} / {COURSE_LESSONS.length} 课</b>
            </div>
            <div className="progress" style={{ height: 8, margin: '8px 0' }}>
              <div className="progress__fill" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              每课包含：微语法讲义 + 核心生词盲打 + 逐词语法透视造句。
            </p>
          </div>

          <button className="bento-card bento-card--action glass" onClick={() => onJumpTab('letters')}>
            <div className="bento-card__icon">
              <IconBook size={20} />
            </div>
            <div>
              <b>阶段零 · 语音文字关</b>
              <p className="muted">15 分钟掌握字母四形态、三短音/三长音与太阳月亮字母同化</p>
            </div>
            <IconArrowRight size={18} />
          </button>

          <button className="bento-card bento-card--action glass" onClick={() => onJumpTab('roots')}>
            <div className="bento-card__icon">
              <IconGitBranch size={20} />
            </div>
            <div>
              <b>词法核心 · 三母词根魔方</b>
              <p className="muted">体验「ك-ت-ب」一个词根衍生出书、作家、办公室、图书馆的造词公式</p>
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
              return (
                <article key={lesson.id} className="course-card glass">
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
                    <button className="btn btn--sm" onClick={() => setActive(lesson)}>
                      <IconBook size={15} /> 讲义与解剖
                    </button>
                    <button
                      className="btn btn--gold btn--sm"
                      onClick={() => onStartSentencePractice(lesson, lesson.sentences)}
                    >
                      <IconPuzzle size={15} /> 造句闯关
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
