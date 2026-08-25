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

import { CONTENT } from "@/shared/content";
import { BrochureDrawer } from "@/shared/components/BrochureDrawer";
import { JobDetailsDrawer } from "@/shared/components/JobDetailsDrawer";
import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { MiniEstablishingShot } from "@/shared/components/establishing/MiniEstablishingShot";
import { aboutSection } from "@/shared/sections";
import { startLenis, stopLenis } from "@/shared/components/SmoothScroll";
import { useReducedMotion } from "@/shared/motion";
import { NOIR } from "@/shared/theme/palette";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";
import { MONO } from "@/shared/theme/theme";
import { useNavbarAnchor, NAV_ANCHORS } from "@/shared/components/NavbarContext";

/**
 * Card backgrounds, served from 1200px derivatives rather than the originals.
 *
 * These used to point straight at the full-resolution source photographs - the same
 * files the About page uses as full-bleed heroes. A ~400px card was pulling
 * `grads/FocusedProgramming.JPG` at **7.0 MB** and `AboutPageHero.png` at **2.3 MB**,
 * which together cost more than the entire JavaScript bundle: the home page transferred
 * 11.89 MB, of which ~11.6 MB was images (docs/perf-baseline.md).
 *
 * The derivatives in /images/careers are 1200px JPEGs - 11.4 MB down to 844 KB for the
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

export function CandidatesAndCareersSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [brochureOpen, setBrochureOpen] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string | null>(null);
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.ABOUT_CANDIDATES, { dark: false });

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

  const detailTransition = reducedMotion === true ? "none" : `opacity 0.35s ${EASE_OUT_EXPO_CSS}, transform 0.35s ${EASE_OUT_EXPO_CSS}`;
  const cardTransition = reducedMotion === true
    ? "border-color 0.2s ease"
    : `flex 0.5s ${EASE_OUT_EXPO_CSS}, height 0.5s ${EASE_OUT_EXPO_CSS}, border-color 0.3s ease`;
  const titleTransition = reducedMotion === true
    ? "none"
    : `transform 0.5s ${EASE_OUT_EXPO_CSS}, left 0.5s ${EASE_OUT_EXPO_CSS}, bottom 0.5s ${EASE_OUT_EXPO_CSS}`;

  return (
    <SectionBeat
      section={aboutSection("candidates")}
      muted
      // Was "Mini Establishing Shot 5" in routes/index.tsx; see CapabilityRack.
      establishing={
        <MiniEstablishingShot
          selfDriven={false}
          title="For talents that outgrow"
          titleAccent="large institutions"
          tracer="Work alongside extraordinary researchers, system architects, and algorithmic specialists."
        />
      }
    >
      {/* 1. Header Information Block */}
      <Grid ref={anchorRef} container spacing={4} sx={{ mb: { xs: 4, md: 6 } }} alignItems="flex-end" justifyContent="flex-end">
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
              "&:hover": {
                bgcolor: NOIR.goldLight,
              },
              transition: `background-color 0.3s ${EASE_OUT_EXPO_CSS}`,
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

          return (
            <Box
              key={job.title}
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
                transition: cardTransition,
              }}
            >
              {/* Slat Background Image - explicit dimensions via the flex/height
                  parent above, so no CLS from image load. */}
              <Box
                component="img"
                decoding="async"
                loading="lazy"
                src={bgImage}
                alt={job.title}
                sx={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              {/* Single scrim: one gradient layer carries both the legibility
                  contrast and the visual treatment - no second overlay on top. */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(10,42,102,0.95) 0%, rgba(10,42,102,0.6) 45%, rgba(10,42,102,0.25) 100%)",
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
                  color: "white",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    minHeight: isMobile ? "auto" : isActive ? "200px" : "360px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    transition: reducedMotion === true ? "none" : `min-height 0.5s ${EASE_OUT_EXPO_CSS}`,
                  }}
                >
                  {/* Details block: always mounted, faded/slid via transform+opacity
                      only (no framer motion.div, no mount/unmount). */}
                  <Box
                    aria-hidden={!isActive}
                    sx={{
                      width: "100%",
                      position: "absolute",
                      bottom: "45px",
                      left: 0,
                      right: 0,
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateX(0)" : "translateX(-16px)",
                      pointerEvents: isActive ? "auto" : "none",
                      transition: detailTransition,
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
                              color: NOIR.white,
                              border: "1px solid rgba(255, 255, 255, 0.45)",
                              borderRadius: 1,
                              height: "20px",
                              "& .MuiChip-label": { px: 0.8 },
                            }}
                          />
                        ))}
                      </Stack>

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
                        <span>View details and apply</span>
                        <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                      </Box>
                    </Stack>
                  </Box>

                  {/* Slat Title — flat in every state (WS-16 #6 removes the
                      rotate(-90deg)/rotate(0deg) inactive/active geometry).
                      Only size/weight now signal the active card; treatment
                      otherwise matches the description text below it. */}
                  <Typography
                    variant="h4"
                    component="h3"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: "1.25rem", sm: "1.4rem", md: isActive ? "1.65rem" : "1.25rem" },
                      lineHeight: 1.2,
                      whiteSpace: "normal",
                      position: isMobile ? "relative" : "absolute",
                      bottom: isMobile ? "auto" : "0px",
                      left: isMobile ? "auto" : "0px",
                      right: isMobile ? "auto" : "24px",
                      transition: titleTransition,
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
    </SectionBeat>
  );
}
