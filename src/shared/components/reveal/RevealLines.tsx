import { useRef } from "react";
import type { ReactNode } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { useReducedMotion } from "@/shared/motion";

gsap.registerPlugin(SplitText, ScrollTrigger);

/**
 * Headline/paragraph line-wipe reveal — the classic "text rises out from
 * behind a mask" award-site move (see award-site-patterns P2).
 *
 * GSAP SplitText breaks the *rendered* text into real wrapped lines (not an
 * author-guessed split — it re-measures on resize) and, via `mask: "lines"`,
 * auto-wraps each one in its own `overflow: clip` parent. Each line then
 * lifts from `yPercent: 110` to `0` on a stagger, transform-only. SplitText's
 * `aria: "auto"` default (on here) hides every split copy and stamps the
 * original text onto this wrapper as `aria-label` instead — so the visible
 * split markup never reaches assistive tech, only the one accessible string.
 *
 * That wrapper is a plain `div`, though, which drops heading semantics if
 * `children` is a heading — pass `headingLevel` (matching the wrapped
 * element's own `variant`/`component`) to restore `role="heading"` so
 * heading-navigation still finds it.
 *
 * Reduced motion skips SplitText entirely and renders the plain, settled
 * text — no split markup, no animation.
 */
export function RevealLines({
  children,
  stagger = 0.06,
  delay = 0,
  className,
  headingLevel,
}: {
  children: ReactNode;
  stagger?: number;
  delay?: number;
  className?: string;
  /** Set when `children` is a heading (matching its level) so the
   *  `aria-label` wrapper SplitText creates still reads as a heading. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const headingProps =
    headingLevel !== undefined ? { role: "heading" as const, "aria-level": headingLevel } : {};

  useGSAP(
    () => {
      if (reduced === true || !ref.current) return;

      const split = SplitText.create(ref.current, {
        type: "lines",
        mask: "lines",
        linesClass: "reveal-line",
      });

      gsap.set(split.lines, { yPercent: 110 });

      const trigger = ScrollTrigger.create({
        trigger: ref.current,
        start: "top 88%",
        once: true,
        onEnter: () => {
          gsap.to(split.lines, {
            yPercent: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger,
            delay,
          });
        },
      });

      return () => {
        trigger.kill();
        split.revert();
      };
    },
    { scope: ref, dependencies: [reduced, stagger, delay] },
  );

  // Only stamp the heading role while SplitText has actually replaced the
  // accessible name with its `aria-label`. Under reduced motion `children`
  // renders untouched, so its own heading tag (if any) is already correct
  // and doubling the role here would nest a heading inside a heading.
  return (
    <div ref={ref} className={className} {...(reduced === true ? {} : headingProps)}>
      {children}
    </div>
  );
}
