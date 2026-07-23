import Box from "@mui/material/Box";
import { NOIR } from "@/shared/theme/palette";

/** Ambient stage lighting for the home page — two fixed, non-interactive
 *  paint layers behind the stage sections (whose `.stage-inner` sits at
 *  zIndex 1):
 *
 *  1. A static vignette that dims the viewport edges toward the void color,
 *     so viewport-center content reads "lit" and the edges read "in the
 *     wings". Never animated.
 *  2. An oversized radial glow whose `y` eases toward a band matching the
 *     active section's chapter — the stage light follows the active chapter
 *     so the page reads as one continuously lit stage rather than a stack of
 *     disconnected sections.
 *
 *  Perf contract: no scroll listeners and no rect reads at scroll time. The
 *  only subscription is `useActiveSection()` (fires ~14x per full scroll),
 *  and each change triggers a single transform tween via `gsap.quickTo`. */
export function StageLight() {


  return (
    <>

      {/* Static vignette — void color at the edges, fully transparent over
          the center ~60% of the viewport. NEVER animated. */}
      <Box
        aria-hidden
        sx={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `radial-gradient(ellipse 90% 80% at 50% 50%, transparent 55%, rgba(${NOIR.voidRgb}, 0.35) 100%)`,
        }}
      />
    </>
  );
}
