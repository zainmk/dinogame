import { Matrix4, Object3D, Quaternion, Vector3 } from 'three'

/**
 * A position + heading on the unit sphere.
 *
 * Invariants, maintained by `moveOnSphere`:
 *   |pos| === 1
 *   |forward| === 1
 *   pos . forward === 0   (forward is tangent to the sphere at pos)
 *
 * `pos` doubles as the local "up" vector, which is what makes all of this cheap.
 */
export interface SurfaceState {
  pos: Vector3
  forward: Vector3
}

export function createSurfaceState(pos = new Vector3(0, 1, 0), forward = new Vector3(0, 0, -1)): SurfaceState {
  const state = { pos: pos.clone().normalize(), forward: forward.clone() }
  orthonormalize(state)
  return state
}

/** Scratch vectors — module-level so the per-frame path never allocates. */
const _right = new Vector3()
const _proj = new Vector3()
const _matrix = new Matrix4()
const _negForward = new Vector3()
const _quat = new Quaternion()

/**
 * The local right-hand axis: forward x up.
 *
 * (Not `up x forward` — that gives *left*. With up=+Y and forward=-Z, which is
 * the direction three.js meshes face by default, forward x up = +X = right.)
 */
export function rightAxis(state: SurfaceState, out = _right): Vector3 {
  return out.copy(state.forward).cross(state.pos).normalize()
}

/**
 * Force the invariants back after a frame of floating-point rotation. Drift is
 * tiny per frame but accumulates over minutes of play until the basis skews.
 */
export function orthonormalize(state: SurfaceState): void {
  state.pos.normalize()
  // Remove any component of forward that has crept along the up axis.
  _proj.copy(state.pos).multiplyScalar(state.forward.dot(state.pos))
  state.forward.sub(_proj).normalize()
}

/**
 * Advance one frame.
 *
 * `move` and `turn` are in [-1, 1]. Both are scaled by `dt`, so speed is
 * frame-rate independent.
 *
 * Running is a rotation of the whole basis about the right axis: travelling an
 * arc of length s on a sphere of radius R sweeps an angle of s/R. Turning is a
 * rotation of the heading alone about the up axis. Crossing a pole needs no
 * special case — it is just more rotation.
 */
export function moveOnSphere(
  state: SurfaceState,
  move: number,
  turn: number,
  dt: number,
  radius: number,
  moveSpeed: number,
  turnSpeed: number,
): void {
  if (turn !== 0) {
    state.forward.applyAxisAngle(state.pos, -turn * turnSpeed * dt)
  }

  if (move !== 0) {
    const right = rightAxis(state)
    const theta = (move * moveSpeed * dt) / radius
    state.pos.applyAxisAngle(right, -theta)
    state.forward.applyAxisAngle(right, -theta)
  }

  orthonormalize(state)
}

const _tangent = new Vector3()
const _side = new Vector3()
const _axis = new Vector3()

/**
 * Any unit vector tangent to the sphere at `normal`. Crossing with whichever
 * world axis is least aligned with the normal avoids the degenerate case where
 * the two are parallel.
 */
export function anyTangent(normal: Vector3, out = new Vector3()): Vector3 {
  const axis = Math.abs(normal.y) < 0.9 ? UP : X_AXIS
  return out.crossVectors(axis, normal).normalize()
}
const X_AXIS = new Vector3(1, 0, 0)

/**
 * The unit tangent at `from` pointing along the great circle towards `to`.
 * Returns false when the two are the same point or antipodal, where every
 * direction is equally valid and the caller should do nothing.
 */
export function tangentToward(from: Vector3, to: Vector3, out: Vector3): boolean {
  out.copy(to).addScaledVector(from, -to.dot(from))
  if (out.lengthSq() < 1e-8) return false
  out.normalize()
  return true
}

/**
 * If `state.pos` is inside a circle of arc radius `arc` around `center`, slide
 * it back out to the edge. Returns true if it moved.
 *
 * This is the whole of solid-object collision on the sphere: rotate the position
 * away from the obstacle's centre about the axis perpendicular to both. `forward`
 * gets the same rotation so it stays tangent — without that the basis skews and
 * the character's orientation drifts on every bump.
 */
export function pushOutside(
  state: SurfaceState,
  center: Vector3,
  arc: number,
  radius: number,
): boolean {
  const needed = arc / radius
  const angle = Math.acos(Math.min(1, Math.max(-1, state.pos.dot(center))))
  if (angle >= needed) return false

  _axis.crossVectors(center, state.pos)
  if (_axis.lengthSq() < 1e-10) {
    // Standing exactly on the centre: no "away" direction exists, so pick one.
    _axis.crossVectors(center, state.forward)
    if (_axis.lengthSq() < 1e-10) return false
  }
  _axis.normalize()

  const delta = needed - angle
  state.pos.applyAxisAngle(_axis, delta)
  state.forward.applyAxisAngle(_axis, delta)
  orthonormalize(state)
  return true
}

/**
 * Rotate `state.forward` towards `target` (a point on the unit sphere), turning
 * at most `turnSpeed` radians per second. Returns the angle it still had to
 * cover before this frame's turn, so callers can tell how far off it is.
 *
 * The target direction is the great-circle heading from `state.pos` to `target`,
 * which is just `target` with its component along the local up removed. Sign
 * comes from `up x forward`: by Rodrigues, a positive rotation about up carries
 * forward towards that vector.
 */
export function turnToward(
  state: SurfaceState,
  target: Vector3,
  dt: number,
  turnSpeed: number,
): number {
  // Project the target onto the tangent plane at pos.
  _tangent.copy(target).addScaledVector(state.pos, -target.dot(state.pos))

  // Degenerate when the target is directly underfoot or exactly antipodal:
  // every heading is equally correct, so keep the current one.
  if (_tangent.lengthSq() < 1e-8) return 0
  _tangent.normalize()

  const angle = Math.acos(Math.min(1, Math.max(-1, state.forward.dot(_tangent))))
  if (angle < 1e-4) return angle

  _side.copy(state.pos).cross(state.forward)
  // `|| 1` breaks the tie when the target is exactly behind: acos gives PI and
  // the dot gives 0, which would otherwise leave it frozen facing backwards.
  const direction = Math.sign(_tangent.dot(_side)) || 1

  // Ease in, then clamp to the turn rate, so a big turn is capped and a small
  // one settles smoothly instead of stopping dead.
  const eased = angle * direction * (1 - Math.exp(-8 * dt))
  const limit = turnSpeed * dt
  const step = Math.max(-limit, Math.min(limit, eased))

  state.forward.applyAxisAngle(state.pos, step)
  orthonormalize(state)
  return angle
}

/**
 * Place and orient an object so it stands on the surface at `state.pos` facing
 * `state.forward`.
 *
 * The basis is (right, up, -forward) because three.js objects look down their
 * local -Z.
 */
export function orientToSurface(
  object: Object3D,
  state: SurfaceState,
  radius: number,
  altitude = 0,
): void {
  const right = rightAxis(state)
  _negForward.copy(state.forward).negate()
  _matrix.makeBasis(right, state.pos, _negForward)

  object.position.copy(state.pos).multiplyScalar(radius + altitude)
  object.quaternion.setFromRotationMatrix(_matrix)
}

/** Quaternion that rotates +Y onto the surface normal at `normal`. */
export function surfaceQuaternion(normal: Vector3, out = _quat): Quaternion {
  return out.setFromUnitVectors(UP, normal)
}
const UP = new Vector3(0, 1, 0)

/**
 * Proximity test between two points on the unit sphere.
 *
 * The dot product of two unit vectors is the cosine of the angle between them,
 * so this is a great-circle distance check for the price of one dot product —
 * no square roots, no bounding volumes, no physics engine.
 */
export function isWithinArc(a: Vector3, b: Vector3, arc: number, radius: number): boolean {
  return a.dot(b) > Math.cos(arc / radius)
}

/** Small deterministic PRNG, so the world lays out the same way every reload. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A uniformly distributed random point on the unit sphere.
 *
 * Sampling theta and phi independently is the classic bug — it bunches points at
 * the poles. Sampling z uniformly in [-1, 1] does not, because a sphere's area
 * is distributed uniformly along its axis (Archimedes' hat-box theorem).
 */
export function randomPointOnSphere(rng: () => number, out = new Vector3()): Vector3 {
  const z = rng() * 2 - 1
  const phi = rng() * Math.PI * 2
  const r = Math.sqrt(1 - z * z)
  return out.set(r * Math.cos(phi), r * Math.sin(phi), z)
}
