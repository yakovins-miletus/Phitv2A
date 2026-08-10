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
import { NOIR } from "@/shared/theme/palette";
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
  frost: colorFromHex(NOIR.frost),
  steel: colorFromRgb(RGB_STEEL),
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
