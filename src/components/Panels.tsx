import type { Word } from '../data/words'
import type { MistakeBook, SessionRecord } from '../lib/storage'
import { speak } from '../lib/audio'
import { IconCheck, IconFlame, IconKeyboard } from './Icons'

export function Mistakes({
  book,
  setBook,
  onPractice,
}: {
  book: MistakeBook
  setBook: (b: MistakeBook) => void
  onPractice: (w: Word[]) => void
}) {
  const items = Object.values(book).sort((a, b) => b.count - a.count || b.last - a.last)
  const remove = (ar: string) => {
    const next = { ...book }
    delete next[ar]
    setBook(next)
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <h2>错题本</h2>
          <p className="muted">打错或跳过的词会记到这里。先回忆，再看答案；确认记住后可手动移出。</p>
        </div>
        <div className="panel__actions">
          <button
            id="btn-practice-mistakes"
            className="btn btn--gold"
            disabled={!items.length}
            onClick={() => onPractice(items.slice(0, 30))}
          >
            <IconKeyboard size={16} /> 练习错词{items.length > 30 ? '（前 30 个）' : ''}
          </button>
          <button
            id="btn-clear-mistakes"
            className="btn btn--ghost"
            disabled={!items.length}
            onClick={() => confirm('清空错题本？') && setBook({})}
          >
            清空
          </button>
        </div>
      </div>
      {!items.length ? (
        <div className="empty glass">
          <span className="ar">مُمْتَاز</span>
          <p>还没有待复习的错词。完成一次词库练习后，打错或跳过的词会出现在这里。</p>
        </div>
      ) : (
        <div className="mistake-list">
          {items.map((m) => (
            <div key={m.ar} className="mistake glass">
              <button className="mistake__ar ar" onClick={() => speak(m.ar)} title="朗读">
                {m.ar}
              </button>
              <div className="mistake__meta">
                <span>{m.tr}</span>
                <span className="muted">{m.zh}</span>
              </div>
              <span className="mistake__count">×{m.count}</span>
              <button className="icon-btn" aria-label={`从错题本移出 ${m.zh}`} title="手动移出错题本" onClick={() => remove(m.ar)}>
                <IconCheck size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

const dayKey = (t: number) => new Date(t).toDateString()

function streakDays(sessions: SessionRecord[]) {
  const days = new Set(sessions.map((s) => dayKey(s.at)))
  let n = 0
  const d = new Date()
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1)
  while (days.has(d.toDateString())) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function Stats({ sessions, onClear }: { sessions: SessionRecord[]; onClear: () => void }) {
  // Legacy sentence records used fixed durations and speeds; retain them only in history.
  const measured = sessions.filter((s) => s.kind === 'typing' || s.kind === 'sentence')
  const totalWords = measured.reduce((a, s) => a + s.words, 0)
  const totalSec = measured.reduce((a, s) => a + s.seconds, 0)
  const independentSentences = measured.filter((s) => s.kind === 'sentence' && !s.assisted)
  const recent = measured.filter((s) => s.kind === 'typing' && s.words > 0).slice(-20)
  const maxWpm = Math.max(1, ...recent.map((s) => s.wpm))

  // last 7 days of words
  const week = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const k = d.toDateString()
    return {
      label: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
      words: measured.filter((s) => dayKey(s.at) === k).reduce((a, s) => a + s.words, 0),
    }
  })
  const maxWeek = Math.max(1, ...week.map((w) => w.words))

  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <h2>学习统计</h2>
          <p className="muted">数据只保存在本机浏览器里。词次包含重复练习；练习成绩不等于长期掌握。</p>
        </div>
        {sessions.length > 0 && (
          <button id="btn-clear-stats" className="btn btn--ghost" onClick={() => confirm('清空所有记录？') && onClear()}>
            清空记录
          </button>
        )}
      </div>
      {measured.length < sessions.length && <p className="muted">旧版记录未区分练习方式，且部分用时为估算值，因此仅保留在历史列表，不计入新版汇总。</p>}
      <div className="kpis">
        <div className="kpi glass">
          <b>{streakDays(measured.filter((s) => s.words > 0))}</b>
          <span>
            <IconFlame size={14} /> 连续天数
          </span>
        </div>
        <div className="kpi glass">
          <b>{totalWords}</b>
          <span>记录内练习词次</span>
        </div>
        <div className="kpi glass">
          <b>{Math.round(totalSec / 60)}</b>
          <span>记录内练习分钟</span>
        </div>
        <div className="kpi glass">
          <b>{independentSentences.length}</b>
          <span>未看答案的造句轮数</span>
        </div>
      </div>
      <div className="charts">
        <div className="chart glass">
          <h3>最近 7 天练习词次</h3>
          <div className="bars">
            {week.map((w, i) => (
              <div key={i} className="bar">
                <div className="bar__fill" style={{ height: `${(w.words / maxWeek) * 100}%` }} title={`${w.words} 词`} />
                <span>{w.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="chart glass">
          <h3>最近 {recent.length} 次打字速度（词/分钟）</h3>
          <div className="bars">
            {recent.map((s, i) => (
              <div key={i} className="bar">
                <div
                  className="bar__fill bar__fill--gold"
                  style={{ height: `${(s.wpm / maxWpm) * 100}%` }}
                  title={`${s.title} · ${s.wpm} WPM · ${s.accuracy}%`}
                />
              </div>
            ))}
            {!recent.length && <p className="muted">完成一次词库打字后显示；造句练习不计算打字速度。</p>}
          </div>
        </div>
      </div>
      {sessions.length > 0 && (
        <div className="table-wrap glass">
          <table className="table">
            <thead>
              <tr>
                <th>时间</th>
                <th>章节</th>
                <th>练习词次</th>
                <th>用时</th>
                <th>词/分钟</th>
                <th>练习成绩</th>
              </tr>
            </thead>
            <tbody>
              {[...sessions].reverse().slice(0, 15).map((s) => (
                <tr key={s.at}>
                  <td>{new Date(s.at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{s.title}<small className="muted" style={{ display: 'block' }}>{s.kind === 'sentence' ? s.assisted ? '辅助造句' : '独立造句' : s.kind === 'typing' ? '词库打字' : '旧版记录'}</small></td>
                  <td>{s.words}</td>
                  <td>
                    {Math.floor(s.seconds / 60)}′{s.seconds % 60}″
                  </td>
                  <td>{s.kind === 'typing' ? s.wpm : '—'}</td>
                  <td>{s.accuracy}%<small className="muted" style={{ display: 'block' }}>{s.kind === 'sentence' ? '首轮无误句比例' : s.kind === 'typing' ? `正确率（含跳过${s.skipped ? ` ${s.skipped} 词` : ''}）` : '旧口径'}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
