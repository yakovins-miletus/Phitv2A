import { createContext, useContext, useSyncExternalStore } from "react";

/** Single reduced-motion source for the whole app (MOTION INVENTORY, Global). */
export { useReducedMotion } from "motion/react";

/** Entrance choreography: the overlay lifts, then the hero, header, and
    below-fold content release in tiers instead of all on one tick.
    "covered" → overlay still up · "hero" → hero copy may animate ·
    "header" → chrome drops in · "open" → in-view reveals cascade. */
export type EntrancePhase = "covered" | "hero" | "header" | "open";

// Defaults open so portals/tests without an AppShell provider never gate.
export const EntrancePhaseContext = createContext<EntrancePhase>("open");

/** True once the entry preloader overlay is gone (hero tier and later). */
export function usePreloaderReady(): boolean {
  return useContext(EntrancePhaseContext) !== "covered";
}

/** True once the header chrome is released (after the hero starts). */
export function useHeaderReleased(): boolean {
  const phase = useContext(EntrancePhaseContext);
  return phase === "header" || phase === "open";
}

/** True once the entrance has fully settled — below-hero reveals gate here. */
export function useEntranceSettled(): boolean {
  return useContext(EntrancePhaseContext) === "open";
}

const POINTER_FINE = "(pointer: fine)";

/** Magnetic hovers exist only for precise pointers (inventory row 6). */
export function usePointerFine(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(POINTER_FINE);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(POINTER_FINE).matches,
    () => false,
  );
}
