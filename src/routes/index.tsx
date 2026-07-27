import { useState, useRef, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import CardActionArea from "@mui/material/CardActionArea";
import Slider from "@mui/material/Slider";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CONTENT } from "@/shared/content";
import { blogPostsQuery } from "@/features/blog/api";
import { FALLBACK_BLOG_PAGE } from "@/features/blog/fallback";

import { EyeFlow } from "@/shared/components/EyeFlow";
import { Reveal } from "@/shared/components/Reveal";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";
import { UseCasesNarrative } from "@/features/services/components/UseCasesNarrative";
import { SuperHeroSequence } from "@/features/hero/SuperHeroSequence";
import { StatStrip } from "@/shared/components/StatStrip";

import { ReachMap } from "@/shared/components/ReachMap";
import { RouterButton } from "@/shared/components/RouterLink";
import { ProcessDiagram } from "@/shared/components/diagrams/ProcessDiagram";
import { SmoothScroll, stopLenis, startLenis } from "@/shared/components/SmoothScroll";
import { BrochureDrawer } from "@/shared/components/BrochureDrawer";
import { JobDetailsDrawer } from "@/shared/components/JobDetailsDrawer";
import { useSectionPaging } from "@/shared/components/SectionPaging";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import { STAGE_ENTER_DURATION, STAGE_HOLD_DURATION, STAGE_EXIT_DURATION } from "@/shared/components/stageChoreo";
import { StageKicker, StageSection, useStagePresence } from "@/shared/components/StageSection";
import { homeSection, STAGE_ATTR } from "@/shared/sections";
import { pageHead } from "@/shared/seo";
import { useNavbarAnchor } from "@/shared/components/NavbarContext";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { alpha } from "@mui/material/styles";

gsap.registerPlugin(ScrollTrigger);




// NOTE: no gsap/lenis imports at route-module scope — the route file's module
// stays in the eager bundle even with autoCodeSplitting; scroll wiring lives
// in <SmoothScroll /> so those libraries ride the lazy home chunk.

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Phitopolis — FinTech Engineering & Quantitative R&D",
      "A financial-sciences and engineering powerhouse turning global markets into deployable technology.",
    ),
  component: HomePage,
});

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

// Section 2 removed per user request





// Section 4: How We Work
function ProcessSection() {
  return (
    <StageSection section={homeSection("process")} muted>
      <Reveal>
        <Typography variant="h2" component="h2">
          From problem to production
        </Typography>
      </Reveal>
      <ProcessDiagram steps={CONTENT.process} />
    </StageSection>
  );
}

// Section 6: Global Reach
function ReachSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion || !containerRef.current || !cardRef.current) return;

      gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 65%",
          end: "bottom 25%",
          scrub: 1,
        },
      })
      .fromTo(
        cardRef.current,
        { scale: 0.95 },
        { scale: 1.08, ease: "power1.out", duration: 0.5 }
      )
      .to(
        cardRef.current,
        { scale: 1.0, ease: "power1.in", duration: 0.5 }
      );
    },
    { scope: containerRef, dependencies: [reducedMotion] }
  );

  return (
    <Box ref={containerRef}>
      <StageSection section={homeSection("reach")} muted>
        <Reveal>
          <Typography variant="h2" component="h2">
            International presence
          </Typography>
        </Reveal>
        <Reveal delay={0.1}>
          <Box
            ref={cardRef}
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "background.paper",
              transformOrigin: "center center",
              willChange: "transform",
            }}
          >
            <ReachMap />
          </Box>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.7rem",
              letterSpacing: "0.14em",
              color: "text.secondary",
              mt: 2,
            }}
          >
            ARCS DENOTE CLIENTS AND INVESTORS
          </Typography>
        </Reveal>
      </StageSection>
    </Box>
  );
}

// Helper to format video durations
const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

// Section 7: Daily Life Video Section
function DailyLifeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const reducedMotion = useReducedMotion();

  useStagePresence(sectionRef, "daily-life");
  const videoAnchorRef = useNavbarAnchor("daily-life-video", { dark: true, rootMargin: "-250px 0px 0px 0px" });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;

        if (entry.isIntersecting) {
          if (!videoLoaded) {
            setVideoLoaded(true);
          } else if (videoRef.current && isPlaying) {
            void videoRef.current.play().catch(() => { });
          }
        } else {
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [videoLoaded, isPlaying]);

  useGSAP(
    () => {
      if (reducedMotion || !sectionRef.current || !cardRef.current) return;

      const isMobile = window.matchMedia("(max-width: 599.95px)").matches;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=140%",
          pin: true,
          scrub: SCROLL_SPEED,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Phase 1: Soft Stage Entrance & Smooth Expansion (matches STAGE_ENTER_DURATION)
      tl.fromTo(
        cardRef.current,
        {
          autoAlpha: 0.25,
          scale: 0.92,
          y: 40,
          xPercent: isMobile ? -5 : -12,
          width: isMobile ? "88vw" : "72vw",
          height: isMobile ? "50vh" : "65vh",
          borderRadius: isMobile ? "16px" : "24px",
          boxShadow: "0 20px 50px rgba(10,42,102,0.3)",
        },
        {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          xPercent: 0,
          width: "100vw",
          height: "100vh",
          borderRadius: "0px",
          boxShadow: "none",
          ease: "power2.out",
          duration: STAGE_ENTER_DURATION,
        }
      )
        // Phase 2: Immersive Center Dwell / Hold (matches STAGE_HOLD_DURATION)
        .to({}, { duration: STAGE_HOLD_DURATION })
        // Phase 3: Soft Exit Recede (matches STAGE_EXIT_DURATION)
        .to(cardRef.current, {
          autoAlpha: 0.2,
          scale: 0.94,
          y: -40,
          ease: "power1.in",
          duration: STAGE_EXIT_DURATION,
        });
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      void videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (_event: any, newValue: number | number[]) => {
    const time = newValue as number;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (_event: any, newValue: number | number[]) => {
    const val = newValue as number;
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  return (
    <Box
      component="section"
      ref={sectionRef}
      id="daily-life"
      {...{ [STAGE_ATTR]: "" }}
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        bgcolor: "primary.main",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderTop: 1,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box ref={videoAnchorRef} sx={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <Box
        ref={cardRef}
        sx={{
          position: "relative",
          overflow: "hidden",
          bgcolor: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid",
          borderColor: (theme) => alpha(theme.palette.divider, 0.25),
          willChange: "transform, width, height, border-radius",
        }}
      >
        <Box
          component="video"
          ref={videoRef}
          src={videoLoaded ? "/videos/daily-life.mp4" : undefined}
          preload="none"
          autoPlay
          muted
          loop
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* Vignette & Content Overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.65) 100%)",
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: { xs: 3, sm: 5, md: 7 },
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ mt: { xs: 1, sm: 2, md: 3 } }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="overline" sx={{ color: "secondary.main", fontWeight: 700 }}>
                  Daily Life
                </Typography>
                <Box
                  className="stage-kicker-line"
                  sx={{
                    height: "1px",
                    width: { xs: 60, sm: 120 },
                    background: "rgba(255, 255, 255, 0.3)",
                    transformOrigin: "left center",
                  }}
                />
              </Stack>
              <Typography
                variant="h3"
                component="h3"
                sx={{
                  color: "common.white",
                  fontWeight: 700,
                  fontSize: { xs: "1.5rem", sm: "2.2rem", md: "3rem" },
                  letterSpacing: "-0.02em",
                }}
              >
                People Behind the Innovation
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={2} sx={{ width: "100%" }}>
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255,255,255,0.9)",
                maxWidth: 640,
                fontSize: { xs: "0.85rem", sm: "1rem", md: "1.15rem" },
                lineHeight: 1.5,
              }}
            >
              Experience our culture, collaborative R&D spirit, and the everyday moments that fuel technology breakthroughs.
            </Typography>

            {/* Control Bar */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{
                pointerEvents: "auto",
                width: "100%",
                boxSizing: "border-box",
                mt: 1,
              }}
            >
              <IconButton
                onClick={togglePlay}
                size="small"
                sx={{
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                }}
              >
                {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
              </IconButton>

              {/* Progress Slider */}
              <Slider
                size="small"
                value={currentTime}
                min={0}
                max={duration || 100}
                onChange={handleSeek}
                sx={{
                  color: NOIR.gold,
                  flexGrow: 1,
                  mx: { xs: 0.5, md: 1 },
                  py: 1,
                  "& .MuiSlider-thumb": {
                    width: 8,
                    height: 8,
                    backgroundColor: NOIR.gold,
                    "&:hover, &.Mui-focusVisible": {
                      boxShadow: "0px 0px 0px 6px rgba(255, 199, 44, 0.12)",
                    },
                  },
                  "& .MuiSlider-rail": {
                    opacity: 0.3,
                    bgcolor: "rgba(255, 255, 255, 0.5)",
                  },
                  "& .MuiSlider-track": {
                    bgcolor: NOIR.gold,
                    border: "none",
                  },
                }}
              />

              {/* Time display */}
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: MONO,
                  fontSize: "0.75rem",
                  minWidth: "90px",
                  whiteSpace: "nowrap",
                  textAlign: "right",
                }}
              >
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>

              <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.15)", mx: 0.5 }} />

              {/* Volume Control (Hover Vertical Popover) */}
              <Box
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
                sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    bottom: "36px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    height: 90,
                    bgcolor: "rgba(0, 0, 0, 0.8)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "8px",
                    py: 1.5,
                    px: 1,
                    display: showVolumeSlider ? "flex" : "none",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <Slider
                    size="small"
                    orientation="vertical"
                    value={isMuted ? 0 : volume}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={handleVolumeChange}
                    sx={{
                      color: "white",
                      height: 60,
                      "& .MuiSlider-thumb": {
                        width: 8,
                        height: 8,
                        backgroundColor: "white",
                      },
                      "& .MuiSlider-rail": {
                        opacity: 0.3,
                        bgcolor: "rgba(255, 255, 255, 0.5)",
                      },
                      "& .MuiSlider-track": {
                        bgcolor: "white",
                        border: "none",
                      },
                    }}
                  />
                </Box>

                <IconButton
                  onClick={toggleMute}
                  size="small"
                  sx={{
                    color: "white",
                    bgcolor: "rgba(255,255,255,0.1)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                  }}
                >
                  {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                </IconButton>
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

// Section 8: Target Candidates — reticle frame, short line.
const CORNERS = [
  { top: -1, left: -1, borderTop: 2, borderLeft: 2 },
  { top: -1, right: -1, borderTop: 2, borderRight: 2 },
  { bottom: -1, left: -1, borderBottom: 2, borderLeft: 2 },
  { bottom: -1, right: -1, borderBottom: 2, borderRight: 2 },
] as const;

// Section 8 & 9 Merged: Who We Look For & Technical Graduate Program
function CandidatesAndCareersSection() {
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
          end: "+=200%",
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
    <Box
      component="section"
      ref={sectionRef}
      id="candidates"
      {...{ [STAGE_ATTR]: "" }}
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        bgcolor: "background.paper",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderTop: 1,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
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
                <StageKicker index="10" label="Technical Graduate Program" />
                <Typography variant="h2" component="h2" sx={{ mt: 1, fontSize: { xs: "1.5rem", sm: "2.1rem", md: "2.5rem" }, fontWeight: 700 }}>
                  Join our Technical Graduate Program
                </Typography>
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
    </Box>
  );
}


// Section 12: Blog
function BlogSection() {
  const page = useQuery(blogPostsQuery({ limit: 10, offset: 0 }));
  const posts = page.data?.items ?? FALLBACK_BLOG_PAGE.items;
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth, children } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);

      let currentActive = 0;
      let minDistance = Infinity;
      Array.from(children).forEach((child, index) => {
        const childHtml = child as HTMLElement;
        const distance = Math.abs(childHtml.offsetLeft - scrollLeft);
        if (distance < minDistance) {
          minDistance = distance;
          currentActive = index;
        }
      });
      setActiveIndex(currentActive);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll, { passive: true });
      return () => {
        currentRef.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [checkScroll]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -384, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 384, behavior: "smooth" });
    }
  };

  const slicedPosts = posts.slice(0, 7);

  return (
    <StageSection section={homeSection("blog")} muted>
      <Reveal>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h2" component="h2">Our Blog</Typography>
          <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" } }}>
            <IconButton disabled={!canScrollLeft} onClick={scrollLeft} aria-label="Previous posts" sx={{ border: 1, borderColor: "divider", bgcolor: "background.paper", "&:hover": { bgcolor: "action.hover" } }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </IconButton>
            <IconButton disabled={!canScrollRight} onClick={scrollRight} aria-label="Next posts" sx={{ border: 1, borderColor: "divider", bgcolor: "background.paper", "&:hover": { bgcolor: "action.hover" } }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </IconButton>
          </Stack>
        </Stack>
      </Reveal>
      <Reveal delay={0.1}>
        <Box
          ref={scrollRef}
          sx={{
            display: "flex",
            overflowX: "auto",
            gap: 3,
            pb: 2,
            scrollSnapType: "x mandatory",
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
          }}
        >
          {slicedPosts.map((post) => {
            return (
              <Card
                key={post.id}
                sx={{
                  flexShrink: 0,
                  width: { xs: 280, md: 360 },
                  display: "flex",
                  flexDirection: "column",
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.default",
                  scrollSnapAlign: "start",
                }}
              >
                <CardActionArea
                  onClick={() => {
                    void navigate({ to: "/blog/$slug", params: { slug: post.slug } });
                  }}
                  sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start" }}
                >
                  {post.image_url ? (
                    <Box
                      component="img"
                      src={post.image_url}
                      alt=""
                      loading="lazy"
                      sx={{
                        width: "100%",
                        aspectRatio: "16/9",
                        objectFit: "cover",
                        display: "block",
                        borderBottom: 1,
                        borderColor: "divider",
                      }}
                    />
                  ) : (
                    <Box sx={{ width: "100%", aspectRatio: "16/9", bgcolor: "divider", borderBottom: 1, borderColor: "divider" }} />
                  )}
                  <CardContent sx={{ flexGrow: 1, width: "100%" }}>
                    <Typography variant="overline" color="primary" gutterBottom>{post.category}</Typography>
                    <Typography variant="h5" sx={{ mb: 1, mt: 0.5 }}>{post.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {post.excerpt}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 3, display: "flex" }}>
          {slicedPosts.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: activeIndex === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: activeIndex === index ? "primary.main" : "divider",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
              }}
              onClick={() => {
                if (scrollRef.current) {
                  const children = scrollRef.current.children;
                  const target = children[index] as HTMLElement;
                  if (target) {
                    scrollRef.current.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
                  }
                }
              }}
            />
          ))}
        </Stack>
      </Reveal>
      <Reveal delay={0.15}>
        <Stack direction="row" sx={{ mt: 2 }}>
          <RouterButton to="/blog" variant="outlined">
            View all posts →
          </RouterButton>
        </Stack>
      </Reveal>
    </StageSection>
  );
}

// Section 15: Footer
function FooterSection() {
  return (
    <Box component="footer" sx={{ py: 4, px: 3, borderTop: 1, borderColor: "divider", textAlign: "center" }}>
      <Typography sx={{ fontFamily: MONO, fontSize: "0.75rem", color: "text.secondary" }}>
        © {new Date().getFullYear()} Phitopolis. Making tomorrow's technology available today
      </Typography>
    </Box>
  );
}

function HomePage() {
  const pageRef = useRef<HTMLElement>(null);
  const useCasesRef = useRef<HTMLElement>(null);
  const compactZoneRef = useNavbarAnchor("home-compact");
  useStagePresence(useCasesRef, "use-cases");
  useSectionPaging(pageRef);

  return (
    <>
      <SmoothScroll />
      <EyeFlow />
      <Box ref={pageRef} sx={{ position: 'relative', overflowX: 'clip' }}>
        <SuperHeroSequence />
        <Box id="stats">
          <StatStrip stats={CONTENT.stats} />
        </Box>
        <Divider />
        <Box ref={useCasesRef} id="use-cases">
          <UseCasesNarrative />
        </Box>
        <Divider />
        <Box ref={compactZoneRef}>
          <ProcessSection />
          <ReachSection />
          <DailyLifeSection />
          <CandidatesAndCareersSection />
          <BlogSection />
        </Box>
      </Box>
      <FooterSection />
    </>
  );
}
