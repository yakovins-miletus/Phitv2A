import fs from "node:fs";
import path from "node:path";

// Grep-style guard, same spirit as easing.test.ts: source-level assertions
// that are cheap insurance against a hand-typed threshold sneaking back in.
//
// Before beatThresholds.ts the page carried four uncoordinated values (78%,
// 85%, 78%, 78%) with no convention behind them — see that module's doc. Every
// reveal trigger now goes through `BEAT_START` / `BEAT_EXIT_START` /
// `BEAT_EXIT_END`, so a stray literal `"top 7X%"` / `"bottom X%"` string in
// `SectionBeat.tsx` or a migrated section file means someone bypassed the
// constant, and this test fails on that line rather than on a ladder-probe
// diff someone has to notice by eye.

const SRC = path.resolve(__dirname, "../../src");

// Every file that builds a beat's own entrance/exit ScrollTrigger. Extend
// this list as more sections migrate to SectionBeat.
const REVEAL_FILES = [
  "shared/components/stage/SectionBeat.tsx",
  "features/hero/description/MissionStatement.tsx",
  "features/hero/description/OperatingPillars.tsx",
  "features/hero/description/MarketPosition.tsx",
  "features/services/components/CapabilityRack.tsx",
  "features/home/components/ProcessSection.tsx",
  "features/home/components/ReachSection.tsx",
  "features/home/components/CandidatesAndCareersSection.tsx",
  "features/home/components/TestimonialsSection.tsx",
  "features/home/components/BlogSection.tsx",
  "features/home/components/ClosingShelf.tsx",
];

// A quoted ScrollTrigger position string of the shape "top 75%" / 'bottom 30%'.
const POSITION_STRING = /["'`](top|bottom) \d+%["'`]/;

// `useStagePresence`'s "top 50%" / "bottom 50%" is a documented, deliberate
// exemption (see beatThresholds.ts's module doc): it is a presence tracker,
// not a reveal threshold, and none of the files above define it inline
// anyway (it lives in stage/stagePresence.ts) — kept here in case that ever
// changes.
const EXEMPT = /top 50%|bottom 50%/;

test("beat/reveal code uses only the beatThresholds constants for reveal thresholds", () => {
  const offenders: string[] = [];

  for (const rel of REVEAL_FILES) {
    const file = path.join(SRC, rel);
    const src = fs.readFileSync(file, "utf8");
    src.split("\n").forEach((line, index) => {
      if (POSITION_STRING.test(line) && !EXEMPT.test(line)) {
        offenders.push(`${rel}:${index + 1}: ${line.trim()}`);
      }
    });
  }

  expect(offenders).toEqual([]);
});

test("beatThresholds.ts itself still defines the three constants these files rely on", () => {
  const src = fs.readFileSync(path.join(SRC, "shared/motion/beatThresholds.ts"), "utf8");
  // Shape, not value. This test exists so the constants the files above import
  // cannot quietly disappear; the thresholds themselves are tuning knobs and
  // pinning their literals here only made this a change-detector that had to be
  // edited every time the page's entrance feel was adjusted.
  expect(src).toMatch(/export const BEAT_START = "top \d+%"/);
  expect(src).toMatch(/export const BEAT_EXIT_START = "bottom \d+%"/);
  expect(src).toMatch(/export const BEAT_EXIT_END = "bottom top"/);
});

test("STAGE_EXIT animates opacity only — no transform in the scrubbed recede", () => {
  // Regression guard for the "pillars and leadership move back and forth" bug.
  // SectionBeat's exit dim is the page's one scrubbed non-pin tween, so it
  // plays backwards on every scroll micro-reversal Lenis produces. Any x/y/
  // scale in STAGE_EXIT turns that reversal into a visible slide. See the
  // comment on STAGE_EXIT in stageChoreo.ts.
  const src = fs.readFileSync(path.join(SRC, "shared/components/stageChoreo.ts"), "utf8");
  const decl = /export const STAGE_EXIT = \{([^}]*)\}/.exec(src);
  expect(decl).not.toBeNull();
  const body = decl![1];
  expect(body).toMatch(/autoAlpha:/);
  expect(body).not.toMatch(/\b(x|y|scale|rotation|clipPath)\s*:/);
});
