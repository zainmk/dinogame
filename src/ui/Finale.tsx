import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Color, InstancedMesh, MathUtils, Object3D, PCFShadowMap } from 'three'
import type { Group, HemisphereLight, Mesh, PointLight } from 'three'
import { BANNER_AT, FALL_SECONDS } from '../config'
import { Cat } from '../characters/Cat'
import { Villager } from '../characters/Villager'
import { CHARACTERS, getCharacter } from '../data/characters'
import { NPCS } from '../data/npcs'
import { mulberry32 } from '../math/sphere'
import { useGame } from '../store'
import { playBirthday, playFirework, stopBirthday } from '../audio/audio'
import { MuteButton } from './MuteButton'

/** Radius of the ring of guests around the table. */
const RING = 2.7
/** Where the falling dinosaur lands on that ring, as an angle. Front-right, so the camera sees it drop. */
const LANDING_ANGLE = 0.42

const smoothstep = (p: number) => p * p * (3 - 2 * p)
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * The party under the planet.
 *
 * Its own <Canvas>, like the select screen, because nothing about it — the
 * camera, the lighting, the floor — is the world's. It runs on one clock:
 * `elapsed` since mount drives the fall, the reveal, the dancing and the
 * confetti in the scene, and a matching timer chain drives the countdown text
 * in the DOM overlay.
 */
export function Finale() {
  const returnToSelect = useGame((s) => s.returnToSelect)
  const [shown, setShown] = useState(false)

  // The banner lives in the DOM, so it's timed here rather than in useFrame.
  useEffect(() => {
    const timer = setTimeout(() => {
      setShown(true)
      playBirthday()
    }, BANNER_AT * 1000)
    return () => {
      clearTimeout(timer)
      // Leaving the party mid-song shouldn't leave the song playing over the planet.
      stopBirthday()
    }
  }, [])

  return (
    <div className="finale">
      <Canvas shadows={{ type: PCFShadowMap }} camera={{ fov: 42, position: [0, 4.2, 9.6] }}>
        <PartyScene />
      </Canvas>

      <div className="finale__corner">
        <MuteButton />
      </div>

      {/* Pinned to the top band, so the table and everyone dancing stay in view. */}
      <div className="finale__ui">
        {shown && (
          <div className="finale__done">
            <div className="finale__cake" aria-hidden="true">
              🎂
            </div>
            <h1 className="finale__title">Happy 10th Birthday Shahir!</h1>
            <p className="finale__sub">Every cookie found. Everyone came.</p>
            <button className="finale__back" onClick={returnToSelect}>
              Back to the planet
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Points the camera at the table once; the Canvas prop only sets position. */
function CameraAim() {
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    // Aimed a little high, so the table sits in the lower two-thirds and the
    // birthday banner has the top of the frame to itself.
    camera.lookAt(0, 2.1, 0)
  }, [camera])
  return null
}

function PartyScene() {
  const chosen = useGame((s) => s.character)
  const hemi = useRef<HemisphereLight>(null)
  const key = useRef<PointLight>(null)
  const started = useRef<number | null>(null)
  const lights = useRef<Group>(null)

  // One shared clock for everything in the scene.
  const timeline = useRef({ t: 0, reveal: 0 })

  useFrame(({ clock }) => {
    if (started.current === null) started.current = clock.elapsedTime
    const t = clock.elapsedTime - started.current
    // Lights come up as the dinosaur lands.
    const reveal = smoothstep(clamp01((t - FALL_SECONDS + 0.15) / 0.8))
    timeline.current.t = t
    timeline.current.reveal = reveal

    if (hemi.current) hemi.current.intensity = 1.2 * reveal
    if (key.current) key.current.intensity = 26 * reveal
    if (lights.current) lights.current.visible = reveal > 0.02
  })

  // Everyone but the dinosaur you played as stands in the ring already.
  const guests = useMemo(() => {
    const others = CHARACTERS.filter((c) => c.id !== chosen)
    const list: { key: string; node: React.ReactNode; scale: number }[] = [
      ...others.map((c) => ({ key: c.id, node: <c.Model />, scale: 1 })),
      ...NPCS.map((n) => ({
        key: n.id,
        node: n.look.kind === 'cat' ? <Cat look={n.look} /> : <Villager look={n.look} />,
        scale: n.scale ?? 1,
      })),
    ]
    return list
  }, [chosen])

  const { Model } = getCharacter(chosen)
  const slots = guests.length + 1

  return (
    <>
      <color attach="background" args={['#05070d']} />
      <CameraAim />

      <hemisphereLight ref={hemi} args={['#ffd9a8', '#2a1a2e', 0]} />
      <pointLight
        ref={key}
        position={[0, 6.5, 2]}
        intensity={0}
        color="#fff0d6"
        distance={22}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* string lights round the room */}
      <group ref={lights} visible={false}>
        {[
          ['#ff5c8a', -5, 4, -3],
          ['#5cc8ff', 5, 4.4, -2],
          ['#ffd85c', 0, 4.8, -6],
          ['#8cff7a', -4, 3.6, 4],
          ['#c48cff', 4.5, 3.8, 4],
        ].map(([c, x, y, z]) => (
          <pointLight key={c as string} color={c as string} position={[x as number, y as number, z as number]} intensity={5} distance={11} />
        ))}
      </group>

      {/* the floor of wherever this is */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[9, 48]} />
        <meshStandardMaterial color="#1c1620" roughness={1} />
      </mesh>

      <Table />
      <Balloons timeline={timeline} />
      <Confetti timeline={timeline} />
      <Fireworks timeline={timeline} />

      {/* the one who fell */}
      <Faller angle={LANDING_ANGLE} timeline={timeline}>
        <Model />
      </Faller>

      {/* everyone else, dancing */}
      {guests.map((g, i) => (
        <Dancer
          key={g.key}
          angle={LANDING_ANGLE + ((i + 1) * Math.PI * 2) / slots}
          phase={i * 1.37}
          scale={g.scale}
          timeline={timeline}
        >
          {g.node}
        </Dancer>
      ))}
    </>
  )
}

type Timeline = React.RefObject<{ t: number; reveal: number }>

/**
 * The chosen dinosaur drops in from above, tumbling, and lands square on its
 * spot in the ring exactly as the lights come up.
 */
function Faller({
  angle,
  timeline,
  children,
}: {
  angle: number
  timeline: Timeline
  children: React.ReactNode
}) {
  const group = useRef<Group>(null)
  const lamp = useRef<PointLight>(null)

  useFrame(() => {
    const g = group.current
    if (!g) return
    const { t } = timeline.current
    const p = clamp01(t / FALL_SECONDS)
    // Accelerating fall: quadratic in the remaining fraction.
    const height = 15 * (1 - p) * (1 - p)
    g.position.set(Math.sin(angle) * RING, height, Math.cos(angle) * RING)
    // Two tumbles on the way down, ending upright. Modulo makes 4π land on 0.
    g.rotation.x = 4 * Math.PI * (1 - p) * (1 - p)
    g.rotation.y = angle
    // A squash on impact, recovering over a third of a second.
    const since = t - FALL_SECONDS
    const squash = since > 0 && since < 0.35 ? Math.sin((since / 0.35) * Math.PI) * 0.18 : 0
    g.scale.set(1 + squash, 1 - squash, 1 + squash)
    // Then it joins the dance.
    if (since > 0.5) g.position.y = Math.abs(Math.sin((since - 0.5) * 5.2)) * 0.12
    if (lamp.current) lamp.current.intensity = 12 * (1 - timeline.current.reveal)
  })

  return (
    <group ref={group}>
      {/* a lamp that rides down with it, so the fall is lit in the dark */}
      <pointLight ref={lamp} position={[0, 1.6, -1.4]} color="#cfe3ff" intensity={12} distance={6} />
      {children}
    </group>
  )
}

/** A guest on the ring, facing the table, dancing once the lights are up. */
function Dancer({
  angle,
  phase,
  scale,
  timeline,
  children,
}: {
  angle: number
  phase: number
  scale: number
  timeline: Timeline
  children: React.ReactNode
}) {
  const group = useRef<Group>(null)

  useFrame(() => {
    const g = group.current
    if (!g) return
    const { t, reveal } = timeline.current
    const beat = t * 5.2 + phase
    // Bob on the beat, sway side to side, and turn a little either way.
    g.position.set(Math.sin(angle) * RING, Math.abs(Math.sin(beat)) * 0.14 * reveal, Math.cos(angle) * RING)
    g.rotation.z = Math.sin(beat * 0.5) * 0.09 * reveal
    g.rotation.y = angle + Math.sin(t * 1.6 + phase) * 0.45 * reveal
  })

  return (
    <group ref={group} scale={scale}>
      {children}
    </group>
  )
}

function Table() {
  const flames = useRef<(Mesh | null)[]>([])
  useFrame(({ clock }) => {
    flames.current.forEach((f, i) => {
      if (f) f.scale.setScalar(0.85 + Math.sin(clock.elapsedTime * 14 + i * 2.1) * 0.15)
    })
  })

  return (
    <group>
      {/* pedestal and top */}
      <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.22, 0.34, 0.84, 12]} />
        <meshStandardMaterial color="#6b4a2c" flatShading roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <cylinderGeometry args={[1.55, 1.55, 0.12, 32]} />
        <meshStandardMaterial color="#9c6b3d" flatShading roughness={0.85} />
      </mesh>
      {/* tablecloth edge */}
      <mesh position={[0, 0.83, 0]}>
        <cylinderGeometry args={[1.6, 1.5, 0.08, 32]} />
        <meshStandardMaterial color="#f3ede0" roughness={1} />
      </mesh>

      {/* the cake: two tiers, a frosting rim, and ten candles */}
      <group position={[0, 0.96, 0]}>
        <mesh castShadow position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.4, 24]} />
          <meshStandardMaterial color="#f2a7c3" flatShading roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.41, 0]}>
          <cylinderGeometry args={[0.63, 0.63, 0.05, 24]} />
          <meshStandardMaterial color="#fff3e2" roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0, 0.58, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.32, 24]} />
          <meshStandardMaterial color="#fff1d6" flatShading roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.43, 0.43, 0.04, 24]} />
          <meshStandardMaterial color="#f2a7c3" roughness={0.6} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2
          const x = Math.cos(a) * 0.28
          const z = Math.sin(a) * 0.28
          return (
            <group key={i} position={[x, 0.77, z]}>
              <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.2, 6]} />
                <meshStandardMaterial color={i % 2 ? '#5cc8ff' : '#ff5c8a'} />
              </mesh>
              <mesh
                ref={(m) => {
                  flames.current[i] = m
                }}
                position={[0, 0.25, 0]}
              >
                <coneGeometry args={[0.03, 0.09, 6]} />
                <meshStandardMaterial color="#ffd85c" emissive="#ff9a2e" emissiveIntensity={2.5} />
              </mesh>
            </group>
          )
        })}
        <pointLight position={[0, 1.1, 0]} color="#ffb86b" intensity={4} distance={4} />
      </group>
    </group>
  )
}

function Balloons({ timeline }: { timeline: Timeline }) {
  const group = useRef<Group>(null)
  const spots = useMemo(() => {
    const rng = mulberry32(21)
    // Spread across the back half only. The camera sits out front, and a balloon
    // on that side parks itself right between the lens and the cake.
    return Array.from({ length: 7 }, (_, i) => {
      const a = Math.PI * 0.5 + (i / 6) * Math.PI
      return {
      x: Math.sin(a) * 5.4,
      z: Math.cos(a) * 5.4,
      y: 2.4 + rng() * 1.2,
      color: ['#ff5c8a', '#5cc8ff', '#ffd85c', '#8cff7a', '#c48cff', '#ff9a2e', '#ff5c8a'][i],
      phase: rng() * 6,
      }
    })
  }, [])

  useFrame(() => {
    const g = group.current
    if (!g) return
    g.visible = timeline.current.reveal > 0.02
    g.children.forEach((c, i) => {
      c.position.y = spots[i].y + Math.sin(timeline.current.t * 1.1 + spots[i].phase) * 0.15
    })
  })

  return (
    <group ref={group} visible={false}>
      {spots.map((s, i) => (
        <group key={i} position={[s.x, s.y, s.z]}>
          <mesh castShadow>
            <sphereGeometry args={[0.42, 14, 10]} />
            <meshStandardMaterial color={s.color} roughness={0.35} />
          </mesh>
          <mesh position={[0, -1.3, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 1.8, 4]} />
            <meshStandardMaterial color="#d9d4c7" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

const CONFETTI = 160

/** Coloured flakes drifting down from the ceiling, looping, once the party is lit. */
function Confetti({ timeline }: { timeline: Timeline }) {
  const mesh = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const pieces = useMemo(() => {
    const rng = mulberry32(99)
    return Array.from({ length: CONFETTI }, () => ({
      x: (rng() - 0.5) * 12,
      z: (rng() - 0.5) * 10,
      y0: rng() * 8,
      speed: 0.7 + rng() * 0.8,
      spin: rng() * 6,
      color: new Color().setHSL(rng(), 0.85, 0.6),
    }))
  }, [])

  useEffect(() => {
    const m = mesh.current
    if (!m) return
    pieces.forEach((p, i) => m.setColorAt(i, p.color))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [pieces])

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const { t, reveal } = timeline.current
    m.visible = reveal > 0.5
    if (!m.visible) return
    const since = Math.max(0, t - FALL_SECONDS)
    pieces.forEach((p, i) => {
      // Fall from wherever they started, wrapping back to the ceiling.
      const y = MathUtils.euclideanModulo(p.y0 - since * p.speed, 8)
      dummy.position.set(p.x + Math.sin(since + p.spin) * 0.3, y, p.z)
      dummy.rotation.set(since * 2 + p.spin, since * 3, p.spin)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, CONFETTI]} visible={false}>
      <planeGeometry args={[0.12, 0.18]} />
      <meshStandardMaterial side={2} roughness={0.8} />
    </instancedMesh>
  )
}

const BURSTS = 7
const SPARKS = 56
const BURST_LIFE = 1.9

/**
 * Fireworks going off behind the party. A fixed pool of bursts, each a shell of
 * sparks flung out from a point and pulled down by gravity, fading as they go;
 * when one dies it's re-lit somewhere else with a new colour. One instanced
 * mesh for all of them, so the whole display is a single draw call.
 */
function Fireworks({ timeline }: { timeline: Timeline }) {
  const mesh = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const rng = useMemo(() => mulberry32(4242), [])

  const bursts = useMemo(
    () =>
      Array.from({ length: BURSTS }, (_, i) => ({
        origin: [0, 0, 0] as [number, number, number],
        color: new Color(),
        start: i * 0.45, // staggered so they don't all go at once
        dirs: Array.from({ length: SPARKS }, () => [0, 0, 0] as [number, number, number]),
        armed: false,
      })),
    [],
  )

  const relight = (b: (typeof bursts)[number], at: number, since: number) => {
    // Somewhere across the back of the room, high above the balloons.
    b.origin = [(rng() - 0.5) * 16, 5 + rng() * 3.5, -6 - rng() * 6]
    b.color.setHSL(rng(), 0.9, 0.62)
    b.start = at
    b.armed = true
    // The bang is scheduled for the moment the shell bursts, not for now. Not
    // every one gets a bang, or seven shells make a wall of noise.
    if (rng() < 0.6) playFirework(at - since)
    for (const d of b.dirs) {
      // Uniform directions, with a spread of speeds so the shell has depth.
      const z = rng() * 2 - 1
      const a = rng() * Math.PI * 2
      const r = Math.sqrt(1 - z * z)
      const v = 2.6 + rng() * 1.6
      d[0] = r * Math.cos(a) * v
      d[1] = r * Math.sin(a) * v
      d[2] = z * v
    }
  }

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const { t, reveal } = timeline.current
    m.visible = reveal > 0.6
    if (!m.visible) return
    const since = t - FALL_SECONDS

    let colorDirty = false
    bursts.forEach((b, bi) => {
      let age = since - b.start
      if (!b.armed || age > BURST_LIFE) {
        // Re-lit after a short random gap.
        relight(b, since + rng() * 0.8, since)
        age = since - b.start
        for (let k = 0; k < SPARKS; k++) m.setColorAt(bi * SPARKS + k, b.color)
        colorDirty = true
      }
      const live = age >= 0
      const fade = live ? 1 - age / BURST_LIFE : 0
      for (let k = 0; k < SPARKS; k++) {
        const d = b.dirs[k]
        if (live) {
          // Drag slows the sparks; gravity pulls them down.
          const drag = 1 - 0.35 * (age / BURST_LIFE)
          dummy.position.set(
            b.origin[0] + d[0] * age * drag,
            b.origin[1] + d[1] * age * drag - 1.6 * age * age,
            b.origin[2] + d[2] * age * drag,
          )
          dummy.scale.setScalar(0.16 * fade * fade + 0.02)
        } else {
          dummy.scale.setScalar(0)
        }
        dummy.updateMatrix()
        m.setMatrixAt(bi * SPARKS + k, dummy.matrix)
      }
    })
    m.instanceMatrix.needsUpdate = true
    if (colorDirty && m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, BURSTS * SPARKS]} visible={false}>
      <sphereGeometry args={[1, 6, 5]} />
      {/* Unlit and untonemapped, so the sparks read as light sources, not beads. */}
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}
