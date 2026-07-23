import { motion, useSpring } from "motion/react";
import type { ReactNode } from "react";
import { useRef } from "react";

import { usePointerFine, useReducedMotion } from "@/shared/motion";

const MAX_OFFSET_PX = 6;

/** Magnetic hover (inventory row 6): translate toward the pointer, spring
    home on leave. Inert on coarse pointers and under reduced motion. */
export function MagneticBox({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const fine = usePointerFine();
  const active = !reduced && fine;
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 200, damping: 20 });
  const y = useSpring(0, { stiffness: 200, damping: 20 });

  if (!active) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      style={{ x, y, height: "100%" }}
      onPointerMove={(event) => {
        const rect = ref.current?.getBoundingClientRect();
        if (rect === undefined) return;
        const relX = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
        const relY = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
        x.set(relX * 2 * MAX_OFFSET_PX);
        y.set(relY * 2 * MAX_OFFSET_PX);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
