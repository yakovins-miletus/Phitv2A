/**
 * The hero scene's palette, as numeric triplets — and nothing else.
 *
 * ## Why this is its own module (load-bearing — do not fold back into heroScene.ts)
 *
 * These constants used to live in `heroScene.ts`. That made `heroScene.ts` a
 * shared dependency of two module graphs that must never touch:
 *
 *   - the **2D canvas hero** (`HeroCanvas.tsx`), which `SuperHeroSequence.tsx`
 *     imports at module scope, so it is statically reachable from the home
 *     route and ships in the eager route chunk; and
 *   - the **3D playground** (`playground/constants.ts`), which does
 *     `import * as THREE from "three"` and is otherwise only reachable behind
 *     `React.lazy`.
 *
 * `playground/constants.ts` needed exactly one runtime value from
 * `heroScene.ts` — `RGB_STEEL` — and that single import edge was enough for the
 * bundler to hoist **all of three.js into the chunk the 2D hero needs**.
 * Measured on the 2026-08-23 build: `heroScene-*.js` was 882KB raw / 191KB
 * brotli with three.js inlined, statically imported by the home route chunk. So
 * every visitor to `/` downloaded the entire 3D engine to look at a 2D canvas.
 *
 * A palette has no dependencies, so it can be shared by both graphs without
 * welding them together. `heroScene.ts` re-exports these for its existing
 * callers, but **`playground/constants.ts` must import from THIS module
 * directly** — importing the re-export from `heroScene.ts` restores the exact
 * edge this file exists to cut, and does so silently: the build still succeeds,
 * it just quietly puts three.js back on the home critical path.
 *
 * Rule of thumb: anything the playground needs from the 2D hero belongs here,
 * not in `heroScene.ts`.
 */

/** A colour as a numeric triplet, so the renderer never parses strings per frame. */
export type Rgb = readonly [number, number, number];

/* ── Palette ──
 *
 * RE-CUT FOR THE DARK CARD. The hero card was `#FFFFFF`; it is `NOIR.navyPanel`
 * (#0A1833) now, which inverted what these values mean. `RGB_NAVY` was the scene's
 * *structural* colour — grid lines, the non-gold cubes, one of the signal loops — and
 * navy structure on a navy panel is invisible. Worse, the old `RGB_SHADOW` [10,24,51]
 * is now byte-identical to the card it was casting a shadow onto.
 *
 * So structure moves to light-on-dark, and the shadow to real black. `RGB_NAVY` is
 * kept: it is still the right fill for the raised service-node faces, which now read
 * as *lifted* against the darker panel — dark-mode elevation is the lighter surface. */

/** Brand navy. Now a *raised surface* fill, not a structural stroke. */
export const RGB_NAVY: Rgb = [10, 42, 102];
export const RGB_GOLD: Rgb = [255, 199, 44];
/**
 * Structural marks that used to be navy-on-white: the non-gold cubes and the cool
 * signal loop. This is the cool end of the palette's navy→gold accent ramp
 * (CHAPTER_ACCENTS 2019), so the scene stays inside the brand family, and it measures
 * 5.52:1 on the base ground.
 */
export const RGB_STEEL: Rgb = [105, 138, 213];
/** Off-white, for hairline structure: the isometric grid. Matches NOIR.frost. */
export const RGB_FROST: Rgb = [244, 247, 252];
/** Contact and cast shadows. Black, not navy — a navy shadow on a navy panel is nothing. */
export const RGB_SHADOW: Rgb = [0, 0, 0];
