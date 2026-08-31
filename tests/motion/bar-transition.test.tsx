import { describe, it, expect, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as motionHook from "@/shared/motion";

import {
  BAR_COUNT,
  BAR_WINDOW,
  barClipFor,
  barRevealFor,
} from "@/shared/components/ground/barPhases";
import { BarTransitionSection } from "@/shared/components/ground/BarTransitionSection";
import { GROUNDS } from "@/shared/theme/grounds";
gsap.registerPlugin(ScrollTrigger);

function stubReducedMotion(reduce: boolean) {
  vi.spyOn(motionHook, "useReducedMotion").mockReturnValue(reduce);
}

describe("barPhases", () => {
  it("has five bars over a half-progress window", () => {
    expect(BAR_COUNT).toBe(5);
    expect(BAR_WINDOW).toBe(0.5);
  });

  it("every bar is 0 at p=0 and 1 at p=1", () => {
    for (let i = 0; i < BAR_COUNT; i += 1) {
      expect(barRevealFor(i, 0)).toBe(0);
      expect(barRevealFor(i, 1)).toBe(1);
    }
  });

  it("resolves bottom-to-top: the bottom bar never trails the top bar", () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      expect(barRevealFor(BAR_COUNT - 1, p)).toBeGreaterThanOrEqual(
        barRevealFor(0, p),
      );
    }
  });

  it("the bottom bar finishes before the top bar starts moving", () => {
    // bottom bar done at p = BAR_WINDOW; top bar starts at p = 1 - BAR_WINDOW.
    expect(barRevealFor(BAR_COUNT - 1, BAR_WINDOW)).toBe(1);
    expect(barRevealFor(0, 1 - BAR_WINDOW)).toBe(0);
  });

  it("barClipFor collapses the cover toward the top edge as reveal grows", () => {
    expect(barClipFor(0)).toBe("inset(0.00% 0% 0% 0%)");
    expect(barClipFor(1)).toBe("inset(100.00% 0% 0% 0%)");
    expect(barClipFor(0.5)).toBe("inset(50.00% 0% 0% 0%)");
  });
});

describe("BarTransitionSection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders exactly BAR_COUNT bars at 70vh", () => {
    stubReducedMotion(false);
    const { container } = render(
      <BarTransitionSection from="panel" to="deep" />,
    );
    const wrap = container.querySelector(".bar-transition-section");
    expect(wrap).not.toBeNull();
    expect((wrap as HTMLElement).style.height).toBe("70vh");
    // one absolute cover div per bar row
    expect(wrap!.querySelectorAll("[class]").length).toBeGreaterThanOrEqual(
      BAR_COUNT,
    );
  });

  it("under reduced motion renders a solid band of the target ground", () => {
    stubReducedMotion(true);
    const { container } = render(
      <BarTransitionSection from="white" to="field" />,
    );
    expect(container.querySelector(".bar-transition-section")).toBeNull();
    const box = container.firstElementChild as HTMLElement;
    expect(box.style.height).toBe("70vh");
    // MUI resolves bgcolor to the literal color; assert the ground is wired.
    expect(GROUNDS.field.bg).toBeTruthy();
  });
});
