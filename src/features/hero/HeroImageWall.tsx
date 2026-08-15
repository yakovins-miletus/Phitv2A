/**
 * The hero's drift wall, configured.
 *
 * Everything hero-specific lives here so `DriftWall.tsx` stays a general component:
 * the layer's position in the hero's z-stack, the navy backplate, the scroll-driven
 * entrance, and the tuned props. It is the `React.lazy` target, which is why the
 * `driftWall.css` import chain hangs off this file rather than off the route.
 *
 * Replaces the two 50vh split panes (`topHalfHero.webp` / `botHalfHero.webp`) that
 * auto-panned in opposite directions through the gunshot phase.
 *
 * ── Why there is a backplate ──────────────────────────────────────────────────
 *
 * The panes this replaces were opaque and covered the full viewport. The wall is not:
 * its whole visual idea is a mask that dissolves to *transparent* at the frame edges.
 * Behind it is `GroundLayer` painting `base` — `NOIR.void`, a near-white
 * (`tests/home-reduced-motion.test.tsx` pins the exact value). Without a backplate the
 * gunshot grows white corners, and worse, the difference-blend maths below inverts
 * there. `bgcolor: NOIR.navyDeep` costs one rect paint and turns the dissolve into a
 * vignette instead of a hole.
 *
 * ── Why the wash sits where it does ───────────────────────────────────────────
 *
 * The flanking text one layer up ("7 YEARS OF EXCELLENCE" / "COMPETITIVENESS") is
 * near-white and blends with `mixBlendMode: "difference"`. Against a backdrop channel
 * `b` that paints `255 - b`, so its contrast against its own backdrop is `|255 - 2b|`
 * — **zero at b = 127.5**. A mid-grey backdrop does not make that text hard to read,
 * it makes it invisible. The old 0.80 navy wash kept the composite near b = 51-70 by
 * brute force; here the same job is split between a lighter wash (0.42, set in
 * `SuperHeroSequence.tsx`) and the wall's own `dim` + `overlayColor`, which land the
 * composite around b = 83.
 *
 * The constraint to preserve if any of these numbers are retuned: **the composited
 * backdrop under the flanking text must stay below roughly 95 per channel.** Raising
 * `dim` and raising the wash both move it the right way. `grayscale` earns its place
 * for the same reason — it removes the hue variance between 24 different photographs,
 * so the composite is predictable rather than per-tile.
 */

import Box from "@mui/material/Box";
import { NOIR } from "@/shared/theme/palette";
import { DriftWall } from "./DriftWall";
import { HERO_WALL_TILES } from "./heroWallTiles";

interface HeroImageWallProps {
  /** Freeze the drift and stop its rAF loop. True whenever the wall is not on screen. */
  paused: boolean;
}

export function HeroImageWall({ paused }: HeroImageWallProps) {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        zIndex: 2,
        overflow: "hidden",
        pointerEvents: "none",
        // See the backplate note in the header.
        bgcolor: NOIR.navyDeep,
        // The entrance, for free. `--hp-g` is the gunshot's own 0..1 progress, already
        // written every frame by `writeHeroVars`, so the wall fades in across phase 5
        // at exactly the rate `gunshotProgress()` defines — no second timeline, no JS.
        // (The panes this replaces had no entrance at all; they popped.)
        opacity: "var(--hp-g, 0)",
      }}
    >
      <DriftWall
        items={HERO_WALL_TILES}
        // A ceiling, not the value — DriftWall derives the real count from measured
        // width and floors it at 2, which is what caps the node budget on mobile.
        //
        // Five, not four: at four the yawed plane left a wedge of bare backplate down
        // the left edge, because the rotation pulls the near side of the wall away
        // from the frame. The fifth column covers it. `HERO_WALL_TILES` must stay a
        // multiple of this number — see the note there.
        columns={5}
        // 300x360 is not a taste call. Tile pitch sets `copyHeight`, and once
        // `copyHeight` clears the plane height two vertical repeats suffice instead of
        // three. Five per column x 384px = 1920px, just past the ~1908px plane at
        // 1080p and zoom 1.3: 50 tiles rather than 75, and the same 50 at every
        // smaller viewport. Retune this alongside `zoom`, never on its own.
        tileWidth={300}
        tileHeight={360}
        gap={24}
        radius={14}
        // Flat 2D layout without 3D tilt, turn, roll, perspective, or translateZ depth.
        tilt={0}
        turn={0}
        roll={0}
        perspective={0}
        depth={0}
        zoom={1.1}
        speed={26}
        direction="up"
        variance={0.35}
        fade={0.22}
        dim={0.55}
        grayscale={0.35}
        overlayColor={NOIR.navyDeep}
        paused={paused}
      />
    </Box>
  );
}
