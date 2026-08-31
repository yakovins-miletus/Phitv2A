import React, { useState, useMemo, useCallback } from 'react';
import type { NavAnchorId } from './navbarAnchors';
import { NavbarContext } from './navbarHooks';

// Re-export for backward compatibility
export { NAV_ANCHORS, type NavAnchorId } from './navbarAnchors';

export type NavbarMode =
  | 'minimal'
  | 'dynamic'
  | 'island'
  | 'island-v2'
  | 'immersive'
  | 'notch'
  | 'standard'
  | 'glassmorphism';

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
export function NavbarProvider({ children }: { children: React.ReactNode }) {
  // Default navbar treatment — the tightened floating pill. On `/` the navbar
  // is still forced to `minimal` while the pinned hero owns the viewport
  // (see AppShell `effectiveMode`); this is what it settles into afterwards
  // and what every other route uses from the top.
  const [overrideMode, setOverrideMode] = useState<NavbarMode>('island-v2');
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
    // island | island-v2 | notch share the bounded, backgrounded baseline —
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

