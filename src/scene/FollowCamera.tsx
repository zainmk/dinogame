import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import {
  CAMERA_DISTANCE,
  CAMERA_HEIGHT,
  CAMERA_LAG,
  CAMERA_LOOK_HEIGHT,
  WORLD_RADIUS,
} from '../config'
import { jump, player } from '../state/player'

/**
 * How much of the player's jump height the camera follows. Tracking it fully is
 * nauseating; ignoring it entirely lets a gliding pterosaur drift out of frame.
 */
const JUMP_FOLLOW = 0.5

const desired = new Vector3()
const lookAt = new Vector3()

/**
 * Chase camera. Sits behind and above the player, on the surface's own basis.
 *
 * The line that matters is `camera.up.copy(player.pos)`. Without it three.js
 * keeps using world +Y as up, and the view snaps upside down the moment the
 * player crosses a pole — the single most likely bug in a game on a sphere.
 */
export function FollowCamera() {
  useFrame(({ camera }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1)

    const lift = jump.altitude * JUMP_FOLLOW

    // Behind: back along the heading. Above: out along the surface normal.
    desired
      .copy(player.pos)
      .multiplyScalar(WORLD_RADIUS + CAMERA_HEIGHT + lift)
      .addScaledVector(player.forward, -CAMERA_DISTANCE)

    // Exponential smoothing rather than a fixed lerp alpha, so the lag is the
    // same whether the machine is running at 60fps or 144fps.
    camera.position.lerp(desired, 1 - Math.exp(-CAMERA_LAG * dt))

    camera.up.copy(player.pos)
    lookAt.copy(player.pos).multiplyScalar(WORLD_RADIUS + CAMERA_LOOK_HEIGHT + lift)
    camera.lookAt(lookAt)
  })

  return null
}
