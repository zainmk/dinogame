import { Vector3 } from 'three'
import type { CatLook } from '../characters/Cat'
import type { VillagerLook } from '../characters/Villager'

/** How an NPC is drawn: a person, or a cat. */
export type NpcLook = ({ kind: 'villager' } & VillagerLook) | ({ kind: 'cat' } & CatLook)

/**
 * Eight evenly spaced spots: the corners of a cube, so every NPC is the same
 * distance (about 12 units) from each of its three nearest neighbours.
 *
 * The cube is tilted 65° about X so one edge faces the spawn point. That puts
 * two corners about 7 units ahead-left and ahead-right of where you start —
 * inside notice range, outside talk range — and spreads the rest round the
 * planet, with the far pair almost exactly opposite the spawn.
 */
const TILT = new Vector3(1, 0, 0)
const corner = (x: 1 | -1, y: 1 | -1, z: 1 | -1) =>
  new Vector3(x, y, z).applyAxisAngle(TILT, (-65 * Math.PI) / 180).normalize()

export interface Npc {
  id: string
  name: string
  /** Colour for the dialogue box's name line. Independent of the model. */
  accent: string
  /** Point on the UNIT sphere. Scaled by WORLD_RADIUS at render time. */
  position: Vector3
  look: NpcLook
  /** Uniform model scale. Omit for 1 — most NPCs don't need this. */
  scale?: number
  /** Linear script: E advances one line, past the last line closes the box. */
  lines: string[]
}

export const NPCS: Npc[] = [
  {
    id: 'ibi',
    name: 'Ibrahim',
    accent: '#48c98d',
    // Ahead and to the right of the spawn — one of the two greeters.
    position: corner(1, 1, 1),
    look: {
      kind: 'villager',
      build: 'child',
      skin: '#c68a5e',
      hair: '#241a14',
      // Under the onesie, so these barely show — but they still dress the feet.
      shirt: '#2fa572',
      trousers: '#2fa572',
      shoes: '#1b2a3d',
      onesie: {
        body: '#2fa572',
        belly: '#1f6fd6',
        trim: '#1f6fd6',
        pattern: '#ecd94f',
        spikes: '#ecd94f',
      },
    },
    lines: [
      'I want to play JACKPOT!',
      'Where is Mama?',
      'Can I play on the iPhone? I want to play Roblox!',
    ],
  },
  {
    id: 'thathi',
    name: 'Thathi (Grandma)',
    accent: '#8fbde6',
    // Ahead and to the left of the spawn — the other greeter.
    position: corner(-1, 1, 1),
    look: {
      kind: 'villager',
      build: 'adult',
      skin: '#c48a62',
      hair: '#4a2a1e',
      hairStyle: 'back',
      hairStreak: '#9a8f8a',
      // The kurta: pale blue with white stripes, worn long over white trousers.
      shirt: '#a9c8e6',
      stripes: '#f4f6f8',
      tunic: true,
      sleeves: 'threeQuarter',
      trousers: '#efe9dd',
      shoes: '#5a4636',
      scarf: '#f3eee2',
      bangles: '#d9a83a',
      mouth: 'soft',
      brows: 'level',
    },
    lines: [
      'Assalamualaikum, Shahir. Happy birthday!',
      'Can you get me some water?',
      'Have you seen my phone?',
      'Now go and pick up all your cookies.',
    ],
  },
  {
    id: 'ayan',
    name: 'Ayan',
    accent: '#f26a1f',
    // Straight on past Ibrahim, just over the horizon.
    position: corner(1, 1, -1),
    look: {
      kind: 'villager',
      build: 'youth',
      skin: '#b8804f',
      hair: '#1e1512',
      hairStyle: 'short',
      shirt: '#f26a1f',
      graphic: { shape: 'dino', color: '#4caa3e', accent: '#2a2622' },
      trousers: '#3a3f47',
      shorts: true,
      shoes: '#22252b',
      mouth: 'soft',
      brows: 'level',
    },
    lines: [
      'Happy birthday, Shahir bhai!',
      'Where is my toy, Shahir?',
      'Can I have some cookies too?',
    ],
  },
  {
    id: 'neko',
    name: 'Neko',
    accent: '#b8d24a',
    // Behind the spawn, to the right.
    position: corner(1, -1, 1),
    look: {
      kind: 'cat',
      coat: '#8f7154',
      stripe: '#4a3626',
      belly: '#e3d3b8',
      eyes: '#b8d24a',
      pink: '#d49a9e',
    },
    lines: ['Meow!', 'Meow meow.', 'Mee... HAPPY BIRTHDAY, SHAHIR! ...ow!'],
  },
  {
    id: 'rafhy',
    name: 'Rafhy Bhai',
    accent: '#8a2a33',
    // Behind the spawn, to the left.
    position: corner(-1, -1, 1),
    scale: 1.12,
    look: {
      kind: 'villager',
      build: 'adult',
      skin: '#c08657',
      hair: '#211712',
      shirt: '#e8e4da',
      hat: { color: '#5c1f24' },
      sunglasses: '#181818',
      jacket: { color: '#6d2029', zip: '#2a1013' },
      trousers: '#c9c4ba',
      shoes: '#181818',
      mouth: 'soft',
      brows: 'level',
    },
    lines: [
      'Happy birthday, Shahir! Ten years old. Good job, man.',
      'Take care of yourself, good luck, and keep at it in school.',
      "How's everything going? Did you collect all the cookies yet?",
    ],
  },
  {
    id: 'abu',
    name: 'Abu (Dad)',
    accent: '#e2734f',
    // The far side of the planet. Mumma is on the next corner over.
    position: corner(1, -1, -1),
    look: {
      kind: 'villager',
      build: 'adult',
      stocky: true,
      skin: '#c98a5c',
      hair: '#171310',
      hairStyle: 'short',
      beard: '#171310',
      shirt: '#e2734f',
      sleeves: 'none',
      trousers: '#55524c',
      shorts: true,
      shoes: '#3a3a38',
      sunglassesOnHead: '#3a3d45',
      watch: { color: '#141414', side: 1 },
      mouth: 'soft',
      brows: 'level',
    },
    lines: [
      'Happy birthday, Shahir! Mashallah, ten years old.',
      'Love you, beta. Proud of you.',
      'Now go and find the cookies!',
    ],
  },
  {
    id: 'nashra',
    name: 'Nashra Bhaji',
    accent: '#b9bcc6',
    // Straight on past Thathi, just over the horizon.
    position: corner(-1, 1, -1),
    // Youth proportions brought down to Ibrahim's height: a teenager, not a
    // small child — but exactly as tall as him, as asked.
    scale: 0.9,
    look: {
      kind: 'villager',
      build: 'youth',
      slim: true,
      skin: '#c99a72',
      hair: '#1f1612',
      hairStyle: 'long',
      shirt: '#8e9099',
      jacket: { color: '#8e9099', hood: true },
      mottle: '#b4b6bf',
      trousers: '#2c2f38',
      shoes: '#1d1f26',
      glasses: '#d8d9de',
      phone: '#1a1b20',
      mouth: 'soft',
      brows: 'level',
    },
    lines: [
      'Hello, Shahir! Congratulations — happy birthday!',
      "Okay, I'll play some Roblox with you later.",
      'Did you get all the cookies yet?',
    ],
  },
  {
    id: 'mumma',
    name: 'Mumma (Mom)',
    accent: '#d8c9a8',
    // The far side of the planet, on the corner next to Abu.
    position: corner(-1, -1, -1),
    look: {
      kind: 'villager',
      build: 'adult',
      skin: '#d2a27e',
      hair: '#a5784a',
      hairStyle: 'long',
      // The sari: a dark blouse and skirt, with the pallu over one shoulder and
      // an embroidered light border along every edge.
      shirt: '#1f1c22',
      sleeves: 'long',
      trousers: '#1f1c22',
      skirt: true,
      scarf: '#26222b',
      scarfBorder: '#cfc6b0',
      bangles: '#cfc6b0',
      shoes: '#2a2226',
      mouth: 'grin',
      brows: 'raised',
    },
    lines: [
      'Happy birthday, Shahir! Love you, beta.',
      "Congratulations — you're a big boy now!",
      'Everyone is here for you!',
    ],
  },
]

export const NPC_BY_ID = new Map(NPCS.map((npc) => [npc.id, npc]))
