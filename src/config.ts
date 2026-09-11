/** Every tunable number in the game. Tweak here, not in components. */

/** Radius of the planet, in world units. Small enough that the horizon curves visibly. */
export const WORLD_RADIUS = 10

/** How far the dino's origin sits above the surface (half its body height). */
export const PLAYER_ALTITUDE = 0.0

/** Arc length travelled per second, in world units. */
export const MOVE_SPEED = 5.5
/** Heading change per second, in radians. */
export const TURN_SPEED = 2.4

/** Upward speed at the moment of launch, before the per-character scale. */
export const JUMP_SPEED = 7.6
/** Downward acceleration. With JUMP_SPEED this gives ~0.76s of airtime. */
export const GRAVITY = 20
/**
 * Gravity multiplier applied to a gliding character while it is falling. Only
 * the descent is slowed, so the launch still feels like a jump.
 */
export const GLIDE_GRAVITY_SCALE = 0.28

export const CAMERA_DISTANCE = 7
export const CAMERA_HEIGHT = 3.6
export const CAMERA_LOOK_HEIGHT = 1.4
/** Higher = camera snaps to the player faster. Used as 1 - exp(-LAG * dt). */
export const CAMERA_LAG = 5

export const COIN_HOVER = 0.75
export const COIN_RADIUS = 0.32
/** Arc distance at which a coin is picked up. Converted to an angle by /WORLD_RADIUS. */
export const COIN_PICKUP_ARC = 1.1
/**
 * Vertical reach for a pickup. Without this the test is purely angular and a
 * coin on top of a box is collectable from the ground underneath it, which
 * would make the whole platform idea decorative.
 */
export const COIN_PICKUP_HEIGHT = 1.3

// --- abilities --------------------------------------------------------------

/** Pterosaur: upward speed granted by one mid-air flap, and how many per flight. */
export const FLAP_SPEED = 6.4
export const MAX_FLAPS = 4

/**
 * Stegosaurus: a front somersault that brings the tail up over the top and
 * slams it down ahead. Boxes within WHIP_ARC break at WHIP_HIT_AT, which is
 * timed to the moment the tail is sweeping forward-and-down, not to the
 * keypress. WHIP_HOP is a cosmetic lift so the tail clears the ground on the
 * way over.
 */
export const WHIP_DURATION = 0.72
export const WHIP_HIT_AT = 0.58
export const WHIP_ARC = 3.2
export const WHIP_HOP = 0.6

/** Velociraptor: fire breath. A forward cone, so you have to aim it. */
export const FIRE_DURATION = 0.75
export const FIRE_ARC = 4.5
/** Half-angle of the cone, in radians. */
export const FIRE_CONE = 0.62

// --- the finale -------------------------------------------------------------

/** Arc radius of the hole. Step inside it (on the ground) and down you go. */
export const HOLE_RADIUS = 1.1
/** How long the fall through the dark lasts before the party is lit. */
export const FALL_SECONDS = 2.2
/** The birthday banner appears this long after entering the hole. */
export const BANNER_AT = 3.4

// --- terrain ----------------------------------------------------------------

export const BOX_COUNT = 10
export const TREE_COUNT = 10
export const GROUND_COIN_COUNT = 20
/** Footprint radius of a box, as an arc length on the surface. */
export const BOX_RADIUS = 0.85
/**
 * Trunk radius of a living tree. Trees are solid because playtesting showed
 * the player walking inside the foliage, which hides the character completely
 * from a camera sitting right behind them. Burnt stumps are not solid.
 */
export const TREE_RADIUS = 0.62
/**
 * How far below a box's top the player can be and still be carried by it. Also
 * the ledge tolerance: below this, the box pushes you out instead of holding you.
 */
export const STEP_TOLERANCE = 0.3

/** Arc distance at which an NPC can be talked to. */
export const NPC_TALK_ARC = 2.4

/**
 * Arc distance at which an NPC notices the player and turns to face them.
 * Comfortably wider than the talk range, so they look up as you approach rather
 * than snapping round the instant you can speak.
 */
export const NPC_NOTICE_ARC = 8
/** How fast an NPC turns to face the player, in radians per second. */
export const NPC_TURN_SPEED = 2.2

/** Deterministic world layout — change to reshuffle the coins. */
export const WORLD_SEED = 1337
