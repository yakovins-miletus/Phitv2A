import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import type { NavAnchorId } from './navbarAnchors';

// Re-export for backward compatibility
export { NAV_ANCHORS, type NavAnchorId } from './navbarAnchors';

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
  // Default navbar treatment is a standard solid bar, not glassmorphism —
  // deliberate user decision (2026-08). Glass mode is still available via
  // the command palette / navbar-mode override, just not the default.
  const [overrideMode, setOverrideMode] = useState<NavbarMode>('standard');
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

  const customMargin = options?.rootMargin;
  const customThreshold = options?.threshold;

  useLayoutEffect(() => {
    darkRef.current = dark;
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
