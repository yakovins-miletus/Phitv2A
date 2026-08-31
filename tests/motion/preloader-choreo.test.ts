import { describe, expect, test } from "vitest";

import {
  WIPE_HIDDEN,
  WIPE_SHOWN,
  WIPE_OUT,
  CHAR_BLUR_PX,
  WIPE_S,
  WIPE_DELAY_S,
  CHAR_STAGGER_S,
  RISE_Y_PX,
  RISE_OPACITY_FROM,
  RISE_S,
  PROGRESS_RISE_DELAY_S,
  PUSH_S,
  HOLD_S,
  SEQ_2_HOLD_S,
  POST_HOLD_S,
  SEQ_1_AT_S,
  SEQ_1_LEN_S,
  SEQ_2_AT_S,
  SEQ_2_LEN_S,
  CHOREO_END_S,
  ESC_HINT_AT_S,
  STATEMENT_LINES,
  STATEMENT_WIPE_S,
  trackingOffset,
} from "@/shared/components/preloaderChoreo";

/**
 * Value-parity lock for the Preloader intro. Mirrors the style of
 * `tests/motion/hero-scene.test.ts` — assert the invariants `Preloader.tsx`
 * relies on, not exact tuples.
 */

describe("preloader choreo — the rise", () => {
  test("a small, positive translate with a nonzero opacity floor — a rise, not a flight", () => {
    expect(RISE_Y_PX).toBeGreaterThan(0);
    // Anything much larger than ~48px on a compact instrument readout would
    // read as a section entrance, not a small instrument settling into place.
    expect(RISE_Y_PX).toBeLessThanOrEqual(48);
    expect(RISE_OPACITY_FROM).toBeGreaterThan(0);
    expect(RISE_OPACITY_FROM).toBeLessThan(1);
  });

  test("the progress row rises after the mark row, not simultaneously", () => {
    expect(PROGRESS_RISE_DELAY_S).toBeGreaterThan(0);
    expect(PROGRESS_RISE_DELAY_S).toBeLessThan(RISE_S);
  });

  test("the push (layout reflow) shares the rise's duration — one motion vocabulary", () => {
    expect(PUSH_S).toBe(RISE_S);
  });
});

describe("preloader choreo — tracking", () => {
  test("antisymmetric about the block centre and sums to ~0", () => {
    const count = 10;
    expect(trackingOffset(0, count)).toBeCloseTo(-trackingOffset(9, count), 10);

    let sum = 0;
    for (let i = 0; i < count; i += 1) sum += trackingOffset(i, count);
    expect(sum).toBeCloseTo(0, 10);
  });

  test("centre letters sit nearer 0 than edge letters", () => {
    const count = 10;
    const edge = Math.abs(trackingOffset(0, count));
    expect(Math.abs(trackingOffset(4, count))).toBeLessThan(edge);
    expect(Math.abs(trackingOffset(5, count))).toBeLessThan(edge);
  });

  test("two reads give identical values — deterministic, no Math.random", () => {
    expect(trackingOffset(3, 10)).toBe(trackingOffset(3, 10));
  });
});

describe("preloader choreo — constants", () => {
  test("CHAR_BLUR_PX stays <= 5 — the wordmark must stay readable mid-animation", () => {
    expect(CHAR_BLUR_PX).toBeLessThanOrEqual(5);
  });

  test("wipe constants are the exact establishChoreo mask literals", () => {
    expect(WIPE_HIDDEN).toBe("inset(0% 100% 0% 0%)");
    expect(WIPE_SHOWN).toBe("inset(0% 0% 0% 0%)");
    expect(WIPE_OUT).toBe("inset(0% 0% 0% 100%)");
  });
});

/**
 * THE REGRESSION THIS SUITE EXISTS FOR.
 *
 * The intro is two DISJOINT sequences separated by held stillness. Each
 * sequence's last frame must land inside its own slot — an act that bleeds
 * past `SEQ_n_LEN_S` is still animating when the "hold" is supposed to be
 * stillness, which is exactly the read the holds exist to produce.
 *
 * A previous revision guarded a single `ASSEMBLY_BUDGET_S` against a
 * warm-cache exit, using a hardcoded literal that mirrored `Preloader.tsx`'s
 * `BEAT_S` and would have desynced silently. Neither exists any more: the
 * exit doesn't race the choreography (it waits on `CHOREO_END_S`), so what's
 * pinned here is the internal arithmetic of the table.
 */
describe("preloader choreo — each sequence fits its slot", () => {
  const WORDMARK_LEN = 10; // "PHITOPOLIS"

  test("SEQ 1: the mark's rise lands within SEQ_1_LEN_S", () => {
    expect(RISE_S).toBeLessThanOrEqual(SEQ_1_LEN_S);
  });

  test("SEQ 1: the progress row's rise lands within SEQ_1_LEN_S", () => {
    expect(PROGRESS_RISE_DELAY_S + RISE_S).toBeLessThanOrEqual(SEQ_1_LEN_S);
  });

  test("SEQ 1: the last letter lands within SEQ_1_LEN_S", () => {
    const lastLetterEnd = WIPE_DELAY_S + (WORDMARK_LEN - 1) * CHAR_STAGGER_S + WIPE_S;
    expect(lastLetterEnd).toBeLessThanOrEqual(SEQ_1_LEN_S);
  });

  test("SEQ 1: the laser's trailing fade lands within SEQ_1_LEN_S", () => {
    // The laser runs WIPE_S * 1.25 from the same wipe delay.
    expect(WIPE_DELAY_S + WIPE_S * 1.25).toBeLessThanOrEqual(SEQ_1_LEN_S);
  });

  test("SEQ 2: the description's rise + push lands within SEQ_2_LEN_S", () => {
    expect(Math.max(RISE_S, PUSH_S)).toBeLessThanOrEqual(SEQ_2_LEN_S);
  });

  test("SEQ 2: the last statement line lands within SEQ_2_LEN_S", () => {
    const lastLineEnd = Math.max(...STATEMENT_LINES.map((l) => l.delayS)) + STATEMENT_WIPE_S;
    expect(lastLineEnd).toBeLessThanOrEqual(SEQ_2_LEN_S);
  });
});

describe("preloader choreo — the timeline is ordered and held", () => {
  test("the sequences start in order", () => {
    expect(SEQ_1_AT_S).toBe(0);
    expect(SEQ_2_AT_S).toBeGreaterThan(SEQ_1_AT_S);
  });

  test("SEQ 2 owns its lead-in hold; a full hold also separates SEQ 2 from the buffer", () => {
    // SEQ 2's held silence is its own first beat (SEQ_2_HOLD_S), not a
    // freestanding gap between SEQ 1 and SEQ 2 — see the module docblock.
    expect(SEQ_1_AT_S + SEQ_1_LEN_S + SEQ_2_HOLD_S).toBeCloseTo(SEQ_2_AT_S, 6);
    expect(SEQ_2_AT_S + SEQ_2_LEN_S + HOLD_S).toBeCloseTo(CHOREO_END_S, 6);
  });

  test("the holds are long enough to read as deliberate stillness", () => {
    // The whole point of the rework. Anything under a second reads as a stutter.
    expect(SEQ_2_HOLD_S).toBeGreaterThanOrEqual(1.2);
    expect(HOLD_S).toBeGreaterThanOrEqual(1.2);
    expect(POST_HOLD_S).toBeGreaterThanOrEqual(2);
  });

  test("the ESC hint arms during SEQ 2's lead-in hold, not during a sequence's action", () => {
    expect(ESC_HINT_AT_S).toBeGreaterThan(SEQ_1_AT_S + SEQ_1_LEN_S);
    expect(ESC_HINT_AT_S).toBeLessThan(SEQ_2_AT_S);
  });

  test("the whole intro clears Preloader.tsx's failsafe ceiling", () => {
    // Mirrors Preloader.tsx: SIGNAL_CAP_AFTER_CHOREO_MS 1500, OUT_DURATION_S
    // 2.0, BEAT_FAILSAFE_MS 12000. The failsafe must remain unreachable on
    // every non-forced path, or it truncates the reveal.
    const worstPathMs = CHOREO_END_S * 1000 + 1500 + POST_HOLD_S * 1000 + 2000;
    expect(worstPathMs).toBeLessThan(12000);
  });
});

describe("preloader choreo — the statement", () => {
  test("there are exactly two lines, tagline then descriptor", () => {
    expect(STATEMENT_LINES).toHaveLength(2);
    expect(STATEMENT_LINES.map((l) => l.id)).toEqual(["tagline", "descriptor"]);
  });

  test("the copy is pinned — this is brand copy on the first frame of the site", () => {
    expect(STATEMENT_LINES[0].text).toBe("Making Tomorrow's Technology Available, Today");
    expect(STATEMENT_LINES[1].text).toBe("A COMPETITIVE R&D FINTECH FIRM");
  });

  test("the lines step in, they do not land together", () => {
    expect(STATEMENT_LINES[0].delayS).toBe(0);
    expect(STATEMENT_LINES[1].delayS).toBeGreaterThan(0);
  });
});
