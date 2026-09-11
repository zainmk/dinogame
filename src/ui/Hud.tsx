import { getCharacter } from '../data/characters'
import { NPC_BY_ID } from '../data/npcs'
import { TOTAL_COINS } from '../data/world'
import { useGame } from '../store'
import { useDevice } from '../input/device'

/**
 * Plain DOM over the canvas, not drei's <Html>. The score and the prompt are
 * screen-space by nature, so there's nothing to gain by projecting them through
 * the 3D scene — and this way they cost the renderer nothing.
 */
export function Hud() {
  // Each of these re-renders only on a discrete event, never per frame.
  const found = useGame((s) => s.collected.size)
  const nearbyNpc = useGame((s) => s.nearbyNpc)
  const dialogue = useGame((s) => s.dialogue)
  const characterId = useGame((s) => s.character)
  const returnToSelect = useGame((s) => s.returnToSelect)
  const touch = useDevice((s) => s.touch)

  const npc = nearbyNpc ? NPC_BY_ID.get(nearbyNpc) : null
  const character = getCharacter(characterId)
  const done = found >= TOTAL_COINS

  return (
    <>
      <div className="hud-score">
        <span className="hud-score__value">{found}</span>
        <span className="hud-score__label">of {TOTAL_COINS} coins</span>
      </div>

      {/* On touch the controls are on screen; naming keys would only confuse. */}
      {touch ? (
        <div className="hud-help">
          <span className="hud-dot" /> {character.abilityName}
        </div>
      ) : (
        <div className="hud-help">
          <kbd>W</kbd>
          <kbd>S</kbd> run &nbsp; <kbd>A</kbd>
          <kbd>D</kbd> turn &nbsp; <kbd>Space</kbd> {character.abilityName}
        </div>
      )}

      {/* Progress is shared, so swapping dinosaur is a core move, not a restart. */}
      <button className="hud-swap" onClick={returnToSelect}>
        Swap dino
      </button>

      {/* Space becomes "talk" while an NPC is in range, so it's shown as such. */}
      {npc && !dialogue && (
        <div className="hud-prompt">
          {touch ? (
            <span className="hud-dot" />
          ) : (
            <>
              <kbd>Space</kbd>
              <kbd>E</kbd>
            </>
          )}{' '}
          talk to {npc.name}
        </div>
      )}

      {done && <div className="hud-done">Every coin found. All three of them earned it.</div>}
    </>
  )
}
