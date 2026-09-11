import { Brick } from './rig'

export interface CatLook {
  /** Base coat. */
  coat: string
  /** Tabby stripes and the forehead "M". */
  stripe: string
  /** Chest and muzzle. */
  belly: string
  /** Iris colour. */
  eyes: string
  /** Inside of the ears and the nose. */
  pink: string
}

/**
 * A cat, sitting upright the way they do when they're watching you — chest
 * raised, front legs straight, tail wrapped round to one side.
 *
 * Faces -Z with feet at y = 0 like everything else. About 0.9 tall to the ear
 * tips, so it stands well below even the child villager, which is correct.
 */
export function Cat({ look }: { look: CatLook }) {
  const DARK = '#1c1714'

  return (
    <group>
      {/* haunches at the back, sitting on the ground */}
      <Brick args={[0.36, 0.3, 0.4]} color={look.coat} position={[0, 0.15, 0.1]} />
      {/* the raised chest, leaning very slightly forward */}
      <group position={[0, 0.34, -0.08]} rotation={[0.06, 0, 0]}>
        <Brick args={[0.3, 0.4, 0.26]} color={look.coat} />
        <Brick args={[0.2, 0.3, 0.03]} color={look.belly} position={[0, -0.02, -0.14]} />
      </group>

      {/* front legs, straight down to the paws */}
      {[1, -1].map((side) => (
        <group key={side} position={[0.09 * side, 0, -0.18]}>
          <Brick args={[0.08, 0.3, 0.08]} color={look.coat} position={[0, 0.15, 0]} />
          <Brick args={[0.09, 0.06, 0.12]} color={look.belly} position={[0, 0.03, -0.02]} />
        </group>
      ))}
      {/* back paws peeking out either side of the haunches */}
      {[1, -1].map((side) => (
        <Brick
          key={side}
          args={[0.09, 0.06, 0.14]}
          color={look.coat}
          position={[0.16 * side, 0.03, -0.02]}
        />
      ))}

      {/* tail: along the ground to one side, then curling up at the tip */}
      <Brick args={[0.07, 0.07, 0.34]} color={look.coat} position={[0.2, 0.04, 0.16]} rotation={[0, 0.35, 0]} />
      <Brick args={[0.06, 0.16, 0.06]} color={look.coat} position={[0.27, 0.11, -0.01]} rotation={[0.3, 0, -0.25]} />
      <Brick args={[0.05, 0.05, 0.08]} color={look.stripe} position={[0.29, 0.19, -0.03]} />

      {/* tabby stripes over the back and haunches */}
      {[0.02, 0.12, 0.22].map((z) => (
        <Brick key={z} args={[0.3, 0.03, 0.03]} color={look.stripe} position={[0, 0.305, z]} />
      ))}
      {[1, -1].map((side) => (
        <Brick
          key={side}
          args={[0.03, 0.14, 0.04]}
          color={look.stripe}
          position={[0.17 * side, 0.2, 0.2]}
          rotation={[0, 0, 0.2 * side]}
        />
      ))}

      {/* neck, so the head sits on the chest rather than hovering over it */}
      <Brick args={[0.2, 0.12, 0.2]} color={look.coat} position={[0, 0.56, -0.12]} />

      {/* head */}
      <group position={[0, 0.64, -0.15]}>
        <Brick args={[0.3, 0.26, 0.26]} color={look.coat} />
        {/* the tabby "M" on the forehead */}
        {[1, -1].map((side) => (
          <Brick
            key={side}
            args={[0.025, 0.08, 0.02]}
            color={look.stripe}
            position={[0.05 * side, 0.08, -0.135]}
            rotation={[0, 0, 0.35 * side]}
          />
        ))}
        {/* cheek stripes */}
        {[1, -1].map((side) => (
          <Brick
            key={side}
            args={[0.02, 0.06, 0.08]}
            color={look.stripe}
            position={[0.155 * side, -0.02, -0.06]}
          />
        ))}

        {/* eyes: the big yellow-green almonds are the whole face */}
        {[1, -1].map((side) => (
          <group key={side} position={[0.075 * side, 0.015, -0.135]}>
            <Brick args={[0.08, 0.065, 0.02]} color={look.eyes} />
            <Brick args={[0.022, 0.05, 0.02]} color={DARK} position={[0, 0, -0.008]} />
          </group>
        ))}

        {/* muzzle, nose, and the split of the upper lip */}
        <Brick args={[0.17, 0.1, 0.09]} color={look.belly} position={[0, -0.075, -0.16]} />
        <Brick args={[0.05, 0.03, 0.02]} color={look.pink} position={[0, -0.04, -0.21]} />
        <Brick args={[0.012, 0.045, 0.02]} color={DARK} position={[0, -0.085, -0.21]} />

        {/* ears: four-sided cones read as triangles, with a pink inner face */}
        {[1, -1].map((side) => (
          <group key={side} position={[0.1 * side, 0.17, 0.02]} rotation={[0, 0, -0.18 * side]}>
            <mesh castShadow>
              <coneGeometry args={[0.075, 0.16, 4]} />
              <meshStandardMaterial color={look.coat} flatShading roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.01, -0.03]}>
              <coneGeometry args={[0.045, 0.11, 4]} />
              <meshStandardMaterial color={look.pink} flatShading roughness={0.7} />
            </mesh>
          </group>
        ))}

        {/* whiskers: two hairlines each side, the finest detail the medium allows */}
        {[1, -1].map((side) =>
          [-0.01, 0.02].map((dy, i) => (
            <mesh
              key={`${side}:${i}`}
              position={[0.165 * side, -0.06 + dy, -0.17]}
              rotation={[0, 0, (0.15 - i * 0.3) * side]}
            >
              <boxGeometry args={[0.1, 0.006, 0.006]} />
              <meshStandardMaterial color="#f2ede4" />
            </mesh>
          )),
        )}
      </group>
    </group>
  )
}
