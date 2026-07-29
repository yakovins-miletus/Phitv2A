import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { EASE_OUT_EXPO } from "@/shared/motion/easing";

/** A parallax + reveal wrapper, used to wrap every block on the About page.
 *
 *  KNOWN GAP, deliberately left as-is by the scroll/motion refactor: unlike
 *  StageSection on the home page, this does not honour prefers-reduced-motion —
 *  the y-shift and the scale-in run regardless. Fixing it is a real behaviour
 *  change (a11y-correct, but visible), so it belongs in its own change with its
 *  own sign-off rather than being smuggled into a file move. */
export function SmoothSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Extremely subtle continuous vertical shift for that floaty, premium feel
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 1.2, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}