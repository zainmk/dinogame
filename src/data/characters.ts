import type { ComponentType } from 'react'
import type { ModelProps } from '../characters/rig'
import { Pterosaur } from '../characters/Pterosaur'
import { Stegosaurus } from '../characters/Stegosaurus'
import { Velociraptor } from '../characters/Velociraptor'

export type CharacterId = 'raptor' | 'stego' | 'ptero'

export interface Character {
  id: CharacterId
  name: string
  tagline: string
  /** Swatch colour for the select-screen card. */
  accent: string
  Model: ComponentType<ModelProps>
  /** Per-character feel. Multiplies the base speeds in config.ts. */
  moveScale: number
  turnScale: number
  jumpScale: number
  /**
   * The signature action, bound to Space. Each one unlocks a different group of
   * coins, so finishing the game means playing all three.
   *   'fire'   breathes a forward cone that burns trees down
   *   'whip'   swings the tail and smashes boxes open
   *   'flight' jumps, then flaps — the only way onto the tall boxes
   */
  ability: 'fire' | 'whip' | 'flight'
  /** Short label for the HUD. */
  abilityName: string
  /**
   * Height of the flip's pivot, roughly the hips. Models are built with their
   * feet at y = 0, so rotating them at their origin would cartwheel them around
   * their toes.
   */
  pivotY: number
}

/**
 * The three builds from LEGO Creator 3-in-1 set 31379, "Fierce Dinosaur".
 * Adding a fourth is one model file plus one entry here.
 */
export const CHARACTERS: Character[] = [
  {
    id: 'raptor',
    name: 'Velociraptor',
    tagline: 'Breathes fire. Burn the trees to shake their coins loose.',
    accent: '#d13a2a',
    Model: Velociraptor,
    moveScale: 1.15,
    turnScale: 1.2,
    jumpScale: 1.15,
    ability: 'fire',
    abilityName: 'breathe fire',
    pivotY: 0.75,
  },
  {
    id: 'stego',
    name: 'Stegosaurus',
    tagline: 'Heavy and slow. Somersaults to bring the tail down on crates.',
    accent: '#a8332a',
    Model: Stegosaurus,
    moveScale: 0.85,
    turnScale: 0.75,
    jumpScale: 0.82,
    ability: 'whip',
    abilityName: 'tail flip',
    pivotY: 0.88,
  },
  {
    id: 'ptero',
    name: 'Pterosaur',
    tagline: 'Flies. The only one who can reach the tall crates.',
    accent: '#c42f3c',
    Model: Pterosaur,
    moveScale: 1.0,
    turnScale: 1.05,
    jumpScale: 1.0,
    ability: 'flight',
    abilityName: 'fly',
    pivotY: 0.68,
  },
]

export const CHARACTER_BY_ID = new Map(CHARACTERS.map((c) => [c.id, c]))

export function getCharacter(id: CharacterId): Character {
  return CHARACTER_BY_ID.get(id) ?? CHARACTERS[0]
}
