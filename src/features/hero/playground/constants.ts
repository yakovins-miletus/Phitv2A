/**
 * The shared spatial system every playground scene stands inside.
 *
 * This is the single most important file in the package. Without it the four tabs
 * read as four unrelated `three.js` demos instead of four designs of the same room:
 * one camera, one floor, one fog, one sense of scale, one palette. A scene adds its
 * own objects and its own key light; it does not redefine the room — see
 * `PlaygroundCanvas.tsx`'s `SharedStage`, which is the only place `CAMERA`, `FOG`,
 * `GROUND_Y` and `WORLD_EXTENT` are consumed to actually build geometry.
 *
 * NO RAW HEX HERE. `no-restricted-syntax` (eslint.config.js) bans hex literals
 * outside `src/shared/theme/palette.ts`; `PALETTE` below derives every colour from
 * `NOIR` and `RGB_STEEL` rather than retyping a value.
 */

import * as THREE from "three";
import { DAWN, NOIR, SKY, TWILIGHT } from "@/shared/theme/palette";
import { RGB_STEEL, type Rgb } from "../heroScene";

/**
 * The floor altitude. Every scene's ground-level objects sit at `y = GROUND_Y`;
 * anything lifted off it (a column, a swarm particle, the Monolith's glass) is
 * authored as a positive offset from this one number, and anything carved below it
 * (Depth's canyon) is a negative offset from the same number. Zero, not some
 * arbitrary negative, because there is no second surface above it that would make an
 * offset origin useful — the ground plane in `SharedStage` is not a table, it is the
 * scene's floor.
 */
export const GROUND_Y = 0;

/**
 * Half-size of the ground plane, in world units, that `usePointerPlane` clamps
 * pointer and click coordinates into. This is the number that makes "the pointer is
 * near the left edge" mean the same thing in all four scenes — without a shared
 * extent, a scene authored at a tighter or looser scale would see the cursor pinned
 * to its wall (or never reaching one) while its neighbour reads normally.
 */
export const WORLD_EXTENT = 6;

/** `WORLD_EXTENT * 2` — the ground plane's edge length. Exported so a scene's own
 *  floor decoration (Monolith's dot floor, Lattice's avenues) can size itself to
 *  cover exactly the plane `SharedStage` draws, with no separate constant to drift
 *  out of sync. */
export const GROUND_SIZE = WORLD_EXTENT * 2;

/**
 * One camera for all four scenes. Fixed — no orbit controls, no per-scene fov —
 * because the whole point of a shared camera is that a visitor's sense of "how big
 * is this thing" carries across a tab switch. `position`/`target` were chosen so the
 * camera looks down at roughly 24° (`atan((position.y - target.y) / |position.z -
 * target.z|)`), enough to read the ground plane as a floor rather than a wall,
 * shallow enough that a tall form (Monolith's extruded P, Lattice's columns) still
 * reads as standing rather than as viewed from above.
 *
 * `usePointerPlane` builds a second `THREE.PerspectiveCamera` from these exact
 * numbers (not the live R3F camera) so pointer→ground unprojection can run outside
 * the Canvas entirely — see that file's module comment.
 */
export const CAMERA = {
  fov: 35,
  near: 0.1,
  far: 60,
  position: [0, 5.5, 11] as const,
  target: [0, 0.6, GROUND_Y] as const,
} as const;

/**
 * The shape a rig has, structurally rather than as `typeof CAMERA`.
 *
 * `CAMERA` is `as const`, so its inferred type is the literal `fov: 35` — which
 * makes it a type only `CAMERA` itself inhabits, and any second rig a type
 * error. Consumers want "a camera description", so that is what this says.
 */
export interface CameraRig {
  readonly fov: number;
  readonly near: number;
  readonly far: number;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

/**
 * The second rig: standing in the air, not over a floor.
 *
 * `CAMERA` above is a 24° look-**down** at a ground plane, and that is not a
 * detail — it is why the sky in this room is a strip about 7° tall (see
 * `SkyDome`'s `SKY_LOW`/`SKY_HIGH` derivation). Every visible pixel of sky
 * there is dome seen past the far edge of the floor, because the true horizon
 * sits above the top of the frame.
 *
 * Monolith is no longer a scene with a floor. It is a mark suspended over a
 * cloud deck, and the reference it is cut against is roughly three quarters
 * sky — so this rig exists and the tab opts into it (`variants.ts`). The other
 * three designs keep `CAMERA` untouched: they were composed against that
 * downward look and a shared camera that moved under them would recompose all
 * three by accident.
 *
 * Three numbers do all the work, and each is a consequence of the one before:
 *
 *  1. **The eye sits BELOW the mark's base.** This is the whole composition. An
 *     infinite horizontal plane's horizon always projects to the camera's own
 *     level line no matter how far below the plane is — so lowering the deck
 *     buys no sky, and the *only* way to get air underneath the mark is to put
 *     the eye under it. At y 1.2 against a base at `MARK_LIFT` 1.5, the mark
 *     clears the horizon by ~1.6° and there is open sky beneath it.
 *  2. **The axis tilts UP by ~7.6°** (`atan(1.4 / 10.5)`). That drops the
 *     horizon to 30% of the frame height: sky above, deck below, which is the
 *     reference's proportion. `SkyDome` reads the ramp bounds off this rather
 *     than off a hard-coded strip, so its five stops land across the sky that
 *     is actually on screen.
 *  3. **`far` is long and `near` is not 0.1.** The deck runs to `DECK_HALF`
 *     and its aerial fade has to finish inside the frustum or the plane ends on
 *     a straight line, which is the one thing no horizon does. 0.1/150 is a
 *     1500:1 depth range and it banded the glass; nothing here is closer than
 *     ~5 units, so 0.5 costs nothing and buys back the precision.
 */
export const CAMERA_ALTITUDE = {
  fov: 40,
  near: 0.5,
  far: 150,
  position: [0, 1.2, 10.5] as const,
  target: [0, 2.6, 0] as const,
} as const;

/**
 * Right-biased altitude rig: shifts the camera target to the left (x = -2.2)
 * so the 3D Monolith mark renders in the right third of the frame, clearing
 * space on the left for the brand lockup and motto.
 */
export const CAMERA_ALTITUDE_RIGHT = {
  fov: 40,
  near: 0.5,
  far: 150,
  position: [0, 1.2, 10.5] as const,
  target: [-2.2, 2.6, 0] as const,
} as const;

/** The rigs, by the name a variant asks for them under. */
export const CAMERAS: Record<"room" | "altitude" | "altitudeRight", CameraRig> = {
  room: CAMERA,
  altitude: CAMERA_ALTITUDE,
  altitudeRight: CAMERA_ALTITUDE_RIGHT,
};

export type CameraRigId = keyof typeof CAMERAS;

/* ── The cloud deck ─────────────────────────────────────────────────────────── */

/**
 * The deck's altitude, and how far it runs.
 *
 * `DECK_Y` is 1.5 units under the eye and 1.8 under the mark's base — close
 * enough that the deck reads as *below the mark* rather than as a distant floor,
 * far enough that there is unmistakable air in between. The nearest cloud the
 * frame can see lands around z 3.6, in front of the mark, so the deck has
 * something at foreground scale and does not read as a flat backdrop.
 *
 * `DECK_HALF` is huge compared to `WORLD_EXTENT` because this surface is not a
 * floor anyone stands on — it only has to outlast its own aerial fade
 * (`DECK_FADE_END`), which is what makes a finite plane read as an infinite
 * deck. Beyond that distance every pixel of it is already exactly the sky's
 * horizon colour, so where the geometry actually stops is invisible.
 */
export const DECK_Y = -0.3;
export const DECK_HALF = 120;
/**
 * Where the deck starts dissolving into the sky, and where it has finished.
 * Both in world units from the camera, and both well inside `CAMERA_ALTITUDE.far`.
 *
 * These came out from 22/62, which faded the deck almost as soon as it appeared.
 * The eye is only 1.5 units above the surface, so the *nearest* visible cloud is
 * already ~7 units away and everything past ~35 is squeezed into the last few
 * degrees before the horizon by foreshortening. A fade that began at 22 was
 * therefore eating the band where the billows are actually legible, and what
 * reached the screen was a thin strip of horizon colour. 34 → 95 leaves the
 * readable near deck intact and still finishes well inside the frustum.
 */
export const DECK_FADE_START = 34;
export const DECK_FADE_END = 95;

/**
 * Fog colour + distance. Colour is `NOIR.navyInk` — the same dark ground the card
 * flips to behind the toggle (see `SuperHeroSequence.tsx`'s `data-playground`
 * selectors) — so the canvas and the DOM chrome around it read as one room rather
 * than a bright card with a dark window cut into it.
 */
export const FOG = {
  color: NOIR.navyInk,
  near: 14,
  far: 32,
} as const;

/** The ease-out settle a scene runs through when it becomes the active tab. Read by
 *  `PlaygroundCanvas`'s `SettleDriver`, written into `settleRef`, consumed by scenes
 *  however they like (a fade-in, a fly-in, a shutter). */
export const ENTRANCE_MS = 600;

function colorFromHex(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function colorFromRgb([r, g, b]: Rgb): THREE.Color {
  return new THREE.Color(r / 255, g / 255, b / 255);
}

/**
 * `three.js` `Color` instances, derived once at module load — never re-parsed per
 * frame — from the four tokens the handover named plus the scene's existing cool
 * accent (`RGB_STEEL`, already used by the 2D hero for the same "structural, not
 * brand-primary" role). Every scene imports colour from here, not from `NOIR`
 * directly: `NOIR` exports hex strings, which is exactly the raw-hex shape the lint
 * rule polices, and routing every scene through `PALETTE` keeps that ban meaningful
 * for `.tsx` scene files instead of pushing them to `new THREE.Color(NOIR.gold)`
 * (legal, but nineteen copies of the same conversion instead of one).
 */
export const PALETTE = {
  navyInk: colorFromHex(NOIR.navyInk),
  navyField: colorFromHex(NOIR.navyField),
  gold: colorFromHex(NOIR.gold),
  /** The paler gold. Emissive surfaces use it rather than `gold`: emission adds
   *  on top of the diffuse, so emitting the same saturated value the surface
   *  already is clips the red channel and turns brand gold orange. */
  goldLight: colorFromHex(NOIR.goldLight),
  frost: colorFromHex(NOIR.frost),
  steel: colorFromRgb(RGB_STEEL),

  /* ── The day cycle's grounds and skies ──────────────────────────────────
   * `dayCycle.ts` ramps between these; nothing else consumes them. The two
   * extra navies are the ones between `navyInk` (midnight) and the first warm
   * stop, and the five `dawn*` entries are `DAWN`'s own ramp — the same eight
   * stops the 2D hero's CSS sky is built from, so the two heroes agree about
   * what dawn looks like rather than each inventing it.
   *
   * `DAWN` and not new values, for the reason its docblock gives: those stops
   * are already hue-walked from our steel to our gold, already measured for
   * contrast against the motto that sits over them, and already the only
   * sanctioned warm ramp in the brand. */
  navyDeep: colorFromHex(NOIR.navyDeep),
  navyPanel: colorFromHex(NOIR.navyPanel),
  dawnZenith: colorFromHex(DAWN.zenith),
  dawnUpper: colorFromHex(DAWN.upper),
  dawnMid: colorFromHex(DAWN.mid),
  dawnHaze: colorFromHex(DAWN.haze),
  dawnWarm: colorFromHex(DAWN.warm),
  dawnEmber: colorFromHex(DAWN.ember),

  /* The two cloud tokens `DAWN` has carried unused since stage 4, which named
   * them for exactly this: a cream body and a cool shadowed underside. A cloud
   * is only convincing when its lit face and its shadow are different *hues*
   * rather than two brightnesses of one — sunlit vapour goes warm and its own
   * shadow goes blue, because the shadow is lit by the sky instead of the sun. */
  cloudBody: colorFromHex(DAWN.cloudMid),
  cloudShadow: colorFromHex(DAWN.cloudLo),

  /* ── The atmosphere ─────────────────────────────────────────────────────
   * `SKY`'s hue arc and deck values, one `THREE.Color` each. These are what
   * `SkyDome`'s five-stop ramp and `CloudSea`'s three-value shading are built
   * from; `dayCycle.ts` is the only consumer, exactly as with the `dawn*`
   * block above. See `SKY`'s docblock for why the arc goes *around* through
   * violet and rose rather than straight from blue to cream — the short
   * version is that the straight walk is what made the old sky read as one
   * flat wash with a warm smear at the bottom. */
  skyDeepBlue: colorFromHex(SKY.deepBlue),
  skyPeriwinkle: colorFromHex(SKY.periwinkle),
  skyViolet: colorFromHex(SKY.violet),
  skyMauve: colorFromHex(SKY.mauve),
  skyRose: colorFromHex(SKY.rose),
  skyBlush: colorFromHex(SKY.blush),
  skyPeach: colorFromHex(SKY.peach),
  skyCream: colorFromHex(SKY.cream),
  sunCore: colorFromHex(SKY.sunCore),

  deckLit: colorFromHex(SKY.cloudLit),
  deckMauve: colorFromHex(SKY.cloudMauve),
  deckDeep: colorFromHex(SKY.cloudDeep),

  nightZenith: colorFromHex(SKY.nightZenith),
  nightUpper: colorFromHex(SKY.nightUpper),
  nightMid: colorFromHex(SKY.nightMid),
  nightLower: colorFromHex(SKY.nightLower),
  nightHorizon: colorFromHex(SKY.nightHorizon),
  nightDeckLit: colorFromHex(SKY.nightCloudLit),
  nightDeckMauve: colorFromHex(SKY.nightCloudMauve),
  nightDeckDeep: colorFromHex(SKY.nightCloudDeep),

  /* ── The room's one authored look ───────────────────────────────────────
   * `dayCycle.ts` is the only consumer. See `TWILIGHT`'s own docblock in
   * `palette.ts` for the colour budget these seven stops exist to hold
   * (~60% white, ~20% soft warm, ~10% soft blue-violet, ~10% blends). */
  twilightWhite: colorFromHex(TWILIGHT.white),
  twilightPaper: colorFromHex(TWILIGHT.paper),
  twilightWarm: colorFromHex(TWILIGHT.warm),
  twilightEmber: colorFromHex(TWILIGHT.ember),
  twilightCool: colorFromHex(TWILIGHT.cool),
  twilightBlendCool: colorFromHex(TWILIGHT.blendCool),
  twilightBlendWarm: colorFromHex(TWILIGHT.blendWarm),
} as const;

/* ── Base lighting rig ──────────────────────────────────────────────────────────
 * The "room" light — present in every scene, cheap, and never the thing that gives
 * a scene its character. A scene's own key light (Monolith's cursor-driven light,
 * Lattice's second light) is additive on top of this, per this file's module
 * comment. Intensities are low on purpose: with fog this dark and a scene's own key
 * light doing the work of definition, a bright ambient term would flatten every
 * scene's contrast before it starts. */

/** Uniform fill so nothing is ever pure silhouette before a scene's own light acts,
 *  and so `frameloop="never"`'s single resting frame is never just black shapes. */
export const AMBIENT_INTENSITY = 0.32;

/** One soft directional fill standing in for bounced light off a room the scenes
 *  don't otherwise have walls for. Frost-coloured, not white: keeps the rig inside
 *  the brand palette rather than introducing a bare white light source. */
export const ROOM_LIGHT_INTENSITY = 0.55;
export const ROOM_LIGHT_POSITION: readonly [number, number, number] = [-5, 8, 6];

/* ── Where the visible sky actually is ──────────────────────────────────────
 *
 * The band worth painting is NOT always "above the horizon", and which of the
 * two cases applies is a property of the rig, not of the sky. Both live here.
 *
 * **A rig that looks down at a floor never sees its horizon.** `CAMERA` sits at
 * y 5.5 / z 11 looking down at y 0.6 — a 24° depression against a 17.5°
 * half-fov, so the *top* edge of the frame is still 6.5° below horizontal.
 * Every pixel of sky it shows is dome seen past the far edge of the ground
 * plane, in a strip perhaps 7° tall. The first pass missed this and ran the
 * ramp over the range a level camera would see; the whole visible strip fell
 * inside the first stop, so every colour resolved to one — a carefully authored
 * gradient that rendered as a flat wash, which is exactly what it was written
 * to fix.
 *
 * **A rig that looks up sees the real thing.** `CAMERA_ALTITUDE` tilts up ~7.6°
 * and the horizon lands at 30% of the frame height, so the strip trick is not
 * merely unnecessary there, it is wrong: it would cram five stops into the top
 * sliver and leave the two thirds of sky below it flat. That case anchors the
 * ramp at `dir.y = 0` — the horizon itself — and runs it to the top of frame.
 *
 * Derived from the rig either way, never typed as numbers, so moving a camera
 * moves the gradient with it.
 */
const DEG = Math.PI / 180;

export interface SkyBounds {
  low: number;
  high: number;
}

/**
 * The `dir.y` range the ramp spans, for a given rig.
 *
 * Exported and pure so the two cases can be asserted without a WebGL context —
 * the failure mode this guards against (a ramp whose whole range is outside the
 * frame) is invisible in code review and obvious in a unit test.
 */
export function skyBounds(rig: CameraRig): SkyBounds {
  // Signed: positive when the axis points down at the target, negative up.
  const pitch = Math.atan2(rig.position[1] - rig.target[1], rig.position[2] - rig.target[2]);
  /** `dir.y` at the top edge of the frame. Negative for a downward rig — which
   *  is the whole reason this function exists rather than a constant. */
  const frameTop = -Math.sin(pitch - (rig.fov / 2) * DEG);

  if (frameTop <= 0) {
    // Looking down: the strip past the floor's far edge is all there is.
    const floorEdge = -Math.sin(Math.atan2(rig.position[1], GROUND_SIZE + rig.position[2]));
    // A little slack at each end so the ramp's extremes are reachable inside
    // the strip rather than only at its exact boundaries.
    return { low: floorEdge - 0.015, high: frameTop + 0.02 };
  }

  // Looking up: anchor on the horizon, and give the top a little headroom so
  // the zenith stop is a colour the frame reaches rather than one it approaches.
  return { low: 0, high: frameTop * 1.04 };
}
