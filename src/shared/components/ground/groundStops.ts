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
export interface GroundStop {
  /** DOM id of the section element this stop is anchored to. */
  id: string;
  ground: GroundName;
  act: Act;
  /** Resolved background colour. */
  color: string;
  /** True when this stop opens a new act — the layer wipes here instead of fading. */
  actBreak: boolean;
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
  return sections
    .filter((s) => !UNRENDERED.has(s.id))
    .map((section, i, list) => {
      const act = actOfChapterIn(chapters, section.chapter);
      const prev = i > 0 ? list[i - 1] : undefined;
      return {
        id: section.id,
        // Sections without a declared ground inherit the page default rather
        // than punching a hole in the track.
        ground: section.ground ?? "deep",
        act,
        color: GROUNDS[section.ground ?? "deep"].bg,
        actBreak: prev !== undefined && actOfChapterIn(chapters, prev.chapter) !== act,
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
 * concentrates the change near the seam, which is where a transition belongs.
 */
export function smoothstep(t: number): number {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return k * k * (3 - 2 * k);
}

/** A resolved ground sample: the colour to paint, and how close to an act break. */
export interface GroundSample {
  color: Rgb;
  /** 0 away from the act break, ramping to 1 at it. Drives the wipe. */
  seam: number;
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
 */
export function sampleGround(
  stops: readonly GroundStop[],
  positions: readonly number[],
  scrollY: number,
  blendPx: number,
  /**
   * Blend distance for the act break specifically. Wider than `blendPx` on
   * purpose, for two reasons: the act change is the page's biggest colour move and
   * deserves the longest runway, and `daily-life` is pinned — its measured offset
   * shifts once GSAP sizes the pin spacer, so a late correction lands inside an
   * already-moving gradient instead of snapping. Defaults to `blendPx`.
   */
  seamBlendPx: number = blendPx,
): GroundSample {
  if (stops.length === 0) return { color: [255, 255, 255], seam: 0, fromIndex: 0 };

  const first = stops[0];
  if (!first) return { color: [255, 255, 255], seam: 0, fromIndex: 0 };

  // Find the last stop whose section has already started.
  let i = 0;
  for (let k = 0; k < stops.length; k++) {
    const p = positions[k];
    if (p !== undefined && scrollY >= p) i = k;
  }

  const current = stops[i];
  const next = stops[i + 1];
  const nextPos = positions[i + 1];
  if (!current) return { color: [255, 255, 255], seam: 0, fromIndex: 0 };

  const from = parseGround(current.color);
  if (!next || nextPos === undefined) return { color: from, seam: 0, fromIndex: i };

  // Blend across the last `blendPx` before the next section begins — or the wider
  // `seamBlendPx` when the next section opens a new act.
  const want = next.actBreak ? seamBlendPx : blendPx;
  const span = Math.max(1, Math.min(want, nextPos - (positions[i] ?? 0)));
  const raw = (scrollY - (nextPos - span)) / span;
  const t = smoothstep(raw);

  return {
    color: mixRgb(from, parseGround(next.color), t),
    seam: next.actBreak ? t : 0,
    fromIndex: i,
  };
}
