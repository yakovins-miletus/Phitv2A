import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';

export type NavbarMode = 'minimal' | 'dynamic' | 'island' | 'immersive' | 'notch' | 'standard' | 'glassmorphism';

/**
 * Navbar anchors — the SECOND of the page's "what is on screen" registries, and
 * deliberately not the same one as HOME_SECTIONS in @/shared/sections.
 *
 * The two answer different questions with different machinery:
 *
 *   HOME_SECTIONS  ScrollTrigger, top-50%/bottom-50% boundaries. Drives the
 *                  EyeFlow rail: "which chapter is the reader in".
 *   NAV_ANCHORS    IntersectionObserver, rootMargin "-80px 0px -90% 0px".
 *                  Drives navbar compact/dark: "is something under the navbar
 *                  right now", which is a strip 80px tall, not a section.
 *
 * Unifying them would mean swapping one set of thresholds for the other and
 * retiming the navbar. They stay separate on purpose.
 *
 * What was NOT on purpose is that both took a bare `string`, so nothing stopped
 * someone passing "daily-life" (a section id) where "daily-life-video" (an
 * anchor id) was meant — silently registering an anchor that never intersects.
 * Anchor ids now live here and useNavbarAnchor only accepts one of them.
 */
export const NAV_ANCHORS = {
  /** The hero page's gunshot & smoking dark image sequence. */
  HERO_GUNSHOT: 'hero-gunshot',
  /** The daily-life film, which the navbar must go light over. */
  DAILY_LIFE_VIDEO: 'daily-life-video',
  /** The About page's hero section. */
  ABOUT_HERO: 'about-hero',
  /** The About page's journey timeline. */
  ABOUT_TIMELINE: 'timeline',
  /** The About page's values section. */
  ABOUT_VALUES: 'about-values',
  /** The About page's academic pathways section. */
  ABOUT_ACADEMICS: 'about-academics',
  /** The immersive process section on the home page. */
  PROCESS_IMMERSIVE: 'process-immersive',
  /** The Blog page's hero section. */
  BLOG_HERO: 'blog-hero',
  /** The Home page's blog section. */
  HOME_BLOG_SECTION: 'home-blog-section',
  /** The Home page's closing shelf — navy ground, so the navbar must go light. */
  HOME_CLOSING: 'home-closing',
  /** AppShell's footer, on every route. */
  SITE_FOOTER: 'site-footer',
  /** The Innovation Lab coming soon page. */
  INNOVATION_LAB: 'innovation-lab',
  /** The Innovation Hub page's hero section. Was incorrectly reusing ABOUT_HERO —
   *  two unrelated routes sharing one anchor id meant scrolling either page's
   *  hero could leave the OTHER route's last-registered dark/light state behind
   *  on navigation, since they are never both mounted but the id collision made
   *  them indistinguishable to anything inspecting the anchor set. */
  INNOVATION_HERO: 'innovation-hero',
  /** Home page: services/capabilities section. Light ground — previously had no
   *  anchor, so the navbar held whatever the last real anchor above it said for
   *  the entire scroll through it. */
  HOME_SERVICES: 'home-services',
  /** Home page: the use-cases horizontal-scroll narrative. Light ground. */
  HOME_USE_CASES: 'home-use-cases',
  /** Home page: global footprint / reach section. Light ground — sits directly
   *  between two now-dark sections (process, daily-life), so this anchor is
   *  what corrects the navbar back to light between them. */
  HOME_REACH: 'home-reach',
  /** Home page: talent & careers section. Light ground. */
  HOME_CANDIDATES: 'home-candidates',
  /** Home page: testimonials section. Light ground. */
  HOME_TESTIMONIALS: 'home-testimonials',
  /** The /services route. One anchor for the whole page — it's a single uniform
   *  light ground throughout, not a SectionBeat/ground-per-section page. */
  SERVICES_PAGE: 'services-page',
  /** The /careers route. Same rationale as SERVICES_PAGE. */
  CAREERS_PAGE: 'careers-page',
  /** The /blog listing page's content area (sidebar + toolbar + post grid),
   *  below BLOG_HERO. Light ground. */
  BLOG_LISTING: 'blog-listing',
  /** The /contact route. One anchor for the whole page, light ground throughout. */
  CONTACT_PAGE: 'contact-page',
} as const;

export type NavAnchorId = (typeof NAV_ANCHORS)[keyof typeof NAV_ANCHORS];

interface NavbarContextValue {
  overrideMode: NavbarMode;
  setOverrideMode: (mode: NavbarMode) => void;
  autohideEnabled: boolean;
  setAutohideEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  toggleAutohide: () => void;
  registerAnchor: (id: NavAnchorId, isIntersecting: boolean, dark?: boolean, top?: number) => void;
  isAutoCompact: boolean;
  derivedIsCompact: boolean;
  isOverDarkSection: boolean;
  isImmersiveDark: boolean;
  showMotto: boolean;
  setShowMotto: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMotto: () => void;
}

const NavbarContext = createContext<NavbarContextValue | null>(null);

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [overrideMode, setOverrideMode] = useState<NavbarMode>('glassmorphism');
  const [autohideEnabled, setAutohideEnabled] = useState(false);
  const [showMotto, setShowMotto] = useState(false);

  /**
   * One anchor can be "current" at a time, but the old model (two parallel
   * `Set<string>`, `isOverDarkSection = darkAnchors.size > 0`) had no notion of
   * WHICH intersecting anchor is actually under the navbar right now — it was a
   * plain boolean OR, so any dark anchor anywhere in the detection band forced
   * dark chrome even while a light section's anchor was ALSO intersecting (this
   * happens at every section boundary, briefly, by design of the shared
   * rootMargin band both anchors sit inside during the handoff).
   *
   * Fix: track each currently-intersecting anchor's own `dark` flag AND its
   * IntersectionObserver entry's `boundingClientRect.top` (free — every observer
   * callback already computes it). The anchor with the LARGEST `top` among
   * current entries is the one that most recently crossed into the detection
   * band from below — i.e. the section that's actually current, in normal
   * scrollspy semantics. An anchor that's been intersecting for a while (most of
   * its height already scrolled past) has a much more negative `top` and loses
   * to a freshly-entered neighbor, instead of an unconditional dark-wins OR.
   */
  interface AnchorEntry {
    dark: boolean;
    top: number;
  }
  const [anchors, setAnchors] = useState<Map<NavAnchorId, AnchorEntry>>(new Map());

  const toggleAutohide = useCallback(() => {
    setAutohideEnabled((prev) => !prev);
  }, []);

  const toggleMotto = useCallback(() => {
    setShowMotto((prev) => !prev);
  }, []);

  const registerAnchor = useCallback((id: NavAnchorId, isIntersecting: boolean, dark = false, top = 0) => {
    setAnchors((prev) => {
      const next = new Map(prev);
      if (isIntersecting) {
        next.set(id, { dark, top });
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const isAutoCompact = anchors.size > 0;

  const isOverDarkSection = useMemo(() => {
    let winner: AnchorEntry | null = null;
    for (const entry of anchors.values()) {
      if (winner === null || entry.top > winner.top) winner = entry;
    }
    return winner !== null && winner.dark;
  }, [anchors]);

  const derivedIsCompact = useMemo(() => {
    if (overrideMode === 'immersive' || overrideMode === 'minimal') return false;
    if (overrideMode === 'dynamic') return isAutoCompact;
    // island | notch share the bounded, backgrounded baseline —
    // each layers its own shape/color overrides on top in AppShell.
    return true;
  }, [overrideMode, isAutoCompact]);

  const isImmersiveDark = overrideMode === 'immersive' && isOverDarkSection;

  return (
    <NavbarContext.Provider value={{
      overrideMode,
      setOverrideMode,
      autohideEnabled,
      setAutohideEnabled,
      toggleAutohide,
      registerAnchor,
      isAutoCompact,
      derivedIsCompact,
      isOverDarkSection,
      isImmersiveDark,
      showMotto,
      setShowMotto,
      toggleMotto,
    }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
}

/**
 * `options.dark` answers one question — "is this section drawn on a navy
 * ground?" — and two things need that answer, so the hook gives it to both:
 *
 *   1. The navbar, which must invert its chrome over a dark section. That is
 *      what the flag was written for, and it goes through `registerAnchor`.
 *   2. The token layer. `data-ground="dark"` on the section element switches
 *      `--text-*`, `--glass-*` and `--accent-fg` for the whole subtree, so every
 *      MUI component inside a navy section paints its dark variant without the
 *      component knowing which ground it is on. See glass.css.
 *
 * Setting the attribute here rather than at each call site means the two can't
 * disagree — a section cannot tell the navbar it is dark and then hand its cards
 * light-ground tokens. The `dark` prop is applied as an attribute rather than
 * through `sx` so it lands before first paint and costs no Emotion class.
 */
export function useNavbarAnchor(id: NavAnchorId, options?: { dark?: boolean; rootMargin?: string; threshold?: number | number[] }) {
  const { registerAnchor } = useNavbar();
  const ref = useRef<HTMLDivElement>(null);
  const dark = options?.dark ?? false;
  const darkRef = useRef(dark);
  darkRef.current = dark;

  const customMargin = options?.rootMargin;
  const customThreshold = options?.threshold;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!dark) return;
    el.setAttribute("data-ground", "dark");
    return () => el.removeAttribute("data-ground");
  }, [dark]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          registerAnchor(id, entry.isIntersecting, darkRef.current, entry.boundingClientRect.top);
        }
      },
      {
        root: null,
        rootMargin: customMargin ?? "-40px 0px -95% 0px", // Trigger only when section crosses the navbar height
        threshold: customThreshold ?? 0,
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      registerAnchor(id, false);
    };
  }, [id, registerAnchor, customMargin, customThreshold]);

  return ref;
}
