import { createContext, useContext } from "react";

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

/** Device capability tiering — gates cost, where usePointerFine gates affordances. */
export { useDeviceTier, useIsLowPowerDevice, type DeviceTier } from "./useDeviceTier";

/** Shared pointer-driven perspective: one vanishing point per section. */
export { usePointerSpace, useDepthLayer, type PointerSpace } from "./usePointerSpace";

/** Magnetic hovers exist only for precise pointers (inventory row 6). */
export { usePointerFine } from "./usePointerFine";
