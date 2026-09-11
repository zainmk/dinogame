import { create } from 'zustand'
import { CHARACTERS, type CharacterId } from './data/characters'
import { NPC_BY_ID } from './data/npcs'

export interface Dialogue {
  npcId: string
  line: number
}

export type Phase = 'select' | 'playing'

const STORAGE_KEY = 'dinogame.progress.v1'

interface SavedProgress {
  collected: string[]
}

/**
 * Coin progress is shared across all three dinosaurs and survives a reload —
 * no single character can finish the game, so progress that reset on a character
 * switch would make it unfinishable.
 *
 * Wrapped because storage throws outright in some privacy modes, and a game that
 * won't start because it can't save is worse than one that doesn't save.
 */
function loadProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as SavedProgress
    return new Set(Array.isArray(parsed.collected) ? parsed.collected : [])
  } catch {
    return new Set()
  }
}

function saveProgress(collected: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ collected: [...collected] }))
  } catch {
    // Not being able to persist is survivable; the run still works.
  }
}

interface GameState {
  /** 'select' shows the character screen, 'playing' mounts the world. */
  phase: Phase
  character: CharacterId
  /** Ids of coins already picked up. Replaced, never mutated, so React sees it change. */
  collected: Set<string>

  /**
   * Per-run world damage. Deliberately NOT persisted and cleared on every start:
   * a box the stegosaurus smashed is a platform the pterosaur still needs, so the
   * terrain has to come back intact each run. Only the coins carry over, which
   * makes every coin reachable no matter what order you play the characters in.
   */
  brokenBoxes: Set<string>
  burntTrees: Set<string>

  /** NPC in range, or null. Drives the "Press E" prompt. */
  nearbyNpc: string | null
  /** Open dialogue, or null. Non-null also freezes player movement. */
  dialogue: Dialogue | null

  setCharacter: (id: CharacterId) => void
  /** Step the selection by +1/-1, wrapping. Drives the select screen's arrows. */
  cycleCharacter: (step: number) => void
  startGame: () => void
  returnToSelect: () => void
  resetProgress: () => void

  collectCoin: (id: string) => void
  breakBox: (id: string) => void
  burnTree: (id: string) => void

  setNearbyNpc: (id: string | null) => void
  /** Opens a dialogue if closed, advances it if open, closes it past the last line. */
  interactWith: (npcId: string) => void
  advanceDialogue: () => void
}

/**
 * Discrete, event-driven state only — it re-renders the HUD when it changes, so
 * nothing per-frame belongs here. Per-frame values live in `state/player.ts`.
 *
 * useFrame reads this via `useGame.getState()`, which does not subscribe.
 */
export const useGame = create<GameState>((set, get) => ({
  phase: 'select',
  character: 'raptor',
  collected: loadProgress(),
  brokenBoxes: new Set(),
  burntTrees: new Set(),
  nearbyNpc: null,
  dialogue: null,

  setCharacter: (id) => set({ character: id }),

  cycleCharacter: (step) =>
    set((s) => {
      const i = CHARACTERS.findIndex((c) => c.id === s.character)
      const next = (i + step + CHARACTERS.length) % CHARACTERS.length
      return { character: CHARACTERS[next].id }
    }),

  startGame: () =>
    set({
      phase: 'playing',
      brokenBoxes: new Set(),
      burntTrees: new Set(),
      nearbyNpc: null,
      dialogue: null,
    }),

  returnToSelect: () => set({ phase: 'select', dialogue: null, nearbyNpc: null }),

  resetProgress: () => {
    saveProgress(new Set())
    set({ collected: new Set(), brokenBoxes: new Set(), burntTrees: new Set() })
  },

  collectCoin: (id) =>
    set((s) => {
      if (s.collected.has(id)) return s
      const collected = new Set(s.collected)
      collected.add(id)
      saveProgress(collected)
      return { collected }
    }),

  breakBox: (id) =>
    set((s) => {
      if (s.brokenBoxes.has(id)) return s
      const brokenBoxes = new Set(s.brokenBoxes)
      brokenBoxes.add(id)
      return { brokenBoxes }
    }),

  burnTree: (id) =>
    set((s) => {
      if (s.burntTrees.has(id)) return s
      const burntTrees = new Set(s.burntTrees)
      burntTrees.add(id)
      return { burntTrees }
    }),

  setNearbyNpc: (id) => set((s) => (s.nearbyNpc === id ? s : { nearbyNpc: id })),

  interactWith: (npcId) => {
    const { dialogue } = get()
    if (dialogue) get().advanceDialogue()
    else set({ dialogue: { npcId, line: 0 } })
  },

  advanceDialogue: () =>
    set((s) => {
      if (!s.dialogue) return s
      const npc = NPC_BY_ID.get(s.dialogue.npcId)
      const next = s.dialogue.line + 1
      if (!npc || next >= npc.lines.length) return { dialogue: null }
      return { dialogue: { ...s.dialogue, line: next } }
    }),
}))
