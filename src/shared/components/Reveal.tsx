import { motion, useInView } from "motion/react";
import { useRef } from "react";
import type { ReactNode } from "react";

import { useEntranceSettled, useReducedMotion } from "@/shared/motion";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Shared scroll-into-view reveal. Animate ONLY transform+opacity.
 *  Content is visible by default via CSS; the JS animation enhances. */
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduced = useReducedMotion();
  const ready = useEntranceSettled();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  
  const shouldAnimate = ready && inView;

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{
        duration: 0.6,
        ease: EASE_OUT_EXPO,
        delay,
      }}
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
  const inView = useInView(ref, { once: true, amount: 0.15 });

  const shouldAnimate = ready && inView;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={shouldAnimate ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.06, delayChildren: delay },
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
        hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
