import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import PhitopolisLogo from "./PhitopolisLogo";

export const PRELOADER_SESSION_KEY = "phitopolis:preloaded";
const HARD_CAP_MS = 5000;

export interface LoadSignal {
  label: string;
  promise: Promise<unknown>;
}

function collectFontSignals(): LoadSignal[] {
  if (typeof document === "undefined") return [];
  if (document.fonts === undefined) return [];
  return [{ label: "FONTS", promise: document.fonts.ready }];
}

interface PreloaderProps {
  onDone: () => void;
  onStartExit?: () => void;
  warmup?: LoadSignal[];
}

/** Corner Crosshair Hairline Marker */
function Crosshair({ position, refCallback }: { position: "tl" | "tr" | "bl" | "br"; refCallback?: (el: HTMLDivElement | null) => void }) {
  const styles: Record<string, object> = {
    tl: { top: -7, left: -7 },
    tr: { top: -7, right: -7 },
    bl: { bottom: -7, left: -7 },
    br: { bottom: -7, right: -7 },
  };

  return (
    <Box
      ref={refCallback}
      sx={{
        position: "absolute",
        width: 14,
        height: 14,
        pointerEvents: "none",
        zIndex: 5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: NOIR.gold,
        opacity: 0,
        ...styles[position],
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 0V14M0 7H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
      </svg>
    </Box>
  );
}

export function Preloader({ onDone, onStartExit, warmup }: PreloaderProps) {
  const [signals] = useState<LoadSignal[]>(() => [...collectFontSignals(), ...(warmup ?? [])]);
  const [resolved, setResolved] = useState(0);
  const [lastLabel, setLastLabel] = useState("ASSETS");
  const [forced, setForced] = useState(false);
  const [entranceDone, setEntranceDone] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const topShutterRef = useRef<HTMLDivElement>(null);
  const bottomShutterRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLDivElement>(null);
  const centerStageRef = useRef<HTMLDivElement>(null);
  const frameBoxRef = useRef<HTMLDivElement>(null);
  const crosshairRefs = useRef<(HTMLDivElement | null)[]>([]);
  const logoMarkRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const counterWrapRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);

  const entranceTlRef = useRef<gsap.core.Timeline | null>(null);
  const exitTlRef = useRef<gsap.core.Timeline | null>(null);

  const total = Math.max(signals.length, 1);
  const isDoneRef = useRef(false);
  const exitFiredRef = useRef(false);
  const hasStartedExitRef = useRef(false);

  const onDoneRef = useRef(onDone);
  const onStartExitRef = useRef(onStartExit);

  useEffect(() => {
    onDoneRef.current = onDone;
    onStartExitRef.current = onStartExit;
  });

  // Lock body scroll while preloader is active
  useEffect(() => {
    if (typeof document !== "undefined") {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, []);

  // Monitor loading signals
  useEffect(() => {
    let cancelled = false;
    for (const signal of signals) {
      void signal.promise.then(() => {
        if (!cancelled) {
          setResolved((count) => count + 1);
          setLastLabel(signal.label);
        }
      });
    }
    const cap = window.setTimeout(() => {
      if (!cancelled) setForced(true);
    }, HARD_CAP_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(cap);
    };
  }, [signals]);

  // Monitor Escape key for skipping
  useEffect(() => {
    const skip = (event: KeyboardEvent) => {
      if (event.key === "Escape") setForced(true);
    };
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, []);

  const progressPercent = forced || signals.length === 0 || resolved >= total
    ? 100
    : Math.round((Math.min(resolved, total) / total) * 100);

  const isComplete = progressPercent >= 100;

  // Stately, one-at-a-time buffered entrance choreography
  useEffect(() => {
    const coordsEl = coordsRef.current;
    const stageEl = centerStageRef.current;
    const frameEl = frameBoxRef.current;
    const crosshairs = crosshairRefs.current.filter(Boolean);
    const logoEl = logoMarkRef.current;
    const headEl = headlineRef.current;
    const subEl = subtitleRef.current;
    const countEl = counterWrapRef.current;

    // Reset initial states
    gsap.set(coordsEl, { opacity: 0, y: -8 });
    gsap.set(stageEl, { opacity: 0 });
    gsap.set(frameEl, { scale: 0.93, opacity: 0 });
    gsap.set(crosshairs, { opacity: 0, scale: 0.6 });
    gsap.set(logoEl, { scale: 0.88, opacity: 0, y: 10 });
    gsap.set(headEl, { opacity: 0, y: 12 });
    gsap.set(subEl, { opacity: 0, y: 8 });
    gsap.set(countEl, { opacity: 0, y: 8 });

    // Step-by-step buffered timeline (Strictly ONE AT A TIME with explicit pause buffers)
    const tl = gsap.timeline({
      onComplete: () => {
        setEntranceDone(true);
      },
    });

    entranceTlRef.current = tl;

    // 1. Stage ground & coordinates fade in -> buffer
    tl.to(coordsEl, { opacity: 0.5, y: 0, duration: 0.35, ease: "power2.out" }, 0);
    tl.to(stageEl, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
    tl.to({}, { duration: 0.15 }); // Buffer

    // 2. Center frame emerges -> buffer
    tl.to(frameEl, { scale: 1, opacity: 1, duration: 0.5, ease: "expo.out" });
    tl.to({}, { duration: 0.15 }); // Buffer

    // 3. Corner crosshairs lock into place one-by-one -> buffer
    tl.to(crosshairs, { opacity: 1, scale: 1, duration: 0.35, stagger: 0.06, ease: "back.out(1.8)" });
    tl.to({}, { duration: 0.18 }); // Buffer

    // 4. Logo mark reveals inside frame -> buffer
    tl.to(logoEl, { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: "power3.out" });
    tl.to({}, { duration: 0.18 }); // Buffer

    // 5. Headline "Welcome to Phitopolis" reveals -> buffer
    tl.to(headEl, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" });
    tl.to({}, { duration: 0.15 }); // Buffer

    // 6. Subtitle brand pillar tag reveals -> buffer
    tl.to(subEl, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" });
    tl.to({}, { duration: 0.15 }); // Buffer

    // 7. Counter & diagnostics reveal at bottom
    tl.to(countEl, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });

    return () => {
      tl.kill();
    };
  }, []);

  // Update progress hairline width
  useEffect(() => {
    if (progressFillRef.current) {
      gsap.to(progressFillRef.current, {
        width: `${progressPercent}%`,
        duration: forced ? 0.1 : 0.3,
        ease: "power2.out",
      });
    }
  }, [progressPercent, forced]);

  // Master Synchronized Exit Choreography with center-to-outward split black curtain
  useEffect(() => {
    const shouldExit = (entranceDone && isComplete) || forced;
    if (!shouldExit || isDoneRef.current || hasStartedExitRef.current) return;
    hasStartedExitRef.current = true;

    if (forced && entranceTlRef.current) {
      entranceTlRef.current.progress(1);
    }

    const topShutter = topShutterRef.current;
    const bottomShutter = bottomShutterRef.current;
    const stageEl = centerStageRef.current;
    const countEl = counterWrapRef.current;
    const coordsEl = coordsRef.current;

    const delay = forced ? 0 : 0.25;

    const tl = gsap.timeline({
      delay,
      onComplete: () => {
        if (!isDoneRef.current) {
          isDoneRef.current = true;
          sessionStorage.setItem(PRELOADER_SESSION_KEY, "1");
          onDoneRef.current?.();
        }
      },
    });

    exitTlRef.current = tl;

    // Step 1: Bottom counter, coordinates and diagnostics gently draw back
    tl.to(
      [countEl, coordsEl],
      {
        opacity: 0,
        y: 8,
        duration: 0.3,
        ease: "power2.in",
      },
      0
    );

    // Step 2: Center stage content softly scales and fades
    tl.to(
      stageEl,
      {
        opacity: 0,
        scale: 0.96,
        y: -10,
        duration: 0.38,
        ease: "power2.inOut",
      },
      0.12
    );

    // Step 3: Reverted Center-to-Outward Black Curtain Split Reveal!
    // Top shutter moves up to -100%, bottom shutter moves down to 100%
    tl.to(
      topShutter,
      {
        yPercent: -100,
        duration: 0.85,
        ease: "expo.inOut",
      },
      0.35
    );

    tl.to(
      bottomShutter,
      {
        yPercent: 100,
        duration: 0.85,
        ease: "expo.inOut",
      },
      0.35
    );

    // Mid-curtain release: notify AppShell at 50% curtain split
    tl.add(() => {
      if (!exitFiredRef.current && onStartExitRef.current) {
        exitFiredRef.current = true;
        onStartExitRef.current();
      }
    }, 0.7);
  }, [entranceDone, isComplete, forced]);

  return (
    <Box
      ref={rootRef}
      data-testid="preloader"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        overflow: "hidden",
        pointerEvents: hasStartedExitRef.current ? "none" : "auto",
      }}
    >
      {/* Top Half Black/Navy Shutter Curtain (Moves upward to -100%) */}
      <Box
        ref={topShutterRef}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50.5vh", // Slight overlap to prevent subpixel hairline gap at horizon
          bgcolor: NOIR.navyInk,
          background: "linear-gradient(180deg, #030712 0%, #06183B 100%)",
          borderBottom: "1px solid rgba(255, 199, 44, 0.15)",
          zIndex: 2,
          willChange: "transform",
        }}
      />

      {/* Bottom Half Black/Navy Shutter Curtain (Moves downward to 100%) */}
      <Box
        ref={bottomShutterRef}
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50.5vh",
          bgcolor: NOIR.navyInk,
          background: "linear-gradient(180deg, #06183B 0%, #030712 100%)",
          borderTop: "1px solid rgba(255, 199, 44, 0.15)",
          zIndex: 2,
          willChange: "transform",
        }}
      />

      {/* Center Interactive Foreground Layer */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          py: { xs: 5, md: 7 },
          px: 3,
        }}
      >
        {/* Top Subtle Coordinates Tag */}
        <Box ref={coordsRef} sx={{ opacity: 0, userSelect: "none" }}>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: { xs: "0.6rem", md: "0.68rem" },
              letterSpacing: "0.22em",
              color: "rgba(244, 247, 252, 0.6)",
              textTransform: "uppercase",
            }}
          >
            SYS.LOC // MANILA [14.5995° N, 120.9842° E]
          </Typography>
        </Box>

        {/* Center Stage Container */}
        <Box
          ref={centerStageRef}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 2.5, md: 3 },
            my: "auto",
          }}
        >
          {/* Framed Square with Corner Gold Crosshairs */}
          <Box
            ref={frameBoxRef}
            sx={{
              position: "relative",
              width: { xs: 160, sm: 190, md: 210 },
              height: { xs: 160, sm: 190, md: 210 },
              bgcolor: "rgba(6, 18, 38, 0.6)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* 4 Corner Precision Crosshairs */}
            <Crosshair position="tl" refCallback={(el) => { crosshairRefs.current[0] = el; }} />
            <Crosshair position="tr" refCallback={(el) => { crosshairRefs.current[1] = el; }} />
            <Crosshair position="bl" refCallback={(el) => { crosshairRefs.current[2] = el; }} />
            <Crosshair position="br" refCallback={(el) => { crosshairRefs.current[3] = el; }} />

            {/* Central Phitopolis Logo Mark with Gold Phi Accent */}
            <Box
              ref={logoMarkRef}
              sx={{
                width: { xs: 75, sm: 90, md: 100 },
                height: { xs: 75, sm: 90, md: 100 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                filter: "drop-shadow(0 4px 20px rgba(255, 199, 44, 0.2))",
              }}
            >
              <PhitopolisLogo
                style={{ width: "100%", height: "100%" }}
                color="#FFFFFF"
                accentColor={NOIR.gold}
                title="Phitopolis"
              />
            </Box>
          </Box>

          {/* Center Editorial Headline: "Welcome to Phitopolis" */}
          <Box
            ref={headlineRef}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              userSelect: "none",
            }}
          >
            <Typography
              component="h1"
              sx={{
                fontFamily: "Inter, sans-serif",
                fontSize: { xs: "1.25rem", sm: "1.6rem", md: "1.95rem" },
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: NOIR.frost,
                lineHeight: 1.2,
                textTransform: "none",
              }}
            >
              Welcome to{" "}
              <Box component="span" sx={{ color: NOIR.gold, fontWeight: 900 }}>
                Phitopolis
              </Box>
            </Typography>
          </Box>

          {/* Under-Headline Subtitle: Brand Pillar Tag */}
          <Box
            ref={subtitleRef}
            sx={{
              display: "flex",
              alignItems: "center",
              userSelect: "none",
            }}
          >
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: { xs: "0.6rem", sm: "0.68rem", md: "0.74rem" },
                fontWeight: 600,
                letterSpacing: { xs: "0.2em", sm: "0.26em" },
                color: "rgba(244, 247, 252, 0.65)",
                textTransform: "uppercase",
              }}
            >
              QUANTITATIVE SYSTEMS · HIGH PERFORMANCE R&D
            </Typography>
          </Box>
        </Box>

        {/* Bottom Minimalist Progress Bar, Kinetic Counter & Diagnostics */}
        <Box
          ref={counterWrapRef}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.2,
            userSelect: "none",
            width: "100%",
            maxWidth: 240,
          }}
        >
          {/* Hairline Progress Rail */}
          <Box
            sx={{
              width: "100%",
              height: "1.5px",
              bgcolor: "rgba(255, 255, 255, 0.08)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              ref={progressFillRef}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: `${progressPercent}%`,
                bgcolor: NOIR.gold,
                boxShadow: `0 0 8px ${NOIR.gold}`,
              }}
            />
          </Box>

          {/* Minimal Tabular Counter */}
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: { xs: "0.85rem", md: "0.95rem" },
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: NOIR.gold,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {String(progressPercent).padStart(2, "0")}%
          </Typography>

          {/* Accessible System Status Label */}
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.62rem",
              letterSpacing: "0.18em",
              color: "rgba(244, 247, 252, 0.45)",
              textTransform: "uppercase",
            }}
          >
            {isComplete ? "READY" : `WARMING — ${lastLabel}`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
