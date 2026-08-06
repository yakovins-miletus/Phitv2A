import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';

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
  /** The home page's post-hero content zone. */
  HOME_COMPACT: 'home-compact',
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
  /** The immersive process section on the home page. */
  PROCESS_IMMERSIVE: 'process-immersive',
  /** AppShell's footer, on every route. */
  SITE_FOOTER: 'site-footer',
} as const;

export type NavAnchorId = (typeof NAV_ANCHORS)[keyof typeof NAV_ANCHORS];

interface NavbarContextValue {
  overrideMode: NavbarMode;
  setOverrideMode: (mode: NavbarMode) => void;
  autohideEnabled: boolean;
  setAutohideEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  toggleAutohide: () => void;
  registerAnchor: (id: NavAnchorId, isIntersecting: boolean, dark?: boolean) => void;
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
  const [overrideMode, setOverrideMode] = useState<NavbarMode>('minimal');
  const [autohideEnabled, setAutohideEnabled] = useState(false);
  const [showMotto, setShowMotto] = useState(false);
  const [activeAnchors, setActiveAnchors] = useState<Set<string>>(new Set());
  const [darkAnchors, setDarkAnchors] = useState<Set<string>>(new Set());

  const toggleAutohide = useCallback(() => {
    setAutohideEnabled((prev) => !prev);
  }, []);

  const toggleMotto = useCallback(() => {
    setShowMotto((prev) => !prev);
  }, []);

  const registerAnchor = useCallback((id: NavAnchorId, isIntersecting: boolean, dark = false) => {
    setActiveAnchors((prev) => {
      const next = new Set(prev);
      if (isIntersecting) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
    setDarkAnchors((prev) => {
      const next = new Set(prev);
      if (isIntersecting && dark) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const isAutoCompact = activeAnchors.size > 0;
  const isOverDarkSection = darkAnchors.size > 0;

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

export function useNavbarAnchor(id: NavAnchorId, options?: { dark?: boolean; rootMargin?: string; threshold?: number | number[] }) {
  const { registerAnchor } = useNavbar();
  const ref = useRef<HTMLDivElement>(null);
  const darkRef = useRef(options?.dark ?? false);
  darkRef.current = options?.dark ?? false;

  const customMargin = options?.rootMargin;
  const customThreshold = options?.threshold;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          registerAnchor(id, entry.isIntersecting, darkRef.current);
        }
      },
      {
        root: null,
        rootMargin: customMargin ?? "-80px 0px -90% 0px", // Trigger only when section crosses the navbar height
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
