/**
 * The dawn-halftone city — pure data and pure math. No DOM, no React, no canvas.
 *
 * This replaces the sixteen extruded cubes of stages 0-6 with a single dot lattice
 * whose *dot size encodes building height*. The city is not geometry sitting on a
 * grid; the city IS the grid, read as halftone.
 *
 * Why this shape:
 *
 *  - **Scale is the depth cue, not glow.** On a near-white ground there is almost no
 *    headroom above the paper, so brightness cannot carry depth the way it does on a
 *    dark ground. Size can. Dots run DOT_MIN..DOT_MAX (a ~4x range) and alpha only
 *    supports them.
 *  - **The sun is directional, not a point.** A real dawn sun 150M km away casts
 *    *parallel* shadows. `SHADOW_DIR` is one precomputed unit vector, so a shadow
 *    costs a multiply-add per step and never a normalize.
 *  - **Streets are what make massing read as a city.** Continuous gaussian massing
 *    alone reads as hills. Quantising to `FLOORS` flat steps and then carving
 *    avenues through it is what turns it into architecture.
 *  - **Everything static is computed once, at module load.** Positions, base heights,
 *    density, warmth and colour bucket are all frozen typed arrays. The frame loop
 *    only ever adds the cursor's contribution on top.
 *
 * Plane space is shared with `heroScene.ts`: 0..PLANE_SIZE on both axes, +z toward
 * the viewer, projected by the same `makeCamera`/`project` pair.
 */

import { GRID_CELL, PLANE_SIZE, type Rgb } from "./heroScene";

/* ────────────────────────────── Lattice ────────────────────────────── */

/**
 * Lattice pitch in plane px. Half a grid cell, so the dot field and the old
 * 22x22 cell plane stay commensurate — every `GRID_CELL` boundary still lands
 * exactly on a lattice line, which is what lets avenues align with the cell grid.
 */
export const DOT_STEP = GRID_CELL / 2;

/** 60 dots per axis across the 1260px expanded plane at DOT_STEP=21. */
export const DOTS_PER_AXIS = Math.round(PLANE_SIZE / DOT_STEP);

/** 3,600 dots across the full expanded lattice. */
export const DOT_COUNT = DOTS_PER_AXIS * DOTS_PER_AXIS;

/**
 * Tallest building, in storeys.
 *
 * Heights are integers, not a continuous field, and that is load-bearing: a
 * building is drawn as a *stack* of `storeys` dots climbing +z, one per storey.
 *
 * The first prototype drew one dot per cell whose size encoded height, and it
 * failed its own review — it read as a halftone *map*, not a city. A dot has no
 * side faces, so a single mark can only ever show plan view. The visible shaft of
 * stacked dots is what turns the field into elevation, and it is also what makes a
 * district recognisable by silhouette from across the viewport.
 */
export const MAX_STOREYS = 9;

/** Vertical pitch between stacked storey dots, in plane px. */
export const STOREY_HEIGHT = 27;

/** Extrusion of a full-height building, in plane px, at full 3D. */
export const MAX_HEIGHT = MAX_STOREYS * STOREY_HEIGHT;

/**
 * Divisor on the plane-to-viewport fit. Below 1.0 the field is deliberately
 * **over**scaled so it bleeds off all four edges.
 *
 * The second prototype fitted the whole rotated plane inside the viewport, and it
 * read as a diamond-shaped patch of dots floating in the middle of the frame — an
 * object sitting on a page, not a place the page is looking at. A city has to run
 * past the frame to be a city. The visible cut at the edges is the point.
 */
export const VIEW_FIT = 0.95;

/**
 * Where the plane's centre sits vertically in the viewport, as a fraction of its
 * height.
 *
 * Not 0.5. A centred field puts the city's mass directly behind the headline and
 * gives the composition two competing centres; dropping it below the midpoint
 * turns the frame into a view *across* the city from slightly above it, with the
 * top of the frame free for type. It is the difference between an object photographed
 * on a table and a place seen from a hill.
 */
export const HORIZON = 0.6;

/**
 * Every Nth lattice line is an avenue, forced to ground level — so a city block is
 * `AVENUE_SPACING - 1` cells square.
 *
 * This is the single most powerful knob in the file, and it is a *composition*
 * control, not a detail one. At 7 the blocks were large enough to merge into one
 * another and downtown rendered as a solid navy dome; at 4 the same massing reads
 * as separated towers with sky between them. A skyline is mostly sky.
 */
export const AVENUE_SPACING = 4;

/* ────────────────────────────── The sun ────────────────────────────── */

/**
 * Direction a shadow travels, in plane space, as a unit vector.
 *
 * The camera rotates the plane -45deg about Z, so screen-X is proportional to
 * `(x + y)`: the plane's (0, 0) corner projects to the **left** of the screen and
 * (PLANE, PLANE) to the right. Pointing shadows along +(1,1)/sqrt(2) therefore sends
 * every one of them rightward across the screen, away from a sun sitting off the
 * left edge — which is the brief.
 */
export const SHADOW_DIR: { readonly x: number; readonly y: number } = {
  x: Math.SQRT1_2,
  y: Math.SQRT1_2,
};

/** Shadow length in plane px for a full-height building. ~1.4x its height: a low dawn sun. */
export const SHADOW_LENGTH = 270;

/** Dots shorter than this cast nothing — otherwise the ground is a smear. */
export const SHADOW_MIN_HEIGHT = 0.18;

/** Number of stepped dots a single cast shadow is drawn with. */
export const SHADOW_STEPS = 4;

/**
 * Position along the sun's axis, 0 at the screen-left corner of the plane and 1 at
 * the screen-right corner. This is exactly the axis `project()` maps to screen-X at
 * the isometric camera angle, so "warm on the left" is expressible without
 * projecting anything.
 */
export function sunAxis(x: number, y: number): number {
  return (x + y) / (2 * PLANE_SIZE);
}

/**
 * How far along `sunAxis` the sun's warmth reaches before the field goes fully
 * navy. Wide on purpose: at 0.66 the warm end of the ramp only touched the far
 * left corner and the whole visible city sat in the two coolest steps, so the
 * dawn was something happening *beside* the city rather than *to* it.
 */
export const SUN_REACH = 0.95;

/* ─────────────────────────── Dot size and colour ─────────────────────────── */

/** Radius of a ground-level dot, in plane px (scaled to screen by the camera). */
export const DOT_MIN = 1.4;
/** Radius of a full-height dot, in plane px. */
export const DOT_MAX = 6.2;

/** Radius for a normalised height. */
export function dotRadius(h: number): number {
  return DOT_MIN + clamp01(h) * (DOT_MAX - DOT_MIN);
}

/**
 * Five hand-authored steps along the dawn ramp, warmest first.
 *
 * NOT a mechanical lerp from gold to navy: gold (#FFC72C) is far lighter than navy
 * (#0A2A66), so an even sRGB blend collapses to mud in the middle and the warm end
 * disappears against the paper. Each step therefore carries its own `alphaScale`,
 * compensating luminance so all five read at comparable strength on `NOIR.void`.
 * The hues themselves stay strictly inside the brand's navy->gold accent ramp.
 */
export interface CityColour {
  readonly rgb: Rgb;
  /** Multiplier on the height-derived alpha, compensating this step's luminance. */
  readonly alphaScale: number;
}

export const CITY_RAMP: readonly CityColour[] = [
  { rgb: [214, 150, 40], alphaScale: 1.34 }, // 0 — sunstruck: gold darkened enough to hold on white
  { rgb: [176, 126, 58], alphaScale: 1.18 }, // 1 — amber
  { rgb: [120, 104, 92], alphaScale: 1.04 }, // 2 — the turn, warm neutral
  { rgb: [66, 84, 132], alphaScale: 0.96 }, // 3 — steel, the cool end of CHAPTER_ACCENTS
  { rgb: [10, 42, 102], alphaScale: 0.9 }, // 4 — NOIR.navyField: full dawn shadow
] as const;

/** Number of alpha tiers heights are quantised into for batching. */
export const ALPHA_TIERS = 6;

/** Alpha of a ground-level dot. Deliberately faint — this is atmosphere, not UI. */
export const ALPHA_MIN = 0.07;
/** Alpha of a full-height dot. Never near 1.0: opaque navy dots read as interface. */
export const ALPHA_MAX = 0.52;

/** Alpha a shadow step starts at, before its own per-step decay. */
export const SHADOW_ALPHA = 0.1;

/** Cast shadows are navy, never black — black on white is a palette violation. */
export const RGB_SHADOW_NAVY: Rgb = [10, 42, 102];

/* ────────────────────────────── Districts ────────────────────────────── */

/**
 * How a district's mass is distributed across its own footprint. This is where the
 * "city of SaaS" read comes from: a district is recognisable by its *silhouette*,
 * not by a glyph painted on a cube face. Glyphs die below ~40px; a skyline profile
 * survives at 320px wide, which is where the old service artifacts never worked.
 */
export type DistrictProfile =
  /** Domed, tallest at the centre — a downtown. */
  | "core"
  /** Flat-topped plateau — a slab. */
  | "block"
  /** A run of equal-height towers: a server rack, seen end-on. */
  | "rack"
  /** Monotonic step up along the district's local +u: a bar chart. */
  | "stair"
  /** Single-file line of towers: an ETL pipeline. */
  | "ridge";

export interface District {
  readonly name: string;
  /** Centre, in lattice coordinates (0..DOTS_PER_AXIS-1). */
  readonly cx: number;
  readonly cy: number;
  /** Half-extent, in lattice units. */
  readonly rx: number;
  readonly ry: number;
  /** Peak normalised height, 0..1. */
  readonly peak: number;
  readonly profile: DistrictProfile;
}

/**
 * The city plan. Deterministic and hand-placed — never random, so a screenshot
 * diff means someone changed the design rather than the seed.
 *
 * Lattice (0,0) projects to the screen-LEFT corner under the isometric camera and
 * (43,43) to the screen-right, so `downtown` sits slightly up-sun of centre: the
 * dawn rakes across its full depth, and its shadows fall into the open right half
 * rather than onto other buildings.
 *
 * **Downtown is at the centre, and that is deliberate.** The second prototype of
 * this table ringed the mass around an empty middle, which reproduced the exact
 * flaw this rebuild exists to fix — objects orbiting a hole. The centre is the
 * densest, tallest part of the city; in stage B the P mesa lands on top of it, so
 * the brand mark reads as downtown's tallest tower rather than as a logo pasted
 * over a scene.
 */
export const DISTRICTS: readonly District[] = [
  // The core. Broad and tall, straddling the centre of the plane.
  // Peaks stay below 1.0 across every district: the scale's ceiling is reserved
  // for the P mark (`heroLogoMask.ts`), so the brand is literally the skyline's
  // high point rather than one more block among equals.
  { name: "downtown", cx: 20, cy: 20, rx: 11.0, ry: 11.0, peak: 0.78, profile: "core" },
  { name: "downtown-spur", cx: 14, cy: 27, rx: 6.0, ry: 6.0, peak: 0.62, profile: "core" },

  // The four named service districts, recognisable by silhouette rather than glyph.
  { name: "racks", cx: 33, cy: 13, rx: 6.0, ry: 1.9, peak: 0.66, profile: "rack" },
  { name: "ledger", cx: 12, cy: 33, rx: 7.0, ry: 2.4, peak: 0.74, profile: "stair" },
  { name: "pipeline", cx: 30, cy: 32, rx: 9.0, ry: 1.3, peak: 0.5, profile: "ridge" },
  { name: "exchange", cx: 10, cy: 9, rx: 4.2, ry: 4.2, peak: 0.72, profile: "block" },

  // Mid-rise fabric filling the gaps, so the plan has no bald patches.
  { name: "midtown-n", cx: 28, cy: 7, rx: 6.0, ry: 5.0, peak: 0.5, profile: "block" },
  { name: "midtown-s", cx: 21, cy: 36, rx: 6.0, ry: 4.4, peak: 0.44, profile: "block" },
  { name: "wharf", cx: 4, cy: 20, rx: 5.0, ry: 7.0, peak: 0.42, profile: "block" },
  { name: "outskirts-e", cx: 39, cy: 25, rx: 7.0, ry: 7.5, peak: 0.34, profile: "core" },
  { name: "outskirts-nw", cx: 22, cy: 1, rx: 9.0, ry: 3.4, peak: 0.26, profile: "core" },
  { name: "outskirts-sw", cx: 2, cy: 38, rx: 5.5, ry: 6.0, peak: 0.26, profile: "core" },
] as const;

/** Clamp to [0, 1]. */
export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Standard smoothstep. */
export function smoothstep01(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/**
 * A district's contribution at lattice cell `(col, row)`, before quantisation.
 * Returns 0 outside the footprint for every profile, so `buildHeightField` can take
 * a plain max across districts without bounds bookkeeping.
 */
export function districtHeight(d: District, col: number, row: number): number {
  const u = (col - d.cx) / d.rx;
  const v = (row - d.cy) / d.ry;
  const t = Math.hypot(u, v);
  if (t >= 1) return 0;

  switch (d.profile) {
    case "core":
      // A sharp peak, not a broad dome. `(1-t)^2.2` concentrates the tall storeys
      // into a handful of central blocks and drops the rest to low fabric — the
      // height *contrast* is what reads as a skyline. A gentler falloff spreads
      // the mass evenly and renders as a carpet, which is what the fourth
      // prototype of this function did.
      return d.peak * Math.pow(1 - t, 1.5);
    case "block":
      // Plateau with a hard-ish shoulder, so the silhouette has a flat top.
      return d.peak * smoothstep01((1 - t) / 0.35);
    case "rack":
      // Every tower the same height across the run: a rack of identical units.
      // Only the ends taper, and only slightly.
      return d.peak * smoothstep01((1 - Math.abs(u)) / 0.2);
    case "stair":
      // Monotonic climb along +u — reads as a bar chart from any angle.
      return d.peak * (0.3 + 0.7 * clamp01((u + 1) / 2)) * smoothstep01((1 - Math.abs(v)) / 0.4);
    case "ridge":
      // One tower wide, many long: an ETL pipeline.
      return d.peak * smoothstep01(1 - Math.abs(v)) * smoothstep01((1 - Math.abs(u)) / 0.25);
    default:
      return 0;
  }
}

/**
 * Deterministic per-block height variation, in [-1, 1].
 *
 * A city block's height is a *decision*, not a sample of a smooth field. Massing
 * straight from `districtHeight` produces perfectly graded terraces that read as a
 * rendered function — the eye recognises the falloff curve and stops seeing
 * buildings. This breaks the grade at block granularity so neighbouring towers
 * disagree, which is what actual skylines look like.
 *
 * A fixed integer hash, not `Math.random`: the plan must be byte-identical on every
 * load, so a screenshot diff means the design changed and never that the seed did.
 * Whole blocks share a value, so a block is one building, not a noise field.
 */
export function blockJitter(col: number, row: number): number {
  const bc = Math.floor(col / AVENUE_SPACING);
  const br = Math.floor(row / AVENUE_SPACING);
  let hash = (bc * 73_856_093) ^ (br * 19_349_663);
  hash = Math.imul(hash ^ (hash >>> 13), 1_274_126_177);
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return (hash / 0xffff_ffff) * 2 - 1;
}

/** How much of a district's peak `blockJitter` is allowed to move a block. */
export const JITTER_AMOUNT = 0.34;

/** True when a lattice cell sits on an avenue, i.e. at ground level by definition. */
export function isAvenue(col: number, row: number): boolean {
  return col % AVENUE_SPACING === 0 || row % AVENUE_SPACING === 0;
}

/** Snap a normalised massing value to a whole number of storeys, 0..MAX_STOREYS. */
export function quantizeStoreys(h: number): number {
  if (h <= 0) return 0;
  return Math.ceil(clamp01(h) * MAX_STOREYS);
}

/* ─────────────────────────── The frozen field ─────────────────────────── */

/** Plane-space x of each lattice dot. */
export const DOT_X = new Float32Array(DOT_COUNT);
/** Plane-space y of each lattice dot. */
export const DOT_Y = new Float32Array(DOT_COUNT);
/** Resting height in whole storeys, 0..MAX_STOREYS, after districts + avenues. */
export const DOT_STOREYS = new Uint8Array(DOT_COUNT);
/** The same height normalised to 0..1, for colour, alpha and shadow-length math. */
export const DOT_HEIGHT = new Float32Array(DOT_COUNT);
/**
 * How present a dot is, 0..1 — a static mask, not an animation. Thins the field
 * toward the sunless side and the plane's edges so it never reads as graph paper,
 * and so the composition has no visible rectangular boundary.
 */
export const DOT_DENSITY = new Float32Array(DOT_COUNT);
/** Warmth 0..1: 1 sunstruck, 0 full dawn shadow. */
export const DOT_WARMTH = new Float32Array(DOT_COUNT);
/** Index into `CITY_RAMP`, derived from warmth once. */
export const DOT_COLOUR = new Uint8Array(DOT_COUNT);

function buildField(): void {
  for (let row = 0; row < DOTS_PER_AXIS; row++) {
    for (let col = 0; col < DOTS_PER_AXIS; col++) {
      const i = row * DOTS_PER_AXIS + col;
      const x = col * DOT_STEP + DOT_STEP / 2;
      const y = row * DOT_STEP + DOT_STEP / 2;
      DOT_X[i] = x;
      DOT_Y[i] = y;

      let h = 0;
      for (let d = 0; d < DISTRICTS.length; d++) {
        const contribution = districtHeight(DISTRICTS[d]!, col, row);
        if (contribution > h) h = contribution;
      }
      // Jitter scales with the massing, so it varies the skyline where there IS
      // one and never sprouts a tower out of open ground.
      const jittered = h > 0 ? h * (1 + blockJitter(col, row) * JITTER_AMOUNT) : 0;
      const storeys = isAvenue(col, row) ? 0 : quantizeStoreys(jittered);
      DOT_STOREYS[i] = storeys;
      DOT_HEIGHT[i] = storeys / MAX_STOREYS;

      // Warmth runs along the sun's axis, not radially — the light is directional.
      const axis = sunAxis(x, y);
      const warmth = 1 - smoothstep01(axis / SUN_REACH);
      DOT_WARMTH[i] = warmth;
      DOT_COLOUR[i] = Math.min(
        CITY_RAMP.length - 1,
        Math.floor((1 - warmth) * CITY_RAMP.length),
      );

      // Density thins the field down-sun, where the composition wants white.
      //
      // There is deliberately NO margin fade. An earlier pass faded the outer
      // cells to nothing, and the result read as fog — which is the one thing the
      // brief rules out by name. The field now runs off all four edges at full
      // strength (`VIEW_FIT` overscales it past the viewport), so the boundary is
      // a *cut*, not a dissolve. Only the last cell gets a token step-down, to
      // keep the diamond from looking sawn off once the scene flattens.
      const edge = Math.min(col, row, DOTS_PER_AXIS - 1 - col, DOTS_PER_AXIS - 1 - row);
      const margin = edge <= 0 ? 0.55 : 1;
      const alongSun = 1 - 0.4 * smoothstep01(axis);
      // A built cell always survives the mask — thinning must never punch holes
      // in a building, only in the open ground between them.
      DOT_DENSITY[i] = clamp01(Math.max(storeys > 0 ? 0.9 : 0, margin * alongSun));
    }
  }
}

buildField();

/**
 * Alpha of a dot at normalised height `h`, before its colour step's `alphaScale`.
 * Quantised into `ALPHA_TIERS` steps so the renderer can batch by (colour, tier)
 * and change `fillStyle` a few dozen times per frame instead of ~2,000.
 */
export function alphaTier(h: number): number {
  return Math.min(ALPHA_TIERS - 1, Math.floor(clamp01(h) * ALPHA_TIERS));
}

/** Resolved alpha for a tier index. */
export function tierAlpha(tier: number): number {
  const t = ALPHA_TIERS <= 1 ? 0 : tier / (ALPHA_TIERS - 1);
  return ALPHA_MIN + t * (ALPHA_MAX - ALPHA_MIN);
}

/** Total number of (colour, tier) batches. */
export const BATCH_COUNT = CITY_RAMP.length * ALPHA_TIERS;

/** Batch slot for a colour step and alpha tier. */
export function batchIndex(colour: number, tier: number): number {
  return colour * ALPHA_TIERS + tier;
}

/* ─────────────────────────── Bounded cursor query ─────────────────────────── */

/**
 * Inclusive lattice index bounds of the axis-aligned square of side `2 * radius`
 * centred on plane point `(px, py)`, clamped to the lattice.
 *
 * This is why the cursor costs ~400 dots and not 1,936, with no quadtree and no
 * spatial hash: those structures exist to answer particle-to-particle queries over
 * moving points. Here there is exactly one query point against a *static, regularly
 * spaced* lattice, so the candidate range is arithmetic, not a search.
 *
 * Writes into `out` (length >= 4) as `[col0, col1, row0, row1]` to stay
 * allocation-free in the frame path. Returns `false` when the query misses the
 * lattice entirely, in which case `out` is not meaningful.
 */
export function latticeIndexRect(px: number, py: number, radius: number, out: Int32Array): boolean {
  const col0 = Math.ceil((px - radius - DOT_STEP / 2) / DOT_STEP);
  const col1 = Math.floor((px + radius - DOT_STEP / 2) / DOT_STEP);
  const row0 = Math.ceil((py - radius - DOT_STEP / 2) / DOT_STEP);
  const row1 = Math.floor((py + radius - DOT_STEP / 2) / DOT_STEP);
  const c0 = Math.max(0, col0);
  const c1 = Math.min(DOTS_PER_AXIS - 1, col1);
  const r0 = Math.max(0, row0);
  const r1 = Math.min(DOTS_PER_AXIS - 1, row1);
  if (c0 > c1 || r0 > r1) return false;
  out[0] = c0;
  out[1] = c1;
  out[2] = r0;
  out[3] = r1;
  return true;
}
