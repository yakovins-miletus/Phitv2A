import { describe, it, expect } from "vitest";
import { hasReducedMotionListener, prefersReducedMotion } from "motion-dom";
import { mockReducedMotion } from "../test-utils";

function setTestReducedMotion(reduce: boolean) {
  mockReducedMotion(reduce);
  hasReducedMotionListener.current = true;
  prefersReducedMotion.current = reduce;
}

describe("TransitionCurtain Unit Timings Metadata", () => {
  it("motionDom prefersReducedMotion can be controlled in tests", () => {
    setTestReducedMotion(true);
    expect(prefersReducedMotion.current).toBe(true);
    setTestReducedMotion(false);
    expect(prefersReducedMotion.current).toBe(false);
  });
});
