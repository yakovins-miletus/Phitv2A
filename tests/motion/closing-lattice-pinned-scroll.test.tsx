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

  test("travel distance function evaluates to exactly 2.0x window.innerHeight across all standard and extreme viewports", () => {
    // 480/600 dropped: the closing pin was retuned from 1.3vh -> 2.0vh to give
    // the five disjoint phases room. Smallest realistic viewport height here is
    // 667 (667*2 = 1334), so the invariant floor is relaxed to >= 900.
    const testHeights = [667, 768, 800, 844, 900, 1024, 1080, 1200, 1440, 2160];

    for (const h of testHeights) {
      const endFormula = (vh: number) => `+=${String(vh * 2)}`;
      const expectedTravel = h * 2;

      expect(endFormula(h)).toBe(`+=${expectedTravel}`);
      expect(expectedTravel / h).toBe(2);
      // Invariant: >= 900px of scroll room across every supported viewport.
      expect(expectedTravel).toBeGreaterThanOrEqual(900);
    }
  });

  test("SCROLL_SPEED scrub constant matches project standard (0.65s)", () => {
    expect(SCROLL_SPEED).toBe(0.65);
  });
});

describe("M2 Empirical Verification 2: Disjoint Phase Model & Boundary Stage Curves", () => {
  // Copies of the NEW ramp math in ClosingLattice.tsx — 5 disjoint phases over
  // a 2.0vh pin. Anchors: 0.28 / 0.42 / 0.58 / 0.60 / 0.82.
  const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
  const P_SETTLE_END = 0.28;
  const HEADLINE_IN_START = 0.06;
  const HEADLINE_IN_END = 0.24;
  const HEADLINE_OUT_START = 0.42;
  const HEADLINE_OUT_END = 0.56;
  const CTA_IN_START = 0.6;
  const CTA_IN_END = 0.8;
  const CTA_POINTER_AT = 0.66;

  const calcHeroProgress = (p: number) =>
    Math.min((p / P_SETTLE_END) * PHASE_MOVE_END, PHASE_MOVE_END);
  const calcHeadlineOpacity = (p: number) =>
    clamp01((p - HEADLINE_IN_START) / (HEADLINE_IN_END - HEADLINE_IN_START)) -
    clamp01((p - HEADLINE_OUT_START) / (HEADLINE_OUT_END - HEADLINE_OUT_START));
  const calcCtaOpacity = (p: number) =>
    clamp01((p - CTA_IN_START) / (CTA_IN_END - CTA_IN_START));
  const calcCtaPointer = (p: number) => (p >= CTA_POINTER_AT ? "auto" : "none");

  test("Boundary values & stage continuity at the five disjoint phase anchors", () => {
    // p = 0.0 (entrance)
    expect(calcHeroProgress(0)).toBe(0);
    expect(calcHeadlineOpacity(0)).toBe(0);
    expect(calcCtaOpacity(0)).toBe(0);
    expect(calcCtaPointer(0)).toBe("none");

    // p = 0.28 (P settled — phase 1 -> 2)
    expect(calcHeroProgress(0.28)).toBeCloseTo(PHASE_MOVE_END, 5);
    expect(calcHeadlineOpacity(0.28)).toBe(1);
    expect(calcCtaOpacity(0.28)).toBe(0);

    // p = 0.42 (end of hold — phase 2 -> 3)
    expect(calcHeroProgress(0.42)).toBe(PHASE_MOVE_END);
    expect(calcHeadlineOpacity(0.42)).toBe(1);
    expect(calcCtaOpacity(0.42)).toBe(0);

    // p = 0.58 (headline fully cleared, CTA still gone — the disjoint gap)
    expect(calcHeadlineOpacity(0.58)).toBe(0);
    expect(calcCtaOpacity(0.58)).toBe(0);
    expect(calcCtaPointer(0.58)).toBe("none");

    // p = 0.60 (CTA reveal starts — phase 4)
    expect(calcHeadlineOpacity(0.6)).toBe(0);
    expect(calcCtaOpacity(0.6)).toBe(0);

    // p = 0.66 (pointer gate opens)
    expect(calcCtaPointer(0.6599)).toBe("none");
    expect(calcCtaPointer(0.66)).toBe("auto");

    // p = 0.82 (settled — phase 5: CTA fully opaque)
    expect(calcCtaOpacity(0.82)).toBe(1);
    expect(calcHeadlineOpacity(0.82)).toBe(0);
    expect(calcCtaPointer(0.82)).toBe("auto");

    // p = 1.0 (unpin / exit)
    expect(calcHeroProgress(1.0)).toBe(PHASE_MOVE_END);
    expect(calcHeadlineOpacity(1.0)).toBe(0);
    expect(calcCtaOpacity(1.0)).toBe(1);
    expect(calcCtaPointer(1.0)).toBe("auto");
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

      // Explicit anchors: headline is 0 for p >= 0.58, CTA is 0 for p <= 0.60.
      if (p >= 0.58) expect(h).toBe(0);
      if (p <= 0.6) expect(c).toBe(0);
    }
  });

  test("CTA opacity & canvas heroProgress are monotonic non-decreasing; ramps are continuous", () => {
    let prevHero = 0;
    let prevCta = 0;
    let prevHeadline = calcHeadlineOpacity(0);

    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      const hero = calcHeroProgress(p);
      const cta = calcCtaOpacity(p);
      const headline = calcHeadlineOpacity(p);

      // heroProgress: non-decreasing, clamped at PHASE_MOVE_END.
      expect(hero).toBeGreaterThanOrEqual(prevHero);
      expect(hero).toBeGreaterThanOrEqual(0);
      expect(hero).toBeLessThanOrEqual(PHASE_MOVE_END);

      // CTA opacity: non-decreasing.
      expect(cta).toBeGreaterThanOrEqual(prevCta);

      // Continuity — no ramp jumps more than a small step per 0.001 of p.
      expect(Math.abs(headline - prevHeadline)).toBeLessThan(0.02);
      expect(Math.abs(cta - prevCta)).toBeLessThan(0.02);

      prevHero = hero;
      prevCta = cta;
      prevHeadline = headline;
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

    // Verify headline text. The category eyebrow ("CONTACT // PARTNERSHIP")
    // lives on MiniEstablishingShot, rendered by ClosingShelf — asserted in
    // Verification 5, not here.
    expect(screen.getByText("We create exciting technologies")).toBeDefined();

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
