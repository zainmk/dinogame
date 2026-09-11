import { WORLD_RADIUS } from '../config'
import { Boxes } from './Boxes'
import { Coins } from './Coins'
import { FollowCamera } from './FollowCamera'
import { Npcs } from './Npcs'
import { Planet } from './Planet'
import { Player } from './Player'
import { Sun } from './Sun'
import { Trees } from './Trees'

/**
 * World assembly.
 *
 * Mount order is load-bearing: R3F runs useFrame subscribers in the order they
 * mount, so Player updates the shared player state before the sun, camera, coins
 * and NPCs read it in the same frame.
 */
export function Scene() {
  return (
    <>
      <color attach="background" args={['#0b1020']} />
      <fog attach="fog" args={['#0b1020', WORLD_RADIUS * 1.8, WORLD_RADIUS * 4.5]} />

      <hemisphereLight args={['#9fd0ff', '#25402c', 1.1]} />
      <ambientLight intensity={0.45} />

      <Player />
      <Sun />
      <FollowCamera />
      <Planet />
      <Boxes />
      <Trees />
      <Coins />
      <Npcs />
    </>
  )
}
