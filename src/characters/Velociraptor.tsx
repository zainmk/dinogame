import { Brick, Eyes, PALETTE, Spike, StudRow, type ModelProps } from './rig'

const C = PALETTE.raptor

/** One leg. `side` is +1 for the left (+X) leg, -1 for the right. */
function Leg({ side }: { side: 1 | -1 }) {
  return (
    <group name={side === 1 ? 'legL' : 'legR'} position={[0.17 * side, 0.54, 0.04]}>
      <Brick args={[0.19, 0.38, 0.26]} color={C.body} position={[0, -0.17, 0.02]} />
      <Brick args={[0.14, 0.32, 0.16]} color={C.dark} position={[0, -0.38, -0.04]} />
      <Brick args={[0.18, 0.1, 0.36]} color={C.dark} position={[0, -0.5, -0.14]} />
      {/* the sickle claw */}
      <Spike position={[0, -0.46, -0.32]} rotation={[-2.1, 0, 0]} size={0.05} length={0.18} />
    </group>
  )
}

function Arm({ side }: { side: 1 | -1 }) {
  return (
    <group position={[0.22 * side, 0.82, -0.22]} rotation={[0.7, 0, 0.25 * side]}>
      <Brick args={[0.09, 0.24, 0.09]} color={C.body} position={[0, -0.1, 0]} />
      <Brick args={[0.08, 0.2, 0.08]} color={C.dark} position={[0, -0.26, -0.06]} />
      <Spike position={[0, -0.4, -0.12]} rotation={[-2.4, 0, 0]} size={0.035} length={0.14} />
    </group>
  )
}

/**
 * Velociraptor — the fast one. Lean biped, body held horizontal, counterbalanced
 * by a long stiff tail, head carried low and forward.
 */
export function Velociraptor({ ref }: ModelProps) {
  return (
    <group ref={ref}>
      <Leg side={1} />
      <Leg side={-1} />
      <Arm side={1} />
      <Arm side={-1} />

      {/* torso, pitched slightly nose-down the way a running raptor carries it */}
      <group position={[0, 0.76, 0]} rotation={[0.1, 0, 0]}>
        <Brick args={[0.44, 0.42, 0.82]} color={C.body} />
        <Brick args={[0.36, 0.2, 0.52]} color={C.belly} position={[0, -0.14, -0.14]} />
        <StudRow count={2} position={[0, 0.23, -0.16]} color={C.light} />
        <StudRow count={2} position={[0, 0.23, 0.14]} color={C.light} />

        {/* neck and head */}
        <group position={[0, 0.16, -0.42]} rotation={[-0.35, 0, 0]}>
          <Brick args={[0.2, 0.34, 0.2]} color={C.body} />
          <group position={[0, 0.22, -0.16]} rotation={[0.5, 0, 0]}>
            <Brick args={[0.24, 0.24, 0.4]} color={C.body} />
            <Brick args={[0.19, 0.16, 0.28]} color={C.light} position={[0, -0.02, -0.3]} />
            <Brick args={[0.17, 0.05, 0.26]} color={PALETTE.bone} position={[0, -0.11, -0.3]} />
            {/* swept crest */}
            <Brick args={[0.05, 0.14, 0.26]} color={PALETTE.gold} position={[0, 0.16, 0.08]} />
            <Eyes y={0.06} z={-0.19} spread={0.11} />
          </group>
        </group>

        {/* tail, tapering in three segments */}
        <Brick args={[0.24, 0.24, 0.42]} color={C.body} position={[0, -0.02, 0.56]} />
        <Brick args={[0.17, 0.17, 0.42]} color={C.dark} position={[0, 0.01, 0.92]} />
        <Brick args={[0.1, 0.1, 0.38]} color={C.dark} position={[0, 0.04, 1.26]} />
      </group>
    </group>
  )
}
