import { useCallback, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

import { CONTENT } from "@/shared/content";
import { useReducedMotion } from "@/shared/motion";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import { BrochureDrawer } from "@/shared/components/BrochureDrawer";
import { JobDetailsDrawer } from "@/shared/components/JobDetailsDrawer";
import { SectionLede } from "@/shared/components/SectionLede";
import { StageKicker, useStagePresence } from "@/shared/components/StageSection";
import { startLenis, stopLenis } from "@/shared/components/SmoothScroll";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { RawStage } from "./RawStage";

function TechChip({ label }: { label: string }) {
  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      sx={{
        fontFamily: MONO,
        fontSize: "0.7rem",
        letterSpacing: "0.08em",
        color: "text.secondary",
        borderColor: "divider",
        borderRadius: 1,
        transition: "all 0.2s ease",
        "&:hover": {
          color: "primary.main",
          borderColor: "primary.main",
          bgcolor: "action.hover",
        }
      }}
    />
  );
}

// Reticle corner marks framing the candidates panel.
const CORNERS = [
  { top: -1, left: -1, borderTop: 2, borderLeft: 2 },
  { top: -1, right: -1, borderTop: 2, borderRight: 2 },
  { bottom: -1, left: -1, borderBottom: 2, borderLeft: 2 },
  { bottom: -1, right: -1, borderBottom: 2, borderRight: 2 },
] as const;

/** Pin distance for the two-panel careers swap. Longer than daily-life's
 *  because it drives four phases across two panels, not three across one. */
const CAREERS_PIN_DISTANCE = "+=200%";

// Talent & Careers — Who We Look For and the Technical Graduate Program,
// swapped as two panels across one pinned scrub.
export function CandidatesAndCareersSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const panel1Ref = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);
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
  const reducedMotion = useReducedMotion();

  useStagePresence(sectionRef, "candidates");

  useGSAP(
    () => {
      if (reducedMotion || !sectionRef.current || !panel1Ref.current || !panel2Ref.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: CAREERS_PIN_DISTANCE,
          pin: true,
          scrub: SCROLL_SPEED,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Phase 1: Dwell on "Who We Look For"
      tl.to({}, { duration: 0.35 })
        // Phase 2: Panel 2 rises from bottom to center, pushing Panel 1 upward
        .to(
          panel1Ref.current,
          {
            yPercent: -100,
            autoAlpha: 0,
            ease: "power2.inOut",
            duration: 0.35,
          },
          "transition"
        )
        .fromTo(
          panel2Ref.current,
          {
            yPercent: -100,
            autoAlpha: 0,
          },
          {
            yPercent: 0,
            autoAlpha: 1,
            ease: "power2.inOut",
            duration: 0.35,
          },
          "transition"
        )
        // Phase 3: Dwell on Technical Graduate Program & Open Positions (0.7 -> 0.85)
        .to({}, { duration: 0.25 })
        // Phase 4: Soft Exit Slide Downward (0.85 -> 1.0)
        .to(panel2Ref.current, {
          yPercent: 100,
          autoAlpha: 0.2,
          ease: "power1.in",
          duration: 0.15,
        });
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <RawStage id="candidates" bgcolor="background.paper" ref={sectionRef}>
      <Container maxWidth="lg" sx={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>

        {/* Panel 1: Who We Look For */}
        <Box
          ref={panel1Ref}
          sx={{
            position: "absolute",
            width: "100%",
            maxWidth: 860,
            mx: "auto",
            px: { xs: 3, md: 8 },
            py: { xs: 5, md: 7 },
            textAlign: "center",
            willChange: "transform, opacity",
          }}
        >
          <Box sx={{ position: "relative", px: { xs: 2, md: 6 }, py: { xs: 5, md: 7 } }}>
            {CORNERS.map((corner, index) => (
              <Box
                key={`corner-${String(index)}`}
                aria-hidden
                sx={{
                  position: "absolute",
                  width: 24,
                  height: 24,
                  borderColor: NOIR.gold,
                  borderStyle: "solid",
                  borderWidth: 0,
                  ...corner,
                }}
              />
            ))}
            <Stack spacing={3} alignItems="center">
              <StageKicker index="10" label="Talent & Careers" />
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "1.8rem", sm: "2.5rem", md: "3rem" },
                  fontWeight: 700,
                  lineHeight: 1.25,
                  letterSpacing: "-0.02em",
                }}
              >
                {CONTENT.targetCandidates.line}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.95rem", md: "1.1rem" },
                  lineHeight: 1.6,
                  maxWidth: 720,
                }}
              >
                {CONTENT.targetCandidates.description}
              </Typography>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.78rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: NOIR.goldDark,
                  fontWeight: 600,
                }}
              >
                {CONTENT.targetCandidates.sub}
              </Typography>
            </Stack>
          </Box>
        </Box>

        {/* Panel 2: Technical Graduate Program & Open Positions */}
        <Box
          ref={panel2Ref}
          id="careers"
          data-lenis-prevent
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            width: "100%",
            height: "100%",
            maxHeight: "100vh",
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            py: { xs: 4, md: 6 },
            px: { xs: 1, sm: 2 },
            mx: "auto",
            willChange: "transform, opacity",
            scrollbarWidth: "thin",
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "divider",
              borderRadius: "3px",
            },
          }}
        >
          <Stack spacing={3.5}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "flex-end" }} spacing={2}>
              <Box>
                <SectionLede
                  gunshot={CONTENT.ledes.careers.gunshot}
                  tracer={CONTENT.ledes.careers.tracer}
                  eyebrow="Technical Graduate Program"
                />
              </Box>

              {/* Brochure PDF Full-Page Drawer Trigger Button */}
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
            </Stack>

            <Grid container spacing={2.5}>
              {CONTENT.careers.map((job) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={job.title}>
                  <Card
                    onClick={() => openJobDetails(job.title)}
                    sx={{
                      p: 1.5,
                      height: 1,
                      bgcolor: "background.default",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: "16px",
                      position: "relative",
                      cursor: "pointer",
                      transition: "border-color 0.3s ease",
                      "&:hover": { borderColor: "primary.main" },
                      "&:hover .click-details": { opacity: 0.5 },
                    }}
                  >
                    <CardContent sx={{ p: 2, pb: 4.5, "&:last-child": { pb: 4.5 } }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, fontSize: "1.15rem", mb: 1 }}>
                        {job.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.88rem", lineHeight: 1.5 }}>
                        {job.role}
                      </Typography>
                      {job.stack.length > 0 ? (
                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
                          {job.stack.map((tech) => (
                            <TechChip key={tech} label={tech} />
                          ))}
                        </Stack>
                      ) : null}
                    </CardContent>
                    <Typography
                      className="click-details"
                      sx={{
                        position: "absolute",
                        bottom: 12,
                        right: 16,
                        fontFamily: MONO,
                        fontSize: "0.68rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "text.primary",
                        opacity: 0,
                        transition: "opacity 0.3s ease",
                        pointerEvents: "none",
                      }}
                    >
                      Click for details →
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Box>

      </Container>

      {/* Full-Page Interactive Brochure PDF Drawer */}
      <BrochureDrawer
        open={brochureOpen}
        onClose={closeBrochure}
        pdfUrl="/pdfs/2026-Technical-Graduate-Program.pdf"
        title="2026 Technical Graduate Program Brochure"
      />

      {/* Full-Screen Right-to-Left Job Details Drawer */}
      <JobDetailsDrawer
        open={Boolean(selectedJobTitle)}
        jobTitle={selectedJobTitle}
        onClose={closeJobDetails}
      />
    </RawStage>
  );
}