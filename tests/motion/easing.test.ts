import {
  EASE_IN_OUT_QUART,
  EASE_IN_OUT_QUART_CSS,
  EASE_OUT_EXPO,
  EASE_OUT_EXPO_CSS,
  EASE_SPRING_SOFT,
  EASE_SPRING_SOFT_CSS,
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

test("the spring curve overshoots on y only, and its CSS string matches", () => {
  expect(EASE_SPRING_SOFT).toEqual([0.34, 1.56, 0.64, 1]);
  expect(EASE_SPRING_SOFT_CSS).toBe("cubic-bezier(0.34, 1.56, 0.64, 1)");
  // The overshoot is the point — a thumb that passes its mark and settles. It must
  // be on y (the second control ordinate); an x outside 0..1 would make the browser
  // drop the declaration entirely, which is what the next test guards for all three.
  expect(EASE_SPRING_SOFT[1]).toBeGreaterThan(1);
});

test("every curve is a valid cubic-bezier: control abscissae inside 0..1", () => {
  // x outside [0,1] is not a function of time and the browser drops the whole
  // declaration. y may legitimately overshoot; x may not.
  for (const [x1, , x2] of [EASE_OUT_EXPO, EASE_IN_OUT_QUART, EASE_SPRING_SOFT]) {
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
