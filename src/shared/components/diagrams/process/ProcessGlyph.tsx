import { useRef } from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";

import { NOIR } from "@/shared/theme/palette";
import { usePointerFine } from "@/shared/motion";

const TILT = 6;
const VIEW = 120;
const HAIR = `rgba(${NOIR.frostRgb}, 0.34)`;
const GHOST = `rgba(${NOIR.frostRgb}, 0.13)`;

interface StrokeProps {
  d: string;
  draw: MotionValue<number>;
  reduced: boolean;
  color?: string;
  width?: number;
  delay?: number;
}

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
      strokeLinecap="square"
      strokeLinejoin="miter"
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
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="square"
        strokeLinejoin="miter"
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

function Dot(props: DotProps) {
  return props.reduced ? <StaticDot {...props} /> : <DrawnDot {...props} />;
}

function StaticDot({ cx, cy, r = 2.5, color = NOIR.gold }: DotProps) {
  return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={color} />;
}

function DrawnDot({ cx, cy, r = 2.5, draw, color = NOIR.gold, at = 0.6 }: DotProps) {
  const scale = useTransform(draw, [at, Math.min(at + 0.25, 1)], [0, 1]);

  return (
    <>
      <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={GHOST} />
      <motion.rect
        x={cx - r}
        y={cy - r}
        width={r * 2}
        height={r * 2}
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

/** 01 · Discover / Blueprint Reticle */
function DiscoverGlyph({ draw, reduced }: GlyphProps) {
  return (
    <>
      <Stroke d="M10 34 V10 H34" draw={draw} reduced={reduced} />
      <Stroke d="M86 10 H110 V34" draw={draw} reduced={reduced} delay={0.06} />
      <Stroke d="M110 86 V110 H86" draw={draw} reduced={reduced} delay={0.12} />
      <Stroke d="M34 110 H10 V86" draw={draw} reduced={reduced} delay={0.18} />
      <Stroke d="M60 20 V100" draw={draw} reduced={reduced} color={HAIR} width={0.75} delay={0.24} />
      <Stroke d="M20 60 H100" draw={draw} reduced={reduced} color={HAIR} width={0.75} delay={0.24} />
      <Stroke d="M45 45 H75 V75 H45 Z" draw={draw} reduced={reduced} color={HAIR} width={0.75} delay={0.3} />
      <Dot cx={45} cy={45} r={2} draw={draw} reduced={reduced} color={HAIR} at={0.5} />
      <Dot cx={75} cy={75} r={2} draw={draw} reduced={reduced} color={HAIR} at={0.56} />
      <Dot cx={60} cy={60} r={3.5} draw={draw} reduced={reduced} at={0.72} />
    </>
  );
}

/** 02 · Research / Simulation Fit */
function ResearchGlyph({ draw, reduced }: GlyphProps) {
  return (
    <>
      <Stroke d="M16 104 H108" draw={draw} reduced={reduced} color={HAIR} width={1} />
      <Stroke d="M16 104 V16" draw={draw} reduced={reduced} color={HAIR} width={1} delay={0.05} />
      <Stroke d="M16 80 H108" draw={draw} reduced={reduced} color={HAIR} width={0.75} delay={0.1} />
      <Stroke d="M16 56 H108" draw={draw} reduced={reduced} color={HAIR} width={0.75} delay={0.13} />
      <Stroke d="M16 32 H108" draw={draw} reduced={reduced} color={HAIR} width={0.75} delay={0.16} />
      <Stroke
        d="M20 96 C 44 86, 58 58, 76 46 S 94 28, 106 22"
        draw={draw}
        reduced={reduced}
        width={1.75}
        delay={0.22}
      />
      <Dot cx={28} cy={94} r={2} draw={draw} reduced={reduced} color={HAIR} at={0.55} />
      <Dot cx={46} cy={78} r={2} draw={draw} reduced={reduced} color={HAIR} at={0.6} />
      <Dot cx={62} cy={64} r={2} draw={draw} reduced={reduced} color={HAIR} at={0.65} />
      <Dot cx={82} cy={38} r={2} draw={draw} reduced={reduced} color={HAIR} at={0.7} />
      <Dot cx={98} cy={26} r={2} draw={draw} reduced={reduced} color={HAIR} at={0.75} />
    </>
  );
}

/** 03 · Build / Hardened System Bus */
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
      <Dot cx={60} cy={48} r={2} draw={draw} reduced={reduced} at={0.5} />
      <Dot cx={60} cy={80} r={2} draw={draw} reduced={reduced} at={0.55} />
    </>
  );
}

/** 04 · Operate / Live Chronograph Radar */
function OperateGlyph({ draw, reduced }: GlyphProps) {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const inner = 42;
    const outer = i % 3 === 0 ? 30 : 36;
    return `M${(60 + Math.cos(angle) * inner).toFixed(1)} ${(60 + Math.sin(angle) * inner).toFixed(1)} L${(60 + Math.cos(angle) * outer).toFixed(1)} ${(60 + Math.sin(angle) * outer).toFixed(1)}`;
  }).join(" ");

  return (
    <>
      <Stroke d="M60 12 A48 48 0 1 1 59.9 12" draw={draw} reduced={reduced} width={1.5} />
      <Stroke d={ticks} draw={draw} reduced={reduced} color={HAIR} width={1} delay={0.2} />
      <Stroke
        d="M24 60 H40 L46 42 L54 80 L62 52 L68 60 H96"
        draw={draw}
        reduced={reduced}
        width={1.75}
        delay={0.3}
      />
      <Dot cx={96} cy={60} r={3.5} draw={draw} reduced={reduced} color={NOIR.live} at={0.8} />
    </>
  );
}

const GLYPHS: Record<number, (props: GlyphProps) => ReactNode> = {
  1: DiscoverGlyph,
  2: ResearchGlyph,
  3: BuildGlyph,
  4: OperateGlyph,
};

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
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
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
        maxWidth: 240,
        display: "flex",
        justifyContent: "center",
        p: 2,
        bgcolor: `rgba(${NOIR.navyInkRgb}, 0.6)`,
        border: `1px solid rgba(${NOIR.frostRgb}, 0.12)`,
        borderRadius: 0,
      }}
    >
      <motion.div
        style={{
          width: "100%",
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
