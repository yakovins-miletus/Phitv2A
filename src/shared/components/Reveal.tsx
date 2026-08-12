import { motion, useInView } from "motion/react";
import type { MotionStyle } from "motion/react";
import { useRef } from "react";
import type { ReactNode } from "react";

import { useEntranceSettled, useReducedMotion } from "@/shared/motion";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";

/** Curtain-mask reveal, not a fade: content is uncovered by an animated
 *  `clip-path` inset (paint-only, not layout) while it lifts slightly on
 *  `transform`. No `opacity` keyframe anywhere. `inset(100% 0 0 0)` clips the
 *  full box from the top, leaving a zero-height sliver at the bottom; as the
 *  top offset eases to 0 the visible region grows upward from that sliver,
 *  so the reveal reads as rising into place rather than fading in. See
 *  `RevealMask` for the directional/general version other sections can use
 *  in place of this fixed "rise" case. */
const CLIP_HIDDEN = "inset(100% 0% 0% 0%)";
const CLIP_VISIBLE = "inset(0% 0% 0% 0%)";
const LIFT = 28;

/** Shared scroll-into-view reveal. Content is visible by default via CSS;
 *  the JS animation enhances. */
export function Reveal({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: MotionStyle }) {
  const reduced = useReducedMotion();
  const ready = useEntranceSettled();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px", amount: 0.3 });

  const shouldAnimate = ready && inView;
  const styleProp = style ? { style } : {};

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { clipPath: CLIP_HIDDEN, y: LIFT }}
      animate={shouldAnimate ? { clipPath: CLIP_VISIBLE, y: 0 } : { clipPath: CLIP_HIDDEN, y: LIFT }}
      transition={{
        duration: 0.8,
        ease: EASE_OUT_EXPO,
        delay,
      }}
      {...styleProp}
    >
      {children}
    </motion.div>
  );
}

/** Wraps a grid that should stagger its children on scroll-enter.
 *  Uses whileInView + staggerChildren for orchestration. */
export function StaggerGroup({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ready = useEntranceSettled();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px", amount: 0.25 });

  const shouldAnimate = ready && inView;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={shouldAnimate ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.08, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Individual item inside a StaggerGroup. Receives variant orchestration from parent. */
export function StaggerItem({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: reduced ? { clipPath: CLIP_VISIBLE, y: 0 } : { clipPath: CLIP_HIDDEN, y: LIFT },
        visible: { clipPath: CLIP_VISIBLE, y: 0 },
      }}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
