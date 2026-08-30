# Handoff — Web intro rework (beat-sequenced, rectangular reveal)

**Created:** 2026-08-30 · **For:** a fresh session · **Status:** not started

## Goal (user's words)

> The web intro is shit, improve it properly by sequence. I think several
> components are bypassing each other and can't do the proper load and reveal.
> Make the radial reveal **rectangular** instead of a circle. Give the intro
> many elements going in beats:
>
> - **3 beats** before showing the loading progress
> - loading progress runs **0 → 100**
> - **2 beats + a buffer** after it loads
> - **2 beats** for the rectangular reveal

So the target timeline is: `intro beats ×3 → progress 0→100 → settle beats ×2 + buffer → reveal beats ×2`.

## Current intro, as built (verified 2026-08-30)

### `src/shared/components/Preloader.tsx`

- **Library:** `motion/react` only. **Never GSAP** (eager-bundle rule). Keep this.
- **Elements rendered:** the `PHITOPOLIS` wordmark split into per-letter spans; a
  1 px hairline rule with a gold scaleX fill; a two-line mono progress readout
  (`WARMING — FONTS` / `00%`).
- **Entrance:** letters stagger in (`stagger(0.022)`, `y:14→0`, `EASE_OUT_EXPO`,
  `duration 0.4`); hairline `opacity 0→1, scaleX 0.4→1` (`duration 0.5, delay 0.12`);
  readout `opacity 0→1` at `delay 0.22 + PRE_ROLL_DURATION_S`.
- **Progress:** `animate(fillRef, {scaleX: pct/100}, {duration:0.5, ease:'easeOut'})`
  driven by real `warmup` signal resolution (`resolved/total`).
- **Exit — the circular mask (REPLACE THIS):**
  ```ts
  const reach = (Math.hypot(innerWidth, innerHeight) / 2) * 1.06;
  animate(0, reach, { duration: OUT_DURATION_S, ease: EASE_OUT_EXPO,
    onUpdate: (r) => {
      const g = `radial-gradient(circle at 50% 50%, transparent ${r}px, #000 ${r}px)`;
      root.style.webkitMaskImage = g; root.style.maskImage = g;
    }});
  ```
- **Timing constants (L68–113):** `IN_DURATION_S 0.34`, `PRE_ROLL_DURATION_S 0.3`,
  `POST_100_BEAT_MS 200`, `OUT_DURATION_S 0.58`, `MAX_SETTLE_MS 1800`,
  `BEAT_FAILSAFE_MS 2600`.
- **Exit decision (`triggerExit`, L281–383):** fires once `entranceDone` **and**
  (`warmup complete + POST_100_BEAT_MS`) or `MAX_SETTLE_MS` cap or Escape.

### The circular reveal exists in TWO places — unify them

1. Preloader exit mask (above).
2. `src/shared/theme/viewTransitions.css` `@keyframes fresko-home-aperture`:
   `clip-path: circle(0% at 50% 50%) → circle(75% at 50% 50%)`, `transform: scale(1.06→1)`,
   `0.9s`, on `::view-transition-new(root)` for home routes (L110–119).
   Interior routes already use a **rectangular** `inset()` wipe (`fresko-page-arrive`, L66–75) —
   copy that language.

Preloader's own docblock (L34–40) says the two are deliberately "the same optical
idea." Keep them unified: make **both** rectangular.

### "Components bypassing each other" — the actual race

`src/features/hero/SuperHeroSequence.tsx`:
- Hero reads **`usePreloaderReady()`** (binary: `phase !== "covered"`) to gate the
  hero video/canvas *opacity* only (`~L214`, `~L872`).
- The hero's **ScrollTrigger pin timeline is NOT gated at all** — it's created on
  mount and its `onUpdate` writes `--hp-*` CSS vars from scroll position
  immediately, whether or not the intro is still on screen.
- Result: timeline *progress state* and *visual reveal* are decoupled. If the
  reader scrolls during the intro, the hero's internal animation state advances
  under an invisible layer, then "snaps" to a mid-flight pose when opacity flips.

The phase machine (`EntrancePhaseContext`, `covered→hero→header→open` in
`AppShell.tsx` ~L495–546) exists precisely to serialise this. The hero should
wait for **`useEntranceSettled()`** (`phase === "open"`) before *creating* its
ScrollTrigger — or, at minimum, hold `ScrollTrigger` `disabled: true` until then
and refresh on enable.

## Design of the new intro

### Beat model

Introduce a single ordered timeline (a `motion` sequence or an array of
`{ at, run }` steps) with a `beat` unit — pick one duration (e.g. `BEAT = 0.42s`)
and express everything as multiples so pacing is tunable from one constant.

```
Phase A — OPENING          3 beats   elements enter, staggered, one per beat-ish
Phase B — LOADING          variable  progress readout 0 → 100, paced by real signals
Phase C — SETTLE           2 beats + BUFFER   "ready" state resolves, hold
Phase D — REVEAL           2 beats   rectangular mask opens, site shows through
```

- **Phase A (3 beats):** don't dump all elements at once. Beat 1: wordmark.
  Beat 2: hairline draws. Beat 3: a supporting element (tagline / coordinate
  ticks / the mono status label) + the `00%` readout arms. Each beat is a
  distinct, legible event.
- **Phase B:** the fill + number run `0 → 100`. Paced by `warmup` signal
  resolution (keep the real-work pacing — do not fake it). If signals finish
  before Phase A ends, still show the count animating up over ≥ 1 beat so it
  reads as loading, not a flash. Coordinate the *blocking* signal set with
  `docs/preloader-full-preload/handoff.md` — the bar should reflect the
  home-critical assets that gate the reveal.
- **Phase C (2 beats + buffer):** at 100%, a short "resolved" beat (number →
  `READY` or a tick), one more beat of hold, then a deliberate `BUFFER`
  (~1 beat) of stillness before the reveal — the pause that makes the reveal
  feel intentional. This replaces the current bare `POST_100_BEAT_MS = 200`.
- **Phase D (2 beats):** the **rectangular** reveal. Beat 1: the mask starts
  opening (a rectangle/inset growing from centre, or an edge wipe — match
  whatever `viewTransitions.css` ends up doing). Beat 2: it clears the corners
  and the overlay unmounts. Fire `onStartExit` (→ `releaseEntrance()`) at the
  **start** of Phase D so the hero/header cascade overlaps the last beat, not
  after it.

### Rectangular reveal mechanics

Replace the `radial-gradient(circle …)` mask with a rectangular one. Options,
pick and document:

- **Inset mask:** `mask-image` via a linear/`conic` gradient, or animate
  `clip-path: inset(<t> <t> <t> <t>)` on the overlay from `inset(50% 50%)` (a
  centre point) to `inset(-5% -5%)` (past the edges), easing `EASE_OUT_EXPO`.
  Same "revealed through the intro" reading as today, just a rectangle.
- Keep `transform: scale(1.04 → 1)` on the *content behind* for the subtle
  push, as `fresko-home-aperture` does now.
- Mirror the exact shape/curve/duration in `viewTransitions.css`
  `fresko-home-aperture` so a home *navigation* arrival and the *first-load*
  intro reveal read identically.

### Serialising the hero

- Hero must not create its ScrollTrigger until `useEntranceSettled()`.
- On enable, call `ScrollTrigger.refresh()` (the bridge in
  `src/shared/motion/scrollTriggerBridge.ts` already exists for this).
- Verify no `--hp-*` var is written before the reveal completes.

## Invariants (do not break)

- `motion/react` only in `Preloader.tsx`.
- `BEAT_FAILSAFE_MS` (raise if the new sequence legitimately needs longer, but it
  stays an **unconditional** unmount ceiling).
- Escape skips straight to Phase D (or straight to unmount).
- `prefers-reduced-motion: reduce` → no beats, no mask animation; overlay
  resolves instantly, `phase` starts at `open`.
- Once per session (`phitopolis:preloaded`).
- 21 preloader tests green (`tests/preloader.test.tsx`,
  `tests/preloader-adversarial.test.tsx`) — read them first; several assert exact
  timing-race behaviour around the 100% → exit handoff that a rewrite will
  touch. Update deliberately, with the reason in the test.

## Verification

- Screen-record the cold first load at 1440 and 390 (real browser — the in-app
  preview pane freezes rAF; use a screencast + frame diff, see project memory
  `cdp-screenshots-too-slow-for-motion`). Confirm the 4 phases are each visibly
  distinct and the reveal is unmistakably rectangular.
- Assert (headless): during Phase A–C, `getComputedStyle(document.querySelector('#hero ...')).getPropertyValue('--hp-px')` is unset/`0` — hero timeline hasn't advanced.
- After reveal: hero pin works, no snap, `ladder-probe` geometry unchanged.
- reduced-motion: overlay gone within one frame, content lit, nav works.
