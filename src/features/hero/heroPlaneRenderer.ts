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
  PLANE_SIZE,
  RGB_FROST,
  RGB_GOLD,
  RGB_SHADOW,
  makeCamera,
  project,
  type Camera,
  type HeroFrameState,
  type Rgb,
} from "./heroScene";
import {
  AVENUE_SPACING,
  DOTS_PER_AXIS,
  DOT_DENSITY,
  DOT_STEP,
  DOT_X,
  DOT_Y,
  HORIZON,
  RGB_SHADOW_NAVY,
  SHADOW_DIR,
  VIEW_FIT,
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

/** Alpha of a street hairline on the ground plane. Identical to the city's. */
const STREET_ALPHA = 0.095;

/**
 * The avenues, as stroked lines on the ground plane.
 *
 * Ported unchanged from `heroCityRenderer.ts`. A field of dots at a uniform lattice
 * pitch has no perspective cue of its own — nothing converges, nothing establishes a
 * floor — and an early cut of this exact scene without any lines read as a beautiful
 * abstract point cloud rather than as a place (`docs/hero-upgrade/dawn-halftone.md`).
 * Losing the buildings does not change that; the plane still needs its floor.
 */
function drawStreets(ctx: CanvasRenderingContext2D, cam: Camera, state: HeroFrameState): void {
  const [r, g, b] = RGB_SHADOW_NAVY;
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${STREET_ALPHA})`;
  ctx.lineWidth = Math.max(0.5, cam.scale * 0.8);
  ctx.beginPath();
  const span = (DOTS_PER_AXIS - 1) * DOT_STEP + DOT_STEP / 2;
  for (let n = 0; n < DOTS_PER_AXIS; n += AVENUE_SPACING) {
    const t = n * DOT_STEP + DOT_STEP / 2;
    const a = project(cam, t, DOT_STEP / 2, 0);
    const bEnd = project(cam, t, span, 0);
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(bEnd.sx, bEnd.sy);
    const c = project(cam, DOT_STEP / 2, t, 0);
    const d = project(cam, span, t, 0);
    ctx.moveTo(c.sx, c.sy);
    ctx.lineTo(d.sx, d.sy);
  }
  ctx.globalAlpha = 1 - 0.5 * state.flatten;
  ctx.stroke();
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

/* ═══════════════════════════════ (c) The flat 3D P ═══════════════════════════════ */

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
 * (`layers` below) never draws more than `round(8 * (1 - flatten))`, i.e. never more
 * than 8 — so 8 precomputed steps make the stack exact at full 3D and merely coarser
 * (never wrong) as `flatten` thins the layer count down.
 */
const LOGO_LAYERS = 8;
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
 * **The one deliberate change from the ported code.** The pre-lattice renderer set
 * `ctx.filter = "brightness(...)"` per blit, which is a filter pass the compositor
 * pays for on every one of up to 8 layers, every animated frame the pin is
 * scrolling. The darkness steps are a pure function of layer index and the image
 * never changes after it decodes, so there is no reason to pay that cost more than
 * once. `ctx.filter` still appears below — but only here, at bake time, never in
 * `drawLogo`'s per-frame loop.
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
    if (brightness >= 0.999) {
      // The top of the stack is the undarkened source — byte-identical to what
      // `filter: brightness(1)` produces, without paying for the filter.
      ctx.drawImage(image, 0, 0, w, h);
    } else {
      ctx.filter = `brightness(${brightness.toFixed(3)})`;
      ctx.drawImage(image, 0, 0, w, h);
      ctx.filter = "none";
    }
    out.push(c);
  }

  logoLayerSprites = out;
  logoLayerSource = image;
  return out;
}

/** Magnitude of the mark's own shadow offset, in plane px. Matches the pre-lattice
 *  renderer's ad-hoc `(-12, 12)` offset in size (`hypot(12, 12) ≈ 17`) — only the
 *  direction changes, from an arbitrary up-left to `SHADOW_DIR`. */
const P_SHADOW_OFFSET = 17;

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
  const shift = mobile ? 160 : w < 900 ? 200 : 260;

  const lw = baseW * (mobile ? 1 - state.moveLeft * 0.25 : 1);
  const lh = lw * getLogoAspect();

  const cx = PLANE_SIZE / 2 - (mobile ? 0 : state.moveLeft * shift);
  const cy = PLANE_SIZE / 2 - (mobile ? state.moveLeft * shift : 0);

  // Ground contact shadow beneath the 3D mark while the scene still has depth: a
  // soft radial pool plus a tighter, darker shadow thrown along `SHADOW_DIR` — the
  // same directional dawn sun every other shadow in the scene answers to. The
  // pre-lattice renderer threw this second shadow toward a fixed, arbitrary
  // up-left offset; that disagreed with the sun everywhere else in the frame, and
  // fixing the direction (not the presence) is the whole change here.
  if (state.sideOpacity > 0.01) {
    blitShadow(ctx, cam, cx, cy, lw * 0.7, 0.45 * state.sideOpacity);
    blitShadow(
      ctx, cam,
      cx + SHADOW_DIR.x * P_SHADOW_OFFSET,
      cy + SHADOW_DIR.y * P_SHADOW_OFFSET,
      lw * 0.55,
      0.6 * state.sideOpacity,
    );
  }

  // Extrusion: successive blits climbing in z, back-to-front, darkening down the
  // stack. `layers` shrinks as the scene flattens, same as the pre-lattice renderer.
  const lift = 10 * (1 - state.flatten);
  const layers = Math.max(1, Math.round(8 * (1 - state.flatten)));
  const layerSprites = ensureLogoLayers(image);

  // P exit animation: drop down & fade out (pexit: 0 -> 1). Ported unchanged.
  const pOpacity = Math.max(0, 1 - state.pexit);
  if (pOpacity > 0.001) {
    const pDropY = state.pexit * 60;
    const pScale = 1 - state.pexit * 0.15;
    ctx.save();
    for (let i = 0; i < layers; i++) {
      const z = (i / Math.max(1, layers)) * lift;
      const isTop = i === layers - 1;
      const ratio = layers > 1 ? i / (layers - 1) : 1;
      const spriteIndex = Math.min(LOGO_LAYERS - 1, Math.round(ratio * (LOGO_LAYERS - 1)));
      ctx.globalAlpha = pOpacity * (isTop ? 1 : 0.8);
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
 * Paint one frame of the plane.
 *
 * `w`/`h` are CSS pixels; the caller owns the DPR transform. Pure in `elapsed` — the
 * plane has nothing left that animates against wall-clock time (the city's signal
 * pulses go with it) — which is exactly what keeps `elapsed = 0` a valid resting
 * frame for `paintStill()`.
 */
export function drawPlaneFrame(
  ctx: CanvasRenderingContext2D,
  state: HeroFrameState,
  w: number,
  h: number,
  _elapsed: number,
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
  drawLogo(ctx, cam, state, w);
}
