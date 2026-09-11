import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { BOX_RADIUS, CRATE_TIER, WORLD_RADIUS } from '../config'
import { BOXES, type Box } from '../data/world'
import { anyTangent, createSurfaceState, orientToSurface } from '../math/sphere'
import { useGame } from '../store'
import { Stud } from '../characters/rig'

/** Half-width of the visible crate. Slightly under the collision footprint. */
const HALF = BOX_RADIUS * 0.82

/**
 * Stacked crates the player can stand on. Boxes are solid: `Player` pushes out
 * of their footprint, and their top face acts as ground.
 *
 * The stegosaurus smashes them, which removes them from the world and reveals
 * the coins inside. That damage is per-run, so the pterosaur always finds them
 * intact when it needs them as platforms.
 */
export function Boxes() {
  // Re-renders only when a box breaks, which is a discrete event.
  const broken = useGame((s) => s.brokenBoxes)
  return (
    <>
      {BOXES.filter((b) => !broken.has(b.id)).map((box) => (
        <Crate key={box.id} box={box} />
      ))}
    </>
  )
}

function Crate({ box }: { box: Box }) {
  const group = useRef<Group>(null)

  // Fixed in place, so the orientation is computed once.
  const surface = useMemo(
    () => createSurfaceState(box.pos, anyTangent(box.pos)),
    [box.pos],
  )

  useFrame(() => {
    if (group.current) orientToSurface(group.current, surface, WORLD_RADIUS)
  })

  // Stack of crates making up the column, so a tall box reads as tall rather
  // than as one enormous cube.
  // Never fewer than two, whatever the height says.
  const tiers = Math.max(2, Math.round(box.height / CRATE_TIER))
  const tierHeight = box.height / tiers

  return (
    <group ref={group}>
      {Array.from({ length: tiers }, (_, i) => (
        <group key={i} position={[0, i * tierHeight + tierHeight / 2, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[HALF * 2, tierHeight * 0.96, HALF * 2]} />
            <meshStandardMaterial color={box.tint} flatShading roughness={0.85} />
          </mesh>
          {/* banding, so the crate doesn't read as a plain cube */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[HALF * 2.04, tierHeight * 0.18, HALF * 2.04]} />
            <meshStandardMaterial color="#7d4a1c" flatShading roughness={0.9} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <Stud
            key={`${x}:${z}`}
            color={box.tint}
            position={[x * HALF * 0.5, box.height + 0.02, z * HALF * 0.5]}
          />
        )),
      )}
    </group>
  )
}
