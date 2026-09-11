import { Vector3 } from 'three'
import { createSurfaceState } from '../math/sphere'

/**
 * The player's live position/heading on the sphere.
 *
 * Deliberately NOT in React state or a store: it changes every frame, and
 * anything that re-rendered on it would re-render 60 times a second. `Player`
 * writes it inside useFrame; the camera, coins and NPCs read it there too.
 * Only discrete, event-driven state (score, dialogue) lives in the Zustand store.
 */
export const player = createSurfaceState(new Vector3(0, 1, 0), new Vector3(0, 0, -1))

/** Ticks up while running. Drives the leg swing and body bob. */
export const gait = { phase: 0, speed: 0 }

/**
 * The jump, in the same mutable style and for the same reason.
 *
 * `altitude` is height above the surface, added straight to the sphere radius
 * when the player is placed — the sphere math itself never learns about jumping.
 * `airtime` is the total flight time computed at launch, which is what lets the
 * flip land exactly upright (see `Player`).
 */
export const jump = {
  airborne: false,
  altitude: 0,
  vy: 0,
  elapsed: 0,
  airtime: 0,
  /** 0 on the ground, 1 in the air. Smoothed, so poses blend instead of snapping. */
  blend: 0,
}

/**
 * The timed part of an ability — the fire breath and the tail swing. Flight has
 * no windup, so it just uses `jump` plus `flapsLeft`.
 */
export const ability = {
  active: false,
  elapsed: 0,
  duration: 0,
  /** Set once the swing has landed its hit, so one whip can't smash twice. */
  struck: false,
}

/** Mid-air flaps remaining. Refilled on landing. */
export const flight = { flapsLeft: 0 }

export function resetAbility(): void {
  ability.active = false
  ability.elapsed = 0
  ability.duration = 0
  ability.struck = false
  flight.flapsLeft = 0
}

export function resetJump(): void {
  jump.airborne = false
  jump.altitude = 0
  jump.vy = 0
  jump.elapsed = 0
  jump.airtime = 0
  jump.blend = 0
}
