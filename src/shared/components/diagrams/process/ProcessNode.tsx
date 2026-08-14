import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { motion, useTransform, type MotionValue } from "motion/react";

import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { ProcessShipPlate } from "./ProcessShipPlate";
import { IdeaField, ProcessGlyph } from "./ProcessGlyph";
import {
  STATUS_LABEL,
  type NodeStatus,
} from "./processStages";
import type { ProcessStep } from "../ProcessDiagram";

const STATUS_COLOR: Record<NodeStatus, string> = {
  queued: `rgba(${NOIR.frostRgb}, 0.60)`,
  running: NOIR.gold,
  shipped: NOIR.frost,
};

interface ProcessNodeProps {
  step: ProcessStep;
  index: number;
  lastIndex: number;
  progress: MotionValue<number>;
  arrival: number;
  ramp: number;
  status: NodeStatus;
  reduced: boolean;
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
  const activation = useTransform(progress, [arrival - ramp, arrival], [0, 1]);
  const isEndpoint = index === 0 || index === lastIndex;
  const isLast = index === lastIndex;

  const kickerColor = useTransform(activation, [0, 1], [`rgba(${NOIR.frostRgb}, 0.60)`, NOIR.gold]);
  const borderGlow = useTransform(
    activation,
    [0, 1],
    [`rgba(${NOIR.frostRgb}, 0.12)`, `rgba(${NOIR.goldRgb}, 0.45)`]
  );

  const content = (
    <Box sx={{ width: "100%" }}>
      {/* Phase Number & Status Header Bar */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
        sx={{
          pb: 1.5,
          mb: 2,
          borderBottom: `1px solid rgba(${NOIR.frostRgb}, 0.10)`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <motion.span
            style={{
              fontFamily: MONO,
              fontSize: "0.8125rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              color: reduced ? NOIR.gold : kickerColor,
              fontWeight: 700,
            }}
          >
            {`Phase ${step.number}`}
          </motion.span>
          <Typography
            aria-hidden="true"
            sx={{
              fontFamily: MONO,
              fontSize: "0.6875rem",
              letterSpacing: "0.14em",
              color: `rgba(${NOIR.frostRgb}, 0.40)`,
            }}
          >
            {`// SYS.0${index}`}
          </Typography>
        </Stack>

        {/* Status indicator badge (strictly matches /^(QUEUED|RUNNING|SHIPPED)$/) */}
        <Box
          aria-hidden="true"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            fontFamily: MONO,
            fontSize: "0.6875rem",
            letterSpacing: "0.16em",
            px: 1.25,
            py: 0.35,
            bgcolor: "rgba(6, 18, 38, 0.6)",
            color: STATUS_COLOR[status],
            border: "1px solid",
            borderColor: status === "shipped" ? NOIR.live : "currentColor",
            borderRadius: 0,
            transition: "color 400ms ease, border-color 400ms ease",
          }}
        >
          {status === "shipped" && (
            <Box sx={{ width: 5, height: 5, borderRadius: 0, bgcolor: NOIR.live }} />
          )}
          <span style={{ opacity: 0.5 }}>[</span>
          <span>{STATUS_LABEL[status]}</span>
          <span style={{ opacity: 0.5 }}>]</span>
        </Box>
      </Stack>

      {/* Main Label and Caption */}
      <Typography
        variant="h3"
        component="h3"
        sx={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 800,
          mb: 1.5,
          fontSize: isEndpoint ? { xs: "2.25rem", md: "3rem" } : { xs: "1.75rem", md: "2.25rem" },
          lineHeight: 1.1,
          letterSpacing: "-0.025em",
          color: NOIR.frost,
          textTransform: "uppercase",
        }}
      >
        {step.label}
      </Typography>

      <Typography
        sx={{
          color: `rgba(${NOIR.frostRgb}, 0.78)`,
          fontSize: { xs: "1rem", md: "1.1rem" },
          lineHeight: 1.65,
          maxWidth: "60ch",
        }}
      >
        {step.caption}
      </Typography>
    </Box>
  );

  const body = isLast ? (
    <ProcessShipPlate buildNumber={step.number} shipped={status === "shipped"} reduced={reduced}>
      {content}
    </ProcessShipPlate>
  ) : (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: index === 0 ? "1fr" : "1.6fr 1fr" },
        gap: { xs: 3, md: 5 },
        alignItems: "center",
        width: "100%",
        position: "relative",
      }}
    >
      {index === 0 && <IdeaField activation={activation} reduced={reduced} />}
      {content}
      {index > 0 && index < lastIndex && (
        <Box sx={{ width: "100%", display: "flex", justifyContent: { xs: "flex-start", md: "center" } }}>
          <ProcessGlyph index={index} activation={activation} reduced={reduced} />
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      component="li"
      sx={{
        position: "relative",
        listStyle: "none",
        width: "100%",
      }}
    >
      {/* Dock Anchor Point */}
      <Box
        ref={dockRef}
        sx={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: 1,
          height: 1,
          pointerEvents: "none",
        }}
      />

      {/* Industrial Brutalist Cell Container */}
      <motion.div
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "32px 36px",
          backgroundColor: `rgba(${NOIR.navyInkRgb}, 0.85)`,
          border: "1px solid",
          borderColor: reduced ? `rgba(${NOIR.frostRgb}, 0.12)` : borderGlow,
          borderRadius: 0,
          position: "relative",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* CAD Crosshairs at 4 corners */}
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            top: -6,
            left: -6,
            fontFamily: MONO,
            fontSize: "12px",
            lineHeight: 1,
            color: NOIR.gold,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          +
        </Box>
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            top: -6,
            right: -6,
            fontFamily: MONO,
            fontSize: "12px",
            lineHeight: 1,
            color: NOIR.gold,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          +
        </Box>
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            bottom: -6,
            left: -6,
            fontFamily: MONO,
            fontSize: "12px",
            lineHeight: 1,
            color: NOIR.gold,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          +
        </Box>
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            bottom: -6,
            right: -6,
            fontFamily: MONO,
            fontSize: "12px",
            lineHeight: 1,
            color: NOIR.gold,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          +
        </Box>

        {body}
      </motion.div>
    </Box>
  );
}
