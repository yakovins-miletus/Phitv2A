import { motion, useInView } from "motion/react";
import type { MotionStyle } from "motion/react";
import { useRef } from "react";
import type { ReactNode } from "react";

import { useEntranceSettled, useReducedMotion } from "@/shared/motion";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";

type Direction = "up" | "down" | "left" | "right";

/** Per-direction clip-path (the hidden state), animation axis, and the sign
 *  of the lift/slide offset. `up`/`down` clip from the box's own top/bottom
 *  so the reveal grows from the opposite edge; `left`/`right` do the same on
 *  the horizontal axis. Matches `Reveal.tsx`'s fixed "up" case exactly — see
 *  that file's docblock for the inset(...) mechanics. */
const CLIP: Record<Direction, { hidden: string; axis: "x" | "y"; sign: 1 | -1 }> = {
  up: { hidden: "inset(100% 0% 0% 0%)", axis: "y", sign: 1 },
  down: { hidden: "inset(0% 0% 100% 0%)", axis: "y", sign: -1 },
  left: { hidden: "inset(0% 100% 0% 0%)", axis: "x", sign: -1 },
  right: { hidden: "inset(0% 0% 0% 100%)", axis: "x", sign: 1 },
};
const CLIP_VISIBLE = "inset(0% 0% 0% 0%)";

/**
 * Directional curtain-mask reveal: content is uncovered by an animated
 * `clip-path` inset and eases into place along the same axis. No `opacity`
 * keyframe — the content is opaque throughout, just masked.
 *
 * The general-purpose sibling of `Reveal` (which is the fixed "up" case used
 * sitewide by default) — reach for this when a section wants a different
 * direction, a bigger/smaller lift, or to opt out of the `once: true` /
 * entrance-gate defaults.
 */
export function RevealMask({
  children,
  direction = "up",
  distance = 28,
  delay = 0,
  duration = 0.4,
  once = true,
  style,
}: {
  children: ReactNode;
  direction?: Direction;
  distance?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
  style?: MotionStyle;
}) {
  const reduced = useReducedMotion();
  const ready = useEntranceSettled();
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: "0px 0px 100px 0px", amount: 0.05 });
  const shouldAnimate = ready && inView;

  const cfg = CLIP[direction];
  const offset = cfg.sign * distance;
  const hiddenX = cfg.axis === "x" ? offset : 0;
  const hiddenY = cfg.axis === "y" ? offset : 0;
  const styleProp = style ? { style } : {};

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { clipPath: cfg.hidden, x: hiddenX, y: hiddenY }}
      animate={
        shouldAnimate
          ? { clipPath: CLIP_VISIBLE, x: 0, y: 0 }
          : { clipPath: cfg.hidden, x: hiddenX, y: hiddenY }
      }
      transition={{ duration, ease: EASE_OUT_EXPO, delay }}
      {...styleProp}
    >
      {children}
    </motion.div>
  );
}
