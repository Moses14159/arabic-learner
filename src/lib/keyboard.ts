export interface KeyDef {
  code: string
  base: string
  shift?: string
  /** physical latin label */
  latin: string
  width?: number
}

const row = (codes: string[], latin: string, base: string[], shift: string[]): KeyDef[] =>
  codes.map((code, i) => ({ code, latin: latin[i], base: base[i], shift: shift[i] || undefined }))

const letterCodes = (s: string) => [...s].map((c) => 'Key' + c)

export const KEY_ROWS: KeyDef[][] = [
  row(
    ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'],
    '`1234567890-=',
    ['ذ', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['\u0651', '!', '@', '#', '$', '%', '^', '&', '*', ')', '(', '_', '+'],
  ),
  row(
    [...letterCodes('QWERTYUIOP'), 'BracketLeft', 'BracketRight'],
    'QWERTYUIOP[]',
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
    ['\u064E', '\u064B', '\u064F', '\u064C', 'لإ', 'إ', '‘', '÷', '×', '؛', '<', '>'],
  ),
  row(
    [...letterCodes('ASDFGHJKL'), 'Semicolon', 'Quote'],
    "ASDFGHJKL;'",
    ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
    ['\u0650', '\u064D', ']', '[', 'لأ', 'أ', 'ـ', '،', '/', ':', '"'],
  ),
  row(
    [...letterCodes('ZXCVBNM'), 'Comma', 'Period', 'Slash'],
    'ZXCVBNM,./',
    ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ'],
    ['~', '\u0652', '}', '{', 'لآ', 'آ', '’', ',', '.', '؟'],
  ),
]

export const KEY_BY_CODE: Record<string, KeyDef> = Object.fromEntries(KEY_ROWS.flat().map((k) => [k.code, k]))

export interface KeyHint {
  code: string
  shift: boolean
}

/** char -> physical key */
export const KEY_FOR_CHAR: Record<string, KeyHint> = {}
for (const k of KEY_ROWS.flat()) {
  if ([...k.base].length === 1) KEY_FOR_CHAR[k.base] ??= { code: k.code, shift: false }
  if (k.shift && [...k.shift].length === 1) KEY_FOR_CHAR[k.shift] ??= { code: k.code, shift: true }
}
KEY_FOR_CHAR[' '] = { code: 'Space', shift: false }

const ARABIC_RE = /[\u0600-\u06FF]/

/** Translate a keyboard event to the Arabic text it should produce, or null. */
export function charsFromEvent(e: KeyboardEvent): string | null {
  if (e.metaKey || e.ctrlKey || e.altKey) return null
  // User already has a native Arabic layout active
  if (ARABIC_RE.test(e.key)) return e.key
  if (e.code === 'Space') return ' '
  const k = KEY_BY_CODE[e.code]
  if (!k) return null
  const out = e.shiftKey ? k.shift : k.base
  return out ?? null
}

export const MARK_NAMES: Record<string, string> = {
  '\u064E': 'fatḥa  َ',
  '\u064F': 'ḍamma  ُ',
  '\u0650': 'kasra  ِ',
  '\u0652': 'sukūn  ْ',
  '\u0651': 'shadda  ّ',
  '\u064B': 'tanwīn fatḥ  ً',
  '\u064C': 'tanwīn ḍamm  ٌ',
  '\u064D': 'tanwīn kasr  ٍ',
}
