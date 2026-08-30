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
 * THE EXIT is an expanding rectangular hole: a centred rectangle opens and
 * grows past the corners, so the site is revealed through the intro rather than
 * having the intro removed from in front of it. Deliberately the same optical
 * idea as the home-arrival transition in `viewTransitions.css` (also a
 * rectangular aperture), so the site has one notion of how things are revealed
 * instead of two unrelated ones. It is not a handoff — nothing is shared with
 * the hero, and the hero's own entrance runs independently.
 *
 * THE BEAT MODEL. Every duration is a multiple of `BEAT_S`. The timeline:
 * 3 opening beats (wordmark, hairline, status+readout) played concurrently with
 * the loading bar → progress 0→100 paced by real signals → 2 settle beats of
 * hold (`SETTLE_HOLD_MS`) → 2 reveal beats (`OUT_DURATION_S`). Escape and the
 * settle cap both skip straight to the reveal with no hold.
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
 * The beat unit. Every duration in this module is a multiple of it, so the
 * whole intro's pacing is tunable from one constant. `0.26s` is brisk enough
 * that three opening beats + two settle beats read as deliberate rather than
 * slow on a ~200KB site.
 */
const BEAT_S = 0.26;

/**
 * The reveal — 2 beats plus a little slack. An animation length, not a wait.
 */
const OUT_DURATION_S = 0.58;

/**
 * Settle hold: 2 beats of stillness after 100% — a "resolved" beat (the READY
 * state registering) and a deliberate buffer beat — before the reveal starts.
 * The pause is what makes the reveal feel intentional rather than abrupt. Only
 * applied on a natural completion; Escape and the settle cap both skip it.
 * Replaces the old bare `POST_100_BEAT_MS = 200`.
 */
const SETTLE_HOLD_MS = 2 * BEAT_S * 1000; // 520

/**
 * Settle cap, and the one number that encodes the warm-up bargain.
 *
 * 1800ms is the compromise: long enough that a cold load usually completes the
 * warm-up, short enough that a stalled CDN costs under two seconds. Exit fires
 * the *instant* signals resolve, so a warm cache still leaves quickly — the cap
 * is a ceiling, never a wall. When it bites it fires the reveal directly, with
 * no settle hold. Escape always skips.
 */
const MAX_SETTLE_MS = 1800;

/**
 * Unconditional unmount ceiling. Nothing may leave the overlay mounted. Raised
 * from 2600 for the beat-sequenced timeline: the worst non-forced path is
 * entranceDone (2*BEAT_S = 520) waiting on a signal that resolves just under
 * the cap (~1790) → +SETTLE_HOLD (520) → +OUT (580) ≈ 2900ms; 3400 clears that
 * with margin while staying an absolute ceiling.
 */
const BEAT_FAILSAFE_MS = 3400;

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
     * The expanding rectangular hole.
     *
     * A `clip-path: circle()` (or `inset()` shrinking the overlay) would
     * contract the overlay to a point — the opposite reading. To open a hole
     * you clip the overlay to an outer rectangle with an inner rectangle
     * subtracted (a bridged polygon → nonzero-winding hole) and grow the inner
     * one from the centre point out past the corners.
     *
     * Driven by `animate(from, to, { onUpdate })` writing the style string
     * directly, rather than by handing Motion a `--custom-property` target: an
     * unregistered custom property has no interpolation type, so relying on the
     * CSS engine to tween it is undefined behaviour across browsers. A number
     * tween plus a manual write is explicit and portable.
     *
     * `g` is the hole's half-extent as a fraction of each axis; it reaches 0.53
     * (6% of slack past the edge) so the last frame is genuinely clear of the
     * viewport rather than leaving a frame around the corners.
     */
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
      root.style.willChange = "clip-path";
      out.push(
        animate(0, 1, {
          duration: OUT_DURATION_S,
          ease: EASE_OUT_EXPO,
          onUpdate: (t) => {
            const g = t * 0.53; // half-extent of the hole as a fraction (+6% slack)
            const a = (0.5 - g) * 100; // near edge % (goes negative past t≈0.94 — fine)
            const b = (0.5 + g) * 100; // far edge %
            root.style.clipPath =
              `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ` +
              `${a}% ${a}%, ${a}% ${b}%, ${b}% ${b}%, ${b}% ${a}%, ${a}% ${a}%)`;
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

  // PHASE A — OPENING. Three staggered beats, one element per beat.
  // `entranceStartedRef` latches so the null→false flip of `useReducedMotion`
  // cannot restart it; the early return below is keyed on `reduced === true` so
  // that same flip cannot strand it either.
  useEffect(() => {
    if (reduced === true) return;
    if (entranceStartedRef.current) return;
    entranceStartedRef.current = true;

    // Beat 1 (t=0): the wordmark letters stagger in.
    const letters = letterRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    if (letters.length > 0) {
      animate(
        letters,
        { opacity: [0, 1], y: [14, 0] },
        { delay: stagger(0.022), duration: BEAT_S, ease: EASE_OUT_EXPO },
      );
    }
    // Beat 2 (t=BEAT_S): the hairline rule draws.
    if (ruleRef.current) {
      animate(
        ruleRef.current,
        { opacity: [0, 1], scaleX: [0.4, 1] },
        { duration: BEAT_S, delay: BEAT_S, ease: EASE_OUT_EXPO },
      );
    }
    // Beat 3 (t=2*BEAT_S): the mono status label + 00% readout fade in. A
    // supporting beat — it gates nothing.
    if (readoutRef.current) {
      animate(readoutRef.current, { opacity: [0, 1] }, { duration: BEAT_S, delay: 2 * BEAT_S });
    }

    // `entranceDone` opens once the wordmark + hairline are established (2 beats
    // in). Beat 3 finishing is not required.
    const entranceTimer = window.setTimeout(() => setEntranceDone(true), 2 * BEAT_S * 1000);
    return () => window.clearTimeout(entranceTimer);
  }, [reduced]);

  // PHASE B — LOADING. The fill is the progress bar. scaleX only — no width
  // animation, no reflow. The per-update `BEAT_S` easing is the "reads as
  // loading, not a flash" guarantee: the bar visibly travels to its new value
  // even when signals resolve instantly. The displayed percentage never exceeds
  // the real resolved/total progress.
  useEffect(() => {
    if (fillRef.current) {
      animate(
        fillRef.current,
        { scaleX: progressPercent / 100 },
        { duration: BEAT_S, ease: "easeOut" },
      );
    }
  }, [progressPercent]);

  // PHASE C — SETTLE. After entrance is done and warmup is complete, hold for
  // SETTLE_HOLD_MS (2 beats) before starting the reveal. The cap only bites
  // when something is genuinely stuck, and when it does it fires the reveal
  // directly with no hold.
  useEffect(() => {
    if (reduced === true) return;
    if (!entranceDone) return;

    if (forced) {
      // Escape means skip, immediately — the settle hold is a grace note for a
      // real completion, not something an impatient visitor should have to sit
      // through. Bypass it entirely rather than letting `isComplete` (which is
      // also true when forced) route Escape through the same delay as a natural
      // finish.
      triggerExit();
      return;
    }

    if (isComplete && !completedAt100Ref.current) {
      // We've hit 100%. Mark it and hold for the settle beats before revealing.
      completedAt100Ref.current = true;
      const postBeatTimeout = window.setTimeout(triggerExit, SETTLE_HOLD_MS);
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
