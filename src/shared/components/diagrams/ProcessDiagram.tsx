import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { motion } from "motion/react";

import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";

/**
 * "From Problem To Production" — a *crucible*, not a conduit.
 *
 * ADR-0002 (docs/adr/0002-problem-to-production-metaphor.md) rejected the
 * vertical spine this file used to render. The reasoning, compressed:
 *
 *  - The section must occupy exactly ONE viewport. A six-beat scrubbed
 *    sequence had ~2vh of runway to play in; it could only ever feel twitchy.
 *  - `prefers-reduced-motion` must receive a *static* composition. A still
 *    frame has no time, so a metaphor that communicates *through time* — any
 *    step-by-step form — cannot carry the meaning at all. Motion is therefore
 *    enhancement only, and the still frame is the deliverable.
 *  - The semantics are not sequential anyway: MANY raw inputs (two of them
 *    named), ENCLOSED transformation inside a Phitopolis boundary, ONE output.
 *
 * The inversion pass disqualified four shapes outright and they are worth
 * naming so they don't get reintroduced: a converging-triangle funnel (the
 * most-copied diagram in the category), an orbit/particle swirl (reads as
 * generic AI hero art and carries no containment), a WebGL scene (the page
 * gets exactly one 3D moment and it is the closing node-field), and long
 * scrub choreography (violates the SCRUB POLICY in `beatThresholds.ts`).
 *
 * How the enclosure is expressed *materially* rather than as an outline: the
 * intake connectors are drawn on a layer BENEATH the vessel plate and run
 * several units past its left face, so the plate genuinely occludes them.
 * Inside is a different material — a lighter ground with its own finer grid
 * and a gold rim — not the same ground with a border around it.
 *
 * Two structurally different compositions, not one reflowed: horizontal
 * (field · vessel · artifact) at md+, vertical at xs, because containment is
 * the hard thing to read at 375px and a squeezed three-column layout loses it.
 */

export interface ProcessEntry {
  id: string;
  label: string;
  caption: string;
}

export interface ProcessModel {
  /** The named raw inputs — two among many. */
  intake: readonly ProcessEntry[];
  /** How many *unnamed* problems share the field with them. */
  rawCount: number;
  /** Operations that happen *inside* the Phitopolis boundary. */
  enclosed: readonly ProcessEntry[];
  /** The single refined artifact that leaves it. */
  output: ProcessEntry;
}

interface ProcessDiagramProps {
  model: ProcessModel;
}

/** Chamfered — deliberately not a rounded rectangle. */
const VESSEL_CLIP =
  "polygon(0 20px, 20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)";
const CHIP_CLIP = "polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)";

/**
 * The chamfered rim is a two-layer sandwich, not a border.
 *
 * `clip-path` clips an element's *own* rendering, inset box-shadow included, so
 * the first attempt — one box with `clipPath` plus `inset 0 0 0 1px` — drew a
 * rim that vanished along exactly the chamfered corners it was meant to
 * describe. A gold-filled outer box with 1px of padding, holding an identically
 * clipped navy inner box, produces a rim that follows the chamfer everywhere.
 */
const VESSEL_RIM_PAD = 1;

/**
 * Scatter for the unnamed problems, in the SVG layer's 0–100 space.
 *
 * Hand-placed, not generated: `Math.random()` at module scope would reshuffle
 * the composition on every reload and make visual regressions unreviewable.
 * Density rises toward the boundary — that gradient is what reads as "many"
 * at a glance, which is why the count is ~9 and not 40 (at 375px, 40 marks
 * are noise, per the ADR's legibility guard).
 */
const RAW_SCATTER_WIDE = [
  { x: 3, y: 21, r: 1.5 },
  { x: 9, y: 11, r: 1.1 },
  { x: 15, y: 29, r: 1.8 },
  { x: 4, y: 42, r: 1.2 },
  { x: 13, y: 53, r: 1.6 },
  { x: 3, y: 67, r: 1.3 },
  { x: 9, y: 80, r: 1.1 },
  { x: 17, y: 71, r: 1.7 },
  { x: 18, y: 47, r: 1.4 },
] as const;

const RAW_SCATTER_TALL = [
  { x: 12, y: 4, r: 1.6 },
  { x: 30, y: 9, r: 1.1 },
  { x: 50, y: 3, r: 1.9 },
  { x: 70, y: 8, r: 1.3 },
  { x: 88, y: 4, r: 1.5 },
  { x: 21, y: 14, r: 1.2 },
  { x: 60, y: 13, r: 1.7 },
  { x: 79, y: 14, r: 1.2 },
  { x: 40, y: 15, r: 1.4 },
] as const;

/** Where the wide composition's vessel intake face sits, in SVG space.
 *  `past` is deliberately beyond `x` so the plate occludes the line ends. */
const INTAKE_FACE = { wide: { x: 44, past: 52 } };

export function ProcessDiagram({ model }: ProcessDiagramProps) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up("md"));
  const reduced = useReducedMotion() === true;

  const scatter = wide ? RAW_SCATTER_WIDE : RAW_SCATTER_TALL;
  const raw = useMemo(() => scatter.slice(0, model.rawCount), [scatter, model.rawCount]);

  /**
   * Entrance-triggered, never scrub-linked (ADR-0002, inversion #6). Transform
   * and opacity only. `once: true` so the composition settles and stays — a
   * diagram that re-animates every time it re-enters reads as a loading state.
   */
  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.3 },
          transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  /** Copy blocks are shared by both compositions so the wording can't drift. */
  const entryCopy = (entry: ProcessEntry, opts: { accent?: boolean; big?: boolean } = {}) => (
    <>
      <Typography
        variant="h3"
        sx={{
          fontSize: opts.big ? { xs: "1.05rem", md: "1.2rem" } : { xs: "0.95rem", md: "1.05rem" },
          fontWeight: 700,
          color: opts.accent ? NOIR.gold : NOIR.frost,
        }}
      >
        {entry.label}
      </Typography>
      <Typography
        sx={{
          mt: 0.5,
          fontSize: "0.78rem",
          lineHeight: 1.4,
          color: `rgba(${NOIR.frostRgb}, 0.66)`,
        }}
      >
        {entry.caption}
      </Typography>
    </>
  );

  const fieldCount = (
    <Typography
      sx={{
        fontSize: "0.68rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: `rgba(${NOIR.frostRgb}, 0.42)`,
      }}
    >
      {model.rawCount}+ problems in the field
    </Typography>
  );

  /** Unnamed problems are DOM discs, not SVG circles: the connector layer below
   *  uses `preserveAspectRatio="none"` so its coordinate space tracks the
   *  container exactly, and that same distortion turns an SVG `<circle>` into
   *  a visible ellipse. Lines survive the stretch; round things do not. */
  const marks = (scale: number) =>
    raw.map((mark, i) => (
      <Box
        key={`mark-${mark.x}-${mark.y}`}
        component={motion.div}
        aria-hidden="true"
        {...(reduced
          ? {}
          : {
              initial: { opacity: 0 },
              whileInView: { opacity: 1 },
              viewport: { once: true, amount: 0.3 },
              transition: { duration: 0.4, delay: 0.04 * i },
            })}
        sx={{
          position: "absolute",
          left: `${mark.x}%`,
          top: `${mark.y}%`,
          width: mark.r * scale,
          height: mark.r * scale,
          ml: `${(-mark.r * scale) / 2}px`,
          mt: `${(-mark.r * scale) / 2}px`,
          borderRadius: "50%",
          bgcolor: `rgba(${NOIR.frostRgb}, ${0.18 + i * 0.03})`,
        }}
      />
    ));

  const vessel = (
    <Box
      component={motion.div}
      {...rise(0.26)}
      sx={{
        clipPath: VESSEL_CLIP,
        bgcolor: `rgba(${NOIR.goldRgb}, 0.45)`,
        p: `${VESSEL_RIM_PAD}px`,
        height: "100%",
        filter: "drop-shadow(0 24px 60px rgba(0,0,0,0.5))",
      }}
    >
    <Box
      sx={{
        clipPath: VESSEL_CLIP,
        // Materially a different ground from the slab outside it (navyField vs
        // navyDeep), carrying its own finer gold grid. Inside has to *look*
        // like a different place, not the same place with a line around it.
        bgcolor: NOIR.navyField,
        p: { xs: 2, md: 3 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: { xs: 1.75, md: 2.5 },
        height: "100%",
        backgroundImage: `
          linear-gradient(to right, rgba(${NOIR.goldRgb}, 0.07) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(${NOIR.goldRgb}, 0.07) 1px, transparent 1px)
        `,
        backgroundSize: "14px 14px",
      }}
    >
      <Typography
        sx={{
          fontSize: "0.68rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: `rgba(${NOIR.goldRgb}, 0.78)`,
        }}
      >
        Inside Phitopolis
      </Typography>
      {model.enclosed.map((entry, i) => (
        <Box key={entry.id} component={motion.div} {...rise(0.34 + i * 0.08)}>
          {entryCopy(entry, { big: true })}
        </Box>
      ))}
    </Box>
    </Box>
  );

  const outputChip = (
    <Box
      component={motion.div}
      {...rise(0.5)}
      sx={{
        clipPath: CHIP_CLIP,
        bgcolor: `rgba(${NOIR.goldRgb}, 0.6)`,
        p: `${VESSEL_RIM_PAD}px`,
      }}
    >
      <Box sx={{ clipPath: CHIP_CLIP, p: 2, bgcolor: "#0B2049" }}>
        {entryCopy(model.output, { accent: true, big: true })}
      </Box>
    </Box>
  );

  const intakeChip = (entry: ProcessEntry, i: number) => (
    <Box
      key={entry.id}
      component={motion.div}
      {...rise(0.1 + i * 0.08)}
      sx={{
        p: 1.5,
        clipPath: CHIP_CLIP,
        bgcolor: `rgba(${NOIR.frostRgb}, 0.06)`,
        borderLeft: `2px solid rgba(${NOIR.frostRgb}, 0.35)`,
      }}
    >
      {entryCopy(entry)}
    </Box>
  );

  // -------------------------------------------------------------------------
  // Vertical composition (xs/sm). Structurally different from the wide one, not
  // a reflow of it: at 375px a three-column field·vessel·artifact layout loses
  // the containment read entirely, which is the one thing this section exists
  // to say.
  // -------------------------------------------------------------------------
  if (!wide) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {fieldCount}
        <Box sx={{ position: "relative", height: 52 }}>
          <Box
            component="svg"
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            {raw.map((mark) => (
              <line
                key={`ml-${mark.x}-${mark.y}`}
                x1={mark.x}
                y1={mark.y}
                x2={50}
                y2={130}
                stroke={`rgba(${NOIR.frostRgb}, 0.12)`}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </Box>
          {marks(5)}
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          {model.intake.map((entry, i) => (
            <Box key={entry.id} sx={{ flex: 1 }}>
              {intakeChip(entry, i)}
            </Box>
          ))}
        </Box>
        {vessel}
        {outputChip}
      </Box>
    );
  }

  // -------------------------------------------------------------------------
  // Horizontal composition (md+): open field · vessel · one artifact.
  // Every child is absolutely positioned in the same 0–100 percentage space the
  // connector SVG uses, so nothing has to be measured at runtime.
  // -------------------------------------------------------------------------
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 1320,
        mx: "auto",
        height: "min(48svh, 440px)",
        minHeight: 330,
      }}
    >
      {/* Intake connectors and the exit stroke. They run several units PAST the
          vessel's left face and sit on a lower layer, so the plate genuinely
          occludes them — that occlusion is the inside/outside signal, and an
          outline alone was explicitly rejected in ADR-0002. */}
      <Box
        component="svg"
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }}
      >
        {raw.map((mark, i) => (
          <line
            key={`line-${mark.x}-${mark.y}`}
            x1={mark.x}
            y1={mark.y}
            x2={INTAKE_FACE.wide.past}
            y2={38 + i * 3}
            stroke={`rgba(${NOIR.frostRgb}, 0.11)`}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <line
          x1={74.5}
          y1={50}
          x2={77}
          y2={50}
          stroke={`rgba(${NOIR.goldRgb}, 0.55)`}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </Box>

      {marks(7)}

      <Box sx={{ position: "absolute", left: "1%", top: 0, zIndex: 2 }}>{fieldCount}</Box>

      {model.intake.map((entry, i) => (
        <Box
          key={entry.id}
          sx={{
            position: "absolute",
            left: "17%",
            top: i === 0 ? "30%" : "72%",
            transform: "translateY(-50%)",
            width: 205,
            zIndex: 2,
          }}
        >
          {intakeChip(entry, i)}
        </Box>
      ))}

      <Box
        sx={{
          position: "absolute",
          left: `${INTAKE_FACE.wide.x}%`,
          top: "24%",
          width: "30%",
          height: "52%",
          zIndex: 3,
        }}
      >
        {vessel}
      </Box>

      <Box
        sx={{
          position: "absolute",
          // Stops short of the right edge on purpose: the home page's dot-rail
          // nav is pinned there, and at 1440 a chip at 81%+17% sits underneath
          // its labels.
          left: "77%",
          top: "50%",
          transform: "translateY(-50%)",
          width: "17%",
          minWidth: 160,
          zIndex: 3,
        }}
      >
        {outputChip}
      </Box>
    </Box>
  );
}
