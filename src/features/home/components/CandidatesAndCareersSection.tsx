import { useCallback, useState } from "react";
import Box from "@mui/material/Box";
import { SpecularButton as Button } from "@/shared/components/ui/specular";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { motion } from "motion/react";

import { CONTENT } from "@/shared/content";
import { BrochureDrawer } from "@/shared/components/BrochureDrawer";
import { JobDetailsDrawer } from "@/shared/components/JobDetailsDrawer";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { startLenis, stopLenis } from "@/shared/components/SmoothScroll";
import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";
import { MONO } from "@/shared/theme/theme";

/**
 * Card backgrounds, served from 1200px derivatives rather than the originals.
 *
 * These used to point straight at the full-resolution source photographs — the same
 * files the About page uses as full-bleed heroes. A ~400px card was pulling
 * `grads/FocusedProgramming.JPG` at **7.0 MB** and `AboutPageHero.png` at **2.3 MB**,
 * which together cost more than the entire JavaScript bundle: the home page transferred
 * 11.89 MB, of which ~11.6 MB was images (docs/perf-baseline.md).
 *
 * The derivatives in /images/careers are 1200px JPEGs — 11.4 MB down to 844 KB for the
 * set. Regenerate with:
 *   sips -s format jpeg -s formatOptions 68 -Z 1200 <src> --out public/images/careers/<name>.jpg
 */
const CAREER_BG_IMAGES: Record<string, string> = {
  "Quantitative Researcher": "/images/careers/quant-research-banner.webp",
  "Software Engineer": "/images/careers/software-engineer-banner.webp",
  "Full Stack Developer": "/images/careers/AboutPageHero.webp",
  "Data Scientist": "/images/careers/data-science-banner.webp",
  "DevOps Engineer": "/images/careers/ops-support-banner.webp",
  "R&D Internship Program": "/images/careers/FocusedProgramming.webp",
};

/** Fallback when a role has no mapped image. */
const CAREER_BG_FALLBACK = "/images/careers/AboutPageHero.webp";

const CAREER_BADGES: Record<string, string> = {
  "Quantitative Researcher": "QUANT & AI",
  "Software Engineer": "LOW-LATENCY CORE",
  "Full Stack Developer": "FULL-STACK SAAS",
  "Data Scientist": "DATA LAKES & ETL",
  "DevOps Engineer": "CLOUD & SRE",
  "R&D Internship Program": "PAID INTERNSHIP",
};

export function CandidatesAndCareersSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [brochureOpen, setBrochureOpen] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string | null>(null);

  const openBrochure = useCallback(() => {
    stopLenis();
    setBrochureOpen(true);
  }, []);

  const closeBrochure = useCallback(() => {
    setBrochureOpen(false);
    startLenis();
  }, []);

  const openJobDetails = useCallback((title: string) => {
    stopLenis();
    setSelectedJobTitle(title);
  }, []);

  const closeJobDetails = useCallback(() => {
    setSelectedJobTitle(null);
    startLenis();
  }, []);

  return (
    <StageSection section={homeSection("candidates")} muted>
      {/* 1. Header Information Block */}
      <Grid container spacing={4} sx={{ mb: { xs: 4, md: 6 } }} alignItems="flex-end">
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            {/* Section Eyebrow / Sub-kicker */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.78rem",
                  color: "var(--accent-fg)",
                  letterSpacing: "0.2em",
                  fontWeight: 700,
                }}
              >
                TALENT & CAREERS
              </Typography>
              <Box sx={{ width: 16, height: "1px", bgcolor: NOIR.gold }} />
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.78rem",
                  color: "text.secondary",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                {CONTENT.targetCandidates.sub}
              </Typography>
            </Box>

            {/* Who We Look For Title */}
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3.2rem" },
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: "text.primary",
              }}
            >
              {CONTENT.targetCandidates.line}
            </Typography>

            {/* Description Paragraph */}
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: "1.08rem",
                lineHeight: 1.65,
                maxWidth: 820,
              }}
            >
              {CONTENT.targetCandidates.description}
            </Typography>

          </Stack>
        </Grid>

        {/* Brochure Download Button */}
        <Grid
          size={{ xs: 12, md: 4 }}
          sx={{
            display: "flex",
            justifyContent: { xs: "flex-start", md: "flex-end" },
            alignItems: "center",
          }}
        >
          <Button
            variant="contained"
            onClick={openBrochure}
            startIcon={<PictureAsPdfIcon />}
            sx={{
              borderRadius: "100px",
              px: 3.5,
              py: 1.2,
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: "0.78rem",
              bgcolor: NOIR.gold,
              color: NOIR.navyInk,
              boxShadow: "0 4px 14px rgba(var(--accent-rgb), 0.25)",
              "&:hover": {
                bgcolor: NOIR.goldLight,
                boxShadow: "0 6px 18px rgba(var(--accent-rgb), 0.4)",
              },
              "&:active": {
                transform: "scale(0.98)",
              },
              transition: `all 0.3s ${EASE_OUT_EXPO_CSS}`,
              whiteSpace: "nowrap",
            }}
          >
            View Program Brochure (PDF)
          </Button>
        </Grid>
      </Grid>

      {/* 2. Interactive Slat Row Component */}
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 2,
          height: isMobile ? "auto" : "550px",
          width: "100%",
          mt: 4,
        }}
      >
        {CONTENT.careers.map((job, index) => {
          const isActive = activeIndex === index;
          const bgImage = CAREER_BG_IMAGES[job.title] ?? CAREER_BG_FALLBACK;
          const badge = CAREER_BADGES[job.title] || "OPEN ROLE";

          return (
            <Box
              key={job.title}
              component={motion.div}
              layout
              onMouseEnter={() => !isMobile && setActiveIndex(index)}
              onClick={() => {
                if (isMobile) {
                  if (isActive) {
                    openJobDetails(job.title);
                  } else {
                    setActiveIndex(index);
                  }
                } else {
                  openJobDetails(job.title);
                }
              }}
              sx={{
                position: "relative",
                flex: isMobile ? "none" : isActive ? 3.5 : 1,
                height: isMobile ? (isActive ? "320px" : "90px") : "100%",
                borderRadius: "20px",
                overflow: "hidden",
                cursor: "pointer",
                border: "1px solid",
                borderColor: isActive ? NOIR.gold : "divider",
                transition: `flex 0.5s ${EASE_OUT_EXPO_CSS}, height 0.5s ${EASE_OUT_EXPO_CSS}, border-color 0.3s ease`,
                boxShadow: isActive ? "0 20px 45px rgba(10,42,102,0.22)" : "0 4px 10px rgba(0,0,0,0.03)",
                "&:hover .arrow-icon": {
                  transform: "translateX(4px)",
                },
              }}
            >
              {/* Slat Background Image */}
              <Box
                component="img" decoding="async" loading="lazy"
                src={bgImage}
                alt={job.title}
                sx={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: isActive ? "scale(1.04)" : "scale(1)",
                  transition: `transform 0.8s ${EASE_OUT_EXPO_CSS}`,
                }}
              />

              {/* Slat Hover Primary Blue Layer Overlay */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  bgcolor: "#0A2A66",
                  opacity: isActive ? 0.35 : 0.85,
                  transition: `opacity 0.5s ${EASE_OUT_EXPO_CSS}`,
                  zIndex: 1,
                }}
              />

              {/* Slat Text & Interactive Overlay */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  p: { xs: 2.5, md: 3.5 },
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  zIndex: 2,
                  background: "linear-gradient(to top, rgba(10, 42, 102, 0.95) 0%, rgba(10, 42, 102, 0.3) 60%, transparent 100%)",
                  color: "white",
                }}
              >
                {/* Top Badge Info */}
                <Box
                  sx={{
                    mb: "auto",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: "0.68rem",
                      letterSpacing: "0.15em",
                      color: isActive ? NOIR.gold : "rgba(255,255,255,0.7)",
                      fontWeight: 800,
                      textTransform: "uppercase",
                    }}
                  >
                    {badge}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: "0.72rem",
                      color: "rgba(255,255,255,0.62)",
                    }}
                  >
                    0{index + 1}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    minHeight: isMobile ? "auto" : isActive ? "200px" : "360px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    transition: `min-height 0.5s ${EASE_OUT_EXPO_CSS}`,
                  }}
                >
                  {/* Faded Details — positioned absolute above the title when expanded so they do not push the header position */}
                  {isActive && (
                    <Box
                      component={motion.div}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
                      sx={{
                        width: "100%",
                        position: "absolute",
                        bottom: "45px", // Anchored above the title header
                        left: 0,
                        right: 0,
                      }}
                    >
                      <Stack spacing={1.5} sx={{ pb: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            opacity: 0.9,
                            fontSize: "0.85rem",
                            lineHeight: 1.45,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            color: "rgba(255, 255, 255, 0.92)",
                          }}
                        >
                          {job.role}
                        </Typography>

                        {/* Tech Stack Chips — high contrast text and border */}
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          {job.stack.map((tech) => (
                            <Chip
                              key={tech}
                              label={tech}
                              size="small"
                              sx={{
                                fontFamily: MONO,
                                fontSize: "0.62rem",
                                bgcolor: "rgba(255, 255, 255, 0.15)",
                                color: "#ffffff",
                                border: "1px solid rgba(255, 255, 255, 0.45)",
                                borderRadius: 1,
                                height: "20px",
                                "& .MuiChip-label": { px: 0.8 },
                              }}
                            />
                          ))}
                        </Stack>

                        {/* Interactive "pointing upwards" CTA */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: NOIR.gold,
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            textTransform: "uppercase",
                            fontFamily: MONO,
                            pt: 0.2,
                          }}
                        >
                          <span>View details & apply</span>
                          <ArrowUpwardIcon
                            sx={{
                              fontSize: 14,
                              transition: `transform 0.3s ${EASE_OUT_EXPO_CSS}`,
                            }}
                            className="arrow-icon"
                          />
                        </Box>
                      </Stack>
                    </Box>
                  )}

                  {/* Slat Title (Inverted 90 degrees when inactive, rotates back on active) */}
                  <Typography
                    variant="h4"
                    component="h3"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: "1.25rem", sm: "1.4rem", md: isActive ? "1.65rem" : "1.25rem" },
                      lineHeight: 1.2,
                      whiteSpace: isMobile ? "normal" : isActive ? "normal" : "nowrap",
                      transform: isMobile ? "none" : isActive ? "rotate(0deg)" : "rotate(-90deg)",
                      transformOrigin: "left bottom",
                      position: isMobile ? "relative" : "absolute",
                      bottom: isMobile ? "auto" : isActive ? "0px" : "15px",
                      left: isMobile ? "auto" : isActive ? "0px" : "calc(50% - 8px)",
                      right: isMobile ? "auto" : isActive ? "24px" : "auto",
                      transition: `transform 0.5s ${EASE_OUT_EXPO_CSS}, left 0.5s ${EASE_OUT_EXPO_CSS}, bottom 0.5s ${EASE_OUT_EXPO_CSS}, right 0.5s, font-size 0.3s ease`,
                      textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    {job.title}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* 3. Brochure Drawer Modal */}
      <BrochureDrawer
        open={brochureOpen}
        onClose={closeBrochure}
        pdfUrl="/pdfs/2026-Technical-Graduate-Program.pdf"
        title="2026 Technical Graduate Program Brochure"
      />

      {/* 4. Job Details Right Drawer Modal */}
      <JobDetailsDrawer
        open={Boolean(selectedJobTitle)}
        jobTitle={selectedJobTitle}
        onClose={closeJobDetails}
      />
    </StageSection>
  );
}