import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Box from "@mui/material/Box";

import { usePointerFine } from "@/shared/motion";
import {
  LIQUID_INSET_X_DEFAULT,
  LIQUID_INSET_Y_DEFAULT,
  clampInsetX,
  clampInsetY,
} from "@/shared/motion/liquidNavbar";
import { NOIR } from "@/shared/theme/palette";

const RESET_DURATION_MS = 350;

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export interface LiquidInset {
  insetX: number;
  insetY: number;
}

/** Liquid Mode's spacing state: dragging the single corner handle pushes the
    navbar's horizontal inset (space from the left/right viewport edges) and
    vertical inset (space above the bar, from the top edge) further out. */
export function useLiquidSpacing() {
  const [insetX, setInsetX] = useState(LIQUID_INSET_X_DEFAULT);
  const [insetY, setInsetY] = useState(LIQUID_INSET_Y_DEFAULT);
  const resetFrameRef = useRef<number | null>(null);
  const currentRef = useRef({ insetX, insetY });
  currentRef.current = { insetX, insetY };

  const setInset = useCallback((next: LiquidInset) => {
    setInsetX(next.insetX);
    setInsetY(next.insetY);
  }, []);

  const reset = useCallback((animated: boolean) => {
    if (resetFrameRef.current !== null) {
      cancelAnimationFrame(resetFrameRef.current);
      resetFrameRef.current = null;
    }
    if (!animated) {
      setInsetX(LIQUID_INSET_X_DEFAULT);
      setInsetY(LIQUID_INSET_Y_DEFAULT);
      return;
    }
    const start = performance.now();
    const from = currentRef.current;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / RESET_DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      setInsetX(lerp(from.insetX, LIQUID_INSET_X_DEFAULT, eased));
      setInsetY(lerp(from.insetY, LIQUID_INSET_Y_DEFAULT, eased));
      if (t < 1) {
        resetFrameRef.current = requestAnimationFrame(tick);
      } else {
        resetFrameRef.current = null;
      }
    };
    resetFrameRef.current = requestAnimationFrame(tick);
  }, []);

  return { insetX, insetY, setInset, reset };
}

function DragHandle({ insetX, insetY, onChange }: LiquidInset & { onChange: (v: LiquidInset) => void }) {
  const dragState = useRef<{ startX: number; startY: number; startInsetX: number; startInsetY: number } | null>(null);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = { startX: e.clientX, startY: e.clientY, startInsetX: insetX, startInsetY: insetY };
    },
    [insetX, insetY],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragState.current;
      if (!drag) return;
      // Dragging outward (down-right) extends both the horizontal and
      // vertical space; dragging back in (up-left) shrinks it again.
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      onChange({
        insetX: clampInsetX(drag.startInsetX + dx),
        insetY: clampInsetY(drag.startInsetY + dy),
      });
    },
    [onChange],
  );

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragState.current = null;
  }, []);

  return (
    <Box
      role="slider"
      aria-label="Drag to extend navbar spacing"
      aria-valuenow={insetX}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      sx={{
        position: "absolute",
        bottom: -6,
        right: -6,
        width: 12,
        height: 12,
        borderRadius: "50%",
        bgcolor: NOIR.gold,
        border: `2px solid ${NOIR.void}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
        cursor: "nwse-resize",
        touchAction: "none",
        zIndex: 2,
        transition: "transform 0.15s ease",
        "&:hover, &:active": { transform: "scale(1.3)" },
      }}
    />
  );
}

/** Renders the single draggable handle for Liquid Mode. Only shown on fine
    pointers — touch devices keep whatever spacing is already set. */
export function LiquidNavHandle({ insetX, insetY, onChange }: LiquidInset & { onChange: (v: LiquidInset) => void }) {
  const pointerFine = usePointerFine();
  if (!pointerFine) return null;
  return <DragHandle insetX={insetX} insetY={insetY} onChange={onChange} />;
}
