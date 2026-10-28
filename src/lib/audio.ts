let voice: SpeechSynthesisVoice | null = null
const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window

function pickVoice() {
  const voices = speechSynthesis.getVoices()
  voice = voices.find((v) => v.lang === 'ar-SA') ?? voices.find((v) => v.lang.startsWith('ar')) ?? null
}
if (hasTTS) {
  pickVoice()
  speechSynthesis.addEventListener('voiceschanged', pickVoice)
}

export function speak(text: string, rate = 0.8) {
  if (!hasTTS) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = voice?.lang ?? 'ar-SA'
  if (voice) u.voice = voice
  u.rate = rate
  speechSynthesis.speak(u)
}

export const hasArabicVoice = () => hasTTS && voice !== null

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
