import { NPC_BY_ID } from '../data/npcs'
import { useGame } from '../store'
import { playPickup, speak, type Voice } from './audio'

/**
 * Sound reacts to the store rather than being called from game code: a
 * subscription watches for a cookie being collected or a dialogue line
 * changing and plays the matching sound. Nothing in Player, Npcs or the store
 * knows audio exists.
 */
useGame.subscribe((state, prev) => {
  if (state.collected.size > prev.collected.size) playPickup()

  const d = state.dialogue
  if (d && (d.npcId !== prev.dialogue?.npcId || d.line !== prev.dialogue?.line)) {
    const npc = NPC_BY_ID.get(d.npcId)
    if (npc) speak(npc.lines[d.line] ?? '', voiceFor(npc.id))
  }
})

/**
 * Each character gets a base pitch — children high, grown men low, the cat a
 * mew — so you can tell who's talking with your eyes shut.
 */
const VOICES: Record<string, Voice> = {
  ibi: { base: 340 },
  ayan: { base: 285 },
  nashra: { base: 255 },
  thathi: { base: 205 },
  mumma: { base: 235 },
  abu: { base: 150 },
  rafhy: { base: 165 },
  neko: { base: 520, mew: true },
}

function voiceFor(id: string): Voice {
  return VOICES[id] ?? { base: 220 }
}
