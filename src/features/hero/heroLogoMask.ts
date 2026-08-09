/**
 * The P mark, as part of the city.
 *
 * The mark is a **plane of gold beacons at a single altitude above the skyline** —
 * one dot per lattice cell whose projected position falls inside the letterform,
 * all at exactly the same height. It is projected by the same camera, lit by the
 * same palette and casts its own shadow on the same ground, so it belongs to the
 * scene; the old renderer blitted a pre-tinted extruded raster in three layers over
 * the canvas, which is exactly why it never did.
 *
 * ## Three failed attempts, and what each one taught
 *
 * **1. Painted onto the ground plane.** The camera rotates the plane -45deg about Z
 * and tilts it 55deg about X, which shears a letterform into an unreadable
 * parallelogram. Fix: sample the mask in **screen** space — project each lattice
 * cell, then look up the raster at *that* position. The mark is upright; the dots
 * forming it are still real scene objects.
 *
 * **2. Added to the district heights.** Produced a solid nine-storey slab across
 * 45% of the plane that annihilated the skyline.
 *
 * **3. Overrode the heights with a LOW plaza.** Legible in principle, invisible in
 * practice: a two-storey clearing viewed at 55deg is occluded by the seven-storey
 * towers standing in front of it.
 *
 * **What actually works: uniform altitude.** A building's roof is drawn well above
 * its footprint, so a mark made of *varying* heights is smeared vertically — seen
 * through a comb. When every cell of the mark sits at the same altitude the smear
 * becomes a rigid translation, and the shape survives intact. That single
 * observation is why the mark is a floating plane rather than a building.
 *
 * The sampling camera deliberately ignores pointer tilt. The mask then depends only
 * on `flatten` and the viewport, so it never shimmers as the cursor moves; the mark
 * drifts very slightly against the tilting city, which reads as it being *in* the
 * scene rather than pinned to the glass.
 *
 * ## The null-2D-context contract
 *
 * jsdom's `HTMLCanvasElement.getContext("2d")` returns `null`. Everything here must
 * build a correctly shaped, all-zero mask and resolve cleanly rather than throwing —
 * an empty mask is a valid state, and it is the state on every real page load until
 * the SVG decodes.
 */

import { DOTS_PER_AXIS, DOT_STEP, HORIZON, STOREY_HEIGHT } from "./heroCity";
import { project, type Camera } from "./heroScene";

/** Resolution the mark is rasterised at, once. */
export const LOGO_RASTER = 96;

/** Alpha below which a sampled pixel is treated as outside the mark. */
export const LOGO_ALPHA_FLOOR = 0.4;

/**
 * The mark's on-screen size, as a fraction of the viewport's short side.
 *
 * Modest by intent. The headline is this hero's first stop and the mark is its
 * third; at 0.34 the P is a landmark inside the frame rather than the frame's
 * subject, which is the specific failure of the hero this replaces.
 */
export const LOGO_SCREEN_FRACTION = 0.29;

/**
 * The altitude every beacon sits at, in storeys — **uniform**, which is the whole
 * trick. See the module comment: equal altitude turns the vertical smear of
 * projection into a rigid translation, and the letterform survives it.
 */
export const LOGO_STOREYS = 8;

/**
 * How many beacons per city block, per axis.
 *
 * The mark needs its own resolution. At the city's own 21px lattice pitch only
 * about 9x9 cells fall inside a mark sized not to dominate the frame — nowhere near
 * enough to render a letterform, which is what the fourth attempt at this file
 * produced (a gold square). Subdividing by three gives ~27x27 sample points in the
 * same area, which reads.
 *
 * The beacons still live in plane space and are still projected by the scene
 * camera, so they remain scene objects with real positions and real shadows; they
 * simply are not constrained to the grid the buildings stand on. Nothing about the
 * city requires that a light in the sky sit on a street corner.
 */
export const BEACON_SUBDIVISION = 4;

/** Hard cap on beacons. Sized well past the ~800 a 0.42-fraction mark produces. */
export const MAX_BEACONS = 4096;

/** Cached raster alpha, `LOGO_RASTER x LOGO_RASTER`, row-major. Empty until decoded. */
let raster: Uint8Array | null = null;

/** Plane-space positions of the mark's beacons. Live entries: `beaconCount`. */
export const beaconX = new Float32Array(MAX_BEACONS);
export const beaconY = new Float32Array(MAX_BEACONS);
let beaconCount = 0;

export function getBeaconCount(): number {
  return beaconCount;
}

/** Cache key for the last mask rebuild, so a still camera costs nothing. */
let lastKey = "";

export function isLogoMaskReady(): boolean {
  return raster !== null;
}

/** Reset to the pre-load state. Exists for tests; never called by the app. */
export function resetLogoMask(): void {
  beaconCount = 0;
  raster = null;
  lastKey = "";
}

/**
 * Rasterise an already-decoded image into the cached alpha map.
 *
 * Split out from `loadLogoMask` so tests can drive it with a stub without image
 * decoding, and so the null-context branch has exactly one home.
 */
export function rasteriseLogo(image: CanvasImageSource): void {
  const off = document.createElement("canvas");
  off.width = LOGO_RASTER;
  off.height = LOGO_RASTER;
  const ctx = off.getContext("2d");
  if (!ctx) return; // jsdom, or a context-exhausted browser. No mark is valid.

  ctx.clearRect(0, 0, LOGO_RASTER, LOGO_RASTER);
  try {
    ctx.drawImage(image, 0, 0, LOGO_RASTER, LOGO_RASTER);
  } catch {
    return;
  }

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, LOGO_RASTER, LOGO_RASTER).data;
  } catch {
    return; // tainted canvas; the city simply has no mark district.
  }

  const out = new Uint8Array(LOGO_RASTER * LOGO_RASTER);
  for (let i = 0; i < out.length; i++) out[i] = data[i * 4 + 3]!;
  raster = out;
  lastKey = ""; // force the next refresh to rebuild
}

/**
 * Rebuild `logoStoreys` for the current camera, if anything it depends on changed.
 *
 * `cam` must be built WITHOUT pointer tilt — see the module comment. `flatten` is
 * quantised into the cache key so a scroll rebuilds the mask a few dozen times
 * across the whole pin rather than once per frame.
 */
export function refreshLogoMask(cam: Camera, width: number, height: number, flatten: number): void {
  if (raster === null) return;
  const key = `${width}x${height}:${Math.round(flatten * 60)}`;
  if (key === lastKey) return;
  lastKey = key;

  beaconCount = 0;
  const size = Math.min(width, height) * LOGO_SCREEN_FRACTION;
  if (size <= 0) return;
  const left = width / 2 - size / 2;
  const top = height * HORIZON - size / 2;
  const floor = LOGO_ALPHA_FLOOR * 255;

  // Beacons are tested at their own altitude, not at ground level: that is where
  // they will actually be drawn, so that is where the letterform has to line up.
  const z = LOGO_STOREYS * STOREY_HEIGHT * (1 - flatten);
  const step = DOT_STEP / BEACON_SUBDIVISION;
  const span = DOTS_PER_AXIS * BEACON_SUBDIVISION;

  for (let row = 0; row < span; row++) {
    const y = row * step + step / 2;
    for (let col = 0; col < span; col++) {
      const x = col * step + step / 2;
      const p = project(cam, x, y, z);
      const u = (p.sx - left) / size;
      const v = (p.sy - top) / size;
      if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;
      const rx = (u * LOGO_RASTER) | 0;
      const ry = (v * LOGO_RASTER) | 0;
      if (raster[ry * LOGO_RASTER + rx]! < floor) continue;
      if (beaconCount >= MAX_BEACONS) return;
      beaconX[beaconCount] = x;
      beaconY[beaconCount] = y;
      beaconCount++;
    }
  }
}

/**
 * Decode `src` and rasterise it. Resolves either way — a mark that fails to load
 * leaves the city without its plaza, which is a degraded scene, not a broken one.
 */
export function loadLogoMask(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof Image === "undefined") {
      resolve();
      return;
    }
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      rasteriseLogo(img);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

