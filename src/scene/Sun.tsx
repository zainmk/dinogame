import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, Vector3 } from 'three'
import type { DirectionalLight } from 'three'
import { WORLD_RADIUS } from '../config'
import { rightAxis } from '../math/sphere'
import { player } from '../state/player'

const _dir = new Vector3()
const _right = new Vector3()

/**
 * Key light, anchored to the player's local frame rather than to the world.
 *
 * A sun fixed in world space would leave half the planet in night — a real
 * problem when the whole point is running all the way around. Instead the light
 * sits at a constant angle relative to the player's own up/right/forward, so the
 * ground underfoot is always lit from the same direction no matter where on the
 * sphere you are. Distant terrain still falls off into darkness, which reads as
 * night and costs nothing.
 *
 * Keeping it near the player also means the shadow camera can be small and
 * tight, so the shadow map resolution goes where it's visible.
 */
export function Sun() {
  const light = useRef<DirectionalLight>(null)
  const target = useRef<Object3D>(null)

  useFrame(() => {
    if (!light.current || !target.current) return

    const right = rightAxis(player, _right)
    _dir
      .copy(player.pos)
      .addScaledVector(right, 0.5)
      .addScaledVector(player.forward, 0.28)
      .normalize()

    light.current.position.copy(_dir).multiplyScalar(WORLD_RADIUS + 20)
    light.current.target = target.current

    target.current.position.copy(player.pos).multiplyScalar(WORLD_RADIUS)
    target.current.updateMatrixWorld()
  })

  return (
    <>
      <object3D ref={target} />
      <directionalLight
        ref={light}
        intensity={2.4}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-camera-near={1}
        shadow-camera-far={WORLD_RADIUS + 40}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
    </>
  )
}
