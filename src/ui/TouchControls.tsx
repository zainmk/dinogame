import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { queueContext, setStick } from '../input/useInput'
import { useDevice } from '../input/device'

/** How far the knob can travel from the stick's centre, in px. Full deflection = 1. */
const STICK_RADIUS = 58
/** Below this fraction of deflection the stick reads as centred, so a resting thumb doesn't creep. */
const DEADZONE = 0.14

/**
 * Touch controls: a joystick under the left thumb and one action button under
 * the right.
 *
 * One button is enough because Space is already the context key — it talks when
 * someone's in range, advances an open dialogue, and otherwise fires the
 * character's ability. So the button is simply "Space", and a small child never
 * has to learn which button does what.
 *
 * The stick is *floating*: it appears wherever the left half of the screen is
 * first touched, rather than demanding the thumb land on a fixed circle. That is
 * far more forgiving for small hands. A faint resting stick shows where it
 * usually lives, for discoverability.
 *
 * Both write into the same `input` the keyboard does, so `Player` and everything
 * downstream are unchanged.
 */
export function TouchControls() {
  const touch = useDevice((s) => s.touch)
  if (!touch) return null
  return (
    <div className="touch">
      <Stick />
      <ActionButton />
    </div>
  )
}

function Stick() {
  // Pointer id of the finger currently on the stick, so a second finger on the
  // action button can never hijack it.
  const pointerId = useRef<number | null>(null)
  const origin = useRef({ x: 0, y: 0 })
  const [active, setActive] = useState(false)
  const [base, setBase] = useState({ x: 0, y: 0 })
  const [knob, setKnob] = useState({ x: 0, y: 0 })

  const apply = (dx: number, dy: number) => {
    const len = Math.hypot(dx, dy)
    const clamped = Math.min(len, STICK_RADIUS)
    const nx = len > 0 ? (dx / len) * clamped : 0
    const ny = len > 0 ? (dy / len) * clamped : 0
    setKnob({ x: nx, y: ny })

    // Deadzone, then rescale so full deflection is still exactly 1.
    let mag = clamped / STICK_RADIUS
    mag = mag < DEADZONE ? 0 : (mag - DEADZONE) / (1 - DEADZONE)
    if (mag === 0 || len === 0) {
      setStick(0, 0)
      return
    }
    // Screen y grows downwards; pushing up is forward.
    setStick((-dy / len) * mag, (dx / len) * mag)
  }

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== null) return
    pointerId.current = e.pointerId
    origin.current = { x: e.clientX, y: e.clientY }
    setBase({ x: e.clientX, y: e.clientY })
    setKnob({ x: 0, y: 0 })
    setActive(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== pointerId.current) return
    apply(e.clientX - origin.current.x, e.clientY - origin.current.y)
  }

  const release = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== pointerId.current) return
    pointerId.current = null
    setActive(false)
    setKnob({ x: 0, y: 0 })
    setStick(0, 0)
  }

  // If the page loses focus mid-drag the release never arrives; don't leave the
  // dino running off into the distance.
  useEffect(() => {
    const onBlur = () => {
      pointerId.current = null
      setActive(false)
      setKnob({ x: 0, y: 0 })
      setStick(0, 0)
    }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [])

  return (
    <div
      className="touch__zone touch__zone--left"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div
        className={`touch__stick${active ? ' is-active' : ''}`}
        style={active ? { left: base.x, top: base.y } : undefined}
      >
        <div
          className="touch__knob"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>
    </div>
  )
}

function ActionButton() {
  const [pressed, setPressed] = useState(false)

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    // Fire on the press, not the release — a game button that lags until you
    // lift your thumb feels broken.
    e.preventDefault()
    setPressed(true)
    queueContext()
  }

  return (
    <div className="touch__zone touch__zone--right">
      <button
        className={`touch__action${pressed ? ' is-pressed' : ''}`}
        aria-label="Action"
        onPointerDown={onDown}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        // The keyboard path handles Enter/Space itself; don't double-fire.
        onKeyDown={(e) => e.preventDefault()}
      >
        <span className="touch__action-ring" />
      </button>
    </div>
  )
}
