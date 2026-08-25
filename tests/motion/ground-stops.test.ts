import {
  ACT_BREAK_INDEX,
  buildGroundStops,
  GROUND_STOPS,
  mixRgb,
  parseGround,
  sampleGround,
  smoothstep,
} from "@/shared/components/ground/groundStops";
import { HOME_SECTIONS, actOfChapter, type ChapterDef, type SectionDef } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";

// The ground track is pure data and pure maths, deliberately split from the
// renderers so it can be tested without a canvas or a WebGL context. These tests
// are the reason the WebGL and CSS paths cannot disagree about *what* to paint —
// they only differ in how.

test("every rendered section has a stop, in scroll order", () => {
  // `closing` (ClosingShelf) does render an element via its own SectionBeat
  // (`id={section.id}`), so it is no longer in the unrendered set — only the
  // four decorative hero-flatten/align/reveal/dwell phases have no element.
  const UNRENDERED = ["hero-flatten", "hero-align", "hero-reveal", "hero-dwell"];
  const rendered = HOME_SECTIONS.filter((s) => !UNRENDERED.includes(s.id)).map((s) => s.id);
  expect(GROUND_STOPS.map((s) => s.id)).toEqual(rendered);
});

test("every stop resolves to a real colour from the palette", () => {
  for (const stop of GROUND_STOPS) {
    expect(stop.color).toBe(GROUNDS[stop.ground].bg);
    // Grounds must be hex: parseGround falls back to grey on anything else, and a
    // silently grey page is exactly the kind of failure that ships.
    expect(stop.color).toMatch(/^#[0-9a-fA-F]{6}$/);
  }
});

test("the home page's ground track has no act break, having collapsed to a single act", () => {
  // PRD-home-client-focus §US-2 relocated `daily-life`/`candidates`/
  // `testimonials`/`blog` (the PEOPLE act) to /about, so home is now a single
  // "services" act front to back and there is nothing for the ground layer to
  // wipe between. This replaces the old "reach -> daily-life" act-break
  // assertion, which is no longer true of the page.
  const breaks = GROUND_STOPS.filter((s) => s.actBreak);
  expect(breaks).toHaveLength(0);
  expect(ACT_BREAK_INDEX).toBe(-1);
  expect(new Set(GROUND_STOPS.map((s) => s.act))).toEqual(new Set(["services"]));
});

/**
 * `buildGroundStops` (the generic ground-track builder shared by home and
 * /about — see groundStops.ts) still needs to be exercised against an actual
 * act break: real home data no longer has one, so these fixture sections
 * synthesize a two-act track purely to test the seam/act-break maths that
 * `sampleGround` depends on (see the two tests below that consume it).
 */
const FIXTURE_CHAPTERS: readonly ChapterDef[] = [
  { index: 0, label: "A", act: "services" },
  { index: 1, label: "B", act: "people" },
];
const FIXTURE_SECTIONS: readonly SectionDef[] = [
  { id: "fixture-a", label: "A", chapter: 0, ground: "white" },
  { id: "fixture-b", label: "B", chapter: 1, ground: "deep" },
];
const FIXTURE_STOPS = buildGroundStops(FIXTURE_SECTIONS, FIXTURE_CHAPTERS);
const FIXTURE_ACT_BREAK_INDEX = FIXTURE_STOPS.findIndex((s) => s.actBreak);

test("buildGroundStops still flags an act break when consecutive sections change act", () => {
  expect(FIXTURE_ACT_BREAK_INDEX).toBe(1);
  expect(FIXTURE_STOPS[0]?.act).toBe("services");
  expect(FIXTURE_STOPS[1]?.act).toBe("people");
});

/** Weighted byte-space luminance — a cheap ordering of how light a ground reads. */
const lum = (id: string) => {
  const stop = GROUND_STOPS.find((s) => s.id === id);
  const [r, g, b] = parseGround(stop!.color);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG relative luminance, for the perceptual ratio the seam is judged on. */
function relativeLuminance([r, g, b]: readonly [number, number, number]): number {
  const ch = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

test("the act break is a visible colour change, not just a flag", () => {
  // A wipe between two identical colours renders as nothing. If someone retunes
  // the grounds and the boundary goes invisible, that should fail here rather
  // than be discovered by eye.
  //
  // This used to assert a raw channel-sum delta > 120, which the light palette
  // cleared easily by crossing from navy to off-white. Every ground is dark now, so
  // the largest move the palette can produce is `field` -> `base`: a channel delta
  // of 92 and a luminance ratio of 1.369. The threshold is re-expressed as that
  // ratio — a perceptual measure rather than an arithmetic one — with the channel
  // sum kept as a secondary floor so a retune that flattens the boundary still fails.
  //
  // Note the boundary's *legibility* no longer rests on delta magnitude alone: the
  // shader's per-tile hashed reveal (glGround.ts) is a per-pixel effect and reads
  // even across a modest colour change.
  const before = FIXTURE_STOPS[FIXTURE_ACT_BREAK_INDEX - 1];
  const at = FIXTURE_STOPS[FIXTURE_ACT_BREAK_INDEX];
  const a = parseGround(before!.color);
  const b = parseGround(at!.color);

  const delta = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  expect(delta).toBeGreaterThan(15);

  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const ratio = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  expect(ratio).toBeGreaterThanOrEqual(1.01);
});

test("Act I resolves to the light footprint ground", () => {
  expect(GROUND_STOPS.find((s) => s.id === "reach")?.color).toBe(GROUNDS.white.bg);
});

test("home page stops are light except the sections declared dark", () => {
  // This asserted `lum > 200` for EVERY stop, which stopped being true the moment
  // `blog` was given `ground: "field"` — the navy Intelligence Feed, which also
  // registers `useNavbarAnchor(..., { dark: true })` so the navbar inverts over it.
  // A blanket "everything is light" is not the design: the page is light *and*
  // punctuated by declared navy sections, and the thing worth gating is that those
  // two registries agree.
  //
  // `process` and `daily-life` joined `blog` in the dark set later — both already
  // rendered navy unconditionally (ProcessSection's own `bgcolor: NOIR.navyDeep`,
  // DailyLifeSection's card comment describing a `navyDeep` ground the film card
  // sits "one step deeper" than) and both already registered `useNavbarAnchor(...,
  // { dark: true })`. Their `ground` field was the one place still claiming light
  // (`void`) — this fixes that registry to match what every other signal already
  // said, rather than changing what renders.
  //
  // So: every stop's lightness must match the `dark` flag on the ground it names,
  // and the light ones must still dominate — a retune that quietly turns the page
  // navy again shows up as a count, not as a colour nobody looked at.
  for (const stop of GROUND_STOPS) {
    const isDark = GROUNDS[stop.ground].dark;
    if (isDark) {
      expect(lum(stop.id), `${stop.id} (${stop.color}) is declared dark`).toBeLessThan(80);
    } else {
      expect(lum(stop.id), `${stop.id} (${stop.color}) is declared light`).toBeGreaterThan(200);
    }
  }

  // `daily-life` and `blog` dropped out of this list when they relocated to
  // /about (PRD-home-client-focus §US-2); `closing` (ground "field", same
  // dark ground `blog` used to declare) is the one that stayed on home.
  // WS-02 added `global-markets` (ground "deep") right after the hero — the
  // lifted text blob's own full-viewport statement beat.
  const dark = GROUND_STOPS.filter((s) => GROUNDS[s.ground].dark);
  expect(dark.map((s) => s.id), "the home page's declared dark grounds").toEqual([
    "global-markets",
    "process",
    "closing",
  ]);
});

test("GROUNDS contains both light and dark grounds", () => {
  expect(Object.keys(GROUNDS)).toEqual(["void", "panel", "white", "floor", "base", "deep", "field"]);
  expect(GROUNDS.void.dark).toBe(false);
  expect(GROUNDS.base.dark).toBe(true);
});

test("parseGround falls back to grey rather than throwing", () => {
  expect(parseGround("#0A2A66")).toEqual([10, 42, 102]);
  expect(parseGround("common.white")).toEqual([128, 128, 128]);
  expect(parseGround("")).toEqual([128, 128, 128]);
});

test("mixRgb clamps and interpolates", () => {
  expect(mixRgb([0, 0, 0], [255, 255, 255], 0)).toEqual([0, 0, 0]);
  expect(mixRgb([0, 0, 0], [255, 255, 255], 1)).toEqual([255, 255, 255]);
  expect(mixRgb([0, 0, 0], [255, 255, 255], 0.5)).toEqual([128, 128, 128]);
  // Out-of-range t must not overshoot into invalid channel values.
  expect(mixRgb([0, 0, 0], [255, 255, 255], -3)).toEqual([0, 0, 0]);
  expect(mixRgb([0, 0, 0], [255, 255, 255], 9)).toEqual([255, 255, 255]);
});

test("smoothstep is clamped and symmetric about its midpoint", () => {
  expect(smoothstep(-1)).toBe(0);
  expect(smoothstep(0)).toBe(0);
  expect(smoothstep(0.5)).toBeCloseTo(0.5, 6);
  expect(smoothstep(1)).toBe(1);
  expect(smoothstep(2)).toBe(1);
  expect(smoothstep(0.25) + smoothstep(0.75)).toBeCloseTo(1, 6);
});

test("sampleGround holds a stable colour mid-section and blends only near the boundary", () => {
  const stops = GROUND_STOPS.slice(0, 2);
  const positions = [0, 4000];
  const blend = 500;

  // Deep inside the first section: the ground must not drift while you read.
  const mid = sampleGround(stops, positions, 1500, blend);
  expect(mid.color).toEqual(parseGround(stops[0]!.color));
  expect(mid.from).toEqual(parseGround(stops[0]!.color));
  expect(mid.progress).toBe(0);
  expect(mid.fromIndex).toBe(0);

  // Just before the boundary: partway between the two.
  const near = sampleGround(stops, positions, 4000 - blend / 2, blend);
  expect(near.color).not.toEqual(parseGround(stops[0]!.color));
  expect(near.color).not.toEqual(parseGround(stops[1]!.color));
  expect(near.progress).toBeGreaterThan(0);
  expect(near.progress).toBeLessThan(1);

  // At the boundary: fully arrived.
  const at = sampleGround(stops, positions, 4000, blend);
  expect(at.color).toEqual(parseGround(stops[1]!.color));
  expect(at.to).toEqual(parseGround(stops[1]!.color));
});

// This fixture needs an actual act break, which real home data no longer has
// (see "the home page's ground track has no act break" above) — it runs
// against a fixture with three stops so there's also a within-act boundary to
// contrast against, built the same way FIXTURE_STOPS was above.
const RUNWAY_FIXTURE_SECTIONS: readonly SectionDef[] = [
  { id: "fx-1", label: "1", chapter: 0, ground: "white" },
  { id: "fx-2", label: "2", chapter: 0, ground: "panel" },
  { id: "fx-3", label: "3", chapter: 1, ground: "deep" },
];
const RUNWAY_FIXTURE_CHAPTERS: readonly ChapterDef[] = [
  { index: 0, label: "A", act: "services" },
  { index: 1, label: "B", act: "people" },
];
const RUNWAY_STOPS = buildGroundStops(RUNWAY_FIXTURE_SECTIONS, RUNWAY_FIXTURE_CHAPTERS);
const RUNWAY_ACT_BREAK_INDEX = RUNWAY_STOPS.findIndex((s) => s.actBreak);

test("the act break gets no wider a runway than an ordinary boundary", () => {
  // The old contract reserved a wider seam blend for the act break specifically,
  // because a pinned section's measured offset shifts once GSAP sizes the pin
  // spacer. The tile wipe now fires identically at every boundary — see
  // `sampleGround`'s header — so the same blend distance must produce the same
  // shaped progress ramp whether or not the boundary happens to be an act break.
  const positions = RUNWAY_STOPS.map((_, i) => i * 4000);
  const blend = 400;

  // 200px before the act break, and 200px before the preceding (within-act)
  // boundary: same offset into an equal-width blend window either way.
  const atActBreak = sampleGround(RUNWAY_STOPS, positions, RUNWAY_ACT_BREAK_INDEX * 4000 - 200, blend);
  const atWithinAct = sampleGround(
    RUNWAY_STOPS,
    positions,
    (RUNWAY_ACT_BREAK_INDEX - 1) * 4000 - 200,
    blend,
  );

  expect(atActBreak.progress).toBeCloseTo(atWithinAct.progress, 6);
  expect(atActBreak.progress).toBeGreaterThan(0);
});

test("sampleGround ramps progress at every boundary, not only the act break", () => {
  const positions = RUNWAY_STOPS.map((_, i) => i * 1000);
  const blend = 400;

  // Approaching the act break, progress ramps up.
  const breakPos = RUNWAY_ACT_BREAK_INDEX * 1000;
  const atBreak = sampleGround(RUNWAY_STOPS, positions, breakPos - 1, blend);
  expect(atBreak.progress).toBeGreaterThan(0);

  // Approaching the within-act boundary, progress ramps up identically — this
  // used to stay flat at zero because only the act break carried a wipe.
  const withinAct = RUNWAY_ACT_BREAK_INDEX - 1;
  const atWithinAct = sampleGround(RUNWAY_STOPS, positions, withinAct * 1000 - 1, blend);
  expect(atWithinAct.progress).toBeGreaterThan(0);
});

test("sampleGround survives an empty track and a missing section", () => {
  expect(() => sampleGround([], [], 0, 100)).not.toThrow();
  // A section that never rendered gets Infinity for its position; the sampler must
  // simply never advance to it rather than produce NaN.
  const s = sampleGround(GROUND_STOPS.slice(0, 2), [0, Number.POSITIVE_INFINITY], 500, 400);
  expect(s.color.every((c) => Number.isFinite(c))).toBe(true);
  expect(s.from.every((c) => Number.isFinite(c))).toBe(true);
  expect(s.to.every((c) => Number.isFinite(c))).toBe(true);
  expect(Number.isFinite(s.progress)).toBe(true);
});

test("acts partition the stop list with no interleaving", () => {
  // Home collapsed to a single act (PRD-home-client-focus §US-2), so there
  // are zero switches now rather than the one Services -> People switch that
  // used to exist here.
  const acts = GROUND_STOPS.map((s) => s.act);
  const switches = acts.filter((a, i) => i > 0 && a !== acts[i - 1]).length;
  expect(switches).toBe(0);
  for (const stop of GROUND_STOPS) {
    const section = HOME_SECTIONS.find((s) => s.id === stop.id);
    expect(stop.act).toBe(actOfChapter(section!.chapter));
  }
});
