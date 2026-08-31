import { useRef } from "react";
import Box from "@mui/material/Box";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { useReducedMotion } from "@/shared/motion";
import { GROUNDS, type GroundName } from "@/shared/theme/grounds";
import { BAR_COUNT, BAR_CLIP_LIT, barClipFor, barRevealFor } from "./barPhases";

/** Height of the transition section, as a fraction of the viewport. */
const SECTION_HEIGHT = "70vh";

/**
 * A foreground transition section that sits in the normal document flow between
 * two content sections. It is `BAR_COUNT` stacked horizontal bars: as the
 * reader scrolls through, each bar wipes the previous section's ground colour
 * upward to reveal the next section's ground colour rising from the bottom.
 * Bars resolve bottom-to-top (see `barPhases.ts`).
 *
 * It "cheats" by only ever painting the two adjacent ground colours — no
 * per-pixel sampling of the sections themselves. Pure CSS/DOM, no canvas.
 *
 * Degradation:
 *  - `prefers-reduced-motion`: a static solid band of the `to` colour.
 *  - No JS / trigger never fires: the DOM default is the fully-revealed `to`
 *    colour (covers sit at `BAR_CLIP_LIT`), matching the SectionBeat invariant.
 */
export function BarTransitionSection({
  from,
  to,
}: {
  /** Ground name being left. */
  from: GroundName;
  /** Ground name being entered. */
  to: GroundName;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const fromColor = GROUNDS[from].bg;
  const toColor = GROUNDS[to].bg;

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      if (!wrap || reduced) return;

      const st = ScrollTrigger.create({
        trigger: wrap,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          for (let i = 0; i < BAR_COUNT; i += 1) {
            wrap.style.setProperty(
              `--bar-clip-${String(i)}`,
              barClipFor(barRevealFor(i, self.progress)),
            );
          }
        },
      });

      return () => {
        st.kill();
      };
    },
    { scope: wrapRef, dependencies: [reduced, fromColor, toColor] },
  );

  // Reduced motion: no bars, just land on the target colour.
  if (reduced) {
    return (
      <Box
        aria-hidden
        style={{ height: SECTION_HEIGHT }}
        sx={{ width: "100%", bgcolor: toColor }}
      />
    );
  }

  return (
    <Box
      ref={wrapRef}
      aria-hidden
      className="bar-transition-section"
      style={{ height: SECTION_HEIGHT }}
      sx={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // Below the fixed GroundLayer's z-index -1 concerns; this is opaque.
        bgcolor: toColor,
      }}
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <Box
          key={`bar-${String(i)}`}
          sx={{ position: "relative", flex: 1, width: "100%", bgcolor: toColor }}
        >
          {/* `from`-colour cover — collapses toward its top edge as the reader
              scrolls, uncovering the `to` colour from the bottom up. */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: fromColor,
              clipPath: `var(--bar-clip-${String(i)}, ${BAR_CLIP_LIT})`,
            }}
          />
        </Box>
      ))}
    </Box>
  );
}
