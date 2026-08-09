import { useRef } from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";

import { NOIR } from "@/shared/theme/palette";
import { usePointerFine } from "@/shared/motion";

/**
 * The schematic that sits opposite each phase.
 *
 * These are drawn, not picked. An icon set would have given this section four
 * rounded-square pictograms — a magnifying glass, a flask, a wrench, a gear —
 * which is the exact vocabulary every other process section on the internet
 * uses, and it would have made the page interchangeable with them. Each glyph
 * here is a small technical drawing of what the phase actually produces,
 * sharing the diagram's own language: hairline strokes, one gold accent, mono
 * geometry, no fills except the points that carry meaning.
 *
 * Two kinds of interaction, both already established elsewhere in this app:
 *
 *  - **Timeline.** Every stroke draws itself in off the node's `activation`
 *    value, so the drawing completes exactly as the payload arrives. It is the
 *    same MotionValue that lights the kicker and the connector — the glyph is
 *    part of the pipeline running, not an animation playing beside it.
 *  - **Pointer.** A small perspective tilt that tracks the cursor, gated on
 *    `usePointerFine()` per the motion inventory's rule that magnetic hovers
 *    exist only for precise pointers. There is no click target here and the
 *    tilt is capped low deliberately, so it reads as parallax rather than as
 *    an affordance promising something to press.
 *
 * Decorative throughout: the phase label and caption carry the meaning, so the
 * whole thing is `aria-hidden` and adds no focus stop.
 */

/** Max tilt in degrees. Past ~10 this starts to read as a button. */
const TILT = 7;
const VIEW = 120;

const HAIR = `rgba(${NOIR.frostRgb}, 0.34)`;

/**
 * The un-drawn state of every stroke.
 *
 * Without it a queued phase renders literally nothing — `pathLength: 0` is an
 * empty column, which is the emptiness this whole component exists to fill.
 * Every glyph is therefore always present as a faint wireframe, and activation
 * paints the real drawing over the top of it. "Not yet" should look like a
 * plan, not like a missing asset.
 */
const GHOST = `rgba(${NOIR.frostRgb}, 0.13)`;

interface StrokeProps {
  d: string;
  draw: MotionValue<number>;
  reduced: boolean;
  color?: string;
  width?: number;
  /** Fraction of the draw the stroke waits through, so parts land in order. */
  delay?: number;
}

/**
 * One stroke that draws itself in as `draw` runs 0 → 1.
 *
 * Split into two implementations rather than branching inside one, because
 * the four glyphs together declare around fifty of these and each drawn one
 * costs a MotionValue, a transform subscription and a second painted path.
 * Under reduced motion none of that can ever be observed — the drawing is
 * already complete — so it is not created at all. `reduced` is stable for the
 * life of the page, so swapping component identity on it is safe.
 */
function Stroke(props: StrokeProps) {
  return props.reduced ? <StaticStroke {...props} /> : <DrawnStroke {...props} />;
}

function StaticStroke({ d, color = NOIR.gold, width = 1.25 }: StrokeProps) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function DrawnStroke({ d, draw, color = NOIR.gold, width = 1.25, delay = 0 }: StrokeProps) {
  const pathLength = useTransform(draw, [delay, Math.min(delay + 0.7, 1)], [0, 1]);

  return (
    <>
      <path
        d={d}
        fill="none"
        stroke={GHOST}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pathLength }}
      />
    </>
  );
}

interface DotProps {
  cx: number;
  cy: number;
  r?: number;
  draw: MotionValue<number>;
  reduced: boolean;
  color?: string;
  at?: number;
}

/** A point that pops in once the drawing has reached it. Split for the same
 *  reason as Stroke — see the note there. */
function Dot(props: DotProps) {
  return props.reduced ? <StaticDot {...props} /> : <DrawnDot {...props} />;
}

function StaticDot({ cx, cy, r = 2.5, color = NOIR.gold }: DotProps) {
  return <circle cx={cx} cy={cy} r={r} fill={color} />;
}

function DrawnDot({ cx, cy, r = 2.5, draw, color = NOIR.gold, at = 0.6 }: DotProps) {
  const scale = useTransform(draw, [at, Math.min(at + 0.25, 1)], [0, 1]);

  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={GHOST} />
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        style={{ scale, transformOrigin: `${cx}px ${cy}px` }}
      />
    </>
  );
}

interface GlyphProps {
  draw: MotionValue<number>;
  reduced: boolean;
}

/** 01 · Discover — a reticle closing on the part of the mess that matters. */
function DiscoverGlyph({ draw, reduced }: GlyphProps) {
  return (
    <>
      <Stroke d="M10 34 V10 H34" draw={draw} reduced={reduced} />
      <Stroke d="M86 10 H110 V34" draw={draw} reduced={reduced} delay={0.06} />
      <Stroke d="M110 86 V110 H86" draw={draw} reduced={reduced} delay={0.12} />
      <Stroke d="M34 110 H10 V86" draw={draw} reduced={reduced} delay={0.18} />
      <Stroke d="M60 40 V80" draw={draw} reduced={reduced} color={HAIR} width={1} delay={0.24} />
      <Stroke d="M40 60 H80" draw={draw} reduced={reduced} color={HAIR} width={1} delay={0.24} />
      <Dot cx={44} cy={48} r={2} draw={draw} reduced={reduced} color={HAIR} at={0.5} />
      <Dot cx={76} cy={72} r={2} draw={draw} reduced={reduced} color={HAIR} at={0.56} />
      <Dot cx={48} cy={74} r={2} draw={draw} reduced={reduced} color={HAIR} at={0.62} />
      {/* The one that turned out to be the problem. */}
      <Dot cx={70} cy={46} r={3.5} draw={draw} reduced={reduced} at={0.72} />
    </>
  );
}

/** 02 · Research — a fit pulled through real, scattered observations. */
function ResearchGlyph({ draw, reduced }: GlyphProps) {
  return (
    <>
      <Stroke d="M20 104 H108" draw={draw} reduced={reduced} color={HAIR} width={1} />
      <Stroke d="M20 104 V16" draw={draw} reduced={reduced} color={HAIR} width={1} delay={0.05} />
      <Stroke d="M20 82 H108" draw={draw} reduced={reduced} color={HAIR} width={0.75} delay={0.1} />
      <Stroke d="M20 56 H108" draw={draw} reduced={reduced} color={HAIR} width={0.75} delay={0.13} />
      <Stroke d="M20 30 H108" draw={draw} reduced={reduced} color={HAIR} width={0.75} delay={0.16} />
      <Stroke
        d="M24 94 C 48 84, 62 56, 78 44 S 96 28, 106 24"
        draw={draw}
        reduced={reduced}
        width={1.75}
        delay={0.22}
      />
      <Dot cx={32} cy={96} r={2.25} draw={draw} reduced={reduced} color={HAIR} at={0.55} />
      <Dot cx={48} cy={78} r={2.25} draw={draw} reduced={reduced} color={HAIR} at={0.6} />
      <Dot cx={62} cy={66} r={2.25} draw={draw} reduced={reduced} color={HAIR} at={0.65} />
      <Dot cx={80} cy={38} r={2.25} draw={draw} reduced={reduced} color={HAIR} at={0.7} />
      <Dot cx={98} cy={30} r={2.25} draw={draw} reduced={reduced} color={HAIR} at={0.75} />
    </>
  );
}

/** 03 · Build — one system assembled from parts that know about each other. */
function BuildGlyph({ draw, reduced }: GlyphProps) {
  return (
    <>
      <Stroke d="M46 12 H74 V32 H46 Z" draw={draw} reduced={reduced} />
      <Stroke d="M60 32 V48" draw={draw} reduced={reduced} color={HAIR} width={1} delay={0.12} />
      <Stroke d="M26 48 H94" draw={draw} reduced={reduced} color={HAIR} width={1} delay={0.16} />
      <Stroke d="M26 48 V60" draw={draw} reduced={reduced} color={HAIR} width={1} delay={0.2} />
      <Stroke d="M94 48 V60" draw={draw} reduced={reduced} color={HAIR} width={1} delay={0.2} />
      <Stroke d="M12 60 H40 V80 H12 Z" draw={draw} reduced={reduced} delay={0.26} />
      <Stroke d="M80 60 H108 V80 H80 Z" draw={draw} reduced={reduced} delay={0.3} />
      <Stroke d="M26 80 V92 H94 V80" draw={draw} reduced={reduced} color={HAIR} width={1} delay={0.36} />
      <Stroke d="M46 92 H74 V112 H46 Z" draw={draw} reduced={reduced} delay={0.42} />
    </>
  );
}

/** 04 · Operate — a full clock, and a trace that never goes flat. */
function OperateGlyph({ draw, reduced }: GlyphProps) {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const inner = 40;
    const outer = i % 3 === 0 ? 30 : 34;
    return `M${(60 + Math.cos(angle) * inner).toFixed(1)} ${(60 + Math.sin(angle) * inner).toFixed(1)} L${(60 + Math.cos(angle) * outer).toFixed(1)} ${(60 + Math.sin(angle) * outer).toFixed(1)}`;
  }).join(" ");

  return (
    <>
      <Stroke
        d="M60 12 A48 48 0 1 1 59.9 12"
        draw={draw}
        reduced={reduced}
        width={1.5}
      />
      <Stroke d={ticks} draw={draw} reduced={reduced} color={HAIR} width={1} delay={0.2} />
      <Stroke
        d="M24 60 H40 L46 42 L54 80 L62 52 L68 60 H96"
        draw={draw}
        reduced={reduced}
        width={1.75}
        delay={0.3}
      />
      {/* Status indicator, not text — the one sanctioned use of `live`. */}
      <Dot cx={96} cy={60} r={3.5} draw={draw} reduced={reduced} color={NOIR.live} at={0.8} />
    </>
  );
}

/** Middles only. The endpoints already carry the payload well and the ship
 *  plate; a glyph there would compete with them for the same attention. */
const GLYPHS: Record<number, (props: GlyphProps) => ReactNode> = {
  1: DiscoverGlyph,
  2: ResearchGlyph,
  3: BuildGlyph,
  4: OperateGlyph,
};

/**
 * The field behind phase 00.
 *
 * "Ideas" is a centred endpoint, so unlike the middles it has no opposite
 * column to put a schematic in — and the band around it was the emptiest part
 * of the section. Rather than invent a sixth icon to sit beside display type
 * that is already the loudest thing on screen, the phase gets its own caption
 * rendered literally: raw potential, unsorted, most of it never going anywhere.
 *
 * Deterministic by construction (a fixed LCG, evaluated once at module scope)
 * so the field is identical on every render and every reload — a `Math.random`
 * here would reshuffle on each hydration and shimmer.
 */
const FIELD = (() => {
  let seed = 0x5eed;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: 44 }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    r: 0.6 + rand() * 1.6,
    // A few carry the gold. Any more and it stops reading as noise-with-signal
    // and starts reading as a pattern nobody chose.
    lit: rand() > 0.86,
  }));
})();

export function IdeaField({
  activation,
  reduced,
}: {
  activation: MotionValue<number>;
  reduced: boolean;
}) {
  const opacity = useTransform(activation, [0, 1], [0.45, 1]);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "absolute",
        inset: { xs: "-8% -4%", md: "-14% 0" },
        zIndex: -1,
        pointerEvents: "none",
      }}
    >
      {/* Positioned elements rather than an SVG: the field has to stretch to
          whatever the phase's box happens to be, and an SVG stretched to a
          non-square ratio turns every circle into an ellipse.

          Plain divs with inline styles, not `Box`/`sx` — forty-four unique sx
          objects mean forty-four emotion serialisations and class insertions
          per render, which measurably slowed the whole home-page test suite
          down. Nothing here needs the theme or a breakpoint. */}
      <motion.div
        style={{ position: "relative", width: "100%", height: "100%", ...(reduced ? {} : { opacity }) }}
      >
        {FIELD.map((dot) => (
          <div
            key={`${dot.x}-${dot.y}`}
            style={{
              position: "absolute",
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: `${dot.r * 2}px`,
              height: `${dot.r * 2}px`,
              borderRadius: "50%",
              background: dot.lit ? NOIR.gold : GHOST,
            }}
          />
        ))}
      </motion.div>
    </Box>
  );
}

interface ProcessGlyphProps {
  index: number;
  /** 0 → 1 as the payload approaches this node. Drives the draw-on. */
  activation: MotionValue<number>;
  reduced: boolean;
}

export function ProcessGlyph({ index, activation, reduced }: ProcessGlyphProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = usePointerFine();
  const interactive = fine && !reduced;

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-TILT, TILT]), {
    stiffness: 220,
    damping: 22,
  });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [TILT, -TILT]), {
    stiffness: 220,
    damping: 22,
  });

  // The ghost carries the un-drawn state now, so this only has to keep a
  // queued glyph from competing with the phase the reader is actually on.
  const opacity = useTransform(activation, [0, 1], [0.6, 1]);

  const Glyph = GLYPHS[index];
  if (!Glyph) return null;

  const track = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    px.set((event.clientX - box.left) / box.width - 0.5);
    py.set((event.clientY - box.top) / box.height - 0.5);
  };

  const release = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <Box
      ref={ref}
      aria-hidden="true"
      onPointerMove={track}
      onPointerLeave={release}
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        // Carried here rather than on the wrapper in ProcessNode so a phase
        // with no drawing contributes no space at all.
        mb: { xs: 3, md: 0 },
      }}
    >
      <motion.div
        style={{
          width: "100%",
          maxWidth: 264,
          transformPerspective: 700,
          ...(interactive ? { rotateX, rotateY } : {}),
          ...(reduced ? {} : { opacity }),
        }}
      >
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} width="100%" height="100%" aria-hidden="true">
          <Glyph draw={activation} reduced={reduced} />
        </svg>
      </motion.div>
    </Box>
  );
}
