import { Brick, Eyes, PALETTE, Spike, StudRow, type ModelProps } from './rig'

const C = PALETTE.ptero

function Leg({ side }: { side: 1 | -1 }) {
  return (
    <group name={side === 1 ? 'legL' : 'legR'} position={[0.15 * side, 0.4, 0.02]}>
      <Brick args={[0.13, 0.28, 0.15]} color={C.dark} position={[0, -0.13, 0]} />
      <Brick args={[0.15, 0.09, 0.3]} color={C.dark} position={[0, -0.32, -0.08]} />
      <Spike position={[0, -0.3, -0.24]} rotation={[-2.2, 0, 0]} size={0.035} length={0.12} />
    </group>
  )
}

/**
 * One wing. The group pivots at the shoulder so `Player` can flap it about Z;
 * everything inside is built extending along +X and mirrored for the right side.
 */
function Wing({ side }: { side: 1 | -1 }) {
  return (
    <group
      name={side === 1 ? 'wingL' : 'wingR'}
      position={[0.15 * side, 0.8, -0.04]}
      // Held with a slight droop at rest, so a still pterosaur doesn't read as a
      // letter T. Player overwrites this while flapping.
      rotation={[0, 0, -0.12 * side]}
    >
      {/* upper arm out to the wrist */}
      <Brick args={[0.32, 0.1, 0.19]} color={C.body} position={[0.18 * side, 0.02, 0]} />
      {/* the long finger spar that carries the membrane */}
      <Brick
        args={[0.5, 0.07, 0.09]}
        color={C.dark}
        position={[0.55 * side, 0.06, -0.14]}
        rotation={[0, 0.14 * side, 0]}
      />
      {/* membrane */}
      <Brick
        args={[0.52, 0.045, 0.5]}
        color={C.light}
        position={[0.56 * side, 0.0, 0.12]}
        rotation={[0, 0, -0.07 * side]}
      />
      <Brick
        args={[0.26, 0.045, 0.34]}
        color={C.body}
        position={[0.93 * side, -0.03, 0.01]}
        rotation={[0, -0.28 * side, -0.12 * side]}
      />
      {/* claw at the wrist */}
      <Spike
        position={[0.36 * side, 0.06, -0.22]}
        rotation={[-1.9, 0, 0]}
        size={0.035}
        length={0.14}
      />
    </group>
  )
}

/**
 * Pterosaur — the odd one. Stands upright on short legs with the wings folded
 * out, long toothless beak balanced by a swept head crest.
 */
export function Pterosaur({ ref }: ModelProps) {
  return (
    <group ref={ref}>
      <Leg side={1} />
      <Leg side={-1} />
      <Wing side={1} />
      <Wing side={-1} />

      {/* compact upright body */}
      <Brick args={[0.34, 0.44, 0.52]} color={C.body} position={[0, 0.66, 0]} />
      <Brick args={[0.26, 0.26, 0.32]} color={C.belly} position={[0, 0.58, -0.18]} />
      <StudRow count={2} position={[0, 0.9, 0.06]} color={C.light} spacing={0.14} />

      {/* short tail */}
      <Brick args={[0.14, 0.14, 0.3]} color={C.dark} position={[0, 0.72, 0.34]} />
      <Brick args={[0.06, 0.2, 0.22]} color={PALETTE.gold} position={[0, 0.74, 0.54]} />

      {/* neck, head, beak, crest */}
      <group position={[0, 0.94, -0.12]} rotation={[0.25, 0, 0]}>
        <Brick args={[0.17, 0.3, 0.18]} color={C.body} />
        <group position={[0, 0.24, -0.1]} rotation={[-0.25, 0, 0]}>
          <Brick args={[0.19, 0.21, 0.3]} color={C.body} />
          {/* the beak */}
          <Brick args={[0.11, 0.11, 0.42]} color={PALETTE.bone} position={[0, -0.02, -0.34]} />
          <Brick args={[0.07, 0.06, 0.2]} color={PALETTE.bone} position={[0, -0.01, -0.62]} />
          {/* swept crest, the other half of the silhouette */}
          <Brick
            args={[0.07, 0.17, 0.42]}
            color={PALETTE.gold}
            position={[0, 0.15, 0.22]}
            rotation={[0.6, 0, 0]}
          />
          <Eyes y={0.05} z={-0.13} spread={0.09} />
        </group>
      </group>
    </group>
  )
}
