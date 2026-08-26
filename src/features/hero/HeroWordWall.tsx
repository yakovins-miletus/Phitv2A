/**
 * The hero's word drift wall, replacing the photo tiles.
 *
 * Everything hero-specific lives here so the animation mechanism stays decoupled.
 * The layer's position in the z-stack, the navy backplate, the scroll-driven entrance,
 * and the tuned props are configured here. It is the `React.lazy` target.
 *
 * ── Implementation ──────────────────────────────────────────────────────────────
 *
 * A difference-blend approach was investigated to preserve the flanking headline
 * text visibility against the navy gunshot wash, but `mixBlendMode: "difference"`
 * was found to exist only in comments throughout the codebase (HeroImageWall.tsx,
 * SuperHeroSequence.tsx, driftWall.css), never as applied CSS. The words render
 * in muted grey-blue tones against the navy backplate using plain, conventional
 * lighting with no blend mode, achieving clear legibility.
 *
 * ── Why velocity-aware scrolling ────────────────────────────────────────────────
 *
 * Reuses PoweredBySection's mechanism: `useVelocity(scrollY)` + `useAnimationFrame`
 * for velocity-aware marquee columns. Each column drifts at a base speed, multiplied
 * by the page scroll velocity. Respect the pause/rAF contract: stops when paused,
 * reduced-motion is on, or the tab is hidden. Do not create a third scroll-linked loop.
 */

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import {
  useAnimationFrame,
  useScroll,
  useSpring,
  useVelocity,
} from "motion/react";
import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";
import {
  HERO_TECH_COLUMN_1,
  HERO_TECH_COLUMN_2,
  HERO_TECH_COLUMN_3,
} from "@/shared/content/techStack";

/**
 * "Powered by" tech-stack names for the three drift columns, curated from
 * the same source of truth as PoweredBySection (`@/shared/content/techStack`)
 * so the hero and the /about section never drift out of sync. Rendered as
 * plain text — no logos — because this layer sits in the LCP-critical hero
 * path and PoweredBySection's icons are ~70 cross-origin Simple Icons CDN
 * requests, which is not acceptable this early in the page lifecycle. See
 * this file's top docblock for the full network-request rationale.
 */
const WORD_COLUMN_1 = HERO_TECH_COLUMN_1;
const WORD_COLUMN_2 = HERO_TECH_COLUMN_2;
const WORD_COLUMN_3 = HERO_TECH_COLUMN_3;

interface HeroWordWallProps {
  /** Freeze the drift and stop its rAF loop. True whenever the wall is not on screen. */
  paused: boolean;
}

function WordColumn({
  words,
  basePPS,
  reverse,
  shouldAnimate,
}: {
  words: string[];
  basePPS: number;
  reverse: boolean;
  shouldAnimate: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const [isHidden, setIsHidden] = useState(document.hidden);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothedVelocity = useSpring(scrollVelocity, {
    damping: 40,
    stiffness: 300,
  });

  // Track document visibility
  useEffect(() => {
    const onVisibility = () => {
      setIsHidden(document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useAnimationFrame((_, delta) => {
    if (!containerRef.current || !shouldAnimate || isHidden) return;

    const speedMultiplier = 1 + Math.abs(smoothedVelocity.get()) / 800;
    const step =
      ((basePPS * speedMultiplier * delta) / 1000) * (reverse ? -1 : 1);
    offsetRef.current += step;

    const scrollHeight = containerRef.current.scrollHeight / 2;
    if (offsetRef.current > scrollHeight) {
      offsetRef.current -= scrollHeight;
    }
    if (offsetRef.current < -scrollHeight) {
      offsetRef.current += scrollHeight;
    }
    containerRef.current.style.transform = `translateY(${offsetRef.current}px)`;
  });

  const doubledWords = [...words, ...words];

  return (
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        willChange: "transform",
        minHeight: "200%",
      }}
    >
      {doubledWords.map((word, idx) => (
        <Box
          key={`${word}-${idx}`}
          sx={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
            textTransform: "uppercase",
            // Light white for conventional contrast against the navy backplate
            color: NOIR.white,
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            opacity: 0.8,
          }}
        >
          {word}
        </Box>
      ))}
    </Box>
  );
}

export function HeroWordWall({ paused }: HeroWordWallProps) {
  const reduced = useReducedMotion();
  const shouldAnimate = !paused && !reduced;

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
        // Navy backplate to prevent white corners during the gunshot phase — see
        // HeroImageWall.tsx's docblock for why the corners matter, even though this
        // layer no longer depends on any blend-mode maths.
        bgcolor: NOIR.navyDeep,
        // Entrance: the wall fades in across phase 5 at exactly the rate gunshotProgress()
        // defines, driven by --hp-g (see HeroImageWall for the same pattern).
        opacity: "var(--hp-g, 0)",
        // Three-column grid: equal-width columns that scroll independently at different speeds
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: { xs: 2, md: 4 },
        px: { xs: 2, md: 4 },
        py: 4,
      }}
    >
      {/* Column 1: medium speed, normal direction */}
      <Box
        sx={{
          overflow: "hidden",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <WordColumn
          words={WORD_COLUMN_1}
          basePPS={22}
          reverse={false}
          shouldAnimate={shouldAnimate}
        />
      </Box>

      {/* Column 2: fast speed, reversed direction (like PoweredBySection row 2) */}
      <Box
        sx={{
          overflow: "hidden",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <WordColumn
          words={WORD_COLUMN_2}
          basePPS={28}
          reverse={true}
          shouldAnimate={shouldAnimate}
        />
      </Box>

      {/* Column 3: slow speed, normal direction */}
      <Box
        sx={{
          overflow: "hidden",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <WordColumn
          words={WORD_COLUMN_3}
          basePPS={25}
          reverse={false}
          shouldAnimate={shouldAnimate}
        />
      </Box>
    </Box>
  );
}
