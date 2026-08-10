import {
  ACT_BREAK_INDEX,
  GROUND_STOPS,
  mixRgb,
  parseGround,
  sampleGround,
  smoothstep,
} from "@/shared/components/ground/groundStops";
import { HOME_SECTIONS, actOfChapter } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";

// The ground track is pure data and pure maths, deliberately split from the
// renderers so it can be tested without a canvas or a WebGL context. These tests
// are the reason the WebGL and CSS paths cannot disagree about *what* to paint —
// they only differ in how.

test("every rendered section has a stop, in scroll order", () => {
  const UNRENDERED = ["closing", "hero-flatten", "hero-align", "hero-reveal", "hero-dwell"];
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

test("there is exactly one act break, and it is reach -> daily-life", () => {
  const breaks = GROUND_STOPS.filter((s) => s.actBreak);
  expect(breaks).toHaveLength(1);
  expect(ACT_BREAK_INDEX).toBeGreaterThan(0);

  const at = GROUND_STOPS[ACT_BREAK_INDEX];
  const before = GROUND_STOPS[ACT_BREAK_INDEX - 1];
  expect(before?.id).toBe("reach");
  expect(at?.id).toBe("daily-life");
  expect(before?.act).toBe("services");
  expect(at?.act).toBe("people");
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
  // the grounds and the seam goes invisible, that should fail here rather than be
  // discovered by eye.
  //
  // This used to assert a raw channel-sum delta > 120, which the light palette
  // cleared easily by crossing from navy to off-white. Every ground is dark now, so
  // the largest move the palette can produce is `field` -> `base`: a channel delta
  // of 92 and a luminance ratio of 1.369. The threshold is re-expressed as that
  // ratio — a perceptual measure rather than an arithmetic one — with the channel
  // sum kept as a secondary floor so a retune that flattens the seam still fails.
  //
  // Note the seam's *legibility* no longer rests on delta magnitude alone: the
  // shader's directional wipe (glGround.ts) is a per-pixel effect and reads even
  // across a modest colour change.
  const before = GROUND_STOPS[ACT_BREAK_INDEX - 1];
  const at = GROUND_STOPS[ACT_BREAK_INDEX];
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

  const dark = GROUND_STOPS.filter((s) => GROUNDS[s.ground].dark);
  expect(dark.map((s) => s.id), "the home page's declared dark grounds").toEqual(["blog"]);
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

test("sampleGround holds a stable colour mid-section and blends only near the seam", () => {
  const stops = GROUND_STOPS.slice(0, 2);
  const positions = [0, 4000];
  const blend = 500;

  // Deep inside the first section: the ground must not drift while you read.
  const mid = sampleGround(stops, positions, 1500, blend);
  expect(mid.color).toEqual(parseGround(stops[0]!.color));
  expect(mid.fromIndex).toBe(0);

  // Just before the boundary: partway between the two.
  const near = sampleGround(stops, positions, 4000 - blend / 2, blend);
  expect(near.color).not.toEqual(parseGround(stops[0]!.color));
  expect(near.color).not.toEqual(parseGround(stops[1]!.color));

  // At the boundary: fully arrived.
  const at = sampleGround(stops, positions, 4000, blend);
  expect(at.color).toEqual(parseGround(stops[1]!.color));
});

test("the act break gets a wider runway than an ordinary boundary", () => {
  // `daily-life` is pinned, so its measured offset shifts once GSAP sizes the pin
  // spacer. A wider seam blend means that late correction lands inside a gradient
  // that is already moving rather than as a visible snap.
  const positions = GROUND_STOPS.map((_, i) => i * 4000);
  const blend = 400;
  const seamBlend = 1600;

  // 800px before the act break: outside the ordinary blend, inside the seam blend.
  const y = ACT_BREAK_INDEX * 4000 - 800;
  const narrow = sampleGround(GROUND_STOPS, positions, y, blend, blend);
  const wide = sampleGround(GROUND_STOPS, positions, y, blend, seamBlend);

  expect(narrow.seam).toBe(0);
  expect(wide.seam).toBeGreaterThan(0);

  // A non-act boundary must be unaffected by the seam width.
  const inside = (ACT_BREAK_INDEX - 1) * 4000 - 800;
  expect(sampleGround(GROUND_STOPS, positions, inside, blend, seamBlend).color).toEqual(
    sampleGround(GROUND_STOPS, positions, inside, blend, blend).color,
  );
});

test("sampleGround reports seam only across an act break", () => {
  const positions = GROUND_STOPS.map((_, i) => i * 1000);
  const blend = 400;

  // Approaching the act break, seam ramps up.
  const breakPos = ACT_BREAK_INDEX * 1000;
  const atBreak = sampleGround(GROUND_STOPS, positions, breakPos - 1, blend);
  expect(atBreak.seam).toBeGreaterThan(0);

  // Approaching any within-act boundary, it stays flat at zero.
  const withinAct = ACT_BREAK_INDEX - 1;
  const inside = sampleGround(GROUND_STOPS, positions, withinAct * 1000 - 1, blend);
  expect(inside.seam).toBe(0);
});

test("sampleGround survives an empty track and a missing section", () => {
  expect(() => sampleGround([], [], 0, 100)).not.toThrow();
  // A section that never rendered gets Infinity for its position; the sampler must
  // simply never advance to it rather than produce NaN.
  const s = sampleGround(GROUND_STOPS.slice(0, 2), [0, Number.POSITIVE_INFINITY], 500, 400);
  expect(s.color.every((c) => Number.isFinite(c))).toBe(true);
});

test("acts partition the stop list with no interleaving", () => {
  const acts = GROUND_STOPS.map((s) => s.act);
  const switches = acts.filter((a, i) => i > 0 && a !== acts[i - 1]).length;
  expect(switches).toBe(1);
  for (const stop of GROUND_STOPS) {
    const section = HOME_SECTIONS.find((s) => s.id === stop.id);
    expect(stop.act).toBe(actOfChapter(section!.chapter));
  }
});
