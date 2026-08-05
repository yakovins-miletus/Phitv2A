import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { MONO } from "@/shared/theme/theme";

import { ScrambleText } from "./ScrambleText";

import { NOIR } from "@/shared/theme/palette";
import { EASE_IN_OUT_QUART } from "@/shared/motion/easing";

export const PRELOADER_SESSION_KEY = "phitopolis:preloaded";
const IS_JSDOM = typeof window !== "undefined" && window.navigator?.userAgent?.includes("jsdom") === true;
const HARD_CAP_MS = IS_JSDOM ? 150 : 800;
/** The one deliberate hold: enough to read as an entrance, not enough to be a wait. */
const ENTRY_SETTLE_MS = IS_JSDOM ? 5 : 180;

/** The four quarter-turn arcs of the loader ring, and their stagger. */
const PULSE_ARCS = [
  { d: "M 140 0 L 140 44 A 96 96 0 0 1 236 140 A 96 96 0 1 1 140 44", delay: 0 },
  { d: "M 280 140 L 236 140 A 96 96 0 0 1 140 236 A 96 96 0 1 1 236 140", delay: 0.55 },
  { d: "M 140 280 L 140 236 A 96 96 0 0 1 44 140 A 96 96 0 1 1 140 236", delay: 1.1 },
  { d: "M 0 140 L 44 140 A 96 96 0 0 1 140 44 A 96 96 0 1 1 44 140", delay: 1.65 },
] as const;

/**
 * One travelling gold pulse.
 *
 * These used to carry `filter="url(#preloader-glow)"` — an `feGaussianBlur` re-rasterised
 * on every frame of a `repeat: Infinity` animation, four times over, while eight warm-up
 * promises raced behind the overlay. It was the single most expensive thing on screen
 * during load. The glow is now a wide translucent stroke under a crisp core: two paint
 * ops instead of a filter pass, visually equivalent at this stroke width.
 */
function PulseArc({ d, delay }: { d: string; delay: number }) {
  const dash = { strokeDasharray: "70 600" } as const;
  const anim = {
    initial: { strokeDashoffset: 670 },
    animate: { strokeDashoffset: 0 },
    transition: { duration: 2.2, repeat: Infinity, ease: "linear" as const, delay },
  };
  return (
    <>
      <motion.path
        d={d}
        fill="none"
        stroke={NOIR.gold}
        strokeWidth="7"
        strokeLinecap="round"
        opacity={0.22}
        style={dash}
        {...anim}
      />
      <motion.path
        d={d}
        fill="none"
        stroke={NOIR.gold}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={dash}
        {...anim}
      />
    </>
  );
}

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
  const [phase, setPhase] = useState<"entry" | "loading" | "dismissing" | "done">("entry");

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

  // Phase transitions.
  //
  // These used to hold for 1200ms (entry) + 1000ms (complete) + 550ms (wipe) = 2,750ms
  // of hardcoded setTimeout, regardless of how fast the page actually loaded — and the
  // hero's own fades then ran on top, so nothing was fully present for ~7.5s. The
  // buffers are gone: the overlay now tracks real signals and leaves as soon as they
  // resolve. ENTRY_SETTLE_MS is the one deliberate hold left, just long enough for the
  // wordmark to register as a considered entrance rather than a flash.
  //
  // 1. Entry: a single short settle, then straight to tracking real work.
  useEffect(() => {
    if (phase === "entry") {
      const timer = setTimeout(() => {
        setPhase("loading");
      }, ENTRY_SETTLE_MS);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // 2. Loading → dismissing, the moment the real signals resolve.
  //
  // There used to be a distinct "complete" phase in between, whose only job was to hold
  // for 1000ms. With that buffer gone the phase had nothing left to do but immediately
  // forward to "dismissing", so it is skipped entirely rather than kept as a state that
  // exists for one render. The iris wipe is the outro.
  useEffect(() => {
    if (phase === "loading" && resolved >= total) {
      setPhase("dismissing");
    }
  }, [phase, resolved, total]);

  // 4. Done Phase: Notify shell once dismissal completes
  useEffect(() => {
    if (phase === "done") {
      sessionStorage.setItem(PRELOADER_SESSION_KEY, "1");
      onDone();
    }
  }, [phase, onDone]);

  const isCompleteOrLater = phase === "dismissing" || phase === "done" || forced || resolved >= total;
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
          // The base ground, matching index.html's pre-JS paint exactly, so the
          // handoff from the static <style> to this overlay is invisible. Not glass:
          // this covers the whole viewport with nothing behind it to blur, and it is
          // the first thing painted — a backdrop-filter here would be pure cost.
          background: "var(--g-base)",
          backgroundColor: "var(--g-ink)",
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
              {/* Background guide lines */}
              {PULSE_ARCS.map((arc) => (
                <path key={`guide-${arc.delay}`} d={arc.d} fill="none" stroke="var(--glass-divider)" strokeWidth="1.5" />
              ))}

              {/* Animated gold pulses */}
              {PULSE_ARCS.map((arc) => (
                <PulseArc key={`pulse-${arc.delay}`} d={arc.d} delay={arc.delay} />
              ))}

              {/* Progress Circle Ring */}
              <circle cx="140" cy="140" r="76" fill="none" stroke="var(--glass-border-1)" strokeWidth="3" style={{ opacity: progressOpacity, transition: "opacity 0.6s ease" }} />
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
                component="img" decoding="async"
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
                // Was `primary.main` — navy, which on the navy overlay is invisible.
                color: "var(--text-1)",
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
                // --text-3, not text.secondary at opacity 0.7: that compounded to an
                // effective 0.49 alpha, which measures under the 4.5:1 body floor.
                // The muted token is 0.60 and verified against every surface.
                color: "var(--text-3)",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
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

