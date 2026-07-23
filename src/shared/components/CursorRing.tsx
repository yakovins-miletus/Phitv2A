import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

import { usePointerFine, useReducedMotion } from "@/shared/motion";

import { NOIR } from "@/shared/theme/palette";

/** Gold dot + trailing spring ring; the ring expands hollow over
    [data-cursor] targets. Decorative only: pointer:fine ∧ !reduced, the OS
    cursor is never hidden, both layers are aria-hidden + pointer-events:none. */
export function CursorRing() {
  const reduced = useReducedMotion();
  const fine = usePointerFine();
  const active = reduced !== true && fine;

  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const ringX = useSpring(dotX, { stiffness: 260, damping: 24 });
  const ringY = useSpring(dotY, { stiffness: 260, damping: 24 });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!active) return;
    const onMove = (event: PointerEvent) => {
      dotX.set(event.clientX);
      dotY.set(event.clientY);
      const target = event.target;
      setExpanded(target instanceof Element && target.closest("[data-cursor]") !== null);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [active, dotX, dotY]);

  if (!active) return null;

  return (
    <>
      <motion.div
        aria-hidden
        style={{
          x: dotX,
          y: dotY,
          position: "fixed",
          top: -3,
          left: -3,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: NOIR.gold,
          pointerEvents: "none",
          zIndex: 2100,
          mixBlendMode: "difference",
        }}
      />
      <motion.div
        aria-hidden
        animate={{ scale: expanded ? 2.2 : 1, opacity: expanded ? 0.9 : 0.5 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{
          x: ringX,
          y: ringY,
          position: "fixed",
          top: -16,
          left: -16,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: `1px solid ${NOIR.gold}`,
          pointerEvents: "none",
          zIndex: 2100,
          mixBlendMode: "difference",
        }}
      />
    </>
  );
}
