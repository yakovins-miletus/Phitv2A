import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';

export type NavbarMode = 'minimal' | 'dynamic' | 'compact' | 'immersive' | 'liquid' | 'notch';

interface NavbarContextValue {
  overrideMode: NavbarMode;
  setOverrideMode: (mode: NavbarMode) => void;
  autohideEnabled: boolean;
  setAutohideEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  toggleAutohide: () => void;
  registerAnchor: (id: string, isIntersecting: boolean, dark?: boolean) => void;
  isAutoCompact: boolean;
  derivedIsCompact: boolean;
  isOverDarkSection: boolean;
  isImmersiveDark: boolean;
}

const NavbarContext = createContext<NavbarContextValue | null>(null);

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [overrideMode, setOverrideMode] = useState<NavbarMode>('minimal');
  const [autohideEnabled, setAutohideEnabled] = useState(false);
  const [activeAnchors, setActiveAnchors] = useState<Set<string>>(new Set());
  const [darkAnchors, setDarkAnchors] = useState<Set<string>>(new Set());

  const toggleAutohide = useCallback(() => {
    setAutohideEnabled((prev) => !prev);
  }, []);

  const registerAnchor = useCallback((id: string, isIntersecting: boolean, dark = false) => {
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
    // compact | liquid | notch share the bounded, backgrounded baseline —
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

export function useNavbarAnchor(id: string, options?: { dark?: boolean }) {
  const { registerAnchor } = useNavbar();
  const ref = useRef<HTMLDivElement>(null);
  const darkRef = useRef(options?.dark ?? false);
  darkRef.current = options?.dark ?? false;

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
        rootMargin: "-80px 0px 0px 0px", // Trigger slightly after it scrolls into view (below navbar)
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      registerAnchor(id, false);
    };
  }, [id, registerAnchor]);

  return ref;
}
