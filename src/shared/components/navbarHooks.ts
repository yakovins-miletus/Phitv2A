import React, { createContext, useContext, useLayoutEffect, useEffect, useRef } from 'react';
import type { NavAnchorId } from './navbarAnchors';
import type { NavbarMode } from './NavbarContext';

export interface NavbarContextValue {
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

export const NavbarContext = createContext<NavbarContextValue | null>(null);

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
