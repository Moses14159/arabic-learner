import { useState } from 'react'
import { ROOT_FAMILIES, VERB_PARADIGMS, WAZN_TEMPLATES } from '../data/roots'
import type { RootFamily, VerbParadigm } from '../data/roots'
import type { Word } from '../data/words'
import { speak } from '../lib/audio'
import { IconGitBranch, IconKeyboard, IconLayers, IconRefresh, IconVolume } from './Icons'

interface Props {
  onPracticeWords: (title: string, words: Word[]) => void
}

export function RootExplorer({ onPracticeWords }: Props) {
  const [sub, setSub] = useState<'roots' | 'wazn' | 'verbs'>('roots')
  const [selRoot, setSelRoot] = useState<RootFamily>(ROOT_FAMILIES[0])
  const [selVerb, setSelVerb] = useState<VerbParadigm>(VERB_PARADIGMS[0])

  return (
    <section className="letters">
      <div className="seg" role="tablist" aria-label="词根与变位模块">
        <button role="tab" aria-selected={sub === 'roots'} className={sub === 'roots' ? 'on' : ''} onClick={() => setSub('roots')}>
          <IconGitBranch size={15} /> 三母词根魔方
        </button>
        <button role="tab" aria-selected={sub === 'verbs'} className={sub === 'verbs' ? 'on' : ''} onClick={() => setSub('verbs')}>
          <IconRefresh size={15} /> 动词变位实验室
        </button>
        <button role="tab" aria-selected={sub === 'wazn'} className={sub === 'wazn' ? 'on' : ''} onClick={() => setSub('wazn')}>
          <IconLayers size={15} /> 词型造词模具 (Wazn)
        </button>
      </div>

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
              {selRoot.words.map((w) => (
                <button key={w.ar} className="derived-card" onClick={() => speak(w.ar)}>
                  <div className="derived-card__top">
                    <span className="xray-token__badge">{w.waznRole}</span>
                    <span className="ar muted" style={{ fontSize: 16 }}>
                      模具 {w.wazn}
                    </span>
                  </div>
                  <div className="derived-card__ar ar">{w.ar}</div>
                  <div className="word-tr" style={{ fontSize: 16 }}>
                    {w.tr}
                  </div>
                  <div className="derived-card__zh">
                    <b>{w.zh}</b>
                    <IconVolume size={16} />
                  </div>
                </button>
              ))}
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
          <div className="glass" style={{ padding: 24 }}>
            <h2>什么是「词型模具（الْوَزْن Wazn）」？</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              阿拉伯语语法学家用 <b>ف - ع - ل (f - ʿ - l，「做」)</b> 这三个字母作为「公式占位符」：
              <b>ف</b> 代表第 1 个根字母，<b>ع</b> 代表第 2 个根字母，<b>ل</b> 代表第 3 个根字母。只要学会下面 6 个核心模具，背 1 个词根就能自动认出 6 个单词！
            </p>
          </div>
          <div className="wazn-grid">
            {WAZN_TEMPLATES.map((w) => (
              <div key={w.pattern} className="wazn-card glass">
                <div className="wazn-card__head">
                  <span className="wazn-card__ar ar">{w.pattern}</span>
                  <div>
                    <b>{w.role}</b>
                    <div className="word-tr" style={{ fontSize: 15 }}>
                      {w.tr}
                    </div>
                  </div>
                </div>
                <p className="muted" style={{ fontSize: 14, margin: '8px 0' }}>
                  {w.desc}
                </p>
                <div className="wazn-card__ex">例：{w.example}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
