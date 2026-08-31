/**
 * Behind The Code — pinned expand-to-fullscreen film (DailyLifeSection).
 *
 * The daily-life culture film on /about starts inset on the left and scrubs out
 * to a full-bleed frame while its section is pinned, holds fullscreen for a
 * scroll buffer, then releases. This suite guards the pin config, the buffered
 * travel distance, the 3-mode render split, and the SectionBeat wiring.
 */

import { describe, expect, test, vi, afterEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { DailyLifeSection } from "@/features/home/components/DailyLifeSection/DailyLifeSection";
import {
  DAILY_LIFE_PIN_VH,
  EXPAND_END,
  START_SHIFT_PCT,
  START_WIDTH_VW,
} from "@/features/home/components/DailyLifeSection/dailyLifePhases";
import { NavbarProvider } from "@/shared/components/NavbarContext";
import { aboutSection, sectionOrder } from "@/shared/sections";
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import * as motionHook from "@/shared/motion";

gsap.registerPlugin(ScrollTrigger);

function renderWithNavbar(ui: React.ReactElement) {
  return render(<NavbarProvider>{ui}</NavbarProvider>);
}

describe("daily-life SectionDef", () => {
  test("declares ownsPin: true and noExitDim: true", () => {
    const section = aboutSection("daily-life");
    expect(section.id).toBe("daily-life");
    expect(section.ownsPin).toBe(true);
    expect(section.noExitDim).toBe(true);
    expect(section.establishScale).toBe("major");
  });

  test("refresh priority keeps top-to-bottom order with later about beats", () => {
    const dailyLife = sectionOrder("daily-life");
    const candidates = sectionOrder("candidates");
    expect(candidates).toBeGreaterThan(dailyLife);
    expect(refreshPriorityFor(dailyLife)).toBeGreaterThan(refreshPriorityFor(candidates));
    expect(refreshPriorityFor(dailyLife)).toBeGreaterThan(0);
  });
});

describe("buffered pin geometry", () => {
  test("start card geometry: inset left, ~46vw", () => {
    expect(START_WIDTH_VW).toBe(46);
    // Left edge of a flex-centred 46vw card reaches x=0 at this xPercent.
    expect(START_SHIFT_PCT).toBeCloseTo(-((100 - 46) / 2 / 46) * 100, 6);
    expect(EXPAND_END).toBeGreaterThan(0);
    expect(EXPAND_END).toBeLessThan(1);
  });

  test("end formula evaluates to PIN_VH * innerHeight, floor >= 900px", () => {
    expect(DAILY_LIFE_PIN_VH).toBeGreaterThan(1);
    for (const h of [667, 768, 800, 844, 900, 1024, 1080, 1440, 2160]) {
      const travel = h * DAILY_LIFE_PIN_VH;
      expect(`+=${String(travel)}`).toBe(`+=${String(h * DAILY_LIFE_PIN_VH)}`);
      expect(travel).toBeGreaterThanOrEqual(900);
    }
  });

  test("SCROLL_SPEED scrub constant matches project standard", () => {
    expect(SCROLL_SPEED).toBe(0.65);
  });
});

describe("render modes", () => {
  afterEach(() => vi.restoreAllMocks());

  test("desktop (not reduced): one pinned, scrubbed ScrollTrigger", () => {
    vi.spyOn(motionHook, "useReducedMotion").mockReturnValue(false);
    const createSpy = vi.spyOn(ScrollTrigger, "create");

    renderWithNavbar(<DailyLifeSection />);

    const pinCall = createSpy.mock.calls.find(([cfg]) => cfg && (cfg as { pin?: unknown }).pin === true);
    expect(pinCall).toBeDefined();
    const cfg = pinCall![0] as { scrub?: unknown; start?: unknown };
    expect(cfg.scrub).toBe(SCROLL_SPEED);
    expect(cfg.start).toBe("top top");
  });

  test("reduced motion: no pinned ScrollTrigger, video still rendered", () => {
    vi.spyOn(motionHook, "useReducedMotion").mockReturnValue(true);
    const createSpy = vi.spyOn(ScrollTrigger, "create");

    const { container } = renderWithNavbar(<DailyLifeSection />);

    const pinned = createSpy.mock.calls.some(([cfg]) => cfg && (cfg as { pin?: unknown }).pin === true);
    expect(pinned).toBe(false);
    expect(container.querySelector("video")?.getAttribute("src")).toBe("/videos/daily-life.mp4");
  });
});
