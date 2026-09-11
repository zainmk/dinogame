import { create } from 'zustand'

/**
 * All the game's sound, synthesised with the Web Audio API. There are no audio
 * files anywhere: every sound is an oscillator or a burst of noise shaped by an
 * envelope, which is free, weightless, and suits a world made of bricks far
 * better than recorded samples would.
 *
 * Browsers keep an AudioContext silent until the user has interacted with the
 * page, so the context is created lazily and `unlock()` is wired to the first
 * click, tap or keypress. Until then every play call is a harmless no-op.
 */

const MUTE_KEY = 'dinogame.muted'

let ctx: AudioContext | null = null
let master: GainNode | null = null

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

interface AudioState {
  muted: boolean
  toggle: () => void
}

/** Reactive mute flag, so the HUD button and the master gain stay in step. */
export const useAudio = create<AudioState>((set, get) => ({
  muted: loadMuted(),
  toggle: () => {
    const muted = !get().muted
    set({ muted })
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
    } catch {
      // Not persisting the preference is survivable.
    }
    applyMute()
  },
}))

function applyMute(): void {
  if (!ctx || !master) return
  master.gain.setTargetAtTime(useAudio.getState().muted ? 0 : 0.6, ctx.currentTime, 0.02)
}

/**
 * Create the context (first time) and resume it. Must be called from inside a
 * user gesture handler, or the browser ignores it. Safe to call repeatedly.
 */
export function unlock(): void {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx = new Ctor()
    master = ctx.createGain()
    master.connect(ctx.destination)
    applyMute()
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

if (typeof window !== 'undefined') {
  const onGesture = () => {
    unlock()
    if (ctx?.state === 'running') {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
  }
  window.addEventListener('pointerdown', onGesture)
  window.addEventListener('keydown', onGesture)
}

/** A live, unmuted context and master bus — or null, in which case do nothing. */
function bus(): { c: AudioContext; out: GainNode } | null {
  if (!ctx || !master || ctx.state !== 'running') return null
  if (useAudio.getState().muted) return null
  return { c: ctx, out: master }
}

/** One note: an oscillator with a quick attack and an exponential release. */
function tone(
  c: AudioContext,
  out: AudioNode,
  opts: {
    at: number
    dur: number
    freq: number
    to?: number
    type?: OscillatorType
    gain?: number
    attack?: number
  },
): void {
  const { at, dur, freq, to, type = 'triangle', gain = 0.2, attack = 0.008 } = opts
  const o = c.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, at)
  if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  o.connect(g).connect(out)
  o.start(at)
  o.stop(at + dur + 0.02)
}

let noiseBuffer: AudioBuffer | null = null
function noise(c: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer
  const b = c.createBuffer(1, c.sampleRate, c.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  noiseBuffer = b
  return b
}

// ---------------------------------------------------------------------------

/** Cookie pickup: the classic two-note rising bloop. */
export function playPickup(): void {
  const b = bus()
  if (!b) return
  const t = b.c.currentTime
  tone(b.c, b.out, { at: t, dur: 0.07, freq: 988, type: 'square', gain: 0.12 })
  tone(b.c, b.out, { at: t + 0.07, dur: 0.16, freq: 1319, type: 'square', gain: 0.12 })
}

export interface Voice {
  /** Base pitch in Hz. Children high, grown-ups low. */
  base: number
  /** A cat: each word is a mew rather than a run of syllables. */
  mew?: boolean
}

const VOWELS = new Set('aeiou')

/**
 * Speech as gibberish, the way Animal Crossing does it: one short tone per
 * letter, its pitch nudged by which letter it is, so the same word always
 * sounds the same and different characters sound different. Vowels are held a
 * little longer; spaces are a beat of silence. Capped so a long line doesn't
 * chatter on for ages.
 */
export function speak(text: string, voice: Voice): void {
  const b = bus()
  if (!b) return
  const t0 = b.c.currentTime + 0.02

  if (voice.mew) {
    const words = text.split(/\s+/).filter(Boolean).slice(0, 4)
    words.forEach((w, i) => {
      const at = t0 + i * 0.32
      // A mew is a pitch that rises then falls, on a sine.
      const peak = voice.base * (w === w.toUpperCase() ? 1.9 : 1.6)
      tone(b.c, b.out, { at, dur: 0.12, freq: voice.base * 1.1, to: peak, type: 'sine', gain: 0.14, attack: 0.03 })
      tone(b.c, b.out, { at: at + 0.12, dur: 0.16, freq: peak, to: voice.base * 0.85, type: 'sine', gain: 0.14, attack: 0.005 })
    })
    return
  }

  let at = t0
  const chars = text.toLowerCase().slice(0, 34)
  for (const ch of chars) {
    if (ch === ' ') {
      at += 0.055
      continue
    }
    if (!/[a-z]/.test(ch)) continue
    const code = ch.charCodeAt(0) - 97
    const vowel = VOWELS.has(ch)
    // Up to a fifth above the base, spread across the alphabet.
    const freq = voice.base * Math.pow(2, ((code * 5) % 8) / 12)
    const dur = vowel ? 0.075 : 0.048
    tone(b.c, b.out, { at, dur, freq, to: freq * (vowel ? 0.94 : 1.03), type: 'triangle', gain: 0.1 })
    at += dur * 0.85
  }
}

/** A firework: a low bang of filtered noise, then a scatter of crackles. */
export function playFirework(delay = 0): void {
  const b = bus()
  if (!b) return
  const t = b.c.currentTime + Math.max(0, delay)

  const src = b.c.createBufferSource()
  src.buffer = noise(b.c)
  const filter = b.c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1400, t)
  filter.frequency.exponentialRampToValueAtTime(140, t + 0.5)
  const g = b.c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
  src.connect(filter).connect(g).connect(b.out)
  src.start(t)
  src.stop(t + 0.7)

  // Crackles: a handful of tiny high ticks trailing the bang.
  const n = 6 + Math.floor(Math.random() * 6)
  for (let i = 0; i < n; i++) {
    const at = t + 0.12 + Math.random() * 0.7
    tone(b.c, b.out, {
      at,
      dur: 0.03,
      freq: 2400 + Math.random() * 2400,
      type: 'square',
      gain: 0.03,
      attack: 0.002,
    })
  }
}

// --- Happy Birthday --------------------------------------------------------

/** MIDI note numbers and beat lengths. Public domain since 2016. */
const BIRTHDAY: [number, number][] = [
  [67, 0.5], [67, 0.5], [69, 1], [67, 1], [72, 1], [71, 2],
  [67, 0.5], [67, 0.5], [69, 1], [67, 1], [74, 1], [72, 2],
  [67, 0.5], [67, 0.5], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2],
  [77, 0.5], [77, 0.5], [76, 1], [72, 1], [74, 1], [72, 2.5],
]
const BEAT = 0.46

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

let songNodes: AudioNode[] = []

/** The tune, on a soft lead with a quiet octave underneath. Returns its length. */
export function playBirthday(): number {
  const b = bus()
  if (!b) return 0
  stopBirthday()

  const songOut = b.c.createGain()
  songOut.gain.value = 1
  songOut.connect(b.out)
  songNodes.push(songOut)

  let at = b.c.currentTime + 0.15
  for (const [midi, beats] of BIRTHDAY) {
    const dur = beats * BEAT
    tone(b.c, songOut, { at, dur: dur * 0.92, freq: hz(midi), type: 'triangle', gain: 0.16, attack: 0.02 })
    tone(b.c, songOut, { at, dur: dur * 0.9, freq: hz(midi - 12), type: 'sine', gain: 0.05, attack: 0.03 })
    at += dur
  }
  return at - b.c.currentTime
}

/** Cut the song off, for when the player leaves the party early. */
export function stopBirthday(): void {
  for (const n of songNodes) {
    try {
      n.disconnect()
    } catch {
      // already gone
    }
  }
  songNodes = []
}
