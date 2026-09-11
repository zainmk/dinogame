import { useEffect } from 'react'

/**
 * Continuous input, read every frame by `Player`.
 *
 *   move: +1 forward, -1 back
 *   turn: +1 right,   -1 left
 *
 * Two sources feed it — the keyboard (digital, -1/0/1) and the touch stick
 * (analog) — summed and clamped, so either works alone and neither fights the
 * other. `moveOnSphere` multiplies these straight in, which is why the stick
 * gets proportional speed for free.
 */
export const input = { move: 0, turn: 0 }

const keys = { move: 0, turn: 0 }
const stick = { move: 0, turn: 0 }

const clamp1 = (v: number) => Math.max(-1, Math.min(1, v))

function recompute() {
  input.move = clamp1(keys.move + stick.move)
  input.turn = clamp1(keys.turn + stick.turn)
}

/** The touch joystick's current deflection, each in [-1, 1]. Zero when released. */
export function setStick(move: number, turn: number): void {
  stick.move = move
  stick.turn = turn
  recompute()
}

/**
 * Interact is edge-triggered, not held: one press is one event, whether it opens
 * a dialogue or advances a line. `Npcs` drains this once per frame.
 */
let interactQueued = false

export function consumeInteract(): boolean {
  if (!interactQueued) return false
  interactQueued = false
  return true
}

/** Lets the context key hand a press to the interact queue. See `consumeContext`. */
export function queueInteract(): void {
  interactQueued = true
}

/**
 * Space is the *context* key, queued separately from interact.
 *
 * It means "jump" most of the time, but "talk" when there's an NPC in front of
 * you or a dialogue open — you should never leap over someone you were trying to
 * speak to. `Player` drains this and decides which, because it owns the jump;
 * when it decides "talk" it forwards the press with `queueInteract`.
 */
let contextQueued = false

export function consumeContext(): boolean {
  if (!contextQueued) return false
  contextQueued = false
  return true
}

/** The touch action button. One press is one event, same as a Space tap. */
export function queueContext(): void {
  contextQueued = true
}

const FORWARD = new Set(['KeyW', 'ArrowUp'])
const BACK = new Set(['KeyS', 'ArrowDown'])
const LEFT = new Set(['KeyA', 'ArrowLeft'])
const RIGHT = new Set(['KeyD', 'ArrowRight'])
/** Explicit talk. Space is handled separately, as the context key. */
const INTERACT = new Set(['KeyE', 'Enter'])
const CONTEXT = new Set(['Space'])

const held = new Set<string>()

/**
 * Drop all held keys and any queued interact. Used when handing control from the
 * select screen to the world, so the keypress that started the game doesn't also
 * register in it.
 */
export function resetInput(): void {
  held.clear()
  interactQueued = false
  contextQueued = false
  keys.move = 0
  keys.turn = 0
  stick.move = 0
  stick.turn = 0
  recompute()
}

function recomputeKeys() {
  let move = 0
  let turn = 0
  for (const code of held) {
    if (FORWARD.has(code)) move += 1
    else if (BACK.has(code)) move -= 1
    else if (LEFT.has(code)) turn -= 1
    else if (RIGHT.has(code)) turn += 1
  }
  // Sign, so holding W and ArrowUp together isn't double speed.
  keys.move = Math.sign(move)
  keys.turn = Math.sign(turn)
  recompute()
}

/** Attaches the keyboard listeners. Call once, from App. */
export function useInputListeners(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (INTERACT.has(e.code)) {
        e.preventDefault()
        // e.repeat guards against key-repeat firing a burst of interactions.
        if (!e.repeat) interactQueued = true
        return
      }
      if (CONTEXT.has(e.code)) {
        // Also stops Space scrolling the page.
        e.preventDefault()
        if (!e.repeat) contextQueued = true
        return
      }
      if (e.repeat) return
      held.add(e.code)
      recomputeKeys()
    }

    const onKeyUp = (e: KeyboardEvent) => {
      held.delete(e.code)
      recomputeKeys()
    }

    // Alt-tabbing away while holding W would otherwise leave the dino running.
    const onBlur = () => {
      held.clear()
      recomputeKeys()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])
}
