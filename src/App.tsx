import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { PCFShadowMap } from 'three'
import { resetInput, useInputListeners } from './input/useInput'
import { Scene } from './scene/Scene'
import { CharacterSelect } from './ui/CharacterSelect'
import { Finale } from './ui/Finale'
import { DialogueBox } from './ui/DialogueBox'
import { Hud } from './ui/Hud'
import { TouchControls } from './ui/TouchControls'
import { useGame } from './store'
import './audio/bindings'

/**
 * The one place the 3D world and the DOM UI meet. The canvas owns the
 * simulation; the overlay only reads discrete state out of the store.
 */
export default function App() {
  useInputListeners()
  const phase = useGame((s) => s.phase)

  // The keypress that started the game also went to the global input listeners.
  // Effects run after the event handler, so clearing here drops that stale
  // Enter/Space before the world can read it as an interact.
  useEffect(() => {
    if (phase !== 'select') resetInput()
  }, [phase])

  // CSS shows this only on a portrait touch device; it's inert otherwise.
  const rotatePrompt = (
    <div className="rotate" aria-hidden="true">
      <div className="rotate__icon">📱</div>
      <p>Turn your tablet sideways to play</p>
    </div>
  )

  if (phase === 'finale') return <Finale />

  if (phase === 'select')
    return (
      <>
        <CharacterSelect />
        {rotatePrompt}
      </>
    )

  return (
    <div className="app">
      {rotatePrompt}
      <Canvas
        shadows={{ type: PCFShadowMap }}
        camera={{ fov: 55, near: 0.1, far: 200, position: [0, 16, 18] }}
      >
        <Scene />
      </Canvas>
      <Hud />
      <DialogueBox />
      <TouchControls />
    </div>
  )
}
