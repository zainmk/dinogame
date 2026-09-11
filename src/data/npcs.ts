import { Vector3 } from 'three'
import type { CatLook } from '../characters/Cat'
import type { VillagerLook } from '../characters/Villager'

/**
 * How an NPC is drawn.
 *
 * 'blob' is the original abstract capsule-and-sphere; 'villager' is a person.
 * Keeping both means adding people doesn't force a redesign of the ones already
 * standing on the planet.
 */
export type NpcLook =
  | { kind: 'blob'; color: string }
  | ({ kind: 'villager' } & VillagerLook)
  | ({ kind: 'cat' } & CatLook)

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
    id: 'sage',
    name: 'Trilo the Sage',
    accent: '#7c5cff',
    position: new Vector3(0.35, 0.55, 0.75).normalize(),
    look: { kind: 'blob', color: '#7c5cff' },
    lines: [
      'Ah — a traveller! Few walk the whole way round.',
      'The world is a ball, you know. Keep running in one direction and you will meet yourself coming back.',
      'The gold coins? Scattered by the last dino who tried it. Do help yourself.',
    ],
  },
  {
    id: 'gus',
    name: 'Gus',
    accent: '#ff8c42',
    position: new Vector3(-0.8, -0.2, 0.55).normalize(),
    look: { kind: 'blob', color: '#ff8c42' },
    lines: [
      "Don't mind me. I'm just standing here being upside down relative to somebody.",
      'It all evens out on a planet this size.',
    ],
  },
  {
    id: 'pip',
    name: 'Pip',
    accent: '#3ecf8e',
    position: new Vector3(0.1, -0.9, -0.42).normalize(),
    look: { kind: 'blob', color: '#3ecf8e' },
    lines: [
      'You came all the way to the south pole? For me?',
      'I have nothing to give you. But I am delighted.',
      'Go on, there are coins back north.',
    ],
  },
  {
    id: 'ibi',
    name: 'Ibrahim',
    accent: '#48c98d',
    // Close to the spawn point and just off the starting heading, so he's the
    // first person you meet.
    position: new Vector3(0.18, 0.52, -0.83).normalize(),
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
      'I WANT TO PLAY JACKPOT!',
      'where is mama?',
      'can i play on iphone? I want to play Roblox!',
    ],
  },
  {
    id: 'thathi',
    name: 'Thathi',
    accent: '#8fbde6',
    // Across the starting path from Ibrahim, a little further along — so the
    // two of them are the first people you meet, one on each side.
    position: new Vector3(-0.2, 0.45, -0.85).normalize(),
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
      'Assalamualaikum Shahir, Happy Birthday!',
      'Can you get me some water',
      'Have you seen my phone?',
      'Pick up all your coins',
    ],
  },
  {
    id: 'ayan',
    name: 'Ayan',
    accent: '#f26a1f',
    // Further down the starting path than the other two, so you meet Ibrahim
    // and Thathi first and then him.
    position: new Vector3(0.1, 0.22, -0.97).normalize(),
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
      'happy birthday, shahir bhai!',
      'where is my toy shahir!',
      'can i have some coins too!',
    ],
  },
  {
    id: 'neko',
    name: 'Neko',
    accent: '#b8d24a',
    // Last of the welcoming party along the starting path.
    position: new Vector3(0.05, -0.15, -0.99).normalize(),
    look: {
      kind: 'cat',
      coat: '#8f7154',
      stripe: '#4a3626',
      belly: '#e3d3b8',
      eyes: '#b8d24a',
      pink: '#d49a9e',
    },
    lines: ['Meow!', 'meow meow', 'MEEE... HAPPY BIRTHDAY SHAHIR!....OWWW'],
  },
  {
    id: 'rafhy',
    name: 'Rafhy Bhai',
    accent: '#8a2a33',
    // Off on its own, well clear of the others' talk radius.
    position: new Vector3(0.42, -0.4, -0.82).normalize(),
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
      'happy birthday shahir, 10 years old - good job man',
      'Take care of yourself, good luck and keep at school',
      'How is everything going? Did you collect all the coins yet?',
    ],
  },
  {
    id: 'abu',
    name: 'Abu / Dad',
    accent: '#e2734f',
    // Further along the path again, spaced clear of Rafhy's talk radius.
    position: new Vector3(0.55, -0.58, -0.6).normalize(),
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
      'Happy Birthday Shahir! Mashallah 10 years old',
      'Love you beta - proud of you',
      'Go find the coins!',
    ],
  },
  {
    id: 'nashra',
    name: 'Nashra Bhaji',
    accent: '#b9bcc6',
    // On the far side of the path from Ibrahim, past Thathi.
    position: new Vector3(-0.45, 0.2, -0.87).normalize(),
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
      'Hello Shahir, congratulations - Happy Birthday!',
      "Okay I'll play some Roblox with you later",
      'Did you get all the coins yet?',
    ],
  },
  {
    id: 'mumma',
    name: 'Mumma / Mom',
    accent: '#d8c9a8',
    // Beside Abu — the two of them together, a little apart from the kids.
    position: new Vector3(0.82, -0.3, -0.48).normalize(),
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
      'Happy Birthday Shahir! Love you beta',
      "Congratualations - your a big boy now!",
      'Everyone is here for you!',
    ],
  },
]

export const NPC_BY_ID = new Map(NPCS.map((npc) => [npc.id, npc]))
