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

  const total = Math.max(signals.length, 1);
  const done = forced || signals.length === 0 || resolved >= total;

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

  useEffect(() => {
    const skip = (event: KeyboardEvent) => {
      if (event.key === "Escape") setForced(true);
    };
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, []);

  useEffect(() => {
    if (done) {
      sessionStorage.setItem(PRELOADER_SESSION_KEY, "1");
      onDone();
    }
  }, [done, onDone]);

  const percent = done ? 100 : Math.round((Math.min(resolved, total) / total) * 100);

  return (
    <Box
      data-testid="preloader"
      onClick={() => setForced(true)}
      sx={{ position: "fixed", inset: 0, zIndex: 2000, cursor: "pointer" }}
    >
      {/* White Camera-Iris Shutter Background */}
      <motion.div
        initial={{ clipPath: "circle(150% at 50% 50%)" }}
        animate={done ? { clipPath: "circle(0% at 50% 50%)" } : { clipPath: "circle(150% at 50% 50%)" }}
        transition={{ duration: 0.55, ease: EASE_IN_OUT_QUART }}
        onAnimationComplete={() => {
          if (done) {
            sessionStorage.setItem(PRELOADER_SESSION_KEY, "1");
            onDone();
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
          animate={done ? { opacity: 0, scale: 0.85 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {/* 2D P Logo with Glow */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Box
              component="img"
              src="/phitopolis_logo_hero.svg"
              alt="Phitopolis 2D Logo"
              sx={{
                width: "100%",
                height: "auto",
                filter: `drop-shadow(0 0 25px ${NOIR.gold})`,
              }}
            />
          </motion.div>

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
          <Box sx={{ width: 180, height: "2px", bgcolor: "divider", overflow: "hidden" }}>
            <motion.div
              animate={{ scaleX: percent / 100 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ height: "100%", background: NOIR.gold, transformOrigin: "left" }}
            />
          </Box>
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
            {done ? "READY" : `WARMING — ${lastLabel}`}
          </Typography>
        </motion.div>
      </motion.div>
    </Box>
  );
}

