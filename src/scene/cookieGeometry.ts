import { BufferAttribute, BufferGeometry, Color, CylinderGeometry, SphereGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mulberry32 } from '../math/sphere'

const DOUGH = new Color('#d9a35c')
const DOUGH_EDGE = new Color('#b57c3a')
const CHIP = new Color('#3f2416')

/** Fill (or add) a per-vertex colour attribute with one flat colour. */
function paint(geometry: BufferGeometry, color: Color): void {
  const n = geometry.getAttribute('position').count
  const colors = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) color.toArray(colors, i * 3)
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
}

/**
 * A chocolate chip cookie as a single BufferGeometry, so the whole batch can
 * still be one instanced draw call.
 *
 * The chips are real geometry — small flattened spheres merged into the disc —
 * rather than a texture, because the cookie stands on edge and spins, so both
 * faces are seen and a texture's seams would show on the rim. Colour is
 * per-vertex, which is what lets one material paint dough and chips at once.
 * Every cookie shares the same chip layout; with each spinning at its own
 * phase, nobody can tell.
 */
export function makeCookieGeometry(radius: number, thickness: number, seed = 7): BufferGeometry {
  const rng = mulberry32(seed)

  // Dough: a low cylinder with the rim pushed in and out a little, so it reads
  // as baked rather than machined.
  const dough = new CylinderGeometry(radius, radius, thickness, 22)
  const pos = dough.getAttribute('position')
  const colors = new Float32Array(pos.count * 3)
  const c = new Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const r = Math.hypot(x, z)
    if (r > 1e-4) {
      const a = Math.atan2(z, x)
      const wobble = 1 + 0.05 * Math.sin(3 * a + 0.7) + 0.035 * Math.sin(7 * a + 2.1)
      pos.setX(i, x * wobble)
      pos.setZ(i, z * wobble)
    }
    // Darker towards the rim, the way a cookie browns at the edge.
    c.copy(DOUGH).lerp(DOUGH_EDGE, Math.pow(Math.min(1, r / radius), 2) * 0.85)
    c.toArray(colors, i * 3)
  }
  dough.setAttribute('color', new BufferAttribute(colors, 3))
  dough.computeVertexNormals()

  // Chips on both faces, scattered inside the disc and sitting slightly proud.
  const chips: BufferGeometry[] = []
  const chipR = radius * 0.17
  for (const face of [1, -1]) {
    for (let i = 0; i < 7; i++) {
      // Uniform over the disc: sqrt on the radius, or they'd bunch at the centre.
      const rr = Math.sqrt(rng()) * radius * 0.7
      const a = rng() * Math.PI * 2
      const chip = new SphereGeometry(chipR * (0.8 + rng() * 0.4), 7, 5)
      chip.scale(1, 0.55, 1)
      chip.translate(Math.cos(a) * rr, face * (thickness / 2 + chipR * 0.12), Math.sin(a) * rr)
      paint(chip, CHIP)
      chips.push(chip)
    }
  }

  const merged = mergeGeometries([dough, ...chips], false)
  if (!merged) throw new Error('cookie geometry failed to merge')
  return merged
}
