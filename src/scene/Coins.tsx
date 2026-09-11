import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'
import { Quaternion, Vector3 } from 'three'
import type { Object3D } from 'three'
import { COIN_PICKUP_ARC, COIN_PICKUP_HEIGHT, COIN_RADIUS, WORLD_RADIUS } from '../config'
import { COINS, type Coin } from '../data/world'
import { isWithinArc } from '../math/sphere'
import { jump, player } from '../state/player'
import { useGame } from '../store'
import { makeCookieGeometry } from './cookieGeometry'

const UP = new Vector3(0, 1, 0)
const X_AXIS = new Vector3(1, 0, 0)

/** Stands the disc on its edge, so it spins like a coin rather than lying flat. */
const onEdge = new Quaternion().setFromAxisAngle(X_AXIS, Math.PI / 2)

const _surface = new Quaternion()
const _spin = new Quaternion()

/**
 * All the coins in one draw call via instancing. Each `<Instance>` is just a
 * transform; collecting one unmounts it.
 *
 * A coin is rendered only once whatever was hiding it is gone — the crate it was
 * packed in, or the tree it was up. Since the terrain resets each run but the
 * coins don't, every coin stays reachable whatever order you play the three
 * characters in.
 */
export function Coins() {
  // These change only on discrete events, never per frame.
  const collected = useGame((s) => s.collected)
  const broken = useGame((s) => s.brokenBoxes)
  const burnt = useGame((s) => s.burntTrees)

  const visible = COINS.filter((c) => {
    if (collected.has(c.id)) return false
    if (!c.hiddenUntil) return true
    return c.hiddenUntil.kind === 'box'
      ? broken.has(c.hiddenUntil.id)
      : burnt.has(c.hiddenUntil.id)
  })

  // Built once; every cookie is an instance of this one mesh.
  const cookie = useMemo(() => makeCookieGeometry(COIN_RADIUS * 1.15, 0.09), [])

  return (
    <Instances limit={COINS.length} castShadow>
      <primitive object={cookie} attach="geometry" />
      {/* vertexColors: the dough and the chips are painted into the geometry. */}
      <meshStandardMaterial vertexColors roughness={0.92} metalness={0} flatShading />
      {visible.map((coin) => (
        <CoinInstance key={coin.id} coin={coin} />
      ))}
    </Instances>
  )
}

function CoinInstance({ coin }: { coin: Coin }) {
  const ref = useRef<Object3D>(null)

  useFrame(({ clock }) => {
    const node = ref.current
    if (!node) return

    const t = clock.elapsedTime + coin.offset

    // Compose: lie the cylinder on its edge, spin it about the surface normal,
    // then rotate that whole frame so its up axis IS the surface normal.
    _surface.setFromUnitVectors(UP, coin.pos)
    _spin.setFromAxisAngle(UP, t * 2)
    node.quaternion.copy(_surface).multiply(_spin).multiply(onEdge)

    const hover = coin.height + Math.sin(t * 2) * 0.12
    node.position.copy(coin.pos).multiplyScalar(WORLD_RADIUS + hover)

    // Pickup is angular AND vertical. Without the height test a coin on top of a
    // crate could be taken from the ground below it, and the platforms would be
    // pure decoration.
    if (
      Math.abs(jump.altitude - coin.height) < COIN_PICKUP_HEIGHT &&
      isWithinArc(player.pos, coin.pos, COIN_PICKUP_ARC, WORLD_RADIUS)
    ) {
      useGame.getState().collectCoin(coin.id)
    }
  })

  return <Instance ref={ref} />
}
