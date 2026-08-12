/**
 * ParallaxHeroBg — Three-layer spatial parallax from a single image.
 *
 * Decomposes `hero-sky-bg.jpg` (night sky with clouds, stars, two golden
 * crescents) into three virtual depth planes using CSS masking:
 *
 *   1. **Background** (deepest): Full image — deep sky and stars.
 *      Moves at 30% of cursor speed, scaled 1.06× for bleed room.
 *   2. **Middleground**: The cloud band and crescents, isolated via a
 *      vertical gradient mask. Moves at 60% of cursor speed.
 *   3. **Foreground** (closest): Atmospheric vignette haze with a subtle
 *      radial gradient. Moves at 100% of cursor speed.
 *
 * All transforms are driven by a ref-based `requestAnimationFrame` loop
 * that writes directly to `element.style.transform` — zero React re-renders.
 *
 * The component is a pure presentation layer. It accepts `settle` (entrance
 * fade 0→1) and integrates with the hero's `--hp-panel` CSS variable for
 * scroll-driven opacity.
 */

import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";

const BG_SRC = "/images/hero-sky-bg.jpg";

/** Parallax multipliers — how much each layer moves relative to the cursor. */
const PARALLAX = { bg: 0.3, mid: 0.6, fg: 1.0 } as const;
/** Maximum pixel offset at the edges of the viewport. */
const MAX_OFFSET = 24;

export function ParallaxHeroBg({ ready }: { ready: boolean }) {
  const bgRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2; // -1..1
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    let raf: number;
    const tick = () => {
      const cur = current.current;
      const tgt = target.current;
      cur.x += (tgt.x - cur.x) * 0.06;
      cur.y += (tgt.y - cur.y) * 0.06;

      const bg = bgRef.current;
      const mid = midRef.current;
      const fg = fgRef.current;

      if (bg) {
        const ox = -cur.x * MAX_OFFSET * PARALLAX.bg;
        const oy = -cur.y * MAX_OFFSET * PARALLAX.bg;
        bg.style.transform = `translate3d(${ox}px, ${oy}px, 0) scale(1.06)`;
      }
      if (mid) {
        const ox = -cur.x * MAX_OFFSET * PARALLAX.mid;
        const oy = -cur.y * MAX_OFFSET * PARALLAX.mid;
        mid.style.transform = `translate3d(${ox}px, ${oy}px, 0) scale(1.08)`;
      }
      if (fg) {
        const ox = -cur.x * MAX_OFFSET * PARALLAX.fg;
        const oy = -cur.y * MAX_OFFSET * PARALLAX.fg;
        fg.style.transform = `translate3d(${ox}px, ${oy}px, 0) scale(1.12)`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  /** Shared base styles for every layer. */
  const layerBase = {
    position: "absolute" as const,
    inset: -30,
    width: "calc(100% + 60px)",
    height: "calc(100% + 60px)",
    backgroundImage: `url(${BG_SRC})`,
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    willChange: "transform",
    pointerEvents: "none" as const,
  };

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 2,
        overflow: "hidden",
        opacity: ready ? 1 : 0,
        transition: "opacity 0.8s ease-out",
      }}
    >
      {/* Layer 1 — Background: full sky + stars (deepest, slowest) */}
      <Box
        ref={bgRef}
        sx={{
          ...layerBase,
          zIndex: 0,
        }}
      />

      {/* Layer 2 — Middleground: cloud band + crescents (medium speed) */}
      <Box
        ref={midRef}
        sx={{
          ...layerBase,
          zIndex: 1,
          // Mask: only show bottom 55% (the cloud band), fading in from top
          maskImage:
            "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.4) 45%, black 60%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.4) 45%, black 60%)",
        }}
      />

      {/* Layer 3 — Foreground: atmospheric haze vignette (closest, fastest) */}
      <Box
        ref={fgRef}
        sx={{
          position: "absolute",
          inset: -30,
          width: "calc(100% + 60px)",
          height: "calc(100% + 60px)",
          zIndex: 2,
          willChange: "transform",
          pointerEvents: "none",
          // Radial vignette — dark edges, warm glow from bottom-right
          background:
            "radial-gradient(ellipse 80% 70% at 70% 55%, transparent 20%, rgba(8, 12, 30, 0.45) 70%, rgba(4, 6, 18, 0.8) 100%)",
        }}
      />
    </Box>
  );
}
