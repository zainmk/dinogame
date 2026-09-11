import type { Ref } from 'react'
import type { Group } from 'three'
import { Brick, Spike } from './rig'

/**
 * A person, built from the same brick vocabulary as the dinosaurs.
 *
 * Faces -Z with feet at y = 0, like every other model, so `orientToSurface`
 * places it on the sphere unchanged.
 *
 * Everything identifying lives in `VillagerLook` — so a new character is a data
 * entry, not a new component.
 */
export interface VillagerLook {
  skin: string
  hair: string
  shirt: string
  trousers: string
  shoes: string
  /** Optional print across the front of the shirt. Ignored when wearing an onesie. */
  graphic?: { shape: 'footballer' | 'dino'; color: string; accent?: string }
  /**
   * A hooded animal onesie, worn over everything. When present it replaces the
   * clothes and the hair: the hood covers the head, leaving the face and a bit
   * of fringe showing.
   */
  onesie?: OnesieLook
  /** 'open' is a laugh with teeth; 'grin' a broad smile; 'soft' a small, calm one. */
  mouth?: 'grin' | 'open' | 'soft'
  /** 'raised' reads cheerful; 'level' reads calm. */
  brows?: 'raised' | 'level'
  /** 'fringe' over the forehead; 'short' a close crop; 'back' a bun; 'long' worn down. */
  hairStyle?: 'fringe' | 'short' | 'back' | 'long'
  /** A touch of grey at the temples. Only drawn with the 'back' style. */
  hairStreak?: string
  /** Vertical stripes down the shirt, in this colour. */
  stripes?: string
  /** A long shirt that hangs over the hips — a kurta or tunic. */
  tunic?: boolean
  /** Trousers stop above the knee; bare legs below. */
  shorts?: boolean
  /** 'none' is sleeveless — bare skin from the shoulder, for a tank top. */
  sleeves?: 'none' | 'short' | 'threeQuarter' | 'long'
  /** A scarf or dupatta wrapped round the shoulders, in this colour. */
  scarf?: string
  /**
   * A hip-length zip jacket, worn over the shirt. Forces long sleeves and
   * overrides the torso/sleeve colour with `color`; `zip` is the centre seam.
   */
  /** `zip` draws a centre seam; `hood` a hood lying down the back. Both optional. */
  jacket?: { color: string; zip?: string; hood?: boolean }
  /** A snug beanie that replaces the hair entirely — it covers the whole crown. */
  hat?: { color: string }
  /** Dark lenses that replace the normal eyes. */
  sunglasses?: string
  /** Sunglasses pushed up and resting on top of the head, worn rather than on. */
  sunglassesOnHead?: string
  /** A short beard/stubble block along the jaw. */
  beard?: string
  /** A watch on one wrist. `side` matches the arm-side convention: 1 left, -1 right. */
  watch?: { color: string; side: 1 | -1 }
  /** A stockier build: wider and deeper through the chest, same height. */
  stocky?: boolean
  /** The opposite: narrower through the shoulders and chest. */
  slim?: boolean
  /** Clear-lensed glasses: thin frames around the eyes, in this colour. */
  glasses?: string
  /** Lighter patches over the torso — a marbled or tie-dye print. */
  mottle?: string
  /** Held in both hands in front of the chest, screen tilted up to the face. */
  phone?: string
  /** A floor-length skirt in the `trousers` colour — the lower half of a sari. */
  skirt?: boolean
  /** Embroidered border along the scarf's edges and the skirt hem. */
  scarfBorder?: string
  /** Bangles at both wrists, in this colour. */
  bangles?: string
  build: 'child' | 'youth' | 'adult'
}

export interface OnesieLook {
  /** Main suit colour. */
  body: string
  /** The furry panel down the front. */
  belly: string
  /** Cuffs at the wrists and ankles. */
  trim: string
  /** Scale markings dotted over the suit. */
  pattern: string
  /** Ridge down the back of the hood and spine. */
  spikes: string
}

/**
 * Children are not scaled-down adults: their heads are much larger relative to
 * the body, and their legs much shorter. That ratio — head nearly as tall as the
 * torso and nearly as wide as the shoulders — is what actually reads as "child"
 * rather than "small person", so the two builds are separate proportion sets
 * instead of one set with a scale factor.
 */
const BUILD = {
  child: {
    shoe: 0.08,
    leg: 0.32,
    torso: 0.34,
    neck: 0.04,
    head: 0.36,
    headW: 0.32,
    headD: 0.3,
    shoulder: 0.36,
    bodyD: 0.24,
    arm: 0.3,
    armW: 0.1,
    legW: 0.13,
  },
  // Between the two: longer legs than a child, but still a big head — and
  // wider and deeper through the body than either, for a stockier kid.
  youth: {
    shoe: 0.085,
    leg: 0.46,
    torso: 0.42,
    neck: 0.045,
    head: 0.34,
    headW: 0.31,
    headD: 0.29,
    shoulder: 0.44,
    bodyD: 0.3,
    arm: 0.36,
    armW: 0.12,
    legW: 0.165,
  },
  adult: {
    shoe: 0.09,
    leg: 0.6,
    torso: 0.46,
    neck: 0.05,
    head: 0.32,
    headW: 0.29,
    headD: 0.28,
    shoulder: 0.44,
    bodyD: 0.26,
    arm: 0.44,
    armW: 0.11,
    legW: 0.15,
  },
} as const

const DARK = '#241a16'
const WHITE = '#f6f3ec'

export function Villager({ look, headRef }: { look: VillagerLook; headRef?: Ref<Group> }) {
  const p = BUILD[look.build]
  // A stockier build widens and deepens the torso without changing height —
  // shadows shoulderW/bodyDepth so every torso, arm and clothing brick below
  // picks it up without each one branching on `look.stocky` individually.
  const shoulderW = p.shoulder * (look.stocky ? 1.14 : look.slim ? 0.86 : 1)
  const bodyDepth = p.bodyD * (look.stocky ? 1.18 : look.slim ? 0.88 : 1)
  const suit = look.onesie

  // Stack the body up from the ground.
  const yShoe = p.shoe
  const yLeg = yShoe + p.leg
  const yTorso = yLeg + p.torso
  const yNeck = yTorso + p.neck
  const yHead = yNeck + p.head

  const torsoMid = (yLeg + yTorso) / 2
  const headMid = (yNeck + yHead) / 2
  const faceZ = -p.headD / 2 - 0.012
  const chestZ = -bodyDepth / 2 - 0.012
  const legX = p.legW * 0.62
  const armX = shoulderW / 2 + p.armW / 2

  // The onesie covers the legs and torso; otherwise it's trousers and a shirt.
  const legColor = suit ? suit.body : look.trousers
  const torsoColor = suit ? suit.body : look.jacket ? look.jacket.color : look.shirt
  const sleeveColor = suit ? suit.body : look.jacket ? look.jacket.color : look.shirt

  // How far down the arm the sleeve reaches, as a fraction of arm length. A
  // jacket always has long sleeves, whatever `sleeves` says.
  const sleeveLen = suit
    ? 0.74
    : look.sleeves === 'none'
      ? 0
      : look.jacket || look.sleeves === 'long'
        ? 0.86
        : look.sleeves === 'threeQuarter'
          ? 0.58
          : 0.4
  // A tunic hangs this far below the waist, over the top of the legs. A jacket
  // is shorter — hip-length, not down to the knee.
  const tunicDrop = suit ? 0 : look.tunic ? p.leg * 0.42 : look.jacket ? p.leg * 0.2 : 0
  // Stripes are laid out across the body's width, front and back.
  const stripeXs = [-0.36, -0.18, 0, 0.18, 0.36].map((f) => f * shoulderW)

  return (
    <group>
      {/* legs and shoes */}
      {[1, -1].map((side) => (
        <group key={side}>
          {look.shorts && !suit ? (
            <>
              <Brick
                args={[p.legW, p.leg * 0.54, p.legW + 0.01]}
                color={look.skin}
                position={[legX * side, yShoe + p.leg * 0.27, 0]}
              />
              <Brick
                args={[p.legW + 0.03, p.leg * 0.5, p.legW + 0.04]}
                color={legColor}
                position={[legX * side, yLeg - p.leg * 0.25, 0]}
              />
            </>
          ) : (
            <Brick
              args={[p.legW, p.leg, p.legW + 0.01]}
              color={legColor}
              position={[legX * side, (yShoe + yLeg) / 2, 0]}
            />
          )}
          {suit && (
            <Brick
              args={[p.legW + 0.014, 0.05, p.legW + 0.024]}
              color={suit.trim}
              position={[legX * side, yShoe + 0.03, 0]}
            />
          )}
          <Brick
            args={[p.legW + 0.02, p.shoe, p.legW + 0.09]}
            color={look.shoes}
            position={[legX * side, p.shoe / 2, -0.02]}
          />
        </group>
      ))}

      {/* torso */}
      <Brick args={[shoulderW, p.torso, bodyDepth]} color={torsoColor} position={[0, torsoMid, 0]} />

      {/* A tunic: the shirt continues down over the hips, flaring very slightly. */}
      {tunicDrop > 0 && (
        <Brick
          args={[shoulderW + 0.03, tunicDrop, bodyDepth + 0.03]}
          color={torsoColor}
          position={[0, yLeg - tunicDrop / 2, 0]}
        />
      )}

      {/* The jacket's centre zip, and a short collar standing up at the back. */}
      {look.jacket && !suit && (
        <>
          {look.jacket.zip && (
            <Brick
              args={[0.03, p.torso + tunicDrop - 0.03, 0.015]}
              color={look.jacket.zip}
              position={[0, torsoMid - tunicDrop / 2, chestZ + 0.006]}
            />
          )}
          <Brick
            args={[shoulderW * 0.62, 0.08, 0.08]}
            color={look.jacket.color}
            position={[0, yTorso + 0.03, bodyDepth / 2 - 0.02]}
          />
          {/* A hood worn down: a soft lump lying across the upper back. */}
          {look.jacket.hood && (
            <Brick
              args={[shoulderW * 0.72, p.torso * 0.34, 0.1]}
              color={look.jacket.color}
              position={[0, yTorso - p.torso * 0.14, bodyDepth / 2 + 0.04]}
            />
          )}
        </>
      )}

      {/* Marbling: a scatter of lighter patches, like the onesie's scale marks. */}
      {look.mottle &&
        !suit &&
        [
          [-0.12, 0.12, 0.05],
          [0.1, 0.06, 0.04],
          [-0.04, -0.06, 0.06],
          [0.13, -0.11, 0.045],
          [-0.13, -0.15, 0.04],
        ].map(([x, y, w]) => (
          <Brick
            key={`${x}:${y}`}
            args={[w, w * 0.7, 0.012]}
            color={look.mottle!}
            position={[x * shoulderW * 2.2, torsoMid + y, chestZ + 0.004]}
            rotation={[0, 0, x * 3]}
          />
        ))}

      {/*
        A sari's lower half: a floor-length skirt over the legs, flaring at the
        hem, with an embroidered band along the bottom if the outfit has one.
      */}
      {look.skirt && !suit && (
        <>
          <Brick
            args={[shoulderW + 0.04, p.leg * 0.5, bodyDepth + 0.06]}
            color={look.trousers}
            position={[0, yLeg - p.leg * 0.25, 0]}
          />
          <Brick
            args={[shoulderW + 0.14, p.leg * 0.52, bodyDepth + 0.16]}
            color={look.trousers}
            position={[0, yShoe + p.leg * 0.26, 0]}
          />
          {look.scarfBorder && (
            <Brick
              args={[shoulderW + 0.15, 0.05, bodyDepth + 0.17]}
              color={look.scarfBorder}
              position={[0, yShoe + 0.04, 0]}
            />
          )}
        </>
      )}

      {/*
        Stripes: thin bricks laid proud of the front and back. There's no room for
        a texture at this scale, but five lines is enough for the eye to read
        "striped shirt" from across the planet.
      */}
      {look.stripes &&
        !suit &&
        stripeXs.map((x) =>
          [1, -1].map((face) => (
            <Brick
              key={`${x}:${face}`}
              args={[0.028, p.torso + tunicDrop - 0.02, 0.012]}
              color={look.stripes!}
              position={[
                x,
                torsoMid - tunicDrop / 2,
                face * (bodyDepth / 2 + 0.006 + (tunicDrop > 0 ? 0.015 : 0)),
              ]}
            />
          )),
        )}

      {/*
        A scarf: a loop over the shoulders, with a panel falling down one side of
        the front and another down the back — the way a dupatta actually drapes.
      */}
      {look.scarf && !suit && (
        <>
          <Brick
            args={[shoulderW + 0.06, 0.13, bodyDepth + 0.12]}
            color={look.scarf}
            position={[0, yTorso - 0.02, 0.01]}
          />
          <Brick
            args={[0.15, p.torso * 0.62, 0.045]}
            color={look.scarf}
            position={[-shoulderW * 0.24, yTorso - 0.09 - (p.torso * 0.62) / 2, chestZ + 0.01]}
          />
          <Brick
            args={[0.2, p.torso * 0.5, 0.045]}
            color={look.scarf}
            position={[shoulderW * 0.12, yTorso - 0.09 - (p.torso * 0.5) / 2, bodyDepth / 2 + 0.03]}
          />
          {/* The embroidered edge: a band down the front panel and along its hem. */}
          {look.scarfBorder && (
            <>
              <Brick
                args={[0.03, p.torso * 0.62, 0.05]}
                color={look.scarfBorder}
                position={[-shoulderW * 0.24 - 0.065, yTorso - 0.09 - (p.torso * 0.62) / 2, chestZ + 0.012]}
              />
              <Brick
                args={[0.15, 0.03, 0.05]}
                color={look.scarfBorder}
                position={[-shoulderW * 0.24, yTorso - 0.09 - p.torso * 0.62 + 0.01, chestZ + 0.012]}
              />
              <Brick
                args={[shoulderW + 0.07, 0.03, bodyDepth + 0.13]}
                color={look.scarfBorder}
                position={[0, yTorso - 0.085, 0.01]}
              />
            </>
          )}
        </>
      )}

      {suit ? (
        <>
          {/*
            The furry belly panel, the loudest thing in the reference photo. Proud
            of the chest and carried down onto the hips, which is how it actually
            runs on the suit.
          */}
          <Brick
            args={[shoulderW * 0.5, p.torso * 0.94, 0.05]}
            color={suit.belly}
            position={[0, torsoMid, chestZ + 0.018]}
          />
          <Brick
            args={[shoulderW * 0.42, 0.12, 0.05]}
            color={suit.belly}
            position={[0, yLeg - 0.03, chestZ + 0.018]}
          />

          {/* Scale markings. A scatter, not a texture — there is no room for one. */}
          {[
            [0.13, 0.1, 0],
            [-0.13, 0.03, 0],
            [0.13, -0.06, 0],
            [-0.13, -0.11, 0],
          ].map(([x, y]) => (
            <Brick
              key={`${x}:${y}`}
              args={[0.05, 0.03, 0.02]}
              color={suit.pattern}
              position={[x, torsoMid + y, chestZ + 0.006]}
              rotation={[0, 0, x > 0 ? 0.5 : -0.5]}
            />
          ))}

          {/* Ridge down the spine. */}
          {[0.1, -0.02, -0.14].map((dy, i) => (
            <Spike
              key={dy}
              position={[0, torsoMid + dy, bodyDepth / 2 + 0.02]}
              rotation={[Math.PI / 2, 0, 0]}
              size={0.045 - i * 0.006}
              length={0.11}
              color={suit.spikes}
            />
          ))}
        </>
      ) : look.graphic?.shape === 'footballer' ? (
        <group position={[0, torsoMid, chestZ]}>
          <Brick
            args={[0.055, 0.15, 0.015]}
            color={look.graphic.color}
            position={[0.015, 0.035, 0]}
            rotation={[0, 0, 0.38]}
          />
          <Brick
            args={[0.11, 0.042, 0.015]}
            color={look.graphic.color}
            position={[-0.035, -0.055, 0]}
            rotation={[0, 0, -0.5]}
          />
          <Brick
            args={[0.045, 0.075, 0.015]}
            color={look.graphic.color}
            position={[0.06, -0.045, 0]}
            rotation={[0, 0, 0.25]}
          />
          <mesh position={[-0.105, -0.085, 0.005]}>
            <sphereGeometry args={[0.038, 10, 10]} />
            <meshStandardMaterial color={WHITE} flatShading roughness={0.6} />
          </mesh>
        </group>
      ) : look.graphic?.shape === 'dino' ? (
        // A dinosaur print, side-on: body, neck and head, tail, two legs, and a
        // pair of claw-slash marks behind it. Reads as "green dino on a shirt".
        <group position={[0, torsoMid + 0.01, chestZ]}>
          {look.graphic.accent &&
            [-0.09, -0.02].map((x) => (
              <Brick
                key={x}
                args={[0.02, 0.24, 0.012]}
                color={look.graphic!.accent!}
                position={[x + 0.1, 0.0, -0.002]}
                rotation={[0, 0, 0.55]}
              />
            ))}
          <Brick args={[0.16, 0.075, 0.016]} color={look.graphic.color} position={[-0.01, -0.01, 0]} />
          <Brick
            args={[0.05, 0.075, 0.016]}
            color={look.graphic.color}
            position={[0.085, 0.045, 0]}
            rotation={[0, 0, -0.45]}
          />
          <Brick args={[0.075, 0.045, 0.016]} color={look.graphic.color} position={[0.125, 0.085, 0]} />
          <Brick
            args={[0.13, 0.03, 0.016]}
            color={look.graphic.color}
            position={[-0.135, 0.005, 0]}
            rotation={[0, 0, 0.3]}
          />
          {[-0.04, 0.03].map((x) => (
            <Brick
              key={x}
              args={[0.03, 0.06, 0.016]}
              color={look.graphic!.color}
              position={[x, -0.07, 0]}
            />
          ))}
        </group>
      ) : null}

      {/*
        Holding a phone: the forearms bend forward from the elbow and turn inward
        so the hands meet at the chest, with the phone between them tilted back
        towards the face.
      */}
      {look.phone && !suit && (
        <>
          {[1, -1].map((side) => (
            <group key={side} position={[armX * side, yTorso, 0]}>
              <Brick
                args={[p.armW + 0.022, p.arm * 0.5, p.armW + 0.022]}
                color={sleeveColor}
                position={[0, -p.arm * 0.25, 0]}
              />
              <group position={[0, -p.arm * 0.5, 0]} rotation={[0, side * 0.55, 0]}>
                <group rotation={[1.35, 0, 0]}>
                  <Brick
                    args={[p.armW + 0.022, p.arm * 0.34, p.armW + 0.022]}
                    color={sleeveColor}
                    position={[0, -p.arm * 0.17, 0]}
                  />
                  <Brick
                    args={[p.armW, p.arm * 0.2, p.armW]}
                    color={look.skin}
                    position={[0, -p.arm * 0.42, 0]}
                  />
                </group>
              </group>
            </group>
          ))}
          <group
            position={[0, yTorso - p.arm * 0.56, -(bodyDepth / 2 + p.arm * 0.36)]}
            rotation={[0.85, 0, 0]}
          >
            <Brick args={[0.085, 0.16, 0.012]} color={look.phone} />
            <Brick args={[0.07, 0.14, 0.006]} color="#cfe3ff" position={[0, 0, 0.008]} />
          </group>
        </>
      )}

      {/* arms: the sleeve covers the top, skin below, then whatever sits at the wrist */}
      {!look.phone && [1, -1].map((side) => (
        <group key={side} position={[armX * side, yTorso, 0]}>
          {sleeveLen > 0 && (
            <Brick
              args={[p.armW + 0.022, p.arm * sleeveLen, p.armW + 0.022]}
              color={sleeveColor}
              position={[0, -p.arm * (sleeveLen / 2), 0]}
            />
          )}
          {suit && (
            <Brick
              args={[p.armW + 0.03, 0.05, p.armW + 0.03]}
              color={suit.trim}
              position={[0, -p.arm * 0.76, 0]}
            />
          )}
          <Brick
            args={[p.armW, p.arm * (1 - sleeveLen) + 0.02, p.armW]}
            color={look.skin}
            position={[0, -p.arm * ((1 + sleeveLen) / 2), 0]}
          />
          {look.bangles && (
            <Brick
              args={[p.armW + 0.032, 0.028, p.armW + 0.032]}
              color={look.bangles}
              position={[0, -p.arm * 0.88, 0]}
            />
          )}
          {look.watch && look.watch.side === side && (
            <Brick
              args={[p.armW + 0.034, 0.05, p.armW + 0.034]}
              color={look.watch.color}
              position={[0, -p.arm * 0.86, 0]}
            />
          )}
        </group>
      ))}

      {/* neck and head */}
      <Brick
        args={[0.12, p.neck + 0.04, 0.12]}
        color={suit ? suit.body : look.skin}
        position={[0, yNeck - 0.01, 0]}
      />
      {/*
        Everything from here down is the head, wrapped so it can pitch at the neck.
        The inner group cancels the pivot's translation, so every head brick keeps
        the absolute position it was authored with; only the outer group rotates.
        `NpcBody` drives the rotation — a phone-holder looks down until spoken to.
      */}
      <group ref={headRef} position={[0, yNeck, 0]}>
      <group position={[0, -yNeck, 0]}>
      <Brick args={[p.headW, p.head, p.headD]} color={look.skin} position={[0, headMid, 0]} />

      {look.hat ? (
        // A snug beanie, pulled low to the brows, with a folded cuff at the
        // bottom edge — the one piece of geometry that reads as "beanie" rather
        // than "hair".
        <>
          <Brick
            args={[p.headW + 0.05, p.head * 0.62, p.headD + 0.05]}
            color={look.hat.color}
            position={[0, yHead - p.head * 0.28, 0.01]}
          />
          <Brick
            args={[p.headW + 0.07, p.head * 0.14, p.headD + 0.07]}
            color={look.hat.color}
            position={[0, yHead - p.head * 0.53, 0.01]}
          />
        </>
      ) : suit ? (
        <>
          {/*
            The hood, built as a shell around the head with the front left open.
            Crown, back, and two cheek pieces that come forward to frame the face —
            that opening is what makes it read as a hood rather than a helmet.
          */}
          <Brick
            args={[p.headW + 0.1, p.head * 0.36, p.headD + 0.1]}
            color={suit.body}
            position={[0, yHead - p.head * 0.12, 0.012]}
          />
          <Brick
            args={[p.headW + 0.1, p.head * 1.05, 0.08]}
            color={suit.body}
            position={[0, headMid + p.head * 0.04, p.headD / 2 + 0.035]}
          />
          {[1, -1].map((side) => (
            <Brick
              key={side}
              args={[0.06, p.head * 0.92, p.headD + 0.09]}
              color={suit.body}
              position={[(p.headW / 2 + 0.04) * side, headMid + p.head * 0.02, 0.008]}
            />
          ))}
          {/* the rolled edge under the chin, where the hood meets the shoulders */}
          <Brick
            args={[p.headW + 0.1, 0.07, p.headD + 0.06]}
            color={suit.body}
            position={[0, yNeck + 0.02, 0.02]}
          />

          {/* Hood markings and the ridge of spikes running over the crown. */}
          {[1, -1].map((side) => (
            <Brick
              key={side}
              args={[0.05, 0.03, 0.02]}
              color={suit.pattern}
              position={[(p.headW / 2 + 0.048) * side, headMid + p.head * 0.2, -p.headD * 0.28]}
              rotation={[0, side * 1.57, side * 0.5]}
            />
          ))}
          {[-0.12, 0.02, 0.16].map((dz, i) => (
            <Spike
              key={dz}
              position={[0, yHead + 0.03 - i * 0.012, dz]}
              size={0.05 - i * 0.004}
              length={0.13}
              color={suit.spikes}
            />
          ))}

          {/* A little hair escaping at the front, as it does in the photo. */}
          <Brick
            args={[p.headW * 0.72, p.head * 0.13, 0.05]}
            color={look.hair}
            position={[0, yHead - p.head * 0.19, -p.headD / 2 - 0.01]}
          />
        </>
      ) : look.hairStyle === 'short' ? (
        <>
          {/*
            A close crop: the cap sits a touch higher on the forehead than the
            fringe style, with only a small lip at the front and no fall down the
            back. The tousle on top is one raised block.
          */}
          <Brick
            args={[p.headW + 0.03, p.head * 0.4, p.headD + 0.03]}
            color={look.hair}
            position={[0, yHead - p.head * 0.17, 0.006]}
          />
          <Brick
            args={[p.headW * 0.86, p.head * 0.1, 0.045]}
            color={look.hair}
            position={[0, yHead - p.head * 0.33, -p.headD / 2 - 0.006]}
          />
          <Brick
            args={[p.headW * 0.5, p.head * 0.1, p.headD * 0.5]}
            color={look.hair}
            position={[0.02, yHead + 0.035, -0.01]}
            rotation={[0, 0.3, 0.08]}
          />
          {[1, -1].map((side) => (
            <Brick
              key={side}
              args={[0.04, p.head * 0.3, p.headD * 0.78]}
              color={look.hair}
              position={[(p.headW / 2 + 0.006) * side, yHead - p.head * 0.3, 0.01]}
            />
          ))}
        </>
      ) : look.hairStyle === 'long' ? (
        <>
          {/*
            Worn down: a cap over the crown, a centre part, and a fall of hair down
            the back past the shoulders, with a strand framing each side of the
            face in front. The long back is what reads from the game camera.
          */}
          <Brick
            args={[p.headW + 0.03, p.head * 0.4, p.headD + 0.03]}
            color={look.hair}
            position={[0, yHead - p.head * 0.18, 0.008]}
          />
          <Brick
            args={[p.headW + 0.06, p.head * 1.5, 0.09]}
            color={look.hair}
            position={[0, headMid - p.head * 0.35, p.headD / 2 + 0.03]}
          />
          {[1, -1].map((side) => (
            <Brick
              key={side}
              args={[0.05, p.head * 1.15, p.headD * 0.9]}
              color={look.hair}
              position={[(p.headW / 2 + 0.012) * side, headMid - p.head * 0.2, 0.03]}
            />
          ))}
          <Brick
            args={[p.headW * 0.6, p.head * 0.1, 0.04]}
            color={look.hair}
            position={[0, yHead - p.head * 0.35, -p.headD / 2 - 0.004]}
          />
        </>
      ) : look.hairStyle === 'back' ? (
        <>
          {/*
            Hair swept back into a bun. The cap sits further back than the fringe
            style so the forehead shows, and the bun at the nape is the piece that
            reads from behind — which is the angle the game camera mostly sees.
          */}
          <Brick
            args={[p.headW + 0.03, p.head * 0.34, p.headD + 0.02]}
            color={look.hair}
            position={[0, yHead - p.head * 0.14, 0.02]}
          />
          <Brick
            args={[p.headW + 0.02, p.head * 0.6, 0.06]}
            color={look.hair}
            position={[0, headMid + p.head * 0.04, p.headD / 2]}
          />
          <Brick
            args={[p.headW * 0.5, p.head * 0.36, 0.13]}
            color={look.hair}
            position={[0, headMid - p.head * 0.02, p.headD / 2 + 0.085]}
          />
          {[1, -1].map((side) => (
            <Brick
              key={side}
              args={[0.04, p.head * 0.34, p.headD * 0.72]}
              color={look.hair}
              position={[(p.headW / 2 + 0.006) * side, yHead - p.head * 0.26, 0.03]}
            />
          ))}
          {/* Grey at the temples: the cheapest possible way to say "older". */}
          {look.hairStreak &&
            [1, -1].map((side) => (
              <Brick
                key={side}
                args={[0.05, p.head * 0.1, 0.05]}
                color={look.hairStreak!}
                position={[
                  (p.headW / 2 - 0.02) * side,
                  yHead - p.head * 0.29,
                  -p.headD / 2 + 0.02,
                ]}
              />
            ))}
        </>
      ) : (
        <>
          {/*
            Hair, in three pieces: a cap over the crown, a block down the back, and
            a fringe overhanging the forehead. The fringe is the piece doing the
            work — hair silhouette is one of the few identity signals that survives
            at this polygon count.
          */}
          <Brick
            args={[p.headW + 0.03, p.head * 0.44, p.headD + 0.03]}
            color={look.hair}
            position={[0, yHead - p.head * 0.2, 0.008]}
          />
          <Brick
            args={[p.headW + 0.02, p.head * 0.52, 0.06]}
            color={look.hair}
            position={[0, headMid + p.head * 0.06, p.headD / 2]}
          />
          <Brick
            args={[p.headW + 0.034, p.head * 0.2, 0.055]}
            color={look.hair}
            position={[0, yHead - p.head * 0.15, -p.headD / 2 - 0.004]}
          />
          {[1, -1].map((side) => (
            <Brick
              key={side}
              args={[0.045, p.head * 0.4, p.headD * 0.8]}
              color={look.hair}
              position={[(p.headW / 2 + 0.008) * side, yHead - p.head * 0.28, 0.01]}
            />
          ))}
        </>
      )}

      {/* eyes: whites and pupils, not dots — it is most of what makes a face look back at you */}
      {look.sunglasses ? (
        // One wide dark lens rather than two — cheaper, and correct: sunglasses
        // read as a single band across the eyeline, not as separate frames.
        <Brick
          args={[p.headW * 0.64, 0.062, 0.024]}
          color={look.sunglasses}
          position={[0, headMid - p.head * 0.02, faceZ]}
        />
      ) : (
        [1, -1].map((side) => (
          <group key={side} position={[0.076 * side, headMid - p.head * 0.02, faceZ]}>
            <Brick args={[0.075, 0.072, 0.02]} color={WHITE} />
            <Brick args={[0.038, 0.05, 0.02]} color={DARK} position={[0, -0.004, -0.009]} />
          </group>
        ))
      )}

      {/*
        Eyebrows. Two blocks, and the single strongest expression signal available
        — angle alone carries the mood. Tilted up and out here, for a cheerful one.
      */}
      {[1, -1].map((side) => (
        <Brick
          key={side}
          args={[0.09, 0.03, 0.022]}
          color={look.hair}
          position={[0.078 * side, headMid + p.head * 0.14, faceZ]}
          rotation={[0, 0, (look.brows === 'level' ? -0.03 : -0.16) * side]}
        />
      ))}

      {look.glasses && !look.sunglasses && (
        <>
          {[1, -1].map((side) => (
            <group key={side} position={[0.076 * side, headMid - p.head * 0.02, faceZ - 0.006]}>
              <Brick args={[0.095, 0.012, 0.012]} color={look.glasses!} position={[0, 0.045, 0]} />
              <Brick args={[0.095, 0.012, 0.012]} color={look.glasses!} position={[0, -0.045, 0]} />
              <Brick args={[0.012, 0.09, 0.012]} color={look.glasses!} position={[0.045 * side, 0, 0]} />
              <Brick args={[0.012, 0.09, 0.012]} color={look.glasses!} position={[-0.045 * side, 0, 0]} />
            </group>
          ))}
          <Brick args={[0.05, 0.012, 0.012]} color={look.glasses} position={[0, headMid - p.head * 0.02 + 0.01, faceZ - 0.006]} />
        </>
      )}

      {look.beard && (
        <Brick
          args={[p.headW * 0.86, p.head * 0.22, 0.05]}
          color={look.beard}
          position={[0, headMid - p.head * 0.34, faceZ + 0.02]}
        />
      )}

      {look.sunglassesOnHead && (
        <Brick
          args={[p.headW * 0.66, 0.05, 0.1]}
          color={look.sunglassesOnHead}
          position={[0, yHead - p.head * 0.06, -p.headD * 0.06]}
          rotation={[-0.32, 0, 0]}
        />
      )}

      {look.mouth === 'open' ? (
        // A laugh: an open mouth with the upper teeth showing. Reads far louder
        // than a closed grin, which is right for the reference.
        <group position={[0, headMid - p.head * 0.24, faceZ]}>
          <Brick args={[0.12, 0.095, 0.02]} color="#4a1d1d" />
          <Brick args={[0.115, 0.024, 0.022]} color={WHITE} position={[0, 0.033, 0.004]} />
          <Brick args={[0.07, 0.026, 0.022]} color="#c9575f" position={[0, -0.03, 0.004]} />
        </group>
      ) : look.mouth === 'soft' ? (
        // A small, settled smile. Same shape as the grin, narrower and flatter.
        <>
          <Brick
            args={[0.056, 0.02, 0.02]}
            color={DARK}
            position={[0, headMid - p.head * 0.25, faceZ]}
          />
          {[1, -1].map((side) => (
            <Brick
              key={side}
              args={[0.034, 0.02, 0.02]}
              color={DARK}
              position={[0.042 * side, headMid - p.head * 0.235, faceZ]}
              rotation={[0, 0, 0.36 * side]}
            />
          ))}
        </>
      ) : (
        <>
          {/* a broad grin, built as a shallow upturned curve from three blocks */}
          <Brick
            args={[0.082, 0.024, 0.02]}
            color={DARK}
            position={[0, headMid - p.head * 0.26, faceZ]}
          />
          {[1, -1].map((side) => (
            <Brick
              key={side}
              args={[0.05, 0.024, 0.02]}
              color={DARK}
              position={[0.06 * side, headMid - p.head * 0.232, faceZ]}
              rotation={[0, 0, 0.5 * side]}
            />
          ))}
        </>
      )}
      </group>
      </group>
    </group>
  )
}
