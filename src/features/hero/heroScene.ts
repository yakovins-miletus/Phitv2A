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

/** Grid cell base dimension in pixels. */
export const GRID_CELL = 42;
/** The scene plane is 22x22 cells. */
export const GRID_CELLS = 22;
/** Plane extent in px — the local coordinate space every scene object is authored in. */
export const PLANE_SIZE = GRID_CELLS * GRID_CELL;
/** CSS `perspective` on the old scene container. */
export const PERSPECTIVE = 1600;

/* ── Palette, as numeric triplets so the renderer never parses strings per frame ── */
export const RGB_NAVY: Rgb = [10, 42, 102];
export const RGB_GOLD: Rgb = [255, 199, 44];
/** Deep navy used for cast/contact shadows. */
export const RGB_SHADOW: Rgb = [10, 24, 51];

export type Rgb = readonly [number, number, number];

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
  /** Column on the grid. */
  c: number;
  /** Row on the grid. */
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
 * The four elevated service nodes. The old code positioned them by top-left corner at
 * `n * GRID_CELL - 30` with `size = 60`, i.e. centred on the grid intersection.
 */
export const SERVICE_NODE_SIZE = 60;
export const SERVICE_NODES: readonly ServiceNodeSpec[] = [
  { cx: 5 * GRID_CELL, cy: 5 * GRID_CELL, elevation: 28, icon: "activity" },
  { cx: 17 * GRID_CELL, cy: 5 * GRID_CELL, elevation: 28, icon: "code" },
  { cx: 5 * GRID_CELL, cy: 17 * GRID_CELL, elevation: 28, icon: "package" },
  { cx: 17 * GRID_CELL, cy: 17 * GRID_CELL, elevation: 28, icon: "shield" },
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

  // Four service nodes framing the central P logo.
  const quant = { x: 5 * GRID_CELL, y: 5 * GRID_CELL };
  const fullstack = { x: 17 * GRID_CELL, y: 5 * GRID_CELL };
  const ops = { x: 17 * GRID_CELL, y: 17 * GRID_CELL };
  const data = { x: 5 * GRID_CELL, y: 17 * GRID_CELL };

  const outerTL = { x: half, y: half };
  const outerTR = { x: 21 * GRID_CELL + half, y: half };
  const outerBR = { x: 21 * GRID_CELL + half, y: 21 * GRID_CELL + half };
  const outerBL = { x: half, y: 21 * GRID_CELL + half };

  const midTL = { x: GRID_CELL + half, y: GRID_CELL + half };
  const midTR = { x: 20 * GRID_CELL + half, y: GRID_CELL + half };
  const midBR = { x: 20 * GRID_CELL + half, y: 20 * GRID_CELL + half };
  const midBL = { x: GRID_CELL + half, y: 20 * GRID_CELL + half };

  const raw = [
    // Loop 1: inner quad orbiting the P logo through the four icon centres.
    { waypoints: [quant, fullstack, ops, data, quant], color: RGB_GOLD, pulseOffsets: [0, 0.5] },
    // Loop 2: mid-perimeter highway.
    { waypoints: [midTL, midTR, midBR, midBL, midTL], color: RGB_NAVY, pulseOffsets: [0.25, 0.75] },
    // Loop 3: outer grid boundary.
    { waypoints: [outerTL, outerTR, outerBR, outerBL, outerTL], color: RGB_GOLD, pulseOffsets: [0.1, 0.6] },
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

export function makeCamera(flatten: number, originX: number, originY: number, viewScale: number): Camera {
  // Verbatim from HeroSignalP.tsx:557-559.
  const rotXDeg = 55 * (1 - flatten);
  const rotZDeg = -45 * (1 - flatten);
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
  /** True once the scene is flat enough that 3D geometry is no longer drawn. */
  flat: boolean;
  /** True once phase 9 takes over the logo via the DOM crossfade. */
  logoHidden: boolean;
}

/**
 * Derive the frame state. `progress` is the raw pin progress; `reduced` short-circuits
 * to the final flat layout exactly as `HeroSignalP.tsx:549` did.
 */
export function heroFrameState(progress: number, reduced: boolean, containerStart: number): HeroFrameState {
  const p = reduced ? 1 : progress;
  const flatten = flattenProgress(p);
  return {
    flatten,
    moveLeft: moveLeftProgress(p),
    sideOpacity: sideFaceOpacity(flatten),
    // HeroSignalP.tsx:398 — top faces fade at twice the flatten rate.
    topOpacity: Math.max(0, 1 - flatten * 2),
    // HeroSignalP.tsx:632,660 — grid fades against raw progress, not flatten.
    gridOpacity: Math.max(0, 1 - p * 1.5),
    // HeroSignalP.tsx:138 — signal canvas fades against raw progress.
    signalOpacity: Math.max(0, 1 - p * 2.2),
    flat: flatten >= 0.95,
    logoHidden: p >= containerStart,
  };
}
