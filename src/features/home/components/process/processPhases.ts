/**
 * "From our practices…" — pinned, scroll-scrubbed year-by-year reveal.
 *
 * Pure geometry / timing constants + the phase photo table for the `process`
 * beat's desktop scrub (`ProcessScrubStage`), kept out of the component so they
 * are unit-testable the same way `closingPhases.ts` and `dailyLifePhases.ts` are.
 *
 * The section is pinned for `PROCESS_PIN_VH` viewport-heights. Over the pin's
 * 0..1 progress `p` a hysteretic 3-stage machine (`processStageFor`) picks which
 * year is showing — 2019 → 2020‑2025 → 2026 — and the ONLY visible transition is
 * the `PixelSwap` spiral dissolve fired on each stage change. There is no frame
 * resize. A mini segmented progress bar under the frame tracks `p`.
 *
 * | stage | p range (fwd) | image     | note                                   |
 * |-------|---------------|-----------|----------------------------------------|
 * | 0     | 0.00–0.30     | 2019      | navy backdrop fades 0→1 over 0.00–0.035 |
 * | 1     | 0.30–0.64     | 2020‑2025 | spiral dissolve fires at p ≥ 0.30       |
 * | 2     | 0.64–1.00     | 2026      | spiral dissolve fires at p ≥ 0.64       |
 *
 * Coming back down the stage only retreats below the lower `_DOWN` thresholds
 * (0.22 / 0.56) so a scroll flick at a boundary can't flip-flop the dissolve.
 */

/** Pin length as a multiple of `window.innerHeight`. Long enough that the
 *  section visibly LOCKS and each year reads before the next, but no longer:
 *  every stretch of the pin now advances the progress bar and dwells on a photo
 *  (no dead frame-resize scrub). Downstream triggers (`BarTransitionSection`,
 *  `reach`, `closing`) shift down with this — re-check `tests/e2e/ladder-probe.js`. */
export const PROCESS_PIN_VH = 5;

/** Stage transition thresholds with hysteresis. `_UP` fires going forward (the
 *  spiral dissolve to the next year plays here); the lower `_DOWN` only fires
 *  scrolling back up. `_UP` values double as the progress-bar segment bounds. */
export const STAGE_1_UP = 0.3;
export const STAGE_1_DOWN = 0.22;
export const STAGE_2_UP = 0.64;
export const STAGE_2_DOWN = 0.56;

/** Progress-bar segment boundaries (one filled sub-bar per year). */
export const SEG_BOUNDS = [STAGE_1_UP, STAGE_2_UP] as const;

/** Navy backdrop opacity ramp: fades 0 → 1 over the first slice of the pin as
 *  the section locks, then holds navy for the rest (the `BarTransitionSection`
 *  that follows is `from="deep"`, so the handoff must still be navy at p=1). */
export const BG_IN_END = 0.035;

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** Navy backdrop opacity for pin progress `p` — 0 before the lock, 1 once
 *  locked, held. */
export const bgOpacityFor = (p: number): number => clamp01(p / BG_IN_END);

export type ProcessStage = 0 | 1 | 2;

/** Which year is showing at pin progress `p`, given the stage we're already in.
 *  Hysteretic: advances at `_UP`, retreats only below `_DOWN`. This is the sole
 *  driver of the year — and therefore of the spiral dissolves and the lit
 *  caption. */
export const processStageFor = (p: number, current: ProcessStage): ProcessStage => {
  let s: ProcessStage = current;
  if (s < 1 && p >= STAGE_1_UP) s = 1;
  if (s < 2 && p >= STAGE_2_UP) s = 2;
  if (s > 1 && p < STAGE_2_DOWN) s = 1;
  if (s > 0 && p < STAGE_1_DOWN) s = 0;
  return s;
};

export interface PixelSwapState {
  /** 2019 → 2020‑2025 dissolve target. */
  swap1Active: boolean;
  /** 2020‑2025 → 2026 dissolve target. */
  swap2Active: boolean;
  /** The second PixelSwap is only painted once stage ≥ 1 (before that it holds
   *  2020‑2025 behind an invisible layer, which would flash if shown at stage 0). */
  swap2Visible: boolean;
}

export const pixelSwapStateFor = (stage: ProcessStage): PixelSwapState => ({
  swap1Active: stage >= 1,
  swap2Active: stage >= 2,
  swap2Visible: stage >= 1,
});

/** Fill fraction (0..1) of progress-bar segment `i` (0|1|2) at pin progress `p`.
 *  Segment 0 fills over [0, SEG_BOUNDS[0]], segment 1 over
 *  [SEG_BOUNDS[0], SEG_BOUNDS[1]], segment 2 over [SEG_BOUNDS[1], 1]. */
export const segmentFillFor = (p: number, i: 0 | 1 | 2): number => {
  const lo = i === 0 ? 0 : SEG_BOUNDS[i - 1]!;
  const hi = i === 2 ? 1 : SEG_BOUNDS[i]!;
  return clamp01((p - lo) / (hi - lo));
};

export interface ProcessPhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/**
 * Photos are keyed to `CONTENT.process.phases` BY POSITION (not by phase id), so
 * a custom or empty model degrades to fewer frames rather than mismatched ones.
 *
 * `tests/process-diagram.test.tsx` matches these alts by regex — keep the
 * substrings "2019 … focused engineering team", "2020 to 2025 … expansion" and
 * "2026 … whole company" intact when swapping assets.
 */
export const PROCESS_PHOTOS: readonly ProcessPhoto[] = [
  {
    // 2019 — two engineers pairing at a workstation: the small focused team.
    // Replaced the solo `FocusedProgramming.webp`, which read as one person.
    src: "/images/grads/Coordination.webp",
    alt: "2019 — a small focused engineering team at work on the core infrastructure",
    width: 1920,
    height: 1080,
  },
  {
    src: "/images/hero-wall/expanding-horizons-phitopolis-unveils-its-new-office-02.webp",
    alt: "2020 to 2025 — the expansion years, the team gathered in the newly opened office",
    width: 1187,
    height: 792,
  },
  {
    // 2026 — the 6th-anniversary company photo, the most recent and widest crowd
    // of the three so the growth story still reads forward. Replaced
    // `group-pic-final-2048x1687.webp`.
    src: "/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/07.webp",
    alt: "2026 — the whole company gathered together, four disciplines in one frame",
    width: 1520,
    height: 856,
  },
];
