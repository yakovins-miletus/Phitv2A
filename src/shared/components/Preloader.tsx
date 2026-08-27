import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import { animate, stagger } from "motion/react";

import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion } from "@/shared/motion";
import { EASE_OUT_EXPO } from "@/shared/motion/easing";

/**
 * The intro.
 *
 * WHAT IT IS FOR. Not a splash screen. While it holds, `useWarmupSignals` in
 * AppShell is running `router.preloadRoute()` across every route and decoding
 * the hero-critical image manifest — so the screen time buys precompiled route
 * chunks and warm assets, and every navigation afterwards is zero-fetch. That
 * is the deal: the visitor waits once, briefly, and never waits again. An intro
 * that doesn't buy something is a tax, and this one is measured against that.
 *
 * WHAT IT LOOKS LIKE, AND WHY IT LOOKS LIKE SO LITTLE. The previous version was
 * a cockpit: fabricated GPS coordinates (`SYS.LOC // MANILA [14.5995° N ...]`),
 * corner crosshairs, a framed logo plate, "Welcome to Phitopolis", a subtitle,
 * and a progress bar that read 100% within 350ms. Three problems. The telemetry
 * was invented data on a marketing site for a firm whose product is real
 * numbers. The greeting spent the one uninterrupted branded moment on saying
 * hello. And a bar that is full before anyone perceives it is decoration
 * wearing instrumentation's clothes.
 *
 * What is left is three elements: the wordmark, one hairline, and the count.
 * The hairline is the only geometric act and it is driven by real resolved
 * signals — if it moves slowly, something genuinely is slow.
 *
 * THE EXIT is an expanding circular mask: a hole opens at the centre and grows
 * past the corners, so the site is revealed through the intro rather than
 * having the intro removed from in front of it. Deliberately the same optical
 * idea as the home-arrival transition in `viewTransitions.css`, so the site has
 * one notion of how things are revealed instead of two unrelated ones. It is
 * not a handoff — nothing is shared with the hero, and the hero's own entrance
 * runs independently.
 *
 * ENGINEERING INVARIANTS (kept from the previous revision — these were right):
 *  - `motion/react`, never gsap. This module is on the first-paint path and
 *    must not drag GSAP into the eager bundle.
 *  - `useReducedMotion()` is compared with `=== true`. It returns
 *    `boolean | null` and is null on first render; bare truthiness here caused
 *    a freeze where the entrance effect re-ran on null→false, killed its own
 *    animation, and early-returned on a latched ref so `onDone` never fired.
 *  - An unconditional failsafe resolves the overlay even if every animation and
 *    every signal fails. Nothing may leave this mounted.
 */

export const PRELOADER_SESSION_KEY = "phitopolis:preloaded";

/**
 * The intro's *floor* — what it costs when there is nothing whatever to warm.
 *
 * Measured on a warm localhost, where every signal resolves before the entrance
 * gate even opens, the first draft sat on screen for 1.14s (0.42 entrance +
 * 0.72 exit). That is the exact failure the previous cockpit version had: time
 * spent on choreography rather than on loading, paid by the visitors who needed
 * it least. Trimmed to a ~0.92s floor, which still reads as deliberate rather
 * than as a flash.
 *
 * Both numbers are animation lengths, not waits — the settle gate between them
 * collapses to zero the moment the warm-up finishes.
 */
const IN_DURATION_S = 0.34;
const OUT_DURATION_S = 0.58;

/**
 * Pre-roll beat: a short brand hold (wordmark, hairline) before the progress
 * counter appears. This allows the number to arrive into an established frame
 * instead of popping in immediately. The wordmark and hairline are visible
 * during this beat; the counter (readout) delays its entrance.
 *
 * Target warm-cache intro duration: ~1.5s total
 *  - 0.34s entrance (wordmark + hairline)
 *  - 0.30s pre-roll hold (counter hidden)
 *  - 0.58s exit (mask reveal)
 *  - 0.20s post-100 beat (pause at 100% before exit)
 *  - Paced progress easing across signals (0.5s per update)
 *
 * This 1.5s duration is deliberately modest: on a 200KB site it reads as
 * considered, not as a stall. Lusion buys length with genuinely heavy WebGL;
 * this site should not hide behind fabricated work.
 */
const PRE_ROLL_DURATION_S = 0.3;

/**
 * Post-100 beat: a brief pause after progress reaches 100% before the exit
 * sequence (mask reveal) starts. This gives the "READY" state a moment to
 * register visually before the site is revealed.
 */
const POST_100_BEAT_MS = 200;

/**
 * Settle cap, and the one number that encodes the warm-up bargain.
 *
 * The previous revision capped settle at 800ms as part of a 1.5s total budget.
 * That budget was written for a transition, not for a preloader whose whole job
 * is to finish warming four route chunks plus a twelve-image manifest — at
 * 800ms it would routinely give up partway and the navigations it was supposed
 * to make instant would still fetch.
 *
 * 1800ms is the compromise: long enough that a cold load usually completes the
 * warm-up, short enough that a stalled CDN costs under two seconds. Exit fires
 * the *instant* signals resolve, so a warm cache still leaves in ~450ms — the
 * cap is a ceiling, never a wall. Escape always skips. The post-100 beat adds
 * 200ms, so the new effective cap is ~2000ms before exit.
 */
const MAX_SETTLE_MS = 1800;
const BEAT_FAILSAFE_MS = 2600;

const WORDMARK = "PHITOPOLIS";

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
  const reduced = useReducedMotion();
  const [signals] = useState<LoadSignal[]>(() => [...collectFontSignals(), ...(warmup ?? [])]);
  const [resolved, setResolved] = useState(0);
  const [lastLabel, setLastLabel] = useState("");
  const [forced, setForced] = useState(false);
  const [entranceDone, setEntranceDone] = useState(false);
  const [exiting, setExiting] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const ruleRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);

  const isDoneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  const onStartExitRef = useRef(onStartExit);
  const entranceStartedRef = useRef(false);
  const exitStartedRef = useRef(false);
  const completedAt100Ref = useRef(false);

  useEffect(() => {
    onDoneRef.current = onDone;
    onStartExitRef.current = onStartExit;
  });

  const finish = useCallback(() => {
    if (isDoneRef.current) return;
    isDoneRef.current = true;
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(PRELOADER_SESSION_KEY, "1");
      }
    } catch {
      // sessionStorage is blocked in private mode and some embedded webviews.
      // Losing the once-per-session guarantee is acceptable; throwing is not.
    }
    onDoneRef.current();
  }, []);

  const total = Math.max(signals.length, 1);
  const progressPercent =
    forced || signals.length === 0 ? 100 : Math.min(100, Math.round((resolved / total) * 100));
  const isComplete = progressPercent >= 100 || forced;

  // Real signals only. Nothing here is on a timer pretending to be progress.
  useEffect(() => {
    if (signals.length === 0) return;
    let mounted = true;
    signals.forEach((sig) => {
      const tick = () => {
        if (!mounted) return;
        setResolved((prev) => prev + 1);
        setLastLabel(sig.label);
      };
      sig.promise.then(tick).catch(tick);
    });
    return () => {
      mounted = false;
    };
  }, [signals]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setForced(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const triggerExit = useCallback(() => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;
    setExiting(true);
    onStartExitRef.current?.();

    if (reduced === true) {
      finish();
      return;
    }

    const root = rootRef.current;

    /**
     * The expanding hole.
     *
     * A `clip-path: circle()` would contract the overlay to a dot at the
     * centre — the opposite reading. To open a hole you need a mask whose
     * transparent region grows, which means animating a radial-gradient stop.
     *
     * Driven by `animate(from, to, { onUpdate })` writing the style directly,
     * rather than by handing Motion a `--custom-property` target: an unregistered
     * custom property has no interpolation type, so relying on the CSS engine to
     * tween it is undefined behaviour across browsers. A number tween plus a
     * manual write is explicit and portable.
     *
     * Radius reaches the far corner (half the diagonal) with 6% of slack, so the
     * last frame is genuinely clear of the viewport rather than leaving a
     * vignette in the corners.
     */
    const reach =
      typeof window === "undefined"
        ? 1200
        : (Math.hypot(window.innerWidth, window.innerHeight) / 2) * 1.06;

    const out: Promise<unknown>[] = [];

    if (stageRef.current) {
      // The content clears slightly ahead of the mask so the hole opens onto a
      // clean field instead of catching the wordmark mid-dissolve.
      out.push(
        animate(
          stageRef.current,
          { opacity: 0, y: -8 },
          { duration: OUT_DURATION_S * 0.42, ease: "easeIn" },
        ).then(() => {}),
      );
    }

    if (root) {
      root.style.willChange = "mask-image, -webkit-mask-image";
      out.push(
        animate(0, reach, {
          duration: OUT_DURATION_S,
          ease: EASE_OUT_EXPO,
          onUpdate: (r) => {
            const g = `radial-gradient(circle at 50% 50%, transparent ${r}px, #000 ${r}px)`;
            root.style.webkitMaskImage = g;
            root.style.maskImage = g;
          },
        }).then(() => {}),
      );
    }

    // Belt and braces: the timer resolves even if a Motion promise never
    // settles (a backgrounded tab suspends rAF, so this is not hypothetical).
    const timer = window.setTimeout(finish, OUT_DURATION_S * 1000 + 60);
    Promise.all(out)
      .catch(() => undefined)
      .then(() => {
        window.clearTimeout(timer);
        finish();
      });
  }, [reduced, finish]);

  useEffect(() => {
    if (reduced === true) {
      onStartExitRef.current?.();
      finish();
    }
  }, [reduced, finish]);

  // IN beat. `entranceStartedRef` latches so the null→false flip of
  // `useReducedMotion` cannot restart it; the early return below is keyed on
  // `reduced === true` so that same flip cannot strand it either.
  useEffect(() => {
    if (reduced === true) return;
    if (entranceStartedRef.current) return;
    entranceStartedRef.current = true;

    const letters = letterRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    if (letters.length > 0) {
      animate(
        letters,
        { opacity: [0, 1], y: [14, 0] },
        { delay: stagger(0.022), duration: 0.4, ease: EASE_OUT_EXPO },
      );
    }
    if (ruleRef.current) {
      animate(
        ruleRef.current,
        { opacity: [0, 1], scaleX: [0.4, 1] },
        { duration: 0.5, delay: 0.12, ease: EASE_OUT_EXPO },
      );
    }
    // PRE-ROLL BEAT: delay the readout (progress counter) appearance until after
    // the wordmark and hairline are established. This gives the counter room to
    // appear into a stable frame rather than competing with the entrance.
    if (readoutRef.current) {
      animate(
        readoutRef.current,
        { opacity: [0, 1] },
        { duration: 0.3, delay: 0.22 + PRE_ROLL_DURATION_S }
      );
    }

    const entranceTimer = window.setTimeout(
      () => setEntranceDone(true),
      (IN_DURATION_S + PRE_ROLL_DURATION_S) * 1000
    );
    return () => window.clearTimeout(entranceTimer);
  }, [reduced]);

  // PACED PROGRESS: The fill is the progress bar. scaleX only — no width animation,
  // no reflow. Duration increased from 0.28s to 0.5s to create a visible easing
  // effect as the bar approaches its true value. The displayed percentage never
  // exceeds the real resolved/total progress.
  useEffect(() => {
    if (fillRef.current) {
      animate(fillRef.current, { scaleX: progressPercent / 100 }, { duration: 0.5, ease: "easeOut" });
    }
  }, [progressPercent]);

  // SETTLE + POST-100 BEAT. After entrance is done and warmup is complete,
  // wait for a brief post-100 beat before starting the exit (mask reveal).
  // The cap only bites when something is genuinely stuck.
  useEffect(() => {
    if (reduced === true) return;
    if (!entranceDone) return;

    if (forced) {
      // Escape means skip, immediately — the post-100 beat is a grace note for
      // a real completion, not something an impatient visitor should have to
      // sit through. Bypass it entirely rather than letting `isComplete`
      // (which is also true when forced) route Escape through the same delay
      // as a natural finish.
      triggerExit();
      return;
    }

    if (isComplete && !completedAt100Ref.current) {
      // We've hit 100%. Mark it and wait for the post-100 beat before exiting.
      completedAt100Ref.current = true;
      const postBeatTimeout = window.setTimeout(triggerExit, POST_100_BEAT_MS);
      return () => {
        window.clearTimeout(postBeatTimeout);
        // Reset the latch on cleanup: this ref means "a post-100 timer is
        // currently pending", not "completion was ever seen". If `reduced`
        // (or `triggerExit`, itself dependent on `[reduced, finish]`) changes
        // identity before the timer fires, this effect re-runs — resetting
        // here lets it correctly reschedule instead of falling into the
        // `if (completedAt100Ref.current) return;` dead branch below. A
        // redundant reschedule after triggerExit has already fired is
        // harmless: triggerExit/finish are idempotent via
        // exitStartedRef/isDoneRef.
        completedAt100Ref.current = false;
      };
    }

    if (completedAt100Ref.current) {
      // Already scheduled the post-100 beat; don't re-enter this branch.
      return;
    }

    // Not complete yet; wait for settle cap to fire.
    const settleTimeout = window.setTimeout(triggerExit, MAX_SETTLE_MS);
    return () => window.clearTimeout(settleTimeout);
  }, [entranceDone, isComplete, forced, reduced, triggerExit]);

  // Unconditional. Nothing may leave this overlay mounted — not a rejected
  // animation, not a hung signal, not a suspended tab.
  useEffect(() => {
    const failsafeTimer = window.setTimeout(() => {
      if (!isDoneRef.current) {
        onStartExitRef.current?.();
        finish();
      }
    }, BEAT_FAILSAFE_MS);
    return () => window.clearTimeout(failsafeTimer);
  }, [finish]);

  const readout = `${String(progressPercent).padStart(2, "0")}%`;
  const status = isComplete ? "READY" : lastLabel ? `WARMING — ${lastLabel}` : "WARMING";

  return (
    <Box
      ref={rootRef}
      data-testid="preloader"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        bgcolor: NOIR.navyInk,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      {/* One column, sized by the wordmark. The rule and the readout inherit
          that width rather than being given one, so the three elements stay
          optically locked at every viewport without a media query. */}
      <Box
        ref={stageRef}
        sx={{ display: "inline-flex", flexDirection: "column", alignItems: "stretch", px: 3 }}
      >
        <Typography
          component="h1"
          aria-label="Phitopolis"
          sx={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 600,
            fontSize: { xs: "1.55rem", sm: "2.1rem", md: "2.6rem" },
            lineHeight: 1,
            color: NOIR.frost,
            letterSpacing: "0.34em",
            // letter-spacing adds a trailing gap after the final glyph, which
            // would push the block off-centre and desync the rule beneath it.
            mr: "-0.34em",
            display: "flex",
          }}
        >
          {WORDMARK.split("").map((char, i) => (
            <Box
              key={`${char}-${i}`}
              component="span"
              aria-hidden="true"
              ref={(el: HTMLSpanElement | null) => {
                letterRefs.current[i] = el;
              }}
              sx={{ display: "inline-block", willChange: "transform, opacity" }}
            >
              {char}
            </Box>
          ))}
        </Typography>

        {/* The one geometric act. Track plus a scaleX fill — real progress. */}
        <Box
          ref={ruleRef}
          aria-hidden="true"
          sx={{
            position: "relative",
            height: "1px",
            mt: { xs: 2.5, md: 3 },
            bgcolor: `rgba(${NOIR.frostRgb}, 0.16)`,
            transformOrigin: "left center",
            overflow: "hidden",
          }}
        >
          <Box
            ref={fillRef}
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: NOIR.gold,
              transformOrigin: "left center",
              transform: "scaleX(0)",
              willChange: "transform",
            }}
          />
        </Box>

        <Box
          ref={readoutRef}
          sx={{
            mt: 1.25,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 2,
          }}
        >
          {/* Real signal names, not invented telemetry. Kept small and quiet:
              it explains the wait to anyone who looks for it and disappears for
              everyone who doesn't. */}
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: { xs: 8.5, md: 9.5 },
              letterSpacing: "0.24em",
              color: `rgba(${NOIR.frostRgb}, 0.34)`,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {status}
          </Typography>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: { xs: 8.5, md: 9.5 },
              letterSpacing: "0.24em",
              color: `rgba(${NOIR.frostRgb}, 0.55)`,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {readout}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
