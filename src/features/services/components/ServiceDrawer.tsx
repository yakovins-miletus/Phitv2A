import { motion } from "motion/react";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link } from "@tanstack/react-router";
import { NOIR } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import type { Service } from "../api";
import { ServiceIcon } from "./ServiceIcon";

/**
 * Deterministic pseudo-random generator (mulberry32) for the quant-research
 * backdrop's sampled series — fixed seed, pure function of index, so the
 * trace is identical on every render instead of drawing a fresh idealised
 * curve each time.
 */
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildQuantSeries(): { path: string; convergence: { x: number; y: number } } {
  const rand = mulberry32(0x71a9_cee4);
  const samples = 60;
  const baseline = 210;
  let y = baseline;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= samples; i += 1) {
    const x = 60 + (i / samples) * 280;
    // Damped random walk: volatile early, settling as the series progresses —
    // a research series converging on an estimate, not a smooth sine wave.
    const damp = 1 - i / samples;
    y += (rand() - 0.5) * 46 * damp;
    y = baseline + (y - baseline) * 0.85;
    pts.push([x, y]);
  }
  const path = pts.map(([x, py], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1] ?? [340, baseline];
  return { path, convergence: { x: last[0], y: last[1] } };
}

const { path: QUANT_SERIES_PATH, convergence: QUANT_CONVERGENCE } = buildQuantSeries();

// Simple abstract 2D Vector visualizations based on service ID with continuous animations
export function ServiceVector({ id }: { id: string }) {
  const targetId = String(id || "").toLowerCase();

  if (targetId === "development" || targetId === "service-dev" || targetId.includes("dev") || targetId.includes("software") || targetId === "1") {
    return (
      <svg width="100%" height="100%" viewBox="-70 0 540 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="sdlc-arrow-navy" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={NOIR.navyField} />
          </marker>
        </defs>

        {/* Central Core — the one element that carries meaning: the always-on engine */}
        <motion.circle
          initial={{ scale: 1, opacity: 0.85 }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          cx="200"
          cy="200"
          r="26"
          fill="var(--accent-ink)"
        />
        <motion.circle
          initial={{ scale: 1, opacity: 0.3 }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          cx="200"
          cy="200"
          r="46"
          stroke="var(--accent-ink)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />

        {/* Circular Lifecycle Path — structure, navy */}
        <motion.circle
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          cx="200"
          cy="200"
          r="120"
          stroke={NOIR.navyField}
          strokeWidth="1.5"
          strokeDasharray="8 8"
          opacity={0.4}
          style={{ transformOrigin: "200px 200px" }}
        />

        {/* Arc Arrows — the continuous flow between phases, navy structure */}
        <motion.path
          d="M 230 84 A 120 120 0 0 1 313 166"
          stroke={NOIR.navyField}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
          markerEnd="url(#sdlc-arrow-navy)"
        />
        <motion.path
          d="M 316 230 A 120 120 0 0 1 233 313"
          stroke={NOIR.navyField}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
          markerEnd="url(#sdlc-arrow-navy)"
        />
        <motion.path
          d="M 170 316 A 120 120 0 0 1 87 233"
          stroke={NOIR.navyField}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
          markerEnd="url(#sdlc-arrow-navy)"
        />
        <motion.path
          d="M 84 170 A 120 120 0 0 1 167 87"
          stroke={NOIR.navyField}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
          markerEnd="url(#sdlc-arrow-navy)"
        />

        {/* Phase Nodes — navy structure, uniform treatment */}
        <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          <rect x="165" y="55" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.navyField} strokeWidth="1.5" />
          <rect x="177" y="70" width="22" height="4" rx="2" fill={NOIR.frost} opacity={0.55} />
          <rect x="177" y="80" width="46" height="4" rx="2" fill={NOIR.frost} opacity={0.3} />
          <circle cx="218" cy="72" r="5" fill={NOIR.frost} opacity={0.55} />
          <text x="200" y="40" textAnchor="middle" fontSize="12" fontWeight="700" letterSpacing="0.08em" fill={NOIR.frost}>PLAN</text>
        </motion.g>

        <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
          <rect x="295" y="175" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.navyField} strokeWidth="1.5" />
          <path d="M 315 192 L 308 200 L 315 208 M 345 192 L 352 200 L 345 208 M 332 190 L 328 210" stroke={NOIR.frost} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
          <text x="372" y="204" textAnchor="start" fontSize="12" fontWeight="700" letterSpacing="0.08em" fill={NOIR.frost}>CODE</text>
        </motion.g>

        <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}>
          <rect x="165" y="295" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.navyField} strokeWidth="1.5" />
          <path d="M 185 320 L 195 328 L 215 312" stroke={NOIR.frost} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
          <text x="200" y="363" textAnchor="middle" fontSize="12" fontWeight="700" letterSpacing="0.08em" fill={NOIR.frost}>DEPLOY</text>
        </motion.g>

        <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 3 }}>
          <rect x="35" y="175" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.navyField} strokeWidth="1.5" />
          <path d="M 48 200 L 58 200 L 63 190 L 70 210 L 77 195 L 82 200 L 92 200" stroke={NOIR.frost} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
          <text x="28" y="204" textAnchor="end" fontSize="12" fontWeight="700" letterSpacing="0.08em" fill={NOIR.frost}>MONITOR</text>
        </motion.g>
      </svg>
    );
  }

  if (targetId === "quant-research" || targetId === "service-quant" || targetId.includes("quant") || targetId === "2") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Iterative refinement rings — structure, navy */}
        <motion.circle
          initial={{ r: 120, opacity: 0.35 }}
          animate={{ r: [120, 128, 120], opacity: [0.35, 0.5, 0.35] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          cx="200"
          cy="200"
          r="120"
          stroke={NOIR.navyField}
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <motion.circle
          initial={{ r: 80, opacity: 0.5 }}
          animate={{ r: [80, 84, 80], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          cx="200"
          cy="200"
          r="80"
          stroke={NOIR.navyField}
          strokeWidth="2.5"
        />
        {/* Sampled research series — real data shape, not a smooth idealised wave */}
        <path d={QUANT_SERIES_PATH} stroke={NOIR.navyField} strokeWidth="1.5" fill="none" opacity={0.6} />
        {/* Converged estimate — the one element that carries meaning */}
        <motion.circle
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.15, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          cx={QUANT_CONVERGENCE.x}
          cy={QUANT_CONVERGENCE.y}
          r="5"
          fill="var(--accent-ink)"
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />
      </svg>
    );
  }

  if (targetId === "data-science" || targetId === "service-data" || targetId.includes("data") || targetId === "3") {
    const barW = 50;
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Underlying growth — navy structure */}
        <rect x={80 - barW / 2} y="250" width={barW} height="90" rx="8" fill={NOIR.navyField} opacity={0.35} />
        <rect x={200 - barW / 2} y="170" width={barW} height="170" rx="8" fill={NOIR.navyField} opacity={0.5} />
        <rect x={320 - barW / 2} y="90" width={barW} height="250" rx="8" fill={NOIR.navyField} opacity={0.65} />
        {/* Trend — the one element that carries meaning */}
        <path
          d="M 40 247 L 360 33"
          stroke="var(--accent-ink)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 339 35 L 360 33 L 350 52"
          stroke="var(--accent-ink)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="80" cy="220" r="4" fill="var(--accent-ink)" />
        <circle cx="200" cy="140" r="4" fill="var(--accent-ink)" />
        <circle cx="320" cy="60" r="4" fill="var(--accent-ink)" />
      </svg>
    );
  }

  // Support / DevOps
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="50" y="75" width="300" height="250" rx="14" fill={NOIR.navyInk} stroke={NOIR.navyField} strokeWidth="1.5" />
        <rect x="50" y="75" width="300" height="34" rx="14" fill={NOIR.navyPanel} />
        <circle cx="70" cy="92" r="4" fill={NOIR.frost} opacity="0.5" />
        <circle cx="84" cy="92" r="4" fill={NOIR.frost} opacity="0.35" />
        <circle cx="98" cy="92" r="4" fill={NOIR.frost} opacity="0.2" />
        <line x1="50" y1="109" x2="350" y2="109" stroke={NOIR.navyField} strokeWidth="1" opacity="0.5" />

        {/* Log lines — structure, navy/frost only */}
        <motion.rect animate={{ opacity: [0.55, 0.25, 0.55] }} transition={{ duration: 2, repeat: Infinity }} x="70" y="125" width="40" height="5" rx="2.5" fill={NOIR.frost} />
        <rect x="118" y="125" width="100" height="5" rx="2.5" fill={NOIR.frost} opacity="0.3" />
        <rect x="226" y="125" width="60" height="5" rx="2.5" fill={NOIR.frost} opacity="0.4" />

        <rect x="70" y="145" width="130" height="5" rx="2.5" fill={NOIR.frost} opacity="0.4" />
        <motion.rect animate={{ opacity: [0.55, 0.25, 0.55] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} x="208" y="145" width="50" height="5" rx="2.5" fill={NOIR.frost} />
        <rect x="266" y="145" width="35" height="5" rx="2.5" fill={NOIR.frost} opacity="0.25" />

        <rect x="90" y="165" width="75" height="5" rx="2.5" fill={NOIR.frost} opacity="0.45" />
        <rect x="173" y="165" width="110" height="5" rx="2.5" fill={NOIR.frost} opacity="0.3" />

        <rect x="90" y="185" width="140" height="5" rx="2.5" fill={NOIR.frost} opacity="0.5" />
        <motion.rect animate={{ x: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity }} x="238" y="185" width="45" height="5" rx="2.5" fill={NOIR.frost} opacity="0.35" />

        <rect x="110" y="205" width="60" height="5" rx="2.5" fill={NOIR.frost} opacity="0.45" />
        <rect x="178" y="205" width="95" height="5" rx="2.5" fill={NOIR.frost} opacity="0.25" />

        <rect x="70" y="225" width="155" height="5" rx="2.5" fill={NOIR.frost} opacity="0.4" />
        <rect x="233" y="225" width="70" height="5" rx="2.5" fill={NOIR.frost} opacity="0.45" />

        <motion.rect animate={{ opacity: [0.35, 0.55, 0.35] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} x="70" y="245" width="90" height="5" rx="2.5" fill={NOIR.frost} />
        <rect x="168" y="245" width="115" height="5" rx="2.5" fill={NOIR.frost} opacity="0.45" />

        <rect x="70" y="265" width="110" height="5" rx="2.5" fill={NOIR.frost} opacity="0.5" />

        {/* Active cursor — the one element that carries meaning: the live process */}
        <motion.rect
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          x="188" y="260" width="8" height="13" fill="var(--accent-ink)"
        />
      </motion.g>
    </svg>
  );
}

export interface ServiceDrawerProps {
  open: boolean;
  onClose: () => void;
  service: Service | null;
}

export function ServiceDrawer({ open, onClose, service }: ServiceDrawerProps) {
  if (!service) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 520, md: 620 },
          bgcolor: NOIR.panel,
          color: NOIR.navyField,
          p: 0,
          boxShadow: "0 20px 60px rgba(10, 42, 102, 0.15)",
        },
      }}
    >
      <Box sx={{ p: { xs: 3, sm: 4 }, borderBottom: "1px solid rgba(10, 42, 102, 0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
          <Box sx={{ p: 1.2, borderRadius: "10px", bgcolor: "rgba(10, 42, 102, 0.06)", color: NOIR.navyField, display: "flex" }}>
            <ServiceIcon icon={service.icon} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, color: NOIR.navyField, fontSize: "1.4rem" }}>
              {service.name}
            </Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: "0.75rem", color: "rgba(10, 42, 102, 0.7)", fontWeight: 700 }}>
              TECHNICAL SPECIFICATIONS
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: NOIR.navyField }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Drawer Content */}
      <Box data-lenis-prevent sx={{ p: { xs: 3, sm: 4 }, overflowY: "auto", flexGrow: 1 }}>
        <Stack spacing={3.5}>

          {/* Description */}
          <Box>
            <Typography sx={{ fontFamily: MONO, fontSize: "0.82rem", fontWeight: 700, color: NOIR.navyField, mb: 1 }}>
              {service.tagline}
            </Typography>
            <Typography sx={{ fontSize: "0.95rem", color: "rgba(10, 42, 102, 0.8)", lineHeight: 1.65 }}>
              {service.description}
            </Typography>
          </Box>

          {/* Stack Chips */}
          <Box>
            <Typography sx={{ fontFamily: MONO, fontSize: "0.7rem", color: "rgba(10, 42, 102, 0.6)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 1.2 }}>
              ENGINEERING STACK
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {service.highlights.map((h) => (
                <Chip key={h} label={h} size="small" sx={{ fontFamily: MONO, fontWeight: 700, fontSize: "0.72rem", bgcolor: "rgba(10, 42, 102, 0.06)", color: NOIR.navyField }} />
              ))}
            </Stack>
          </Box>

          {/* Sub-teams */}
          {service.sub_teams && service.sub_teams.length > 0 && (
            <Box>
              <Typography sx={{ fontFamily: MONO, fontSize: "0.7rem", color: "rgba(10, 42, 102, 0.6)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", mb: 1.5 }}>
                SPECIALIZED R&D SUB-TEAMS
              </Typography>
              <Grid container spacing={1.5}>
                {service.sub_teams.map((team, idx) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                    <Box sx={{ p: 2, borderRadius: "8px", bgcolor: "rgba(10, 42, 102, 0.04)", border: "1px solid rgba(10, 42, 102, 0.1)" }}>
                      <Typography sx={{ fontFamily: MONO, fontSize: "0.82rem", fontWeight: 700, color: NOIR.navyField, mb: 0.5 }}>
                        {team.name}
                      </Typography>
                      <Typography sx={{ fontSize: "0.78rem", color: "rgba(10, 42, 102, 0.7)", lineHeight: 1.5 }}>
                        {team.description}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* CTA inside Drawer */}
          <Box sx={{ pt: 2, borderTop: "1px solid rgba(10, 42, 102, 0.1)" }}>
            <Button
              component={Link}
              to="/contact"
              variant="contained"
              fullWidth
              endIcon={<ArrowForwardIcon />}
              onClick={onClose}
              sx={{
                fontFamily: MONO,
                fontWeight: 800,
                bgcolor: NOIR.navyField,
                color: NOIR.white,
                py: 1.4,
                borderRadius: "8px",
                boxShadow: "none",
                textTransform: "none",
                "&:hover": { bgcolor: NOIR.navyDark },
              }}
            >
              Inquire About {service.name}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Drawer>
  );
}
