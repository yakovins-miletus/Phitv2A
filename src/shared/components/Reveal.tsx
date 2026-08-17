import { motion, useInView } from "motion/react";
import type { MotionStyle } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
const LIFT = 16;

/** Ceiling on how long the entrance gate may hold content clipped.
 *
 *  The gate (`useEntranceSettled`) is released by AppShell's phase machine,
 *  which normally reaches "open" in SETTLE_MS + OPEN_AT_MS (~680ms) or, when
 *  the intro preloader plays, after its own timeline. Anything that interrupts
 *  that sequence used to leave EVERY Reveal on the page clipped permanently,
 *  with no fallback and no timeout — a blank page with full layout height,
 *  because clip-path is paint-only.
 *
 *  This is the same failsafe idea as Preloader's HARD_CAP_MS: the choreography
 *  is an enhancement and is never allowed to be the thing that decides whether
 *  content is readable. Set above the normal release so it never pre-empts the
 *  staged entrance, and well below the preloader's 5s cap so a stalled gate is
 *  invisible to the user rather than terminal.
 *
 *  Note this releases the *entrance* gate only, not `inView` — scroll reveals
 *  still require the element to be in view, so the design is preserved. */
const ENTRANCE_FAILSAFE_MS = 1200;

/** True when IntersectionObserver cannot report visibility at all. `useInView`
 *  would then never flip, so treating content as in-view is the only
 *  fail-open answer. */
const NO_IO = typeof IntersectionObserver === "undefined";

/** MUST stay 0 / "some" — a positive `amount` deadlocks this component.
 *
 *  `amount` becomes the IntersectionObserver threshold, and the hidden state
 *  here is `clip-path: inset(100%)`. Chromium folds clip-path into the
 *  intersection computation, so a clipped element reports intersectionRatio
 *  EXACTLY 0 while still being inside the viewport. Measured on this site:
 *  an unclipped 300x300 div reports ratio 1; the identical div with
 *  `inset(100% 0% 0%)` reports 0.
 *
 *  So any threshold > 0 is unsatisfiable the moment the element hides itself:
 *  hidden -> ratio 0 -> inView never true -> never unhides. The hidden state
 *  suppresses the very measurement that would end it. At threshold 0,
 *  isIntersecting still flips true on a clipped element, which is what breaks
 *  the cycle.
 *
 *  This was latent from the start (Alpha 0.6 used amount 0.3) and presented as
 *  a race: if the observer's first callback happened to land before motion
 *  painted the hidden state, it caught a real ratio and revealed — otherwise
 *  the section stayed blank for the life of the page. */
const REVEAL_AMOUNT = "some" as const;

/** Shared scroll-into-view reveal.
 *
 *  Fails open: content becomes visible if the entrance gate stalls, if
 *  IntersectionObserver is unavailable, or if the visitor prefers reduced
 *  motion. The clip animation is an enhancement on top of readable content —
 *  it is never the sole thing standing between the user and the page. */
export function Reveal({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: MotionStyle }) {
  const reduced = useReducedMotion();
  const ready = useEntranceSettled();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px 100px 0px", amount: REVEAL_AMOUNT });
  const gateExpired = useEntranceFailsafe(ready);

  // `reduced` must be honoured here and not only in `initial`: with
  // `initial={false}` the element adopts whatever `animate` resolves to on the
  // first frame, so a hidden `animate` value clipped reduced-motion visitors
  // exactly as hard as everyone else. StaggerItem below always did honour it.
  const shouldAnimate = reduced || NO_IO || ((ready || gateExpired) && inView);
  const styleProp = style ? { style } : {};

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { clipPath: CLIP_HIDDEN, y: LIFT }}
      animate={shouldAnimate ? { clipPath: CLIP_VISIBLE, y: 0 } : { clipPath: CLIP_HIDDEN, y: LIFT }}
      transition={{
        duration: 0.4,
        ease: EASE_OUT_EXPO,
        delay,
      }}
      {...styleProp}
    >
      {children}
    </motion.div>
  );
}

/** Shared entrance-gate failsafe: true once the gate has had long enough to
 *  release on its own. Stops running as soon as the gate opens normally, which
 *  is the common case. */
function useEntranceFailsafe(ready: boolean): boolean {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (ready || expired) return;
    const id = window.setTimeout(() => setExpired(true), ENTRANCE_FAILSAFE_MS);
    return () => {
      window.clearTimeout(id);
    };
  }, [ready, expired]);

  return expired;
}

/** Wraps a grid that should stagger its children on scroll-enter.
 *  Uses whileInView + staggerChildren for orchestration.
 *
 *  Fails open on the same terms as `Reveal` — see the note on
 *  ENTRANCE_FAILSAFE_MS. */
export function StaggerGroup({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduced = useReducedMotion();
  const ready = useEntranceSettled();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px 100px 0px", amount: REVEAL_AMOUNT });
  const gateExpired = useEntranceFailsafe(ready);

  const shouldAnimate = reduced || NO_IO || ((ready || gateExpired) && inView);

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
