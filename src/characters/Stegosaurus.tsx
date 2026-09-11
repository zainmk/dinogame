import { Brick, Eyes, PALETTE, Spike, StudRow, type ModelProps } from './rig'

const C = PALETTE.stego

/** Hind legs, taller than the fore legs — that's what gives the back its rake. */
function HindLeg({ side }: { side: 1 | -1 }) {
  return (
    <group name={side === 1 ? 'legL' : 'legR'} position={[0.26 * side, 0.62, 0.34]}>
      <Brick args={[0.23, 0.5, 0.26]} color={C.body} position={[0, -0.23, 0]} />
      <Brick args={[0.25, 0.11, 0.3]} color={C.dark} position={[0, -0.55, -0.02]} />
    </group>
  )
}

function ForeLeg({ side }: { side: 1 | -1 }) {
  return (
    <group name={side === 1 ? 'legFL' : 'legFR'} position={[0.22 * side, 0.5, -0.38]}>
      <Brick args={[0.19, 0.4, 0.21]} color={C.body} position={[0, -0.19, 0]} />
      <Brick args={[0.21, 0.11, 0.26]} color={C.dark} position={[0, -0.44, -0.02]} />
    </group>
  )
}

/** The two staggered rows of back plates, the whole point of a stegosaurus. */
function Plates() {
  const spec: { z: number; h: number }[] = [
    { z: -0.44, h: 0.16 },
    { z: -0.22, h: 0.23 },
    { z: 0.0, h: 0.27 },
    { z: 0.22, h: 0.24 },
    { z: 0.44, h: 0.17 },
  ]
  return (
    <>
      {spec.map(({ z, h }, i) => {
        // Rows offset in X and staggered in Z, so they interleave down the spine.
        const x = i % 2 === 0 ? 0.08 : -0.08
        return (
          <group key={z}>
            <Brick
              args={[0.05, h, h * 0.95]}
              color={PALETTE.gold}
              position={[x, 1.16 + h / 2, z]}
              rotation={[0, 0, 0.1 * Math.sign(x)]}
            />
            <Brick
              args={[0.05, h * 0.78, h * 0.75]}
              color={PALETTE.gold}
              position={[-x, 1.14 + (h * 0.78) / 2, z + 0.11]}
              rotation={[0, 0, -0.1 * Math.sign(x)]}
            />
          </group>
        )
      })}
    </>
  )
}

/**
 * Stegosaurus — the heavy one. Quadruped with an arched back, tiny head slung
 * low at the front, and a spiked tail (a thagomizer) held clear of the ground.
 */
export function Stegosaurus({ ref }: ModelProps) {
  return (
    <group ref={ref}>
      <HindLeg side={1} />
      <HindLeg side={-1} />
      <ForeLeg side={1} />
      <ForeLeg side={-1} />

      {/* barrel body, riding high on the legs */}
      <Brick args={[0.56, 0.46, 1.24]} color={C.body} position={[0, 0.92, 0]} />
      <Brick args={[0.48, 0.2, 0.92]} color={C.belly} position={[0, 0.74, 0]} />
      {/* the arch of the back */}
      <Brick args={[0.48, 0.2, 0.86]} color={C.body} position={[0, 1.09, 0.02]} />
      <StudRow count={2} position={[0, 1.21, -0.52]} color={C.light} spacing={0.17} />

      <Plates />

      {/*
        Neck carried up and forward rather than slung low.
        A real stegosaurus holds its head near the ground, but the chase camera
        sits behind and above, and its sight line grazes the top-front edge of
        the body — so a low head is hidden behind the animal's own back, leaving
        nothing but plates and tail on screen. Raising it until the head clears
        that line costs a little anatomy and buys a readable silhouette.
      */}
      <group position={[0, 1.0, -0.72]} rotation={[0.34, 0, 0]}>
        <Brick args={[0.26, 0.26, 0.4]} color={C.body} />
        <group position={[0, 0.02, -0.34]} rotation={[-0.34, 0, 0]}>
          <Brick args={[0.22, 0.2, 0.32]} color={C.body} />
          <Brick args={[0.17, 0.13, 0.2]} color={C.light} position={[0, -0.03, -0.23]} />
          <Eyes y={0.04} z={-0.14} spread={0.1} />
        </group>
      </group>

      {/* tail, rising as it tapers, ending in four spikes */}
      <group position={[0, 0.95, 0.66]} rotation={[-0.2, 0, 0]}>
        <Brick args={[0.3, 0.28, 0.46]} color={C.body} />
        <group position={[0, 0.09, 0.4]} rotation={[-0.18, 0, 0]}>
          <Brick args={[0.2, 0.2, 0.42]} color={C.dark} />
          <Spike position={[0.12, 0.05, 0.18]} rotation={[1.3, 0, -0.5]} size={0.045} length={0.24} />
          <Spike position={[-0.12, 0.05, 0.18]} rotation={[1.3, 0, 0.5]} size={0.045} length={0.24} />
          <Spike position={[0.09, 0.15, 0.04]} rotation={[1.0, 0, -0.3]} size={0.04} length={0.2} />
          <Spike position={[-0.09, 0.15, 0.04]} rotation={[1.0, 0, 0.3]} size={0.04} length={0.2} />
        </group>
      </group>
    </group>
  )
}
