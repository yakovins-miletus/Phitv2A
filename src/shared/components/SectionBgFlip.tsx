import { useMemo, useRef } from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { useReducedMotion } from "@/shared/motion";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";

gsap.registerPlugin(ScrollTrigger);

type Variant = "blinds" | "pixels";

/** Fraction of the scroll range a single tile's own flip spans. Tiles
 *  overlap rather than firing on one shared instant, so the reveal reads as
 *  a cascade rather than a hard cut — the same "concentrate the change near
 *  the seam" idea `groundStops.ts` uses for the ground-layer blend. */
const WINDOW = 0.45;

/** power2.inOut, hand-rolled so this file doesn't need CustomEase registered
 *  for one curve. */
function ease(t: number): number {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
}

/** Deterministic shuffle so the `pixels` reveal order is stable across
 *  re-renders without persisting it anywhere. Not cryptographic — just
 *  enough to avoid reading as a boring row-by-row sweep. */
function shuffledOrder(n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = order[i];
    const b = order[j];
    if (a === undefined || b === undefined) continue;
    order[i] = b;
    order[j] = a;
  }
  return order;
}

interface SectionBgFlipProps {
  /** Content placed on the `to` ground, revealed as the tile layer clears. */
  children: ReactNode;
  /** `blinds` rotates full-width rows open like a Venetian blind lifting.
   *  `pixels` scales away a shuffled grid of squares — a dissolve instead of
   *  a sweep. One signature per page: pick one, not both, per section. */
  variant?: Variant;
  /** Colour the section opens on. Defaults to the light-theme page ground
   *  (`background.default`) so this reads as "white" on the pages that still
   *  run the light MUI theme. */
  from?: string;
  /** Colour revealed underneath. Defaults to the brand primary. */
  to?: string;
  /** Row count for `blinds`. */
  rows?: number;
  /** Grid size for `pixels`, as `[columns, rows]`. */
  grid?: [number, number];
  minHeight?: string;
}

/**
 * Scroll-scrubbed background flip.
 *
 * The section opens covered by a grid of `from`-coloured tiles; as the
 * reader scrolls through it, each tile flips (or dissolves) away in a
 * staggered cascade, revealing the `to` ground and its content underneath.
 *
 * Driven the way this codebase always drives continuous scroll values: one
 * GSAP `ScrollTrigger` scrub writing straight to each tile's own
 * `transform` every tick — no React state, no re-render (see
 * `SuperHeroSequence`'s `writeHeroVars` / `GroundLayer`'s `paint()` for the
 * same idiom). `transform` only, nothing that touches layout.
 *
 * Reduced motion renders no tile layer at all: the `to` ground and its
 * content are simply already there, which is also the no-JS/before-hydration
 * state — this is progressive enhancement, not a required animation.
 *
 * Not a replacement for `GroundLayer`'s home-page act-break wipe (that stays
 * exactly where it is, exactly once) — this is for the secondary, light-
 * themed pages that don't run the dark ground track.
 */
export function SectionBgFlip({
  children,
  variant = "blinds",
  from,
  to,
  rows = 10,
  grid = [10, 6],
  minHeight = "100dvh",
}: SectionBgFlipProps) {
  const theme = useTheme();
  const fromColor = from ?? theme.palette.background.default;
  const toColor = to ?? theme.palette.primary.main;

  const sectionRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = useReducedMotion();

  const count = variant === "blinds" ? rows : grid[0] * grid[1];
  const order = useMemo(
    () => (variant === "pixels" ? shuffledOrder(count) : Array.from({ length: count }, (_, i) => i)),
    [variant, count],
  );

  useGSAP(
    () => {
      if (reduced === true || !sectionRef.current) return;

      // Seed the covering state before the first measurement — if that first
      // measurement is wrong (see below) this is what the tiles show instead
      // of a nonsense "already revealed" pose.
      for (let i = 0; i < count; i++) {
        const tile = tilesRef.current[i];
        if (tile) tile.style.transform = variant === "blinds" ? "rotateX(0deg)" : "scale(1)";
      }

      const trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 90%",
        end: "bottom 35%",
        scrub: SCROLL_SPEED,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          for (let i = 0; i < count; i++) {
            const tile = tilesRef.current[i];
            if (!tile) continue;
            const orderIdx = order[i] ?? i;
            const start = (orderIdx / Math.max(1, count - 1)) * (1 - WINDOW);
            const local = ease((p - start) / WINDOW);
            tile.style.transform =
              variant === "blinds" ? `rotateX(${-90 * local}deg)` : `scale(${1 - local})`;
          }
        },
      });

      // This section sits far below a page's worth of content — images,
      // fonts, and other GSAP contexts (some with their own pins) that are
      // still resolving when this trigger takes its first measurement. That
      // first measurement can land wildly wrong (negative pixel offsets seen
      // in dev), the exact failure class `groundStops.ts`/`GroundLayer`
      // documents at length for the same reason. `ScrollTrigger`'s own
      // ResizeObserver-driven refresh usually corrects this, but not always
      // promptly enough to be the difference between "covered" and "already
      // open" on first paint — so force one more measurement a tick later,
      // once everything above has had a chance to settle.
      const settleId = requestAnimationFrame(() => trigger.refresh());

      return () => cancelAnimationFrame(settleId);
    },
    { scope: sectionRef, dependencies: [reduced, variant, count, order] },
  );

  const gridSx =
    variant === "blinds"
      ? { gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: "1fr" }
      : { gridTemplateColumns: `repeat(${grid[0]}, 1fr)`, gridTemplateRows: `repeat(${grid[1]}, 1fr)` };

  return (
    <Box ref={sectionRef} sx={{ position: "relative", minHeight, overflow: "hidden", bgcolor: toColor }}>
      <Box sx={{ position: "relative", zIndex: 1, minHeight, display: "flex", alignItems: "center" }}>
        {children}
      </Box>

      {reduced === true ? null : (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            display: "grid",
            pointerEvents: "none",
            perspective: variant === "blinds" ? "1400px" : undefined,
            ...gridSx,
          }}
        >
          {Array.from({ length: count }, (_, i) => (
            <Box
              key={i}
              ref={(el: HTMLDivElement | null) => {
                tilesRef.current[i] = el;
              }}
              sx={{
                bgcolor: fromColor,
                transformOrigin: variant === "blinds" ? "top center" : "center",
                backfaceVisibility: "hidden",
                willChange: "transform",
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
