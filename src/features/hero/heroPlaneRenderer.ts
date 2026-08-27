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
  APPLICATION_NODES,
  APP_NODE_WIDTH,
  APP_NODE_HEIGHT,
  APP_NODE_RADIUS,
  APP_NODE_ELEVATION,
  CUBE_POSITIONS,
  GRID_CELL,
  GRID_OFFSET,
  PLANE_SIZE,
  RGB_GOLD,
  RGB_NAVY,
  RGB_SHADOW,
  RGB_STEEL,
  SERVICE_NODES,
  SERVICE_NODE_SIZE,
  SIGNAL_LOOPS,
  SIGNAL_SAMPLES,
  SIGNAL_SPEED_PX_PER_MS,
  SIGNAL_TAIL_PX,
  makeCamera,
  pointAtLoopDistance,
  project,
  type ApplicationNodeSpec,
  type AppType,
  type Camera,
  type CubeSpec,
  type HeroFrameState,
  type NodeIcon,
  type Rgb,
  type ServiceNodeSpec,
} from "./heroScene";
import {
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
  /** Index of currently clicked/selected service node (0..3) or null/undefined. */
  activeNode?: number | null;
}

/* ═══════════════════════════════ (a) Streets ═══════════════════════════════ */

/** Alpha of a street hairline at the centre of the plane, before the edge fade thins
 *  it. */
const STREET_ALPHA = 0.13;

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

const GRID_FADE_INNER_R = PLANE_SIZE * 0.44;
const GRID_FADE_OUTER_R = PLANE_SIZE * 0.72;
/** The gradient's middle stop: alpha at 75 % of the way from inner to outer radius. */
const GRID_FADE_MID_STOP = 0.75;
const GRID_FADE_MID_ALPHA = 0.5;

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
 * Lattice steps between avenues — the grid's pitch, halved to 2 for a fine, crisp floor grid.
 */
const GRID_LINE_STRIDE = 2;

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
const DOT_STRIDE = 1;
const FIELD_AXIS = Math.floor((DOTS_PER_AXIS - 1) / DOT_STRIDE) + 1;
const FIELD_COUNT = FIELD_AXIS * FIELD_AXIS;

/**
 * Resting radius, in plane px. Sized for crisp visual definition across the plane.
 */
const FIELD_DOT_RADIUS = 1.35;
/** How much a fully-lit dot's radius grows under cursor spotlight. */
const FIELD_RADIUS_LIFT = 0.85;

/**
 * Resting alpha at full density. Sits with clear contrast against the light void floor.
 */
const FIELD_DOT_ALPHA = 0.35;
/** How much brighter a fully-lit dot gets. */
const FIELD_ALPHA_LIFT = 1.5;
/** Ceiling alpha a dot can reach under full cursor light, at full density. */
const FIELD_ALPHA_CEILING = Math.min(1, FIELD_DOT_ALPHA * (1 + FIELD_ALPHA_LIFT));

/**
 * How far a fully-lit dot rises off the plane, in plane px.
 */
const FIELD_LIFT_HEIGHT = 32;

/** Alpha tiers the field batches into for drawing. Six steps for smooth gradient transitions. */
const FIELD_ALPHA_TIERS = 6;

/** Plane-space position of each sparse dot, sampled straight off the city's own
 *  frozen lattice (`DOT_X`/`DOT_Y`) so the field and the streets share one grid. */
const FIELD_X = new Float32Array(FIELD_COUNT);
const FIELD_Y = new Float32Array(FIELD_COUNT);
/** Base alpha per dot: `FIELD_DOT_ALPHA` scaled by the lattice's own edge-density
 *  mask (`DOT_DENSITY`), so the field dissolves at the margins cleanly. */
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
      FIELD_ALPHA[fi] = FIELD_DOT_ALPHA * (0.55 + 0.45 * DOT_DENSITY[i]!);
    }
  }
})();

/** `rgba()` string per alpha tier: steel navy for resting floor dots, shifting to gold when lit under the cursor. */
const FIELD_TIER_FILL: readonly string[] = (() => {
  const out: string[] = [];
  for (let t = 0; t < FIELD_ALPHA_TIERS; t++) {
    const frac = FIELD_ALPHA_TIERS <= 1 ? 1 : t / (FIELD_ALPHA_TIERS - 1);
    const alpha = Math.max(0.12, frac * FIELD_ALPHA_CEILING);
    if (frac > 0.5) {
      out.push(rgba(RGB_GOLD, Math.min(1, alpha * 1.2)));
    } else {
      out.push(rgba(RGB_STEEL, alpha));
    }
  }
  return out;
})();

/* ── Preallocated per-frame buffers — zero allocation in the frame path. ── */
export interface PlaneRendererState {
  fieldStretchCurrent: Float32Array;
  fieldStretchTarget: Float32Array;
  logoScreenBox: { x: number; y: number; w: number; visible: boolean };
}

export function createPlaneRendererState(): PlaneRendererState {
  return {
    fieldStretchCurrent: new Float32Array(FIELD_COUNT),
    fieldStretchTarget: new Float32Array(FIELD_COUNT),
    logoScreenBox: { x: 0.5, y: 0.6, w: 0.22, visible: false },
  };
}

const defaultPlaneRendererState = createPlaneRendererState();

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
function applyCursor(
  interaction: PlaneInteraction | undefined,
  rendererState: PlaneRendererState = defaultPlaneRendererState,
): void {
  const { fieldStretchTarget, fieldStretchCurrent } = rendererState;
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
function drawDotField(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  rendererState: PlaneRendererState = defaultPlaneRendererState,
): void {
  const { fieldStretchCurrent } = rendererState;
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
  mode: "hero" | "closure" = "hero",
): void {
  if (state.signalOpacity <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = state.signalOpacity;
  ctx.lineCap = "round";

  const loopCount = mode === "hero" ? 3 : SIGNAL_LOOPS.length;
  for (let i = 0; i < loopCount; i++) {
    const loop = SIGNAL_LOOPS[i]!;
    if (loop.totalL === 0) continue;

    for (const offset of loop.pulseOffsets) {
      const headD = (elapsed * SIGNAL_SPEED_PX_PER_MS + offset * loop.totalL) % loop.totalL;
      const headPt = pointAtLoopDistance(loop, headD);

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

      // Pulses light nearby service and application nodes as they pass.
      drawNodeGlow(ctx, cam, headPt.x, headPt.y, loop.color, mode);
    }
  }

  ctx.restore();
}

function drawNodeGlow(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  px: number,
  py: number,
  color: Rgb,
  mode: "hero" | "closure" = "hero",
): void {
  // Proximity glow on 4 primary service nodes
  for (let i = 0; i < SERVICE_NODES.length; i++) {
    const node = SERVICE_NODES[i]!;
    const dist = Math.hypot(px - node.cx, py - node.cy);
    if (dist >= 90) continue;

    const intensity = (1 - dist / 90) * 0.42;
    if (intensity <= 0.01) continue;

    const p = project(cam, node.cx, node.cy, node.elevation);
    const r = 48 * cam.scale;
    const g = ctx.createRadialGradient(p.sx, p.sy, 10 * cam.scale, p.sx, p.sy, r);
    g.addColorStop(0, rgba(color, intensity * 0.8));
    g.addColorStop(0.4, rgba(color, intensity * 0.28));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, r, 0, TAU);
    ctx.fill();
  }

  // Proximity glow on outer application nodes (closure mode only)
  if (mode !== "hero") {
    for (let i = 0; i < APPLICATION_NODES.length; i++) {
      const node = APPLICATION_NODES[i]!;
      const dist = Math.hypot(px - node.cx, py - node.cy);
      if (dist >= 90) continue;

      const intensity = (1 - dist / 90) * 0.38;
      if (intensity <= 0.01) continue;

      const isGold = node.appType === "analytics" || node.appType === "risk" || node.appType === "execution";
      const glowColor = isGold ? RGB_GOLD : RGB_STEEL;

      const p = project(cam, node.cx, node.cy, node.elevation);
      const r = 54 * cam.scale;
      const g = ctx.createRadialGradient(p.sx, p.sy, 10 * cam.scale, p.sx, p.sy, r);
      g.addColorStop(0, rgba(glowColor, intensity * 0.85));
      g.addColorStop(0.4, rgba(glowColor, intensity * 0.28));
      g.addColorStop(1, rgba(glowColor, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r, 0, TAU);
      ctx.fill();
    }
  }
}

/* ── Blocks ── */

function collectCube(
  out: Drawable[],
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  spec: CubeSpec,
  state: HeroFrameState,
  interaction?: PlaneInteraction,
  elapsed: number = 0,
): void {
  const base: Rgb = spec.type === "navy" ? RGB_NAVY : RGB_GOLD;
  const x0 = spec.c * GRID_CELL + GRID_OFFSET;
  const y0 = spec.r * GRID_CELL + GRID_OFFSET;
  const x1 = x0 + GRID_CELL;
  const y1 = y0 + GRID_CELL;
  const cx = x0 + GRID_CELL / 2;
  const cy = y0 + GRID_CELL / 2;

  const lit = interaction !== undefined && interaction.pointerActive && interaction.strength > 0;
  const falloff = lit ? cursorFalloff(cx - interaction.lightX, cy - interaction.lightY, CURSOR_RADIUS) : 0;
  const stretch = lit && falloff > 0 ? skylineStretch(falloff, interaction.strength, interaction.velocity) : 0;

  // Active node reactive behavior across all 16 boxes
  let activeStretch = 0;
  let activeHighlight = 0;
  if (interaction?.activeNode !== undefined && interaction.activeNode !== null) {
    const activeIdx = interaction.activeNode;
    const targetNode = SERVICE_NODES[activeIdx];
    if (targetNode) {
      const dist = Math.hypot(cx - targetNode.cx, cy - targetNode.cy);
      if (activeIdx === 0) {
        // Node 0: Quant R&D wave
        activeStretch = Math.sin(dist * 0.035 - elapsed * 0.004) * 0.4 + 0.4;
        activeHighlight = 0.32;
      } else if (activeIdx === 1) {
        // Node 1: Systematic Execution stepped matrix
        activeStretch = dist < 240 ? 0.65 : 0.25;
        activeHighlight = dist < 240 ? 0.38 : 0.15;
      } else if (activeIdx === 2) {
        // Node 2: Data Fabric dual-tier cascade
        activeStretch = ((spec.c + spec.r) % 2 === 0 ? 0.55 : 0.2) + Math.sin(elapsed * 0.005 + dist * 0.02) * 0.15;
        activeHighlight = 0.34;
      } else if (activeIdx === 3) {
        // Node 3: High-Availability Fortress perimeter
        const isPerimeter = spec.c === 0 || spec.c === 21 || spec.r === 0 || spec.r === 21;
        activeStretch = isPerimeter ? 0.7 : 0.2;
        activeHighlight = isPerimeter ? 0.45 : 0.15;
      }
    }
  }

  const totalStretch = Math.max(stretch, activeStretch * (1 - state.flatten));
  const highlight = Math.max(falloff * (interaction?.strength ?? 0) * 0.28, activeHighlight);

  // Extrusion collapses linearly with flatten, lifts reactively under cursor spotlight / active node.
  const hz = Math.max(0, spec.h * (1 - state.flatten) * (1 + totalStretch * 0.32));
  const centre = project(cam, cx, cy, hz);

  out.push({
    depth: centre.depth,
    draw: () => {
      if (state.sideOpacity > 0.01) {
        blitShadow(
          ctx, cam,
          cx, cy,
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
          shade(base, 0.12 + highlight * 0.4), shade(base, -0.32 + highlight * 0.2),
        );
        gradientQuad(
          ctx, cam,
          [[x0, y1, hz], [x1, y1, hz], [x1, y1, 0], [x0, y1, 0]],
          shade(base, -0.12 + highlight * 0.3), shade(base, -0.5 + highlight * 0.1),
        );
        ctx.globalAlpha = 1;
      }

      if (state.topOpacity > 0.01) {
        ctx.globalAlpha = state.topOpacity;
        gradientQuad(
          ctx, cam,
          [[x0, y0, hz], [x1, y0, hz], [x1, y1, hz], [x0, y1, hz]],
          shade(base, (0.32 + highlight) * state.sideOpacity),
          shade(base, (0.05 + highlight * 0.6) * state.sideOpacity),
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
  interaction?: PlaneInteraction,
  elapsed: number = 0,
  nodeIdx: number = 0,
): void {
  const half = SERVICE_NODE_SIZE / 2;
  const x0 = spec.cx - half;
  const y0 = spec.cy - half;
  const x1 = spec.cx + half;
  const y1 = spec.cy + half;

  const lit = interaction !== undefined && interaction.pointerActive && interaction.strength > 0;
  const falloff = lit ? cursorFalloff(spec.cx - interaction.lightX, spec.cy - interaction.lightY, CURSOR_RADIUS) : 0;
  const stretch = lit && falloff > 0 ? skylineStretch(falloff, interaction.strength, interaction.velocity) : 0;
  const isActive = interaction?.activeNode === nodeIdx;
  const highlight = Math.max(falloff * (interaction?.strength ?? 0) * 0.32, isActive ? 0.45 : 0);

  const ez = Math.max(0, spec.elevation * (1 - state.flatten) * (1 + (isActive ? 0.35 : stretch * 0.2)));
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
          const r = Math.min(255, Math.round(6 + (10 - 6) * ratio + highlight * 25));
          const g = Math.min(255, Math.round(14 + (24 - 14) * ratio + highlight * 35));
          const b = Math.min(255, Math.round(32 + (51 - 32) * ratio + highlight * 20));
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
        ctx.fillStyle = shade(RGB_NAVY, -0.62 + highlight * 0.35);
        ctx.fill();

        // Outer glow, standing in for the old `boxShadow: 0 0 28px gold@0.5`.
        if (state.sideOpacity > 0.05) {
          ctx.save();
          ctx.lineWidth = (6 + highlight * 4) * cam.scale;
          ctx.strokeStyle = rgba(RGB_GOLD, Math.min(1, (0.18 + highlight * 0.4) * state.sideOpacity));
          ctx.stroke();
          ctx.restore();
        }

        // Active node beacon halo ring
        if (isActive) {
          ctx.save();
          const haloR = (SERVICE_NODE_SIZE * 0.65 + Math.sin(elapsed * 0.006) * 3) * cam.scale;
          ctx.lineWidth = 2.5 * cam.scale;
          ctx.strokeStyle = rgba(RGB_GOLD, 0.95);
          ctx.beginPath();
          ctx.arc(centre.sx, centre.sy, haloR, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }

        ctx.lineWidth = (isActive ? 2.5 : 2) * cam.scale;
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

/* ── Outer application nodes ── */

function collectApplicationNode(
  out: Drawable[],
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  spec: ApplicationNodeSpec,
  state: HeroFrameState,
  interaction?: PlaneInteraction,
): void {
  const w = spec.width ?? APP_NODE_WIDTH;
  const h = spec.height ?? APP_NODE_HEIGHT;
  const radius = spec.radius ?? APP_NODE_RADIUS;
  const elevation = spec.elevation ?? APP_NODE_ELEVATION;

  const halfW = w / 2;
  const halfH = h / 2;
  const x0 = spec.cx - halfW;
  const y0 = spec.cy - halfH;
  const x1 = spec.cx + halfW;
  const y1 = spec.cy + halfH;

  const lit = interaction !== undefined && interaction.pointerActive && interaction.strength > 0;
  const falloff = lit ? cursorFalloff(spec.cx - interaction.lightX, spec.cy - interaction.lightY, CURSOR_RADIUS) : 0;
  const stretch = lit && falloff > 0 ? skylineStretch(falloff, interaction.strength, interaction.velocity) : 0;
  const highlight = falloff * (interaction?.strength ?? 0) * 0.32;

  const isGold = spec.appType === "analytics" || spec.appType === "risk" || spec.appType === "execution";
  const accentRgb = isGold ? RGB_GOLD : RGB_STEEL;

  const ez = Math.max(0, elevation * (1 - state.flatten) * (1 + stretch * 0.22));
  const centre = project(cam, spec.cx, spec.cy, ez);

  out.push({
    depth: centre.depth,
    draw: () => {
      if (state.sideOpacity > 0.01) {
        blitShadow(ctx, cam, spec.cx, spec.cy, Math.max(w, h) * 0.85, state.sideOpacity * 0.8);
      }

      // Stacked rounded slabs extrusion for the application node (flat low-profile plate)
      if (state.sideOpacity > 0.01 && ez > 0.5) {
        ctx.globalAlpha = state.sideOpacity;
        const numSlabs = Math.max(2, Math.round(5 * (1 - state.flatten)));
        for (let i = 0; i < numSlabs; i++) {
          const z = (i / (numSlabs - 1)) * ez;
          const ratio = i / (numSlabs - 1);
          const r = Math.min(255, Math.round(6 + (12 - 6) * ratio + highlight * 20));
          const g = Math.min(255, Math.round(14 + (28 - 14) * ratio + highlight * 30));
          const b = Math.min(255, Math.round(36 + (60 - 36) * ratio + highlight * 25));
          traceRoundedPlaneRect(ctx, cam, x0, y0, x1, y1, z, radius);
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      if (state.topOpacity > 0.01) {
        const top = ez + 2.0;
        ctx.globalAlpha = state.topOpacity;

        traceRoundedPlaneRect(ctx, cam, x0, y0, x1, y1, top, radius);
        ctx.fillStyle = shade(RGB_NAVY, -0.62 + highlight * 0.35);
        ctx.fill();

        // Crisp luminous border (gold for analytics/risk/execution, steel for trading/pipeline/telemetry)
        ctx.lineWidth = 1.8 * cam.scale;
        ctx.strokeStyle = rgba(accentRgb, 0.9);
        ctx.stroke();

        // Subtle ambient glow edge
        if (state.sideOpacity > 0.05) {
          ctx.save();
          ctx.lineWidth = 4.0 * cam.scale;
          ctx.strokeStyle = rgba(accentRgb, Math.min(1, (0.16 + highlight * 0.35) * state.sideOpacity));
          ctx.stroke();
          ctx.restore();
        }

        drawAppNodeIcon(ctx, cam, spec.cx, spec.cy, top, spec.appType, accentRgb);
        ctx.globalAlpha = 1;
      }
    },
  });
}

/**
 * Application vector glyphs rendered on the top face of outer application nodes.
 */
function drawAppNodeIcon(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  cx: number,
  cy: number,
  z: number,
  appType: AppType,
  accentColor: Rgb = RGB_GOLD,
): void {
  // 24x24 viewBox rendered at 26px on plane
  const u = 26 / 24;
  const toPlane = (vx: number, vy: number) => ({ x: cx + (vx - 12) * u, y: cy + (vy - 12) * u });

  const strokes: Record<AppType, readonly (readonly (readonly [number, number])[])[]> = {
    analytics: [
      [[4, 20], [20, 20]],
      [[6, 16], [10, 10], [14, 13], [19, 7]],
      [[15, 7], [19, 7], [19, 11]],
    ],
    trading: [
      [[7, 4], [7, 20]],
      [[5, 8], [9, 8]],
      [[5, 14], [9, 14]],
      [[17, 4], [17, 20]],
      [[15, 6], [19, 6]],
      [[15, 16], [19, 16]],
    ],
    pipeline: [
      [[4, 12], [20, 12]],
      [[7, 8], [7, 16]],
      [[12, 6], [12, 18]],
      [[17, 8], [17, 16]],
    ],
    risk: [
      [[12, 3], [19, 6], [19, 13], [12, 21], [5, 13], [5, 6], [12, 3]],
      [[12, 8], [12, 16]],
    ],
    execution: [
      [[13, 2], [6, 13], [12, 13], [11, 22], [18, 11], [12, 11], [13, 2]],
    ],
    telemetry: [
      [[12, 12], [12, 12.01]],
      [[8, 8], [12, 6], [16, 8]],
      [[5, 5], [12, 2], [19, 5]],
      [[8, 16], [12, 18], [16, 16]],
      [[5, 19], [12, 22], [19, 19]],
    ],
  };

  ctx.lineWidth = 2.0 * u * cam.scale;
  ctx.strokeStyle = rgba(accentColor, 0.95);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const poly of strokes[appType]) {
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
 * One sort per frame over the cubes, service nodes, and outer application nodes.
 * Skipped entirely once the scene is flat — there is no depth left to sort by, and nothing has height to show.
 */
function drawSceneObjects(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  state: HeroFrameState,
  interaction?: PlaneInteraction,
  elapsed: number = 0,
  mode: "hero" | "closure" = "hero",
): void {
  if (state.flat) return;
  drawables.length = 0;
  for (const cube of CUBE_POSITIONS) collectCube(drawables, ctx, cam, cube, state, interaction, elapsed);
  for (let i = 0; i < SERVICE_NODES.length; i++) {
    collectNode(drawables, ctx, cam, SERVICE_NODES[i]!, state, interaction, elapsed, i);
  }
  if (mode !== "hero") {
    for (const appNode of APPLICATION_NODES) {
      collectApplicationNode(drawables, ctx, cam, appNode, state, interaction);
    }
  }
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
 * Read-only view of the P's current screen box, as fractions of the canvas
 * (`x`/`y` the mark's centre-x and ground-contact-y, `w` its width). `null` if
 * nothing has drawn a logo frame yet.
 */
export function getLogoScreenBox(rendererState?: PlaneRendererState): { x: number; y: number; w: number } | null {
  const box = rendererState?.logoScreenBox ?? defaultPlaneRendererState.logoScreenBox;
  return box.visible ? box : null;
}

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
function drawLogo(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  state: HeroFrameState,
  w: number,
  h: number,
  rendererState: PlaneRendererState = defaultPlaneRendererState,
): void {
  const image = getLogoImage();
  const box = rendererState.logoScreenBox;
  if (!image || state.logoHidden) {
    box.visible = false;
    return;
  }

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

  // P exit animation's opacity, needed here too: once the mark has dropped out
  // (progress 0.86 → 0.89, see `pExitProgress` in heroVars.ts) there is nothing
  // on screen for DOM chrome to anchor against, so the screen box below stops
  // publishing rather than reporting a stale position under an invisible mark.
  const pOpacity = Math.max(0, 1 - state.pexit);

  // Publish the mark's screen box for `SuperHeroSequence.tsx`'s DOM chrome
  // (`getLogoScreenBox`, above).
  //
  // `(cx, cy)` is the sprite's own CENTRE — `drawImageOnPlane` spans it
  // `±w/2`/`±h/2`, exactly as its own `bl = project(cam, cx - w/2, cy + h/2,
  // z)` corner does — so the first cut of this anchor, `project(cam, cx, cy,
  // 0)`, put the anchor at the P's vertical *middle*, not its bottom: the
  // motto rendered on top of the glyph instead of under it. `cy + lh / 2`
  // is the same bottom-edge offset `drawImageOnPlane`'s own `bl` corner
  // uses, at `z = 0` (the base of the extrusion, which projects to the
  // lowest screen point among the stacked layers — see the module comment
  // on `+z lifts -y on screen`).
  //
  // `x` and `y` are projected from two DIFFERENT plane points, not one:
  // `rotateZ` mixes the plane's x and y axes together before anything else
  // happens (`rx1 = px*cosZ - py*sinZ`), so projecting the bottom-edge point
  // `(cx, cy + lh/2)` for both coordinates pulled `sx` sideways by the same
  // rotation that makes the scene read as isometric — correct 3D, wrong
  // answer for "what x is this glyph centred on". `centre.sx` (the untilted
  // centre point) is what a viewer's eye calls the mark's own centreline;
  // `bottom.sy` is the lowest point of the base layer. Split the two.
  //
  // `lw * cam.scale` converts the plane-space width to screen pixels the
  // same way `shift` above converts the wordmark's screen-space inset the
  // other direction. An approximation, not a rasterised bounding box:
  // sufficient for "roughly under the mark," which is all a DOM element
  // positioned in fractions of the canvas needs.
  if (pOpacity > 0.001) {
    const centre = project(cam, cx, cy, 0);
    // `0.62`, not `0.5`: the P's own hook curls below a naive symmetric
    // bounding box (it is a swash, not a rectangle), so half the sprite
    // height undershoots the glyph's actual lowest pixel. Measured against
    // the screenshot at rest, not derived — a margin, same spirit as the
    // logo mask's own asymmetric bounds.
    const bottom = project(cam, cx, cy + lh * 0.62, 0);
    box.x = centre.sx / w;
    box.y = bottom.sy / h;
    box.w = (lw * cam.scale) / w;
    box.visible = true;
  } else {
    box.visible = false;
  }

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
  // `pOpacity` itself is computed above, alongside the screen-box publish.
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
 * Horizontal and vertical fit divisors for tight framing (Top Hero) vs wide framing (Closure fully zoomed-out).
 *
 * - `TIGHT_FIT_X = 1.36`, `TIGHT_FIT_Y = 1.05`: Frames the inner 22x22 core cluster and ensures outer nodes remain off-screen.
 * - `WIDE_FIT_X = 1.85`, `WIDE_FIT_Y = 1.40`: Frames the full 30x30 scene for 100% viewport containment of outer nodes.
 * - `VIEW_FIT_X / VIEW_FIT_Y / VIEW_FIT`: Exported defaults for backward compatibility.
 */
export const TIGHT_FIT_X = 1.36;
export const TIGHT_FIT_Y = 1.05;
export const WIDE_FIT_X = 1.85;
export const WIDE_FIT_Y = 1.40;
export const VIEW_FIT_X = WIDE_FIT_X;
export const VIEW_FIT_Y = WIDE_FIT_Y;
export const VIEW_FIT = WIDE_FIT_Y;

/**
 * Tight view scale calculation (Top Hero and Closure section at progress=0).
 */
export function calcTightViewScale(w: number, h: number): number {
  if (w <= 0 || h <= 0) return 0;
  return Math.min(w / TIGHT_FIT_X, h / TIGHT_FIT_Y) / PLANE_SIZE;
}

/**
 * Wide view scale calculation that guarantees 100% viewport containment of all outer nodes.
 */
export function calcWideViewScale(w: number, h: number): number {
  if (w <= 0 || h <= 0) return 0;
  return Math.min(w / WIDE_FIT_X, h / WIDE_FIT_Y) / PLANE_SIZE;
}

/**
 * Interpolated camera scale for closure zoom-out across scroll progress p in [0, 1].
 * Strictly decreasing in p from calcTightViewScale at p=0 to calcWideViewScale at p=1.
 */
export function calcClosureViewScale(w: number, h: number, p: number): number {
  if (w <= 0 || h <= 0) return 0;
  const clampedP = Math.max(0, Math.min(1, p));
  const tight = calcTightViewScale(w, h);
  const wide = calcWideViewScale(w, h);
  return tight * (1 - clampedP) + wide * clampedP;
}

/**
 * Backward compatibility alias for calcWideViewScale.
 */
export const calcViewScale = calcWideViewScale;

/**
 * Where the plane's centre sits vertically in the viewport, as a fraction of its
 * height. Dead centre — see `drawPlaneFrame`'s note. Exported so `HeroCanvas.tsx`
 * builds a byte-identical camera for its screen→plane unprojection; a disagreement
 * there is invisible until the cursor lights the wrong part of the scene.
 */
export const HORIZON = 0.5;

export interface DrawPlaneOptions {
  mode?: "hero" | "closure";
  zoomProgress?: number;
  showLogo?: boolean;
  viewScale?: number;
  rendererState?: PlaneRendererState;
}

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
  options?: DrawPlaneOptions,
): void {
  ctx.clearRect(0, 0, w, h);
  if (w <= 0 || h <= 0) return;

  const mode = options?.mode ?? "hero";
  const zoomProgress = options?.zoomProgress ?? 0;
  const viewScale =
    options?.viewScale ??
    (mode === "closure"
      ? calcClosureViewScale(w, h, zoomProgress)
      : calcTightViewScale(w, h));

  const rState = options?.rendererState ?? defaultPlaneRendererState;

  const cam = makeCamera(
    state.flatten,
    w / 2,
    h * HORIZON,
    viewScale,
    interaction?.tiltX ?? 0,
    interaction?.tiltY ?? 0,
  );

  applyCursor(interaction, rState);

  drawStreets(ctx, cam, state);
  drawDotField(ctx, cam, rState);
  drawSignals(ctx, cam, state, elapsed, mode);
  drawSceneObjects(ctx, cam, state, interaction, elapsed, mode);

  const shouldDrawLogo = options?.showLogo ?? (mode === "hero");
  if (shouldDrawLogo) {
    drawLogo(ctx, cam, state, w, h, rState);
  } else {
    rState.logoScreenBox.visible = false;
  }
}
