import { KEY_ROWS } from '../lib/keyboard'
import type { KeyHint } from '../lib/keyboard'

interface Props {
  hint: KeyHint | null
  pressed: string | null
  pressedOk: boolean
}

const OFFSETS = [0, 1.5, 1.8, 2.3]

export function Keyboard({ hint, pressed, pressedOk }: Props) {
  const cls = (code: string) =>
    ['key', hint?.code === code && 'key--hint', pressed === code && (pressedOk ? 'key--ok' : 'key--bad')].filter(Boolean).join(' ')

  return (
    <div className="keyboard" aria-label="阿语键盘">
      {KEY_ROWS.map((row, r) => (
        <div className="keyboard__row" key={r}>
          {r > 0 && (
            <div
              className={['key key--mod', r === 3 && hint?.shift && 'key--hint'].filter(Boolean).join(' ')}
              style={{ flexGrow: OFFSETS[r] }}
            >
              {r === 1 ? 'Tab' : r === 2 ? 'Caps' : 'Shift'}
            </div>
          )}
          {row.map((k) => (
            <div key={k.code} className={cls(k.code)}>
              <span className="key__latin">{k.latin}</span>
              {k.shift && <span className={'key__shift' + (hint?.code === k.code && hint.shift ? ' is-on' : '')}>{k.shift.length === 1 && /[\u064B-\u0652]/.test(k.shift) ? '\u25CC' + k.shift : k.shift}</span>}
              <span className={'key__ar' + (hint?.code === k.code && !hint.shift ? ' is-on' : '')}>{k.base}</span>
            </div>
          ))}
          {r === 0 && <div className="key key--mod" style={{ flexGrow: 1.5 }}>⌫</div>}
          {r === 2 && <div className="key key--mod" style={{ flexGrow: 1.8 }}>Enter</div>}
          {r === 3 && (
            <div className={['key key--mod', hint?.shift && 'key--hint'].filter(Boolean).join(' ')} style={{ flexGrow: 2.3 }}>
              Shift
            </div>
          )}
        </div>
      ))}
      <div className="keyboard__row">
        <div className={'key key--space' + (hint?.code === 'Space' ? ' key--hint' : '') + (pressed === 'Space' ? ' key--ok' : '')}>space</div>
      </div>
    </div>
  )
}
