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
          <p className="muted">打错或跳过的词会自动记到这里，按出错次数排序。</p>
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
          <p>还没有错词，继续保持！(mumtāz，太棒了)</p>
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
              <button className="icon-btn" aria-label={`移出已掌握词 ${m.zh}`} title="已掌握，移出" onClick={() => remove(m.ar)}>
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
  const totalWords = sessions.reduce((a, s) => a + s.words, 0)
  const totalSec = sessions.reduce((a, s) => a + s.seconds, 0)
  const avgAcc = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / sessions.length) : 0
  const recent = sessions.slice(-20)
  const maxWpm = Math.max(1, ...recent.map((s) => s.wpm))

  // last 7 days of words
  const week = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const k = d.toDateString()
    return {
      label: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
      words: sessions.filter((s) => dayKey(s.at) === k).reduce((a, s) => a + s.words, 0),
    }
  })
  const maxWeek = Math.max(1, ...week.map((w) => w.words))

  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <h2>学习统计</h2>
          <p className="muted">数据只保存在本机浏览器里。</p>
        </div>
        {sessions.length > 0 && (
          <button id="btn-clear-stats" className="btn btn--ghost" onClick={() => confirm('清空所有记录？') && onClear()}>
            清空记录
          </button>
        )}
      </div>
      <div className="kpis">
        <div className="kpi glass">
          <b>{streakDays(sessions)}</b>
          <span>
            <IconFlame size={14} /> 连续天数
          </span>
        </div>
        <div className="kpi glass">
          <b>{totalWords}</b>
          <span>累计单词</span>
        </div>
        <div className="kpi glass">
          <b>{Math.round(totalSec / 60)}</b>
          <span>累计分钟</span>
        </div>
        <div className="kpi glass">
          <b>{avgAcc}%</b>
          <span>平均正确率</span>
        </div>
      </div>
      <div className="charts">
        <div className="chart glass">
          <h3>最近 7 天单词数</h3>
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
          <h3>最近 {recent.length} 次速度 (WPM)</h3>
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
            {!recent.length && <p className="muted">完成一章后这里会出现图表</p>}
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
                <th>单词</th>
                <th>用时</th>
                <th>WPM</th>
                <th>正确率</th>
              </tr>
            </thead>
            <tbody>
              {[...sessions].reverse().slice(0, 15).map((s) => (
                <tr key={s.at}>
                  <td>{new Date(s.at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{s.title}</td>
                  <td>{s.words}</td>
                  <td>
                    {Math.floor(s.seconds / 60)}′{s.seconds % 60}″
                  </td>
                  <td>{s.wpm}</td>
                  <td>{s.accuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
