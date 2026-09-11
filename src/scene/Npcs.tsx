import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { NPC_NOTICE_ARC, NPC_TALK_ARC, NPC_TURN_SPEED, WORLD_RADIUS } from '../config'
import { NPCS, type Npc } from '../data/npcs'
import { Cat } from '../characters/Cat'
import { Villager } from '../characters/Villager'
import {
  anyTangent,
  createSurfaceState,
  isWithinArc,
  orientToSurface,
  turnToward,
} from '../math/sphere'
import { consumeInteract } from '../input/useInput'
import { player } from '../state/player'
import { useGame } from '../store'

export function Npcs() {
  /**
   * Proximity + the interact key, handled in one place for all NPCs. Runs after
   * `Player` has moved this frame because R3F calls useFrame subscribers in
   * mount order and Player is mounted first.
   */
  useFrame(() => {
    const game = useGame.getState()

    // Nearest NPC in range wins, so two NPCs standing close together can't fight
    // over the prompt.
    const threshold = Math.cos(NPC_TALK_ARC / WORLD_RADIUS)
    let nearest: string | null = null
    let bestDot = threshold
    for (const npc of NPCS) {
      const dot = player.pos.dot(npc.position)
      if (dot > bestDot) {
        bestDot = dot
        nearest = npc.id
      }
    }
    game.setNearbyNpc(nearest)

    if (consumeInteract()) {
      if (game.dialogue) game.advanceDialogue()
      else if (nearest) game.interactWith(nearest)
    }
  })

  return (
    <>
      {NPCS.map((npc) => (
        <NpcBody key={npc.id} npc={npc} />
      ))}
    </>
  )
}

/** How far a phone-holder's head tips down towards the screen, in radians. */
const PHONE_GAZE = -0.5

function NpcBody({ npc }: { npc: Npc }) {
  const group = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const head = useRef<Group>(null)

  // The NPC's own position and heading on the sphere. Its position is fixed but
  // the heading is now mutated every frame, so this is created once and kept.
  const surface = useMemo(
    () => createSurfaceState(npc.position, anyTangent(npc.position)),
    [npc.position],
  )
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1)

    // Turn to face the player once they're close enough to notice. This runs
    // after Player has moved, because Scene mounts Player first.
    //
    // Outside that range the NPC simply keeps its last heading rather than
    // springing back — someone still looking where you left them reads as more
    // alive than someone who resets.
    if (isWithinArc(player.pos, surface.pos, NPC_NOTICE_ARC, WORLD_RADIUS)) {
      turnToward(surface, player.pos, dt, NPC_TURN_SPEED)
    }

    if (group.current) orientToSurface(group.current, surface, WORLD_RADIUS)
    // Idle bob, so they read as alive rather than as scenery.
    if (inner.current) {
      inner.current.position.y = Math.sin(clock.elapsedTime * 1.6 + phase) * 0.06
    }

    // Someone on their phone keeps looking at it until you're close enough to
    // talk — then they look up at you, and stay up while the dialogue is open.
    if (head.current && npc.look.kind === 'villager' && npc.look.phone) {
      const game = useGame.getState()
      const engaged = game.nearbyNpc === npc.id || game.dialogue?.npcId === npc.id
      const target = engaged ? 0 : PHONE_GAZE
      head.current.rotation.x += (target - head.current.rotation.x) * (1 - Math.exp(-6 * dt))
    }
  })

  return (
    <group ref={group}>
      <group ref={inner} scale={npc.scale ?? 1}>
        {npc.look.kind === 'cat' ? (
          <Cat look={npc.look} />
        ) : (
          <Villager look={npc.look} headRef={head} />
        )}
      </group>
    </group>
  )
}
