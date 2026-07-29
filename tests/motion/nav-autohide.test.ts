import {
  NAV_AUTOHIDE,
  initialNavAutohideState,
  navAutohideReducer,
} from "@/shared/components/useNavAutohide";

// jsdom has no layout, so real scrolling cannot be exercised. Extracting the
// decision as a pure reducer is what makes these thresholds testable at all —
// previously they were four magic numbers inside an inline scroll handler in a
// 1300-line component, reachable by no test in the repo.

/** Feed a sequence of absolute scroll offsets, return the final state. */
const run = (ys: number[], startY = 0) =>
  ys.reduce(navAutohideReducer, initialNavAutohideState(startY));

test("nav starts visible", () => {
  expect(initialNavAutohideState().hidden).toBe(false);
  expect(initialNavAutohideState(500).lastY).toBe(500);
});

test("scrolling down past the threshold hides the nav", () => {
  // Get clear of the always-show band first, then take one decisive step down.
  const state = run([200, 400]);
  expect(state.hidden).toBe(true);
});

test("a downward nudge at or below the delta threshold does not hide it", () => {
  // Start already parked at `base`, so the single step under test IS the nudge.
  // (Scrolling *to* base from 0 is itself a big downward jump and would hide it.)
  const base = NAV_AUTOHIDE.ALWAYS_SHOW_ABOVE + 200;
  // Exactly at the threshold: the check is `diff > HIDE_ON_DOWN_DELTA`.
  expect(run([base + NAV_AUTOHIDE.HIDE_ON_DOWN_DELTA], base).hidden).toBe(false);
  expect(run([base + NAV_AUTOHIDE.HIDE_ON_DOWN_DELTA + 1], base).hidden).toBe(true);
});

test("returning near the top always reveals the nav", () => {
  const hidden = run([200, 400]);
  expect(hidden.hidden).toBe(true);
  const back = navAutohideReducer(hidden, NAV_AUTOHIDE.ALWAYS_SHOW_ABOVE - 1);
  expect(back.hidden).toBe(false);
  expect(back.accumulator).toBe(0);
});

test("small upward jitter does not reveal a hidden nav", () => {
  let s = run([200, 400]);
  expect(s.hidden).toBe(true);
  // Each step is above UP_DELTA_FLOOR (-10), so it is ignored entirely.
  for (let i = 0; i < 10; i += 1) s = navAutohideReducer(s, s.lastY - 5);
  expect(s.hidden).toBe(true);
  expect(s.accumulator).toBe(0);
});

test("sustained upward scrolling accumulates and reveals the nav", () => {
  let s = run([200, 800]);
  expect(s.hidden).toBe(true);
  // -12 per step clears UP_DELTA_FLOOR, so it accumulates; three steps pass
  // REVEAL_ACCUMULATOR (-25).
  s = navAutohideReducer(s, s.lastY - 12);
  expect(s.hidden).toBe(true);
  s = navAutohideReducer(s, s.lastY - 12);
  expect(s.hidden).toBe(true);
  s = navAutohideReducer(s, s.lastY - 12);
  expect(s.hidden).toBe(false);
});

test("a downward move resets the upward accumulator", () => {
  let s = run([200, 800]);
  s = navAutohideReducer(s, s.lastY - 12);
  expect(s.accumulator).toBeLessThan(0);
  s = navAutohideReducer(s, s.lastY + 50);
  expect(s.accumulator).toBe(0);
  expect(s.hidden).toBe(true);
});

test("re-baselining prevents the post-navigation flicker", () => {
  // The bug: land on a short page after a tall one. Without re-baselining, the
  // first event diffs the new offset against the old page's, producing a large
  // negative or positive jump and a one-frame nav flicker.
  const staleFromTallPage: ReturnType<typeof initialNavAutohideState> = {
    hidden: false,
    lastY: 9000,
    accumulator: 0,
  };
  // First scroll on the new short page, at offset 300.
  const withStaleBaseline = navAutohideReducer(staleFromTallPage, 300);
  // diff is -8700: a huge phantom upward jump.
  expect(withStaleBaseline.accumulator).toBeLessThan(NAV_AUTOHIDE.REVEAL_ACCUMULATOR);

  // Re-baselined, the same event is a no-op and nothing moves.
  const fresh = navAutohideReducer(initialNavAutohideState(300), 300);
  expect(fresh.accumulator).toBe(0);
  expect(fresh.hidden).toBe(false);
  expect(fresh.lastY).toBe(300);
});

test("thresholds are the values the nav was tuned against", () => {
  expect(NAV_AUTOHIDE).toEqual({
    ALWAYS_SHOW_ABOVE: 80,
    HIDE_ON_DOWN_DELTA: 8,
    UP_DELTA_FLOOR: -10,
    REVEAL_ACCUMULATOR: -25,
    REVEAL_NEAR_TOP: 120,
  });
});
