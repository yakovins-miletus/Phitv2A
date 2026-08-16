import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "motion/react";

import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";
import { EASE_OUT_EXPO, EASE_IN_OUT_QUART, EASE_SPRING_SOFT } from "@/shared/motion/easing";
import PhitopolisLogo from "./PhitopolisLogo";

/**
 * This component used to run its entrance/exit choreography on gsap. gsap is
 * removed here on purpose, not just deferred: Preloader is the first thing a
 * first-time visitor sees (AppShell renders it before anything else has
 * painted), so it has to stay in the eager bundle and be instant — there's no
 * good moment to lazy-load it without risking a blank flash while its chunk
 * fetches. `motion` is already eager (it drives header/nav micro-interactions
 * elsewhere in AppShell), so porting this choreography onto it removes a
 * dependency from the bundle rather than relocating it.
 *
 * The easings below intentionally collapse gsap's power2.out/power3.out/
 * expo.out distinctions onto this repo's one shared "reveal" curve
 * (EASE_OUT_EXPO — see easing.ts, which already names the preloader wipe as
 * one of its two intended call sites) rather than hand-picking a new
 * cubic-bezier per step. That is a deliberate simplification made while
 * porting engines, not a fidelity loss anyone will see: the buffered,
 * one-at-a-time pacing is what reads as "choreographed," not which flavour of
 * ease-out each reveal uses.
 */

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
  const reduced = useReducedMotion();
  const [signals] = useState<LoadSignal[]>(() => [...collectFontSignals(), ...(warmup ?? [])]);
  const [resolved, setResolved] = useState(0);
  const [lastLabel, setLastLabel] = useState("ASSETS");
  const [forced, setForced] = useState(false);
  const [entranceDone, setEntranceDone] = useState(false);
  // Drives the root's `pointerEvents`. This has to be React state, not a plain ref
  // flipped inside the exit effect below: a ref mutation doesn't trigger a re-render,
  // so `pointerEvents` would only ever pick up the new value whenever some *other*
  // state change happened to re-render this component next — in practice, whatever
  // AppShell's entrance-phase timers did next, several hundred ms later, not the
  // moment the overlay actually started clearing. Making it state means the DOM
  // attribute updates in the same render the curtain starts opening.
  const [exiting, setExiting] = useState(false);

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

  const entranceControlsRef = useRef<ReturnType<typeof animate> | null>(null);

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
    const crosshairs = crosshairRefs.current.filter((el): el is HTMLDivElement => el !== null);
    const logoEl = logoMarkRef.current;
    const headEl = headlineRef.current;
    const subEl = subtitleRef.current;
    const countEl = counterWrapRef.current;

    if (reduced) {
      // AppShell's reduced-motion gate resolves asynchronously, so this
      // component still has to degrade on its own: snap straight to the
      // resting state instead of playing the bounce entrance, and let the
      // rest of the lifecycle (progress, exit) proceed immediately.
      for (const el of [stageEl, frameEl, logoEl, headEl, subEl, countEl]) {
        if (el) el.style.opacity = "1";
      }
      if (coordsEl) coordsEl.style.opacity = "0.5";
      for (const el of crosshairs) el.style.opacity = "1";
      // Deferred a tick (as the non-reduced path's controls.then() also is)
      // rather than called synchronously in the effect body.
      queueMicrotask(() => setEntranceDone(true));
      return;
    }

    // Each step's [from, to] keyframe pair replaces the old gsap.set()
    // reset + tl.to() pair — motion animates between the two keyframes
    // directly, so there's no separate "reset initial state" pass.
    const CROSSHAIR_STAGGER = 0.06;
    const D1 = 0.35; // stage ground & coordinates
    const D2 = 0.5; // center frame
    const D3 = 0.35; // crosshairs (before stagger overlap)
    const D4 = 0.55; // logo mark
    const D5 = 0.55; // headline
    const D6 = 0.45; // subtitle
    const D7 = 0.4; // counter & diagnostics
    const B1 = 0.15;
    const B2 = 0.15;
    const B3 = 0.18;
    const B4 = 0.18;
    const B5 = 0.15;
    const B6 = 0.15;

    // 1. Stage ground & coordinates fade in -> buffer
    const t1 = 0;
    // 2. Center frame emerges -> buffer
    const t2 = t1 + D1 + B1;
    // 3. Corner crosshairs lock into place one-by-one -> buffer
    const t3 = t2 + D2 + B2;
    const crosshairSpan = D3 + CROSSHAIR_STAGGER * Math.max(crosshairs.length - 1, 0);
    // 4. Logo mark reveals inside frame -> buffer
    const t4 = t3 + crosshairSpan + B3;
    // 5. Headline "Welcome to Phitopolis" reveals -> buffer
    const t5 = t4 + D4 + B4;
    // 6. Subtitle brand pillar tag reveals -> buffer
    const t6 = t5 + D5 + B5;
    // 7. Counter & diagnostics reveal at bottom
    const t7 = t6 + D6 + B6;

    const controls = animate([
      [coordsEl, { opacity: [0, 0.5], y: [-8, 0] }, { duration: D1, ease: EASE_OUT_EXPO, at: t1 }],
      [stageEl, { opacity: [0, 1] }, { duration: D1, ease: EASE_OUT_EXPO, at: t1 }],
      [frameEl, { scale: [0.93, 1], opacity: [0, 1] }, { duration: D2, ease: EASE_OUT_EXPO, at: t2 }],
      [
        crosshairs,
        { opacity: [0, 1], scale: [0.6, 1] },
        { duration: D3, delay: stagger(CROSSHAIR_STAGGER), ease: EASE_SPRING_SOFT, at: t3 },
      ],
      [logoEl, { scale: [0.88, 1], opacity: [0, 1], y: [10, 0] }, { duration: D4, ease: EASE_OUT_EXPO, at: t4 }],
      [headEl, { opacity: [0, 1], y: [12, 0] }, { duration: D5, ease: EASE_OUT_EXPO, at: t5 }],
      [subEl, { opacity: [0, 1], y: [8, 0] }, { duration: D6, ease: EASE_OUT_EXPO, at: t6 }],
      [countEl, { opacity: [0, 1], y: [8, 0] }, { duration: D7, ease: EASE_OUT_EXPO, at: t7 }],
    ]);

    entranceControlsRef.current = controls;
    void controls.then(() => setEntranceDone(true));

    return () => {
      controls.stop();
    };
  }, [reduced]);

  // Update progress hairline. Animates `scaleX` (compositor-only) against a
  // fixed-width, left-anchored element rather than tweening `width` (a layout
  // property) on every tick. The fill's transform is never bound to React
  // state directly in JSX (see the render below) — only this effect touches
  // it — so each animate() call picks up from wherever the previous one left
  // off instead of racing a React-applied snap to the same value.
  useEffect(() => {
    const fillEl = progressFillRef.current;
    if (!fillEl) return;
    const controls = animate(
      fillEl,
      { scaleX: progressPercent / 100 },
      { duration: forced || reduced ? 0.1 : 0.3, ease: EASE_OUT_EXPO }
    );
    return () => controls.stop();
  }, [progressPercent, forced, reduced]);

  // Master Synchronized Exit Choreography with center-to-outward split black curtain
  useEffect(() => {
    const shouldExit = (entranceDone && isComplete) || forced;
    if (!shouldExit || isDoneRef.current || hasStartedExitRef.current) return;
    hasStartedExitRef.current = true;

    if (forced) {
      entranceControlsRef.current?.complete();
    }

    const finish = () => {
      if (!isDoneRef.current) {
        isDoneRef.current = true;
        // Same private-browsing/sandboxed-context risk as the session-gate read in
        // AppShell's shouldShowPreloader — but unguarded here it's worse than a stale
        // gate: an uncaught throw would abort this callback before reaching
        // onDoneRef.current?.() below, leaving showPreloader stuck `true` in AppShell
        // forever (the overlay would never unmount). Losing the "don't replay the
        // intro" bookkeeping for this one session is a fine trade against that.
        try {
          sessionStorage.setItem(PRELOADER_SESSION_KEY, "1");
        } catch {
          // ignore — see above
        }
        onDoneRef.current?.();
      }
    };

    const fireStartExit = () => {
      if (!exitFiredRef.current && onStartExitRef.current) {
        exitFiredRef.current = true;
        onStartExitRef.current();
      }
    };

    if (reduced) {
      // WCAG 2.3.3 fast path, mirroring TransitionCurtain's reduced-motion
      // branch: no shutter sweep, no content retreat — the overlay is about
      // to unmount, so just fire the callbacks AppShell is waiting on.
      // setExiting is deferred a tick (matching the entrance effect's own
      // queueMicrotask above) rather than called synchronously here, which
      // react-hooks/set-state-in-effect flags as a cascading-render risk.
      queueMicrotask(() => setExiting(true));
      fireStartExit();
      finish();
      return;
    }

    const topShutter = topShutterRef.current;
    const bottomShutter = bottomShutterRef.current;
    const stageEl = centerStageRef.current;
    const countEl = counterWrapRef.current;
    const coordsEl = coordsRef.current;

    const delay = forced ? 0 : 0.25;

    animate(
      [
        // Step 1: Bottom counter, coordinates and diagnostics gently draw back
        [[countEl, coordsEl], { opacity: 0, y: 8 }, { duration: 0.3, ease: EASE_OUT_EXPO, at: 0 }],
        // Step 2: Center stage content softly scales and fades
        [stageEl, { opacity: 0, scale: 0.96, y: -10 }, { duration: 0.38, ease: EASE_OUT_EXPO, at: 0.12 }],
        // Step 3: Center-to-outward split black curtain — top shutter moves
        // up to -100%, bottom shutter moves down to 100%.
        [topShutter, { y: "-100%" }, { duration: 0.85, ease: EASE_IN_OUT_QUART, at: 0.35 }],
        [bottomShutter, { y: "100%" }, { duration: 0.85, ease: EASE_IN_OUT_QUART, at: 0.35 }],
        // Release pointer-events the instant the curtain physically starts moving
        // apart (same `at: 0.35` mark as the shutter tweens above), not before and
        // not several hundred ms after. Any earlier and the overlay is still 100%
        // opaque — releasing then would let a click fall through to page content
        // the visitor cannot yet see, exactly the "click things you can't see"
        // failure mode this is guarding against. Any later (the old behavior:
        // effectively "whenever AppShell's next unrelated re-render happens to
        // land") and the overlay keeps swallowing input long after the curtain has
        // visibly started clearing.
        [() => setExiting(true), { at: 0.35 }],
        // Mid-curtain release: notify AppShell at 50% curtain split
        [fireStartExit, { at: 0.7 }],
      ],
      { delay, onComplete: finish }
    );
  }, [entranceDone, isComplete, forced, reduced]);

  return (
    <Box
      ref={rootRef}
      data-testid="preloader"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        overflow: "hidden",
        pointerEvents: exiting ? "none" : "auto",
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

      {/* Center Foreground Layer. Despite the name, nothing inside it is actually
          interactive — it's the coordinates tag, logo/headline stage, and progress
          counter, none of them a button or link. Left at the pointer-events default
          (auto), this `inset: 0` flex container was a full-viewport, mostly-transparent
          click-catcher sitting *above* the shutters (zIndex 10 vs. their 2): a runtime
          audit found it swallowing clicks meant for the header (e.g. `a[href="/about"]`)
          at every sample through the whole entrance *and* well into the exit, because it
          intercepted hits over its own empty padding/gap regions regardless of whether a
          shutter was still visually covering that pixel. Since it truly has nothing to
          click, it doesn't need to intercept anything — the shutters themselves (opaque,
          and correctly hit-tested at wherever their transform has actually moved them to)
          are what should be, and already are, the thing standing in the way. */}
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
          pointerEvents: "none",
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
            {/* Not an <h1>: this splash message isn't the page's heading — the route
                being loaded underneath already has its own — and rendering it as one
                gave every hard load a transient *second* <h1> for as long as the
                overlay was mounted. `component="p"` keeps the identical visual
                treatment (the styling below is all this element ever relied on) while
                leaving the document outline to the actual page content. */}
            <Typography
              component="p"
              sx={{
                fontFamily: "Inter, sans-serif",
                fontSize: { xs: "1.25rem", sm: "1.6rem", md: "1.95rem" },
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: NOIR.frost,
                lineHeight: 1.2,
                textTransform: "none",
                m: 0,
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
                width: "100%",
                transformOrigin: "left center",
                transform: "scaleX(0)",
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
