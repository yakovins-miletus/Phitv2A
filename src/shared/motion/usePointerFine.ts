import { useSyncExternalStore } from "react";

const POINTER_FINE = "(pointer: fine)";

/**
 * True for precise pointers only — mouse and trackpad, not touch.
 *
 * Magnetic hovers and pointer-tracking effects exist only here (motion
 * inventory row 6): on a touch screen there is no cursor to track, and an
 * effect that only fires on tap reads as a bug rather than as polish.
 *
 * Its own module rather than living in ./index because usePointerSpace needs
 * it, and importing it from the barrel that re-exports usePointerSpace makes a
 * cycle.
 */
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
