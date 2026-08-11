import type { StageChoreo } from "@/shared/sections";

/** Stage-spotlight choreography data, consumed only by StageSection so it
 *  rides the lazy home chunk (sections.ts must stay gsap-free for the rails).
 *
 *  INVARIANT: every tween built from this map is a `fromTo`, and the DOM
 *  default is the final lit state — reduced motion and no-JS must render
 *  sections fully visible, unclipped, untransformed. clipPath is applied
 *  ONLY via GSAP from-vars, never via sx/style. */

/** Plain tween-vars shape (transforms/opacity/clip-path only — never layout,
 *  filters, or shadows, so the scrub stays compositor-cheap). */
export interface ChoreoFrom {
  autoAlpha: number;
  x?: number;
  y?: number;
  scale?: number;
  clipPath?: string;
}

interface ChoreoVariant {
  from: ChoreoFrom;
  /** Anchors the scale so growth reads as expanding from a stage wing. */
  transformOrigin: string;
}

export const STAGE_CHOREO: Record<StageChoreo, ChoreoVariant> = {
  rise: {
    from: { autoAlpha: 0.15, y: 96, scale: 0.90 },
    transformOrigin: "center center",
  },
  "grow-left": {
    from: { autoAlpha: 0.15, x: -96, scale: 0.85 },
    transformOrigin: "left center",
  },
  "grow-right": {
    from: { autoAlpha: 0.15, x: 96, scale: 0.85 },
    transformOrigin: "right center",
  },
  "zoom-center": {
    from: { autoAlpha: 0.12, scale: 0.82, y: 48 },
    transformOrigin: "center center",
  },
  "spotlight-clip": {
    from: { autoAlpha: 0.3, scale: 0.92, clipPath: "inset(14% 10% 14% 10% round 4px)" },
    transformOrigin: "center center",
  },
};

/** Shared fully-lit target. Variants with a clipPath in their from-vars must
 *  also tween to STAGE_LIT_CLIP — others never touch clip-path at all. */
export const STAGE_LIT = { autoAlpha: 1, x: 0, y: 0, scale: 1 } as const;
export const STAGE_LIT_CLIP = "inset(0% 0% 0% 0% round 4px)";

/** Shared exit for ALL variants: entrances vary, the recede stays coherent. */
export const STAGE_EXIT = { autoAlpha: 0.15, y: -40, scale: 0.94 } as const;

/** Timeline phase durations as fractions of the scrubbed section timeline. */
export const STAGE_ENTER_DURATION = 0.35;
export const STAGE_HOLD_DURATION = 0.47;
export const STAGE_EXIT_DURATION = 0.18;

/** Widest x offset allowed under the MUI `sm` breakpoint — ±96px slides read
 *  as off-screen shoves on a 375px viewport, so narrow screens halve them. */
const NARROW_X_MAX = 48;

/** From-vars for a variant, with x clamped to ±48 on narrow (<600px) viewports. */
export function resolveChoreoFrom(variant: StageChoreo, isNarrow: boolean): ChoreoFrom {
  const { from } = STAGE_CHOREO[variant];
  if (!isNarrow || from.x === undefined) return from;
  return { ...from, x: Math.sign(from.x) * Math.min(Math.abs(from.x), NARROW_X_MAX) };
}
