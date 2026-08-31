/**
 * Choreography data for the Preloader intro.
 *
 * Pure data + math. **No DOM, React, `motion` or MUI imports** — the same split
 * as `src/features/hero/heroScene.ts` and `closingPhases.ts`. Keeping this a
 * pure module is what lets the parity test (`tests/motion/preloader-choreo.test.ts`)
 * pin every value without ever mounting a component, and keeps `Preloader.tsx`
 * lean enough to stay on the critical path.
 *
 * WHAT THIS REPLACES. Two earlier revisions lived here: a tumbling-letters
 * intro, then a "coordinate lock" instrument panel — four rails forming a
 * frame, gold signal pulses, corner registration ticks, a bordered/shadowed
 * stage box. The panel motif is gone. What's left is three things: the P
 * logo beside the wordmark, a description that SPAWNS IN between the mark and
 * the loading progress and visibly PUSHES them apart when it does (a real
 * layout reflow, driven by `motion/react`'s `layout` prop — the mechanism
 * lives in `Preloader.tsx`, not here), and a bottom-to-top "rise" on every
 * block's entrance instead of a flat fade or wipe.
 *
 * THE COMPOSITION, in play order:
 *   SEQ 1 — the P logo + wordmark rise together as one row (`RISE_S`), while
 *     the wordmark's own letters resolve inside that same window: a
 *     clip-path wipe (`WIPE_HIDDEN` → `WIPE_SHOWN`) with a laser riding the
 *     edge, per-letter tracking closing from `TRACKING_OPEN_PX` to 0 with a
 *     small `CHAR_BLUR_PX` blur. The progress row (caliper hairline + mono
 *     readout) rises in shortly after, sitting close beneath.
 *   SEQ 2 — the description mounts and rises in with its own two lines
 *     wiping in turn (tagline, then descriptor); the mark row and progress
 *     row are `layout`-tracked, so the moment the description claims space
 *     they animate apart to make room for it.
 * On exit each row fades/wipes back the way it came; the wordmark's own
 * wipe-out and laser retreat are kept as the one specific per-glyph effect.
 *
 * COORDINATE UNITS. None — there is no off-screen geometry left in this
 * module (no rails, no viewport-half math). Every entrance is a small, fixed
 * pixel rise plus opacity, the same for every block, so the composition reads
 * as one instrument rather than several different techniques.
 *
 * WHY THE BLUR IS SMALL. The old `BLUR_MAX_PX = 10` made glyphs genuinely
 * unreadable mid-animation. `CHAR_BLUR_PX` is 4 and the parity test asserts
 * it stays `<= 5`. Readability of the wordmark beats the effect.
 *
 * DETERMINISM. Every value is a literal. No `Math.random()` (it throws in
 * some of this repo's execution contexts) and no module-eval-time
 * computation beyond literals.
 */

/* ── clip-path wipe strings (mirror establishChoreo's mask vocabulary) ── */
export const WIPE_HIDDEN = "inset(0% 100% 0% 0%)";
export const WIPE_SHOWN = "inset(0% 0% 0% 0%)";
export const WIPE_OUT = "inset(0% 0% 0% 100%)";

/* ── the statement copy ── */

/**
 * What the firm actually does, said in two registers: a display-typeset promise
 * and a mono classification line. This is the reason the intro carries this
 * much content at all — a preloader nobody can read is a loading spinner with
 * extra steps.
 *
 * The copy is pinned by `tests/motion/preloader-choreo.test.ts` on purpose: it
 * is brand copy on the first frame every visitor sees, so a typo should fail CI
 * rather than ship.
 */
export const STATEMENT_LINES = [
  { id: "tagline", text: "Making Tomorrow's Technology Available, Today", delayS: 0 },
  { id: "descriptor", text: "A COMPETITIVE R&D FINTECH FIRM", delayS: 0.42 },
] as const;

/** Each statement line resolves with the same `inset()` wipe as the wordmark. */
export const STATEMENT_WIPE_S = 0.5;

/* ── the "rise" — every block's entrance ── */

/**
 * A shared, compact "rise" — the same transform+opacity feel
 * `stageChoreo.ts`'s `rise` variant uses for full section entrances
 * (`y: 96 → 0`, `opacity: 0.15 → 1`), scaled down for a small instrument
 * readout instead of a full page section. Deliberately no `scale` here,
 * unlike the section variant: these blocks are mostly type, and the
 * wordmark's letters already have their own resolve mechanic (wipe + blur) —
 * stacking a scale pop on top would double up motion on the same glyphs.
 *
 * One set of numbers for every block (mark row, progress row, description
 * row) rather than a bespoke rise per element, so the three reads as one
 * instrument assembling, not three different techniques.
 */
export const RISE_Y_PX = 24;
export const RISE_OPACITY_FROM = 0.15;
export const RISE_S = 0.6;

/** How long after the mark row starts rising the progress row follows. */
export const PROGRESS_RISE_DELAY_S = 0.16;

/**
 * The layout-reflow transition: how long the mark row and progress row take
 * to slide apart when the description claims space between them. Matches
 * `RISE_S` so the push reads as part of the same motion vocabulary as the
 * entrances, not a separate mechanic.
 */
export const PUSH_S = 0.6;

/* ── the timeline (seconds unless named _PX) ── */

/**
 * THE SEQUENCE TABLE.
 *
 * The exit fires at `max(CHOREO_END_S, signalsResolved) + POST_HOLD_S`
 * (unchanged from the showcase rework), so the choreography always plays in
 * full and loading runs underneath it — nothing here budgets against a race
 * with the loader.
 *
 * Two content sequences, not three: the previous revision's separate
 * "frame locks" and "wordmark resolves" acts merge into one SEQ 1 now that
 * there's no frame to lock — the mark simply rises and resolves in the same
 * window. SEQ 2 owns its own lead-in hold (`SEQ_2_HOLD_S`) rather than a
 * freestanding gap, the same relationship established in the previous
 * revision.
 *
 *   SEQ 1  0.00 → 0.90   the mark rises — logo + wordmark row, letters
 *                        resolving inside the same window; progress row
 *                        follows shortly after
 *          0.90 → 2.50   hold (the ESC hint arms at 2.05)
 *   SEQ 2  2.50 → 3.50   the description spawns — rises in, two lines wipe,
 *                        the mark and progress rows push apart to make room
 *          3.50 → 5.10   hold
 *          5.10 → 7.10   POST-100 BUFFER (or later, if signals are still out)
 *          7.10 → 9.10   the rectangular reveal
 *
 * Sequences must not bleed into their hold: each act's last frame has to land
 * inside its own `SEQ_n_LEN_S`. The parity test checks that arithmetic — if you
 * lengthen a tween here, either shorten a sibling or grow the slot.
 */

/** Buffer held after SEQ 2, before the post-100 buffer. */
export const HOLD_S = 1.6;
/** Buffer held after the choreography AND after 100%, before the reveal starts. */
export const POST_HOLD_S = 2.0;

/** SEQ 1 — the mark rises and resolves. */
export const SEQ_1_AT_S = 0;
export const SEQ_1_LEN_S = 0.9;
/**
 * SEQ 2 — the description spawns, led in by its own held silence rather than
 * a separate freestanding gap (same relationship SEQ 2 had to SEQ 1 in the
 * previous revision, kept under its original name).
 */
export const SEQ_2_HOLD_S = 1.6;
export const SEQ_2_AT_S = SEQ_1_AT_S + SEQ_1_LEN_S + SEQ_2_HOLD_S; // 2.5
export const SEQ_2_LEN_S = 1.0;
/** Last frame of the composition. Everything after this is buffer or exit. */
export const CHOREO_END_S = SEQ_2_AT_S + SEQ_2_LEN_S + HOLD_S; // 5.1

/** When the `ESC` skip affordance fades in — late in the hold before SEQ 2,
 *  once the reader has had a beat to notice the intro is going to take its
 *  time. */
export const ESC_HINT_AT_S = 2.05;
export const ESC_HINT_FADE_S = 0.4;

/* ── SEQ 1: the wordmark resolve (inside the mark row's rise) ── */

/** Lead-in before the wordmark wipe starts, inside SEQ 1. */
export const WIPE_DELAY_S = 0.06;
/** The wordmark wipe. `establishChoreo`'s mask is 0.95s; this sits under it. */
export const WIPE_S = 0.56;
/** Per-letter stagger inside the wipe. */
export const CHAR_STAGGER_S = 0.026;
/**
 * Per-letter blur, in px, that resolves to 0. SMALL on purpose — must stay
 * `<= 5`. The old intro's 10px blur made the wordmark unreadable mid-animation.
 */
export const CHAR_BLUR_PX = 4;
/** Per-step tracking the wordmark opens with and closes to 0 — applied as a pure transform. */
export const TRACKING_OPEN_PX = 10;

/**
 * Transform-only "tracking closes" offset: letter `i` of `count` starts pushed
 * outward from the block's centre by `(i - (count - 1) / 2) * step` px and
 * settles to 0. Transform-only on purpose — animating `letterSpacing` would
 * reflow the wordmark on every frame.
 */
export function trackingOffset(i: number, count: number, step: number = TRACKING_OPEN_PX): number {
  return (i - (count - 1) / 2) * step;
}
