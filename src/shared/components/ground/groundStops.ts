import {
  ABOUT_CHAPTERS,
  ABOUT_SECTIONS,
  CHAPTERS,
  HOME_SECTIONS,
  actOfChapterIn,
  type Act,
  type ChapterDef,
  type SectionDef,
} from "@/shared/sections";
import { GROUNDS, type GroundName } from "@/shared/theme/grounds";

/**
 * The page's ground track: one stop per rendered section, in scroll order.
 *
 * Pure data and pure maths — no GL, no DOM, no GSAP — so both renderers and the
 * unit tests consume the same source. Colours come from `GROUNDS`, which comes
 * from `NOIR`, so no colour value is authored here.
 */
/**
 * A declared transition into a stop, replacing the old implicit "560px before
 * every boundary" window (former `BLEND_PX` in `GroundLayer.tsx`).
 *
 * `"cut"` is a zero-width, real no-op: the boundary owns no scroll region at
 * all, so it cannot bleed into neighbouring content by construction, and
 * `sampleGround` short-circuits before touching the renderers — no GL
 * redraw, no CSS write. This is what a same-ground adjacent pair (e.g.
 * About's `candidates` → `testimonials`, both `panel`) gets automatically:
 * Step 1 found that pair never produced a *visible* artifact (from === to
 * either way), but it still cost a GL tile-flip every tick inside the old
 * blend window, so a real `"cut"` is strictly better even where nothing was
 * visibly wrong.
 *
 * `"wipe"` owns an explicit `band` in px, sized to the boundary rather than a
 * single global constant. Any boundary between two different grounds gets one.
 */
export type Transition = { kind: "cut" } | { kind: "wipe"; band: number };

/** Default wipe band. Same distance the old global `BLEND_PX` used — long
 *  enough to read as a transition, short enough that a section still holds a
 *  stable colour while it's read. Boundaries that need a narrower runway (a
 *  short, single-beat section that can't afford this much runway without
 *  spilling into its neighbours) declare their own `band` instead of using
 *  this default — see `buildGroundStops`. */
export const DEFAULT_BAND = 560;

export interface GroundStop {
  /** DOM id of the section element this stop is anchored to. */
  id: string;
  ground: GroundName;
  act: Act;
  /** Resolved background colour. */
  color: string;
  /**
   * True when this stop opens a new act. Descriptive metadata only — every
   * boundary gets the same tile wipe now (see `sampleGround`'s header), so this
   * no longer changes how the layer paints. Kept because it's still a real fact
   * about the section structure, and `ACT_BREAK_INDEX` below still needs it.
   */
  actBreak: boolean;
  /**
   * The declared transition **leaving** this stop, i.e. the boundary between
   * this stop and the next one in the track. The last stop in a track always
   * carries `{ kind: "cut" }` — there is nothing after it to transition into.
   */
  transitionOut: Transition;
}

/** `hero-flatten`/`hero-align`/`hero-reveal`/`hero-dwell` are in HOME_SECTIONS
 *  for the rails but are never rendered, so they have no element to anchor a
 *  stop to. */
const UNRENDERED = new Set(["hero-flatten", "hero-align", "hero-reveal", "hero-dwell"]);

/**
 * Build a page's ground track from its section registry.
 *
 * Generic over the section/chapter list so both HOME_SECTIONS/CHAPTERS and
 * ABOUT_SECTIONS/ABOUT_CHAPTERS produce a track through the same maths —
 * `GroundLayer` accepts whichever track its page passes it (see
 * `GroundLayer.tsx`'s `stops` prop), so /about's grounds paint without
 * forking the sampler.
 */
export function buildGroundStops(
  sections: readonly SectionDef[],
  chapters: readonly ChapterDef[],
): readonly GroundStop[] {
  const rendered = sections.filter((s) => !UNRENDERED.has(s.id));
  return rendered.map((section, i, list) => {
    const act = actOfChapterIn(chapters, section.chapter);
    const prev = i > 0 ? list[i - 1] : undefined;
    const next = i < list.length - 1 ? list[i + 1] : undefined;
    const ground = section.ground ?? "deep";
    const nextGround = next ? (next.ground ?? "deep") : undefined;
    // No next stop, or the next stop shares this one's ground: this boundary
    // owns no scroll region at all. A same-ground pair (About's
    // `candidates` -> `testimonials`) is a real no-op, not a wipe between
    // identical colours — see the `Transition` doc above.
    const transitionOut: Transition =
      next === undefined || nextGround === ground ? { kind: "cut" } : { kind: "wipe", band: DEFAULT_BAND };
    return {
      id: section.id,
      // Sections without a declared ground inherit the page default rather
      // than punching a hole in the track.
      ground,
      act,
      color: GROUNDS[ground].bg,
      actBreak: prev !== undefined && actOfChapterIn(chapters, prev.chapter) !== act,
      transitionOut,
    };
  });
}

export const GROUND_STOPS: readonly GroundStop[] = buildGroundStops(HOME_SECTIONS, CHAPTERS);

/** /about's ground track — see about.tsx for why /about now mounts
 *  `<GroundLayer stops={ABOUT_GROUND_STOPS} />` alongside `<SmoothScroll />`. */
export const ABOUT_GROUND_STOPS: readonly GroundStop[] = buildGroundStops(ABOUT_SECTIONS, ABOUT_CHAPTERS);

/** Index of the single act break, or -1. Asserted to be unique by the unit tests. */
export const ACT_BREAK_INDEX = GROUND_STOPS.findIndex((s) => s.actBreak);

/* ────────────────────────────── Colour maths ────────────────────────────── */

export type Rgb = readonly [number, number, number];

const HEX = /^#([0-9a-f]{6})$/i;

/**
 * Parse a ground colour to an RGB triple.
 *
 * Grounds are always hex from `NOIR` — the `common.white` / `rgba(...)` strings in
 * `GROUNDS` are *foreground* values and never reach here. Anything unparseable
 * falls back to mid-grey rather than throwing, because a wrong colour on a
 * decorative layer is recoverable and a crash on the home page is not.
 */
export function parseGround(color: string): Rgb {
  const m = HEX.exec(color.trim());
  if (!m?.[1]) return [128, 128, 128];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Linear interpolation between two RGB triples. `t` is clamped to [0,1]. */
export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

export function rgbCss(c: Rgb): string {
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/**
 * Smoothstep, used to shape the blend between two stops.
 *
 * A linear ramp across a whole section makes the ground visibly drift the entire
 * time you are reading it. Easing keeps the middle of each section stable and
 * concentrates the change near the boundary, which is where a transition belongs.
 */
export function smoothstep(t: number): number {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return k * k * (3 - 2 * k);
}

/**
 * A resolved ground sample.
 *
 * `color` is a CPU pre-blend of `from`/`to` by `progress` — used only by the
 * CSS/low-power fallback renderer, which has no per-tile hash of its own and
 * still crossfades. The WebGL renderer ignores `color` and paints `from`/`to`
 * directly, sweeping between them per-tile as `progress` advances (see
 * `glGround.ts`).
 */
export interface GroundSample {
  color: Rgb;
  /** Raw colour of the stop being left. */
  from: Rgb;
  /** Raw colour of the stop being entered — equal to `from` if there is none. */
  to: Rgb;
  /** 0 away from the boundary, ramping to 1 at it. Drives the tile wipe. */
  progress: number;
  /** Index of the stop currently being left. */
  fromIndex: number;
}

/**
 * Sample the ground track.
 *
 * `positions` holds each stop's document offset in the same order as
 * `GROUND_STOPS`; `scrollY` is the current offset. Blending happens over the
 * approach to each stop rather than across whole sections, so a section holds one
 * stable colour while it is being read.
 *
 * The band a boundary blends across comes from that stop's own declared
 * `transitionOut` (see `buildGroundStops`) — a `"cut"` owns zero scroll region
 * and short-circuits to `progress: 0` before any colour maths runs at all, and
 * a `"wipe"` uses its own declared `band` rather than a single global constant
 * centred wherever the boundary happens to fall.
 *
 * `blendPxOverride`, when given, replaces the declared band outright. Used by
 * tests and fixtures that build a track by hand and want to exercise the
 * ramp/smoothstep maths directly rather than the ground model's own band
 * choice — production code (`GroundLayer.tsx`) never passes it, so a real
 * boundary always uses the band the section registry actually declared.
 */
export function sampleGround(
  stops: readonly GroundStop[],
  positions: readonly number[],
  scrollY: number,
  blendPxOverride?: number,
): GroundSample {
  const white: Rgb = [255, 255, 255];
  if (stops.length === 0) return { color: white, from: white, to: white, progress: 0, fromIndex: 0 };

  const first = stops[0];
  if (!first) return { color: white, from: white, to: white, progress: 0, fromIndex: 0 };

  // Find the last stop whose section has already started.
  let i = 0;
  for (let k = 0; k < stops.length; k++) {
    const p = positions[k];
    if (p !== undefined && scrollY >= p) i = k;
  }

  const current = stops[i];
  const next = stops[i + 1];
  const nextPos = positions[i + 1];
  if (!current) return { color: white, from: white, to: white, progress: 0, fromIndex: 0 };

  const from = parseGround(current.color);
  if (!next || nextPos === undefined) {
    return { color: from, from, to: from, progress: 0, fromIndex: i };
  }

  const transition = current.transitionOut;
  const declaredBand = transition.kind === "wipe" ? transition.band : 0;
  const blendPx = blendPxOverride ?? declaredBand;

  // A cut (declared, or an override of 0) owns no scroll region at all: the
  // next stop's colour applies the instant its position is reached, with no
  // ramp and no GL/CSS work in between. This is what a same-ground pair
  // (e.g. About's `candidates` -> `testimonials`) gets automatically, and it
  // is a real no-op, not a wipe between two identical colours.
  if (blendPx <= 0) {
    return { color: from, from, to: from, progress: 0, fromIndex: i };
  }

  // Blend across the last `blendPx` before the next section begins.
  const span = Math.max(1, Math.min(blendPx, nextPos - (positions[i] ?? 0)));
  const raw = (scrollY - (nextPos - span)) / span;
  const t = smoothstep(raw);
  const to = parseGround(next.color);

  return { color: mixRgb(from, to, t), from, to, progress: t, fromIndex: i };
}
