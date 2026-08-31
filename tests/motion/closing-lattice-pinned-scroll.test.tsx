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
import { PHASE_MOVE_END } from "@/features/hero/heroPhases";
import {
  CLOSING_PIN_VH,
  CLOSURE_ZOOM_HOLD,
  VIGNETTE_IN_END,
  VIGNETTE_IN_START,
  ZOOM_MAX,
  closingHeroProgressFor,
  closingZoomFor,
  ctaOpacityFor,
  ctaPointerFor,
  headlineOpacityFor,
  vignetteOpacityFor,
} from "@/features/home/components/closing-scene/closingPhases";
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
    expect(section.chapter).toBe(5);
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

  test("travel distance function evaluates to exactly 3.0x window.innerHeight across all standard and extreme viewports", () => {
    // Pin retuned 1.3vh -> 2.0vh -> 2.6vh -> 3.0vh: the buffered spine (settle+
    // vignette / buffer / headline build / buffer / recede / buffer / CTA rise)
    // needs the room. Smallest realistic viewport height here is 667
    // (667*3 ≈ 2001), so the invariant floor stays >= 900.
    expect(CLOSING_PIN_VH).toBe(3.0);
    const testHeights = [667, 768, 800, 844, 900, 1024, 1080, 1200, 1440, 2160];

    for (const h of testHeights) {
      const endFormula = (vh: number) => `+=${String(vh * CLOSING_PIN_VH)}`;
      const expectedTravel = h * CLOSING_PIN_VH;

      expect(endFormula(h)).toBe(`+=${expectedTravel}`);
      expect(expectedTravel / h).toBeCloseTo(3.0, 10);
      // Invariant: >= 900px of scroll room across every supported viewport.
      expect(expectedTravel).toBeGreaterThanOrEqual(900);
    }
  });

  test("SCROLL_SPEED scrub constant matches project standard (0.65s)", () => {
    expect(SCROLL_SPEED).toBe(0.65);
  });
});

describe("M2 Empirical Verification 2: Disjoint Phase Model & Boundary Stage Curves", () => {
  // Exercises the real pure ramp math from `closingPhases.ts` — a buffered
  // "cinematic hand-off" over a 3.0vh pin. Disjoint gap: headline is 0 for
  // p >= 0.70, CTA is 0 for p <= 0.80.
  const calcHeroProgress = closingHeroProgressFor;
  const calcHeadlineOpacity = headlineOpacityFor;
  const calcCtaOpacity = ctaOpacityFor;
  const calcCtaPointer = ctaPointerFor;

  test("Boundary values & stage continuity at the buffered phase anchors", () => {
    // p = 0.0 (entrance)
    expect(calcHeadlineOpacity(0)).toBe(0);
    expect(calcCtaOpacity(0)).toBe(0);
    expect(calcCtaPointer(0)).toBe("none");
    expect(closingZoomFor(0)).toBe(0);

    // p = 0.25 (buffer after P/vignette settle — nothing has moved yet)
    expect(calcHeadlineOpacity(0.25)).toBe(0);
    expect(calcCtaOpacity(0.25)).toBe(0);

    // p = 0.46 (headline fully built)
    expect(calcHeadlineOpacity(0.46)).toBe(1);
    expect(calcCtaOpacity(0.46)).toBe(0);

    // p = 0.58 (end of hold buffer — recede starts)
    expect(calcHeadlineOpacity(0.58)).toBe(1);
    expect(calcCtaOpacity(0.58)).toBe(0);

    // p = 0.70 (headline fully receded, CTA still gone — the disjoint gap)
    expect(calcHeadlineOpacity(0.7)).toBe(0);
    expect(calcCtaOpacity(0.7)).toBe(0);
    expect(calcCtaPointer(0.7)).toBe("none");

    // p = 0.80 (CTA reveal starts)
    expect(calcHeadlineOpacity(0.8)).toBe(0);
    expect(calcCtaOpacity(0.8)).toBe(0);

    // p = 0.87 (pointer gate opens)
    expect(calcCtaPointer(0.8699)).toBe("none");
    expect(calcCtaPointer(0.87)).toBe("auto");

    // p = 0.93 (settled — CTA fully opaque)
    expect(calcCtaOpacity(0.93)).toBe(1);
    expect(calcHeadlineOpacity(0.93)).toBe(0);
    expect(calcCtaPointer(0.93)).toBe("auto");

    // p = 1.0 (unpin / exit)
    expect(calcHeadlineOpacity(1.0)).toBe(0);
    expect(calcCtaOpacity(1.0)).toBe(1);
    expect(calcCtaPointer(1.0)).toBe("auto");

    // The scrubbed-camera helpers are retained (unused by Mode A) — sanity only.
    expect(calcHeroProgress(1.0)).toBe(PHASE_MOVE_END);
    expect(closingZoomFor(1.0)).toBeCloseTo(ZOOM_MAX, 10);
  });

  test("Disjointness guarantee: headline & CTA opacity are never both > 0", () => {
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      const h = calcHeadlineOpacity(p);
      const c = calcCtaOpacity(p);

      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(1);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);

      // The real disjointness guarantee.
      if (h > 0) expect(c).toBe(0);
      if (c > 0) expect(h).toBe(0);

      // Explicit anchors: headline is 0 for p >= 0.70, CTA is 0 for p <= 0.80.
      if (p >= 0.7) expect(h).toBe(0);
      if (p <= 0.8) expect(c).toBe(0);
    }
  });

  test("CTA opacity, canvas heroProgress & camera zoom are monotonic non-decreasing; ramps are continuous", () => {
    let prevHero = 0;
    let prevCta = 0;
    let prevZoom = 0;
    let prevHeadline = calcHeadlineOpacity(0);

    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      const hero = calcHeroProgress(p);
      const cta = calcCtaOpacity(p);
      const zoom = closingZoomFor(p);
      const headline = calcHeadlineOpacity(p);

      // heroProgress: non-decreasing, clamped at PHASE_MOVE_END.
      expect(hero).toBeGreaterThanOrEqual(prevHero);
      expect(hero).toBeGreaterThanOrEqual(0);
      expect(hero).toBeLessThanOrEqual(PHASE_MOVE_END);

      // CTA opacity: non-decreasing.
      expect(cta).toBeGreaterThanOrEqual(prevCta);

      // Camera zoom: non-decreasing, clamped at ZOOM_MAX.
      expect(zoom).toBeGreaterThanOrEqual(prevZoom);
      expect(zoom).toBeLessThanOrEqual(ZOOM_MAX + 1e-9);

      // Continuity — no ramp jumps more than a small step per 0.001 of p.
      expect(Math.abs(headline - prevHeadline)).toBeLessThan(0.02);
      expect(Math.abs(cta - prevCta)).toBeLessThan(0.02);
      expect(Math.abs(zoom - prevZoom)).toBeLessThan(0.02);

      prevHero = hero;
      prevCta = cta;
      prevZoom = zoom;
      prevHeadline = headline;
    }
  });

  test("vignette opacity ramps 0 -> 1 just past the establishing header, then holds; the held camera pull-back is a partial zoom", () => {
    expect(vignetteOpacityFor(0)).toBe(0);
    expect(vignetteOpacityFor(VIGNETTE_IN_START)).toBe(0);
    expect(vignetteOpacityFor(VIGNETTE_IN_END)).toBe(1);
    expect(vignetteOpacityFor(1)).toBe(1);

    // Fades in early (before the headline word-build completes) so the scene
    // has atmosphere by the time the statement lands.
    expect(VIGNETTE_IN_END).toBeLessThan(0.44);

    let prev = 0;
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      const v = vignetteOpacityFor(p);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThanOrEqual(prev); // monotonic non-decreasing
      expect(Math.abs(v - prev)).toBeLessThan(0.02); // continuous
      prev = v;
    }

    // Mode A holds a wide-ish framing so the extended node lattice reads and the
    // 3D P doesn't collide with the right-hand headline stage.
    expect(CLOSURE_ZOOM_HOLD).toBeGreaterThan(0.5);
    expect(CLOSURE_ZOOM_HOLD).toBeLessThanOrEqual(1);
  });
});

describe("M2 Empirical Verification 3: Component DOM Structure & Responsive Specs", () => {
  beforeEach(() => {
    vi.spyOn(motionHook, "useReducedMotion").mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders ClosingLatticeSection (desktop Mode A) with the headline and the closure canvas behind it", () => {
    const { container } = renderWithNavbar(<ClosingLatticeSection />);

    const section = container.querySelector('[data-testid="closing-lattice-section"]');
    expect(section).not.toBeNull();

    // Mode A anchors the closure P + node lattice behind the stage, held solid
    // and 3D (canvas progress pinned at 0 — never the particle-converge window).
    expect(container.querySelector("canvas")).not.toBeNull();

    // Verify headline text. Mode A splits the <h2> into per-word spans
    // (SplitText), so match on the heading element's text content, not a single
    // text node. The category eyebrow ("CONTACT // PARTNERSHIP") lives on
    // MiniEstablishingShot, rendered by ClosingShelf — asserted in
    // Verification 5, not here.
    const heading = container.querySelector("h2");
    expect(heading?.textContent).toContain("We create exciting technologies");

    // Exactly one CTA -> /contact, labelled with the farewell copy. No
    // /careers link anywhere in the closing scene.
    const contactLinks = container.querySelectorAll('a[href="/contact"]');
    expect(contactLinks.length).toBe(1);
    expect(contactLinks[0]?.textContent).toContain(CONTENT.closing.farewell);
    expect(container.querySelector('a[href="/careers"]')).toBeNull();
  });

  test("CTA Card has proper responsive layout styling attributes", () => {
    const { container } = renderWithNavbar(<ClosingLatticeSection />);
    // Target the card's `var(...)` binding specifically — the disjoint phase
    // model also writes the raw `--closure-cta-opacity` custom property onto
    // the root container, so match on the `var(` reference the card carries.
    const ctaCard = container.querySelector('[style*="var(--closure-cta-opacity"]');
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

    // The establishing-shot category eyebrow (moved here from Verification 3 —
    // MiniEstablishingShot renders `category` verbatim).
    expect(screen.getByText("CONTACT // PARTNERSHIP")).toBeDefined();
  });
});
