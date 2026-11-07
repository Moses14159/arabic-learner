let voice: SpeechSynthesisVoice | null = null
const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window

export type VoiceEngine = 'auto' | 'cloud' | 'system'

let preferredEngine: VoiceEngine =
  (typeof localStorage !== 'undefined' && (localStorage.getItem('qalam.voiceEngine') as VoiceEngine)) || 'auto'
let preferredRate: number =
  (typeof localStorage !== 'undefined' && Number(localStorage.getItem('qalam.voiceRate'))) || 0.85

export function getVoiceEngine(): VoiceEngine {
  return preferredEngine
}

export function setVoiceEngine(engine: VoiceEngine) {
  preferredEngine = engine
  if (typeof localStorage !== 'undefined') localStorage.setItem('qalam.voiceEngine', engine)
}

export function getVoiceRate(): number {
  return preferredRate
}

export function setVoiceRate(rate: number) {
  preferredRate = rate
  if (typeof localStorage !== 'undefined') localStorage.setItem('qalam.voiceRate', String(rate))
}

function pickVoice() {
  if (!hasTTS) return
  const voices = speechSynthesis.getVoices()
  voice =
    voices.find((v) => v.lang === 'ar-SA' && /Maged|Tarik|Laila|Mariam|Naayf|Natural/i.test(v.name)) ??
    voices.find((v) => v.lang === 'ar-SA') ??
    voices.find((v) => v.lang.startsWith('ar')) ??
    null
}

if (hasTTS) {
  pickVoice()
  speechSynthesis.addEventListener('voiceschanged', pickVoice)
}

let activeAudio: HTMLAudioElement | null = null
let speakTimer = 0

function speakSystem(text: string, rate: number) {
  if (!hasTTS) return
  if (!voice) pickVoice()
  speechSynthesis.cancel()
  clearTimeout(speakTimer)
  speakTimer = window.setTimeout(() => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = voice?.lang ?? 'ar-SA'
    if (voice) u.voice = voice
    u.rate = rate
    speechSynthesis.speak(u)
  }, 20)
}

function speakCloud(text: string, rate: number) {
  if (typeof window === 'undefined') return
  if (activeAudio) {
    activeAudio.pause()
    activeAudio = null
  }
  if (hasTTS) speechSynthesis.cancel()

  const q = encodeURIComponent(text.trim())
  const urls = [
    `https://dict.youdao.com/dictvoice?le=ar&audio=${q}`,
    `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=ar&q=${q}`,
  ]

  const tryUrl = (idx: number) => {
    if (idx >= urls.length) {
      speakSystem(text, rate)
      return
    }
    const audio = new Audio()
    audio.setAttribute('referrerpolicy', 'no-referrer')
    audio.src = urls[idx]
    audio.playbackRate = Math.max(0.5, Math.min(1.5, rate))
    activeAudio = audio
    audio.onerror = () => tryUrl(idx + 1)
    const p = audio.play()
    if (p !== undefined) {
      p.catch(() => tryUrl(idx + 1))
    }
  }

  tryUrl(0)
}

/**
 * Speak Arabic text with automatic Cloud TTS + Web Speech API dual engine.
 * Works out-of-the-box even when the OS has no pre-installed Arabic voice.
 */
export function speak(text: string, customRate?: number) {
  const rate = customRate ?? preferredRate
  if (!voice) pickVoice()

  if (preferredEngine === 'cloud') {
    speakCloud(text, rate)
  } else if (preferredEngine === 'system') {
    if (voice) speakSystem(text, rate)
    else speakCloud(text, rate)
  } else {
    // 'auto': prefer native system Arabic voice if installed, otherwise stream Cloud Arabic TTS
    if (voice) speakSystem(text, rate)
    else speakCloud(text, rate)
  }
}

export const hasArabicVoice = () => true
export const hasLocalArabicVoice = () => {
  if (!voice) pickVoice()
  return hasTTS && voice !== null
}

/**
 * Break academic Arabic transliteration (e.g. "mudarrisun", "al-madrasatu")
 * into readable phonetic syllables ("mu · dar · ri · sun") and a Chinese phonetic hint ("穆·达尔·里·孙").
 */
export function formatPronunciation(tr: string): { syllables: string; zhHint: string; zhPhonetic: string } {
  const clean = tr
    .replace(/\[.*?\]/g, '')
    .split('/')[0]
    .replace(/\(.*?\)/g, '')
    .trim()
  if (!clean) return { syllables: tr, zhHint: '', zhPhonetic: '' }

  const words = clean.split(/\s+/)
  const sylWords: string[] = []
  const zhWords: string[] = []

  for (const w of words) {
    const { syls, zh } = syllabifyWord(w.toLowerCase())
    sylWords.push(syls.join('·'))
    zhWords.push(zh.join(''))
  }

  const zhStr = zhWords.join('·')
  return {
    syllables: sylWords.join(' '),
    zhHint: zhStr,
    zhPhonetic: zhStr,
  }
}

function syllabifyWord(raw: string): { syls: string[]; zh: string[] } {
  // Normalize prefixes like al-
  const w = raw.replace(/^al-/, 'al|')
  // Tokenize into consonant / vowel units
  const tokens: { type: 'C' | 'V'; val: string }[] = []
  let i = 0
  const s = w.replace(/[-|]/g, '')
  while (i < s.length) {
    const two = s.slice(i, i + 2)
    if (['sh', 'kh', 'gh', 'th', 'dh', 'ch', 'ay', 'aw', 'īy', 'ūw'].includes(two)) {
      const isDiphthong = two === 'ay' || two === 'aw'
      tokens.push({ type: isDiphthong ? 'V' : 'C', val: two })
      i += 2
      continue
    }
    const ch = s[i]
    if ('aeiouāīū'.includes(ch)) {
      tokens.push({ type: 'V', val: ch })
    } else {
      tokens.push({ type: 'C', val: ch })
    }
    i++
  }

  // Group into CV or CVC syllables
  const syls: string[] = []
  let cur = ''
  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k]
    cur += t.val
    if (t.type === 'V') {
      // Check how many consonants follow before the next vowel
      const next1 = tokens[k + 1]
      const next2 = tokens[k + 2]
      if (!next1) {
        syls.push(cur)
        cur = ''
      } else if (next1.type === 'C' && (!next2 || next2.type === 'C')) {
        // CVC closed syllable
        cur += next1.val
        k++
        // If there is a third consonant at the very end of the word, attach it too
        if (tokens[k + 1] && tokens[k + 1].type === 'C' && !tokens[k + 2]) {
          cur += tokens[k + 1].val
          k++
        }
        syls.push(cur)
        cur = ''
      } else {
        // Open CV syllable
        syls.push(cur)
        cur = ''
      }
    }
  }
  if (cur) {
    if (syls.length > 0) syls[syls.length - 1] += cur
    else syls.push(cur)
  }

  const zh = syls.map(syllableToZh)
  return { syls, zh }
}

const ZH_ONSET: Record<string, Record<string, string>> = {
  b: { a: '巴', i: '比', u: '布', ay: '拜', aw: '包' },
  t: { a: '塔', i: '提', u: '图', ay: '泰', aw: '陶' },
  'ṭ': { a: '塔', i: '蒂', u: '图', ay: '泰', aw: '陶' },
  th: { a: '萨', i: '西', u: '苏', ay: '赛', aw: '骚' },
  j: { a: '贾', i: '吉', u: '朱', ay: '杰', aw: '焦' },
  'ḥ': { a: '哈', i: '希', u: '胡', ay: '海', aw: '豪' },
  kh: { a: '哈', i: '黑', u: '胡', ay: '海', aw: '豪' },
  d: { a: '达', i: '迪', u: '杜', ay: '代', aw: '道' },
  'ḍ': { a: '达', i: '迪', u: '杜', ay: '代', aw: '道' },
  dh: { a: '扎', i: '兹', u: '祖', ay: '宰', aw: '糟' },
  r: { a: '拉', i: '里', u: '鲁', ay: '莱', aw: '劳' },
  z: { a: '扎', i: '齐', u: '祖', ay: '宰', aw: '糟' },
  'ẓ': { a: '扎', i: '兹', u: '祖', ay: '宰', aw: '糟' },
  s: { a: '萨', i: '西', u: '苏', ay: '赛', aw: '骚' },
  'ṣ': { a: '萨', i: '绥', u: '苏', ay: '赛', aw: '骚' },
  sh: { a: '沙', i: '希', u: '舒', ay: '晒', aw: '烧' },
  'ʿ': { a: '阿', i: '伊', u: '欧', ay: '艾', aw: '奥' },
  'ʾ': { a: '阿', i: '伊', u: '乌', ay: '艾', aw: '奥' },
  gh: { a: '嘎', i: '吉', u: '古', ay: '盖', aw: '高' },
  f: { a: '法', i: '菲', u: '福', ay: '费', aw: '佛' },
  q: { a: '卡', i: '基', u: '库', ay: '凯', aw: '考' },
  k: { a: '卡', i: '基', u: '库', ay: '凯', aw: '考' },
  l: { a: '拉', i: '利', u: '卢', ay: '莱', aw: '劳' },
  m: { a: '马', i: '米', u: '穆', ay: '麦', aw: '毛' },
  n: { a: '纳', i: '尼', u: '努', ay: '奈', aw: '恼' },
  h: { a: '哈', i: '希', u: '胡', ay: '海', aw: '豪' },
  w: { a: '瓦', i: '维', u: '伍', ay: '威', aw: '沃' },
  y: { a: '亚', i: '伊', u: '优', ay: '耶', aw: '约' },
  '': { a: '阿', i: '伊', u: '乌', ay: '艾', aw: '奥' },
}

const ZH_CODA: Record<string, string> = {
  n: '恩',
  m: '姆',
  l: '尔',
  r: '尔',
  b: '卜',
  t: '特',
  'ṭ': '特',
  d: '德',
  'ḍ': '德',
  k: '克',
  q: '格',
  f: '夫',
  s: '斯',
  'ṣ': '斯',
  z: '兹',
  sh: '什',
  j: '吉',
  th: '斯',
  dh: '兹',
  'ḥ': '赫',
  kh: '赫',
  gh: '格',
}

function syllableToZh(syl: string): string {
  const m = syl.match(/^(sh|kh|gh|th|dh|.)?(ay|aw|[aāiīuū])(.*)$/)
  if (!m) return ''
  const onsetRaw = (m[1] ?? '').replace(/^[ʿʾ]/, 'ʿ')
  const vRaw = m[2]
  const codaRaw = m[3] ?? ''

  const vKey = vRaw === 'ay' || vRaw === 'aw' ? vRaw : vRaw === 'i' || vRaw === 'ī' ? 'i' : vRaw === 'u' || vRaw === 'ū' ? 'u' : 'a'

  // Special common closed syllables (-un, -an, -in, al, min, man, etc.)
  if (codaRaw === 'n') {
    if (onsetRaw === 'b' && vKey === 'u') return '本'
    if (onsetRaw === 'b' && vKey === 'a') return '班'
    if (onsetRaw === 't' && vKey === 'u') return '吞'
    if (onsetRaw === 't' && vKey === 'a') return '坦'
    if (onsetRaw === 't' && vKey === 'i') return '廷'
    if (onsetRaw === 'd' && vKey === 'u') return '顿'
    if (onsetRaw === 'd' && vKey === 'a') return '丹'
    if (onsetRaw === 'r' && vKey === 'u') return '伦'
    if (onsetRaw === 'r' && vKey === 'a') return '兰'
    if (onsetRaw === 'l' && vKey === 'u') return '伦'
    if (onsetRaw === 'l' && vKey === 'a') return '兰'
    if (onsetRaw === 's' && vKey === 'u') return '孙'
    if (onsetRaw === 'm' && vKey === 'u') return '蒙'
    if (onsetRaw === 'm' && vKey === 'a') return '曼'
    if (onsetRaw === 'm' && vKey === 'i') return '敏'
    if (onsetRaw === 'k' && vKey === 'u') return '昆'
    if (onsetRaw === 'n' && vKey === 'u') return '农'
  }

  const base = ZH_ONSET[onsetRaw]?.[vKey] ?? ZH_ONSET[''][vKey] ?? '阿'
  if (!codaRaw || codaRaw === onsetRaw) return base
  const coda = ZH_CODA[codaRaw] ?? ''
  return base + coda
}

let ctx: AudioContext | null = null
function tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0) {
  ctx ??= new AudioContext()
  const t = ctx.currentTime + delay
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(ctx.destination)
  o.start(t)
  o.stop(t + dur)
}

export const sfx = {
  key: () => tone(1800, 0.04, 'triangle', 0.05),
  error: () => {
    tone(180, 0.18, 'sawtooth', 0.06)
    tone(140, 0.2, 'sawtooth', 0.05, 0.05)
  },
  word: () => {
    tone(660, 0.12, 'sine', 0.08)
    tone(990, 0.18, 'sine', 0.07, 0.07)
  },
}
