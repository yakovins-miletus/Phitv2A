import { useCallback, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useReducedMotion, usePointerFine } from "@/shared/motion";

const SPRING = { stiffness: 350, damping: 28, mass: 0.5 };

interface MagneticProps {
  children: ReactNode;
  /** Fraction of the cursor→center offset applied (default 0.35). */
  strength?: number;
  /** Max translation in px (default 10). */
  maxOffset?: number;
  sx?: SxProps<Theme>;
}

function clamp(v: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, v));
}

function MagneticBase({
  children,
  strength = 0.35,
  maxOffset = 10,
  sx,
  hoverScale,
}: MagneticProps & { hoverScale?: number }) {
  const reduced = useReducedMotion();
  const pointerFine = usePointerFine();
  const [hovered, setHovered] = useState(false);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);
  const scale = useSpring(1, SPRING);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      rawX.set(clamp((e.clientX - cx) * strength, maxOffset));
      rawY.set(clamp((e.clientY - cy) * strength, maxOffset));
      if (hoverScale !== undefined) scale.set(hoverScale);
      setHovered(true);
    },
    [rawX, rawY, scale, strength, maxOffset, hoverScale],
  );

  const onPointerLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
    scale.set(1);
    setHovered(false);
  }, [rawX, rawY, scale]);

  if (reduced || !pointerFine) {
    return (
      <Box component="span" sx={{ display: "inline-block", ...(sx as object) }}>
        {children}
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ x, y, ...(hoverScale !== undefined ? { scale } : {}) }}
      sx={{
        display: "inline-block",
        willChange: hovered ? "transform" : "auto",
        ...(sx as object),
      }}
    >
      {children}
    </Box>
  );
}

/** Magnetic hover: children drift toward the cursor, spring back on leave. */
export function Magnetic(props: MagneticProps) {
  return <MagneticBase {...props} />;
}

/** Primary-CTA variant: magnetic drift plus a 1.02 scale while hovered. */
export function MagneticGold(props: MagneticProps) {
  return <MagneticBase {...props} hoverScale={1.02} />;
}
