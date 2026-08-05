/**
 * The single gate on glass cost.
 *
 * useDeviceTier's docblock names the measured problem: a 4-core, 4 GB laptop was
 * getting three canvases, two blend-mode layers, "a header backdrop-blur", a
 * grain overlay and Lenis with lag smoothing off. A glassmorphic design
 * multiplies the blur count from one to dozens, so the cost needs one switch
 * rather than a conditional per component — AppShell used to carry its own, and
 * that scaled to exactly one surface.
 *
 * This flips ONE attribute on <html>. glass.css owns what the attribute means:
 * blur to 0, saturate to 100%, and the opaque understudy rising to 0.94 alpha,
 * all in one declaration block. An attribute rather than three setProperty calls
 * because those three values must move together — a half-applied gate leaves a
 * 6%-white surface floating over unblurred content with text on it.
 *
 * Reduced motion is *also* gated in glass.css's @media block, so those users get
 * no blur before React even mounts. The hook covers it too, which is what makes
 * the gate assertable in jsdom (where media queries are stubbed).
 */

import { useEffect } from "react";

import { useIsLowPowerDevice, useReducedMotion } from "@/shared/motion";

export function useGlassGate(): void {
  const isLowPower = useIsLowPowerDevice();
  // Motion's hook returns `boolean | null` — null until it has read the query.
  // Compare explicitly, the same way GroundLayer and StageSection do.
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const root = document.documentElement;

    if (isLowPower || prefersReducedMotion === true) {
      root.dataset.glass = "off";
    } else {
      delete root.dataset.glass;
    }

    // Restore the default (absent attribute = full glass) so repeated renders in
    // the test suite don't leak a gated state into the next case.
    return () => {
      delete root.dataset.glass;
    };
  }, [isLowPower, prefersReducedMotion]);
}
