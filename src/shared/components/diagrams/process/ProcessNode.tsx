import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { motion, useTransform, type MotionValue } from "motion/react";

import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { ProcessShipPlate } from "./ProcessShipPlate";
import { IdeaField, ProcessGlyph } from "./ProcessGlyph";
import {
  COLUMN_PCT,
  CONNECTOR_PCT,
  MOBILE_GAP,
  SPINE_X,
  STATUS_LABEL,
  WELL,
  type NodeStatus,
} from "./processStages";
import type { ProcessStep } from "../ProcessDiagram";

/**
 * One phase of the pipeline.
 *
 * Activation — the payload arriving — is expressed through the phase kicker,
 * the connector hairline, the status chip and the spine dot, and never by
 * fading the label or the caption. That is a constraint, not a preference:
 * dimming body text to signal "not yet" would hold it below the 4.5:1 contrast
 * floor for most of the scroll, which is exactly the kind of defect the taste
 * standard treats as a blocker.
 */

const TEXT_INSET_XS = `${SPINE_X + MOBILE_GAP}px`;

/** The last node's well sits inside the ship plate's top padding rather than
 *  on its border, so it reads as docked *in* the plate. */
const PLATE_PT = { xs: 32, md: 40 };

/**
 * Three steps of telemetry, each verified on `navyField`:
 * queued 5.50:1 · running 8.76:1 · shipped 12.73:1.
 *
 * Shipped is *white*, not green, even though green is the obvious choice — the
 * `live` token's own docblock scopes it to status indicators and forbids it on
 * text, because it only measures 4.32:1 at this size. So the green appears as
 * the chip's border and leading dot, which are UI boundaries at a 3:1 floor,
 * and the word itself takes the brightest text step. The chip still reads as
 * "done" at a glance, and the colour is not the only signal either way.
 */
const STATUS_COLOR: Record<NodeStatus, string> = {
  // The value queued replaces was 0.40 alpha (3.58:1) — under AA for 12px
  // type, and it shipped that way.
  queued: `rgba(${NOIR.frostRgb}, 0.60)`,
  running: NOIR.gold,
  shipped: NOIR.frost,
};

interface ProcessNodeProps {
  step: ProcessStep;
  index: number;
  lastIndex: number;
  /** Smoothed scroll progress over the whole diagram. */
  progress: MotionValue<number>;
  /** The progress value at which the payload reaches this node. */
  arrival: number;
  /** How far ahead of `arrival` the lead-in starts. */
  ramp: number;
  status: NodeStatus;
  reduced: boolean;
  /** Registers the element the payload comes to rest on. */
  dockRef: (el: HTMLElement | null) => void;
}

export function ProcessNode({
  step,
  index,
  lastIndex,
  progress,
  arrival,
  ramp,
  status,
  reduced,
  dockRef,
}: ProcessNodeProps) {
  // Derived here rather than handed down, so the conductor never calls a hook
  // inside a loop over content that could change length.
  const activation = useTransform(progress, [arrival - ramp, arrival], [0, 1]);
  const isEndpoint = index === 0 || index === lastIndex;
  const isLast = index === lastIndex;
  // Left column on even middles, right on odd — the zig-zag that makes the
  // spine read as a route rather than a list bullet.
  const leftSide = index % 2 === 0;

  const kickerColor = useTransform(activation, [0, 1], [`rgba(${NOIR.frostRgb}, 0.60)`, NOIR.gold]);
  const connectorScale = useTransform(activation, [0, 1], [0, 1]);
  const dotScale = useTransform(activation, [0, 1], [1, 1.6]);

  const content = (
    <>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        justifyContent={{
          xs: "flex-start",
          md: isEndpoint ? "center" : leftSide ? "flex-end" : "flex-start",
        }}
        sx={{ mb: 1.5 }}
      >
        <motion.span
          style={{
            fontFamily: MONO,
            fontSize: "0.75rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            color: reduced ? NOIR.gold : kickerColor,
          }}
        >
          {`Phase ${step.number}`}
        </motion.span>

        {/* Telemetry. Decorative: "SHIPPED" announced out of context would be a
            claim about application state, which is not what this is. */}
        <Box
          aria-hidden="true"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            fontFamily: MONO,
            fontSize: "0.6875rem",
            letterSpacing: "0.16em",
            px: 1,
            py: 0.25,
            borderRadius: 1,
            whiteSpace: "nowrap",
            color: STATUS_COLOR[status],
            border: "1px solid",
            borderColor: status === "shipped" ? NOIR.live : "currentColor",
            transition: "color 400ms ease, border-color 400ms ease",
          }}
        >
          {status === "shipped" && (
            <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: NOIR.live }} />
          )}
          {STATUS_LABEL[status]}
        </Box>
      </Stack>

      <Typography
        variant="h3"
        component="h3"
        sx={{
          fontWeight: 800,
          mb: 2,
          fontSize: isEndpoint ? { xs: "2.25rem", md: "4rem" } : { xs: "1.5rem", md: "2.5rem" },
          // Line-height scales inversely with size (taste commitment 1).
          lineHeight: isEndpoint ? 1.05 : 1.15,
          letterSpacing: "-0.02em",
          color: NOIR.frost,
          textShadow: isEndpoint ? `0 0 32px rgba(${NOIR.frostRgb}, 0.2)` : "none",
        }}
      >
        {step.label}
      </Typography>

      <Typography
        sx={{
          color: `rgba(${NOIR.frostRgb}, 0.72)`,
          fontSize: isEndpoint ? "1.25rem" : "1.1rem",
          lineHeight: 1.55,
          // Measure, not width: `ch` is the only unit that holds the 45–75ch
          // readable band across type scales.
          maxWidth: "58ch",
          mx: isEndpoint ? { md: "auto" } : undefined,
          ml: !isEndpoint && !leftSide ? { md: 0 } : undefined,
          mr: !isEndpoint && leftSide ? { md: 0 } : undefined,
        }}
      >
        {step.caption}
      </Typography>
    </>
  );

  const body = isEndpoint ? (
    <Box
      sx={{
        // Only the last node's socket is inset by the plate's top padding;
        // reserving that space on the first node too just leaves a hole.
        pt: {
          xs: `${(isLast ? PLATE_PT.xs : 0) + WELL.xs + 24}px`,
          md: `${(isLast ? PLATE_PT.md : 0) + WELL.md + 32}px`,
        },
        pl: { xs: TEXT_INSET_XS, md: 0 },
        pr: { xs: 2, md: 0 },
        textAlign: { xs: "left", md: "center" },
        position: "relative",
      }}
    >
      {index === 0 && <IdeaField activation={activation} reduced={reduced} />}
      {content}
    </Box>
  ) : (
    // Two columns of equal width with the spine running between them: the text
    // on one side, its schematic on the other. Flex rather than an absolutely
    // positioned glyph, so the row grows to whichever side is taller and the
    // same single element serves mobile — where `column-reverse` lifts the
    // glyph above the text instead of stranding it under the caption.
    <>
      <Box
        sx={{
          width: { xs: "auto", md: `${COLUMN_PCT}%` },
          ml: { xs: TEXT_INSET_XS, md: 0 },
          textAlign: { xs: "left", md: leftSide ? "right" : "left" },
        }}
      >
        {content}
      </Box>
      <Box
        sx={{
          // 96 at the narrow end, not 72: below about this the module tree and
          // the clock face stop resolving as drawings and read as texture.
          width: { xs: 96, md: `${COLUMN_PCT}%` },
          ml: { xs: TEXT_INSET_XS, md: 0 },
        }}
      >
        <ProcessGlyph index={index} activation={activation} reduced={reduced} />
      </Box>
    </>
  );

  return (
    <Box
      component="li"
      sx={{
        position: "relative",
        listStyle: "none",
        ...(isEndpoint
          ? null
          : {
              display: "flex",
              // row-reverse puts the text on the right of the spine for odd
              // phases without reordering the DOM, so reading order stays
              // 00 → 05 regardless of which side each one is painted on.
              flexDirection: {
                xs: "column-reverse",
                md: leftSide ? "row" : "row-reverse",
              },
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
            }),
      }}
    >
      {/* Dock — the element the conductor measures and the payload rests on.
          A well at the endpoints, the spine dot everywhere else. Absolutely
          positioned against the <li>, not the text column, so percentages
          resolve against the diagram's full width on both sides of the spine. */}
      {isEndpoint ? (
        <Box
          ref={dockRef}
          aria-hidden="true"
          sx={{
            position: "absolute",
            top: { xs: `${isLast ? PLATE_PT.xs : 0}px`, md: `${isLast ? PLATE_PT.md : 0}px` },
            left: { xs: `${SPINE_X}px`, md: "50%" },
            transform: "translateX(-50%)",
            width: WELL,
            height: WELL,
            // A visible socket, not just a measuring point. Without it the
            // space the payload will occupy reads as dead padding at the top
            // of the phase — which is exactly how the ship plate looked before
            // the payload arrived in it.
            borderRadius: "50%",
            border: `1px dashed rgba(${NOIR.frostRgb}, 0.22)`,
          }}
        />
      ) : (
        <Box
          ref={dockRef}
          aria-hidden="true"
          sx={{
            position: "absolute",
            top: "50%",
            left: { xs: `${SPINE_X}px`, md: "50%" },
            width: 12,
            height: 12,
            mt: "-6px",
            ml: "-6px",
          }}
        >
          <motion.div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: NOIR.navyField,
              border: `2px solid ${NOIR.gold}`,
              scale: reduced ? 1.6 : dotScale,
            }}
          />
        </Box>
      )}

      {/* Connector — drawn from the spine outward as the payload arrives.
          Its desktop width is derived (50 − COLUMN_PCT), never a magic percent
          tuned by eye against the column, which is what `-19.5%` was. */}
      {!isEndpoint && (
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            top: "50%",
            height: "1px",
            left: { xs: `${SPINE_X}px`, md: leftSide ? `${COLUMN_PCT}%` : "50%" },
            width: { xs: `${MOBILE_GAP}px`, md: `${CONNECTOR_PCT}%` },
            // The origin is always the spine end, so the hairline reads as
            // being drawn out from the pipeline rather than in toward it.
            "& > div": {
              transformOrigin: { xs: "left center", md: leftSide ? "right center" : "left center" },
            },
          }}
        >
          <motion.div
            style={{
              width: "100%",
              height: "100%",
              background: NOIR.gold,
              scaleX: reduced ? 1 : connectorScale,
            }}
          />
        </Box>
      )}

      {isLast ? (
        <ProcessShipPlate buildNumber={step.number} shipped={status === "shipped"} reduced={reduced}>
          {body}
        </ProcessShipPlate>
      ) : (
        body
      )}
    </Box>
  );
}
