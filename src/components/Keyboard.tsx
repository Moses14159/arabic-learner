import { useState } from 'react'
import { KEY_ROWS, MARK_NAMES } from '../lib/keyboard'
import type { KeyHint } from '../lib/keyboard'

interface Props {
  hint: KeyHint | null
  pressed: string | null
  pressedOk: boolean
  onInput: (chars: string, code: string) => void
  onReset: () => void
  onSpeak: () => void
  onFocusInput: () => void
}

const OFFSETS = [0, 1.5, 1.8, 2.3]
const keyLabel = (text: string) => MARK_NAMES[text] ? '\u25CC' + text : text

export function Keyboard({ hint, pressed, pressedOk, onInput, onReset, onSpeak, onFocusInput }: Props) {
  const [shift, setShift] = useState(false)
  const cls = (code: string) =>
    ['key', hint?.code === code && 'key--hint', pressed === code && (pressedOk ? 'key--ok' : 'key--bad')].filter(Boolean).join(' ')

  return (
    <div
      className="keyboard"
      role="group"
      aria-label="阿语触屏键盘"
      onClick={(event) => {
        // Pointer users can continue on a physical keyboard; keyboard activation keeps its focus.
        if (event.detail > 0) onFocusInput()
      }}
    >
      {KEY_ROWS.map((row, r) => (
        <div className="keyboard__row" key={r}>
          {r > 0 && r < 3 && <span className="keyboard__spacer" aria-hidden="true" style={{ flexGrow: OFFSETS[r] }} />}
          {r === 3 && (
            <button
              type="button"
              className={['key key--mod key--shift', hint?.shift && 'key--hint', shift && 'key--selected'].filter(Boolean).join(' ')}
              style={{ flexGrow: OFFSETS[r] }}
              aria-label="切换上档字符与动符"
              aria-pressed={shift}
              onClick={() => setShift(!shift)}
            >Shift · 动符</button>
          )}
          {row.map((k) => {
            const chars = shift ? k.shift : k.base
            return (
              <button
                type="button"
                key={k.code}
                className={cls(k.code)}
                aria-label={`输入 ${chars ? MARK_NAMES[chars] ?? chars : '无上档字符'}`}
                disabled={!chars}
                onClick={() => {
                  if (chars) onInput(chars, k.code)
                  setShift(false)
                }}
              >
                <span className="key__latin">{k.latin}</span>
                {k.shift && <span className={'key__shift' + (!shift && hint?.code === k.code && hint.shift ? ' is-on' : '')}>{keyLabel(shift ? k.base : k.shift)}</span>}
                <span className={'key__ar' + (hint?.code === k.code && hint.shift === shift ? ' is-on' : '')}>{keyLabel(chars ?? '')}</span>
              </button>
            )
          })}
          {r === 0 && <button type="button" className="key key--mod" style={{ flexGrow: 1.5 }} aria-label="重新输入当前内容" onClick={() => { setShift(false); onReset() }}>⌫ 重打</button>}
          {r === 2 && <button type="button" className="key key--mod" style={{ flexGrow: 1.8 }} aria-label="朗读当前内容" onClick={onSpeak}>朗读</button>}
          {r === 3 && <span className="keyboard__spacer" aria-hidden="true" style={{ flexGrow: 2.3 }} />}
        </div>
      ))}
      <div className="keyboard__row">
        <button type="button" className={cls('Space') + ' key--space'} aria-label="输入空格" onClick={() => { onInput(' ', 'Space'); setShift(false) }}>空格</button>
      </div>
    </div>
  )
}
