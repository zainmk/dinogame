import { NPC_BY_ID } from '../data/npcs'
import { useGame } from '../store'
import { useDevice } from '../input/device'

/**
 * Renders the open dialogue, if any. Advancing is driven from the same interact
 * key the world uses (handled in `Npcs`), so there is only one code path for
 * "the player pressed E" — clicking the box is just a convenience.
 */
export function DialogueBox() {
  const dialogue = useGame((s) => s.dialogue)
  const advance = useGame((s) => s.advanceDialogue)
  const touch = useDevice((s) => s.touch)

  if (!dialogue) return null

  const npc = NPC_BY_ID.get(dialogue.npcId)
  if (!npc) return null

  const isLast = dialogue.line === npc.lines.length - 1

  return (
    <div className="dialogue" onClick={advance} role="dialog" aria-live="polite">
      <div className="dialogue__name" style={{ color: npc.accent }}>
        {npc.name}
      </div>
      <p className="dialogue__line">{npc.lines[dialogue.line]}</p>
      <div className="dialogue__hint">
        {touch ? (
          <>tap {isLast ? 'to close' : 'to continue'}</>
        ) : (
          <>
            <kbd>Space</kbd>
            <kbd>E</kbd> {isLast ? 'done' : 'next'}
          </>
        )}
      </div>
    </div>
  )
}
