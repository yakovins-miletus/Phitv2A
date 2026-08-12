/**
 * Cloud plates as scroll-parallax props, layered over a section.
 *
 * Absolutely-positioned `<img>`s, each carrying the exact intrinsic size from
 * `cloudPlates.ts` (no CLS: the browser reserves the box before the WebP
 * decodes) and a scroll-linked `translateY` — transform only, never a
 * layout-affecting property, per the same discipline `heroVars.ts` documents
 * for the hero's own scroll driver. The travel comes from `useScroll` +
 * `useTransform` (`motion/react`, already a dependency elsewhere in this
 * repo), which are motion values: they write directly to the DOM node's own
 * style on scroll and never touch React state, so scrolling this section
 * causes zero re-renders, the same property the hero's pin driver rests on.
 *
 * Bails to a static layout — plates present, no transform at all — under
 * `useReducedMotion()`, and to a single plate under `useIsLowPowerDevice()`
 * rather than the full set, matching the hero playground's own low-power
 * guardrail (`PlaygroundCanvas.tsx` skips the star field the same way).
 */

import { useRef } from "react";
import Box from "@mui/material/Box";
import { motion, useScroll, useTransform } from "motion/react";

import { useIsLowPowerDevice, useReducedMotion } from "@/shared/motion";
import { CLOUD_PLATES, type CloudPlate } from "./cloudPlates";

/** Max vertical travel, in px, for the nearest plate (depth 1). Scaled down
 *  per-plate by its own `depth` — this is a prop layer, not the hero's own
 *  parallax, so the motion stays subtle. */
const MAX_TRAVEL = 120;

interface PlateLayerProps {
  plate: CloudPlate;
  /** Horizontal placement, 0..1 across the container — spreads the set out
   *  rather than stacking every plate at the same spot. */
  left: number;
  top: number;
  containerRef: React.RefObject<HTMLElement | null>;
  reduced: boolean;
}

function PlateLayer({ plate, left, top, containerRef, reduced }: PlateLayerProps) {
  const { scrollYProgress } = useScroll({
    target: containerRef as React.RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-MAX_TRAVEL * plate.depth, MAX_TRAVEL * plate.depth]);

  const commonStyle = {
    position: "absolute" as const,
    left: `${left * 100}%`,
    top: `${top * 100}%`,
    width: `min(${plate.width}px, 42vw)`,
    height: "auto",
    pointerEvents: "none" as const,
    userSelect: "none" as const,
  };

  if (reduced) {
    return (
      <img
        src={plate.src1280}
        srcSet={`${plate.src640} 640w, ${plate.src1280} 1280w`}
        sizes="(max-width: 768px) 60vw, 42vw"
        width={plate.width}
        height={plate.height}
        alt=""
        loading="lazy"
        decoding="async"
        style={commonStyle}
      />
    );
  }

  return (
    <motion.img
      src={plate.src1280}
      srcSet={`${plate.src640} 640w, ${plate.src1280} 1280w`}
      sizes="(max-width: 768px) 60vw, 42vw"
      width={plate.width}
      height={plate.height}
      alt=""
      loading="lazy"
      decoding="async"
      style={{ ...commonStyle, y, willChange: "transform" }}
    />
  );
}

/** Fixed, hand-placed layout for the six extracted plates — spread across the
 *  width and staggered in depth rather than a grid, so the set reads as
 *  scattered vapour rather than a tiled pattern. */
const LAYOUT: ReadonlyArray<{ left: number; top: number }> = [
  { left: 0.02, top: 0.06 },
  { left: 0.62, top: 0.02 },
  { left: 0.28, top: 0.32 },
  { left: 0.7, top: 0.4 },
  { left: 0.05, top: 0.58 },
  { left: 0.55, top: 0.66 },
];

export function CloudProps() {
  const reduced = useReducedMotion() === true;
  const lowPower = useIsLowPowerDevice();
  const containerRef = useRef<HTMLElement>(null);

  // Low-power tier: one plate instead of six, matching the hero playground's
  // own low-power guardrail for the night sky's star field.
  const plates = lowPower ? CLOUD_PLATES.slice(0, 1) : CLOUD_PLATES;

  return (
    <Box
      ref={containerRef}
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        // Negative, not 0: the parent overlay sheet is itself a positioned
        // stacking context (`zIndex: 2` in `routes/index.tsx`), so a negative
        // value here stays inside that context and paints behind the
        // sheet's own non-positioned content instead of leaking above it.
        zIndex: -1,
      }}
    >
      {plates.map((plate, i) => (
        <PlateLayer
          key={plate.id}
          plate={plate}
          left={LAYOUT[i % LAYOUT.length]!.left}
          top={LAYOUT[i % LAYOUT.length]!.top}
          containerRef={containerRef}
          reduced={reduced}
        />
      ))}
    </Box>
  );
}
