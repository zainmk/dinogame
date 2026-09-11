import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PCFShadowMap } from 'three'
import type { Group } from 'three'
import { CHARACTERS, getCharacter, type CharacterId } from '../data/characters'
import { PALETTE } from '../characters/rig'
import { useGame } from '../store'
import { TOTAL_COINS } from '../data/world'

/** The chosen dinosaur, turning slowly on a display stand. */
function Turntable({ id }: { id: CharacterId }) {
  const spin = useRef<Group>(null)
  const { Model } = getCharacter(id)

  useFrame((_, delta) => {
    if (spin.current) spin.current.rotation.y += delta * 0.55
  })

  return (
    // Sat above the camera's look-at point, so the model composes into the top
    // half of the screen and the UI panel below never covers its legs.
    <group position={[0, 0.05, 0]}>
      <group ref={spin}>
        {/* Models are built facing -Z; turn them to start side-on to the camera. */}
        <group rotation={[0, -0.5, 0]}>
          <Model key={id} />
        </group>
      </group>

      {/* display stand */}
      <mesh receiveShadow position={[0, -0.06, 0]}>
        <cylinderGeometry args={[1.02, 1.1, 0.12, 40]} />
        <meshStandardMaterial color="#1b2438" roughness={0.8} />
      </mesh>
      <mesh receiveShadow position={[0, -0.14, 0]}>
        <cylinderGeometry args={[1.12, 1.12, 0.06, 40]} />
        <meshStandardMaterial color={PALETTE.gold} roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  )
}

function SelectScene({ id }: { id: CharacterId }) {
  return (
    <>
      <color attach="background" args={['#0b1020']} />
      <hemisphereLight args={['#9fd0ff', '#2a2130', 1.0]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[4, 6, 5]}
        intensity={2.6}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      {/* rim light, to lift the silhouette off the dark background */}
      <directionalLight position={[-5, 2, -4]} intensity={0.75} color="#7aa2ff" />
      <Turntable id={id} />
    </>
  )
}

/**
 * The opening screen. Its own <Canvas>, because the framing and lighting have
 * nothing in common with the world scene — and it unmounts entirely once play
 * starts, so it costs nothing during the game.
 */
export function CharacterSelect() {
  const character = useGame((s) => s.character)
  const setCharacter = useGame((s) => s.setCharacter)
  const cycleCharacter = useGame((s) => s.cycleCharacter)
  const startGame = useGame((s) => s.startGame)

  const active = getCharacter(character)
  const index = CHARACTERS.findIndex((c) => c.id === character)
  const found = useGame((s) => s.collected.size)
  const resetProgress = useGame((s) => s.resetProgress)

  // Keyboard: arrows browse, Enter/Space/E starts.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') cycleCharacter(-1)
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') cycleCharacter(1)
      else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') {
        e.preventDefault()
        startGame()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [cycleCharacter, startGame])

  return (
    <div className="select">
      <Canvas
        shadows={{ type: PCFShadowMap }}
        camera={{ fov: 40, position: [0, 1.05, 6.3] }}
        className="select__canvas"
      >
        <SelectScene id={character} />
      </Canvas>

      <div className="select__ui">
        <header className="select__head">
          <p className="select__eyebrow">Fierce Dinosaur · 3 in 1</p>
          <h1 className="select__title">Choose your dino</h1>
          {/* Progress is shared across all three, so it belongs above the choice. */}
          <p className="select__progress">
            <strong>{found}</strong> of {TOTAL_COINS} coins · each dino reaches coins the
            others cannot
          </p>
        </header>

        <div className="select__spacer" />

        <div className="select__plate">
          <button
            className="select__arrow"
            onClick={() => cycleCharacter(-1)}
            aria-label="Previous dinosaur"
          >
            ‹
          </button>
          <div className="select__name">
            <h2 style={{ color: active.accent }}>{active.name}</h2>
            <p>{active.tagline}</p>
          </div>
          <button
            className="select__arrow"
            onClick={() => cycleCharacter(1)}
            aria-label="Next dinosaur"
          >
            ›
          </button>
        </div>

        <div className="select__cards">
          {CHARACTERS.map((c, i) => (
            <button
              key={c.id}
              className={`select__card${c.id === character ? ' is-active' : ''}`}
              onClick={() => setCharacter(c.id)}
              style={{ '--accent': c.accent } as React.CSSProperties}
            >
              <span className="select__swatch" />
              <span className="select__cardname">{c.name}</span>
              <span className="select__index">{i + 1}</span>
            </button>
          ))}
        </div>

        <button className="select__start" onClick={startGame}>
          Start · <kbd>Enter</kbd>
        </button>

        <p className="select__hint">
          <kbd>←</kbd>
          <kbd>→</kbd> browse &nbsp;·&nbsp; {index + 1} of {CHARACTERS.length}
          {found > 0 && (
            <>
              {' '}
              &nbsp;·&nbsp;
              <button className="select__reset" onClick={resetProgress}>
                reset progress
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
