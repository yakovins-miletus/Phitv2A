import {
  EASE_IN_OUT_QUART,
  EASE_IN_OUT_QUART_CSS,
  EASE_OUT_EXPO,
  EASE_OUT_EXPO_CSS,
} from "@/shared/motion/easing";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";

// Cheap insurance. These tuples were previously retyped at 23 call sites, so a
// well-meant "round these off" would have been invisible in review. Now it
// fails here instead.

test("the two curves are exactly the values every call site used to inline", () => {
  expect(EASE_OUT_EXPO).toEqual([0.16, 1, 0.3, 1]);
  expect(EASE_IN_OUT_QUART).toEqual([0.76, 0, 0.24, 1]);
});

test("the CSS strings match the tuples they are derived from", () => {
  expect(EASE_OUT_EXPO_CSS).toBe("cubic-bezier(0.16, 1, 0.3, 1)");
  expect(EASE_IN_OUT_QUART_CSS).toBe("cubic-bezier(0.76, 0, 0.24, 1)");
  // The formatting has to stay byte-identical to the hand-written strings it
  // replaced, or emotion generates a different class for the same declaration.
  for (const [tuple, css] of [
    [EASE_OUT_EXPO, EASE_OUT_EXPO_CSS],
    [EASE_IN_OUT_QUART, EASE_IN_OUT_QUART_CSS],
  ] as const) {
    expect(css).toBe(`cubic-bezier(${tuple.join(", ")})`);
  }
});

test("both curves are valid cubic-beziers: control abscissae inside 0..1", () => {
  // x outside [0,1] is not a function of time and the browser drops the whole
  // declaration. y may legitimately overshoot; x may not.
  for (const [x1, , x2] of [EASE_OUT_EXPO, EASE_IN_OUT_QUART]) {
    expect(x1).toBeGreaterThanOrEqual(0);
    expect(x1).toBeLessThanOrEqual(1);
    expect(x2).toBeGreaterThanOrEqual(0);
    expect(x2).toBeLessThanOrEqual(1);
  }
});

test("decorative easing stays separate from scroll navigation speed", () => {
  // SCROLL_SPEED governs Lenis scrollTo duration and ScrollTrigger scrub lag.
  // It is deliberately a different system from the easing curves above; folding
  // them together would couple hover transitions to scroll feel.
  expect(SCROLL_SPEED).toBe(0.65);
});
