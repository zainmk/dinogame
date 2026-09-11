import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { HOLE_RADIUS, WORLD_RADIUS } from '../config'
import { HOLE_POSITION, TOTAL_COINS } from '../data/world'
import { anyTangent, createSurfaceState, orientToSurface } from '../math/sphere'
import { useGame } from '../store'

/**
 * The way down to the party. Doesn't exist until every cookie is found — a
 * sealed hole you can't use yet only invites "why won't it work?", so it simply
 * isn't there until it does.
 *
 * Visually a black disc with a lip of turned earth and a slow pulse of light at
 * the rim, so it reads as a hole from the chase camera rather than as a sticker.
 */
export function Hole() {
  const done = useGame((s) => s.collected.size >= TOTAL_COINS)
  const group = useRef<Group>(null)
  const glow = useRef<Mesh>(null)

  const surface = useMemo(
    () => createSurfaceState(HOLE_POSITION, anyTangent(HOLE_POSITION)),
    [],
  )

  useFrame(({ clock }) => {
    if (group.current) orientToSurface(group.current, surface, WORLD_RADIUS)
    if (glow.current) {
      const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.4)
      glow.current.scale.setScalar(1 + pulse * 0.08)
      const m = glow.current.material as { opacity: number }
      m.opacity = 0.35 + pulse * 0.35
    }
  })

  if (!done) return null

  const r = HOLE_RADIUS

  return (
    <group ref={group}>
      {/* the turned earth around the lip */}
      <mesh receiveShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[r * 1.35, r * 1.5, 0.1, 28]} />
        <meshStandardMaterial color="#5a3d22" flatShading roughness={1} />
      </mesh>
      {/* the hole itself — pure black so nothing reads inside it */}
      <mesh position={[0, 0.105, 0]}>
        <cylinderGeometry args={[r, r, 0.02, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* a warm pulse at the rim, the only hint there's a party down there */}
      <mesh ref={glow} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 0.9, r * 1.08, 32]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.5} side={2} />
      </mesh>
      <pointLight color="#ffb347" intensity={6} distance={5} position={[0, 0.6, 0]} />
    </group>
  )
}
