# Web intro — showcase rework (2026-08-31)

Addendum to [`assemble-rework-2026-08-31.md`](assemble-rework-2026-08-31.md),
which is itself an addendum to [`handoff.md`](handoff.md). The beat model, the
signal tiers, `useEntranceSettled()` gating, `fresko-home-aperture` and the
`sessionStorage` once-per-session guard are all unchanged. What changed is the
pacing, the content, and the coupling between the two.

## The problem

The assemble rework left a technically correct intro that nobody could read.
Four acts overlapped inside ~1.0s because they had to: `ASSEMBLY_BUDGET_S = 0.72`
existed only because the exit fired as soon as the blocking signals resolved,
and on a warm cache that is immediately. The intro also said nothing about the
firm — it was a wordmark and a progress bar.

## The timeline

| t (s) | |
|---|---|
| 0.00 → 0.90 | **SEQ 1 — frame lock.** Rails fly in on-axis, gold pulses travel, caliper track draws, readout rises. |
| 0.90 → 2.50 | **HOLD 1** (`HOLD_S = 1.6`). `ESC TO SKIP` fades in at 2.05. |
| 2.50 → 3.36 | **SEQ 2 — wordmark resolves.** `inset()` wipe + laser + per-letter tracking-close/deblur. |
| 3.36 → 4.96 | **HOLD 2** (1.6). |
| 4.96 → 5.96 | **SEQ 3 — the statement.** Tagline wipes in, descriptor follows 0.42s later. |
| 5.96 → 7.96 | **POST-100 BUFFER** (`POST_HOLD_S = 2.0`). |
| 7.96 → 8.54 | **Rectangular reveal** — the aperture block, unchanged. |

Loading runs continuously underneath and is not a phase.

## The structural change

`ASSEMBLY_BUDGET_S` is deleted, not retuned. The exit is now

```
max(CHOREO_END_S, signalsResolved) + POST_HOLD_MS
```

with the signal wait capped at `SIGNAL_CAP_AFTER_CHOREO_MS = 1500` **measured
from the end of the choreography**, not from mount. The choreography therefore
always plays in full; resolving early buys a faster site, not a shorter intro.
`BEAT_FAILSAFE_MS` rises 3400 → 11000 to stay above the worst non-forced path
(5960 + 1500 + 2000 + 580 ≈ 9990).

## Bugs found and fixed while building this

1. **StrictMode killed the choreography in dev.** Everything past t=0 is now a
   `setTimeout`, and the effect's cleanup must clear those timers. With the old
   `entranceStartedRef` latch and `[reduced]` deps, StrictMode's double-invoke
   meant mount #1 scheduled, its cleanup cancelled, and mount #2 hit the latch
   and early-returned — SEQ 2 and SEQ 3 never ran and the wordmark never
   appeared. Fixed by dropping the latch and the `reduced` dependency: deps are
   `[]`, and `reducedRef` is read at schedule time *and* inside every deferred
   callback. That preserves what the latch existed for (the null→false flip of
   `useReducedMotion` must not restart the intro) more directly than the latch
   did.
2. **Escape was gated behind the choreography.** Phase C returned early on
   `!entranceDone` before checking `forced`, so the skip affordance would have
   been a lie for the eight seconds anyone would want it. `forced` is now
   checked first; Escape exits in ~630ms measured.
3. **The statement flashed during hold 1.** Resting at `opacity: 1` showed both
   lines three seconds before their own sequence. Rest state now mirrors the
   wordmark's exactly — LIT clip, `opacity: 0`, hidden by the wipe's own first
   keyframe.

## Easing

`EASE_IN_EXPO = [0.7, 0, 0.84, 0]` added to `@/shared/motion/easing` as the exit
counterpart to `EASE_OUT_EXPO`. Every string ease in `Preloader.tsx`
(`"easeIn"` × 4, `"easeOut"` × 1) is now a token; there are no bare string
curves left in the module.

## Invariants held

- The aperture block and its comment: byte-for-byte unchanged.
- `data-testid="preloader"`, the `READY` / `WARMING — <label>` / `NN%` strings.
- `lockSweepRef` stays a separate element from `laserRef`.
- transform / opacity / clipPath / filter only. No rotation. Blur ≤ 5px.
- Reduced motion resolves instantly at all three levels; low-power still skips
  the pulses and the per-letter blur without shortening the timeline.
- `AppShell.tsx`, `viewTransitions.css` and the hero pin gate are untouched.

## Verified

`yarn typecheck && yarn test && yarn lint` green (519 tests, 0 eslint errors).
In a real Chromium via Playwright at 1440×900 and 390×844: sequence boundaries
sampled at the expected times, statement hidden through both holds, ESC hint
0 → 0.45 at 2.05s, exit at ~8.5s, Escape 628ms, warm reload skips the intro,
`prefers-reduced-motion: reduce` never mounts the overlay, no horizontal
overflow on mobile.

**Do not judge this motion from the in-app preview pane.** It throttles timers
and rAF hard enough that the scheduled sequences appear never to fire — that
cost a full debugging cycle here. Use Playwright, or a live screenshot burst.

## Cost

The preloader test suites are real-timer tests, so the suite is ~80s slower.
Their windows are now derived from `CHOREO_END_S` / `POST_HOLD_S` rather than
retyped, so re-pacing the intro widens them automatically.

---

## Addendum (same day) — pacing merge, longer reveal, light re-skin

Three follow-up changes on top of the showcase rework above.

### 1. SEQ 2 now owns its lead-in hold

The still frame before the wordmark resolves was a freestanding gap between
SEQ 1 and SEQ 2 (`HOLD_S`). It is now `SEQ_2_HOLD_S`, defined and consumed as
part of SEQ 2's own timing — one sequence, one held silence, one payoff — the
same relationship SEQ 3 already has with the hold before *it*. No visible
timing changed (`SEQ_2_AT_S` is still 2.5s); this is a grouping fix, not a
re-pacing.

### 2. The reveal is 2 seconds

`OUT_DURATION_S` 0.58 → 2.0, using the same `EASE_OUT_EXPO` curve — the
aperture opening now reads as its own moment rather than a quick wipe.
`BEAT_FAILSAFE_MS` rises 11000 → 13000 to clear the new worst-case path
(5960 + 1500 + 2000 + 2000 ≈ 11460). Every real-timer test that waits on a
natural exit (`WARM_EXIT_MS`, `STALL_EXIT_MS`, `EXIT_WINDOW_MS`, the two
Escape tests) is re-derived from the new constants rather than retyped.

New full timeline: SEQ1 0→0.9 · SEQ2 0.9→3.36 (hold 0.9→2.5, resolve
2.5→3.36) · hold 3.36→4.96 · SEQ3 4.96→5.96 · buffer 5.96→7.96 · reveal
7.96→9.96. Total ≈ 10s.

### 3. Light re-skin — soft white, not dark navy

The intro moved from `NOIR.navyInk` to a soft off-white ground, keeping every
sequence, timing, and DOM structure identical. This was a token swap, not a
rebuild — `src/shared/theme/palette.ts` already carried a full light-ground
token set (`void`, `white`, `navyField`, `hairline`) retired when the site
went dark, exactly matched to what a light preloader needs:

| Element | Was (dark) | Now (light) |
|---|---|---|
| Ground | `NOIR.navyInk` flat | `radial-gradient(ellipse, NOIR.white → NOIR.void)` — a soft lift, not a flat page |
| Stage panel | (none) | `rgba(NOIR.whiteRgb, 0.55)` + a two-layer soft shadow (`navyFieldRgb` at 0.06/0.08) so the panel reads as lifted, the light-mode equivalent of the glow a dark panel gets for free |
| Rails, caliper track | `frostRgb` alpha | `navyFieldRgb` alpha |
| Tick borders, ESC hint, readout, statement | `frostRgb` alpha | `navyFieldRgb` alpha |
| Wordmark | `NOIR.frost` solid | `NOIR.navyField`, except letters 2–3 |
| Gold pulses, laser, lock sweep, progress fill | `NOIR.gold` | unchanged — the brand's fills/borders/icons rule (`palette.ts`) keeps these gold on any ground |

**The wordmark now reads PH<span style="color:#FFC72C">IT</span>OPOLIS** —
letters 2–3 in `NOIR.gold`, matching the sitewide nav mark exactly
(`AppShell.tsx`: `PH<Box sx={{color: NOIR.gold}}>IT</Box>OPOLIS`). This is the
one place the intro now ties directly to the real logo instead of inventing
its own treatment, and it means the aperture reveal hands off into a wordmark
the visitor has already seen. A logotype is WCAG 1.4.3-exempt (documented in
`palette.ts`'s `gold` docblock), so the per-letter color is unconditional.

No new mechanics, no new invariant violations: still transform / opacity /
clipPath / filter only, no rotation, blur ≤ 5px. The panel shadow and
background gradient are static (not animated), so they cost nothing against
the reduced-motion or low-power budget.

**Not used**, deliberately, from the research pass that informed this: grid
overlays, crosshair dial indices, paper texture, shimmer sweeps, or
progressive multi-tone navy reveals. Those add new mechanics or new elements
this rework's brief didn't ask for; the two adopted ideas (a soft vignette
ground, a lifted-panel shadow) were the ones that fit inside the existing
structure without inventing anything new to test or maintain.

Verified: `yarn typecheck && yarn test && yarn lint` green (519 tests, 0
eslint errors, same 33 pre-existing warnings). Playwright screenshots at
1440×900 and 390×844 across the full timeline, plus `prefers-reduced-motion:
reduce` confirmed to still skip the overlay entirely.

---

## Addendum 2 (same day) — dark re-skin, no frame, logo lockup, push reflow

The light re-skin above was reversed and replaced with a structural redesign,
not just a color swap.

### Ground

Soft dark navy — `radial-gradient(ellipse at 50% 42%, ${NOIR.navyDeep} 0%,
${NOIR.navyInk} 78%)`, the same gradient shape the light version used
(`WHITE → VOID`), mirrored with the two navy tokens the softer/harsher of
which was already documented in `palette.ts`.

### The frame is gone

Every piece of the "coordinate lock" instrument panel — the four rails, the
gold signal pulses, the corner registration ticks, the lock-sweep confirming
bar, and the bordered/shadowed stage panel — is deleted, along with their
`preloaderChoreo.ts` data (`RAILS`, `PULSES`, `TICKS`, `railStart`/`railExit`)
and their tests. The wordmark's own wipe/laser mechanic is untouched — it was
never part of the frame.

### The P logo joins the wordmark

`PhitopolisLogo` now sits beside the wordmark exactly as it does in the
navbar (`AppShell.tsx`: icon + `PH<gold>IT</gold>OPOLIS`). This is a second
tie to the sitewide brand mark, alongside the gold "IT" already established.

### Every block rises

A new shared "rise" (`RISE_Y_PX = 24`, `RISE_OPACITY_FROM = 0.15`,
`RISE_S = 0.6`) replaces flat fades — the same feel as `stageChoreo.ts`'s
`rise` variant used for full section entrances, scaled down for a compact
instrument readout. Applied to all three blocks: the mark row, the progress
row (staggered `PROGRESS_RISE_DELAY_S` after the mark), and the description
row on its own mount.

### The description spawns and pushes — a real reflow

The description is not rendered until its sequence fires
(`statementSpawned` state, not an always-present hidden block). Mounting it
is what a `motion/react` `layout` prop on the mark row and progress row reacts
to — they animate to their new position via Motion's FLIP mechanism, a
genuine layout reflow rather than a hand-timed simulation of one. Measured in
a real browser: the mark row moves up ~32px and the progress row moves down
~32px the instant the description claims space between them.

**The one real engineering trap here**: `layout` and a hand-authored
`transform` must never share one element. Motion's `layout` prop snapshots an
element's box across renders and animates any change; an imperative
`animate()` writing `transform` on that same node is invisible to that
bookkeeping and the two fight over the same CSS property. Every row that both
rises AND gets pushed is therefore two elements — an outer `motion.div layout`
that only ever reflows, and an inner plain `Box` that plays the rise — never
one element doing both.

### New two-sequence table

SEQ 1 (0→0.9s) — the mark rises and its letters resolve in the same window
(the old separate "frame lock" and "wordmark resolve" acts merge, since there
is no more frame to lock). SEQ 2 (2.5→3.5s, owning its own lead-in hold like
before) — the description spawns and pushes. Total choreography 5.1s;
`OUT_DURATION_S` stays 2.0s; `BEAT_FAILSAFE_MS` 13000 → 12000 (worst path
recomputed: 5100+1500+2000+2000≈10600).

### A real, unrelated regression found and fixed along the way

`tests/preview-cdp.test.ts`'s `waitForIntroGone` helper polled for the intro
to be gone with a 6000ms timeout — safe when the intro was ~1.6s, no longer
safe now that a cold natural exit is ~9.4s. Rather than keep bumping that
number in lockstep with future re-pacing, the helper now dispatches Escape
once (the same affordance a real visitor has) and polls a short window after,
so it stays correct regardless of how long the choreography is.

### Verified false alarm

A separate assertion in that same file (`avgFrameIntervalMs < 22` on the `/`
→ `/about` transition) failed after this change. Bisected by stashing every
Preloader-related edit and re-running against untouched `main`: it fails
there too (34–56ms measured across repeated runs, threshold 22ms), confirming
this is pre-existing environmental flakiness in this sandbox, not a
regression from `layout`, the longer choreography, or anything else in this
redesign. Left alone rather than "fixed" to a number that would just mask a
real flake.

### Verified

`yarn typecheck && yarn test && yarn lint` — 502/502 excluding the one
pre-existing flaky CDP test, 0 eslint errors. Playwright: real DOM position
measurements confirm the push (mark row and progress row genuinely move
apart, not just visually coincidentally), Escape exits in ~2s regardless of
sequence position, `prefers-reduced-motion: reduce` still skips the overlay
entirely, warm-path reload still skips the intro, no mobile overflow, and the
rectangular aperture reveal — unchanged from every prior revision — still
fires and completes on schedule.
