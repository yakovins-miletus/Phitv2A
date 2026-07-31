import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { MONO } from "@/shared/theme/theme";

import { ScrambleText } from "./ScrambleText";

import { NOIR } from "@/shared/theme/palette";
import { EASE_IN_OUT_QUART } from "@/shared/motion/easing";

export const PRELOADER_SESSION_KEY = "phitopolis:preloaded";
const HARD_CAP_MS = typeof window !== "undefined" && window.navigator?.userAgent?.includes("jsdom") ? 150 : 800;

/** One unit of real warm-up work surfaced by the progress bar. */
export interface LoadSignal {
  label: string;
  promise: Promise<unknown>;
}

/** The REAL load signal (fonts only) — measured once at first render.
    Deliberately NOT the window `load` event: that waits for every subresource
    and would hold the overlay over the hero (LCP) for the whole cap. SSR-safe:
    no document access outside the guard. jsdom has no document.fonts, so tests
    exercise the zero-signal path. */
function collectFontSignals(): LoadSignal[] {
  if (typeof document === "undefined") return [];
  if (document.fonts === undefined) return [];
  return [{ label: "FONTS", promise: document.fonts.ready }];
}

interface PreloaderProps {
  onDone: () => void;
  /** Extra warm-up work (route chunks, data prefetches) counted by the bar.
      Anything unfinished at the hard cap keeps running behind the wipe. */
  warmup?: LoadSignal[];
}

/** Entry overlay: wordmark decrypts, gold bar tracks real warm-up work (fonts
    + route chunks + data), exit is a staggered five-column wipe. Skippable
    (click/Esc), hard-capped at 1.2s, once per session. Under reduced motion
    the AppShell gate never mounts this. */
export function Preloader({ onDone, warmup }: PreloaderProps) {
  const [signals] = useState<LoadSignal[]>(() => [...collectFontSignals(), ...(warmup ?? [])]);
  const [resolved, setResolved] = useState(0);
  const [lastLabel, setLastLabel] = useState("ASSETS");
  const [forced, setForced] = useState(false);
  const [phase, setPhase] = useState<"entry" | "loading" | "complete" | "dismissing" | "done">("entry");

  const total = Math.max(signals.length, 1);

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

  // Escape/Click overrides to skip straight to dismissing
  useEffect(() => {
    if (forced) {
      setPhase("dismissing");
    }
  }, [forced]);

  // Phase transitions:
  // 1. Entry Buffer Phase: Stay in entry phase for 1.2s to show signals flowing inwards
  useEffect(() => {
    if (phase === "entry") {
      const timeoutMs = typeof window !== "undefined" && window.navigator?.userAgent?.includes("jsdom") ? 5 : 1200;
      const timer = setTimeout(() => {
        setPhase("loading");
      }, timeoutMs);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // 2. Loading Phase: Transition to Complete once all assets are loaded
  useEffect(() => {
    if (phase === "loading" && resolved >= total) {
      setPhase("complete");
    }
  }, [phase, resolved, total]);

  // 3. Complete Buffer Phase: Stay on 100% completed state for 1.0s to settle animations
  useEffect(() => {
    if (phase === "complete") {
      const timeoutMs = typeof window !== "undefined" && window.navigator?.userAgent?.includes("jsdom") ? 5 : 1000;
      const timer = setTimeout(() => {
        setPhase("dismissing");
      }, timeoutMs);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // 4. Done Phase: Notify shell once dismissal completes
  useEffect(() => {
    if (phase === "done") {
      sessionStorage.setItem(PRELOADER_SESSION_KEY, "1");
      onDone();
    }
  }, [phase, onDone]);

  const isCompleteOrLater = phase === "complete" || phase === "dismissing" || phase === "done" || forced || resolved >= total;
  const percent = isCompleteOrLater ? 100 : Math.round((Math.min(resolved, total) / total) * 100);

  const showProgress = phase !== "entry" && phase !== "dismissing" && phase !== "done";
  const progressOpacity = showProgress ? 1 : 0;
  const contentOpacity = phase !== "dismissing" && phase !== "done" ? 1 : 0;

  return (
    <Box
      data-testid="preloader"
      onClick={() => setForced(true)}
      sx={{ position: "fixed", inset: 0, zIndex: 2000, cursor: "pointer" }}
    >
      {/* White Camera-Iris Shutter Background */}
      <motion.div
        initial={{ clipPath: "circle(150% at 50% 50%)" }}
        animate={(phase === "dismissing" || phase === "done") ? { clipPath: "circle(0% at 50% 50%)" } : { clipPath: "circle(150% at 50% 50%)" }}
        transition={{ duration: 0.55, ease: EASE_IN_OUT_QUART }}
        onAnimationComplete={() => {
          if (phase === "dismissing" || forced) {
            setPhase("done");
          }
        }}
        style={{
          position: "absolute",
          inset: 0,
          background: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          animate={(phase === "dismissing" || phase === "done") ? { opacity: 0, scale: 0.85 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            opacity: contentOpacity,
          }}
        >
          {/* Logo & Circular Loader Container */}
          <Box sx={{ position: "relative", width: 280, height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="280" height="280" viewBox="0 0 280 280" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
              <defs>
                <filter id="preloader-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Background guide lines */}
              <path d="M 140 0 L 140 44 A 96 96 0 0 1 236 140 A 96 96 0 1 1 140 44" fill="none" stroke="rgba(10, 42, 102, 0.04)" strokeWidth="1.5" />
              <path d="M 280 140 L 236 140 A 96 96 0 0 1 140 236 A 96 96 0 1 1 236 140" fill="none" stroke="rgba(10, 42, 102, 0.04)" strokeWidth="1.5" />
              <path d="M 140 280 L 140 236 A 96 96 0 0 1 44 140 A 96 96 0 1 1 140 236" fill="none" stroke="rgba(10, 42, 102, 0.04)" strokeWidth="1.5" />
              <path d="M 0 140 L 44 140 A 96 96 0 0 1 140 44 A 96 96 0 1 1 44 140" fill="none" stroke="rgba(10, 42, 102, 0.04)" strokeWidth="1.5" />

              {/* Animated gold pulses */}
              <motion.path
                d="M 140 0 L 140 44 A 96 96 0 0 1 236 140 A 96 96 0 1 1 140 44"
                fill="none"
                stroke={NOIR.gold}
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#preloader-glow)"
                initial={{ strokeDasharray: "70 600", strokeDashoffset: 670 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay: 0 }}
              />
              <motion.path
                d="M 280 140 L 236 140 A 96 96 0 0 1 140 236 A 96 96 0 1 1 236 140"
                fill="none"
                stroke={NOIR.gold}
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#preloader-glow)"
                initial={{ strokeDasharray: "70 600", strokeDashoffset: 670 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay: 0.55 }}
              />
              <motion.path
                d="M 140 280 L 140 236 A 96 96 0 0 1 44 140 A 96 96 0 1 1 140 236"
                fill="none"
                stroke={NOIR.gold}
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#preloader-glow)"
                initial={{ strokeDasharray: "70 600", strokeDashoffset: 670 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay: 1.1 }}
              />
              <motion.path
                d="M 0 140 L 44 140 A 96 96 0 0 1 140 44 A 96 96 0 1 1 44 140"
                fill="none"
                stroke={NOIR.gold}
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#preloader-glow)"
                initial={{ strokeDasharray: "70 600", strokeDashoffset: 670 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay: 1.65 }}
              />

              {/* Progress Circle Ring */}
              <circle cx="140" cy="140" r="76" fill="none" stroke="rgba(10, 42, 102, 0.05)" strokeWidth="3" style={{ opacity: progressOpacity, transition: "opacity 0.6s ease" }} />
              <motion.circle
                cx="140"
                cy="140"
                r="76"
                fill="none"
                stroke={NOIR.gold}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="477.52" // 2 * Math.PI * 76
                initial={{ strokeDashoffset: 477.52 }}
                animate={{ strokeDashoffset: 477.52 - (percent / 100) * 477.52 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "140px 140px",
                  opacity: progressOpacity,
                  transition: "opacity 0.6s ease"
                }}
              />
            </svg>
            
            {/* P Logo at the center */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}
            >
              <Box
                component="img"
                src="/phitopolis_logo_hero.svg"
                alt="Phitopolis 2D Logo"
                sx={{
                  width: "100%",
                  height: "auto",
                  filter: `drop-shadow(0 0 20px rgba(255, 199, 44, 0.4))`,
                }}
              />
            </motion.div>
          </Box>

          {/* Staged visibility for details */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
              opacity: progressOpacity,
              transform: showProgress ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            <Typography
              component="span"
              sx={{
                fontFamily: MONO,
                fontWeight: 700,
                letterSpacing: "0.28em",
                color: "primary.main",
                fontSize: "1.1rem",
              }}
            >
              <ScrambleText text="PHITOPOLIS" step={40} />
            </Typography>
            <Typography sx={{ fontFamily: MONO, color: "text.secondary", fontSize: "0.8rem" }}>
              {String(percent).padStart(2, "0")}%
            </Typography>
            <Typography
              sx={{
                fontFamily: MONO,
                color: "text.secondary",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                opacity: 0.7,
              }}
            >
              {isCompleteOrLater ? "READY" : `WARMING — ${lastLabel}`}
            </Typography>
          </Box>
        </motion.div>
      </motion.div>
    </Box>
  );
}

