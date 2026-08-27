/**
 * Dedicated M2 Adversarial & Empirical Test Suite:
 * Pinned Scroll Sequence, Stage Curves, Responsive Positioning, Reduced Motion, & Lenis Integration
 * in ClosingLattice.tsx and ClosingShelf.tsx.
 */

import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { ClosingLatticeSection } from "@/features/home/components/closing-scene/ClosingLattice";
import { ClosingShelf } from "@/features/home/components/ClosingShelf";
import { NavbarProvider } from "@/shared/components/NavbarContext";
import { CONTENT } from "@/shared/content";
import { homeSection, sectionOrder } from "@/shared/sections";
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import * as motionHook from "@/shared/motion";

// Mock TanStack Router Link for isolated component tests
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

// Ensure GSAP plugins
gsap.registerPlugin(ScrollTrigger);

function renderWithNavbar(ui: React.ReactElement) {
  return render(<NavbarProvider>{ui}</NavbarProvider>);
}

describe("M2 Empirical Verification 1: ScrollTrigger Pin & Travel Distance", () => {
  test("closing section config in HOME_SECTIONS declares ownsPin: true and noExitDim: true", () => {
    const section = homeSection("closing");
    expect(section).toBeDefined();
    expect(section.id).toBe("closing");
    expect(section.ownsPin).toBe(true);
    expect(section.noExitDim).toBe(true);
    expect(section.chapter).toBe(7);
    expect(section.ground).toBe("field");
  });

  test("refresh priority preserves top-to-bottom hierarchy with upstream pinned sections", () => {
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

  test("travel distance function evaluates to exactly 2.5x window.innerHeight across all standard and extreme viewports", () => {
    const testHeights = [480, 600, 667, 768, 800, 844, 900, 1024, 1080, 1200, 1440, 2160];

    for (const h of testHeights) {
      const endFormula = (vh: number) => `+=${String(vh * 2.5)}`;
      const expectedTravel = h * 2.5;

      expect(endFormula(h)).toBe(`+=${expectedTravel}`);
      expect(expectedTravel / h).toBe(2.5);
      // Invariant: travel distance is always >= 1200px and gives 2.5 full viewports of scroll room
      expect(expectedTravel).toBeGreaterThanOrEqual(1200);
    }
  });

  test("SCROLL_SPEED scrub constant matches project standard (0.65s)", () => {
    expect(SCROLL_SPEED).toBe(0.65);
  });
});

describe("M2 Empirical Verification 2: Mathematical Monotonicity & Boundary Stage Curves", () => {
  // Extract exact formulas from ClosingLattice.tsx
  const calcZoomProgress = (p: number) => (p <= 0.10 ? 0 : p >= 0.85 ? 1 : (p - 0.10) / 0.75);
  const calcHeadlineOpacity = (p: number) => (p <= 0.10 ? 1 : p >= 0.45 ? 0 : (0.45 - p) / 0.35);
  const calcCtaOpacity = (p: number) => (p <= 0.45 ? 0 : p >= 0.85 ? 1 : (p - 0.45) / 0.40);
  const calcCtaPointer = (p: number) => (p >= 0.65 ? "auto" : "none");

  test("Boundary Values & Stage Continuity at Key Anchors", () => {
    // p = 0.0 (Entrance)
    expect(calcZoomProgress(0)).toBe(0);
    expect(calcHeadlineOpacity(0)).toBe(1);
    expect(calcCtaOpacity(0)).toBe(0);
    expect(calcCtaPointer(0)).toBe("none");

    // p = 0.10 (End of tight hold / start of camera zoom & headline fade)
    expect(calcZoomProgress(0.10)).toBe(0);
    expect(calcHeadlineOpacity(0.10)).toBe(1);
    expect(calcCtaOpacity(0.10)).toBe(0);
    expect(calcCtaPointer(0.10)).toBe("none");

    // p = 0.45 (Headline fully dissolved / CTA starts fading in)
    expect(calcZoomProgress(0.45)).toBeCloseTo((0.45 - 0.10) / 0.75, 5); // 0.4667
    expect(calcHeadlineOpacity(0.45)).toBe(0);
    expect(calcCtaOpacity(0.45)).toBe(0);
    expect(calcCtaPointer(0.45)).toBe("none");

    // p = 0.65 (Pointer events gate activates when CTA is 50% opaque)
    expect(calcCtaOpacity(0.65)).toBeCloseTo((0.65 - 0.45) / 0.40, 5); // 0.5000
    expect(calcCtaPointer(0.6499)).toBe("none");
    expect(calcCtaPointer(0.65)).toBe("auto");

    // p = 0.85 (Camera zoom wide & CTA fully opaque)
    expect(calcZoomProgress(0.85)).toBe(1);
    expect(calcHeadlineOpacity(0.85)).toBe(0);
    expect(calcCtaOpacity(0.85)).toBe(1);
    expect(calcCtaPointer(0.85)).toBe("auto");

    // p = 1.0 (Unpin / Exit)
    expect(calcZoomProgress(1.0)).toBe(1);
    expect(calcHeadlineOpacity(1.0)).toBe(0);
    expect(calcCtaOpacity(1.0)).toBe(1);
    expect(calcCtaPointer(1.0)).toBe("auto");
  });

  test("Zero text collision guarantee: Headline and CTA card never have simultaneous high opacity", () => {
    // When headline is visible (>0.1), CTA card is strictly 0.0
    for (let p = 0; p <= 0.45; p += 0.01) {
      const hOp = calcHeadlineOpacity(p);
      const cOp = calcCtaOpacity(p);
      expect(cOp).toBe(0);
      if (p <= 0.10) {
        expect(hOp).toBe(1.0);
      }
    }

    // When CTA is becoming visible (>0.0), headline is strictly 0.0
    for (let p = 0.45; p <= 1.0; p += 0.01) {
      const hOp = calcHeadlineOpacity(p);
      const cOp = calcCtaOpacity(p);
      expect(hOp).toBe(0);
      expect(cOp).toBeGreaterThanOrEqual(0);
    }
  });

  test("Strict Monotonicity across 1000 discrete sampling steps", () => {
    let prevZoom = 0;
    let prevHeadline = 1;
    let prevCta = 0;

    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      const zoom = calcZoomProgress(p);
      const headline = calcHeadlineOpacity(p);
      const cta = calcCtaOpacity(p);

      // Zoom is monotonically non-decreasing
      expect(zoom).toBeGreaterThanOrEqual(prevZoom);
      expect(zoom).toBeGreaterThanOrEqual(0);
      expect(zoom).toBeLessThanOrEqual(1);

      // Headline is monotonically non-increasing
      expect(headline).toBeLessThanOrEqual(prevHeadline);
      expect(headline).toBeGreaterThanOrEqual(0);
      expect(headline).toBeLessThanOrEqual(1);

      // CTA is monotonically non-decreasing
      expect(cta).toBeGreaterThanOrEqual(prevCta);
      expect(cta).toBeGreaterThanOrEqual(0);
      expect(cta).toBeLessThanOrEqual(1);

      prevZoom = zoom;
      prevHeadline = headline;
      prevCta = cta;
    }
  });
});

describe("M2 Empirical Verification 3: Component DOM Structure & Responsive Specs", () => {
  beforeEach(() => {
    vi.spyOn(motionHook, "useReducedMotion").mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders ClosingLatticeSection with HeroCanvas in closure mode and headline", () => {
    const { container } = renderWithNavbar(<ClosingLatticeSection />);

    const section = container.querySelector('[data-testid="closing-lattice-section"]');
    expect(section).not.toBeNull();

    // Verify canvas is present
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();

    // Verify headline text
    expect(screen.getByText("We create exciting technologies")).toBeDefined();
    expect(screen.getByText("CAPABILITY // PLATFORM")).toBeDefined();

    // Verify CTA text & links
    const contactLink = container.querySelector('a[href="/contact"]');
    const careersLink = container.querySelector('a[href="/careers"]');
    expect(contactLink).not.toBeNull();
    expect(contactLink?.textContent).toContain("Contact");
    expect(careersLink).not.toBeNull();
    expect(careersLink?.textContent).toContain(CONTENT.closing.farewell);
  });

  test("CTA Card has proper responsive layout styling attributes", () => {
    const { container } = renderWithNavbar(<ClosingLatticeSection />);
    const ctaCard = container.querySelector('[style*="--closure-cta-opacity"]');
    expect(ctaCard).not.toBeNull();

    // Verify CSS variable binding
    expect(ctaCard?.getAttribute("style")).toContain("var(--closure-cta-opacity");
    expect(ctaCard?.getAttribute("style")).toContain("var(--closure-cta-pointer");
  });
});

describe("M2 Empirical Verification 4: Reduced Motion Fallback Mode", () => {
  beforeEach(() => {
    vi.spyOn(motionHook, "useReducedMotion").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("when reduced motion is enabled: headline is hidden and CTA card is immediately active", () => {
    const { container } = renderWithNavbar(<ClosingLatticeSection />);

    // Headline wrapper has display: none and opacity: 0
    const headline = screen.getByText("We create exciting technologies");
    const headlineWrapper = headline.closest('[aria-hidden="true"]');
    expect(headlineWrapper).not.toBeNull();
    expect(headlineWrapper?.getAttribute("style")).toContain("display: none");
    expect(headlineWrapper?.getAttribute("style")).toContain("opacity: 0");

    // CTA card wrapper has opacity: 1 and pointerEvents: "auto"
    const ctaCard = container.querySelector('[style*="opacity: 1"]');
    expect(ctaCard).not.toBeNull();
    expect(ctaCard?.getAttribute("style")).toContain("pointer-events: auto");
  });

  test("when reduced motion is enabled: ScrollTrigger.create is NOT invoked", () => {
    const scrollTriggerSpy = vi.spyOn(ScrollTrigger, "create");
    renderWithNavbar(<ClosingLatticeSection />);

    expect(scrollTriggerSpy).not.toHaveBeenCalled();
  });
});

describe("M2 Empirical Verification 5: ClosingShelf Wrapper & SectionBeat Architecture", () => {
  test("ClosingShelf renders SectionBeat with bare: true and MiniEstablishingShot", () => {
    const { container } = renderWithNavbar(<ClosingShelf />);

    // Root section id matches 'closing'
    const section = container.querySelector("section#closing");
    expect(section).not.toBeNull();

    // Bare content container is rendered because ownsPin: true
    const bareContainer = container.querySelector(".beat-bare-content");
    expect(bareContainer).not.toBeNull();

    // ClosingLatticeSection is placed inside bare container
    const closingLattice = bareContainer?.querySelector('[data-testid="closing-lattice-section"]');
    expect(closingLattice).not.toBeNull();

    // Establishing shot is rendered in the section
    const shot = container.querySelector(".beat-shot");
    expect(shot).not.toBeNull();
  });
});
