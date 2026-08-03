/**
 * Canvas renderer for the hero scene — the draw half of the canvas hero.
 *
 * Pure in the sense that matters: it owns no React state and reads nothing but its
 * arguments. One `drawHeroFrame` call paints an entire frame that used to cost ~250
 * DOM nodes, 43 `filter: blur()` layers and 30 nested `preserve-3d` contexts.
 *
 * Where the old DOM version leaned on the compositor, this leans on cached bitmaps:
 *  - the grid field is rasterised once and blitted,
 *  - cube and node drop shadows are one pre-blurred sprite, reused with alpha,
 *  - the logo SVG is decoded once and blitted N times to build extrusion depth,
 *    replacing the 14 stacked <img> copies of the same 26 KB file.
 */

import {
  CUBE_POSITIONS,
  GRID_CELL,
  GRID_CELLS,
  PLANE_SIZE,
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
  type HeroFrameState,
  type NodeIcon,
  type Rgb,
} from "./heroScene";

/* ─────────────────────────────── Sprites ─────────────────────────────── */

export interface HeroSprites {
  /** The brand mark, decoded once. Null until it loads (or if it failed). */
  logo: CanvasImageSource | null;
  logoAspect: number;
  /** Pre-blurred radial shadow blob, drawn scaled wherever a soft shadow is needed. */
  shadow: HTMLCanvasElement;
  /** The static grid field, rasterised at plane resolution. */
  grid: HTMLCanvasElement;
}

/** Corner radius of a service node's faces — `borderRadius: 14px` in the DOM version. */
const NODE_RADIUS = 14;

function rgba(c: Rgb, a: number): string {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
}

/**
 * A soft radial blob used for every cast shadow in the scene. Rasterised once at 128px
 * and stretched at draw time — replacing 43 live `filter: blur()` layers, each of which
 * the compositor had to re-rasterise whenever its opacity changed.
 */
function buildShadowSprite(): HTMLCanvasElement {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  // Stops transcribed from the cube cast shadow at HeroSignalP.tsx:369 — a tighter
  // falloff than a plain radial, so the blob reads as contact shadow rather than haze.
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, rgba(RGB_SHADOW, 0.45));
  g.addColorStop(0.4, rgba(RGB_SHADOW, 0.22));
  g.addColorStop(0.7, rgba(RGB_SHADOW, 0.06));
  g.addColorStop(1, rgba(RGB_SHADOW, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/**
 * The isometric grid field. The old version was two full-bleed CSS gradient layers with
 * radial masks, re-composited every frame; here it is one bitmap drawn once.
 */
function buildGridSprite(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = PLANE_SIZE;
  c.height = PLANE_SIZE;
  const ctx = c.getContext("2d");
  if (!ctx) return c;

  ctx.strokeStyle = rgba(RGB_NAVY, 0.11);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= GRID_CELLS; i++) {
    const p = i * GRID_CELL + 0.5;
    ctx.moveTo(p, 0);
    ctx.lineTo(p, PLANE_SIZE);
    ctx.moveTo(0, p);
    ctx.lineTo(PLANE_SIZE, p);
  }
  ctx.stroke();

  // Radial fade so the field dissolves at its edges, matching the old mask-image.
  const mask = ctx.createRadialGradient(
    PLANE_SIZE / 2, PLANE_SIZE / 2, PLANE_SIZE * 0.3,
    PLANE_SIZE / 2, PLANE_SIZE / 2, PLANE_SIZE * 0.52,
  );
  mask.addColorStop(0, "rgba(0,0,0,1)");
  mask.addColorStop(0.7, "rgba(0,0,0,0.4)");
  mask.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, PLANE_SIZE, PLANE_SIZE);
  ctx.globalCompositeOperation = "source-over";

  return c;
}

/**
 * Build the sprite set. The logo decode is async; the renderer draws without it until
 * it resolves, so a slow or failed SVG fetch degrades to "no logo" rather than blocking
 * the first frame.
 */
export function createSprites(logoSrc: string): { sprites: HeroSprites; ready: Promise<void> } {
  const sprites: HeroSprites = {
    logo: null,
    logoAspect: 1,
    shadow: buildShadowSprite(),
    grid: buildGridSprite(),
  };

  const ready = new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      sprites.logo = img;
      sprites.logoAspect = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 1;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = logoSrc;
  });

  return { sprites, ready };
}

/* ───────────────────────────── Primitives ───────────────────────────── */

/** Trace a projected polygon without filling or stroking it. */
function tracePoly(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  pts: readonly [number, number, number][],
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
 * Fill a projected quad with a linear gradient running from its first to its third
 * corner — the projected stand-in for the old faces' `linear-gradient(...) , baseColor`
 * backgrounds (HeroSignalP.tsx:349-351).
 */
function gradientQuad(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  pts: readonly [number, number, number][],
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
 * The corners are rounded in *plane* space and then projected, so the radius skews with
 * the camera the way the old `borderRadius: 14px` on a `preserve-3d` child did. Each
 * corner is approximated by a short arc of projected points — canvas has no primitive
 * for "rounded rect under an arbitrary affine transform".
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
  // Corner centres, and the angle each corner sweeps through.
  const corners: readonly [number, number, number][] = [
    [x1 - r, y0 + r, -Math.PI / 2], // top-right
    [x1 - r, y1 - r, 0],            // bottom-right
    [x0 + r, y1 - r, Math.PI / 2],  // bottom-left
    [x0 + r, y0 + r, Math.PI],      // top-left
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
  const r = Math.round(c[0] + (target - c[0]) * k);
  const g = Math.round(c[1] + (target - c[1]) * k);
  const b = Math.round(c[2] + (target - c[2]) * k);
  return `rgb(${r}, ${g}, ${b})`;
}

/* ─────────────────────────────── Drawing ─────────────────────────────── */

interface Drawable {
  depth: number;
  draw: () => void;
}

/**
 * Paint one frame.
 *
 * `w`/`h` are CSS pixels; the caller is responsible for having applied the DPR
 * transform. `elapsed` drives the signal pulses.
 */
export function drawHeroFrame(
  ctx: CanvasRenderingContext2D,
  state: HeroFrameState,
  sprites: HeroSprites,
  w: number,
  h: number,
  elapsed: number,
): void {
  ctx.clearRect(0, 0, w, h);

  // Fit the plane to the viewport the way the old fixed-size container did.
  const viewScale = Math.min(w, h) / (PLANE_SIZE * 0.86);
  const cam = makeCamera(state.flatten, w / 2, h / 2, viewScale);

  drawGrid(ctx, cam, sprites, state);
  drawSignals(ctx, cam, state, elapsed);

  if (!state.flat) {
    // Painter's algorithm: everything standing on the plane, sorted back to front.
    const items: Drawable[] = [];
    for (const cube of CUBE_POSITIONS) collectCube(items, ctx, cam, cube, state, sprites);
    for (const node of SERVICE_NODES) collectNode(items, ctx, cam, node, state, sprites);
    items.sort((a, b) => a.depth - b.depth);
    for (const item of items) item.draw();
  }

  drawLogo(ctx, cam, sprites, state, w);
}

/* ── Grid ── */

function drawGrid(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  _sprites: HeroSprites,
  state: HeroFrameState,
): void {
  if (state.gridOpacity <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = state.gridOpacity;
  ctx.strokeStyle = rgba(RGB_NAVY, 0.11);
  ctx.lineWidth = 1;

  ctx.beginPath();
  for (let i = 0; i <= GRID_CELLS; i++) {
    const pos = i * GRID_CELL;
    // Vertical grid line from y=0 to y=PLANE_SIZE at x=pos
    const p1 = project(cam, pos, 0, 0);
    const p2 = project(cam, pos, PLANE_SIZE, 0);
    ctx.moveTo(p1.sx, p1.sy);
    ctx.lineTo(p2.sx, p2.sy);

    // Horizontal grid line from x=0 to x=PLANE_SIZE at y=pos
    const p3 = project(cam, 0, pos, 0);
    const p4 = project(cam, PLANE_SIZE, pos, 0);
    ctx.moveTo(p3.sx, p3.sy);
    ctx.lineTo(p4.sx, p4.sy);
  }
  ctx.stroke();
  ctx.restore();
}

/* ── Signals ── */

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

      // Outer glow, then inner core — same two-pass stroke as the original.
      ctx.lineWidth = 14 * cam.scale;
      ctx.strokeStyle = rgba(loop.color, 0.22);
      ctx.stroke();
      ctx.lineWidth = 5.5 * cam.scale;
      ctx.strokeStyle = rgba(loop.color, 0.95);
      ctx.stroke();

      // Gold pulses light up the service nodes as they pass.
      if (loop.color === RGB_GOLD) {
        drawNodeGlow(ctx, cam, loop.totalL, headD);
      }
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
    ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ── Cubes ── */

function collectCube(
  out: Drawable[],
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  spec: { c: number; r: number; h: number; type: "gold" | "navy" },
  state: HeroFrameState,
  sprites: HeroSprites,
): void {
  const base: Rgb = spec.type === "navy" ? RGB_NAVY : RGB_GOLD;
  const x0 = spec.c * GRID_CELL;
  const y0 = spec.r * GRID_CELL;
  const x1 = x0 + GRID_CELL;
  const y1 = y0 + GRID_CELL;
  // HeroSignalP.tsx:346 — extrusion collapses linearly with flatten.
  const hz = Math.max(0, spec.h * (1 - state.flatten));
  const centre = project(cam, x0 + GRID_CELL / 2, y0 + GRID_CELL / 2, hz);

  out.push({
    depth: centre.depth,
    draw: () => {
      // Ground shadow.
      if (state.sideOpacity > 0.01) {
        blitShadow(ctx, cam, sprites, x0 + GRID_CELL / 2, y0 + GRID_CELL / 2, GRID_CELL * 1.5, state.sideOpacity * 0.9);
      }

      // Side walls, only while there is height to show. Each carries the same
      // top-light / bottom-dark ramp the CSS gradients did (HeroSignalP.tsx:350-351).
      if (state.sideOpacity > 0.01 && hz > 1) {
        ctx.globalAlpha = state.sideOpacity;
        // Left wall (-x): highlight at the top edge, 0.32 darkening at the foot.
        gradientQuad(
          ctx, cam,
          [[x0, y0, hz], [x0, y1, hz], [x0, y1, 0], [x0, y0, 0]],
          shade(base, 0.12), shade(base, -0.32),
        );
        // Right wall (+y): shaded from the start, 0.5 darkening at the foot.
        gradientQuad(
          ctx, cam,
          [[x0, y1, hz], [x1, y1, hz], [x1, y1, 0], [x0, y1, 0]],
          shade(base, -0.12), shade(base, -0.5),
        );
        ctx.globalAlpha = 1;
      }

      // Top face — white overlay fading 0.32 → 0.05 over the base colour, matching
      // `topBg` at HeroSignalP.tsx:349.
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
  spec: { cx: number; cy: number; elevation: number; icon: NodeIcon },
  state: HeroFrameState,
  sprites: HeroSprites,
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
        blitShadow(ctx, cam, sprites, spec.cx, spec.cy, SERVICE_NODE_SIZE * 1.6, state.sideOpacity);
      }

      // Stacked rounded rectangle extrusion slabs matching original ElevatedServiceNode
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

        // Rounded top face with its gold accent border — `borderRadius: 14px` and
        // `border: 2px solid gold` at HeroSignalP.tsx:525-527. Traced once, filled and
        // stroked, so the radius skews with the camera.
        traceRoundedPlaneRect(ctx, cam, x0, y0, x1, y1, top, NODE_RADIUS);
        ctx.fillStyle = "rgb(10, 24, 51)";
        ctx.fill();

        // Outer glow, standing in for `boxShadow: 0 0 28px gold@0.5`.
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
 * The four service glyphs, drawn in the projected plane so they sit flat on the node's
 * top face. Paths are transcribed from the inline SVGs the old nodes rendered.
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

  const strokes: Record<NodeIcon, readonly (readonly [number, number][])[]> = {
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

/* ── Shadow blit ── */

function blitShadow(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  sprites: HeroSprites,
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
  ctx.drawImage(sprites.shadow, -r, -r, r * 2, r * 2);
  ctx.restore();
}

/* ── Logo ── */

/**
 * Blit an image onto a rectangle that lives *in the scene plane*, so it inherits the
 * camera's rotation and skew instead of facing the viewer.
 *
 * Uses the projected top-left / top-right / bottom-left corners to build an affine
 * matrix. That drops the perspective divide across the image's own span, which at this
 * scale is imperceptible — the same approximation the grid blit makes.
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
  const SLICES = 16;
  const sliceH = h / SLICES;
  const imgW = (img as HTMLImageElement).naturalWidth || 380;
  const imgH = (img as HTMLImageElement).naturalHeight || 380;
  const srcSliceH = imgH / SLICES;

  for (let i = 0; i < SLICES; i++) {
    const sliceY = cy - h / 2 + i * sliceH;
    const nextY = sliceY + sliceH;
    const srcY = i * srcSliceH;

    const tl = project(cam, cx - w / 2, sliceY, z);
    const tr = project(cam, cx + w / 2, sliceY, z);
    const bl = project(cam, cx - w / 2, nextY, z);

    ctx.save();
    ctx.transform(
      (tr.sx - tl.sx) / w, (tr.sy - tl.sy) / w,
      (bl.sx - tl.sx) / sliceH, (bl.sy - tl.sy) / sliceH,
      tl.sx, tl.sy,
    );
    ctx.drawImage(img, 0, srcY, imgW, srcSliceH, 0, 0, w, sliceH);
    ctx.restore();
  }
}

/**
 * The brand mark.
 *
 * One decoded bitmap is sliced and projected at plane coordinates to match 3D perspective,
 * and blitted at successive plane heights to build 14-layer extruded 3D volume.
 */
function drawLogo(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  sprites: HeroSprites,
  state: HeroFrameState,
  w: number,
): void {
  const logo = sprites.logo;
  if (!logo || state.logoHidden) return;

  const mobile = w < 600;
  const baseW = mobile ? 200 : w < 900 ? 280 : 380;
  const shift = mobile ? 160 : w < 900 ? 200 : 260;

  const lw = baseW * (mobile ? 1 - state.moveLeft * 0.25 : 1);
  const lh = lw * sprites.logoAspect;

  // Stationary Center 3D Base Plate coordinates
  const baseCx = PLANE_SIZE / 2;
  const baseCy = PLANE_SIZE / 2;
  const plateW = mobile ? 240 : w < 900 ? 320 : 420;
  const plateH = plateW * 0.9;
  const halfW = plateW / 2;
  const halfH = plateH / 2;
  const x0 = baseCx - halfW;
  const y0 = baseCy - halfH;
  const x1 = baseCx + halfW;
  const y1 = baseCy + halfH;
  const ez = Math.max(0, 18 * (1 - state.flatten));

  // 1. Render Ground Shadow & 3D Extrusion for the Stationary Center Base Plate
  if (state.sideOpacity > 0.01) {
    // Soft ground shadow beneath the base plate
    blitShadow(ctx, cam, sprites, baseCx, baseCy, plateW * 1.5, state.sideOpacity * 0.85);
  }

  // Stacked rounded rectangle extrusion slabs for the 3D Base Plate (matching Service Nodes)
  if (state.sideOpacity > 0.01 && ez > 1) {
    ctx.globalAlpha = state.sideOpacity;
    const numSlabs = Math.max(2, Math.round(14 * (1 - state.flatten)));
    for (let i = 0; i < numSlabs; i++) {
      const z = (i / (numSlabs - 1)) * ez;
      const ratio = i / (numSlabs - 1);
      const r = Math.round(6 + (14 - 6) * ratio);
      const g = Math.round(14 + (28 - 14) * ratio);
      const b = Math.round(32 + (55 - 32) * ratio);
      traceRoundedPlaneRect(ctx, cam, x0, y0, x1, y1, z, NODE_RADIUS);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Top Face of the 3D Base Plate (Navy fill + Gold accent border)
  if (state.topOpacity > 0.01) {
    const topZ = ez + 2.0;
    ctx.globalAlpha = state.topOpacity;

    traceRoundedPlaneRect(ctx, cam, x0, y0, x1, y1, topZ, NODE_RADIUS);
    ctx.fillStyle = "rgb(10, 24, 51)";
    ctx.fill();

    // Gold border outline on the base plate top face
    ctx.save();
    ctx.lineWidth = 2 * cam.scale;
    ctx.strokeStyle = rgba(RGB_GOLD, 0.8 * state.topOpacity);
    ctx.stroke();

    // Outer glow on base plate
    if (state.sideOpacity > 0.05) {
      ctx.lineWidth = 6 * cam.scale;
      ctx.strokeStyle = rgba(RGB_GOLD, 0.22 * state.sideOpacity);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // Phase 2 slides the mark left on desktop, up on mobile (lifting off the stationary base plate)
  const cx = PLANE_SIZE / 2 - (mobile ? 0 : state.moveLeft * shift);
  const cy = PLANE_SIZE / 2 - (mobile ? state.moveLeft * shift : 0);

  // 2. Render Flat P Logo Image resting on top at height Z = ez + 2.0 (No 3D extrusion, no shadow on logo itself)
  const pOpacity = Math.max(0, 1 - state.pexit);
  if (pOpacity > 0.001) {
    const pDropY = state.pexit * 60;
    const pScale = 1 - state.pexit * 0.15;
    const logoZ = ez + 2.0;
    ctx.save();
    ctx.globalAlpha = pOpacity;
    ctx.filter = "none";
    drawImageOnPlane(ctx, cam, logo, cx, cy + pDropY, logoZ, lw * pScale, lh * pScale);
    ctx.restore();
  }

  // AT Text entrance animation: slide down into view & fade in (atenter: 0 -> 1) at exact same center coordinates
  if (state.atenter > 0.001) {
    const atOpacity = state.atenter;
    const atSlideY = (1 - state.atenter) * -60;
    const atScale = 0.85 + state.atenter * 0.15;

    const pCenter = project(cam, cx, cy + atSlideY, ez + 2.0);
    ctx.save();
    ctx.globalAlpha = atOpacity;
    ctx.font = `900 ${Math.round(80 * cam.scale * atScale)}px Inter, sans-serif`;
    ctx.fillStyle = "rgb(255, 199, 44)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 10;
    ctx.fillText("AT", pCenter.sx, pCenter.sy);
    ctx.restore();
  }
}
