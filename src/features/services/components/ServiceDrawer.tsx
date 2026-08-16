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

// Simple abstract 2D Vector visualizations based on service ID with continuous animations
export function ServiceVector({ id }: { id: string }) {
  const targetId = String(id || "").toLowerCase();

  if (targetId === "development" || targetId === "service-dev" || targetId.includes("dev") || targetId.includes("software") || targetId === "1") {
    return (
      <svg width="100%" height="100%" viewBox="-70 0 540 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="sdlc-arrow-gold" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={NOIR.gold} />
          </marker>
          <marker id="sdlc-arrow-goldLight" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={NOIR.goldLight} />
          </marker>
          <marker id="sdlc-arrow-goldDark" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={NOIR.goldDark} />
          </marker>
          <marker id="sdlc-arrow-mist" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={NOIR.mist} />
          </marker>
        </defs>

        {/* Central Core */}
        <motion.circle
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          cx="200"
          cy="200"
          r="30"
          fill="none"
          stroke={NOIR.gold}
          strokeWidth="2"
        />
        <motion.circle
          initial={{ scale: 1, opacity: 0.3 }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          cx="200"
          cy="200"
          r="50"
          stroke={NOIR.goldLight}
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />

        {/* Circular Lifecycle Path */}
        <motion.circle
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          cx="200"
          cy="200"
          r="120"
          stroke={NOIR.goldDark}
          strokeWidth="2.5"
          strokeDasharray="8 8"
          style={{ transformOrigin: "200px 200px" }}
        />

        {/* Arc Arrows */}
        <motion.path
          d="M 230 84 A 120 120 0 0 1 313 166"
          stroke={NOIR.gold}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          markerEnd="url(#sdlc-arrow-gold)"
        />
        <motion.path
          d="M 316 230 A 120 120 0 0 1 233 313"
          stroke={NOIR.goldLight}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          markerEnd="url(#sdlc-arrow-goldLight)"
        />
        <motion.path
          d="M 170 316 A 120 120 0 0 1 87 233"
          stroke={NOIR.goldDark}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          markerEnd="url(#sdlc-arrow-goldDark)"
        />
        <motion.path
          d="M 84 170 A 120 120 0 0 1 167 87"
          stroke={NOIR.mist}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          markerEnd="url(#sdlc-arrow-mist)"
        />

        {/* Phase Nodes */}
        <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          <rect x="165" y="55" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.gold} strokeWidth="2" />
          <rect x="177" y="70" width="22" height="4" rx="2" fill={NOIR.goldLight} />
          <rect x="177" y="80" width="46" height="4" rx="2" fill={NOIR.mist} />
          <circle cx="218" cy="72" r="6" fill={NOIR.gold} />
          <text x="200" y="40" textAnchor="middle" fontSize="12" fontWeight="700" letterSpacing="0.08em" fill={NOIR.frost}>PLAN</text>
        </motion.g>

        <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
          <rect x="295" y="175" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.goldLight} strokeWidth="2" />
          <path d="M 315 192 L 308 200 L 315 208 M 345 192 L 352 200 L 345 208 M 332 190 L 328 210" stroke={NOIR.goldLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="372" y="204" textAnchor="start" fontSize="12" fontWeight="700" letterSpacing="0.08em" fill={NOIR.frost}>CODE</text>
        </motion.g>

        <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}>
          <rect x="165" y="295" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.goldDark} strokeWidth="2" />
          <path d="M 185 320 L 195 328 L 215 312" stroke={NOIR.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="200" y="363" textAnchor="middle" fontSize="12" fontWeight="700" letterSpacing="0.08em" fill={NOIR.frost}>DEPLOY</text>
        </motion.g>

        <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 3 }}>
          <rect x="35" y="175" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.mist} strokeWidth="2" />
          <path d="M 48 200 L 58 200 L 63 190 L 70 210 L 77 195 L 82 200 L 92 200" stroke={NOIR.mist} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="28" y="204" textAnchor="end" fontSize="12" fontWeight="700" letterSpacing="0.08em" fill={NOIR.frost}>MONITOR</text>
        </motion.g>
      </svg>
    );
  }

  if (targetId === "quant-research" || targetId === "service-quant" || targetId.includes("quant") || targetId === "2") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.circle
          initial={{ r: 120, opacity: 0.6 }}
          animate={{ r: [120, 130, 120], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          cx="200"
          cy="200"
          r="120"
          stroke={NOIR.gold}
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <motion.circle
          initial={{ r: 80, opacity: 0.8 }}
          animate={{ r: [80, 85, 80], opacity: [0.8, 0.4, 0.8] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          cx="200"
          cy="200"
          r="80"
          stroke={NOIR.goldLight}
          strokeWidth="4"
        />
        <motion.path 
          animate={{ pathLength: [0, 1, 0] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} 
          d="M50 200 Q 150 50, 200 200 T 350 200" 
          stroke={NOIR.mist} 
          strokeWidth="3" 
          fill="transparent" 
        />
      </svg>
    );
  }

  if (targetId === "data-science" || targetId === "service-data" || targetId.includes("data") || targetId === "3") {
    const barW = 50;
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x={80 - barW / 2} y="250" width={barW} height="90" rx="8" fill={NOIR.goldDark} />
        <rect x={200 - barW / 2} y="170" width={barW} height="170" rx="8" fill={NOIR.gold} />
        <rect x={320 - barW / 2} y="90" width={barW} height="250" rx="8" fill={NOIR.goldLight} />
        <path
          d="M 40 247 L 360 33"
          stroke={NOIR.gold}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 339 35 L 360 33 L 350 52"
          stroke={NOIR.gold}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="80" cy="220" r="5" fill={NOIR.goldLight} stroke={NOIR.goldDark} strokeWidth="2" />
        <circle cx="200" cy="140" r="5" fill={NOIR.goldLight} stroke={NOIR.goldDark} strokeWidth="2" />
        <circle cx="320" cy="60" r="5" fill={NOIR.goldLight} stroke={NOIR.goldDark} strokeWidth="2" />
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
        <rect x="50" y="75" width="300" height="250" rx="14" fill={NOIR.navyInk} stroke={NOIR.gold} strokeWidth="2.5" />
        <rect x="50" y="75" width="300" height="34" rx="14" fill={NOIR.navyPanel} />
        <circle cx="70" cy="92" r="4" fill={NOIR.gold} opacity="0.9" />
        <circle cx="84" cy="92" r="4" fill={NOIR.gold} opacity="0.55" />
        <circle cx="98" cy="92" r="4" fill={NOIR.gold} opacity="0.3" />
        <line x1="50" y1="109" x2="350" y2="109" stroke={NOIR.goldDark} strokeWidth="1" opacity="0.4" />

        <motion.rect animate={{ opacity: [0.9, 0.4, 0.9] }} transition={{ duration: 2, repeat: Infinity }} x="70" y="125" width="40" height="5" rx="2.5" fill={NOIR.goldLight} />
        <rect x="118" y="125" width="100" height="5" rx="2.5" fill={NOIR.mist} opacity="0.6" />
        <rect x="226" y="125" width="60" height="5" rx="2.5" fill={NOIR.goldDark} opacity="0.75" />

        <rect x="70" y="145" width="130" height="5" rx="2.5" fill={NOIR.goldDark} opacity="0.8" />
        <motion.rect animate={{ opacity: [0.95, 0.5, 0.95] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} x="208" y="145" width="50" height="5" rx="2.5" fill={NOIR.goldLight} />
        <rect x="266" y="145" width="35" height="5" rx="2.5" fill={NOIR.mist} opacity="0.5" />

        <rect x="90" y="165" width="75" height="5" rx="2.5" fill={NOIR.gold} opacity="0.85" />
        <rect x="173" y="165" width="110" height="5" rx="2.5" fill={NOIR.mist} opacity="0.6" />

        <rect x="90" y="185" width="140" height="5" rx="2.5" fill={NOIR.goldLight} opacity="0.9" />
        <motion.rect animate={{ x: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity }} x="238" y="185" width="45" height="5" rx="2.5" fill={NOIR.goldDark} opacity="0.7" />

        <rect x="110" y="205" width="60" height="5" rx="2.5" fill={NOIR.gold} opacity="0.9" />
        <rect x="178" y="205" width="95" height="5" rx="2.5" fill={NOIR.mist} opacity="0.5" />

        <rect x="70" y="225" width="155" height="5" rx="2.5" fill={NOIR.goldDark} opacity="0.8" />
        <rect x="233" y="225" width="70" height="5" rx="2.5" fill={NOIR.goldLight} opacity="0.85" />

        <motion.rect animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} x="70" y="245" width="90" height="5" rx="2.5" fill={NOIR.mist} />
        <rect x="168" y="245" width="115" height="5" rx="2.5" fill={NOIR.gold} opacity="0.85" />

        <rect x="70" y="265" width="110" height="5" rx="2.5" fill={NOIR.goldLight} opacity="0.9" />
        
        <motion.rect 
          animate={{ opacity: [1, 0, 1] }} 
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} 
          x="188" y="260" width="8" height="13" fill={NOIR.goldLight} 
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
                color: "#FFFFFF",
                py: 1.4,
                borderRadius: "8px",
                boxShadow: "none",
                textTransform: "none",
                "&:hover": { bgcolor: "#081F4D" },
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
