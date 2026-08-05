import { useCallback, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { motion, AnimatePresence } from "motion/react";

import { CONTENT } from "@/shared/content";
import { BrochureDrawer } from "@/shared/components/BrochureDrawer";
import { JobDetailsDrawer } from "@/shared/components/JobDetailsDrawer";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { startLenis, stopLenis } from "@/shared/components/SmoothScroll";
import { NOIR } from "@/shared/theme/palette";
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
  "Quantitative Researcher": "/images/careers/quant-research-banner.jpg",
  "Software Engineer": "/images/careers/software-engineer-banner.jpg",
  "Full Stack Developer": "/images/careers/AboutPageHero.jpg",
  "Data Scientist": "/images/careers/data-science-banner.jpg",
  "DevOps Engineer": "/images/careers/ops-support-banner.jpg",
  "R&D Internship Program": "/images/careers/FocusedProgramming.jpg",
};

/** Fallback when a role has no mapped image. */
const CAREER_BG_FALLBACK = "/images/careers/AboutPageHero.jpg";

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
                  color: NOIR.goldDark,
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

            {/* Intake detail and system impact callout */}
            <Box
              sx={{
                borderLeft: 3,
                borderColor: NOIR.gold,
                pl: 2,
                py: 0.5,
                mt: 1,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontStyle: "italic",
                  lineHeight: 1.6,
                  fontSize: "0.95rem",
                }}
              >
                {CONTENT.ledes.careers.tracer}
              </Typography>
            </Box>
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
            variant="outlined"
            color="primary"
            onClick={openBrochure}
            startIcon={<PictureAsPdfIcon />}
            sx={{
              borderRadius: "100px",
              px: 3,
              py: 1.2,
              fontWeight: 600,
              fontSize: "0.85rem",
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.4),
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
              "&:hover": {
                bgcolor: "primary.main",
                color: "white",
                borderColor: "primary.main",
              },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
                transition: "flex 0.5s cubic-bezier(0.25, 1, 0.5, 1), height 0.5s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.3s ease",
                boxShadow: isActive ? "0 20px 45px rgba(10,42,102,0.22)" : "0 4px 10px rgba(0,0,0,0.03)",
                "&:hover .arrow-icon": {
                  transform: "translateY(-4px)",
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
                  transition: "transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)",
                }}
              />

              {/* Slat Hover Primary Blue Layer Overlay */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  bgcolor: "#0A2A66",
                  opacity: isActive ? 0.35 : 0.85,
                  transition: "opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
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

                {/* Slat Title & Information Wrapper (Stationed at bottom) */}
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    minHeight: isMobile ? "auto" : isActive ? "200px" : "360px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    transition: "min-height 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
                  }}
                >
                  {/* Faded Details (Stationed statically above the title when expanded) */}
                  <Box
                    sx={{
                      width: "100%",
                      mb: isMobile ? 0 : isActive ? 5.5 : 0,
                      transition: "margin 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
                    }}
                  >
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, x: -24, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: "auto" }}
                          exit={{ opacity: 0, x: -24, height: 0 }}
                          transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
                        >
                          <Stack spacing={2} sx={{ pb: 0.5 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                opacity: 0.9,
                                fontSize: "0.88rem",
                                lineHeight: 1.55,
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {job.role}
                            </Typography>

                            {/* Tech Stack Chips */}
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                              {job.stack.map((tech) => (
                                <Chip
                                  key={tech}
                                  label={tech}
                                  size="small"
                                  sx={{
                                    fontFamily: MONO,
                                    fontSize: "0.65rem",
                                    bgcolor: "rgba(10, 42, 102, 0.08)",
                                    color: "#0A2A66",
                                    border: "1px solid rgba(10, 42, 102, 0.18)",
                                    borderRadius: 1,
                                    height: "22px",
                                    "& .MuiChip-label": { px: 1 },
                                  }}
                                />
                              ))}
                            </Stack>

                            {/* Interactive "pointing upwards" CTA */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.2,
                                color: NOIR.gold,
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                textTransform: "uppercase",
                                fontFamily: MONO,
                                pt: 0.5,
                              }}
                            >
                              <span>View details & apply</span>
                              <ArrowUpwardIcon
                                sx={{
                                  fontSize: 16,
                                  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                                className="arrow-icon"
                              />
                            </Box>
                          </Stack>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Box>

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
                      transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), left 0.5s cubic-bezier(0.25, 1, 0.5, 1), bottom 0.5s cubic-bezier(0.25, 1, 0.5, 1), right 0.5s, font-size 0.3s ease",
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