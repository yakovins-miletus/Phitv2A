/** Establishing-shot choreography data — the tween values that used to be
 *  hardcoded inside `MajorEstablishingShot`/`MiniEstablishingShot`. Sibling of
 *  `stageChoreo.ts`: data only, no gsap import, so it stays cheap to pull into
 *  either the shot components (while they are still `selfDriven`) or the single
 *  `SectionBeat` timeline that will drive them.
 *
 *  INVARIANT (inherited verbatim from `stageChoreo.ts`): every tween built from
 *  this map is a `fromTo`/`from`, and the DOM default is the final lit state —
 *  reduced motion and no-JS must render the shot fully visible, unclipped,
 *  untransformed. clipPath is applied ONLY via GSAP from-vars, never via
 *  sx/style, so a trigger that never fires cannot strand content.
 *
 *  The two scales are deliberately different tempos, not a shared scale with a
 *  multiplier: the major shot is a 1.30s statement, the mini a 1.05s aside.
 *  Keep them independent — tuning one must not drag the other.
 */

/** Plain tween-vars shape. Transforms, opacity and clip-path only — never
 *  layout properties, so every step composites (see `gsap-performance`). */
export type EstablishVars = Record<string, number | string>;

export interface EstablishStep {
  /** from-vars; the element's DOM state is always the *to* side. */
  from: EstablishVars;
  to: EstablishVars;
  duration: number;
  ease: string;
  /** Timeline position parameter. */
  at: number | string;
}

export interface EstablishChoreo {
  /** Kicker/metadata bar drops in. Class hook: `.est-meta`. */
  meta: EstablishStep;
  /** Caliper hairline draws out. Class hook: `.est-ruler`.
   *  `transformOrigin` is supplied per call site via `rulerTransformOrigin()`. */
  ruler: EstablishStep;
  /** Left-to-right clip-path wipe over the headline. Class hook: `.est-mask`. */
  mask: EstablishStep;
  /** Gold beam that rides the wipe. Class hook: `.est-laser`. The sweep target
   *  is dynamic — see `laserSweepX()`. */
  laser: EstablishStep;
  /** Beam fades once it has overrun the wipe. Relative position parameter. */
  laserOut: { to: EstablishVars; duration: number; at: string };
  /** Total timeline length in seconds, for callers sequencing beats after it. */
  total: number;
}

/** Major shot — 1.30s. */
export const MAJOR_ESTABLISH: EstablishChoreo = {
  meta: {
    from: { autoAlpha: 0, y: -8 },
    to: { autoAlpha: 1, y: 0 },
    duration: 0.45,
    ease: "power2.out",
    at: 0,
  },
  ruler: {
    from: { scaleX: 0 },
    to: { scaleX: 1 },
    duration: 0.85,
    ease: "expo.out",
    at: 0.05,
  },
  mask: {
    from: { clipPath: "inset(0% 100% 0% 0%)" },
    to: { clipPath: "inset(0% 0% 0% 0%)" },
    duration: 0.95,
    ease: "power3.inOut",
    at: 0.1,
  },
  laser: {
    from: { x: 0, autoAlpha: 1 },
    to: {},
    duration: 0.95,
    ease: "power3.inOut",
    at: 0.1,
  },
  laserOut: { to: { autoAlpha: 0 }, duration: 0.25, at: "-=0.15" },
  total: 1.3,
};

/** Mini shot — 1.05s. Same five steps, quicker and slightly smaller drop. */
export const MINI_ESTABLISH: EstablishChoreo = {
  meta: {
    from: { autoAlpha: 0, y: -6 },
    to: { autoAlpha: 1, y: 0 },
    duration: 0.4,
    ease: "power2.out",
    at: 0,
  },
  ruler: {
    from: { scaleX: 0 },
    to: { scaleX: 1 },
    duration: 0.8,
    ease: "expo.out",
    at: 0.05,
  },
  mask: {
    from: { clipPath: "inset(0% 100% 0% 0%)" },
    to: { clipPath: "inset(0% 0% 0% 0%)" },
    duration: 0.85,
    ease: "power3.inOut",
    at: 0.1,
  },
  laser: {
    from: { x: 0, autoAlpha: 1 },
    to: {},
    duration: 0.85,
    ease: "power3.inOut",
    at: 0.1,
  },
  laserOut: { to: { autoAlpha: 0 }, duration: 0.2, at: "-=0.1" },
  total: 1.05,
};

/** The ruler grows from its own anchored edge; centred mini shots grow from the
 *  middle. Major shots are always left-anchored. */
export function rulerTransformOrigin(align: "left" | "center" = "left"): string {
  return align === "center" ? "center" : "left center";
}

/**
 * Sweep distance for the laser beam, in px.
 *
 * The beam used to animate `left: "0%" -> "100%"` — a *layout* property, which
 * forces layout on every frame of a scroll-driven page. It is now a transform:
 * the bar is pinned at `left: 0` in CSS and translated by exactly the width of
 * its positioning context, which lands its left edge on that context's right
 * edge — pixel-identical to where `left: 100%` used to put it, on the same
 * duration and ease, but composited.
 *
 * Measured at tween-build time rather than baked into the tokens because the
 * distance is the container's rendered width, which is viewport-dependent.
 */
export function laserSweepX(el: Element): number {
  const host = el.parentElement;
  return host ? host.clientWidth : 0;
}
