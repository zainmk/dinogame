# Spherical World Game — Architecture Plan

A browser game where a character runs around the outside of a small 3D planet,
collects coins for points, and talks to NPCs.

**Guiding principle: smallest thing that works, then build on it.** Every phase
below ends in a running, playable build. No phase depends on a feature from a
later phase.

---

## 1. Confirmed decisions

| Decision | Choice | Consequence |
|---|---|---|
| Controls | **Tank controls** — W/S run, A/D turn | No camera-basis projection, no pole singularities. Camera is a dumb follower. |
| Character | **Primitive shapes** | No asset pipeline, no `Suspense` in phase 1. Isolated behind one component so a `.glb` can drop in later. |
| Dialogue | **Linear script** | Dialogue data is a plain array of strings per NPC. Extends to a node graph later without moving the trigger/UI code. |
| Language | **TypeScript** | Vite `react-ts` template, no extra config. |

## 2. Assumptions

These are choices made in the absence of a stated requirement. Each is cheap to
reverse; call out any that are wrong.

1. **Single player, no backend, no persistence.** State lives in memory; a page
   refresh restarts the run. No accounts, no server, no multiplayer.
2. **Desktop keyboard-first.** Mobile/touch and gamepad are out of scope for the
   phases below. Nothing in the input layer prevents adding them.
3. **The world is a smooth sphere**, not a heightmapped planet. Radius is a
   single constant (`WORLD_RADIUS = 10`). Decorations (trees, rocks) sit *on*
   the surface; they don't deform it.
4. **The character never leaves the surface** in the core loop. Jumping is a
   phase-4 nicety implemented as an altitude offset, not as gravity simulation.
5. **No physics engine.** Sphere-surface motion and pickup collision are
   closed-form (see §4). Rapier is a later option, not a starting dependency.
6. **Score is a single integer.** No combos, no timers, no lives, no fail state
   in the core loop. The game is a sandbox until a goal is specified.
7. **"dinogame" implies the character is a dinosaur.** The phase-1 primitive is
   a rough dino silhouette (body + head + tail + two legs). Cosmetic only.
8. **Target: modern evergreen browsers with WebGL2.** No legacy fallbacks.

## 3. Stack

| Layer | Choice | Why this one |
|---|---|---|
| Build | **Vite** (`react-ts` template) | Fastest dev server, zero-config TS, the default for R3F projects. |
| UI | **React 19** | Requested. Only used for the HUD/dialogue and to mount the canvas — *not* for per-frame simulation. |
| 3D | **three.js** | The only realistic choice for browser 3D. |
| React-three bridge | **@react-three/fiber** (R3F) | Renders the three.js scene graph as JSX and gives us `useFrame` — a per-frame hook that runs *outside* React's render cycle. |
| 3D helpers | **@react-three/drei** | Cherry-pick a few helpers: `<KeyboardControls>`, `<OrbitControls>` (dev only), `<Environment>`, `<Text>`. Avoid pulling in more than needed. |
| Game state | **Zustand** | ~1KB store, readable outside React (`useStore.getState()`) from inside `useFrame`. This property is the reason it beats Context/Redux here. |
| Types/lint | TypeScript, ESLint | Vite template defaults. |

**Explicitly deferred, not chosen now:** `@react-three/rapier` (physics),
`@react-three/postprocessing` (bloom/AO), `howler` / `use-sound` (audio),
`leva` (debug GUI), `maath` (easing). Each has a natural phase where it earns
its place — see §7.

## 4. The core technical problem: moving on a sphere

Everything unusual about this game lives here. Solving it cleanly makes the rest
ordinary game code.

### Representation

The player is **not** stored as an `(x, y, z)` position with gravity pulling it
down. It's stored as an orientation on the sphere:

```
pos     : Vector3  — unit vector, the point on the sphere the player stands on
forward : Vector3  — unit vector, tangent to the sphere at `pos` (the heading)
```

Two invariants hold at all times: `|pos| = 1`, and `pos · forward = 0`.
The world-space render position is simply `pos * WORLD_RADIUS`.

### Per-frame update

```
up    = pos                       // "up" is trivially the position vector
right = up × forward

// A/D — turn in place: rotate the heading about the local up axis
forward.applyAxisAngle(up, -turnInput * TURN_SPEED * dt)

// W/S — run: rotate BOTH vectors about the right axis.
// Arc length s over radius R gives the angle to rotate through.
theta = moveInput * MOVE_SPEED * dt / WORLD_RADIUS
pos.applyAxisAngle(right, -theta)
forward.applyAxisAngle(right, -theta)

// Re-orthogonalize to stop float drift accumulating over minutes of play
pos.normalize()
forward.sub(up.clone().multiplyScalar(forward.dot(up))).normalize()
```

Walking "over the north pole" is not a special case here — it's just more
rotation. That's the payoff for storing an orientation instead of lat/long.

### Orienting the mesh

Build a basis matrix from the three orthonormal vectors and apply it:

```
matrix.makeBasis(right, up, forward.clone().negate())  // three.js meshes face -Z
mesh.position.copy(pos).multiplyScalar(WORLD_RADIUS)
mesh.quaternion.setFromRotationMatrix(matrix)
```

### Camera

A chase camera derived from the same basis — no `OrbitControls` in play mode:

```
target = pos*(R + HEIGHT) - forward*DIST            // behind and above the player
camera.position.lerp(target, 1 - exp(-LAG * dt))    // frame-rate-independent smoothing
camera.up.copy(up)                                  // critical: keeps the horizon level
camera.lookAt(pos * (R + LOOK_HEIGHT))
```

Note `camera.up` — without it the camera flips when the player crosses a pole.

### Collision

Both coins and NPCs are points on the sphere, so proximity is one dot product —
no bounding boxes, no broadphase, no physics engine:

```
isNear = playerPos.dot(itemPos) > cos(PICKUP_ANGLE)
```

With a few hundred entities this is trivially fast in a plain loop.

### Placing things on the sphere

Random points must use a **uniform** distribution or everything clusters at the
poles. Use the standard method: normalize a vector of three Gaussian samples, or
sample `z` uniformly in `[-1, 1]` and `phi` uniformly in `[0, 2π]`. Naive
`(random θ, random φ)` is the common bug here.

## 5. State architecture

The single most important structural rule:

> **The simulation does not live in React state.**

Calling `setState` 60 times a second re-renders the tree 60 times a second and
the game stutters. So state is split by *how often it changes*:

**Per-frame, mutable — lives in refs, mutated in `useFrame`, never triggers a render**
- player `pos` / `forward` / velocity
- camera position
- coin spin/bob animation
- the `Object3D` transforms themselves

**Discrete, event-driven — lives in Zustand, triggers a render when it changes**
- `score: number`
- `collectedCoins: Set<string>`
- `dialogue: { npcId, lineIndex } | null`
- `nearbyNpc: string | null` (drives the "Press E" prompt)
- `phase: 'title' | 'playing' | 'paused'`

`useFrame` reads Zustand via `useStore.getState()` (a plain function call — no
subscription, no re-render) and writes via actions only on real events: a coin
touched, an NPC entered. The HUD subscribes normally and re-renders a handful of
times per second at most.

**The HUD is plain DOM, not `<Html>` from drei.** A sibling `<div>` absolutely
positioned over the canvas is cheaper than anything projected through the 3D
scene, and dialogue boxes and score counters are screen-space by nature. Only
world-anchored labels (a name floating over an NPC's head) would justify `<Html>`
or `<Text>`.

## 6. File structure

```
dinogame/
  index.html
  package.json
  vite.config.ts
  src/
    main.tsx                 # React root
    App.tsx                  # <Canvas> + <Hud>, the only place they meet
    config.ts                # WORLD_RADIUS, MOVE_SPEED, TURN_SPEED, PICKUP_ANGLE...
    store.ts                 # Zustand: score, dialogue, nearbyNpc, phase

    math/
      sphere.ts              # moveOnSphere, orientToSurface, randomPointOnSphere,
                             # angularDistance — pure functions, no React, unit-testable

    scene/
      Scene.tsx              # lights, sky, world assembly
      Planet.tsx             # the sphere mesh
      Player.tsx             # useFrame: input -> sphere math -> mesh transform
      FollowCamera.tsx       # chase camera
      Coins.tsx              # instanced coins + pickup test
      Npcs.tsx               # NPC meshes + proximity test

    input/
      useInput.ts            # keyboard -> { move: -1|0|1, turn: -1|0|1, interact: bool }
                             # one abstraction point; gamepad/touch plug in here

    ui/
      Hud.tsx                # score, "Press E to talk" prompt
      DialogueBox.tsx        # renders store.dialogue

    data/
      npcs.ts                # [{ id, position, color, name, lines: string[] }]
```

`math/sphere.ts` holding pure functions is deliberate: it's the part most likely
to have subtle bugs and the only part worth testing directly.

## 7. Build phases

Each phase is independently runnable. Stop and play at every one.

> **Status: phases 0–3 are built and verified, plus a character-select screen
> and the jump.** `npm run dev`. The game runs, the dino circles the planet over
> both poles without the camera flipping, coins are collected, all three NPCs
> talk, and Space jumps. The rest of phase 4 (acceleration/friction) is not done.
>
> Deviations from the plan below, all deliberate:
> - Added `src/state/player.ts` — the per-frame player state is a module
>   singleton rather than a ref, because the camera, coins, NPCs and sun all read
>   it inside their own `useFrame`. Same principle (out of React), easier sharing.
> - Added `src/scene/Sun.tsx` — a key light anchored to the player's local frame.
>   A world-fixed sun left half the planet in unplayable night.
> - Added `src/characters/` and `src/ui/CharacterSelect.tsx` — three playable
>   dinosaurs on a rotating stand, chosen before play. `store.phase` (which the
>   plan already anticipated in §5) drives it. `Dino.tsx` was replaced by the
>   character registry in `src/data/characters.ts`.
>
> - Added terrain and per-character abilities. Space now triggers the character's
>   signature action instead of a jump: the velociraptor breathes a forward cone
>   of fire that burns trees down, the stegosaurus swings its tail and smashes
>   crates open, and the pterosaur jumps then flaps. Each unlocks a different
>   group of coins, so no single dinosaur can finish the game. Coin progress is
>   shared and saved to localStorage; the terrain damage deliberately is not, and
>   resets every run — a crate the stegosaurus smashed is a platform the pterosaur
>   still needs, so every coin stays reachable in any play order.
> - Platforming rests on one function, `groundHeightAt`: the surface under the
>   player is 0, or a crate's top face. Solidity is `pushOutside`, which rotates
>   the player back out of an obstacle's footprint. The one subtlety is that a
>   crate only supports you if you are already near its top — otherwise walking
>   into the side counts as standing on it and you ride up the wall.
> - Added touch controls for tablets: a floating joystick under the left thumb
>   and one action button under the right. One button suffices because Space is
>   already the context key. Both feed the same `input` the keyboard does — the
>   stick analog, the keys digital, summed and clamped — so nothing downstream
>   changed. Shown only when `pointer: coarse` matches (or on the first touch), with
>   key hints swapped for the button's dot, a portrait rotate prompt, and the
>   browser's touch gestures suppressed. Progress is per device (localStorage).
> - The front somersault lives on as the stegosaurus's tail attack: a full flip
>   about the hip pivot that brings the tail up over the top and down onto the
>   crates ahead, with a cosmetic hop so the tail clears the ground. The strike
>   is timed to the tail's downswing (~-230°), not the keypress.
>
> - Added the jump: `state/player.ts` carries `altitude`/`vy`, which is added
>   straight to the sphere radius in `orientToSurface` — the sphere math never
>   learns about jumping. Space is a *context* key: it talks when an NPC is in
>   range or a dialogue is open, and jumps otherwise. The somersault is driven by
>   fraction of airtime (computed at launch), which is what makes it land exactly
>   upright rather than on whatever angle it reached; it rides a pivot group at
>   hip height, because rotating the model at its own origin would cartwheel it
>   around its toes, and because `orientToSurface` overwrites the anchor group's
>   quaternion every frame.
>
> - The NPC cast is now a family: Ibrahim, Thathi, Chotu, Neko the cat, Rafhy
>   Bhai, Abu, Nashra Bhaji and Mumma, each a data entry in `data/npcs.ts` built
>   from a photo. The `Villager` rig grew the options they needed — builds
>   (child/youth/adult, slim/stocky), hair styles, tunic, skirt, scarf with border,
>   jacket with zip or hood, beanie, sunglasses (on or pushed up), glasses, beard,
>   bangles, watch, shirt prints, a phone-holding pose, and a head pivot so a
>   phone-holder looks down until spoken to. `Cat` is its own small model.
>   NPCs closer than 2×TALK_ARC form "nearest wins" zones, which is fine; closer
>   than TALK_ARC means standing beside one can open the other — keep them apart.
>
> **The rig convention** is the load-bearing idea in the character system: a
> model is any group facing -Z with feet at y=0, which may *optionally* name
> child groups `legL`/`legR`, `legFL`/`legFR`, `wingL`/`wingR`. `Player` animates
> whatever it finds and ignores the rest, so a biped, a quadruped and a
> wing-flapper all run through one animation path. Adding a fourth dinosaur is
> one model file plus one registry entry — no changes to `Player`.

### Phase 0 — Scaffold *(~30 min)*
`npm create vite@latest . -- --template react-ts`, add `three`,
`@react-three/fiber`, `@react-three/drei`, `zustand`, `@types/three`.
A `<Canvas>` filling the viewport, a lit sphere, `<OrbitControls>` to look
around. **Done when:** a planet renders and you can spin it with the mouse.

### Phase 1 — The character runs on the planet *(the hard phase)*
Write `math/sphere.ts`. Add `useInput`, `Player.tsx`, `FollowCamera.tsx`. Drop
`OrbitControls` from the play path. **Done when:** you can run a dino all the way
around the planet, over both poles, and the camera never flips or gimbals. *This
is the whole game's foundation — get it right before adding anything.*

### Phase 2 — Coins and score
Generate N coins on uniform random sphere points. Render with
`<Instances>` / `InstancedMesh` (one draw call). Spin them in `useFrame`.
Dot-product pickup test calls `store.collectCoin(id)`. Add `ui/Hud.tsx`.
**Done when:** running over a coin makes it vanish and the score ticks up.

### Phase 3 — NPCs and dialogue
`data/npcs.ts` with 2–3 NPCs. Proximity test sets `nearbyNpc`, HUD shows
"Press E to talk". `E` opens `DialogueBox`; subsequent presses advance
`lineIndex`; past the last line it closes. Freeze player input while dialogue is
open. **Done when:** you can walk up to an NPC, read three lines, and walk away.

**At the end of phase 3 the requested game exists.** Everything below is optional.

### Phase 4 — Feel
Jump (altitude offset + vertical velocity, clamped to the surface), acceleration
and friction instead of instant velocity, camera easing tuning, pickup pop
animation, idle bob.

### Phase 5 — Looks
Better planet material, trees and rocks scattered on the surface (reuse
`randomPointOnSphere`), a skybox via drei `<Environment>`, `<Text>` name labels
over NPCs, a title screen driven by `store.phase`.

### Phase 6 — Depth (pick as desired)
Sound (`use-sound`), a real `.glb` character with walk/idle animations (drops in
at the `Player.tsx` boundary), branching dialogue (upgrade `lines: string[]` to a
node graph), quests and collect-goals, `localStorage` high score, deploy to
GitHub Pages or Netlify.

## 8. Known risks

| Risk | Mitigation |
|---|---|
| Camera flipping at the poles | Set `camera.up` from the player's up vector every frame. The single most likely bug in this game. |
| Float drift breaking the orthonormal basis after long play | Re-normalize `pos` and re-orthogonalize `forward` every frame (§4). Cheap insurance. |
| Frame-rate-dependent movement speed | Every update multiplies by `delta` from `useFrame`; camera smoothing uses `1 - exp(-k*dt)`, not a raw `lerp` alpha. |
| React re-rendering per frame | The §5 split. If the HUD starts re-rendering at 60fps, something is subscribing to a per-frame value. |
| Coins clustering at the poles | Uniform sphere sampling, not naive (θ, φ). |
| Scope creep into physics/terrain | Phases 0–3 are the contract. Nothing in them requires a physics engine; adding one is a phase-6 decision, not a phase-1 dependency. |

## 9. Open questions (non-blocking — sensible defaults assumed)

1. **Is there a win condition,** or is this an open sandbox? Assumed sandbox;
   collect-all-N-coins is a one-hour addition once the phase-2 loop exists.
2. **Should NPCs move,** or are they stationary? Assumed stationary; wandering
   NPCs would reuse the exact same sphere-movement code as the player.
3. **Art direction** — flat-shaded low-poly (fast, forgiving, cohesive with
   primitives) vs. textured and realistic? Assumed low-poly.
4. **Does dialogue need to affect the world** (an NPC awards coins, unlocks
   something)? Assumed not — this is the trigger for upgrading dialogue from an
   array to a node graph with flags.
5. **Planet size** — `WORLD_RADIUS = 10` with a ~0.6-unit character makes the
   horizon curve visibly, which sells the spherical world. Larger reads flatter.
   Worth tuning by feel in phase 1.
