import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion } from "motion/react";

import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { useReducedMotion, useIsLowPowerDevice } from "@/shared/motion";
import { EASE_OUT_EXPO, EASE_IN_OUT_QUART, EASE_IN_EXPO } from "@/shared/motion/easing";
import PhitopolisLogo from "./PhitopolisLogo";
import {
  WIPE_HIDDEN,
  WIPE_SHOWN,
  WIPE_OUT,
  WIPE_S,
  WIPE_DELAY_S,
  CHAR_STAGGER_S,
  CHAR_BLUR_PX,
  STATEMENT_LINES,
  STATEMENT_WIPE_S,
  RISE_Y_PX,
  RISE_OPACITY_FROM,
  RISE_S,
  PROGRESS_RISE_DELAY_S,
  PUSH_S,
  SEQ_2_AT_S,
  CHOREO_END_S,
  POST_HOLD_S,
  ESC_HINT_AT_S,
  ESC_HINT_FADE_S,
  trackingOffset,
} from "./preloaderChoreo";

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
 * WHAT IT LOOKS LIKE, AND WHY. No frame, no bordered panel — everything sits
 * directly on a soft dark-navy ground. Three blocks, top to bottom: the P
 * logo beside the wordmark, the description (once it spawns), and the
 * loading progress. Every block RISES into place from below rather than
 * fading or wiping flat, and the description's arrival is a genuine layout
 * reflow — `motion/react`'s `layout` prop — so the mark row and the progress
 * row visibly push apart to make room for it rather than the description
 * appearing in a fixed slot between two things that never moved.
 *
 * THE COMPOSITION, in play order:
 *   SEQ 1 — the mark rises. The logo + wordmark row translates up from below
 *           while the wordmark's own letters resolve inside that same
 *           window: a clip-path wipe (`WIPE_HIDDEN` → `WIPE_SHOWN`) with a
 *           1px gold laser riding the edge, per-letter tracking closing
 *           (`trackingOffset` → 0, transform only) with a small
 *           `CHAR_BLUR_PX` blur that resolves. The progress row (caliper
 *           hairline + mono readout) rises in shortly after, sitting close
 *           beneath.
 *   SEQ 2 — the description spawns. It rises in with its own two lines
 *           wiping in turn; the mark row and progress row, `layout`-tracked,
 *           animate to their new positions in the same beat.
 *
 * THE EXIT reverses it: the wordmark wipes back out (`WIPE_SHOWN` → `WIPE_OUT`)
 * with the laser riding it, every row fades — then an expanding rectangular
 * hole opens so the site is revealed *through* the intro. Deliberately the
 * same optical idea as `fresko-home-aperture` in `viewTransitions.css`, so the
 * site has one notion of how things are revealed instead of two unrelated ones.
 *
 * ENGINEERING INVARIANTS (kept from previous revisions — these were right):
 *  - `motion/react`, never gsap. This module is on the first-paint path and
 *    must not drag GSAP into the eager bundle.
 *  - BLUR STAYS <= 5px. Large blur on display type reads as a smudge, not
 *    focus; `CHAR_BLUR_PX` is 4 and the choreo parity test pins it `<= 5`.
 *  - Every piece that RISES rests at `opacity: 0` in its JSX (matching the
 *    entrance keyframe's own start); nothing pretends to be positioned
 *    off-screen the way the old rails did, because nothing here travels far
 *    enough to need that — a rise is a small `y` + opacity, not a flight path.
 *    The wordmark's and description's CLIP is the one thing that rests LIT
 *    (`WIPE_SHOWN`, not `WIPE_HIDDEN`) rather than hidden: a tween that never
 *    runs must leave the text readable, never permanently clipped out — the
 *    same rule `SectionBeat` follows.
 *  - `layout` and a hand-authored `transform` NEVER share one element. Motion's
 *    `layout` prop snapshots an element's box across renders and animates any
 *    change; an imperative `animate()` writing `transform` on that same node
 *    would be invisible to that bookkeeping and the two would fight over the
 *    same CSS property. Every row that both rises AND gets pushed by the
 *    description's arrival is two elements: an outer `motion.div layout`
 *    that only ever reflows, and an inner plain `Box` that plays the rise.
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
 * that the assembly reads as deliberate rather than slow on a ~200KB site.
 */
const BEAT_S = 0.26;

/**
 * The reveal. A full 2 seconds so the aperture opening genuinely reads as its
 * own moment rather than a quick wipe. An animation length, not a wait; every
 * exit sub-tween below is a fraction of this so they all scale together.
 */
const OUT_DURATION_S = 2.0;

/**
 * The buffer held after the choreography lands AND after 100% — a full two
 * seconds of stillness before the reveal starts.
 *
 * This is the "let it register" beat, and it is deliberately long. Only
 * applied on a natural completion; Escape skips it entirely.
 */
const POST_HOLD_MS = POST_HOLD_S * 1000; // 2000

/**
 * How long the exit will wait for the blocking signals AFTER the choreography
 * has finished — not from mount.
 *
 * This is the one number encoding the warm-up bargain: the choreography no
 * longer races the load, so the only question left is how long a *stalled*
 * CDN may hold the reveal once there is nothing left to watch. 1500ms. Exit
 * fires the instant signals resolve, so this is a ceiling, never a wall.
 */
const SIGNAL_CAP_AFTER_CHOREO_MS = 1500;

/**
 * Unconditional unmount ceiling. Nothing may leave the overlay mounted.
 *
 * The worst non-forced path is CHOREO_END (5100) + the signal cap (1500) +
 * POST_HOLD (2000) + OUT (2000) ≈ 10600ms; 12000 clears that with margin
 * while staying an absolute ceiling. `tests/motion/preloader-choreo.test.ts`
 * pins the arithmetic.
 */
const BEAT_FAILSAFE_MS = 12000;

const WORDMARK = "PHITOPOLIS";

export interface LoadSignal {
  label: string;
  promise: Promise<unknown>;
  /**
   * Whether the reveal must wait on this signal. **Absent / `undefined` ===
   * blocking** — so a bare `{ label, promise }` (fonts, and every pre-tier
   * test) still gates the exit with zero changes. Set `blocking: false` for
   * warm-work that should keep running silently without holding the overlay:
   * route precompiles, the three.js chunk, deep-scroll / other-route imagery.
   */
  blocking?: boolean;
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
  const lowPower = useIsLowPowerDevice() === true;
  const [signals] = useState<LoadSignal[]>(() => [...collectFontSignals(), ...(warmup ?? [])]);
  const [blockingResolved, setBlockingResolved] = useState(0);
  const [lastLabel, setLastLabel] = useState("");
  const [forced, setForced] = useState(false);
  const [entranceDone, setEntranceDone] = useState(false);
  const [exiting, setExiting] = useState(false);
  // Not rendered until SEQ 2 fires. Mounting this (rather than an
  // always-present, initially-invisible block) is what the `layout`-tracked
  // mark/progress rows react to — a genuine reflow, not a simulated one.
  const [statementSpawned, setStatementSpawned] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // The layout-tracked OUTER wrapper for each row (position/reflow only —
  // never touched by an imperative transform) and the INNER plain element
  // that actually plays the rise entrance. Motion's `layout` prop snapshots
  // an element's box across renders and animates any change it finds; an
  // imperative `animate()` writing `transform` on that same node, mid-flight,
  // would be invisible to that bookkeeping and the two would fight over the
  // same CSS property. Splitting them into outer/inner avoids that entirely:
  // the outer never has a hand-authored transform, the inner never reflows.
  const markRowRef = useRef<HTMLDivElement>(null);
  const markRiseRef = useRef<HTMLDivElement>(null);
  const progressRowRef = useRef<HTMLDivElement>(null);
  const progressRiseRef = useRef<HTMLDivElement>(null);
  const statementRowRef = useRef<HTMLDivElement>(null);
  const statementRiseRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const wordRef = useRef<HTMLDivElement>(null);
  const laserRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const statementRefs = useRef<(HTMLDivElement | null)[]>([]);
  const escHintRef = useRef<HTMLDivElement>(null);

  const lowPowerRef = useRef(lowPower);
  const reducedRef = useRef(reduced);
  const isDoneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  const onStartExitRef = useRef(onStartExit);
  const exitStartedRef = useRef(false);
  const completedAt100Ref = useRef(false);

  useEffect(() => {
    onDoneRef.current = onDone;
    onStartExitRef.current = onStartExit;
    lowPowerRef.current = lowPower;
    reducedRef.current = reduced;
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

  // The reveal gates on the *blocking* tier only (fonts + the landing route's
  // above-fold-critical assets). Background signals — route precompiles, the
  // three.js chunk, deep imagery — keep resolving silently and never hold the
  // overlay; the failsafe and the signal cap stay absolute regardless.
  const blockingCount = signals.reduce((n, s) => (s.blocking === false ? n : n + 1), 0);
  const blockingTotal = Math.max(blockingCount, 1);
  const allBackground = signals.length > 0 && blockingCount === 0;
  const progressPercent =
    forced || signals.length === 0 || allBackground
      ? 100
      : Math.min(100, Math.round((blockingResolved / blockingTotal) * 100));
  const isComplete = progressPercent >= 100 || forced;

  // Real signals only. Nothing here is on a timer pretending to be progress.
  // The bar (progressPercent) tracks the blocking set — what gates is what the
  // reader sees — while `lastLabel` still ticks off every signal, blocking or
  // not, so the status line reflects all the work genuinely in flight.
  useEffect(() => {
    if (signals.length === 0) return;
    let mounted = true;
    signals.forEach((sig) => {
      const tick = () => {
        if (!mounted) return;
        setLastLabel(sig.label);
        if (sig.blocking !== false) setBlockingResolved((prev) => prev + 1);
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
    const out: Promise<unknown>[] = [];

    // The wordmark wipes back out with the laser riding the closing edge —
    // the one specific per-glyph effect, kept from every previous revision.
    if (wordRef.current) {
      out.push(
        animate(
          wordRef.current,
          { clipPath: WIPE_OUT },
          { duration: OUT_DURATION_S * 0.3, ease: EASE_IN_OUT_QUART },
        ).then(() => {}),
      );
    }
    if (laserRef.current) {
      const w = wordRef.current?.clientWidth ?? 300;
      animate(
        laserRef.current,
        { x: [0, w], opacity: [0.9, 0] },
        { duration: OUT_DURATION_S * 0.3, ease: EASE_IN_OUT_QUART },
      );
    }

    // Every row fades as a whole — belt-and-braces alongside the wordmark's
    // specific wipe-out, and the only teardown the progress row and (if it
    // spawned) the description row need.
    [markRowRef, progressRowRef, statementRowRef].forEach((ref) => {
      if (!ref.current) return;
      out.push(
        animate(ref.current, { opacity: 0 }, { duration: OUT_DURATION_S * 0.4, ease: EASE_IN_EXPO }).then(
          () => {},
        ),
      );
    });

    if (contentRef.current) {
      // Whatever a per-piece tween misses, the whole content block is gone
      // before the aperture finishes.
      out.push(
        animate(
          contentRef.current,
          { opacity: 0 },
          { duration: OUT_DURATION_S * 0.55, ease: EASE_IN_EXPO },
        ).then(() => {}),
      );
    }

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

  // PHASE A — THE CHOREOGRAPHY. Two disjoint sequences separated by held
  // stillness, scheduled off one timer set from ./preloaderChoreo's table.
  //
  // DEPS ARE `[]` ON PURPOSE. Everything after t=0 is a `setTimeout`, and
  // this effect's cleanup clears those timers — a sequence firing into an
  // unmounted tree would animate detached nodes. `reduced` and `lowPower` are
  // read through refs rather than captured as deps, so this choreography can
  // never be restarted by a prop or preference settling late (the null→false
  // flip of `useReducedMotion` in particular — see the invariants above).
  useEffect(() => {
    if (reducedRef.current === true) return;

    const cheap = lowPowerRef.current;
    const count = WORDMARK.length;
    const timers: number[] = [];
    const at = (seconds: number, run: () => void) => {
      const guarded = () => {
        if (reducedRef.current === true) return;
        run();
      };
      if (seconds <= 0) {
        guarded();
        return;
      }
      timers.push(window.setTimeout(guarded, seconds * 1000));
    };

    /* ── SEQ 1 (t=0) — THE MARK RISES ──────────────────────────────────────
     * The logo + wordmark row rises from below; the wordmark's own letters
     * resolve inside the same window rather than waiting for the row to
     * land — overlapping the two reads as one instrument coming together,
     * not a row that arrives and then, separately, starts to reveal. */
    if (markRiseRef.current) {
      animate(
        markRiseRef.current,
        { y: [RISE_Y_PX, 0], opacity: [RISE_OPACITY_FROM, 1] },
        { duration: RISE_S, ease: EASE_OUT_EXPO },
      );
    }

    if (wordRef.current) {
      animate(
        wordRef.current,
        { clipPath: [WIPE_HIDDEN, WIPE_SHOWN] },
        { duration: WIPE_S, delay: WIPE_DELAY_S, ease: EASE_IN_OUT_QUART },
      );
    }
    if (laserRef.current) {
      const w = wordRef.current?.clientWidth ?? 300;
      // Rides the wipe edge for WIPE_S, then fades over ~0.25×WIPE_S.
      animate(
        laserRef.current,
        { x: [0, w, w], opacity: [0.9, 0.9, 0] },
        { duration: WIPE_S * 1.25, delay: WIPE_DELAY_S, ease: EASE_IN_OUT_QUART, times: [0, 0.8, 1] },
      );
    }
    WORDMARK.split("").forEach((_, i) => {
      const el = letterRefs.current[i];
      if (!el) return;
      animate(
        el,
        {
          x: [trackingOffset(i, count), 0],
          opacity: [0, 1],
          ...(cheap ? {} : { filter: [`blur(${CHAR_BLUR_PX}px)`, "blur(0px)"] }),
        },
        { duration: WIPE_S, delay: WIPE_DELAY_S + i * CHAR_STAGGER_S, ease: EASE_OUT_EXPO },
      ).then(() => {
        // GPU layer hygiene: the letters are static once the wipe lands.
        el.style.willChange = "auto";
      });
    });

    // The progress row rises in shortly after the mark, sitting close
    // beneath it — before SEQ 2, mark and progress are neighbours; the
    // description spawning is what pushes them apart.
    if (progressRiseRef.current) {
      animate(
        progressRiseRef.current,
        { y: [RISE_Y_PX, 0], opacity: [RISE_OPACITY_FROM, 1] },
        { duration: RISE_S, delay: PROGRESS_RISE_DELAY_S, ease: EASE_OUT_EXPO },
      );
    }
    if (readoutRef.current) {
      animate(
        readoutRef.current,
        { opacity: [0, 1] },
        { duration: BEAT_S * 1.5, delay: PROGRESS_RISE_DELAY_S, ease: EASE_OUT_EXPO },
      );
    }

    /* ── the ESC affordance, late in the hold before SEQ 2 ─────────────────
     * The Escape handler has always existed; nothing advertised it. At this
     * length an invisible skip is not a skip. */
    at(ESC_HINT_AT_S, () => {
      const el = escHintRef.current;
      if (!el) return;
      animate(el, { opacity: [0, 0.45] }, { duration: ESC_HINT_FADE_S, ease: EASE_OUT_EXPO });
    });

    /* ── SEQ 2 — THE DESCRIPTION SPAWNS ─────────────────────────────────────
     * Mounting the block (rather than revealing an always-present one) is
     * what the `layout`-tracked mark/progress rows react to: this is a real
     * reflow, not a hand-timed simulation of one. The row's own rise-in and
     * its two lines' wipe-in are handled by the effect keyed on
     * `statementSpawned`, once the mount has actually happened. */
    at(SEQ_2_AT_S, () => setStatementSpawned(true));

    // `entranceDone` means "the composition has played". It is what Phase C's
    // buffer is measured from.
    at(CHOREO_END_S, () => setEntranceDone(true));

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
    // Genuinely no reactive deps — see the effect's docblock above.
  }, []);

  // The description's own entrance, keyed on its mount rather than a raw
  // timer: `statementRefs`/`statementRowRef` are only populated once
  // conditional rendering has actually put the DOM nodes there, and effects
  // run after commit, so this is guaranteed to see them.
  useEffect(() => {
    if (!statementSpawned) return;
    if (reducedRef.current === true) return;

    if (statementRiseRef.current) {
      animate(
        statementRiseRef.current,
        { y: [RISE_Y_PX, 0], opacity: [RISE_OPACITY_FROM, 1] },
        { duration: RISE_S, ease: EASE_OUT_EXPO },
      );
    }
    STATEMENT_LINES.forEach((line, i) => {
      const el = statementRefs.current[i];
      if (!el) return;
      animate(
        el,
        { clipPath: [WIPE_HIDDEN, WIPE_SHOWN], opacity: [0, 1] },
        { duration: STATEMENT_WIPE_S, delay: line.delayS, ease: EASE_IN_OUT_QUART },
      );
    });
  }, [statementSpawned]);

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
        { duration: BEAT_S, ease: EASE_OUT_EXPO },
      );
    }
  }, [progressPercent]);

  // PHASE C — THE BUFFER. The reveal starts at
  // `max(choreography end, signals resolved) + POST_HOLD_MS`, with the signal
  // wait capped at `SIGNAL_CAP_AFTER_CHOREO_MS` past the choreography.
  //
  // Both terms are already expressed by `entranceDone` (set at CHOREO_END_S)
  // and `isComplete`, so this reads as: once BOTH are true, hold the buffer.
  // The cap covers the case where `isComplete` never arrives.
  useEffect(() => {
    if (reduced === true) return;

    if (forced) {
      // Escape means skip, immediately. Checked BEFORE the `entranceDone` gate,
      // not after: gating Escape on the choreography finishing would make the
      // skip affordance a lie for exactly the time anyone would want to use
      // it. The buffer is a grace note for a real completion, and it is
      // bypassed here rather than letting `isComplete` (also true when
      // forced) route Escape through the same delay as a natural finish.
      triggerExit();
      return;
    }

    if (!entranceDone) return;

    if (isComplete && !completedAt100Ref.current) {
      // Choreography done AND 100%. Hold the full buffer, then reveal.
      completedAt100Ref.current = true;
      const bufferTimeout = window.setTimeout(triggerExit, POST_HOLD_MS);
      return () => {
        window.clearTimeout(bufferTimeout);
        // Reset the latch on cleanup: this ref means "a buffer timer is
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
      // Already scheduled the buffer; don't re-enter this branch.
      return;
    }

    // Choreography is done but signals are still out. Give them the cap, then
    // reveal directly — a stalled CDN doesn't also earn the buffer.
    const capTimeout = window.setTimeout(triggerExit, SIGNAL_CAP_AFTER_CHOREO_MS);
    return () => window.clearTimeout(capTimeout);
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

  const readoutTypeSx = {
    fontFamily: MONO,
    fontSize: { xs: 9, md: 10 },
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    fontVariantNumeric: "tabular-nums" as const,
  };

  return (
    <Box
      ref={rootRef}
      data-testid="preloader"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        // Soft dark navy, not the flatter/harsher `navyInk` on its own: the
        // same radial-lift shape used everywhere else on this ground
        // (`SuperHeroSequence.tsx`, `ClosingLattice.tsx`) — `navyDeep`, the
        // softer of the two, at the centre where the content sits, receding
        // to `navyInk` at the edges.
        background: `radial-gradient(ellipse at 50% 42%, ${NOIR.navyDeep} 0%, ${NOIR.navyInk} 78%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      {/* No box, no border, no shadow — every block sits directly on the
          ground. `contentRef` is a plain wrapper, not a panel: it
          exists so the exit has one belt-and-braces fade target, and so the
          three rows share a centred column without each one needing its own
          alignment. */}
      <Box
        ref={contentRef}
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          px: 3,
        }}
      >
        {/* THE MARK — the P logo beside the wordmark, exactly like the
            navbar (`AppShell.tsx`: `PhitopolisLogo` + `PH<gold>IT</gold>OPOLIS`).
            `layout` so this row visibly animates to a new position when the
            description mounts below it. */}
        <motion.div ref={markRowRef} layout transition={{ duration: PUSH_S, ease: EASE_OUT_EXPO }}>
          {/* The rise lives on this INNER element, never on the `layout`-
              tracked wrapper above — see the refs' docblock. */}
          <Box
            ref={markRiseRef}
            sx={{ display: "flex", alignItems: "center", gap: "16px", opacity: 0 }}
          >
            <PhitopolisLogo
              color={NOIR.frost}
              accentColor={NOIR.gold}
              style={{ height: 32, width: "auto", flexShrink: 0 }}
            />
            {/* Rest state is the LIT clip, not the hidden one — the same rule
                `SectionBeat` follows: the DOM default must be the final state,
                so a tween that never runs leaves the wordmark readable rather
                than permanently clipped out. Hiding is done by the letters'
                own `opacity: 0`, and the wipe supplies `WIPE_HIDDEN` as its own
                first keyframe. */}
            <Box ref={wordRef} sx={{ position: "relative", clipPath: WIPE_SHOWN }}>
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
                  // letter-spacing adds a trailing gap after the final glyph,
                  // which would push the block off-centre.
                  mr: "-0.34em",
                  display: "flex",
                }}
              >
                {/* "IT" gold, same as the nav wordmark — the one place this
                    intro ties directly to the sitewide brand mark rather than
                    inventing its own treatment. A logotype is WCAG
                    1.4.3-exempt (`palette.ts`'s `gold` docblock), so this is
                    unconditional on any ground. */}
                {WORDMARK.split("").map((char, i) => (
                  <Box
                    key={`${char}-${i}`}
                    component="span"
                    aria-hidden="true"
                    ref={(el: HTMLSpanElement | null) => {
                      letterRefs.current[i] = el;
                    }}
                    sx={{
                      display: "inline-block",
                      opacity: 0,
                      color: i === 2 || i === 3 ? NOIR.gold : "inherit",
                      willChange: "transform, opacity, filter",
                    }}
                  >
                    {char}
                  </Box>
                ))}
              </Typography>
              <Box
                ref={laserRef}
                aria-hidden="true"
                sx={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: "1px",
                  bgcolor: NOIR.gold,
                  opacity: 0,
                  willChange: "transform, opacity",
                }}
              />
            </Box>
          </Box>
        </motion.div>

        {/* THE DESCRIPTION — what the firm does, said in the wordmark's own
            vocabulary: the same `inset()` wipe, one line per beat. Not
            rendered until SEQ 2 fires — the mount itself is what pushes the
            mark and progress rows apart via `layout`. Rest state mirrors the
            wordmark's: the LIT clip so a failed tween can never leave the
            copy permanently clipped out, hidden instead by `opacity: 0`,
            which the wipe supplies as its own first keyframe. */}
        {statementSpawned && (
          <motion.div
            ref={statementRowRef}
            layout
            transition={{ duration: PUSH_S, ease: EASE_OUT_EXPO }}
            style={{ marginTop: "20px" }}
          >
            {/* Rise lives on this inner element — see the refs' docblock. */}
            <Box ref={statementRiseRef} sx={{ opacity: 0, textAlign: "center" }}>
              {STATEMENT_LINES.map((line, i) => (
                <Box
                  key={line.id}
                  ref={(el: HTMLDivElement | null) => {
                    statementRefs.current[i] = el;
                  }}
                  sx={{ clipPath: WIPE_SHOWN, willChange: "clip-path, opacity" }}
                >
                  <Typography
                    sx={
                      line.id === "tagline"
                        ? {
                            fontFamily: DISPLAY_FONT,
                            fontWeight: 400,
                            fontSize: { xs: "0.78rem", sm: "0.86rem", md: "0.95rem" },
                            lineHeight: 1.45,
                            letterSpacing: "0.02em",
                            color: `rgba(${NOIR.frostRgb}, 0.8)`,
                            maxWidth: "min(80vw, 44ch)",
                          }
                        : {
                            ...readoutTypeSx,
                            mt: 0.75,
                            color: `rgba(${NOIR.frostRgb}, 0.4)`,
                          }
                    }
                  >
                    {line.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </motion.div>
        )}

        {/* THE LOADING PROGRESS — the caliper hairline (`.est-ruler`'s
            scaleX 0→1 vocabulary; a gold scaleX fill on top is the
            real-progress bar) plus the mono status/percent readout and the
            ESC hint. `layout` so this row visibly moves down when the
            description claims space above it. */}
        <motion.div
          ref={progressRowRef}
          layout
          transition={{ duration: PUSH_S, ease: EASE_OUT_EXPO }}
          style={{ marginTop: "28px", width: "min(80vw, 320px)" }}
        >
          {/* Rise lives on this inner element — see the refs' docblock. */}
          <Box ref={progressRiseRef} sx={{ opacity: 0 }}>
            <Box aria-hidden="true" sx={{ position: "relative", height: "1px", overflow: "hidden" }}>
              <Box
                ref={trackRef}
                sx={{
                  position: "absolute",
                  inset: 0,
                  bgcolor: `rgba(${NOIR.frostRgb}, 0.16)`,
                }}
              />
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
              <Typography
                sx={{
                  ...readoutTypeSx,
                  color: `rgba(${NOIR.frostRgb}, 0.34)`,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {status}
              </Typography>
              <Typography sx={{ ...readoutTypeSx, color: `rgba(${NOIR.frostRgb}, 0.55)` }}>
                {readout}
              </Typography>
            </Box>

            {/* THE SKIP AFFORDANCE. Escape has always forced the exit;
                nothing said so. Faded in late in the hold before SEQ 2, kept
                quiet enough to read as instrumentation. */}
            <Box ref={escHintRef} aria-hidden="true" sx={{ mt: 1.5, opacity: 0, willChange: "opacity" }}>
              <Typography sx={{ ...readoutTypeSx, color: `rgba(${NOIR.frostRgb}, 0.9)` }}>
                ESC TO SKIP
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
}
