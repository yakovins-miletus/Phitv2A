import { useCallback, useRef } from "react";
import { useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";

import { useReducedMotion } from "motion/react";

import { usePointerFine } from "./usePointerFine";

/**
 * One room, one vanishing point, one cursor.
 *
 * ## Why this exists
 *
 * The pillars section had `perspective: 2000` on its grid *and*
 * `perspective: 1000` on every card. The inner value wins, so each card became
 * its own vanishing point and the three of them tilted in three unrelated
 * spaces. That is the whole reason the section read as flat rectangles
 * wobbling rather than objects sharing a room — no amount of extra shadow or
 * blur fixes it, because the geometry is wrong before anything is painted.
 *
 * The fix is structural: the *container* owns the perspective, the container
 * owns the pointer, and every layer inside reads the same pointer through a
 * depth multiplier. Nearer things swing further than distant ones, which is
 * the only cue that actually makes a flat screen read as depth. Per-element
 * tilt handlers cannot produce it however carefully they are tuned, because
 * each element only knows about itself.
 *
 * ## Contract
 *
 * `bind` goes on the element that carries `perspective`. `useDepthLayer(depth)`
 * is called by each layer inside it, where depth is roughly "how far behind the
 * glass", negative for in front:
 *
 *     const space = usePointerSpace();
 *     <Box {...space.bind} sx={{ perspective: 1600 }}>
 *       <motion.div style={useDepthLayer(space, 1)}>near</motion.div>
 *       <motion.div style={useDepthLayer(space, -1)}>far</motion.div>
 *     </Box>
 *
 * Inert under `prefers-reduced-motion` and on coarse pointers, per the motion
 * inventory's rule that pointer-tracking effects belong to precise pointers
 * only. Inert means the motion values simply stay at rest — callers do not
 * branch, and the layout is identical either way.
 */

/** Max swing of the room, in degrees, at depth 1. */
const SWING = 6;

/** Parallax travel in px at depth 1. Small: this is depth, not a slider. */
const DRIFT = 14;

export interface PointerSpace {
  /** Spread onto the element that owns `perspective`. */
  bind: {
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerLeave: () => void;
  };
  /** −0.5 → 0.5 across the container, smoothed. */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** True when the room is actually tracking anything. */
  active: boolean;
}

export function usePointerSpace(): PointerSpace {
  const reduced = useReducedMotion() === true;
  const fine = usePointerFine();
  const active = fine && !reduced;
  const boundsRef = useRef<DOMRect | null>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Soft and slightly slow: a room the cursor leads, not a control it drives.
  const x = useSpring(rawX, { stiffness: 120, damping: 24, mass: 0.6 });
  const y = useSpring(rawY, { stiffness: 120, damping: 24, mass: 0.6 });

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!active) return;
      // Measured on the first move of a gesture rather than every frame: a
      // getBoundingClientRect per pointermove forces layout on a section that
      // is also being scroll-animated.
      const box = boundsRef.current ?? event.currentTarget.getBoundingClientRect();
      boundsRef.current = box;
      rawX.set((event.clientX - box.left) / box.width - 0.5);
      rawY.set((event.clientY - box.top) / box.height - 0.5);
    },
    [active, rawX, rawY],
  );

  const onPointerLeave = useCallback(() => {
    boundsRef.current = null;
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return { bind: { onPointerMove, onPointerLeave }, x, y, active };
}

/**
 * A layer at `depth` inside a `PointerSpace`.
 *
 * Depth 1 is at the glass, 0 is the pivot, negatives sit behind it. Rotation is
 * shared by the whole room (everything turns together, as a room does) while
 * translation scales with depth (near things sweep past faster than far ones).
 * That split is the parallax; without it, uniform motion reads as one flat
 * plane sliding.
 */
export function useDepthLayer(space: PointerSpace, depth: number) {
  const rotateY = useTransform(space.x, [-0.5, 0.5], [-SWING, SWING]);
  const rotateX = useTransform(space.y, [-0.5, 0.5], [SWING, -SWING]);
  const translateX = useTransform(space.x, [-0.5, 0.5], [-DRIFT * depth, DRIFT * depth]);
  const translateY = useTransform(space.y, [-0.5, 0.5], [-DRIFT * depth, DRIFT * depth]);

  return { rotateX, rotateY, x: translateX, y: translateY };
}
