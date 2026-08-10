/**
 * The brand P, as a point cloud in world space — for Monolith (extrude it) and Swarm
 * (drift toward it, lock into it).
 *
 * Reuses `heroLogoMask.ts`'s already-rasterised alpha map rather than re-decoding or
 * re-tracing the SVG: that file already solved "turn the mark into a sampleable
 * raster" for the 2D city's beacon plaza, and `getLogoRaster()` — landing in the same
 * file, from a concurrent workstream (W1) — is the read half of exactly that cache.
 * This hook does not import `loadLogoMask`'s caller from `HeroCanvas.tsx`, because
 * the legacy 2D canvas never mounts while the 3D playground is active (see
 * `SuperHeroSequence.tsx`'s `use3D` ternary) — nothing would ever trigger the decode
 * otherwise, so this hook kicks it off itself.
 *
 * `heroLogoMask.ts` is owned by a concurrent agent this stage; nothing here edits it.
 */

import { useEffect, useMemo, useState } from "react";
import { getLogoRaster, loadLogoMask, LOGO_ALPHA_FLOOR, LOGO_RASTER } from "../heroLogoMask";
import { WORLD_EXTENT } from "./constants";

/**
 * The hero mark SVG. Duplicated from `heroLogoMask.ts`'s own (unexported) `LOGO_SRC`
 * rather than imported — it is a static public asset path, not behaviour, so
 * duplicating the string carries none of the coupling risk that duplicating logic
 * would. `heroLogoMask.ts` is the other agent's file; this avoids touching it to
 * export one more constant.
 */
const LOGO_SRC = "/phitopolis_logo_hero.svg";

/**
 * How much of `WORLD_EXTENT` the letterform spans. Slightly over half the ground
 * plane's half-extent, so the mark reads as a landmark object inside the shared
 * stage rather than filling it corner to corner — the same "modest by intent" call
 * `LOGO_SCREEN_FRACTION` makes for the 2D scene, translated from a viewport fraction
 * into this file's world units.
 */
const LOGO_WORLD_SPAN = WORLD_EXTENT * 1.1;

/**
 * Defensive cap on how many points this hook ever hands back. Same order of
 * magnitude as `heroLogoMask.ts`'s own `MAX_BEACONS` — a fully-opaque raster (a
 * decode failure that resolves to a solid alpha block, or a redesigned mark with a
 * heavier fill) must not hand a scene tens of thousands of instances it never
 * budgeted for. Scenes that want more points than this (Swarm's 20k) sample this
 * array *with replacement* themselves rather than this hook inventing jitter it has
 * no scene-specific opinion about.
 */
const MAX_LOGO_POINTS = 4096;

/** Guards against kicking off the SVG decode more than once across the whole
 *  session — every scene that mounts `useLogoPoints` (potentially several, across
 *  tab switches) shares this one raster, and `loadLogoMask` has no idempotency of
 *  its own (it always creates a fresh `Image` and re-decodes). */
let decodeStarted = false;

function samplePositions(): Float32Array {
  const raster = getLogoRaster();
  if (!raster) return new Float32Array(0);

  const floor = LOGO_ALPHA_FLOOR * 255;
  const candidates: number[] = []; // flat raster indices whose alpha clears the floor
  for (let i = 0; i < raster.length; i++) {
    if (raster[i]! >= floor) candidates.push(i);
  }
  if (candidates.length === 0) return new Float32Array(0);

  // Deterministic, evenly-spaced downsample rather than a random one: the same
  // raster must always produce the same point cloud, so a scene's own formation
  // animation (Swarm locking in, Monolith's extrusion) is stable across remounts.
  const stride = Math.max(1, Math.ceil(candidates.length / MAX_LOGO_POINTS));
  const half = LOGO_RASTER / 2;
  const scale = LOGO_WORLD_SPAN / LOGO_RASTER;

  const kept: number[] = [];
  for (let i = 0; i < candidates.length; i += stride) kept.push(candidates[i]!);

  const positions = new Float32Array(kept.length * 3);
  for (let i = 0; i < kept.length; i++) {
    const idx = kept[i]!;
    const cx = idx % LOGO_RASTER;
    const cy = (idx / LOGO_RASTER) | 0;
    // Centre on the origin and flip the raster's row-0-is-top convention so
    // world +y (up) matches the letterform's own top, not its first scanline.
    positions[i * 3] = (cx - half) * scale;
    positions[i * 3 + 1] = (half - cy) * scale;
    positions[i * 3 + 2] = 0;
  }
  return positions;
}

/**
 * @returns `positions` — a flat `[x0,y0,z0, x1,y1,z1, ...]` Float32Array in world
 *   units, centred on the origin, lying in the z=0 plane (a scene rotates or extrudes
 *   it as its own design calls for). `count` is `positions.length / 3`.
 *
 *   Returns `{ positions: new Float32Array(0), count: 0 }` when the raster has not
 *   decoded yet (first paint) or is unavailable (jsdom, or the SVG failed to load) —
 *   that is a valid, expected state, not an error a scene needs to branch on beyond
 *   "zero points, draw nothing yet."
 */
export function useLogoPoints(): { positions: Float32Array; count: number } {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (getLogoRaster() !== null || decodeStarted) return;
    decodeStarted = true;
    void loadLogoMask(LOGO_SRC).then(() => setVersion((v) => v + 1));
  }, []);

  return useMemo(() => {
    const positions = samplePositions();
    return { positions, count: positions.length / 3 };
    // `version` is a pure invalidation signal (the raster it reads is module-level
    // mutable state in heroLogoMask.ts, not a React value) — it has to be listed to
    // force the recompute once decode resolves, even though the callback body never
    // reads it directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);
}
