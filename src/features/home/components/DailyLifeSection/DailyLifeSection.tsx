import { useRef } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

import { CONTENT } from "@/shared/content";
import { useReducedMotion } from "@/shared/motion";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import { SectionLede } from "@/shared/components/SectionLede";
import { NAV_ANCHORS, useNavbarAnchor } from "@/shared/components/NavbarContext";
import { useStagePresence } from "@/shared/components/StageSection";
import {
  STAGE_ENTER_DURATION,
  STAGE_EXIT_DURATION,
  STAGE_HOLD_DURATION,
} from "@/shared/components/stageChoreo";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

import Divider from "@mui/material/Divider";

import { formatTime, useDailyLifeVideo } from "./useDailyLifeVideo";
import { RawStage } from "../RawStage";

/** How far the daily-life card stays pinned, as a multiple of viewport height.
 *  Sized to its three-phase timeline; unrelated to the other sections' pins. */
const DAILY_LIFE_PIN_DISTANCE = "+=140%";

// Behind The Code — the daily-life film, with its own player chrome.
export function DailyLifeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const {
    videoRef,
    isPlaying,
    isMuted,
    videoLoaded,
    currentTime,
    duration,
    volume,
    showVolumeSlider,
    setShowVolumeSlider,
    togglePlay,
    toggleMute,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleSeek,
    handleVolumeChange,
  } = useDailyLifeVideo(sectionRef);
  const reducedMotion = useReducedMotion();

  useStagePresence(sectionRef, "daily-life");
  const videoAnchorRef = useNavbarAnchor(NAV_ANCHORS.DAILY_LIFE_VIDEO, { dark: true });

  useGSAP(
    () => {
      if (reducedMotion || !sectionRef.current || !cardRef.current) return;

      const isMobile = window.matchMedia("(max-width: 599.95px)").matches;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: DAILY_LIFE_PIN_DISTANCE,
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







  return (
    // RawStage is transparent by default now: GroundLayer paints `navyDeep` here,
    // one step deeper than the card's `primary.main`, so the film card reads as a
    // lifted surface instead of a same-navy rectangle with a 1px border.
    <RawStage id="daily-life" ref={sectionRef}>
      <Box ref={videoAnchorRef} sx={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <Box
        ref={cardRef}
        sx={{
          position: "relative",
          overflow: "hidden",
          // Base size in CSS, not only in the GSAP fromTo: under reduced
          // motion the timeline never runs, and without this the card
          // collapsed to its content (~302x152) and squeezed the overlay
          // copy into a column eight lines deep.
          width: "100%",
          height: "100%",
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
          // The poster keeps the frame filled before the IntersectionObserver releases
          // the src, so the section never shows an empty navy box on a slow connection.
          poster="/videos/daily-life-poster.jpg"
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
          {/* The page's voice turns here: everything above addresses the
              client, everything below addresses the recruit. The video was
              already that pivot — this line says so. */}
          <Box sx={{ mt: { xs: 1, sm: 2, md: 3 }, maxWidth: 720 }}>
            <SectionLede
              gunshot={CONTENT.ledes.dailyLife.gunshot}
              tracer={CONTENT.ledes.dailyLife.tracer}
              eyebrow="Daily Life"
              component="h3"
              tone="dark"
            />
          </Box>

          <Stack spacing={2} sx={{ width: "100%" }}>
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
                    bgcolor: "rgba(255, 255, 255, 0.62)",
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
                        bgcolor: "rgba(255, 255, 255, 0.62)",
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
    </RawStage>
  );
}