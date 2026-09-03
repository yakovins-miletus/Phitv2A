/**
 * "From our practices…" pinned year-by-year reveal — pin config + 3-mode render
 * split + SectionBeat wiring. Mirrors the daily-life / closing pinned-scroll
 * suites.
 */

import { describe, expect, test, vi, afterEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { ProcessSection } from "@/features/home/components/ProcessSection";
import { PROCESS_PIN_VH } from "@/features/home/components/process/processPhases";
import { NavbarProvider } from "@/shared/components/NavbarContext";
import { homeSection, sectionOrder } from "@/shared/sections";
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import * as motionHook from "@/shared/motion";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: React.forwardRef<
      HTMLAnchorElement,
      React.AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }
    >(({ to, children, ...props }, ref) => (
      <a ref={ref} href={to} {...props}>
        {children}
      </a>
    )),
  };
});

gsap.registerPlugin(ScrollTrigger);

function renderWithNavbar(ui: React.ReactElement) {
  return render(<NavbarProvider>{ui}</NavbarProvider>);
}

describe("process SectionDef", () => {
  test("declares ownsPin: true and noExitDim: true", () => {
    const section = homeSection("process");
    expect(section.id).toBe("process");
    expect(section.ownsPin).toBe(true);
    expect(section.noExitDim).toBe(true);
    expect(section.chapter).toBe(3);
    expect(section.ground).toBe("deep");
  });

  test("refresh priority keeps top-to-bottom order with neighbouring home beats", () => {
    const process = sectionOrder("process");
    expect(process).toBeGreaterThan(sectionOrder("use-cases"));
    expect(process).toBeLessThan(sectionOrder("reach"));
    expect(process).toBeLessThan(sectionOrder("closing"));
    expect(refreshPriorityFor(process)).toBeGreaterThan(refreshPriorityFor(sectionOrder("reach")));
    expect(refreshPriorityFor(process)).toBeGreaterThan(refreshPriorityFor(sectionOrder("closing")));
    expect(refreshPriorityFor(process)).toBeGreaterThan(0);
  });
});

describe("pin geometry", () => {
  test("PROCESS_PIN_VH end formula floor >= 900px across the viewport ladder", () => {
    expect(PROCESS_PIN_VH).toBeGreaterThan(1);
    for (const h of [667, 768, 800, 844, 900, 1024, 1080, 1440, 2160]) {
      expect(h * PROCESS_PIN_VH).toBeGreaterThanOrEqual(900);
    }
  });
});

describe("render modes", () => {
  afterEach(() => vi.restoreAllMocks());

  test("desktop (not reduced): one pinned, scrubbed ScrollTrigger + three <h3>", () => {
    vi.spyOn(motionHook, "useReducedMotion").mockReturnValue(false);
    const createSpy = vi.spyOn(ScrollTrigger, "create");

    const { container } = renderWithNavbar(<ProcessSection />);

    const pinCall = createSpy.mock.calls.find(
      ([cfg]) => cfg && (cfg as { pin?: unknown }).pin === true,
    );
    expect(pinCall).toBeDefined();
    const cfg = pinCall![0] as { scrub?: unknown; start?: unknown };
    expect(cfg.scrub).toBe(SCROLL_SPEED);
    expect(cfg.start).toBe("top top");

    expect(container.querySelectorAll("h3")).toHaveLength(3);
  });

  test("reduced motion: no pinned ScrollTrigger, static collage still rendered", () => {
    vi.spyOn(motionHook, "useReducedMotion").mockReturnValue(true);
    const createSpy = vi.spyOn(ScrollTrigger, "create");

    const { container } = renderWithNavbar(<ProcessSection />);

    const pinned = createSpy.mock.calls.some(
      ([cfg]) => cfg && (cfg as { pin?: unknown }).pin === true,
    );
    expect(pinned).toBe(false);
    expect(container.querySelectorAll("h3")).toHaveLength(3);
    expect(container.querySelectorAll("img").length).toBeGreaterThanOrEqual(3);
  });

  test("SectionBeat routes the bare stage into .beat-bare-content", () => {
    vi.spyOn(motionHook, "useReducedMotion").mockReturnValue(false);
    const { container } = renderWithNavbar(<ProcessSection />);

    const bare = container.querySelector(".beat-bare-content");
    expect(bare).not.toBeNull();
    expect(bare!.querySelector("#process-stage")).not.toBeNull();
  });
});
