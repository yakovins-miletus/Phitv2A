import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { ScrambleText } from "./ScrambleText";

export const PRELOADER_SESSION_KEY = "phitopolis:preloaded";
const HARD_CAP_MS = 2400;

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

export function Preloader({ onDone, onStartExit, warmup }: PreloaderProps) {
  const [signals] = useState<LoadSignal[]>(() => [...collectFontSignals(), ...(warmup ?? [])]);
  const [resolved, setResolved] = useState(0);
  const [lastLabel, setLastLabel] = useState("ASSETS");
  const [forced, setForced] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const centerCardRef = useRef<HTMLDivElement>(null);
  const innerRingRef = useRef<SVGSVGElement>(null);
  const ringProgressRef = useRef<SVGCircleElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const hudElementsRef = useRef<HTMLDivElement[]>([]);

  // The expanding white box ending ref
  const whiteExpansionBoxRef = useRef<HTMLDivElement>(null);

  const total = Math.max(signals.length, 1);
  const isDoneRef = useRef(false);
  const exitFiredRef = useRef(false);

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
  const RING_CIRCUMFERENCE = 389.5; // 2 * PI * 62

  // Initial entrance animations for card and HUD
  useEffect(() => {
    const centerCardEl = centerCardRef.current;
    const innerRingEl = innerRingRef.current;
    const watermarkEl = watermarkRef.current;
    const huds = hudElementsRef.current.filter(Boolean);

    gsap.set(centerCardEl, { opacity: 0, scale: 0.95, y: 15 });
    gsap.set(innerRingEl, { scale: 0.9, opacity: 0, rotation: -45 });
    gsap.set(watermarkEl, { opacity: 0, scale: 0.95 });
    gsap.set(huds, { opacity: 0, y: -10 });

    const tl = gsap.timeline();
    tl.to(centerCardEl, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "expo.out" }, 0.05);
    tl.to(huds, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }, 0.1);
    tl.to(innerRingEl, { scale: 1, opacity: 0.9, rotation: 0, duration: 0.8, ease: "power3.out" }, 0.15);
    tl.to(watermarkEl, { opacity: 0.03, scale: 1, duration: 1.0, ease: "power2.out" }, 0.2);

    return () => {
      tl.kill();
    };
  }, []);

  // Update ring progress on change
  useEffect(() => {
    if (ringProgressRef.current) {
      const offset = RING_CIRCUMFERENCE - (progressPercent / 100) * RING_CIRCUMFERENCE;
      gsap.to(ringProgressRef.current, {
        strokeDashoffset: offset,
        duration: 0.35,
        ease: "power2.out",
      });
    }
  }, [progressPercent]);

  // When 100% is reached: Trigger White Box Growing Expansion from Center to Screen Size in All Directions!
  useEffect(() => {
    if (!isComplete || isDoneRef.current) return;

    const contentEl = contentWrapperRef.current;
    const whiteBoxEl = whiteExpansionBoxRef.current;
    const rootEl = rootRef.current;

    const tl = gsap.timeline({
      delay: 0.15,
      onComplete: () => {
        if (!isDoneRef.current) {
          isDoneRef.current = true;
          sessionStorage.setItem(PRELOADER_SESSION_KEY, "1");
          onDone();
        }
      },
    });

    // 1. Content Card softly fades and blurs
    tl.to(contentEl, {
      opacity: 0,
      scale: 1.03,
      filter: "blur(6px)",
      duration: 0.3,
      ease: "power2.in",
    }, 0);

    // 2. White Box starts at scale 0 at center, grows outward in all directions to fill the screen
    tl.fromTo(
      whiteBoxEl,
      { scale: 0, opacity: 1, borderRadius: "16px" },
      {
        scale: 40,
        borderRadius: "0px",
        duration: 0.75,
        ease: "expo.inOut",
      },
      0.15
    );

    // 3. Mid-expansion: notify AppShell to release hero stage behind full white coverage
    tl.add(() => {
      if (!exitFiredRef.current && onStartExit) {
        exitFiredRef.current = true;
        onStartExit();
      }
    }, 0.55);

    // 4. White box dissolves smoothly into the clean hero section
    tl.to(rootEl, {
      opacity: 0,
      duration: 0.4,
      ease: "power2.out",
    }, 0.85);

    return () => {
      tl.kill();
    };
  }, [isComplete, onDone, onStartExit]);

  return (
    <Box
      ref={rootRef}
      data-testid="preloader"
      onClick={() => setForced(true)}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        cursor: "pointer",
        overflow: "hidden",
        bgcolor: "#030712",
        background: "radial-gradient(ellipse at center, #07152d 0%, #030712 75%)",
      }}
    >
      {/* Expanding White Box (Clean Center Expansion Transition) */}
      <Box
        ref={whiteExpansionBoxRef}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) scale(0)",
          width: { xs: "80px", md: "110px" },
          height: { xs: "80px", md: "110px" },
          bgcolor: "#FFFFFF",
          zIndex: 50,
          pointerEvents: "none",
          willChange: "transform, border-radius",
          boxShadow: "0 0 80px rgba(255, 255, 255, 0.9)",
        }}
      />

      {/* Subtle Background Watermark */}
      <Box
        ref={watermarkRef}
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          opacity: 0,
        }}
      >
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: { xs: "14vw", md: "18vw" },
            letterSpacing: "0.15em",
            color: "#FFFFFF",
            fontFamily: "Inter, sans-serif",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          PHITOPOLIS
        </Typography>
      </Box>

      {/* Main Interactive Telemetry Content Layer */}
      <Box
        ref={contentWrapperRef}
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: { xs: 3.5, md: 6 },
          color: "#F4F7FC",
        }}
      >
        {/* Top Header Telemetry */}
        <Box
          ref={(el) => {
            if (el) hudElementsRef.current[0] = el as unknown as HTMLDivElement;
          }}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: NOIR.gold,
                boxShadow: `0 0 10px ${NOIR.gold}`,
              }}
            />
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: { xs: 9, md: 11 },
                letterSpacing: "0.22em",
                color: "rgba(244, 247, 252, 0.7)",
                textTransform: "uppercase",
              }}
            >
              SYS.LOC // MANILA [14.5995° N, 120.9842° E]
            </Typography>
          </Box>

          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: { xs: 9, md: 11 },
              letterSpacing: "0.22em",
              color: NOIR.gold,
              textTransform: "uppercase",
            }}
          >
            ● QUANTITATIVE PLATFORM
          </Typography>
        </Box>

        {/* Center Stage: Refined Frosted Glass Card */}
        <Box
          ref={centerCardRef}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2.2,
            my: "auto",
            mx: "auto",
            position: "relative",
            p: { xs: 4, md: 5.5 },
            maxWidth: 640,
            width: "100%",
            borderRadius: "24px",
            bgcolor: "rgba(8, 18, 38, 0.5)",
            backdropFilter: "blur(24px) saturate(140%)",
            WebkitBackdropFilter: "blur(24px) saturate(140%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 30px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
          }}
        >
          {/* Central Logo & Circular Progress */}
          <Box sx={{ position: "relative", width: 130, height: 130, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg ref={innerRingRef} width="130" height="130" viewBox="0 0 140 140" style={{ position: "absolute" }}>
              <circle cx="70" cy="70" r="62" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1.5" />
              <circle
                ref={ringProgressRef}
                cx="70"
                cy="70"
                r="62"
                fill="none"
                stroke={NOIR.gold}
                strokeWidth="2"
                strokeDasharray="389.5"
                strokeDashoffset="389.5"
                strokeLinecap="round"
                style={{ transform: "rotate(-90deg)", transformOrigin: "70px 70px" }}
              />
            </svg>

            <Box
              component="img"
              src="/phitopolis_logo_hero.svg"
              alt="Phitopolis Logo"
              sx={{
                width: 50,
                height: 50,
                filter: `drop-shadow(0 0 20px rgba(255, 215, 0, 0.4))`,
                zIndex: 2,
              }}
            />
          </Box>

          {/* Clean Oversized Kinetic Counter */}
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: { xs: "3rem", sm: "4.2rem", md: "5.5rem" },
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              fontVariantNumeric: "tabular-nums",
              color: isComplete ? "#FFFFFF" : "#F4F7FC",
              textShadow: isComplete ? "0 0 25px rgba(255, 255, 255, 0.8)" : "none",
              transition: "text-shadow 0.3s ease, color 0.3s ease",
            }}
          >
            {String(progressPercent).padStart(2, "0")}%
          </Typography>

          {/* Minimalist Split Wordmark */}
          <Box
            sx={{
              display: "flex",
              perspective: 1000,
              gap: "0.06em",
              zIndex: 2,
            }}
          >
            {"PHITOPOLIS".split("").map((char, idx) => (
              <Typography
                key={`intro-char-${idx}`}
                component="span"
                sx={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 800,
                  fontSize: { xs: "1.3rem", sm: "1.8rem", md: "2.4rem" },
                  letterSpacing: "0.14em",
                  color: char === "I" || char === "T" ? NOIR.gold : "#F4F7FC",
                  display: "inline-block",
                }}
              >
                {char}
              </Typography>
            ))}
          </Box>

          {/* Subtitle / Scramble Tagline */}
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: { xs: 9, md: 10.5 },
              letterSpacing: "0.24em",
              color: "rgba(244, 247, 252, 0.6)",
              textTransform: "uppercase",
              mt: 0.5,
              zIndex: 2,
              textAlign: "center",
            }}
          >
            <ScrambleText text="MAKING TOMORROW'S TECHNOLOGY AVAILABLE TODAY" step={40} />
          </Typography>

          {/* Ticking State Label */}
          <Typography
            sx={{
              fontFamily: MONO,
              color: NOIR.gold,
              fontSize: "0.75rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              mt: 0.5,
            }}
          >
            {isComplete ? "READY" : `WARMING — ${lastLabel}`}
          </Typography>
        </Box>

        {/* Bottom Diagnostics */}
        <Box
          ref={(el) => {
            if (el) hudElementsRef.current[1] = el as unknown as HTMLDivElement;
          }}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: "100%",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: { xs: 9, md: 11 }, letterSpacing: "0.18em", color: NOIR.gold }}>
              SYS.STATUS // PIPELINE SYNCHRONIZED
            </Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: { xs: 8, md: 10 }, letterSpacing: "0.14em", color: "rgba(244, 247, 252, 0.45)" }}>
              INITIALIZING IMMERSIVE ENVIRONMENT...
            </Typography>
          </Box>

          <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
            <Typography sx={{ fontFamily: MONO, fontSize: { xs: 9, md: 10.5 }, letterSpacing: "0.18em", color: "rgba(244, 247, 252, 0.45)" }}>
              [ ESC TO SKIP ]
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
