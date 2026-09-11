import type { Ref } from 'react'
import type { Group, Vector3Tuple } from 'three'

/**
 * Shared building blocks for the three characters.
 *
 * ## The rig convention
 *
 * Every character model must:
 *   - face -Z (the direction three.js objects look, and what `orientToSurface` expects)
 *   - stand with its feet at y = 0, so it sits on the surface with no offset
 *
 * and may name any of these child groups, which `Player` animates if it finds
 * them. Nothing is required — a model with no named parts simply doesn't animate.
 *
 *   legL / legR     hind (or only) legs, pivoting at the hip
 *   legFL / legFR   fore legs of a quadruped, swung on the opposite diagonal
 *   wingL / wingR   wings, pivoting at the shoulder, flapped about Z
 *
 * Keeping this a naming convention rather than a prop interface means adding a
 * fourth dinosaur is one new file and one registry entry.
 */
export interface ModelProps {
  ref?: Ref<Group>
}

/** LEGO-ish reds. Each species gets its own so they read apart at a glance. */
export const PALETTE = {
  raptor: { body: '#d13a2a', dark: '#8e2118', light: '#ef6a4a', belly: '#e8cba6' },
  stego: { body: '#a8332a', dark: '#71201a', light: '#cf5b3c', belly: '#e3c49f' },
  ptero: { body: '#c42f3c', dark: '#7d1f26', light: '#e65a52', belly: '#efd5b4' },
  bone: '#f4efe4',
  eye: '#14181f',
  gold: '#e0902e',
} as const

interface BrickProps {
  args: Vector3Tuple
  color: string
  position?: Vector3Tuple
  rotation?: Vector3Tuple
}

/** One LEGO-ish block. Flat shaded so the facets catch the light. */
export function Brick({ args, color, position, rotation }: BrickProps) {
  return (
    <mesh castShadow position={position} rotation={rotation}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} flatShading roughness={0.55} />
    </mesh>
  )
}

/** A single stud. What makes the whole thing read as plastic bricks rather than boxes. */
export function Stud({ position, color }: { position: Vector3Tuple; color: string }) {
  return (
    <mesh castShadow position={position}>
      <cylinderGeometry args={[0.052, 0.052, 0.045, 10]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  )
}

/** A row of studs along X, centred on `position`. */
export function StudRow({
  count,
  position,
  color,
  spacing = 0.15,
}: {
  count: number
  position: Vector3Tuple
  color: string
  spacing?: number
}) {
  const [x, y, z] = position
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Stud key={i} color={color} position={[x + (i - (count - 1) / 2) * spacing, y, z]} />
      ))}
    </>
  )
}

export function Eyes({ y, z, spread = 0.11 }: { y: number; z: number; spread?: number }) {
  return (
    <>
      <mesh position={[spread, y, z]}>
        <sphereGeometry args={[0.052, 10, 10]} />
        <meshStandardMaterial color={PALETTE.eye} roughness={0.3} />
      </mesh>
      <mesh position={[-spread, y, z]}>
        <sphereGeometry args={[0.052, 10, 10]} />
        <meshStandardMaterial color={PALETTE.eye} roughness={0.3} />
      </mesh>
    </>
  )
}

/** A claw or spike: a small cone pointing along -Z by default. */
export function Spike({
  position,
  rotation,
  size = 0.07,
  length = 0.2,
  color = PALETTE.bone,
}: {
  position: Vector3Tuple
  rotation?: Vector3Tuple
  size?: number
  length?: number
  color?: string
}) {
  return (
    <mesh castShadow position={position} rotation={rotation}>
      <coneGeometry args={[size, length, 6]} />
      <meshStandardMaterial color={color} flatShading roughness={0.5} />
    </mesh>
  )
}
