import { NOIR } from "@/shared/theme/palette";
import { useRef, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ShieldIcon from "@mui/icons-material/Shield";
import VerifiedIcon from "@mui/icons-material/Verified";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { motion, AnimatePresence, useScroll } from "motion/react";

import { MONO } from "@/shared/theme/theme";
import { CONTENT } from "@/shared/content";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";
import { NAV_ANCHORS, useNavbarAnchor } from "@/shared/components/NavbarContext";

interface ValueItem {
  number: string;
  label: string;
  headline: string;
  definition: string;
  valueToClient: string;
  image: string;
  icon: React.ComponentType<{ sx?: object }>;
}

const VALUES_DATA: ValueItem[] = [
  {
    number: "01",
    label: CONTENT.principles.values[0]!.label,
    headline: "Unwavering Honesty & Ethical Engineering",
    definition: CONTENT.principles.values[0]!.definition,
    valueToClient: CONTENT.principles.values[0]!.valueToClient,
    image: "/images/software-engineer-banner.webp",
    icon: ShieldIcon,
  },
  {
    number: "02",
    label: CONTENT.principles.values[1]!.label,
    headline: "Complete Ownership of Commitments & Outcomes",
    definition: CONTENT.principles.values[1]!.definition,
    valueToClient: CONTENT.principles.values[1]!.valueToClient,
    image: "/images/grads/Coordination.webp",
    icon: VerifiedIcon,
  },
  {
    number: "03",
    label: CONTENT.principles.values[2]!.label,
    headline: "Anticipating Tomorrow Through Strategy & AI",
    definition: CONTENT.principles.values[2]!.definition,
    valueToClient: CONTENT.principles.values[2]!.valueToClient,
    image: "/images/quant-research-banner.webp",
    icon: TrendingUpIcon,
  },
  {
    number: "04",
    label: CONTENT.principles.values[3]!.label,
    headline: "Relentless Pursuit of Superior Engineering Standards",
    definition: CONTENT.principles.values[3]!.definition,
    valueToClient: CONTENT.principles.values[3]!.valueToClient,
    image: "/images/grads/FocusedProgramming.webp",
    icon: WorkspacePremiumIcon,
  },
];

export function PrinciplesValuesShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const valuesAnchorRef = useNavbarAnchor(NAV_ANCHORS.ABOUT_VALUES, { dark: false });
  const [activeIndex, setActiveIndex] = useState(0);

  // Track scroll through the 400vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      // Map 0 -> 1 progress to index 0 -> 3
      const idx = Math.min(
        VALUES_DATA.length - 1,
        Math.max(0, Math.floor(latest * VALUES_DATA.length))
      );
      setActiveIndex(idx);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const activeValue = VALUES_DATA[activeIndex]!;
  const Icon = activeValue.icon;

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        height: "400vh", // 400vh scroll height for 4 value stages
        width: "100%",
      }}
    >
      {/* Sentinel for Dark Navbar Mode */}
      <Box
        ref={valuesAnchorRef}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
        }}
      />
      {/* ── Pinned Still Screen (Sticky 100vh Viewport) ── */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          bgcolor: NOIR.void,
          color: NOIR.navyField,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          zIndex: 5,
        }}
      >


        <Container maxWidth="xl" sx={{ height: "100%", py: { xs: 4, md: 8 }, px: { xs: 3, md: 8 }, position: "relative", zIndex: 1 }}>
          <Stack spacing={{ xs: 4, md: 6 }} sx={{ height: "100%", justifyContent: "center" }}>
            {/* Section Overhead Title Bar */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pb: 2 }}>
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                <AutoAwesomeIcon sx={{ color: "var(--accent-ink)", fontSize: "1.2rem" }} />
                <Typography
                  variant="overline"
                  sx={{
                    color: "var(--accent-ink)",
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                    fontSize: "0.85rem",
                    fontFamily: MONO,
                  }}
                >
                  ROOTED IN VALUES // CORE PRINCIPLES
                </Typography>
              </Box>

              <Typography variant="caption" sx={{ fontFamily: MONO, color: "rgba(10, 42, 102, 0.82)", fontSize: "0.78rem" }}>
                SCROLL TO EXPLORE ({activeIndex + 1} / {VALUES_DATA.length})
              </Typography>
            </Stack>

            {/* Split Screen Stage: Left Content vs Right Floating Image */}
            <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
              {/* Left Column: Vertical Sliding Text Content */}
              <Grid size={{ xs: 12, md: 6 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeValue.number}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                  >
                    <Stack spacing={3.5}>
                      {/* Value Number & Badge */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box
                          sx={{
                            width: 54,
                            height: 54,
                            borderRadius: 3,
                            bgcolor: NOIR.gold,
                            color: NOIR.navyField,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 8px 24px rgba(10, 42, 102, 0.15)",
                          }}
                        >
                          <Icon sx={{ fontSize: "1.8rem" }} />
                        </Box>
                        <Typography
                          variant="h3"
                          component="span"
                          sx={{
                            fontFamily: MONO,
                            fontWeight: 800,
                            color: "var(--accent-ink)",
                            fontSize: "1.5rem",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {activeValue.number} — {activeValue.label.toUpperCase()}
                        </Typography>
                      </Box>

                      {/* Main Headline */}
                      <Typography variant="h2" component="h2" sx={{ fontWeight: 800, color: NOIR.navyField, fontSize: { xs: "1.8rem", md: "2.5rem" }, lineHeight: 1.2 }}>
                        {activeValue.headline}
                      </Typography>

                      {/* Commitment / Value-to-client — WS-16 #1: one row
                          divided by a hairline instead of two stacked,
                          re-bordered cells (the containerization WS-01
                          removed sitewide). */}
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={{ xs: 3, md: 4 }}
                        sx={{ pt: 1 }}
                      >
                        <Box
                          sx={{
                            flex: 1,
                            pb: { xs: 3, md: 0 },
                            pr: { xs: 0, md: 4 },
                            borderBottom: { xs: "1px solid rgba(10, 42, 102, 0.14)", md: "none" },
                            borderRight: { xs: "none", md: "1px solid rgba(10, 42, 102, 0.14)" },
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: MONO,
                              fontWeight: 800,
                              color: "var(--accent-ink)",
                              fontSize: "0.72rem",
                              letterSpacing: "0.12em",
                              display: "block",
                              mb: 1,
                            }}
                          >
                            OUR COMMITMENT
                          </Typography>
                          <Typography variant="body1" sx={{ color: NOIR.navyField, fontSize: "1.08rem", lineHeight: 1.65, fontWeight: 500 }}>
                            "{activeValue.definition}"
                          </Typography>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: MONO,
                              fontWeight: 800,
                              color: NOIR.navyField,
                              fontSize: "0.72rem",
                              letterSpacing: "0.12em",
                              display: "block",
                              mb: 1,
                            }}
                          >
                            VALUE DELIVERED TO CLIENTS
                          </Typography>
                          <Typography variant="body1" sx={{ color: NOIR.navyField, fontSize: "1.02rem", lineHeight: 1.65, fontWeight: 500 }}>
                            {activeValue.valueToClient}
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </motion.div>
                </AnimatePresence>
              </Grid>

              {/* Right Column: Vertical Sliding Image Stage */}
              <Grid size={{ xs: 12, md: 6 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeValue.number}
                    initial={{ opacity: 0, y: 60, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -60, scale: 0.96 }}
                    transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: { xs: "16/10", md: "16/11" },
                        borderRadius: { xs: 5, md: 8 },
                        overflow: "hidden",
                        border: "1px solid rgba(var(--accent-rgb), 0.3)",
                        boxShadow: "0 12px 40px rgba(10, 42, 102, 0.15)",
                        transform: "translateZ(0)",
                        WebkitTransform: "translateZ(0)",
                        willChange: "transform, opacity, box-shadow",
                      }}
                    >
                      <Box
                        component="img" decoding="async" loading="lazy"
                        src={activeValue.image}
                        alt={activeValue.label}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(to top, rgba(6, 24, 59, 0.8) 0%, transparent 60%)",
                        }}
                      />
                    </Box>
                  </motion.div>
                </AnimatePresence>
              </Grid>
            </Grid>

            {/* Bottom Progress Step Indicator */}
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ pt: 2 }}>
              {VALUES_DATA.map((item, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <Box
                    key={item.number}
                    onClick={() => {
                      if (containerRef.current) {
                        const top = containerRef.current.offsetTop;
                        const height = containerRef.current.offsetHeight;
                        const targetY = top + (idx / VALUES_DATA.length) * height;
                        window.scrollTo({ top: targetY, behavior: "smooth" });
                      }
                    }}
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 2,
                      py: 1,
                      borderRadius: 4,
                      bgcolor: isActive ? NOIR.gold : "rgba(10, 42, 102, 0.06)",
                      color: isActive ? NOIR.navyField : "rgba(10, 42, 102, 0.72)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: isActive ? NOIR.navyField : "rgba(10, 42, 102, 0.4)",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: MONO,
                        fontWeight: 800,
                        fontSize: "0.78rem",
                      }}
                    >
                      {item.number} {item.label.toUpperCase()}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
