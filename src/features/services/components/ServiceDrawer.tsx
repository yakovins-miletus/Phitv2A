import Drawer from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import { CONTENT } from "@/shared/content";
import { motion, AnimatePresence } from "motion/react";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";

/**
 * Unified transition tokens — mirrored from Reveal / StaggerItem so every
 * choreographed entrance across the site feels coherent.
 */
const REVEAL_DURATION = 0.6;
const STAGGER_GAP = 0.06;
/** MUI Drawer slide speed, derived from the global scroll-speed constant. */
const DRAWER_TRANSITION_MS = Math.round(SCROLL_SPEED * 1000);

interface ServiceDrawerProps {
  open: boolean;
  onClose: () => void;
  serviceId: string | null;
}

// Simple abstract 2D Vector visualizations based on service ID
export function ServiceVector({ id }: { id: string }) {
  if (id === "development" || id === "service-dev") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Abstract Software Development Cycle */}
        
        {/* Central Core */}
        <motion.circle
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: REVEAL_DURATION, ease: EASE_OUT_EXPO }}
          cx="200"
          cy="200"
          r="30"
          fill="none"
          stroke={NOIR.gold}
          strokeWidth="2"
        />
        <motion.circle
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: REVEAL_DURATION, delay: STAGGER_GAP * 2 }}
          cx="200"
          cy="200"
          r="50"
          stroke={NOIR.goldLight}
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />

        {/* Circular Lifecycle Path (Clockwise Flow) */}
        <motion.circle
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: REVEAL_DURATION * 1.5, delay: STAGGER_GAP * 2, ease: EASE_OUT_EXPO }}
          cx="200"
          cy="200"
          r="120"
          stroke={NOIR.goldDark}
          strokeWidth="2.5"
          strokeDasharray="8 8"
        />

        {/* Directional Curved Arrows Connecting the 4 Phases */}
        {/* Top-Right Arc Arrow (Plan -> Code) */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: REVEAL_DURATION, delay: STAGGER_GAP * 4 }}
          d="M 230 84 A 120 120 0 0 1 316 170"
          stroke={NOIR.gold}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Arrowhead at (316, 170) */}
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: STAGGER_GAP * 5 }}
          d="M 310 152 L 318 174 L 296 170"
          stroke={NOIR.gold}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Bottom-Right Arc Arrow (Code -> Deploy) */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: REVEAL_DURATION, delay: STAGGER_GAP * 5 }}
          d="M 316 230 A 120 120 0 0 1 230 316"
          stroke={NOIR.goldLight}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Arrowhead at (230, 316) */}
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: STAGGER_GAP * 6 }}
          d="M 248 310 L 226 318 L 230 296"
          stroke={NOIR.goldLight}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Bottom-Left Arc Arrow (Deploy -> Monitor) */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: REVEAL_DURATION, delay: STAGGER_GAP * 6 }}
          d="M 170 316 A 120 120 0 0 1 84 230"
          stroke={NOIR.goldDark}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Arrowhead at (84, 230) */}
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: STAGGER_GAP * 7 }}
          d="M 90 248 L 82 226 L 104 230"
          stroke={NOIR.goldDark}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Top-Left Arc Arrow (Monitor -> Plan) */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: REVEAL_DURATION, delay: STAGGER_GAP * 7 }}
          d="M 84 170 A 120 120 0 0 1 170 84"
          stroke={NOIR.mist}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Arrowhead at (170, 84) */}
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: STAGGER_GAP * 8 }}
          d="M 152 90 L 174 82 L 170 104"
          stroke={NOIR.mist}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* 4 Abstract SDLC Phase Nodes */}
        {/* Phase 1: Architecture / Design (Top: x=200, y=80) */}
        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: STAGGER_GAP * 3, type: "spring" }}>
          <rect x="165" y="55" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.gold} strokeWidth="2" />
          <rect x="177" y="70" width="22" height="4" rx="2" fill={NOIR.goldLight} />
          <rect x="177" y="80" width="46" height="4" rx="2" fill={NOIR.mist} />
          <circle cx="218" cy="72" r="6" fill={NOIR.gold} />
        </motion.g>

        {/* Phase 2: Code / Build (Right: x=320, y=200) */}
        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: STAGGER_GAP * 4, type: "spring" }}>
          <rect x="295" y="175" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.goldLight} strokeWidth="2" />
          {/* Abstract Code brackets < /> */}
          <path d="M 315 192 L 308 200 L 315 208 M 345 192 L 352 200 L 345 208 M 332 190 L 328 210" stroke={NOIR.goldLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>

        {/* Phase 3: Test / Deploy (Bottom: x=200, y=320) */}
        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: STAGGER_GAP * 5, type: "spring" }}>
          <rect x="165" y="295" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.goldDark} strokeWidth="2" />
          {/* Abstract Check & Launch icon */}
          <path d="M 185 320 L 195 328 L 215 312" stroke={NOIR.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>

        {/* Phase 4: Operate / Monitor (Left: x=80, y=200) */}
        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: STAGGER_GAP * 6, type: "spring" }}>
          <rect x="35" y="175" width="70" height="50" rx="12" fill={NOIR.navyPanel} stroke={NOIR.mist} strokeWidth="2" />
          {/* Abstract Pulse wave */}
          <path d="M 48 200 L 58 200 L 63 190 L 70 210 L 77 195 L 82 200 L 92 200" stroke={NOIR.mist} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      </svg>
    );
  }
  if (id === "quant-research" || id === "service-quant") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.circle initial={{ opacity: 0, r: 0 }} animate={{ opacity: 1, r: 120 }} transition={{ duration: REVEAL_DURATION }} cx="200" cy="200" stroke={NOIR.gold} strokeWidth="2" strokeDasharray="4 4" />
        <motion.circle initial={{ opacity: 0, r: 0 }} animate={{ opacity: 1, r: 80 }} transition={{ duration: REVEAL_DURATION, delay: STAGGER_GAP * 2 }} cx="200" cy="200" stroke={NOIR.goldLight} strokeWidth="4" />
        <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: REVEAL_DURATION * 1.5, delay: STAGGER_GAP * 4 }} d="M50 200 Q 150 50, 200 200 T 350 200" stroke={NOIR.mist} strokeWidth="3" fill="transparent" />
      </svg>
    );
  }
  if (id === "data-science" || id === "service-data") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Bar 1 */}
        <motion.rect
          initial={{ height: 0, y: 350 }}
          animate={{ height: 90, y: 260 }}
          transition={{ duration: REVEAL_DURATION, ease: EASE_OUT_EXPO }}
          x="50"
          width="60"
          rx="8"
          fill={NOIR.goldDark}
        />
        {/* Bar 2 */}
        <motion.rect
          initial={{ height: 0, y: 350 }}
          animate={{ height: 180, y: 170 }}
          transition={{ duration: REVEAL_DURATION, delay: STAGGER_GAP * 2, ease: EASE_OUT_EXPO }}
          x="170"
          width="60"
          rx="8"
          fill={NOIR.gold}
        />
        {/* Bar 3 */}
        <motion.rect
          initial={{ height: 0, y: 350 }}
          animate={{ height: 270, y: 80 }}
          transition={{ duration: REVEAL_DURATION, delay: STAGGER_GAP * 4, ease: EASE_OUT_EXPO }}
          x="290"
          width="60"
          rx="8"
          fill={NOIR.goldLight}
        />

        {/* Upward Trend Graph Line (Positioned strictly over the boxes without overlapping) */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: REVEAL_DURATION * 1.3, delay: STAGGER_GAP * 5, ease: EASE_OUT_EXPO }}
          d="M 50 242.5 L 200 130 L 350 18"
          stroke={NOIR.gold}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Upward Direction Arrowhead */}
        <motion.path
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: STAGGER_GAP * 8, ease: EASE_OUT_EXPO }}
          d="M 326 18 H 350 V 42"
          stroke={NOIR.gold}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{ transformBox: "fill-box", transformOrigin: "top right" }}
        />

        {/* Graph Data Node Circles */}
        <motion.circle
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: STAGGER_GAP * 6 }}
          cx="80"
          cy="220"
          r="5"
          fill={NOIR.goldLight}
          stroke={NOIR.goldDark}
          strokeWidth="2"
        />
        <motion.circle
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: STAGGER_GAP * 7 }}
          cx="200"
          cy="130"
          r="5"
          fill={NOIR.goldLight}
          stroke={NOIR.goldDark}
          strokeWidth="2"
        />
        <motion.circle
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: STAGGER_GAP * 8 }}
          cx="320"
          cy="40"
          r="5"
          fill={NOIR.goldLight}
          stroke={NOIR.goldDark}
          strokeWidth="2"
        />
      </svg>
    );
  }
  // Support / DevOps: Single abstract terminal monitor with unintelligible code streams
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.g
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: REVEAL_DURATION, ease: EASE_OUT_EXPO }}
      >
        {/* Outer Glow Backdrop */}
        <rect x="50" y="75" width="300" height="250" rx="14" fill={NOIR.navyInk} stroke={NOIR.gold} strokeWidth="2.5" style={{ filter: "drop-shadow(0 12px 32px rgba(212,175,55,0.2))" }} />
        
        {/* Terminal Header */}
        <rect x="50" y="75" width="300" height="34" rx="14" fill={NOIR.navyPanel} />
        {/* Window dots. These were the macOS traffic lights (#FF5F56 / #FFBD2E /
            #27C93F) copied verbatim into a navy-and-gold brand — the most literal
            piece of template residue in the codebase. Re-cut in brand gold at
            descending opacity, which reads the same without borrowing Apple's. */}
        <circle cx="70" cy="92" r="4" fill={NOIR.gold} opacity="0.9" />
        <circle cx="84" cy="92" r="4" fill={NOIR.gold} opacity="0.55" />
        <circle cx="98" cy="92" r="4" fill={NOIR.gold} opacity="0.3" />
        <line x1="50" y1="109" x2="350" y2="109" stroke={NOIR.goldDark} strokeWidth="1" opacity="0.4" />

        {/* Abstract Terminal Code Stream (Represented purely as lines) */}
        {/* Line 1 */}
        <rect x="70" y="125" width="40" height="5" rx="2.5" fill={NOIR.goldLight} opacity="0.9" />
        <rect x="118" y="125" width="100" height="5" rx="2.5" fill={NOIR.mist} opacity="0.6" />
        <rect x="226" y="125" width="60" height="5" rx="2.5" fill={NOIR.goldDark} opacity="0.75" />

        {/* Line 2 */}
        <rect x="70" y="145" width="130" height="5" rx="2.5" fill={NOIR.goldDark} opacity="0.8" />
        <rect x="208" y="145" width="50" height="5" rx="2.5" fill={NOIR.goldLight} opacity="0.95" />
        <rect x="266" y="145" width="35" height="5" rx="2.5" fill={NOIR.mist} opacity="0.5" />

        {/* Line 3 (Indented block) */}
        <rect x="90" y="165" width="75" height="5" rx="2.5" fill={NOIR.gold} opacity="0.85" />
        <rect x="173" y="165" width="110" height="5" rx="2.5" fill={NOIR.mist} opacity="0.6" />

        {/* Line 4 (Indented block) */}
        <rect x="90" y="185" width="140" height="5" rx="2.5" fill={NOIR.goldLight} opacity="0.9" />
        <rect x="238" y="185" width="45" height="5" rx="2.5" fill={NOIR.goldDark} opacity="0.7" />

        {/* Line 5 (Nested block) */}
        <rect x="110" y="205" width="60" height="5" rx="2.5" fill={NOIR.gold} opacity="0.9" />
        <rect x="178" y="205" width="95" height="5" rx="2.5" fill={NOIR.mist} opacity="0.5" />

        {/* Line 6 */}
        <rect x="70" y="225" width="155" height="5" rx="2.5" fill={NOIR.goldDark} opacity="0.8" />
        <rect x="233" y="225" width="70" height="5" rx="2.5" fill={NOIR.goldLight} opacity="0.85" />

        {/* Line 7 */}
        <rect x="70" y="245" width="90" height="5" rx="2.5" fill={NOIR.mist} opacity="0.6" />
        <rect x="168" y="245" width="115" height="5" rx="2.5" fill={NOIR.gold} opacity="0.85" />

        {/* Line 8 & Blinking Cursor */}
        <rect x="70" y="265" width="110" height="5" rx="2.5" fill={NOIR.goldLight} opacity="0.9" />
        <rect x="188" y="260" width="8" height="13" fill={NOIR.goldLight}>
          <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite" />
        </rect>
      </motion.g>
    </svg>
  );
}

export function ServiceDrawer({ open, onClose, serviceId }: ServiceDrawerProps) {
  const service = CONTENT.services.find((s) => s.id === serviceId);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      transitionDuration={DRAWER_TRANSITION_MS}
      PaperProps={{
        sx: {
          width: "100vw",
          height: "100vh",
          bgcolor: "background.default",
          overflow: "hidden", // Disable scrolling
        },
      }}
    >
      <AnimatePresence mode="wait">
        {open && service && (
          <motion.div
            key={service.id}
            data-lenis-prevent
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: REVEAL_DURATION, ease: EASE_OUT_EXPO }}
            style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}
          >
            {/* Header */}
            <Box sx={{ p: 4, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="overline" sx={{ color: "primary.main", fontSize: "1rem" }}>
                Service Detail
              </Typography>
              <IconButton onClick={onClose} sx={{ color: "text.primary" }} size="large">
                <CloseIcon fontSize="large" />
              </IconButton>
            </Box>

            {/* Content Area */}
            <Box sx={{ flexGrow: 1, width: "100%", p: { xs: 4, md: 8 }, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
              <Grid container spacing={{ xs: 4, md: 8 }} sx={{ width: "100%", height: "100%", minHeight: { md: "520px" }, alignItems: "center" }}>
                {/* Text Content */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={4}>
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: STAGGER_GAP, duration: REVEAL_DURATION, ease: EASE_OUT_EXPO }}>
                      <Typography variant="h1" sx={{ color: "primary.main", mb: 2 }}>
                        {service.title}
                      </Typography>
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: STAGGER_GAP * 2, duration: REVEAL_DURATION, ease: EASE_OUT_EXPO }}>
                      <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                        {service.summary}
                      </Typography>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: STAGGER_GAP * 3, duration: REVEAL_DURATION, ease: EASE_OUT_EXPO }}>
                      <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.25rem", lineHeight: 1.8 }}>
                        {service.details}
                      </Typography>
                    </motion.div>

                    {service.techStack && (
                      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: STAGGER_GAP * 4, duration: REVEAL_DURATION, ease: EASE_OUT_EXPO }}>
                        <Box sx={{ mt: 4, pt: 4, borderTop: 1, borderColor: "divider" }}>
                          <Typography variant="overline" sx={{ color: "primary.main", mb: 2, display: "block" }}>
                            Baseline Tech Stack
                          </Typography>
                          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                            {service.techStack.map((tech, i) => (
                              <motion.div key={tech} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: STAGGER_GAP * 4 + (i * STAGGER_GAP), duration: 0.5, ease: EASE_OUT_EXPO }}>
                                <Typography sx={{ fontFamily: MONO, fontSize: "0.875rem", border: 1, borderColor: "divider", px: 2, py: 1, borderRadius: 1 }}>
                                  {tech}
                                </Typography>
                              </motion.div>
                            ))}
                          </Stack>
                        </Box>
                      </motion.div>
                    )}
                  </Stack>
                </Grid>

                {/* Visual Area */}
                <Grid size={{ xs: 12, md: 6 }} sx={{ width: "100%", height: "100%", minHeight: { md: "520px" }, display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <Box sx={{ width: "100%", height: "100%", minHeight: { md: "480px" }, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ServiceVector id={service.id} />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Back Button */}
            <IconButton 
              onClick={onClose} 
              sx={{ 
                position: 'absolute', 
                bottom: { xs: 24, md: 40 }, 
                left: { xs: 24, md: 40 },
                color: 'text.primary',
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                boxShadow: 2,
                '&:hover': { bgcolor: 'action.hover' }
              }} 
              size="large"
              aria-label="go back"
            >
              <ArrowBackIcon fontSize="large" />
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>
    </Drawer>
  );
}
