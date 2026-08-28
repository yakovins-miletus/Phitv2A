import Box from "@mui/material/Box";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

// Terminal Dial Geometry (Centered in the rectangular terminal)
const CX = 260;
const CY = 108;
const R_MAIN = 58;
const R_INNER = 42;
const R_CORE = 18;

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", radius, radius, 0, arcSweep, 0, end.x, end.y].join(" ");
}

export function FollowTheSunDiagram() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.2 });
  const show = reduced === true || inView;

  // 24 Hour Outer Ticks (every 15 degrees)
  const TICKS_24H = Array.from({ length: 24 }, (_, i) => {
    const deg = i * 15;
    const isMajor = i % 8 === 0;
    const isMinor = i % 2 === 0;
    const p1 = polarToCartesian(CX, CY, R_MAIN + 3, deg);
    const p2 = polarToCartesian(CX, CY, R_MAIN + (isMajor ? 11 : isMinor ? 7 : 4), deg);
    return { p1, p2, isMajor };
  });

  // Sector 1: MONITOR (0° to 120°)
  const ARC_MONITOR = describeArc(CX, CY, R_MAIN, 0, 120);
  // Sector 2: INCIDENT (120° to 240°)
  const ARC_INCIDENT = describeArc(CX, CY, R_MAIN, 120, 240);
  // Sector 3: RECOVERY (240° to 360° - Radiant Gold Arc)
  const ARC_RECOVERY = describeArc(CX, CY, R_MAIN, 240, 360);

  // Sector 2 Incident Radial Triage Bars
  const INCIDENT_BARS = [140, 155, 170, 180, 190, 205, 220].map((deg, idx) => {
    const heights = [8, 14, 10, 18, 12, 16, 9];
    const h = heights[idx] ?? 10;
    const pIn = polarToCartesian(CX, CY, R_MAIN - 2, deg);
    const pOut = polarToCartesian(CX, CY, R_MAIN - 2 - h, deg);
    return { pIn, pOut, isCrit: idx === 3 };
  });

  // Boundary demarcation nodes
  const NODE_TOP = polarToCartesian(CX, CY, R_MAIN, 0);
  const NODE_RIGHT = polarToCartesian(CX, CY, R_MAIN, 120);
  const NODE_LEFT = polarToCartesian(CX, CY, R_MAIN, 240);

  // Leader Line Attachment Points
  const MONITOR_CALLOUT_TARGET = polarToCartesian(CX, CY, R_MAIN + 12, 45);
  const RECOVERY_CALLOUT_TARGET = polarToCartesian(CX, CY, R_MAIN + 12, 315);

  return (
    <Box
      ref={rootRef}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 0.5,
      }}
    >
      <svg
        viewBox="0 0 520 220"
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        role="img"
        aria-label="24/7 Operations terminal console with contextual callouts for live monitoring, incident triage, and automated recovery."
        style={{ display: "block", maxHeight: 320 }}
      >
        <defs>
          <radialGradient id="termGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 199, 44, 0.18)" />
            <stop offset="100%" stopColor="rgba(6, 24, 59, 0)" />
          </radialGradient>
        </defs>

        {/* ── 1. Terminal Frame & Corner Crosshairs ── */}
        <g stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1">
          {/* Outer Border with Inset Header */}
          <rect x="16" y="16" width="488" height="188" rx="4" fill="none" />
          <line x1="16" y1="36" x2="504" y2="36" stroke="rgba(255, 255, 255, 0.08)" />

          {/* 4 Corner Crosshairs */}
          <path d="M 22 16 L 22 24 M 16 22 L 24 22" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
          <path d="M 498 16 L 498 24 M 496 22 L 504 22" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
          <path d="M 22 196 L 22 204 M 16 198 L 24 198" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
          <path d="M 498 196 L 498 204 M 496 198 L 504 198" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
        </g>

        {/* Terminal Header Telemetry */}
        <g fontFamily={MONO} fontSize="9" letterSpacing="0.18em" fill="rgba(255, 255, 255, 0.45)">
          <text x="32" y="28">
            CONSOLE // SYS_RELAY_24H
          </text>
          <text x="488" y="28" textAnchor="end" fill={NOIR.gold}>
            STATUS: NOMINAL
          </text>
        </g>

        {/* ── 2. Center Dial Instrumentation (CX=260, CY=108) ── */}

        {/* Ambient Radial Glow behind Recovery Sector */}
        <circle cx={CX} cy={CY} r={R_MAIN + 22} fill="url(#termGlow)" />

        {/* Concentric Calibration Tracks */}
        <circle cx={CX} cy={CY} r={R_MAIN} fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={R_INNER} fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx={CX} cy={CY} r={R_CORE} fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />

        {/* 24-Hour Hour Ticks */}
        {TICKS_24H.map((t, idx) => (
          <line
            key={`tick-${idx}`}
            x1={t.p1.x}
            y1={t.p1.y}
            x2={t.p2.x}
            y2={t.p2.y}
            stroke={t.isMajor ? NOIR.gold : "rgba(255, 255, 255, 0.3)"}
            strokeWidth={t.isMajor ? 1.5 : 0.75}
          />
        ))}

        {/* ── 3. The 3 Circular Sectors ── */}

        {/* Sector 1: MONITOR Arc (0° to 120°) */}
        <motion.path
          d={ARC_MONITOR}
          fill="none"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.5, delay: 0.1 }}
        />

        {/* Internal Green Heartbeat Wave */}
        <path
          d={`M ${polarToCartesian(CX, CY, R_INNER, 20).x} ${polarToCartesian(CX, CY, R_INNER, 20).y} 
              L ${polarToCartesian(CX, CY, R_INNER + 5, 40).x} ${polarToCartesian(CX, CY, R_INNER + 5, 40).y}
              L ${polarToCartesian(CX, CY, R_INNER - 5, 60).x} ${polarToCartesian(CX, CY, R_INNER - 5, 60).y}
              L ${polarToCartesian(CX, CY, R_INNER + 6, 80).x} ${polarToCartesian(CX, CY, R_INNER + 6, 80).y}
              L ${polarToCartesian(CX, CY, R_INNER, 100).x} ${polarToCartesian(CX, CY, R_INNER, 100).y}`}
          fill="none"
          stroke="#4ADE80"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />

        {/* Sector 2: INCIDENT Arc (120° to 240°) */}
        <motion.path
          d={ARC_INCIDENT}
          fill="none"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        {/* Incident Radial Triage Bars */}
        {INCIDENT_BARS.map((bar, bi) => (
          <motion.line
            key={`inc-bar-${bi}`}
            x1={bar.pIn.x}
            y1={bar.pIn.y}
            x2={bar.pOut.x}
            y2={bar.pOut.y}
            stroke={bar.isCrit ? NOIR.gold : "rgba(255, 255, 255, 0.5)"}
            strokeWidth={bar.isCrit ? 1.75 : 1}
            strokeLinecap="round"
            initial={reduced ? false : { opacity: 0 }}
            animate={show ? { opacity: 1 } : false}
            transition={{ duration: 0.3, delay: 0.3 + bi * 0.03 }}
          />
        ))}

        {/* Sector 3: RECOVERY Arc (240° to 360° - Live Gold Arc) */}
        <motion.path
          d={ARC_RECOVERY}
          fill="none"
          stroke={NOIR.gold}
          strokeWidth="4"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 8px #FFC72C)" }}
          initial={reduced ? false : { pathLength: 0 }}
          animate={show ? { pathLength: 1 } : false}
          transition={{ duration: 0.5, delay: 0.3 }}
        />

        {/* Boundary Demarcation Nodes */}
        <circle cx={NODE_TOP.x} cy={NODE_TOP.y} r="3" fill="#4ADE80" />
        <circle cx={NODE_RIGHT.x} cy={NODE_RIGHT.y} r="3" fill="#FFFFFF" />
        <circle
          cx={NODE_LEFT.x}
          cy={NODE_LEFT.y}
          r="4"
          fill={NOIR.gold}
          style={{ filter: "drop-shadow(0 0 8px #FFC72C)" }}
        />

        {/* Orbiting Telemetry Satellite */}
        {!reduced && show && (
          <rect
            x="-3"
            y="-3"
            width="6"
            height="6"
            rx="1.5"
            fill={NOIR.gold}
            style={{ filter: "drop-shadow(0 0 8px #FFC72C)" }}
          >
            <animateMotion
              dur="8s"
              repeatCount="indefinite"
              path={`M ${CX} ${CY - R_MAIN} A ${R_MAIN} ${R_MAIN} 0 1 1 ${CX - 0.01} ${CY - R_MAIN}`}
            />
          </rect>
        )}

        {/* Center Precision Hub */}
        <circle cx={CX} cy={CY} r="5" fill={NOIR.navyDeep} stroke={NOIR.gold} strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r="2" fill={NOIR.gold} />

        {/* ── 4. Direct Contextual Callout Badges around the 3 Sectors ── */}

        {/* CALLOUT 1: RECOVERY (Top-Left, pointing directly to Gold Arc) */}
        <g>
          <path
            d={`M 155 60 L 195 60 L ${RECOVERY_CALLOUT_TARGET.x} ${RECOVERY_CALLOUT_TARGET.y}`}
            fill="none"
            stroke={NOIR.gold}
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <circle cx={RECOVERY_CALLOUT_TARGET.x} cy={RECOVERY_CALLOUT_TARGET.y} r="2" fill={NOIR.gold} />
          {/* Badge Frame */}
          <rect x="52" y="48" width="98" height="24" rx="3" fill="rgba(6, 24, 59, 0.85)" stroke={NOIR.gold} strokeWidth="1" />
          <circle cx="64" cy="60" r="2.5" fill={NOIR.gold} />
          <text
            x="74"
            y="64"
            fontFamily={MONO}
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.16em"
            fill={NOIR.gold}
          >
            RECOVERY
          </text>
        </g>

        {/* CALLOUT 2: MONITOR (Top-Right, pointing directly to Telemetry Arc) */}
        <g>
          <path
            d={`M 365 60 L 325 60 L ${MONITOR_CALLOUT_TARGET.x} ${MONITOR_CALLOUT_TARGET.y}`}
            fill="none"
            stroke="rgba(74, 222, 128, 0.6)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <circle cx={MONITOR_CALLOUT_TARGET.x} cy={MONITOR_CALLOUT_TARGET.y} r="2" fill="#4ADE80" />
          {/* Badge Frame */}
          <rect x="370" y="48" width="94" height="24" rx="3" fill="rgba(6, 24, 59, 0.85)" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
          <circle cx="382" cy="60" r="2.5" fill="#4ADE80" />
          <text
            x="392"
            y="64"
            fontFamily={MONO}
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.16em"
            fill="rgba(255, 255, 255, 0.85)"
          >
            MONITOR
          </text>
        </g>

        {/* CALLOUT 3: INCIDENT (Bottom-Center, directly beneath Triage Bars) */}
        <g transform="translate(196, 172)">
          <line x1="64" y1="0" x2="64" y2="8" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" strokeDasharray="2 2" />
          {/* Badge Frame */}
          <rect x="0" y="8" width="128" height="24" rx="3" fill="rgba(6, 24, 59, 0.85)" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
          <rect x="12" y="18" width="4" height="4" rx="1" fill="rgba(255, 255, 255, 0.6)" />
          <text
            x="24"
            y="24"
            fontFamily={MONO}
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.16em"
            fill="rgba(255, 255, 255, 0.85)"
          >
            INCIDENT
          </text>
        </g>
      </svg>
    </Box>
  );
}
