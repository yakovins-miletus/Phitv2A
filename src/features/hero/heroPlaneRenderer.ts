/**
 * Canvas painter for the quiet void plane — the dawn-halftone city's replacement.
 *
 * The city (`heroCityRenderer.ts`, deleted alongside this file's introduction) built
 * a 1,936-cell skyline out of the same lattice this file also draws from. That was
 * the wrong subject: the brief for this hero is "headline first, mark second," and a
 * twelve-district downtown with signal pulses and service nodes competed with both.
 * What is left once the skyline is gone is honest about what it is — three layers,
 * back to front:
 *
 *   1. streets   — `drawStreets`, ported byte-for-byte from the city renderer. A
 *                   uniform dot field has no perspective cue of its own; see the
 *                   docstring on the function itself, and `docs/hero-upgrade/
 *                   dawn-halftone.md`, for why removing this once was a mistake.
 *   2. dot field — a sparse (stride-2) lattice sample that sits flat at rest and
 *                   only the cursor's "second light" (heroPointer.ts) lifts. Texture,
 *                   not skyline: no baked height, no colour ramp, one quiet colour.
 *   3. the mark  — the flat 3D P, recovered from the pre-lattice renderer
 *                   (`git show a9850f3:src/features/hero/heroCanvasRenderer.ts`).
 *                   A real extruded raster in the scene plane, casting a real ground
 *                   shadow along the same sun every other shadow in the scene uses,
 *                   and — the whole point of recovering it — positioned off
 *                   `state.moveLeft`, so the P → P PHITOPOLIS move that
 *                   `heroPhases.moveLeftProgress` still computes has something to
 *                   move again.
 *
 * Same contract as the city renderer it replaces (`drawCityFrame` → `drawPlaneFrame`,
 * `CityInteraction` → `PlaneInteraction`), so `HeroCanvas.tsx` swaps one import and
 * one call. Zero React renders on scroll, zero per-frame allocation, and — per the
 * hero's one hard rule — a pure function of `state` at `elapsed = 0`, because
 * `paintStill()` calls this under reduced motion and low power with exactly that.
 */

import {
  PERSPECTIVE,
  CUBE_POSITIONS,
  GRID_CELL,
  PLANE_SIZE,
  RGB_FROST,
  RGB_GOLD,
  RGB_NAVY,
  RGB_SHADOW,
  SERVICE_NODES,
  SERVICE_NODE_SIZE,
  SIGNAL_LOOPS,
  SIGNAL_SAMPLES,
  SIGNAL_SPEED_PX_PER_MS,
  SIGNAL_TAIL_PX,
  makeCamera,
  pointAtLoopDistance,
  project,
  type Camera,
  type CubeSpec,
  type HeroFrameState,
  type NodeIcon,
  type Rgb,
  type ServiceNodeSpec,
} from "./heroScene";
import {
  AVENUE_SPACING,
  DOTS_PER_AXIS,
  DOT_DENSITY,
  DOT_STEP,
  DOT_X,
  DOT_Y,
  RGB_SHADOW_NAVY,
  SHADOW_DIR,
  latticeIndexRect,
} from "./heroCity";
import {
  CURSOR_RADIUS,
  HOVER_LERP,
  cursorFalloff,
  easeToward,
  rippleCrest,
  skylineStretch,
} from "./heroPointer";
import { getLogoAspect, getLogoImage } from "./heroLogoMask";

const TAU = Math.PI * 2;

function rgba(c: Rgb, a: number): string {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
}

/** How the pointer influences the frame. Byte-identical shape to the old
 *  `CityInteraction` — `HeroCanvas.tsx`'s interaction object needs no field changes,
 *  only its type annotation does. */
export interface PlaneInteraction {
  /** Camera tilt, already scaled by `interactStrength`. */
  tiltX: number;
  tiltY: number;
  /** Whether a fine pointer is currently over the canvas at all. */
  pointerActive: boolean;
  /** The cursor light's position, in plane coordinates. */
  lightX: number;
  lightY: number;
  /** `interactStrength(progress)` — the continuous fade-out across the scroll. */
  strength: number;
  /** Smoothed, normalised pointer speed, 0..1. */
  velocity: number;
  /** Origin of the live click ripple, in plane coordinates. */
  rippleX: number;
  rippleY: number;
  /** Milliseconds since the click, or a negative number when no ripple is live. */
  rippleAge: number;
}

/* ═══════════════════════════════ (a) Streets ═══════════════════════════════ */

/** Alpha of a street hairline at the centre of the plane, before the edge fade thins
 *  it. Identical to the city's. */
const STREET_ALPHA = 0.095;

/**
 * Pieces each avenue is cut into, per axis, so the edge fade can vary *along* a line.
 *
 * A stroked line takes one `strokeStyle`, so a line drawn whole can only have one alpha
 * — which is why the ported version stopped dead at the lattice bounds and put a visible
 * rectangular boundary around the plane the moment the camera flattened enough to show
 * its far corners. Cutting each line into pieces is what buys a per-position alpha
 * without a mask composite or a blur layer (README standing rule 5).
 *
 * 10 is where the ramp stops being visible as steps: with `GRID_FADE_TIERS` at 6, a
 * coarser cut lands two adjacent pieces in non-adjacent tiers near the rim.
 */
const GRID_SEGMENTS = 10;

/** Alpha tiers the grid batches into — the same six-step granularity, and the same
 *  counting-sort batching, the dot field uses (`FIELD_ALPHA_TIERS`). Six strokes for
 *  the whole grid, however many pieces it is cut into. */
const GRID_FADE_TIERS = 6;

/* ── The edge fade ─────────────────────────────────────────────────────────────
 * Transcribed from the pre-lattice renderer's `buildGridSprite()`
 * (`git show a9850f3:src/features/hero/heroCanvasRenderer.ts:104-113`), which baked this
 * curve into a `destination-in` radial mask "so the field dissolves at its edges,
 * matching the old mask-image" — three stops on a radial gradient from `0.30 * PLANE_SIZE`
 * to `0.52 * PLANE_SIZE`: opaque, 0.4 at 70 % of the way out, gone at the rim. That sprite
 * was built and then never blitted (`drawGrid` path-drew the grid and ignored the sprite
 * it was handed), so the fade has never once been on screen. The curve is the design; this
 * is the first implementation of it that draws.
 *
 * Kept in absolute plane px rather than normalised, because that is how the gradient
 * stated it and the two are not interchangeable: the outer radius is `0.52 * PLANE_SIZE`,
 * which is slightly *outside* the plane's own half-span, so the fade finishes just past
 * the mid-edges and only the four corners drop out entirely. Normalising it to the
 * half-span instead — the obvious-looking simplification — pulls the whole ramp inward and
 * visibly shrinks the floor.
 *
 * Deliberately *not* `DOT_DENSITY` from `heroCity.ts`: that mask carries the deleted city's
 * district massing and a sun bias, so it thins the field unevenly rather than radially. */

const GRID_FADE_INNER_R = PLANE_SIZE * 0.3;
const GRID_FADE_OUTER_R = PLANE_SIZE * 0.52;
/** The gradient's middle stop: alpha at 70 % of the way from inner to outer radius. */
const GRID_FADE_MID_STOP = 0.7;
const GRID_FADE_MID_ALPHA = 0.4;

/** Falloff, 0..1, at distance `r` (plane px) from the plane's centre. */
function gridFalloff(r: number): number {
  if (r <= GRID_FADE_INNER_R) return 1;
  if (r >= GRID_FADE_OUTER_R) return 0;
  const t = (r - GRID_FADE_INNER_R) / (GRID_FADE_OUTER_R - GRID_FADE_INNER_R);
  // Two linear reaches between the mask's three stops, matching it stop for stop.
  if (t <= GRID_FADE_MID_STOP) {
    return 1 - (t / GRID_FADE_MID_STOP) * (1 - GRID_FADE_MID_ALPHA);
  }
  return GRID_FADE_MID_ALPHA * (1 - (t - GRID_FADE_MID_STOP) / (1 - GRID_FADE_MID_STOP));
}

/* ── The avenues, precomputed ──────────────────────────────────────────────────
 * The lattice is frozen (README standing rule 2's spirit: derive, never re-derive per
 * frame), so every piece's plane-space endpoints and its fade tier are constants. Only
 * the projection depends on the camera, so only the projection happens per frame. */

/**
 * Lattice steps between avenues — the grid's pitch, and the one knob that changes how
 * fine the floor reads.
 *
 * `AVENUE_SPACING` (4) gives 11 lines per axis, which is what the city drew and what
 * ships. Halving it to 2 gives 22 and lands on the pre-lattice renderer's own
 * `GRID_CELL`-pitch grid. Named rather than inlined because the two are a look-and-pick,
 * not a correctness question.
 */
const GRID_LINE_STRIDE = AVENUE_SPACING;

const GRID_LINES_PER_AXIS = Math.ceil(DOTS_PER_AXIS / GRID_LINE_STRIDE);
const GRID_SEG_COUNT = GRID_LINES_PER_AXIS * 2 * GRID_SEGMENTS;

const GRID_SEG_X0 = new Float32Array(GRID_SEG_COUNT);
const GRID_SEG_Y0 = new Float32Array(GRID_SEG_COUNT);
const GRID_SEG_X1 = new Float32Array(GRID_SEG_COUNT);
const GRID_SEG_Y1 = new Float32Array(GRID_SEG_COUNT);
/** Fade tier per piece, from `gridFalloff` at the piece's own midpoint. */
const GRID_SEG_TIER = new Uint8Array(GRID_SEG_COUNT);

(function buildGrid(): void {
  const half = PLANE_SIZE / 2;
  const first = DOT_STEP / 2;
  const last = (DOTS_PER_AXIS - 1) * DOT_STEP + DOT_STEP / 2;
  let s = 0;

  const push = (x0: number, y0: number, x1: number, y1: number): void => {
    GRID_SEG_X0[s] = x0;
    GRID_SEG_Y0[s] = y0;
    GRID_SEG_X1[s] = x1;
    GRID_SEG_Y1[s] = y1;
    // Tier from the midpoint: one alpha per piece, and the midpoint is the only
    // sample that cannot bias the ramp toward either end of the line.
    const mx = (x0 + x1) / 2 - half;
    const my = (y0 + y1) / 2 - half;
    const falloff = gridFalloff(Math.sqrt(mx * mx + my * my));
    GRID_SEG_TIER[s] = Math.min(
      GRID_FADE_TIERS - 1,
      Math.max(0, Math.round(falloff * (GRID_FADE_TIERS - 1))),
    );
    s++;
  };

  for (let n = 0; n < DOTS_PER_AXIS; n += GRID_LINE_STRIDE) {
    const t = n * DOT_STEP + DOT_STEP / 2;
    for (let k = 0; k < GRID_SEGMENTS; k++) {
      const a = first + ((last - first) * k) / GRID_SEGMENTS;
      const b = first + ((last - first) * (k + 1)) / GRID_SEGMENTS;
      push(t, a, t, b); // running away from the camera
      push(a, t, b, t); // running across
    }
  }
})();

/** `rgba()` per fade tier, in `RGB_SHADOW_NAVY`. Tier 0 is fully dissolved and never
 *  drawn; the top tier is `STREET_ALPHA`, i.e. the plane's centre is unchanged from
 *  what shipped. Built once. */
const GRID_TIER_STROKE: readonly string[] = (() => {
  const out: string[] = [];
  for (let t = 0; t < GRID_FADE_TIERS; t++) {
    const frac = GRID_FADE_TIERS <= 1 ? 1 : t / (GRID_FADE_TIERS - 1);
    out.push(rgba(RGB_SHADOW_NAVY, frac * STREET_ALPHA));
  }
  return out;
})();

/**
 * The pieces, ordered by tier, plus where each tier's run starts — a counting sort run
 * **once**, not per frame.
 *
 * `drawDotField` sorts every frame because a dot's tier moves with the cursor light.
 * A piece's tier is a function of its position alone, and its position is frozen, so the
 * order is a constant. `GRID_TIER_START` has one extra slot so a run is always
 * `[start[t], start[t + 1])` with no special case at the end.
 */
const GRID_TIER_ORDER = new Int32Array(GRID_SEG_COUNT);
const GRID_TIER_START = new Int32Array(GRID_FADE_TIERS + 1);

(function sortGridByTier(): void {
  for (let i = 0; i < GRID_SEG_COUNT; i++) GRID_TIER_START[GRID_SEG_TIER[i]! + 1]!++;
  for (let t = 0; t < GRID_FADE_TIERS; t++) GRID_TIER_START[t + 1]! += GRID_TIER_START[t]!;
  const cursor = new Int32Array(GRID_FADE_TIERS);
  for (let t = 0; t < GRID_FADE_TIERS; t++) cursor[t] = GRID_TIER_START[t]!;
  for (let i = 0; i < GRID_SEG_COUNT; i++) GRID_TIER_ORDER[cursor[GRID_SEG_TIER[i]!]!++] = i;
})();

/**
 * The avenues, as stroked lines on the ground plane, dissolving at the plane's margins.
 *
 * Geometry ported from `heroCityRenderer.ts`. A field of dots at a uniform lattice pitch
 * has no perspective cue of its own — nothing converges, nothing establishes a floor —
 * and an early cut of this exact scene without any lines read as a beautiful abstract
 * point cloud rather than as a place (`docs/hero-upgrade/dawn-halftone.md`). Losing the
 * buildings does not change that; the plane still needs its floor.
 *
 * What is new is the edge fade (`gridFalloff`), and how it is drawn. The endpoints are
 * still projected one at a time, so the lines still genuinely converge under the
 * camera's perspective divide — baking the whole grid into one sprite and blitting it
 * through `drawImageOnPlane` would have been cheaper, but that call drops the
 * perspective divide across the image's span, which is a sub-pixel approximation over
 * the mark's 380 plane px and a wrong picture over the plane's full 924.
 *
 * The pieces are walked in tier order (`GRID_TIER_ORDER`, sorted once at load) and
 * stroked once per tier, so the whole grid still costs six `strokeStyle` changes — the
 * same batching discipline `drawDotField` follows, minus the per-frame sort it needs and
 * this does not.
 */
function drawStreets(ctx: CanvasRenderingContext2D, cam: Camera, state: HeroFrameState): void {
  const base = Math.max(0.5, cam.scale * 0.8);
  ctx.globalAlpha = 1 - 0.5 * state.flatten;
  // Tier 0 is the fully-dissolved rim: nothing to draw, so start at 1.
  for (let t = 1; t < GRID_FADE_TIERS; t++) {
    const from = GRID_TIER_START[t]!;
    const to = GRID_TIER_START[t + 1]!;
    if (to <= from) continue;
    ctx.strokeStyle = GRID_TIER_STROKE[t]!;
    // Fainter pieces are drawn slightly wider. A wide, near-transparent line reads as
    // softened rather than thinner — the honest way to buy the look of a blurred edge
    // with no blur layer anywhere (README standing rule 5).
    ctx.lineWidth = base * (1 + (1 - t / (GRID_FADE_TIERS - 1)) * 0.9);
    ctx.beginPath();
    for (let k = from; k < to; k++) {
      const i = GRID_TIER_ORDER[k]!;
      const a = project(cam, GRID_SEG_X0[i]!, GRID_SEG_Y0[i]!, 0);
      const b = project(cam, GRID_SEG_X1[i]!, GRID_SEG_Y1[i]!, 0);
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ═══════════════════════════════ (b) Dot field ═══════════════════════════════ */

/**
 * Every other lattice line, both axes: `DOTS_PER_AXIS` (44) → `FIELD_AXIS` (22),
 * `DOT_COUNT` (1,936) → `FIELD_COUNT` (484). The city's dots were doing skyline
 * work — dot size *was* building height. These are doing texture work only, so a
 * quarter of the density reads as "sparse field," not "the city got smaller."
 */
const DOT_STRIDE = 2;
const FIELD_AXIS = Math.floor((DOTS_PER_AXIS - 1) / DOT_STRIDE) + 1;
const FIELD_COUNT = FIELD_AXIS * FIELD_AXIS;

/**
 * Resting radius, in plane px. Below the city's own floor (`DOT_MIN` = 1.4 in
 * `heroCity.ts`) on purpose — these dots carry no height information, so nothing
 * about them needs to compete with the mark or the headline for attention at rest.
 */
const FIELD_DOT_RADIUS = 1.0;
/** How much a fully-lit dot's radius grows. Small — a swell, not a growth spurt. */
const FIELD_RADIUS_LIFT = 0.45;

/**
 * Resting alpha at full density (i.e. dead centre of the field, before the edge mask
 * thins it). Sits just above the city's `ALPHA_MIN` (0.07) floor, because unlike the
 * city this field has no taller, brighter dots to carry the composition — every dot
 * here is at the quiet end or the field disappears.
 */
const FIELD_DOT_ALPHA = 0.11;
/** How much brighter a fully-lit dot gets. */
const FIELD_ALPHA_LIFT = 0.7;
/** Ceiling alpha a dot can reach under full cursor light, at full density. */
const FIELD_ALPHA_CEILING = FIELD_DOT_ALPHA * (1 + FIELD_ALPHA_LIFT);

/**
 * How far a fully-lit dot rises off the plane, in plane px. A third of the city's
 * `STOREY_HEIGHT` (27) — enough to read as a soft swell under the pointer, nowhere
 * near enough to read as a spike or a building trying to happen.
 */
const FIELD_LIFT_HEIGHT = 16;

/** Alpha tiers the field batches into for drawing. Six, matching the city's own
 *  granularity — enough steps that the swell reads continuous, few enough that a
 *  frame changes `fillStyle` at most six times for the whole field. */
const FIELD_ALPHA_TIERS = 6;

/** Plane-space position of each sparse dot, sampled straight off the city's own
 *  frozen lattice (`DOT_X`/`DOT_Y`) so the field and the streets share one grid. */
const FIELD_X = new Float32Array(FIELD_COUNT);
const FIELD_Y = new Float32Array(FIELD_COUNT);
/** Base alpha per dot: `FIELD_DOT_ALPHA` scaled by the lattice's own edge-density
 *  mask (`DOT_DENSITY`), so the field dissolves at the margins exactly the way the
 *  city did, with no visible rectangular boundary. */
const FIELD_ALPHA = new Float32Array(FIELD_COUNT);

(function buildField(): void {
  for (let row = 0; row < DOTS_PER_AXIS; row += DOT_STRIDE) {
    const fr = row / DOT_STRIDE;
    for (let col = 0; col < DOTS_PER_AXIS; col += DOT_STRIDE) {
      const fc = col / DOT_STRIDE;
      const fi = fr * FIELD_AXIS + fc;
      const i = row * DOTS_PER_AXIS + col;
      FIELD_X[fi] = DOT_X[i]!;
      FIELD_Y[fi] = DOT_Y[i]!;
      FIELD_ALPHA[fi] = FIELD_DOT_ALPHA * DOT_DENSITY[i]!;
    }
  }
})();

/** `rgba()` string per alpha tier, in `RGB_FROST` — the palette's hairline colour,
 *  the same family the isometric grid used before it became a lattice. Built once. */
const FIELD_TIER_FILL: readonly string[] = (() => {
  const out: string[] = [];
  for (let t = 0; t < FIELD_ALPHA_TIERS; t++) {
    const frac = FIELD_ALPHA_TIERS <= 1 ? 1 : t / (FIELD_ALPHA_TIERS - 1);
    out.push(rgba(RGB_FROST, frac * FIELD_ALPHA_CEILING));
  }
  return out;
})();

/* ── Preallocated per-frame buffers — zero allocation in the frame path. ── */
const fieldStretchCurrent = new Float32Array(FIELD_COUNT);
const fieldStretchTarget = new Float32Array(FIELD_COUNT);
const fieldMarkSX = new Float32Array(FIELD_COUNT);
const fieldMarkSY = new Float32Array(FIELD_COUNT);
const fieldMarkR = new Float32Array(FIELD_COUNT);
const fieldMarkTier = new Uint8Array(FIELD_COUNT);
const fieldBucketCount = new Int32Array(FIELD_ALPHA_TIERS);
const fieldBucketStart = new Int32Array(FIELD_ALPHA_TIERS);
const fieldBucketSlots = new Int32Array(FIELD_COUNT);
/** Scratch for `latticeIndexRect`, so the cursor pass allocates nothing. */
const rectBuf = new Int32Array(4);

/**
 * Resolve this frame's per-dot stretch from the cursor and any live click ripple.
 *
 * Bounded exactly the way `heroCityRenderer.ts`'s `applyCursor` is: `latticeIndexRect`
 * turns the cursor's plane position into the lattice index range it can possibly
 * reach, in O(1) regardless of field size, so a still cursor costs nothing. The
 * bounding box comes back in the *full* lattice's column/row units; snapping it onto
 * this field's stride-2 grid (`ceil`/`floor` by `DOT_STRIDE`) keeps the same O(1)
 * property here.
 *
 * The ripple is the one thing that must sweep the whole field — its crest can be
 * anywhere — gated on `rippleAge >= 0` so it costs nothing between clicks.
 */
function applyCursor(interaction: PlaneInteraction | undefined): void {
  fieldStretchTarget.fill(0);

  const lit = interaction !== undefined && interaction.pointerActive && interaction.strength > 0;
  if (lit && latticeIndexRect(interaction.lightX, interaction.lightY, CURSOR_RADIUS, rectBuf)) {
    const fc0 = Math.ceil(rectBuf[0]! / DOT_STRIDE);
    const fc1 = Math.floor(rectBuf[1]! / DOT_STRIDE);
    const fr0 = Math.ceil(rectBuf[2]! / DOT_STRIDE);
    const fr1 = Math.floor(rectBuf[3]! / DOT_STRIDE);
    for (let fr = fr0; fr <= fr1; fr++) {
      const base = fr * FIELD_AXIS;
      for (let fc = fc0; fc <= fc1; fc++) {
        const fi = base + fc;
        const falloff = cursorFalloff(
          FIELD_X[fi]! - interaction.lightX,
          FIELD_Y[fi]! - interaction.lightY,
          CURSOR_RADIUS,
        );
        if (falloff <= 0) continue;
        fieldStretchTarget[fi] = skylineStretch(falloff, interaction.strength, interaction.velocity);
      }
    }
  }

  if (interaction !== undefined && interaction.rippleAge >= 0) {
    for (let i = 0; i < FIELD_COUNT; i++) {
      const dx = FIELD_X[i]! - interaction.rippleX;
      const dy = FIELD_Y[i]! - interaction.rippleY;
      const crest = rippleCrest(Math.sqrt(dx * dx + dy * dy), interaction.rippleAge);
      if (crest > fieldStretchTarget[i]!) fieldStretchTarget[i] = crest;
    }
  }

  for (let i = 0; i < FIELD_COUNT; i++) {
    fieldStretchCurrent[i] = easeToward(fieldStretchCurrent[i]!, fieldStretchTarget[i]!, HOVER_LERP);
  }
}

/**
 * Project and bucket every dot, then draw one `beginPath()`/`fill()` per non-empty
 * alpha tier — the same counting-sort batching `heroCityRenderer.ts` used for its
 * marks, sized down to this field's `FIELD_ALPHA_TIERS` (no colour ramp to cross,
 * so there is only one axis to bucket on).
 */
function drawDotField(ctx: CanvasRenderingContext2D, cam: Camera): void {
  fieldBucketCount.fill(0);
  for (let i = 0; i < FIELD_COUNT; i++) {
    const stretch = fieldStretchCurrent[i]!;
    const p = project(cam, FIELD_X[i]!, FIELD_Y[i]!, FIELD_LIFT_HEIGHT * stretch);
    const k = PERSPECTIVE / Math.max(1, PERSPECTIVE - p.depth);
    const alpha = Math.min(FIELD_ALPHA_CEILING, FIELD_ALPHA[i]! * (1 + stretch * FIELD_ALPHA_LIFT));
    const tier = Math.min(
      FIELD_ALPHA_TIERS - 1,
      Math.floor((alpha / FIELD_ALPHA_CEILING) * FIELD_ALPHA_TIERS),
    );
    fieldMarkSX[i] = p.sx;
    fieldMarkSY[i] = p.sy;
    fieldMarkR[i] = FIELD_DOT_RADIUS * (1 + stretch * FIELD_RADIUS_LIFT) * cam.scale * k;
    fieldMarkTier[i] = tier;
    fieldBucketCount[tier] = fieldBucketCount[tier]! + 1;
  }

  let acc = 0;
  for (let t = 0; t < FIELD_ALPHA_TIERS; t++) {
    fieldBucketStart[t] = acc;
    acc += fieldBucketCount[t]!;
    fieldBucketCount[t] = 0; // reused below as the bucket's write cursor
  }
  for (let i = 0; i < FIELD_COUNT; i++) {
    const t = fieldMarkTier[i]!;
    fieldBucketSlots[fieldBucketStart[t]! + fieldBucketCount[t]!] = i;
    fieldBucketCount[t] = fieldBucketCount[t]! + 1;
  }

  for (let t = 0; t < FIELD_ALPHA_TIERS; t++) {
    const count = fieldBucketCount[t]!;
    if (count === 0) continue;
    const start = fieldBucketStart[t]!;
    ctx.fillStyle = FIELD_TIER_FILL[t]!;
    ctx.beginPath();
    for (let s = 0; s < count; s++) {
      const i = fieldBucketSlots[start + s]!;
      const r = fieldMarkR[i]!;
      if (r <= 0.05) continue;
      ctx.moveTo(fieldMarkSX[i]! + r, fieldMarkSY[i]!);
      ctx.arc(fieldMarkSX[i]!, fieldMarkSY[i]!, r, 0, TAU);
    }
    ctx.fill();
  }
}

/* ══════════════════════ (c) Blocks, nodes and signal circuits ══════════════════════
 *
 * Restored from the pre-lattice renderer (`git show
 * a9850f3:src/features/hero/heroCanvasRenderer.ts`), which the halftone rewrite
 * replaced with a dot lattice. The lattice read as a *map*: sixteen extruded blocks,
 * four elevated service nodes and three pulsing signal circuits are what give the
 * plane objects with real silhouettes standing on it, and the dot field alone could
 * not carry that.
 *
 * `CUBE_POSITIONS`, `SERVICE_NODES` and `SIGNAL_LOOPS` are all frozen and pinned by
 * `tests/motion/hero-scene.test.ts` — derived from, never re-authored.
 */

/** Corner radius of a service node's faces — `borderRadius: 14px` in the DOM original. */
const NODE_RADIUS = 14;

/** One scene object, with the projected depth it painter-sorts on. */
interface Drawable {
  depth: number;
  draw: () => void;
}

/** Scratch list, reused every frame so the painter's-algorithm sort allocates nothing
 *  beyond the closures themselves. */
const drawables: Drawable[] = [];

/** Trace a projected polygon without filling or stroking it. */
function tracePoly(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  pts: readonly (readonly [number, number, number])[],
): void {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const [x, y, z] = pts[i]!;
    const p = project(cam, x, y, z);
    if (i === 0) ctx.moveTo(p.sx, p.sy);
    else ctx.lineTo(p.sx, p.sy);
  }
  ctx.closePath();
}

/**
 * Fill a projected quad with a linear gradient running corner 0 → corner 2 — the
 * projected stand-in for the old faces' `linear-gradient(...)` backgrounds.
 */
function gradientQuad(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  pts: readonly (readonly [number, number, number])[],
  from: string,
  to: string,
): void {
  const a = project(cam, ...pts[0]!);
  const b = project(cam, ...pts[2]!);
  const g = ctx.createLinearGradient(a.sx, a.sy, b.sx, b.sy);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  tracePoly(ctx, cam, pts);
  ctx.fillStyle = g;
  ctx.fill();
}

/**
 * Trace a rounded rectangle lying flat on the plane at height `z`.
 *
 * The corners are rounded in *plane* space and then projected, so the radius skews
 * with the camera the way `borderRadius: 14px` on a `preserve-3d` child did. Canvas
 * has no primitive for "rounded rect under an arbitrary affine transform", so each
 * corner is a short arc of projected points.
 */
function traceRoundedPlaneRect(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  z: number,
  radius: number,
): void {
  const r = Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2);
  const STEPS = 8;
  const corners: readonly (readonly [number, number, number])[] = [
    [x1 - r, y0 + r, -Math.PI / 2],
    [x1 - r, y1 - r, 0],
    [x0 + r, y1 - r, Math.PI / 2],
    [x0 + r, y0 + r, Math.PI],
  ];

  ctx.beginPath();
  let first = true;
  for (const [ccx, ccy, startAngle] of corners) {
    for (let s = 0; s <= STEPS; s++) {
      const a = startAngle + (s / STEPS) * (Math.PI / 2);
      const p = project(cam, ccx + Math.cos(a) * r, ccy + Math.sin(a) * r, z);
      if (first) {
        ctx.moveTo(p.sx, p.sy);
        first = false;
      } else {
        ctx.lineTo(p.sx, p.sy);
      }
    }
  }
  ctx.closePath();
}

/** Mix a base colour toward black (`t < 0`) or white (`t > 0`). */
function shade(c: Rgb, t: number): string {
  const target = t < 0 ? 0 : 255;
  const k = Math.abs(t);
  return `rgb(${Math.round(c[0] + (target - c[0]) * k)}, ${Math.round(
    c[1] + (target - c[1]) * k,
  )}, ${Math.round(c[2] + (target - c[2]) * k)})`;
}

/* ── Signals ── */

/**
 * Three closed circuits with pulses running them, the one thing in this scene that
 * animates against wall-clock time rather than scroll. Fades in lockstep with the
 * blocks via `state.signalOpacity`, so the whole scene collapses together.
 */
function drawSignals(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  state: HeroFrameState,
  elapsed: number,
): void {
  if (state.signalOpacity <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = state.signalOpacity;
  ctx.lineCap = "round";

  for (const loop of SIGNAL_LOOPS) {
    if (loop.totalL === 0) continue;

    for (const offset of loop.pulseOffsets) {
      const headD = (elapsed * SIGNAL_SPEED_PX_PER_MS + offset * loop.totalL) % loop.totalL;

      ctx.beginPath();
      for (let s = 0; s <= SIGNAL_SAMPLES; s++) {
        const d = headD - (SIGNAL_TAIL_PX * (SIGNAL_SAMPLES - s)) / SIGNAL_SAMPLES;
        const pt = pointAtLoopDistance(loop, d);
        const p = project(cam, pt.x, pt.y, 1);
        if (s === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }

      // Outer glow, then inner core — two strokes of one path, not a blur layer.
      ctx.lineWidth = 14 * cam.scale;
      ctx.strokeStyle = rgba(loop.color, 0.22);
      ctx.stroke();
      ctx.lineWidth = 5.5 * cam.scale;
      ctx.strokeStyle = rgba(loop.color, 0.95);
      ctx.stroke();

      // Gold pulses light the service nodes as they pass.
      if (loop.color === RGB_GOLD) drawNodeGlow(ctx, cam, loop.totalL, headD);
    }
  }

  ctx.restore();
}

function drawNodeGlow(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  totalL: number,
  headD: number,
): void {
  const side = 12 * GRID_CELL;
  for (let i = 0; i < SERVICE_NODES.length; i++) {
    const node = SERVICE_NODES[i]!;
    // Loop 1 visits the nodes in quant → fullstack → ops → data order.
    const nodeDist = [0, side, 3 * side, 2 * side][i]!;
    const diff = Math.abs(headD - nodeDist);
    const dist = Math.min(diff, totalL - diff);
    if (dist >= 90) continue;

    const intensity = (1 - dist / 90) * 0.42;
    if (intensity <= 0.01) continue;

    const p = project(cam, node.cx, node.cy, node.elevation);
    const r = 48 * cam.scale;
    const g = ctx.createRadialGradient(p.sx, p.sy, 10 * cam.scale, p.sx, p.sy, r);
    g.addColorStop(0, rgba(RGB_GOLD, intensity * 0.8));
    g.addColorStop(0.4, rgba(RGB_GOLD, intensity * 0.28));
    g.addColorStop(1, rgba(RGB_GOLD, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, r, 0, TAU);
    ctx.fill();
  }
}

/* ── Blocks ── */

function collectCube(
  out: Drawable[],
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  spec: CubeSpec,
  state: HeroFrameState,
): void {
  const base: Rgb = spec.type === "navy" ? RGB_NAVY : RGB_GOLD;
  const x0 = spec.c * GRID_CELL;
  const y0 = spec.r * GRID_CELL;
  const x1 = x0 + GRID_CELL;
  const y1 = y0 + GRID_CELL;
  // Extrusion collapses linearly with flatten.
  const hz = Math.max(0, spec.h * (1 - state.flatten));
  const centre = project(cam, x0 + GRID_CELL / 2, y0 + GRID_CELL / 2, hz);

  out.push({
    depth: centre.depth,
    draw: () => {
      if (state.sideOpacity > 0.01) {
        blitShadow(
          ctx, cam,
          x0 + GRID_CELL / 2, y0 + GRID_CELL / 2,
          GRID_CELL * 1.5, state.sideOpacity * 0.9,
        );
      }

      // Side walls, only while there is height to show. Each carries the same
      // top-light / bottom-dark ramp the CSS gradients did.
      if (state.sideOpacity > 0.01 && hz > 1) {
        ctx.globalAlpha = state.sideOpacity;
        gradientQuad(
          ctx, cam,
          [[x0, y0, hz], [x0, y1, hz], [x0, y1, 0], [x0, y0, 0]],
          shade(base, 0.12), shade(base, -0.32),
        );
        gradientQuad(
          ctx, cam,
          [[x0, y1, hz], [x1, y1, hz], [x1, y1, 0], [x0, y1, 0]],
          shade(base, -0.12), shade(base, -0.5),
        );
        ctx.globalAlpha = 1;
      }

      if (state.topOpacity > 0.01) {
        ctx.globalAlpha = state.topOpacity;
        gradientQuad(
          ctx, cam,
          [[x0, y0, hz], [x1, y0, hz], [x1, y1, hz], [x0, y1, hz]],
          shade(base, 0.32 * state.sideOpacity),
          shade(base, 0.05 * state.sideOpacity),
        );
        ctx.globalAlpha = 1;
      }
    },
  });
}

/* ── Service nodes ── */

function collectNode(
  out: Drawable[],
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  spec: ServiceNodeSpec,
  state: HeroFrameState,
): void {
  const half = SERVICE_NODE_SIZE / 2;
  const x0 = spec.cx - half;
  const y0 = spec.cy - half;
  const x1 = spec.cx + half;
  const y1 = spec.cy + half;
  const ez = Math.max(0, spec.elevation * (1 - state.flatten));
  const centre = project(cam, spec.cx, spec.cy, ez);

  out.push({
    depth: centre.depth,
    draw: () => {
      if (state.sideOpacity > 0.01) {
        blitShadow(ctx, cam, spec.cx, spec.cy, SERVICE_NODE_SIZE * 1.6, state.sideOpacity);
      }

      // Stacked rounded slabs — the extrusion of the original elevated node.
      if (state.sideOpacity > 0.01 && ez > 1) {
        ctx.globalAlpha = state.sideOpacity;
        const numSlabs = Math.max(2, Math.round(14 * (1 - state.flatten)));
        for (let i = 0; i < numSlabs; i++) {
          const z = (i / (numSlabs - 1)) * ez;
          const ratio = i / (numSlabs - 1);
          const r = Math.round(6 + (10 - 6) * ratio);
          const g = Math.round(14 + (24 - 14) * ratio);
          const b = Math.round(32 + (51 - 32) * ratio);
          traceRoundedPlaneRect(ctx, cam, x0, y0, x1, y1, z, NODE_RADIUS);
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      if (state.topOpacity > 0.01) {
        const top = ez + 4.5;
        ctx.globalAlpha = state.topOpacity;

        traceRoundedPlaneRect(ctx, cam, x0, y0, x1, y1, top, NODE_RADIUS);
        ctx.fillStyle = shade(RGB_NAVY, -0.62);
        ctx.fill();

        // Outer glow, standing in for the old `boxShadow: 0 0 28px gold@0.5`.
        if (state.sideOpacity > 0.05) {
          ctx.save();
          ctx.lineWidth = 6 * cam.scale;
          ctx.strokeStyle = rgba(RGB_GOLD, 0.18 * state.sideOpacity);
          ctx.stroke();
          ctx.restore();
        }

        ctx.lineWidth = 2 * cam.scale;
        ctx.strokeStyle = rgba(RGB_GOLD, 1);
        ctx.stroke();

        drawNodeIcon(ctx, cam, spec.cx, spec.cy, top, spec.icon);
        ctx.globalAlpha = 1;
      }
    },
  });
}

/**
 * The four service glyphs, drawn in the projected plane so they sit flat on the
 * node's top face. Paths transcribed from the inline SVGs the old nodes rendered.
 */
function drawNodeIcon(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  cx: number,
  cy: number,
  z: number,
  icon: NodeIcon,
): void {
  // 24x24 viewBox rendered at 30px, so plane units per viewBox unit:
  const u = 30 / 24;
  const toPlane = (vx: number, vy: number) => ({ x: cx + (vx - 12) * u, y: cy + (vy - 12) * u });

  const strokes: Record<NodeIcon, readonly (readonly (readonly [number, number])[])[]> = {
    activity: [[[22, 12], [18, 12], [15, 21], [9, 3], [6, 12], [2, 12]]],
    code: [
      [[16, 18], [22, 12], [16, 6]],
      [[8, 6], [2, 12], [8, 18]],
    ],
    package: [
      [[12, 2], [20, 6], [20, 16], [12, 20], [4, 16], [4, 6], [12, 2]],
      [[3.27, 6.96], [12, 12.01], [20.73, 6.96]],
      [[12, 22.08], [12, 12]],
    ],
    shield: [[[12, 22], [20, 12], [20, 5], [12, 2], [4, 5], [4, 12], [12, 22]]],
  };

  ctx.lineWidth = 2.2 * u * cam.scale;
  ctx.strokeStyle = rgba(RGB_GOLD, 1);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const poly of strokes[icon]) {
    ctx.beginPath();
    for (let i = 0; i < poly.length; i++) {
      const [vx, vy] = poly[i]!;
      const pl = toPlane(vx, vy);
      const p = project(cam, pl.x, pl.y, z);
      if (i === 0) ctx.moveTo(p.sx, p.sy);
      else ctx.lineTo(p.sx, p.sy);
    }
    ctx.stroke();
  }
}

/**
 * Everything standing on the plane, painted back to front.
 *
 * One sort per frame over 20 objects. Skipped entirely once the scene is flat —
 * there is no depth left to sort by, and nothing has height to show.
 */
function drawSceneObjects(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  state: HeroFrameState,
): void {
  if (state.flat) return;
  drawables.length = 0;
  for (const cube of CUBE_POSITIONS) collectCube(drawables, ctx, cam, cube, state);
  for (const node of SERVICE_NODES) collectNode(drawables, ctx, cam, node, state);
  drawables.sort((a, b) => a.depth - b.depth);
  for (const item of drawables) item.draw();
  drawables.length = 0;
}

/* ═══════════════════════════════ (d) The flat 3D P ═══════════════════════════════ */

/* ── The lockup ────────────────────────────────────────────────────────────────
 * The mark and the `PHITOPOLIS` wordmark are drawn by two different systems — this
 * canvas and a DOM `<h1>` in `SuperHeroSequence.tsx` — but they compose one piece of
 * type. These three numbers are the seam, and they are the only place either side is
 * allowed to know about the other. Change the wordmark's `left` in that file and
 * these must move with it. */

/** Screen px the wordmark's left edge sits left of centre, at `sm` (600–899px). */
export const WORDMARK_INSET_SM = 65;
/** Screen px the wordmark's left edge sits left of centre, at `md` and up. */
export const WORDMARK_INSET_MD = 95;
/**
 * Screen px of air between the mark's right edge and the wordmark's left edge.
 *
 * Set against the wordmark's own cap height rather than picked: at `md` the type is
 * 5.8rem, so ~44px is a little over half a cap — close enough that the two read as
 * one lockup, far enough that the P's bowl is not touching the `P` of PHITOPOLIS.
 * Below that they crowd; much above it and the mark reads as a separate object that
 * happens to share a line.
 */
export const LOCKUP_GAP = 44;

/**
 * Plane px the mark rises on mobile, where the wordmark lands *below* it rather than
 * beside it (`top: calc(50% + 90px)`, centred). Vertical stacking has no gap to
 * solve for, so this stays the constant it always was.
 */
const MOBILE_LIFT = 160;

/**
 * A soft radial blob used for every cast shadow the mark throws. Rasterised once and
 * stretched at draw time — ported verbatim from the pre-lattice renderer's
 * `buildShadowSprite`, which itself replaced 43 live `filter: blur()` layers with one
 * bitmap. Colour comes from `RGB_SHADOW` in `heroScene.ts`, not a literal.
 */
function buildShadowSprite(): HTMLCanvasElement {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return c; // jsdom: an undrawn sprite is a valid, zero-effect sprite.
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, rgba(RGB_SHADOW, 0.45));
  g.addColorStop(0.4, rgba(RGB_SHADOW, 0.22));
  g.addColorStop(0.7, rgba(RGB_SHADOW, 0.06));
  g.addColorStop(1, rgba(RGB_SHADOW, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

const SHADOW_SPRITE = buildShadowSprite();

/** Blit `SHADOW_SPRITE` at plane position `(x, y)`, scaled to `radius`. Ported
 *  verbatim from the pre-lattice renderer's `blitShadow`. */
function blitShadow(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  x: number,
  y: number,
  radius: number,
  alpha: number,
): void {
  const p = project(cam, x, y, 0);
  const r = radius * cam.scale;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  // Squashed vertically so it reads as lying on the ground plane under the camera tilt.
  ctx.translate(p.sx, p.sy);
  ctx.scale(1, Math.max(0.25, cam.cosX));
  ctx.drawImage(SHADOW_SPRITE, -r, -r, r * 2, r * 2);
  ctx.restore();
}

/**
 * Blit an image onto a rectangle that lives *in the scene plane*, so it inherits the
 * camera's rotation and skew instead of facing the viewer.
 *
 * Ported verbatim from the pre-lattice renderer — this is the subtle part. It uses
 * the projected top-left / top-right / bottom-left corners to build an affine matrix,
 * dropping the perspective divide across the image's own span (imperceptible at this
 * scale, the same approximation the street grid's projection makes).
 */
function drawImageOnPlane(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  img: CanvasImageSource,
  cx: number,
  cy: number,
  z: number,
  w: number,
  h: number,
): void {
  const tl = project(cam, cx - w / 2, cy - h / 2, z);
  const tr = project(cam, cx + w / 2, cy - h / 2, z);
  const bl = project(cam, cx - w / 2, cy + h / 2, z);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.transform(
    (tr.sx - tl.sx) / w, (tr.sy - tl.sy) / w,
    (bl.sx - tl.sx) / h, (bl.sy - tl.sy) / h,
    tl.sx, tl.sy,
  );
  ctx.drawImage(img, 0, 0, w, h);
  ctx.restore();
}

/**
 * Depth of the darkened-layer stack the extrusion blits from. The extrusion itself
 * (`layers` in `drawLogo`) never draws more than `P_MAX_LAYERS` — so 12 precomputed
 * steps make the darkening ramp smooth at full 3D and merely coarser (never wrong)
 * as `flatten` thins the layer count down.
 *
 * Raised 8 → 12 alongside `P_LIFT`: at the old height eight steps were finer than the
 * eye could resolve on a ~12 screen-px wall, but a 30 px wall banded visibly.
 */
const LOGO_LAYERS = 12;
/** Darkest step's brightness multiplier — the pre-lattice renderer's own floor. */
const LOGO_LAYER_FLOOR = 0.55;
/** Baked sprite width, in px — comfortably above the largest on-screen draw (380px
 *  desktop `baseW`, see `drawLogo`), so the affine blit never has to upsample. */
const LOGO_SPRITE_WIDTH = 480;

let logoLayerSprites: HTMLCanvasElement[] | null = null;
let logoLayerSource: CanvasImageSource | null = null;

/**
 * Build, once, the fixed stack of darkened copies of the mark the extrusion blits
 * from — then cache it for the image's lifetime (one decode per page load).
 *
 * **Two deliberate changes from the ported code.**
 *
 * 1. The pre-lattice renderer set `ctx.filter = "brightness(...)"` per blit, which is
 *    a filter pass the compositor pays for on every one of up to 8 layers, every
 *    animated frame the pin is scrolling. The darkness steps are a pure function of
 *    layer index and the image never changes after it decodes, so there is no reason
 *    to pay that cost more than once — hence the bake and the cache.
 *
 * 2. The bake does **not** use `ctx.filter` either, and that is a correctness fix,
 *    not an optimisation. `CanvasRenderingContext2D.filter` only shipped in Safari
 *    18.4; every Safari before that ignores the assignment *silently* — no throw, no
 *    warning — so all eight layers came out at full brightness and the mark rendered
 *    as a flat slab with no depth at all, while Chrome showed the extrusion
 *    correctly. A capability this load-bearing must not be behind a feature the
 *    platform is free to no-op.
 *
 *    `source-atop` replaces it with Canvas 2D level-1 compositing, supported
 *    everywhere: fill the whole rect with black at `1 - brightness`, keeping only
 *    the pixels that overlap what is already drawn. For an opaque source pixel that
 *    resolves to `src * brightness` — algebraically identical to `brightness()` —
 *    and along the mark's antialiased edges it scales by destination alpha, so the
 *    edge darkens proportionally instead of fringing.
 */
function ensureLogoLayers(image: CanvasImageSource): HTMLCanvasElement[] {
  if (logoLayerSprites && logoLayerSource === image) return logoLayerSprites;

  const w = LOGO_SPRITE_WIDTH;
  const h = Math.max(1, Math.round(LOGO_SPRITE_WIDTH * getLogoAspect()));

  const out: HTMLCanvasElement[] = [];
  for (let i = 0; i < LOGO_LAYERS; i++) {
    const ratio = LOGO_LAYERS > 1 ? i / (LOGO_LAYERS - 1) : 1;
    const brightness = LOGO_LAYER_FLOOR + (1 - LOGO_LAYER_FLOOR) * ratio;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) {
      // jsdom, or a context-exhausted browser: hand back the bare, undrawn
      // canvas — the same null-2D-context contract `heroLogoMask.ts` and every
      // other sprite builder in this feature follows. A blank layer is a valid,
      // silently-empty layer, never a thrown error.
      out.push(c);
      continue;
    }
    ctx.drawImage(image, 0, 0, w, h);
    if (brightness < 0.999) {
      // See (2) in the docstring: black at `1 - brightness`, clipped to what is
      // already on the canvas. No `ctx.filter`, so no silent no-op on Safari < 18.4.
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = rgba(RGB_SHADOW, 1 - brightness);
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    }
    out.push(c);
  }

  logoLayerSprites = out;
  logoLayerSource = image;
  return out;
}

/** Magnitude of the mark's own shadow offset, in plane px. Started from the pre-lattice
 *  renderer's ad-hoc `(-12, 12)` offset (`hypot(12, 12) ≈ 17`), with the direction fixed
 *  to `SHADOW_DIR`; raised to 22 with `P_LIFT`, because a contact shadow that does not
 *  grow with the object it belongs to reads as a decal under a taller mark. */
const P_SHADOW_OFFSET = 22;

/* ── Extrusion depth ──────────────────────────────────────────────────────────
 * These three numbers are the mark's volume, and they answer to each other.
 *
 * The ported value was a bare `lift = 10` against a `baseW` of 380 plane px — a wall
 * 2.6 % of the glyph's own width, which at ~1.16 cam.scale is roughly twelve screen px
 * on a 440 px mark. That is a hairline, not a slab: the P read as a sticker with an
 * edge rather than an object standing on the plane, which is the whole point of having
 * recovered it. */

/**
 * Extrusion height in plane px at full 3D, **stated against the desktop `baseW`**
 * (`P_LIFT_REFERENCE_W`) and scaled from it — so the wall is a fixed *fraction* of the
 * mark at every breakpoint. A flat plane-px lift would make the same number 13 % of the
 * 200 px mobile glyph and 7 % of the desktop one; depth is a property of the mark, not
 * of the viewport.
 */
const P_LIFT = 26;
/** The `baseW` (see `drawLogo`) that `P_LIFT` is quoted against. */
const P_LIFT_REFERENCE_W = 380;
/**
 * Target gap between successive extrusion blits, in plane px.
 *
 * The layer *count* is derived from this rather than fixed, and that is the load-bearing
 * half of this change: the ported code drew a hard-coded 8 blits, so raising the lift
 * alone would have spread those 8 copies ~3.8 plane px apart and the wall would have
 * come out as visible stripes instead of a solid mass. Hold the step, let the count move.
 */
const P_LAYER_STEP = 1.8;
/** Ceiling on the derived layer count — the frame-cost knob. Each layer is one affine
 *  `drawImage` of a `LOGO_SPRITE_WIDTH` sprite; lower this before anything else if the
 *  per-frame budget in `docs/hero-upgrade/stage-0-baseline.md` ever comes under pressure. */
const P_MAX_LAYERS = 16;

/**
 * The brand mark: a volumetric flat-3D P, recovered from the pre-lattice renderer.
 *
 * A real extruded raster lying *in* the scene plane (`drawImageOnPlane`), built from
 * successive blits climbing +z with a darkening gradient down the stack, casting a
 * real ground shadow along the scene's one dawn sun — as opposed to the lattice mark
 * this replaces, which was a plane of gold beacons sampled from the same raster's
 * alpha channel and had no geometry of its own at all.
 *
 * `cx`/`cy` are driven off `state.moveLeft`, exactly as the pre-lattice renderer's
 * own `drawLogo` did. That line is why this recovery also fixes the dead
 * "P → P PHITOPOLIS" move: `refreshLogoMask` (the lattice mark's positioning code)
 * hard-centred the mark at `width / 2` and dropped `moveLeft` on the floor. This
 * mark was never the one that forgot it.
 */
function drawLogo(ctx: CanvasRenderingContext2D, cam: Camera, state: HeroFrameState, w: number): void {
  const image = getLogoImage();
  if (!image || state.logoHidden) return;

  const mobile = w < 600;
  const baseW = mobile ? 200 : w < 900 ? 280 : 380;

  const lw = baseW * (mobile ? 1 - state.moveLeft * 0.25 : 1);
  const lh = lw * getLogoAspect();

  // Horizontal travel is *derived*, not a constant, so the mark always lands a fixed
  // gap to the left of the wordmark instead of drifting into it as the viewport
  // changes. The pre-lattice renderer used a flat 260/200 plane px here, which put
  // the P's right edge 43 screen px INSIDE the wordmark's left edge at 1280x720 —
  // the two read as one collided glyph rather than as a lockup.
  //
  // The wordmark is DOM, positioned at `left: calc(50% - WORDMARK_INSET)` in
  // `SuperHeroSequence.tsx`. Solving "P's right edge sits `LOCKUP_GAP` left of that"
  // for the plane-space travel gives the expression below; `cam.scale` converts the
  // screen-space terms into plane units, so it re-solves itself at every width.
  const inset = w < 900 ? WORDMARK_INSET_SM : WORDMARK_INSET_MD;
  const shift = mobile
    ? MOBILE_LIFT
    : (inset + LOCKUP_GAP) / Math.max(0.0001, cam.scale) + lw / 2;

  const cx = PLANE_SIZE / 2 - (mobile ? 0 : state.moveLeft * shift);
  const cy = PLANE_SIZE / 2 - (mobile ? state.moveLeft * shift : 0);

  // Ground contact shadow beneath the 3D mark while the scene still has depth: a
  // soft radial pool plus a tighter, darker shadow thrown along `SHADOW_DIR` — the
  // same directional dawn sun every other shadow in the scene answers to. The
  // pre-lattice renderer threw this second shadow toward a fixed, arbitrary
  // up-left offset; that disagreed with the sun everywhere else in the frame, and
  // fixing the direction (not the presence) is the whole change here.
  if (state.sideOpacity > 0.01) {
    // Two shadows, and the split matters: a wide ambient pool that says the mark
    // occupies space, then a tight contact shadow along `SHADOW_DIR` that says it
    // is *resting on* the plane. A single mid-sized blob reads as neither.
    //
    // The contact pass carries most of the weight (0.88 against the pool's 0.40)
    // because `SHADOW_SPRITE`'s own centre stop is only 0.45 alpha, so the
    // multipliers here are not the darkness — they are a fraction of it. The
    // ported values were 0.45/0.60, which put the mark's peak at ~0.27 black
    // spread over four times a cube's area while each cube sat at ~0.41 over a
    // small one. The largest object in the scene was casting the faintest shadow
    // in it, and on a near-white ground that lands close enough to the perception
    // floor to read as "no shadow" outright on some displays.
    blitShadow(ctx, cam, cx, cy, lw * 0.72, 0.40 * state.sideOpacity);
    blitShadow(
      ctx, cam,
      cx + SHADOW_DIR.x * P_SHADOW_OFFSET,
      cy + SHADOW_DIR.y * P_SHADOW_OFFSET,
      lw * 0.42,
      0.88 * state.sideOpacity,
    );
  }

  // Extrusion: successive blits climbing in z, back-to-front, darkening down the
  // stack. Both the height and the number of copies shrink as the scene flattens, the
  // same way the pre-lattice renderer's did — `flatten` reaching 1 by
  // `PHASE_FLATTEN_END` still lands a single flat blit, which is what the `P PHITOPOLIS`
  // lockup needs. Only the depth at full 3D changed; see `P_LIFT`.
  const lift = P_LIFT * (baseW / P_LIFT_REFERENCE_W) * (1 - state.flatten);
  const layers = Math.max(1, Math.min(P_MAX_LAYERS, Math.round(lift / P_LAYER_STEP)));
  const layerSprites = ensureLogoLayers(image);

  // P exit animation: drop down & fade out (pexit: 0 -> 1). Ported unchanged.
  const pOpacity = Math.max(0, 1 - state.pexit);
  if (pOpacity > 0.001) {
    const pDropY = state.pexit * 60;
    const pScale = 1 - state.pexit * 0.15;
    ctx.save();
    for (let i = 0; i < layers; i++) {
      const z = (i / Math.max(1, layers)) * lift;
      const ratio = layers > 1 ? i / (layers - 1) : 1;
      const spriteIndex = Math.min(LOGO_LAYERS - 1, Math.round(ratio * (LOGO_LAYERS - 1)));
      // Every layer is fully opaque. The ported code drew the side stack at 0.8 so that
      // eight sparse copies blended into a gradient; at the derived layer count the
      // copies overlap, and translucency there compounds into a muddy grey wall with the
      // ground showing through it. The darkening is already baked per sprite
      // (`ensureLogoLayers`) — the wall's shading comes from that, not from alpha.
      ctx.globalAlpha = pOpacity;
      drawImageOnPlane(ctx, cam, layerSprites[spriteIndex]!, cx, cy + pDropY, z, lw * pScale, lh * pScale);
    }
    ctx.restore();
  }

  // AT text entrance animation: slide down into view & fade in (atenter: 0 -> 1) at
  // the exact same centre coordinates. Ported unchanged, including the shadow —
  // `shadowBlur` here is the pre-lattice renderer's own text-legibility shadow, not
  // a new blur layer this rebuild introduced.
  if (state.atenter > 0.001) {
    const atOpacity = state.atenter;
    const atSlideY = (1 - state.atenter) * -60;
    const atScale = 0.85 + state.atenter * 0.15;

    const pCenter = project(cam, cx, cy + atSlideY, lift);
    ctx.save();
    ctx.globalAlpha = atOpacity;
    ctx.font = `900 ${Math.round(80 * cam.scale * atScale)}px Inter, sans-serif`;
    ctx.fillStyle = rgba(RGB_GOLD, 1);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = rgba(RGB_SHADOW, 0.3);
    ctx.shadowBlur = 10;
    ctx.fillText("AT", pCenter.sx, pCenter.sy);
    ctx.restore();
  }
}

/* ═══════════════════════════════════ Entry ═══════════════════════════════════ */

/**
 * Divisor on the plane-to-viewport fit.
 *
 * Back to the pre-lattice renderer's 1.05 from the halftone city's `VIEW_FIT` of
 * 0.95. Those two numbers answer different briefs. The lattice was deliberately
 * **over**scaled so the dot field bled off all four edges — a city has to run past
 * the frame to be a city. This scene is sixteen discrete blocks ringing the plane's
 * perimeter, and overscaling it does not read as "the scene continues", it reads as
 * "the corner blocks are cropped". Zoom out until the whole ring fits.
 */
export const VIEW_FIT = 1.05;

/**
 * Where the plane's centre sits vertically in the viewport, as a fraction of its
 * height. Dead centre — see `drawPlaneFrame`'s note. Exported so `HeroCanvas.tsx`
 * builds a byte-identical camera for its screen→plane unprojection; a disagreement
 * there is invisible until the cursor lights the wrong part of the scene.
 */
export const HORIZON = 0.5;

/**
 * Paint one frame of the plane.
 *
 * `w`/`h` are CSS pixels; the caller owns the DPR transform. `elapsed` drives the
 * signal pulses and nothing else, so `elapsed = 0` remains a valid resting frame for
 * `paintStill()` — the pulses simply sit at their `pulseOffsets`.
 *
 * The camera origin is `h / 2`, not the halftone city's `h * HORIZON` (0.6). That
 * 0.6 existed to push the skyline below the headline and turn the frame into a view
 * *across* a city from slightly above it. With the city gone it did nothing but sit
 * the P mark 10% of the viewport below centre — and the `PHITOPOLIS` wordmark that
 * rises beside it is DOM-positioned at `top: 50%`, so the two never lined up. One
 * number, two symptoms.
 */
export function drawPlaneFrame(
  ctx: CanvasRenderingContext2D,
  state: HeroFrameState,
  w: number,
  h: number,
  elapsed: number,
  interaction?: PlaneInteraction,
): void {
  ctx.clearRect(0, 0, w, h);
  if (w <= 0 || h <= 0) return;

  const viewScale = Math.min(w, h) / (PLANE_SIZE * VIEW_FIT);
  const cam = makeCamera(
    state.flatten,
    w / 2,
    h * HORIZON,
    viewScale,
    interaction?.tiltX ?? 0,
    interaction?.tiltY ?? 0,
  );

  applyCursor(interaction);

  drawStreets(ctx, cam, state);
  drawDotField(ctx, cam);
  drawSignals(ctx, cam, state, elapsed);
  drawSceneObjects(ctx, cam, state);
  drawLogo(ctx, cam, state, w);
}
