/**
 * The hero scene, as pure data and pure math — no DOM, no React, no canvas.
 *
 * This is the geometry half of the canvas hero. It replaces the ~250 Emotion-styled
 * DOM elements that HeroSignalP.tsx used to mount inside a `preserve-3d` context, by
 * doing the 3D projection in plain arithmetic instead of delegating it to the
 * compositor. Measured cost of the old approach: scrolling once through the pin
 * injected 1,335 new CSS rules and dropped 32% of frames (docs/perf-baseline.md).
 *
 * The scene lives on a flat 22x22 cell plane (924x924px at GRID_CELL=42). Objects sit
 * on that plane and are lifted along +z. The whole plane is then rotated and projected
 * exactly the way the old CSS transform chain did:
 *
 *     perspective(1600px) scale(s) rotateX(rx) rotateZ(rz)
 *
 * PARITY: every constant here is transcribed literally from HeroSignalP.tsx. The
 * progress -> geometry mapping is delegated to heroPhases.ts, which is parity-locked
 * and covered by tests/motion/hero-phases.test.ts. Nothing in this file re-derives a
 * phase boundary; it only reads them.
 */

import { flattenProgress, moveLeftProgress, sideFaceOpacity } from "./heroPhases";
import { RGB_GOLD, RGB_STEEL, type Rgb } from "./heroPalette";

/** Grid cell base dimension in pixels. */
export const GRID_CELL = 42;
/** Core cluster dimensions: 22x22 cells. */
export const CORE_GRID_CELLS = 22;
/** Plane margin padding cells on each side to accommodate outer application nodes. */
export const PLANE_MARGIN_CELLS = 4;
/** The expanded scene plane is 30x30 cells. */
export const GRID_CELLS = CORE_GRID_CELLS + 2 * PLANE_MARGIN_CELLS;
/** Plane extent in px (1260px at 30 cells * 42px). */
export const PLANE_SIZE = GRID_CELLS * GRID_CELL;
/** Offset in plane coordinates to keep the 22x22 core cluster centered on the 30x30 plane (168px). */
export const GRID_OFFSET = PLANE_MARGIN_CELLS * GRID_CELL;
/** CSS `perspective` on the old scene container. */
export const PERSPECTIVE = 1600;

/* ── Palette ──
 *
 * The values themselves now live in `./heroPalette`, which has no imports of its
 * own. That is deliberate and load-bearing: `playground/constants.ts` needs
 * `RGB_STEEL` and also imports three.js, and while that value lived here the
 * bundler hoisted all of three.js into this module's chunk — which the eager 2D
 * hero requires — putting the entire 3D engine on the home page's critical path.
 * See the header comment in `heroPalette.ts` for the full account.
 *
 * These are re-exported so existing importers of `heroScene` keep working. New
 * code in the 3D playground must import from `./heroPalette` DIRECTLY; reaching
 * these through this module restores the edge and silently re-ships three.js. */
export { RGB_NAVY, RGB_GOLD, RGB_STEEL, RGB_FROST, RGB_SHADOW } from "./heroPalette";
export type { Rgb } from "./heroPalette";

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export interface Point2 {
  x: number;
  y: number;
}

/* ────────────────────────────── Scene objects ────────────────────────────── */

export type CubeType = "gold" | "navy";

export interface CubeSpec {
  /** Column on the grid (0..21). */
  c: number;
  /** Row on the grid (0..21). */
  r: number;
  /** Extrusion height in px at full 3D. */
  h: number;
  type: CubeType;
}

/** Transcribed verbatim from HeroSignalP.tsx:23-43. */
export const CUBE_POSITIONS: readonly CubeSpec[] = [
  // Outer perimeter cubes
  { c: 0, r: 1, h: 58, type: "gold" },
  { c: 21, r: 1, h: 65, type: "navy" },
  { c: 0, r: 20, h: 40, type: "gold" },
  { c: 21, r: 20, h: 46, type: "gold" },
  { c: 0, r: 11, h: 32, type: "navy" },
  { c: 21, r: 11, h: 52, type: "gold" },
  { c: 11, r: 0, h: 70, type: "navy" },
  { c: 11, r: 21, h: 40, type: "gold" },

  // Mid perimeter cubes
  { c: 1, r: 6, h: 32, type: "gold" },
  { c: 20, r: 6, h: 46, type: "gold" },
  { c: 1, r: 16, h: 52, type: "gold" },
  { c: 20, r: 16, h: 40, type: "navy" },
  { c: 6, r: 1, h: 36, type: "gold" },
  { c: 16, r: 1, h: 58, type: "navy" },
  { c: 6, r: 20, h: 46, type: "gold" },
  { c: 16, r: 20, h: 52, type: "navy" },
] as const;

/** Which of the four service-node glyphs a node draws. */
export type NodeIcon = "activity" | "code" | "package" | "shield";

export interface ServiceNodeSpec {
  /** Centre of the node, in plane coordinates. */
  cx: number;
  cy: number;
  elevation: number;
  icon: NodeIcon;
}

/**
 * The four elevated service nodes, re-centered on the expanded plane via GRID_OFFSET.
 */
export const SERVICE_NODE_SIZE = 60;
export const SERVICE_NODES: readonly ServiceNodeSpec[] = [
  { cx: 5 * GRID_CELL + GRID_OFFSET, cy: 5 * GRID_CELL + GRID_OFFSET, elevation: 28, icon: "activity" },
  { cx: 17 * GRID_CELL + GRID_OFFSET, cy: 5 * GRID_CELL + GRID_OFFSET, elevation: 28, icon: "code" },
  { cx: 5 * GRID_CELL + GRID_OFFSET, cy: 17 * GRID_CELL + GRID_OFFSET, elevation: 28, icon: "package" },
  { cx: 17 * GRID_CELL + GRID_OFFSET, cy: 17 * GRID_CELL + GRID_OFFSET, elevation: 28, icon: "shield" },
] as const;

/* ── Outer application nodes ── */

export type AppType = "analytics" | "trading" | "pipeline" | "risk" | "execution" | "telemetry";

export interface ApplicationNodeSpec {
  readonly id: string;
  readonly label: string;
  readonly cx: number;
  readonly cy: number;
  readonly elevation: number;
  readonly appType: AppType;
  readonly width?: number;
  readonly height?: number;
  readonly radius?: number;
}

/** Outer application node dimensions (large, flat rounded rectangles). */
export const APP_NODE_WIDTH = 104;
export const APP_NODE_HEIGHT = 58;
export const APP_NODE_RADIUS = 12;
export const APP_NODE_ELEVATION = 6;
export const APPLICATION_NODE_SIZE = 52;

/**
 * Purely decorative application nodes situated on the outer margin ring representing developed applications.
 * Rendered as large, flat, low-profile rounded rectangles (104x58px, 6px elevation) and symmetrically placed around (630, 630).
 */
export const APPLICATION_NODES: readonly ApplicationNodeSpec[] = [
  { id: "app-alpha", label: "Alpha Analytics", cx: 2 * GRID_CELL, cy: 2 * GRID_CELL, elevation: APP_NODE_ELEVATION, appType: "analytics", width: APP_NODE_WIDTH, height: APP_NODE_HEIGHT, radius: APP_NODE_RADIUS },
  { id: "app-dma", label: "Direct Market Access", cx: 28 * GRID_CELL, cy: 2 * GRID_CELL, elevation: APP_NODE_ELEVATION, appType: "trading", width: APP_NODE_WIDTH, height: APP_NODE_HEIGHT, radius: APP_NODE_RADIUS },
  { id: "app-pipeline", label: "Data Pipeline", cx: 2 * GRID_CELL, cy: 28 * GRID_CELL, elevation: APP_NODE_ELEVATION, appType: "pipeline", width: APP_NODE_WIDTH, height: APP_NODE_HEIGHT, radius: APP_NODE_RADIUS },
  { id: "app-risk", label: "Risk Fortress", cx: 28 * GRID_CELL, cy: 28 * GRID_CELL, elevation: APP_NODE_ELEVATION, appType: "risk", width: APP_NODE_WIDTH, height: APP_NODE_HEIGHT, radius: APP_NODE_RADIUS },
  { id: "app-router", label: "Order Router", cx: 15 * GRID_CELL, cy: 1 * GRID_CELL, elevation: APP_NODE_ELEVATION, appType: "execution", width: APP_NODE_WIDTH, height: APP_NODE_HEIGHT, radius: APP_NODE_RADIUS },
  { id: "app-telemetry", label: "Telemetry Hub", cx: 15 * GRID_CELL, cy: 29 * GRID_CELL, elevation: APP_NODE_ELEVATION, appType: "telemetry", width: APP_NODE_WIDTH, height: APP_NODE_HEIGHT, radius: APP_NODE_RADIUS },
] as const;

/* ───────────────────────────── Signal circuits ───────────────────────────── */

/** Unified speed for every signal pulse, px/ms. Verbatim from HeroSignalP.tsx:50. */
export const SIGNAL_SPEED_PX_PER_MS = 0.25;
/** Tail length of a moving pulse. */
export const SIGNAL_TAIL_PX = 38;
/** Sub-segment samples used to trace a pulse tail. */
export const SIGNAL_SAMPLES = 14;

export interface SignalLoop {
  waypoints: readonly Point2[];
  color: Rgb;
  pulseOffsets: readonly number[];
  segLens: readonly number[];
  totalL: number;
}

function buildSignalLoops(): SignalLoop[] {
  const half = GRID_CELL / 2;

  // Four service nodes framing the central P logo, centered via GRID_OFFSET.
  const quant = { x: 5 * GRID_CELL + GRID_OFFSET, y: 5 * GRID_CELL + GRID_OFFSET };
  const fullstack = { x: 17 * GRID_CELL + GRID_OFFSET, y: 5 * GRID_CELL + GRID_OFFSET };
  const ops = { x: 17 * GRID_CELL + GRID_OFFSET, y: 17 * GRID_CELL + GRID_OFFSET };
  const data = { x: 5 * GRID_CELL + GRID_OFFSET, y: 17 * GRID_CELL + GRID_OFFSET };

  const outerTL = { x: half + GRID_OFFSET, y: half + GRID_OFFSET };
  const outerTR = { x: 21 * GRID_CELL + half + GRID_OFFSET, y: half + GRID_OFFSET };
  const outerBR = { x: 21 * GRID_CELL + half + GRID_OFFSET, y: 21 * GRID_CELL + half + GRID_OFFSET };
  const outerBL = { x: half + GRID_OFFSET, y: 21 * GRID_CELL + half + GRID_OFFSET };

  const midTL = { x: GRID_CELL + half + GRID_OFFSET, y: GRID_CELL + half + GRID_OFFSET };
  const midTR = { x: 20 * GRID_CELL + half + GRID_OFFSET, y: GRID_CELL + half + GRID_OFFSET };
  const midBR = { x: 20 * GRID_CELL + half + GRID_OFFSET, y: 20 * GRID_CELL + half + GRID_OFFSET };
  const midBL = { x: GRID_CELL + half + GRID_OFFSET, y: 20 * GRID_CELL + half + GRID_OFFSET };

  // Outer application nodes
  const appAlpha = { x: 2 * GRID_CELL, y: 2 * GRID_CELL };
  const appDma = { x: 28 * GRID_CELL, y: 2 * GRID_CELL };
  const appPipeline = { x: 2 * GRID_CELL, y: 28 * GRID_CELL };
  const appRisk = { x: 28 * GRID_CELL, y: 28 * GRID_CELL };
  const appRouter = { x: 15 * GRID_CELL, y: 1 * GRID_CELL };
  const appTelemetry = { x: 15 * GRID_CELL, y: 29 * GRID_CELL };

  // Out-and-back closed circuit waypoints: [start, ...waypoints, start]
  const spurNW = [
    quant,
    { x: 2 * GRID_CELL, y: 5 * GRID_CELL + GRID_OFFSET },
    appAlpha,
    { x: 2 * GRID_CELL, y: 5 * GRID_CELL + GRID_OFFSET },
    quant,
  ];
  const spurNE = [
    fullstack,
    { x: 28 * GRID_CELL, y: 5 * GRID_CELL + GRID_OFFSET },
    appDma,
    { x: 28 * GRID_CELL, y: 5 * GRID_CELL + GRID_OFFSET },
    fullstack,
  ];
  const spurSW = [
    data,
    { x: 2 * GRID_CELL, y: 17 * GRID_CELL + GRID_OFFSET },
    appPipeline,
    { x: 2 * GRID_CELL, y: 17 * GRID_CELL + GRID_OFFSET },
    data,
  ];
  const spurSE = [
    ops,
    { x: 28 * GRID_CELL, y: 17 * GRID_CELL + GRID_OFFSET },
    appRisk,
    { x: 28 * GRID_CELL, y: 17 * GRID_CELL + GRID_OFFSET },
    ops,
  ];
  const spurNorth = [
    { x: 15 * GRID_CELL, y: 5 * GRID_CELL + GRID_OFFSET },
    appRouter,
    { x: 15 * GRID_CELL, y: 5 * GRID_CELL + GRID_OFFSET },
  ];
  const spurSouth = [
    { x: 15 * GRID_CELL, y: 17 * GRID_CELL + GRID_OFFSET },
    appTelemetry,
    { x: 15 * GRID_CELL, y: 17 * GRID_CELL + GRID_OFFSET },
  ];

  const raw = [
    // Loop 1: inner quad orbiting the P logo through the four icon centres.
    { waypoints: [quant, fullstack, ops, data, quant], color: RGB_GOLD, pulseOffsets: [0, 0.5] },
    // Loop 2: mid-perimeter highway.
    // Steel, not navy: this loop is a stroke on the dark card, so it has to be the
    // light end of the pair. The gold loops either side of it are unchanged.
    { waypoints: [midTL, midTR, midBR, midBL, midTL], color: RGB_STEEL, pulseOffsets: [0.25, 0.75] },
    // Loop 3: outer grid boundary.
    { waypoints: [outerTL, outerTR, outerBR, outerBL, outerTL], color: RGB_GOLD, pulseOffsets: [0.1, 0.6] },
    // Loop 4: out-and-back spur to Alpha Analytics (NW)
    { waypoints: spurNW, color: RGB_GOLD, pulseOffsets: [0.15, 0.65] },
    // Loop 5: out-and-back spur to Direct Market Access (NE)
    { waypoints: spurNE, color: RGB_STEEL, pulseOffsets: [0.35, 0.85] },
    // Loop 6: out-and-back spur to Data Pipeline (SW)
    { waypoints: spurSW, color: RGB_STEEL, pulseOffsets: [0.2, 0.7] },
    // Loop 7: out-and-back spur to Risk Fortress (SE)
    { waypoints: spurSE, color: RGB_GOLD, pulseOffsets: [0.4, 0.9] },
    // Loop 8: out-and-back spur to Order Router (North)
    { waypoints: spurNorth, color: RGB_GOLD, pulseOffsets: [0.05, 0.55] },
    // Loop 9: out-and-back spur to Telemetry Hub (South)
    { waypoints: spurSouth, color: RGB_STEEL, pulseOffsets: [0.3, 0.8] },
  ] as const;

  return raw.map((loop) => {
    const pts = loop.waypoints;
    const segLens: number[] = [];
    let totalL = 0;
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i]!;
      const p2 = pts[(i + 1) % pts.length]!;
      const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      segLens.push(len);
      totalL += len;
    }
    return { waypoints: pts, color: loop.color, pulseOffsets: loop.pulseOffsets, segLens, totalL };
  });
}

export const SIGNAL_LOOPS: readonly SignalLoop[] = buildSignalLoops();

/** Point at arc-length `dist` along a closed loop. */
export function pointAtLoopDistance(loop: SignalLoop, dist: number): Point2 {
  const { waypoints: pts, segLens, totalL } = loop;
  if (totalL === 0) return pts[0]!;
  let d = ((dist % totalL) + totalL) % totalL;
  for (let i = 0; i < pts.length; i++) {
    const len = segLens[i]!;
    if (d <= len) {
      const t = len === 0 ? 0 : d / len;
      const p1 = pts[i]!;
      const p2 = pts[(i + 1) % pts.length]!;
      return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
    }
    d -= len;
  }
  return pts[0]!;
}

/* ─────────────────────────────── Projection ─────────────────────────────── */

/**
 * The rotation+perspective the old CSS applied to the whole plane.
 *
 * CSS `transform: scale(s) rotateX(rx) rotateZ(rz)` composes as M = S·Rx·Rz, so a point
 * is rotated about Z first, then about X, then uniformly scaled — and finally divided
 * through by the parent's `perspective`.
 */
export interface Camera {
  /** cos/sin of the Z rotation, precomputed once per frame. */
  cosZ: number;
  sinZ: number;
  cosX: number;
  sinX: number;
  scale: number;
  /** Screen-space centre the plane projects around. */
  originX: number;
  originY: number;
}

export function makeCamera(
  flatten: number,
  originX: number,
  originY: number,
  viewScale: number,
  tiltX = 0,
  tiltY = 0
): Camera {
  // Verbatim from HeroSignalP.tsx:557-559, modified with optional mouse tilt offsets.
  // We multiply the tilt by (1 - flatten) so it naturally fades out as the scene flattens.
  const rotXDeg = 55 * (1 - flatten) + (tiltY * 180 / Math.PI) * (1 - flatten);
  const rotZDeg = -45 * (1 - flatten) + (tiltX * 180 / Math.PI) * (1 - flatten);
  const wrapperScale = 1.25 - 0.25 * flatten;
  const rx = (rotXDeg * Math.PI) / 180;
  const rz = (rotZDeg * Math.PI) / 180;
  return {
    cosZ: Math.cos(rz),
    sinZ: Math.sin(rz),
    cosX: Math.cos(rx),
    sinX: Math.sin(rx),
    scale: wrapperScale * viewScale,
    originX,
    originY,
  };
}

/**
 * Project a plane-space point to screen space.
 *
 * `x`/`y` are in plane coordinates (0..PLANE_SIZE); `z` lifts off the plane toward the
 * viewer. Returns screen pixels plus the projected depth, so callers can painter-sort.
 */
export function project(cam: Camera, x: number, y: number, z: number): { sx: number; sy: number; depth: number } {
  // Centre the plane on its own middle, the way the CSS transform-origin did.
  const px = x - PLANE_SIZE / 2;
  const py = y - PLANE_SIZE / 2;

  // rotateZ
  const rx1 = px * cam.cosZ - py * cam.sinZ;
  const ry1 = px * cam.sinZ + py * cam.cosZ;

  // rotateX  (z is toward the viewer, so it lifts -y on screen)
  const ry2 = ry1 * cam.cosX - z * cam.sinX;
  const rz2 = ry1 * cam.sinX + z * cam.cosX;

  // uniform scale
  const sx = rx1 * cam.scale;
  const sy = ry2 * cam.scale;
  const sz = rz2 * cam.scale;

  // perspective divide
  const k = PERSPECTIVE / Math.max(1, PERSPECTIVE - sz);

  return { sx: cam.originX + sx * k, sy: cam.originY + sy * k, depth: sz };
}

/**
 * Inverse of `project()`'s linear part at a fixed depth factor `k`.
 *
 * `project()` maps a plane-space point to screen space in three steps: rotate by
 * `cam`'s Z and X angles, scale, then divide by a perspective factor `k` that
 * itself depends on the point's own projected depth. That last dependency makes
 * the full map non-linear in `(x, y)`, so there is no exact global inverse — but
 * holding `k` fixed (the caller supplies the `k` at the point being inverted
 * around) linearises it locally, which is exactly what small cursor-to-plane
 * deltas need.
 *
 * Dropping the perspective divide's per-point dependency, the forward map from a
 * plane-space delta `(dpx, dpy)` to a screen-space delta `(dsx, dsy)` is:
 *
 *   dsx = scale · k · ( cosZ·dpx − sinZ·dpy)
 *   dsy = scale · k · ( sinZ·cosX·dpx + cosZ·cosX·dpy)
 *
 * i.e. `[dsx, dsy] = scale·k · J · [dpx, dpy]` with Jacobian
 * `J = [[cosZ, -sinZ], [sinZ·cosX, cosZ·cosX]]` — matching the comment on the
 * exported signature below. `det(J) = cosX`, so `J` is invertible everywhere this
 * scene's camera operates (`cosX` only reaches 0 at a 90° tilt, far outside the
 * ±55°/flatten range `makeCamera` produces). Inverting gives:
 *
 *   dpx = ( cosZ·dsx + (sinZ / cosX)·dsy) / (scale·k)
 *   dpy = (−sinZ·dsx +  cosZ·dsy) / (scale·k)
 *
 * `k` is `PERSPECTIVE / max(1, PERSPECTIVE - depth)` at the reference point
 * (`project()`'s returned `.depth`, i.e. `sz` before the perspective divide) —
 * callers should pass exactly that. Nothing in stage 1 calls this yet; it lands
 * here, additive, so stage 3 can turn a cursor position into plane coordinates
 * without re-deriving the math under deadline.
 */
export function unproject2D(cam: Camera, k: number, dsx: number, dsy: number): Point2 {
  const denom = cam.scale * k;
  return {
    x: (cam.cosZ * dsx + (cam.sinZ / cam.cosX) * dsy) / denom,
    y: (-cam.sinZ * dsx + cam.cosZ * dsy) / denom,
  };
}

/* ──────────────────────────── Per-frame state ──────────────────────────── */

/**
 * Everything the renderer needs for one frame, derived from the pin's 0..1 progress.
 * Pure: same progress in, same state out. This is what makes the renderer testable.
 */
export interface HeroFrameState {
  /** 0..1 across phase 1 — the 3D→2D flatten. */
  flatten: number;
  /** 0..1 across phase 2 — the logo's shift left (or up on mobile). */
  moveLeft: number;
  /** Opacity of every 3D side face; reaches 0 well before flatten completes. */
  sideOpacity: number;
  /** Opacity of the flat top faces. */
  topOpacity: number;
  /** Opacity of the grid field. */
  gridOpacity: number;
  /** Opacity of the signal canvas layer. */
  signalOpacity: number;
  /** P exit progress (0.86 → 0.89). */
  pexit: number;
  /** AT enter progress (0.89 → 0.92). */
  atenter: number;
  /** True once the scene is flat enough that 3D geometry is no longer drawn. */
  flat: boolean;
  /** True once phase 9 takes over the logo via the DOM crossfade. */
  logoHidden: boolean;
}

/**
 * Derive the frame state. `progress` is the raw pin progress; `reduced` short-circuits
 * to the final flat layout exactly as `HeroSignalP.tsx:549` did.
 */
export function heroFrameState(progress: number, reduced: boolean, _containerStart: number): HeroFrameState {
  void _containerStart;
  const p = reduced ? 1 : progress;
  const flatten = flattenProgress(p);
  const pexit = p <= 0.86 ? 0 : p >= 0.89 ? 1 : (p - 0.86) / 0.03;
  const atenter = p <= 0.89 ? 0 : p >= 0.92 ? 1 : (p - 0.89) / 0.03;
  return {
    flatten,
    moveLeft: moveLeftProgress(p),
    sideOpacity: sideFaceOpacity(flatten),
    // HeroSignalP.tsx:398 — top faces fade at twice the flatten rate.
    topOpacity: Math.max(0, 1 - flatten * 2),
    // HeroSignalP.tsx:632,660 — grid fades against raw progress, not flatten.
    gridOpacity: Math.max(0, 1 - p * 1.5),
    // Signals fade out in exact lockstep with 3D boxes and service nodes as scene flattens.
    signalOpacity: Math.max(0, 1 - flatten * 2),
    pexit,
    atenter,
    flat: flatten >= 0.95,
    logoHidden: false,
  };
}

/* ────────────────────────────── Service artifacts (stage 6+) ──────────────────────────────
 *
 * The governing invariant, load-bearing for every stage from here on:
 *
 *   An artifact is a *decoration of a cube's envelope*, never a replacement.
 *
 * Every `ArtifactSpec` below carries the exact `CubeSpec` `CUBE_POSITIONS[i]` already
 * pins — same `c`, `r`, `h`, `type`, same one-cell footprint, same contact-shadow
 * radius, same painter's-algorithm depth key. `ArtifactPayload` only changes what the
 * renderer paints *inside and on top of* that envelope; it never touches the envelope
 * itself. This is what keeps `tests/motion/hero-scene.test.ts`'s `CUBE_POSITIONS`
 * pinning green with zero edits.
 */

/** The nine artifact kinds the upgrade ends with. Declared in full now (stage 6) so a
 *  missing kind is a compile error for `ARTIFACT_LABELS` below, not a runtime hole —
 *  stage 7 only has to fill in payloads and painters for the remaining six. */
export type ArtifactKind =
  | "cube"
  | "cloudRack"
  | "terminal"
  | "barChart"
  | "braceSlab"
  | "gitGraph"
  | "candles"
  | "orderbook"
  | "pipeline";

/** Per-kind payload data the renderer needs beyond the shared envelope. */
export type ArtifactPayload =
  | { readonly kind: "cube" }
  | { readonly kind: "terminal"; readonly cols: number; readonly rows: number }
  | { readonly kind: "cloudRack"; readonly units: number }
  | { readonly kind: "barChart" }
  | { readonly kind: "braceSlab" }
  | { readonly kind: "gitGraph" }
  | { readonly kind: "candles" }
  | { readonly kind: "orderbook" }
  | { readonly kind: "pipeline" };

export interface ArtifactSpec {
  /** Byte-identical to `CUBE_POSITIONS[i]` — the envelope. */
  readonly cube: CubeSpec;
  readonly payload: ArtifactPayload;
  /** Slug into `src/routes/services.tsx`'s `FALLBACK_SERVICES`, or `null` for a
   *  plain cube. Non-null exactly when `payload.kind !== "cube"`. */
  readonly serviceSlug: string | null;
}

const CUBE_PAYLOAD: ArtifactPayload = { kind: "cube" };

/**
 * Index-aligned with `CUBE_POSITIONS`. The full 16-slot assignment (stage-6 handover
 * table): outer perimeter (0-7) stays a plain cube forever; the mid-perimeter ring
 * (8-15) becomes eight service artifacts across stages 6-7. This stage implements only
 * index 11 (`terminal`, cell (20,16)) and index 15 (`cloudRack`, cell (16,20)) — every
 * other mid-ring slot stays `CUBE_PAYLOAD` until stage 7 fills it in, which is exactly
 * why `ARTIFACTS.length === 16` but only two entries are non-`"cube"` today.
 */
export const ARTIFACT_PAYLOADS: readonly ArtifactPayload[] = [
  CUBE_PAYLOAD, // 0 — outer perimeter
  CUBE_PAYLOAD, // 1 — outer perimeter
  CUBE_PAYLOAD, // 2 — outer perimeter
  CUBE_PAYLOAD, // 3 — outer perimeter
  CUBE_PAYLOAD, // 4 — outer perimeter
  CUBE_PAYLOAD, // 5 — outer perimeter
  CUBE_PAYLOAD, // 6 — outer perimeter (tallest cube, stays plain — behind the P mark)
  CUBE_PAYLOAD, // 7 — outer perimeter
  CUBE_PAYLOAD, // 8  — (1,6)  candles, Quantitative Research — stage 7
  CUBE_PAYLOAD, // 9  — (20,6) braceSlab, Full-Stack Development — stage 7
  CUBE_PAYLOAD, // 10 — (1,16) barChart, Data Science — stage 7
  { kind: "terminal", cols: 22, rows: 3 }, // 11 — (20,16) Ops Support ← this stage
  CUBE_PAYLOAD, // 12 — (6,1)  orderbook, Quantitative Research — stage 7
  CUBE_PAYLOAD, // 13 — (16,1) gitGraph, Full-Stack Development — stage 7
  CUBE_PAYLOAD, // 14 — (6,20) pipeline, Data Science — stage 7
  { kind: "cloudRack", units: 3 }, // 15 — (16,20) Ops Support ← this stage
] as const;

/** The service slug a given payload kind decorates, or `null` for a plain cube.
 *  Matches `FALLBACK_SERVICES`' slugs in `src/routes/services.tsx`. */
function serviceSlugForKind(kind: ArtifactKind): string | null {
  switch (kind) {
    case "terminal":
    case "cloudRack":
      return "ops-support";
    case "candles":
    case "orderbook":
      return "quantitative-research";
    case "braceSlab":
    case "gitGraph":
      return "full-stack-development";
    case "barChart":
    case "pipeline":
      return "data-science";
    default:
      return null;
  }
}

function buildArtifacts(): ArtifactSpec[] {
  return CUBE_POSITIONS.map((cube, i) => {
    const payload = ARTIFACT_PAYLOADS[i]!;
    return { cube, payload, serviceSlug: serviceSlugForKind(payload.kind) };
  });
}

/** One entry per `CUBE_POSITIONS[i]`, always. `ARTIFACTS[i].cube` is byte-identical to
 *  `CUBE_POSITIONS[i]` by construction — see `buildArtifacts` — which is the invariant
 *  `tests/motion/hero-artifacts.test.ts` guards. */
export const ARTIFACTS: readonly ArtifactSpec[] = buildArtifacts();

/** Display name per kind. Stage 8 renders these as tooltips. `satisfies` makes a
 *  missing kind a compile error rather than a silent runtime hole. */
export const ARTIFACT_LABELS = {
  cube: "Cube",
  terminal: "DevOps Terminal",
  cloudRack: "AWS Server Rack",
  barChart: "Bar Chart",
  braceSlab: "Code Brace Slab",
  gitGraph: "Git Graph",
  candles: "Candlestick Chart",
  orderbook: "Orderbook Ladder",
  pipeline: "ETL Pipeline",
} satisfies Record<ArtifactKind, string>;
