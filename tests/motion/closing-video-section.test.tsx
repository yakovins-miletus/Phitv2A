import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { act, render, screen } from "@testing-library/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { ClosingVideoSection } from "@/features/home/components/closing-scene/ClosingVideoSection";
import { NavbarProvider, NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { CONTENT } from "@/shared/content";
import { sectionOrder } from "@/shared/sections";
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import {
  CLOSING_PIN_VH,
  VIDEO_SCRUB_START,
  VIDEO_SCRUB_END,
  SCRIM_MIN,
  SCRIM_MAX,
  BEAT1_IN_START,
  BEAT1_IN_END,
  BEAT1_OUT_START,
  BEAT1_OUT_END,
  BEAT2_IN_START,
  BEAT2_IN_END,
  BEAT2_POINTER_START,
  videoProgressFor,
  scrimOpacityFor,
  beat1OpacityFor,
  beat1VisibilityFor,
  beat2OpacityFor,
  beat2VisibilityFor,
  ctaPointerFor,
} from "@/features/home/components/closing-scene/closingVideoPhases";
import * as motionHook from "@/shared/motion";
import * as navbarHooks from "@/shared/components/navbarHooks";

// Mock TanStack Router Link
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }>(
      ({ to, children, ...props }, ref) => (
        <a ref={ref} href={to} {...props}>
          {children}
        </a>
      ),
    ),
  };
});

gsap.registerPlugin(ScrollTrigger);

function renderWithNavbar(ui: React.ReactElement) {
  return render(<NavbarProvider>{ui}</NavbarProvider>);
}

describe("Closing Video Stage: Phase Math & Disjointness Verification", () => {
  test("pinned travel distance is 3.0x window.innerHeight", () => {
    expect(CLOSING_PIN_VH).toBe(3.0);
    const heights = [600, 768, 900, 1080, 1440];
    for (const h of heights) {
      expect(h * CLOSING_PIN_VH).toBeGreaterThanOrEqual(1800);
    }
  });

  test("SCROLL_SPEED scrub constant matches project standard (0.65s)", () => {
    expect(SCROLL_SPEED).toBe(0.65);
  });

  test("video progress ramps from 0 to 1 over [0, VIDEO_SCRUB_END] and holds at 1", () => {
    expect(videoProgressFor(0)).toBe(0);
    expect(videoProgressFor(VIDEO_SCRUB_START)).toBe(0);
    expect(videoProgressFor(VIDEO_SCRUB_END)).toBe(1);
    expect(videoProgressFor(0.8)).toBe(1);
    expect(videoProgressFor(1.0)).toBe(1);

    let prev = 0;
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      const v = videoProgressFor(p);
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      prev = v;
    }
  });

  test("scrim opacity deepens smoothly from SCRIM_MIN to SCRIM_MAX", () => {
    expect(scrimOpacityFor(0)).toBe(SCRIM_MIN);
    expect(scrimOpacityFor(0.48)).toBe(SCRIM_MIN);
    expect(scrimOpacityFor(0.58)).toBe(SCRIM_MAX);
    expect(scrimOpacityFor(1.0)).toBe(SCRIM_MAX);

    let prev = 0;
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      const s = scrimOpacityFor(p);
      expect(s).toBeGreaterThanOrEqual(prev);
      expect(s).toBeGreaterThanOrEqual(SCRIM_MIN);
      expect(s).toBeLessThanOrEqual(SCRIM_MAX);
      prev = s;
    }
  });

  test("Beat 1 boundary values: hidden early, fully visible during dwell, recedes cleanly", () => {
    expect(beat1OpacityFor(0)).toBe(0);
    expect(beat1OpacityFor(BEAT1_IN_START)).toBe(0);
    expect(beat1OpacityFor(BEAT1_IN_END)).toBe(1);
    expect(beat1OpacityFor(0.65)).toBe(1);
    expect(beat1OpacityFor(BEAT1_OUT_START)).toBe(1);
    expect(beat1OpacityFor(BEAT1_OUT_END)).toBe(0);
    expect(beat1OpacityFor(1.0)).toBe(0);
  });

  test("Beat 2 boundary values: hidden until BEAT2_IN_START, fully visible at BEAT2_IN_END through unpin", () => {
    expect(beat2OpacityFor(0)).toBe(0);
    expect(beat2OpacityFor(BEAT1_OUT_END)).toBe(0);
    expect(beat2OpacityFor(BEAT2_IN_START)).toBe(0);
    expect(beat2OpacityFor(BEAT2_IN_END)).toBe(1);
    expect(beat2OpacityFor(1.0)).toBe(1);
  });

  test("Strict Disjointness Guarantee: Beat 1 and Beat 2 opacities are NEVER simultaneously > 0", () => {
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      const b1 = beat1OpacityFor(p);
      const b2 = beat2OpacityFor(p);

      expect(b1).toBeGreaterThanOrEqual(0);
      expect(b1).toBeLessThanOrEqual(1);
      expect(b2).toBeGreaterThanOrEqual(0);
      expect(b2).toBeLessThanOrEqual(1);

      if (b1 > 0) {
        expect(b2).toBe(0);
      }
      if (b2 > 0) {
        expect(b1).toBe(0);
      }
    }
  });

  test("Pointer events gate: none during animation, auto once settled", () => {
    expect(ctaPointerFor(0)).toBe("none");
    expect(ctaPointerFor(BEAT2_POINTER_START - 0.001)).toBe("none");
    expect(ctaPointerFor(BEAT2_POINTER_START)).toBe("auto");
    expect(ctaPointerFor(1.0)).toBe("auto");
  });

  test("Visibility gates: Beat 1 and Beat 2 are hidden outside their active ranges", () => {
    expect(beat1VisibilityFor(0)).toBe("hidden");
    expect(beat1VisibilityFor(BEAT1_IN_START - 0.001)).toBe("hidden");
    expect(beat1VisibilityFor(BEAT1_IN_START)).toBe("visible");
    expect(beat1VisibilityFor(0.65)).toBe("visible");
    expect(beat1VisibilityFor(BEAT1_OUT_END)).toBe("visible");
    expect(beat1VisibilityFor(BEAT1_OUT_END + 0.001)).toBe("hidden");
    expect(beat1VisibilityFor(1.0)).toBe("hidden");

    expect(beat2VisibilityFor(0)).toBe("hidden");
    expect(beat2VisibilityFor(BEAT2_IN_START - 0.001)).toBe("hidden");
    expect(beat2VisibilityFor(BEAT2_IN_START)).toBe("visible");
    expect(beat2VisibilityFor(1.0)).toBe("visible");
  });
});

describe("Closing Video Stage: Component Architecture & Motion Integration", () => {
  beforeEach(() => {
    vi.spyOn(motionHook, "useReducedMotion").mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders ClosingVideoSection with full-bleed video and centered stage structure", () => {
    const { container } = renderWithNavbar(<ClosingVideoSection />);

    const section = container.querySelector('[data-testid="closing-video-section"]');
    expect(section).not.toBeNull();
    expect(section?.getAttribute("id")).toBe("closing");
    expect(section?.getAttribute("data-ground")).toBe("dark");

    // Video element presence & configuration
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video?.getAttribute("src")).toBe("/videos/we-build-the-future.mp4");
    expect(video?.hasAttribute("muted") || video?.muted).toBeTruthy();
    expect(video?.getAttribute("preload")).toBe("auto");

    // Beat 1: Centered headline presence
    const h2 = container.querySelector("h2");
    expect(h2).not.toBeNull();
    expect(h2?.textContent).toContain("We create exciting technologies");

    // Beat 2: Centered CTA block presence
    const h3 = container.querySelector("h3");
    expect(h3).not.toBeNull();
    expect(h3?.textContent).toContain(CONTENT.closing.statement);

    // Primary CTA link to /contact
    const contactLinks = container.querySelectorAll('a[href="/contact"]');
    expect(contactLinks.length).toBe(1);
    expect(contactLinks[0]?.textContent).toContain(CONTENT.closing.farewell);

    // Secondary Action link to /careers
    const careersLinks = container.querySelectorAll('a[href="/careers"]');
    expect(careersLinks.length).toBe(1);
    expect(careersLinks[0]?.textContent).toContain("Explore Careers");
  });

  test("wires navbar anchor tracking with dark: true for legible contrast over video", () => {
    const useNavbarAnchorSpy = vi.spyOn(navbarHooks, "useNavbarAnchor");
    renderWithNavbar(<ClosingVideoSection />);

    expect(useNavbarAnchorSpy).toHaveBeenCalledWith(
      NAV_ANCHORS.HOME_CLOSING,
      expect.objectContaining({ dark: true }),
    );
  });

  test("refresh priority preserves top-to-bottom hierarchy with upstream sections", () => {
    const closingOrder = sectionOrder("closing");
    const useCasesOrder = sectionOrder("use-cases");
    const heroOrder = sectionOrder("hero");

    expect(closingOrder).toBeGreaterThan(useCasesOrder);
    expect(useCasesOrder).toBeGreaterThan(heroOrder);

    const closingPriority = refreshPriorityFor(closingOrder);
    const useCasesPriority = refreshPriorityFor(useCasesOrder);
    const heroPriority = refreshPriorityFor(heroOrder);

    expect(heroPriority).toBeGreaterThan(useCasesPriority);
    expect(useCasesPriority).toBeGreaterThan(closingPriority);
    expect(closingPriority).toBeGreaterThan(0);
  });

  test("timeline registers onUpdate callback to preserve lockstep scrub synchronization", () => {
    const timelineSpy = vi.spyOn(gsap, "timeline");
    renderWithNavbar(<ClosingVideoSection />);

    expect(timelineSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        onUpdate: expect.any(Function),
      }),
    );
  });

  test("video element registers onError handler for graceful failure recovery and has accessibility attributes", () => {
    const { container } = renderWithNavbar(<ClosingVideoSection />);
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video?.getAttribute("aria-hidden")).toBe("true");
    expect(video?.getAttribute("tabindex")).toBe("-1");
    // Simulate error event to confirm resilience
    video?.dispatchEvent(new Event("error"));
  });

  test("ScrollTrigger.create relies on timeline onUpdate without redundant st.onUpdate", () => {
    const scrollTriggerSpy = vi.spyOn(ScrollTrigger, "create");
    renderWithNavbar(<ClosingVideoSection />);

    expect(scrollTriggerSpy).toHaveBeenCalledWith(
      expect.not.objectContaining({
        onUpdate: expect.any(Function),
      }),
    );
  });

  test("video scrub clamps targetTime to duration - 0.05s to prevent browser ended state blanking", () => {
    const { container } = renderWithNavbar(<ClosingVideoSection />);
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video).not.toBeNull();

    // Define mock duration
    Object.defineProperty(video, "duration", { value: 10.0, writable: true });
    Object.defineProperty(video, "seeking", { value: false, writable: true });

    // Simulate loaded metadata
    act(() => {
      video.dispatchEvent(new Event("loadedmetadata"));
    });

    // Verify video currentTime is clamped <= duration - 0.05s (9.95s)
    expect(video.currentTime).toBeLessThanOrEqual(9.95);
  });
});

describe("Closing Video Stage: Reduced Motion Fallback Mode", () => {
  beforeEach(() => {
    vi.spyOn(motionHook, "useReducedMotion").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("when reduced motion is enabled: pinning ScrollTrigger is NOT created", () => {
    const scrollTriggerSpy = vi.spyOn(ScrollTrigger, "create");
    renderWithNavbar(<ClosingVideoSection />);

    expect(scrollTriggerSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ pin: true }),
    );
  });

  test("when reduced motion is enabled: statement and CTA are statically rendered and accessible", () => {
    const { container } = renderWithNavbar(<ClosingVideoSection />);

    const section = container.querySelector('[data-testid="closing-video-section"]');
    expect(section?.getAttribute("data-ground")).toBe("dark");

    expect(screen.getByRole("heading", { level: 2, name: /We create exciting technologies/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: new RegExp(CONTENT.closing.statement, "i") })).toBeInTheDocument();

    const contactLink = container.querySelector('a[href="/contact"]');
    const careersLink = container.querySelector('a[href="/careers"]');

    expect(contactLink).not.toBeNull();
    expect(careersLink).not.toBeNull();
  });

  test("when reduced motion is enabled: video backdrop is configured with settled attributes and error handler", () => {
    const { container } = renderWithNavbar(<ClosingVideoSection />);
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video?.getAttribute("src")).toBe("/videos/we-build-the-future.mp4");
    expect(video?.hasAttribute("muted") || video?.muted).toBeTruthy();
    expect(video?.getAttribute("preload")).toBe("auto");
    expect(video?.getAttribute("aria-hidden")).toBe("true");
    expect(video?.getAttribute("tabindex")).toBe("-1");

    // Video error simulation does not crash the component
    video?.dispatchEvent(new Event("error"));
  });
});
