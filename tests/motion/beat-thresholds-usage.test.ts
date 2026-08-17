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
  expect(src).toMatch(/export const BEAT_START = "top 75%"/);
  expect(src).toMatch(/export const BEAT_EXIT_START = "bottom 30%"/);
  expect(src).toMatch(/export const BEAT_EXIT_END = "bottom top"/);
});
