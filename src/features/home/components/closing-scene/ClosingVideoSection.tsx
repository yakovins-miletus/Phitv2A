import { useRef, useState, useCallback, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { useNavbarAnchor } from "@/shared/components/navbarHooks";
import { useStagePresence } from "@/shared/components/stage/stagePresence";
import { useReducedMotion } from "@/shared/motion";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";
import { sectionOrder } from "@/shared/sections";
import { CONTENT } from "@/shared/content";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

import {
  CLOSING_PIN_VH,
  BEAT1_IN_END,
  BEAT1_IN_START,
  BEAT1_OUT_END,
  BEAT1_OUT_START,
  BEAT2_IN_END,
  BEAT2_IN_START,
  beat1OpacityFor,
  beat1VisibilityFor,
  beat2OpacityFor,
  beat2VisibilityFor,
  ctaPointerFor,
  scrimOpacityFor,
  videoProgressFor,
} from "./closingVideoPhases";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, useGSAP);

const VIDEO_SRC = "/videos/we-build-the-future.mp4";

/**
 * ClosingVideoSection — full-bleed pinned video stage with scroll-scrubbed playback
 * and centered, horizontally expanded 2-beat reveal sequence.
 *
 * R1: Video element muted, playsInline, preload="auto", scroll-scrubbed forward
 *     and backward via GSAP ScrollTrigger.
 * R2: Centered, horizontally expanded 2-beat sequence:
 *     - Beat 1: "We create exciting technologies" + closing narrative
 *     - Beat 2: CTA card with "Start a Conversation" (/contact) and "Explore Careers" (/careers)
 *     - Zero overlap: Beat 1 and Beat 2 are strictly disjoint in time and opacity.
 * R3: Navbar anchor tracking (NAV_ANCHORS.HOME_CLOSING, dark: true), clean pinning
 *     without jumps, responsive scaling from mobile to ultrawide, and reduced-motion fallback.
 */
export function ClosingVideoSection() {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const beat1Ref = useRef<HTMLDivElement>(null);
  const beat2Ref = useRef<HTMLDivElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const reduced = useReducedMotion();
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.HOME_CLOSING, { dark: true });

  // Inform dot-rail navigation that "closing" is active
  useStagePresence(containerRef, "closing", sectionOrder("closing"));

  const currentProgressRef = useRef(0);
  const pendingSeekRef = useRef<number | null>(null);

  const applySeek = useCallback((video: HTMLVideoElement, targetTime: number) => {
    if (video.seeking) {
      pendingSeekRef.current = targetTime;
      return;
    }
    if (Math.abs(video.currentTime - targetTime) > 0.02) {
      video.currentTime = targetTime;
    }
  }, []);

  // Helper to update video frame safely with seek debouncing and queueing
  const updateVideoProgress = useCallback((progress: number) => {
    currentProgressRef.current = progress;
    const video = videoRef.current;
    if (!video || !video.duration || !isFinite(video.duration)) return;
    const vProg = videoProgressFor(progress);
    const maxTargetTime = Math.max(0, video.duration - 0.05);
    const targetTime = Math.min(maxTargetTime, Math.max(0, vProg * video.duration));
    applySeek(video, targetTime);
  }, [applySeek]);

  const handleLoadedMetadata = useCallback(() => {
    setIsVideoReady(true);
    const video = videoRef.current;
    if (video) {
      video.pause();
      updateVideoProgress(currentProgressRef.current);
    }
  }, [updateVideoProgress]);

  const handleSeeked = useCallback(() => {
    const video = videoRef.current;
    if (!video || pendingSeekRef.current === null) return;
    const next = pendingSeekRef.current;
    pendingSeekRef.current = null;
    applySeek(video, next);
  }, [applySeek]);

  // Handle cached or already-loaded video on mount in pinned mode
  useEffect(() => {
    if (reduced === true) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.readyState >= 1) {
      setIsVideoReady(true);
      video.pause();
      updateVideoProgress(currentProgressRef.current);
    }
  }, [reduced, updateVideoProgress]);

  // Handle settled video frame in reduced-motion mode (Requirement 3 fallback)
  useEffect(() => {
    if (reduced !== true) return;
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    const seekSettled = () => {
      if (video.duration && isFinite(video.duration)) {
        video.currentTime = Math.max(0, video.duration - 0.05);
      }
    };
    if (video.readyState >= 1) {
      setIsVideoReady(true);
      seekSettled();
    } else {
      const onLoaded = () => {
        setIsVideoReady(true);
        seekSettled();
      };
      video.addEventListener("loadedmetadata", onLoaded, { once: true });
      return () => video.removeEventListener("loadedmetadata", onLoaded);
    }
  }, [reduced]);

  useGSAP(
    () => {
      if (reduced === true || !containerRef.current) return;

      const container = containerRef.current;
      const beat1 = beat1Ref.current;
      const beat2 = beat2Ref.current;
      const video = videoRef.current;

      if (video) {
        video.pause();
        video.muted = true;
        video.playsInline = true;
      }

      const applyStyles = (p: number) => {
        container.style.setProperty("--closing-scrim-opacity", scrimOpacityFor(p).toFixed(3));
        container.style.setProperty("--closing-beat1-opacity", beat1OpacityFor(p).toFixed(3));
        container.style.setProperty("--closing-beat1-visibility", beat1VisibilityFor(p));
        container.style.setProperty("--closing-beat2-opacity", beat2OpacityFor(p).toFixed(3));
        container.style.setProperty("--closing-beat2-visibility", beat2VisibilityFor(p));
        container.style.setProperty("--closing-cta-pointer", ctaPointerFor(p));
      };

      const syncScene = (p: number) => {
        updateVideoProgress(p);
        applyStyles(p);
      };

      // Initialize CSS properties for initial scroll position
      applyStyles(0);

      // Build GSAP timeline (duration = 1.0, matching scrub progress p)
      // Driven via tl.onUpdate so video frames, scrim, and beat opacities remain
      // 100% in lockstep with transform smoothing during momentum scrub deceleration.
      const tl = gsap.timeline({
        onUpdate: () => {
          syncScene(tl.progress());
        },
      });
      tl.to(container, { duration: 1 }, 0);

      // Beat 1 transforms (entrance then recede) strictly following fromTo immediateRender: false
      if (beat1) {
        tl.fromTo(
          beat1,
          { yPercent: 24, scale: 0.97 },
          {
            yPercent: 0,
            scale: 1,
            ease: "power2.out",
            duration: BEAT1_IN_END - BEAT1_IN_START,
            immediateRender: false,
          },
          BEAT1_IN_START,
        );
        tl.to(
          beat1,
          {
            yPercent: -20,
            scale: 0.97,
            ease: "power2.in",
            duration: BEAT1_OUT_END - BEAT1_OUT_START,
          },
          BEAT1_OUT_START,
        );
      }

      // Beat 2 transforms (entrance to settled center) strictly following fromTo immediateRender: false
      if (beat2) {
        tl.fromTo(
          beat2,
          { yPercent: 24, scale: 0.97 },
          {
            yPercent: 0,
            scale: 1,
            ease: "power3.out",
            duration: BEAT2_IN_END - BEAT2_IN_START,
            immediateRender: false,
          },
          BEAT2_IN_START,
        );
      }

      const st = ScrollTrigger.create({
        trigger: container,
        pin: true,
        start: "top top",
        end: () => `+=${String(window.innerHeight * CLOSING_PIN_VH)}`,
        scrub: SCROLL_SPEED,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: refreshPriorityFor(sectionOrder("closing")),
        animation: tl,
      });

      // Synchronize initial progress if mounted mid-scroll
      if (st.progress > 0) {
        tl.progress(st.progress);
        syncScene(st.progress);
      }

      return () => {
        st.kill();
        tl.kill();
      };
    },
    { scope: containerRef, dependencies: [reduced, updateVideoProgress] },
  );

  // ── Reduced Motion Fallback Mode ──────────────────────────────────────────
  if (reduced === true) {
    return (
      <Box
        component="section"
        ref={containerRef}
        id="closing"
        data-testid="closing-video-section"
        aria-label="In Closing"
        data-act="services"
        data-ground="dark"
        sx={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          bgcolor: NOIR.navyField,
          color: NOIR.white,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: { xs: 3, sm: 4, md: 8 },
          py: { xs: 12, md: 16 },
        }}
      >
        <Box ref={anchorRef} sx={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

        {/* Video Backdrop in settled state */}
        <Box
          component="video"
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          onLoadedMetadata={() => {
            setIsVideoReady(true);
            const video = videoRef.current;
            if (video && video.duration && isFinite(video.duration)) {
              video.pause();
              video.currentTime = Math.max(0, video.duration - 0.05);
            }
          }}
          onError={() => setIsVideoReady(false)}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.45,
            pointerEvents: "none",
          }}
        />

        {/* Deep Vignette Scrim */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse 85% 75% at 50% 50%, rgba(6, 18, 38, 0.7) 0%, rgba(6, 18, 38, 0.92) 80%)",
          }}
        />

        {/* Static Accessible Content Stack */}
        <Box
          sx={{
            position: "relative",
            zIndex: 3,
            width: "100%",
            maxWidth: { xs: "100%", md: 1200, xl: 1380 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: { xs: 6, md: 8 },
          }}
        >
          {/* Beat 1: Statement */}
          <Box sx={{ maxWidth: { xs: "100%", md: 1000, xl: 1200 } }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2.5,
                px: 2.5,
                py: 0.8,
                borderRadius: "100px",
                bgcolor: "rgba(6, 18, 38, 0.85)",
                border: "1px solid rgba(255, 199, 44, 0.35)",
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: NOIR.gold }} />
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "0.72rem", sm: "0.82rem" },
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: NOIR.gold,
                }}
              >
                HERE AT PHITOPOLIS // THE HORIZON
              </Typography>
            </Box>

            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontSize: { xs: "2.2rem", sm: "3.2rem", md: "4.5rem", lg: "5.5rem", xl: "6.5rem" },
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                fontWeight: 800,
                color: NOIR.white,
                mb: 2.5,
              }}
            >
              We create exciting technologies
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: "1rem", sm: "1.15rem", md: "1.3rem" },
                lineHeight: 1.55,
                color: NOIR.frost,
                maxWidth: 820,
                mx: "auto",
                opacity: 0.9,
              }}
            >
              A financial-sciences and engineering powerhouse turning global markets into deployable technology.
            </Typography>
          </Box>

          {/* Beat 2: CTA Block */}
          <Box
            sx={{
              width: "100%",
              maxWidth: { xs: "100%", sm: 720, md: 960, xl: 1140 },
              p: { xs: 4, sm: 5, md: 6 },
              borderRadius: { xs: "24px", md: "32px" },
              bgcolor: "rgba(6, 18, 38, 0.94)",
              border: "1px solid rgba(255, 199, 44, 0.28)",
              boxShadow: "0 24px 70px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Typography
              variant="h3"
              component="h3"
              sx={{
                fontSize: { xs: "1.6rem", sm: "2.2rem", md: "2.8rem" },
                fontWeight: 800,
                color: NOIR.white,
                letterSpacing: "-0.02em",
              }}
            >
              {CONTENT.closing.statement}
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: "0.95rem", md: "1.1rem" },
                color: NOIR.frost,
                maxWidth: 680,
                opacity: 0.88,
              }}
            >
              {CONTENT.closing.subline}
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "center",
                gap: 2,
                mt: 1,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              <Box
                component={Link}
                to="/contact"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 4.5,
                  py: 1.85,
                  width: { xs: "100%", sm: "auto" },
                  bgcolor: NOIR.gold,
                  color: NOIR.navyField,
                  fontFamily: MONO,
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  borderRadius: "100px",
                  textDecoration: "none",
                }}
              >
                {CONTENT.closing.farewell} →
              </Box>

              <Box
                component={Link}
                to="/careers"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 4,
                  py: 1.85,
                  width: { xs: "100%", sm: "auto" },
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  color: NOIR.white,
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  fontFamily: MONO,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  borderRadius: "100px",
                  textDecoration: "none",
                }}
              >
                Explore Careers →
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // ── Pinned Scroll-Scrubbed Mode ───────────────────────────────────────────
  return (
    <Box
      component="section"
      ref={containerRef}
      id="closing"
      data-testid="closing-video-section"
      aria-label="In Closing"
      data-act="services"
      data-ground="dark"
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        bgcolor: NOIR.navyField,
        color: NOIR.white,
        overflow: "hidden",
      }}
    >
      <Box ref={anchorRef} sx={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      {/* Layer 1: Full-Bleed Video Stage */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <Box
          component="video"
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          onLoadedMetadata={handleLoadedMetadata}
          onSeeked={handleSeeked}
          onError={() => setIsVideoReady(false)}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transform: "scale(1.02)", // Prevents edge sub-pixel bleed during transforms
            opacity: isVideoReady ? 1 : 0.85,
            transition: "opacity 0.4s ease-out",
          }}
        />
      </Box>

      {/* Layer 2: Dynamic Radial Vignette & Scrim */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background: `radial-gradient(ellipse 90% 80% at 50% 50%, rgba(6, 18, 38, 0.45) 0%, rgba(6, 18, 38, 0.85) 75%, ${NOIR.navyField} 100%)`,
          opacity: "var(--closing-scrim-opacity, 0.25)",
          transition: "opacity 0.1s linear",
        }}
      />

      {/* Layer 3: Centered, Horizontally Expanded Stage Stage Grid */}
      <Box
        sx={{
          position: "relative",
          zIndex: 4,
          height: "100%",
          display: "grid",
          placeItems: "center",
          px: { xs: 2.5, sm: 4, md: 6, lg: 8 },
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "grid",
            alignContent: "center",
            justifyItems: "center",
            "& > *": { gridArea: "1 / 1", width: "100%" },
          }}
        >
          {/* ── Beat 1: Centered & Horizontally Expanded Closing Statement ── */}
          <Box
            ref={beat1Ref}
            data-closing-beat1
            style={{
              opacity: "var(--closing-beat1-opacity, 0)",
              visibility: "var(--closing-beat1-visibility, hidden)" as React.CSSProperties["visibility"],
            }}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              pointerEvents: "none",
              maxWidth: { xs: "100%", md: 1200, lg: 1380, xl: 1540 },
              mx: "auto",
              position: "relative",
            }}
          >
            {/* Ambient read plate for supreme contrast over video */}
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                inset: { xs: "-20px -16px", md: "-40px -48px" },
                borderRadius: "32px",
                background:
                  "radial-gradient(ellipse 75% 60% at 50% 50%, rgba(6, 18, 38, 0.78) 0%, rgba(6, 18, 38, 0.35) 65%, transparent 100%)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                zIndex: -1,
                pointerEvents: "none",
              }}
            />

            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.5,
                mb: { xs: 2, sm: 2.5, md: 3 },
                px: 2.5,
                py: 0.85,
                borderRadius: "100px",
                bgcolor: "rgba(6, 18, 38, 0.85)",
                border: "1px solid rgba(255, 199, 44, 0.35)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: NOIR.gold }} />
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: "0.72rem", sm: "0.8rem", md: "0.88rem" },
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: NOIR.gold,
                }}
              >
                HERE AT PHITOPOLIS // THE HORIZON
              </Typography>
            </Box>

            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontFamily: "inherit",
                fontSize: { xs: "2.2rem", sm: "3.4rem", md: "4.8rem", lg: "6.2rem", xl: "7rem" },
                lineHeight: { xs: 1.15, sm: 1.1, md: 1.05 },
                letterSpacing: { xs: "-0.02em", md: "-0.035em" },
                fontWeight: 800,
                color: NOIR.white,
                maxWidth: { xs: "100%", md: 1100, lg: 1320, xl: 1480 },
                mx: "auto",
                mb: { xs: 2, sm: 2.5, md: 3.5 },
                textShadow: "0 6px 40px rgba(0, 0, 0, 0.8), 0 2px 10px rgba(0, 0, 0, 0.9)",
              }}
            >
              We create exciting technologies
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: "1rem", sm: "1.15rem", md: "1.35rem" },
                lineHeight: 1.55,
                color: NOIR.frost,
                maxWidth: { xs: "100%", sm: 720, md: 880 },
                mx: "auto",
                textShadow: "0 2px 20px rgba(0, 0, 0, 0.9)",
                opacity: 0.92,
              }}
            >
              A financial-sciences and engineering powerhouse turning global markets into deployable technology.
            </Typography>
          </Box>

          {/* ── Beat 2: Centered & Horizontally Expanded Primary CTA Block ── */}
          <Box
            ref={beat2Ref}
            data-closing-beat2
            style={{
              opacity: "var(--closing-beat2-opacity, 0)",
              visibility: "var(--closing-beat2-visibility, hidden)" as React.CSSProperties["visibility"],
              pointerEvents: "var(--closing-cta-pointer, none)" as React.CSSProperties["pointerEvents"],
            }}
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              maxWidth: { xs: "100%", sm: 720, md: 980, lg: 1120, xl: 1260 },
              mx: "auto",
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                p: { xs: 3.5, sm: 5, md: 6 },
                borderRadius: { xs: "24px", sm: "28px", md: "36px" },
                bgcolor: "rgba(6, 18, 38, 0.92)",
                border: "1px solid rgba(255, 199, 44, 0.28)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                boxShadow: "0 30px 90px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 199, 44, 0.08) inset",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: { xs: 2.5, md: 3 },
                overflow: "hidden",
              }}
            >
              {/* Corner ambient gold glow */}
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  top: -80,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 320,
                  height: 200,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,199,44,0.18) 0%, rgba(255,199,44,0) 70%)",
                  pointerEvents: "none",
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  fontFamily: MONO,
                  fontSize: { xs: "0.72rem", sm: "0.8rem" },
                  fontWeight: 800,
                  letterSpacing: "0.20em",
                  textTransform: "uppercase",
                  color: NOIR.gold,
                }}
              >
                <Box sx={{ width: 20, height: "1px", bgcolor: NOIR.gold }} />
                Let&apos;s Build Together
                <Box sx={{ width: 20, height: "1px", bgcolor: NOIR.gold }} />
              </Box>

              <Typography
                variant="h3"
                component="h3"
                sx={{
                  fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3.2rem" },
                  lineHeight: 1.15,
                  letterSpacing: "-0.025em",
                  fontWeight: 800,
                  color: NOIR.white,
                  maxWidth: 820,
                }}
              >
                {CONTENT.closing.statement}
              </Typography>

              <Typography
                sx={{
                  fontSize: { xs: "0.95rem", sm: "1.05rem", md: "1.18rem" },
                  lineHeight: 1.6,
                  color: NOIR.frost,
                  maxWidth: 720,
                  mx: "auto",
                  opacity: 0.88,
                }}
              >
                {CONTENT.closing.subline}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: "center",
                  justifyContent: "center",
                  gap: { xs: 2, sm: 2.5 },
                  mt: 1,
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {/* Primary Action: /contact */}
                <Box
                  component={Link}
                  to="/contact"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1.25,
                    px: { xs: 4, sm: 4.5, md: 5 },
                    py: { xs: 1.85, md: 2.05 },
                    width: { xs: "100%", sm: "auto" },
                    bgcolor: NOIR.gold,
                    color: NOIR.navyField,
                    fontFamily: MONO,
                    fontSize: { xs: "0.82rem", md: "0.88rem" },
                    fontWeight: 800,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    borderRadius: "100px",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    boxShadow: "0 8px 24px rgba(255, 199, 44, 0.28)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
                    "&:hover": {
                      bgcolor: NOIR.white,
                      transform: "scale(1.03)",
                      boxShadow: "0 12px 34px rgba(255, 199, 44, 0.4)",
                    },
                  }}
                >
                  {CONTENT.closing.farewell} →
                </Box>

                {/* Secondary Action: /careers */}
                <Box
                  component={Link}
                  to="/careers"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1.25,
                    px: { xs: 3.5, sm: 4, md: 4.5 },
                    py: { xs: 1.85, md: 2.05 },
                    width: { xs: "100%", sm: "auto" },
                    bgcolor: "rgba(255, 255, 255, 0.08)",
                    color: NOIR.white,
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    fontFamily: MONO,
                    fontSize: { xs: "0.82rem", md: "0.88rem" },
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    borderRadius: "100px",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    backdropFilter: "blur(8px)",
                    transition: "transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.16)",
                      borderColor: NOIR.gold,
                      transform: "scale(1.03)",
                    },
                  }}
                >
                  Explore Careers →
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
