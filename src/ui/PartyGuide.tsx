import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import { WORLD_RADIUS } from '../config'
import { HOLE_POSITION } from '../data/world'
import { rightAxis, tangentToward } from '../math/sphere'
import { player } from '../state/player'

const _to = new Vector3()
const _right = new Vector3()

/**
 * The banner that appears once every cookie is found, with an arrow that swings
 * to point at the hole relative to where the player is facing.
 *
 * The arrow turns every frame, so it can't go through React state — that would
 * re-render the HUD at 60fps. Instead a rAF loop reads the player's live
 * position and heading and writes the rotation straight onto the element.
 */
export function PartyGuide() {
  const arrow = useRef<HTMLSpanElement>(null)
  const distance = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!arrow.current || !distance.current) return
      if (!tangentToward(player.pos, HOLE_POSITION, _to)) return

      // Bearing in the player's own frame: 0 is straight ahead, positive is to
      // the right — which is also clockwise for a CSS rotation.
      const right = rightAxis(player, _right)
      const ahead = _to.dot(player.forward)
      const side = _to.dot(right)
      const deg = (Math.atan2(side, ahead) * 180) / Math.PI
      arrow.current.style.transform = `rotate(${(deg - 90).toFixed(1)}deg)`

      const arc = Math.acos(Math.max(-1, Math.min(1, player.pos.dot(HOLE_POSITION)))) * WORLD_RADIUS
      distance.current.textContent = `${Math.round(arc)}m`
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="guide">
      <span className="guide__arrow" ref={arrow} aria-hidden="true">
        ➜
      </span>
      <span className="guide__text">
        Every cookie found! Follow the arrow to the party · <span ref={distance} />
      </span>
    </div>
  )
}
