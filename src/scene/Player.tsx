import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { Group, Object3D } from 'three'
import {
  BOX_RADIUS,
  FIRE_ARC,
  FIRE_CONE,
  FIRE_DURATION,
  FLAP_SPEED,
  GLIDE_GRAVITY_SCALE,
  GRAVITY,
  HOLE_RADIUS,
  JUMP_SPEED,
  MAX_FLAPS,
  MOVE_SPEED,
  PLAYER_ALTITUDE,
  STEP_TOLERANCE,
  TREE_RADIUS,
  TURN_SPEED,
  WHIP_ARC,
  WHIP_DURATION,
  WHIP_HIT_AT,
  WHIP_HOP,
  WORLD_RADIUS,
} from '../config'
import { getCharacter, type Character } from '../data/characters'
import { BOXES, HOLE_POSITION, TOTAL_COINS, TREES } from '../data/world'
import {
  isWithinArc,
  moveOnSphere,
  orientToSurface,
  pushOutside,
  tangentToward,
} from '../math/sphere'
import { consumeContext, input, queueInteract } from '../input/useInput'
import { ability, flight, gait, jump, player, resetAbility, resetJump } from '../state/player'
import { useGame } from '../store'
import { Fire } from './Fire'

/** The optional rig parts a character model may name. See `characters/rig.tsx`. */
interface Rig {
  legL: Object3D | null
  legR: Object3D | null
  legFL: Object3D | null
  legFR: Object3D | null
  wingL: Object3D | null
  wingR: Object3D | null
  /** The wings' authored rest angle, so flapping adds to it instead of erasing it. */
  wingRestL: number
  wingRestR: number
}

const emptyRig = (): Rig => ({
  legL: null,
  legR: null,
  legFL: null,
  legFR: null,
  wingL: null,
  wingR: null,
  wingRestL: 0,
  wingRestR: 0,
})

const _dir = new Vector3()

const TWO_PI = Math.PI * 2

/** Ease with zero slope at both ends: square at takeoff, square again on landing. */
const smoothstep = (p: number) => p * p * (3 - 2 * p)

/**
 * Height of the surface under `pos` — 0 on open ground, or the top of a crate
 * you're standing over.
 *
 * This one function is all the platforming needs. Boxes are tiny next to a
 * radius-10 planet, so treating the footprint as a disc in the tangent plane is
 * accurate to well under a pixel, and the test is the same `isWithinArc` the
 * coins and NPCs already use.
 */
function groundHeightAt(pos: Vector3, altitude: number, broken: Set<string>): number {
  let height = 0
  for (const box of BOXES) {
    if (broken.has(box.id)) continue
    if (box.height <= height) continue
    // A crate only holds you up if you are already at roughly its top. Without
    // this, walking into the side at ground level counts as standing on it, and
    // since push-out stops applying once you're "on top", you ride straight up
    // the wall. STEP_TOLERANCE doubles as the step-up height.
    if (altitude < box.height - STEP_TOLERANCE) continue
    if (isWithinArc(pos, box.pos, BOX_RADIUS, WORLD_RADIUS)) height = box.height
  }
  return height
}

/** Launch, for the one character that can leave the ground under its own power. */
function launch(character: Character): void {
  const v0 = JUMP_SPEED * character.jumpScale
  jump.airborne = true
  jump.vy = v0
  jump.elapsed = 0
  flight.flapsLeft = MAX_FLAPS
}

function startAbility(duration: number): void {
  ability.active = true
  ability.elapsed = 0
  ability.duration = duration
  ability.struck = false
}

/**
 * Drives the player. This is the only place `player`, `jump` and `ability` are
 * written.
 *
 * There is no setState here except on real events — coins, boxes, trees. The
 * whole per-frame update runs against mutable objects, so running around the
 * planet costs React nothing.
 */
export function Player() {
  const anchor = useRef<Group>(null)
  // Sits at hip height and carries the ability animations, so the tail whip
  // rotates about the body rather than the toes. It must be a separate group
  // from `anchor`: orientToSurface overwrites the anchor's quaternion each frame.
  const pivot = useRef<Group>(null)
  const model = useRef<Group>(null)
  const rig = useRef<Rig>(emptyRig())

  const characterId = useGame((s) => s.character)
  const character = getCharacter(characterId)
  const { Model } = character

  useEffect(() => {
    rig.current = emptyRig()
    resetJump()
    resetAbility()
  }, [characterId])

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1)

    // getState() reads the store without subscribing, so none of this re-renders.
    const game = useGame.getState()
    const frozen = game.dialogue !== null
    const move = frozen ? 0 : input.move
    const turn = frozen ? 0 : input.turn

    // --- the context key ----------------------------------------------------
    // Space talks when there's someone to talk to, and otherwise triggers the
    // character's signature action. `nearbyNpc` is one frame stale (Npcs updates
    // it later in the frame) but it changes over ~a second of walking.
    if (consumeContext()) {
      if (frozen || game.nearbyNpc !== null) {
        // Hand it to the interact queue; Npcs drains that later this same frame.
        queueInteract()
      } else if (character.ability === 'flight') {
        if (!jump.airborne) launch(character)
        else if (flight.flapsLeft > 0) {
          flight.flapsLeft -= 1
          // max(), not assignment: flapping while already climbing fast should
          // never brake you, which is what a plain assignment would do.
          jump.vy = Math.max(jump.vy, FLAP_SPEED)
        }
      } else if (!ability.active) {
        startAbility(character.ability === 'whip' ? WHIP_DURATION : FIRE_DURATION)
      }
    }

    // --- abilities ----------------------------------------------------------
    if (ability.active) {
      ability.elapsed += dt
      if (ability.elapsed >= ability.duration) ability.active = false
    }

    if (character.ability === 'whip' && ability.active && !ability.struck) {
      // The hit lands partway through the swing, not on the keypress, so the
      // crate breaks when the tail visibly reaches it.
      if (ability.elapsed >= WHIP_DURATION * WHIP_HIT_AT) {
        ability.struck = true
        for (const box of BOXES) {
          if (isWithinArc(player.pos, box.pos, WHIP_ARC, WORLD_RADIUS)) {
            game.breakBox(box.id)
          }
        }
      }
    }

    if (character.ability === 'fire' && ability.active) {
      // A forward cone, so the fire has to be aimed. Burns for as long as it
      // is lit rather than in a single instant.
      for (const tree of TREES) {
        if (game.burntTrees.has(tree.id)) continue
        if (!isWithinArc(player.pos, tree.pos, FIRE_ARC, WORLD_RADIUS)) continue
        if (!tangentToward(player.pos, tree.pos, _dir)) continue
        if (_dir.dot(player.forward) > Math.cos(FIRE_CONE)) game.burnTree(tree.id)
      }
    }

    // --- the hole -----------------------------------------------------------
    // Only there once every cookie is found, and you have to be on the ground —
    // a pterosaur gliding over it shouldn't get sucked in.
    if (
      game.collected.size >= TOTAL_COINS &&
      !jump.airborne &&
      isWithinArc(player.pos, HOLE_POSITION, HOLE_RADIUS * 0.8, WORLD_RADIUS)
    ) {
      game.startFinale()
      return
    }

    // --- vertical -----------------------------------------------------------
    const ground = groundHeightAt(player.pos, jump.altitude, game.brokenBoxes)

    if (jump.airborne) {
      jump.elapsed += dt
      // Only the descent is slowed for the flier, so the launch still snaps.
      const soaring = character.ability === 'flight' && jump.vy < 0
      jump.vy -= GRAVITY * (soaring ? GLIDE_GRAVITY_SCALE : 1) * dt
      jump.altitude += jump.vy * dt

      if (jump.altitude <= ground) {
        jump.airborne = false
        jump.altitude = ground
        jump.vy = 0
        flight.flapsLeft = MAX_FLAPS
      }
    } else if (jump.altitude > ground + 0.01) {
      // Walked off a ledge — or the crate underneath was smashed. Start falling
      // with no upward velocity, which is what separates a fall from a jump.
      jump.airborne = true
      jump.vy = 0
      jump.elapsed = 0
      flight.flapsLeft = character.ability === 'flight' ? MAX_FLAPS : 0
    } else {
      jump.altitude = ground
    }
    jump.blend += ((jump.airborne ? 1 : 0) - jump.blend) * (1 - Math.exp(-14 * dt))

    // --- movement -----------------------------------------------------------
    // Steering continues in the air. Note this follows the surface arc rather
    // than a true ballistic path through space — which is the behaviour a
    // platformer wants, and it comes free from working in the rotating frame.
    moveOnSphere(
      player,
      move,
      turn,
      dt,
      WORLD_RADIUS,
      MOVE_SPEED * character.moveScale,
      TURN_SPEED * character.turnScale,
    )

    // Solid crates: if we're inside one's footprint but not high enough to be
    // standing on it, slide back out. Done after moving, so it corrects the
    // position the move produced.
    for (const box of BOXES) {
      if (game.brokenBoxes.has(box.id)) continue
      if (jump.altitude >= box.height - STEP_TOLERANCE) continue
      pushOutside(player, box.pos, BOX_RADIUS, WORLD_RADIUS)
    }
    // Living trees are solid too. Burnt ones are just stumps, so you can walk
    // over the ground they used to occupy.
    for (const tree of TREES) {
      if (game.burntTrees.has(tree.id)) continue
      pushOutside(player, tree.pos, TREE_RADIUS * tree.scale, WORLD_RADIUS)
    }

    if (anchor.current) {
      // The sphere math never learns about jumping: altitude is just added to
      // the radius here.
      orientToSurface(anchor.current, player, WORLD_RADIUS, PLAYER_ALTITUDE + jump.altitude)
    }

    // --- gait ---------------------------------------------------------------
    const target = move !== 0 && !jump.airborne ? 1 : 0
    gait.speed += (target - gait.speed) * (1 - Math.exp(-10 * dt))
    gait.phase += dt * 11 * gait.speed * character.moveScale

    if (!model.current || !pivot.current) return

    // Resolve the rig once per model, then reuse. getObjectByName walks the
    // subtree, which is not something to do 60 times a second.
    const r = rig.current
    if (!r.legL && !r.wingL) {
      const find = (name: string) => model.current?.getObjectByName(name) ?? null
      r.legL = find('legL')
      r.legR = find('legR')
      r.legFL = find('legFL')
      r.legFR = find('legFR')
      r.wingL = find('wingL')
      r.wingR = find('wingR')
      r.wingRestL = r.wingL?.rotation.z ?? 0
      r.wingRestR = r.wingR?.rotation.z ?? 0
    }

    const air = jump.blend
    const p = ability.active ? ability.elapsed / ability.duration : 0
    // How far into the somersault we are, as a 0..1..0 hump. Drives the hop
    // and the leg tuck, so the stegosaurus doesn't cartwheel with legs stiff.
    const flipping = character.ability === 'whip' && ability.active ? Math.sin(Math.PI * p) : 0

    // --- ability poses ------------------------------------------------------
    pivot.current.position.y = character.pivotY
    if (character.ability === 'whip') {
      // A full front somersault. The tail trails behind, so as the body rolls
      // forward the tail comes up, over the top, and sweeps down ahead — the
      // strike. smoothstep leaves it exactly upright at both ends; negative
      // pitches the head forward (models face -Z, so +X rotation is a backflip).
      pivot.current.rotation.x = -TWO_PI * smoothstep(p)
      pivot.current.rotation.y = 0
      // The tail is longer than the hips are high, so without a lift it would
      // sweep through the ground on the way over. Peaks when inverted.
      pivot.current.position.y += flipping * WHIP_HOP
    } else if (character.ability === 'fire') {
      // Rears back, then lunges forward as the flame leaves.
      pivot.current.rotation.y = 0
      pivot.current.rotation.x = Math.sin(Math.PI * p) * -0.28
    } else {
      pivot.current.rotation.y = 0
      pivot.current.rotation.x = -0.3 * air
    }

    // --- limbs --------------------------------------------------------------
    const swing = Math.sin(gait.phase) * 0.6 * gait.speed
    const tuck = character.ability === 'flight' ? -0.35 : 1.0
    // Legs leave the ground for a jump or a somersault; either tucks them.
    const lift = Math.min(1, air + flipping)
    const ground01 = 1 - lift
    const legPose = (grounded: number) => grounded * ground01 + tuck * lift

    if (r.legL) r.legL.rotation.x = legPose(swing)
    if (r.legR) r.legR.rotation.x = legPose(-swing)
    // Fore legs run on the opposite diagonal, which is how quadrupeds actually move.
    if (r.legFL) r.legFL.rotation.x = legPose(-swing * 0.8)
    if (r.legFR) r.legFR.rotation.x = legPose(swing * 0.8)

    if (r.wingL || r.wingR) {
      // Beating hard just after a flap, easing off into a soar.
      const urgency = flight.flapsLeft < MAX_FLAPS && jump.vy > 0 ? 1 : 0
      const beat = Math.sin(clock.elapsedTime * 3.2) * (0.16 + 0.32 * gait.speed)
      const soar = Math.sin(clock.elapsedTime * (1.1 + 6 * urgency)) * (0.07 + 0.5 * urgency)
      const flap = beat * ground01 + soar * air
      if (r.wingL) r.wingL.rotation.z = r.wingRestL * ground01 + flap
      if (r.wingR) r.wingR.rotation.z = r.wingRestR * ground01 - flap
    }

    // Bob twice per stride — once for each footfall. `pivotY` is cancelled here
    // so the model still stands with its feet on the ground.
    model.current.position.y =
      -character.pivotY + Math.abs(Math.sin(gait.phase)) * 0.07 * gait.speed
    model.current.rotation.z = Math.sin(gait.phase) * 0.04 * gait.speed
  })

  return (
    <group ref={anchor}>
      <group ref={pivot} position={[0, character.pivotY, 0]}>
        <Model key={characterId} ref={model} />
      </group>
      {character.ability === 'fire' && <Fire />}
    </group>
  )
}
