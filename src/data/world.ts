import { Vector3 } from 'three'
import {
  BOX_COUNT,
  BOX_RADIUS,
  COIN_HOVER,
  GROUND_COIN_COUNT,
  TREE_COUNT,
  WORLD_RADIUS,
  WORLD_SEED,
} from '../config'
import { anyTangent, mulberry32, randomPointOnSphere } from '../math/sphere'
import { NPCS } from './npcs'

export interface Box {
  id: string
  /** Point on the unit sphere. */
  pos: Vector3
  /** Height of the top face above the surface. */
  height: number
  tint: string
}

export interface Tree {
  id: string
  pos: Vector3
  scale: number
}

/**
 * What a coin is waiting on. Undefined means it's simply lying in the open;
 * otherwise it stays hidden until that box is smashed or that tree is burnt.
 */
export type CoinGate = { kind: 'box' | 'tree'; id: string } | undefined

export interface Coin {
  id: string
  pos: Vector3
  /** Elevation above the surface. Box-top coins sit out of reach of the ground. */
  height: number
  /** Phase offset, so they don't all spin and bob in lockstep. */
  offset: number
  hiddenUntil: CoinGate
}

const rng = mulberry32(WORLD_SEED)

/** Where the player starts. Kept clear so nothing spawns on top of them. */
const SPAWN = new Vector3(0, 1, 0)

/**
 * Where the hole opens once every cookie is found. The centre of the tilted
 * cube's top face: straight ahead of the spawn and equally far from the four
 * nearest NPCs, so it sits in the middle of the family rather than off in a
 * corner. Kept clear of terrain from the start, even though it only appears at
 * the end.
 */
export const HOLE_POSITION = new Vector3(0, 0.4226, -0.9063).normalize()

const _t = new Vector3()

/** A point a short arc away from `center`, in a random direction. */
function nearby(center: Vector3, arc: number): Vector3 {
  anyTangent(center, _t).applyAxisAngle(center, rng() * Math.PI * 2)
  const axis = new Vector3().crossVectors(center, _t).normalize()
  return center.clone().applyAxisAngle(axis, arc / WORLD_RADIUS)
}

/**
 * Uniform random points, rejecting any that land too close to something already
 * placed. Without this, boxes end up inside trees and occasionally on an NPC's
 * head. Capped attempts so a bad seed can't hang the load.
 */
function scatter(count: number, minArc: number, taken: Vector3[]): Vector3[] {
  const out: Vector3[] = []
  const minDot = Math.cos(minArc / WORLD_RADIUS)
  for (let i = 0; i < count; i++) {
    let p = randomPointOnSphere(rng)
    for (let attempt = 0; attempt < 40; attempt++) {
      if (taken.every((q) => p.dot(q) < minDot)) break
      p = randomPointOnSphere(rng)
    }
    taken.push(p)
    out.push(p)
  }
  return out
}

// Everything keeps clear of the spawn point and of the NPCs.
const occupied: Vector3[] = [
  SPAWN.clone(),
  HOLE_POSITION.clone(),
  ...NPCS.map((n) => n.position.clone()),
]

/**
 * Box heights, cycled rather than random so the mix is guaranteed. The tall ones
 * are out of every jump in the game — only the pterosaur's flight reaches them.
 */
const HEIGHTS = [1.5, 2.4, 3.4]
const TINTS = ['#b9762f', '#a9682a', '#c08238']

export const BOXES: Box[] = scatter(BOX_COUNT, 5, occupied).map((pos, i) => ({
  id: `box-${i}`,
  pos,
  height: HEIGHTS[i % HEIGHTS.length],
  tint: TINTS[i % TINTS.length],
}))

export const TREES: Tree[] = scatter(TREE_COUNT, 4, occupied).map((pos, i) => ({
  id: `tree-${i}`,
  pos,
  scale: 0.85 + rng() * 0.4,
}))

/**
 * The coin layout, and with it the whole progression.
 *
 * Each character can only reach one gated group, so no single dinosaur can
 * finish the game:
 *   ground   — anyone
 *   box tops — only the pterosaur, which is the only one that can get up there
 *   in boxes — only the stegosaurus, whose tail whip breaks them open
 *   in trees — only the velociraptor, whose fire burns them down
 */
export const COINS: Coin[] = [
  ...scatter(GROUND_COIN_COUNT, 2, []).map((pos, i) => ({
    id: `coin-${i}`,
    pos,
    height: COIN_HOVER,
    offset: rng() * Math.PI * 2,
    hiddenUntil: undefined,
  })),

  ...BOXES.map((box) => ({
    id: `${box.id}-top`,
    pos: box.pos.clone(),
    height: box.height + 0.55,
    offset: rng() * Math.PI * 2,
    hiddenUntil: undefined,
  })),

  ...BOXES.flatMap((box) =>
    [0, 1].map((k) => ({
      id: `${box.id}-inside-${k}`,
      pos: nearby(box.pos, BOX_RADIUS * 0.75),
      height: COIN_HOVER,
      offset: rng() * Math.PI * 2,
      hiddenUntil: { kind: 'box' as const, id: box.id },
    })),
  ),

  ...TREES.flatMap((tree) =>
    [0, 1].map((k) => ({
      id: `${tree.id}-fruit-${k}`,
      pos: nearby(tree.pos, 0.9),
      height: COIN_HOVER,
      offset: rng() * Math.PI * 2,
      hiddenUntil: { kind: 'tree' as const, id: tree.id },
    })),
  ),
]

export const TOTAL_COINS = COINS.length
