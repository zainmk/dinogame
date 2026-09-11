import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { FIRE_ARC } from '../config'
import { ability } from '../state/player'

const PUFFS = 5

/**
 * The velociraptor's fire breath: a line of cones thrown forward from the mouth.
 *
 * Lives on the anchor rather than inside the pivot group, so the flame stays
 * pointed along the character's heading while the body rears back underneath it.
 * Hidden by `visible` rather than unmounted — toggling a flag every frame is far
 * cheaper than tearing down and rebuilding geometry several times a second.
 */
export function Fire() {
  const group = useRef<Group>(null)
  const puffs = useRef<(Mesh | null)[]>([])

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return

    g.visible = ability.active
    if (!ability.active) return

    const p = ability.elapsed / ability.duration
    // Flares up fast, then gutters out.
    const strength = Math.sin(Math.PI * Math.min(1, p * 1.15))
    const t = clock.elapsedTime

    puffs.current.forEach((puff, i) => {
      if (!puff) return
      const along = (i + 1) / PUFFS
      // Each puff sits further out and grows as the jet widens.
      puff.position.z = -0.75 - along * FIRE_ARC * 0.72 * strength
      const flicker = 0.82 + Math.sin(t * 26 + i * 1.7) * 0.18
      // Flares hard towards the far end. The player is looking down the barrel
      // of this jet, so length reads as nothing and only width escapes the
      // character's own silhouette.
      puff.scale.setScalar((0.4 + along * 1.25) * strength * flicker)
    })
  })

  return (
    // Tilted down towards the ground ahead. A jet fired dead level points
    // straight away from a camera sitting right behind the player, where it
    // foreshortens into a shapeless blob; angling it down gives it length.
    <group ref={group} position={[0, 1.1, 0]} rotation={[-0.26, 0, 0]} visible={false}>
      {Array.from({ length: PUFFS }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            puffs.current[i] = m
          }}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <coneGeometry args={[0.5, 1.15, 7]} />
          <meshStandardMaterial
            color={i < 2 ? '#ffb43a' : i < 4 ? '#ff7a1e' : '#e03a12'}
            emissive={i < 2 ? '#ffb020' : '#d63a10'}
            emissiveIntensity={1.5}
            transparent
            opacity={0.85}
            flatShading
          />
        </mesh>
      ))}
      <pointLight color="#ff9a3c" intensity={14} distance={9} position={[0, 0, -2.2]} />
    </group>
  )
}
