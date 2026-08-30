# Handoff — Open-rework cycle (2026-08-30)

**Status:** all three reworks landed + merged to `main`. Follow-ups below are
picked up next session.

This cycle closed the three areas that were tracked in
`CLAUDE.md` §"Open rework" and their per-area handoffs:

| Area | Handoff (now marked DONE) | Landed in |
|---|---|---|
| Closing-section rebuild | `docs/closing-section-rebuild/handoff.md` | `b2b70e9` |
| Web intro (beat-sequenced, rectangular reveal) | `docs/web-intro-rework/handoff.md` | `9b7ca58`, `5e16b0e` |
| Preloader full-preload (no scroll pop-in) | `docs/preloader-full-preload/handoff.md` | `9ef98b5` |

Plus **Phase 0** — `main` HEAD (`46faff1`) was shipping red (65 `tsc` errors + 2
eslint errors in 3 files untouched by feature work, stale-copy test drift, a real
`global-markets` anchor↔section id collision). All fixed, and the prior
uncommitted WIP (chapter rail 8→6, consent-store extraction, entrance tuning,
preloader warm-up deferral) landed as clean commits. See
`docs/baseline/phase0-2026-08-30.md`.

**Gate at merge:** `yarn typecheck` clean · `yarn lint` 0 errors (33 tolerated
warnings) · `yarn test` **485 / 485**.

---

## What changed, by area

### 1. Closing section (`src/features/home/components/closing-scene/ClosingLattice.tsx`)
Three explicit render modes:
- **Desktop scrub** (md+, not reduced): one pinned ScrollTrigger, CSS grid
  (headline left / CTA right / canvas absolutely behind), **5 disjoint scrub
  phases** — `settle P (0–0.28) → hold (0.28–0.42) → headline clears (0.42–0.58)
  → gap → CTA reveals (0.60–0.82) → settled`. Headline & CTA opacity windows are
  provably non-overlapping (10-point live sample: never both `opacity > 0.1`,
  bounding boxes never intersect). CTA is in normal flow — **no `--hp-px` anchor,
  0px first-paint snap** (was the #2 bug).
- **Mobile static** (`down("md")`, not reduced): bespoke single-column stack
  (compact canvas band → headline → full-width CTA), **no ScrollTrigger**.
- **Reduced motion**: settled final frame; headline wrapper `display:none` +
  `opacity:0`; CTA lit + interactive.
Pin retuned **1.3vh → 2.0vh** (deliberate — `ladder-probe.js` `#closing` pin end
moved; re-verify parity if you touch it). Eyebrow `CONTACT // PARTNERSHIP`. Single
CTA → `/contact`. `tests/motion/closing-lattice-pinned-scroll.test.tsx` realigned
to the real design (the suite had been encoding a never-built one: 2.5vh pin,
`/careers` link, `CAPABILITY // PLATFORM`, different phase math).

### 2. Web intro (`Preloader.tsx`, `viewTransitions.css`, `SuperHeroSequence.tsx`)
- **Beat model**: `BEAT_S = 0.26s`, every duration a multiple. Phase A opening
  (3 staggered beats, concurrent with the loading bar) → Phase B loading
  (real-signal paced) → Phase C settle (`SETTLE_HOLD_MS` = 2 beats = 520ms of
  stillness, replacing `POST_100_BEAT_MS`; skipped by Escape + the settle cap) →
  Phase D reveal (`OUT_DURATION_S`; `onStartExit` fires at its **start** so the
  hero/header cascade overlaps the last beat). `BEAT_FAILSAFE_MS` 2600 → 3400,
  still an unconditional ceiling.
- **Rectangular reveal**: the circular `radial-gradient` exit mask →
  an expanding rectangular hole (`clip-path` polygon frame, centre → past the
  corners). `viewTransitions.css` `fresko-home-aperture` → `inset(50%) → inset(0)`
  so first-load intro and home-nav arrival read identically.
- **Hero serialisation**: the pinned ScrollTrigger's `useGSAP` body early-returns
  until `useEntranceSettled()` (phase `"open"`), then builds the
  SplitText/timeline/pin exactly once with a post-commit `ScrollTrigger.refresh()`.
  Scrolling under the preloader can no longer advance the hero timeline or write
  `--hp-*` vars ("components bypassing each other").
- 4 of the 22 preloader tests got wider timeouts / renamed constants, each with a
  reason comment; no guarantee weakened.

### 3. Preloader full-preload (`AppShell.tsx`, `Preloader.tsx`)
- **Signal tiers**: `LoadSignal.blocking?: boolean` (absent === blocking). The
  reveal's Phase-C gate + progress bar track only the blocking set (fonts + the
  landing route's above-fold-critical assets). Background signals — `WARM_ROUTES`
  precompiles, the ServiceGlobe three.js chunk, lower/other-route imagery — keep
  warming without holding the overlay. `MAX_SETTLE_MS` / `BEAT_FAILSAFE_MS`
  unchanged and still absolute.
- **Route-aware manifest**: `resolveRouteManifest(pathname)` (exported from
  `AppShell.tsx`). `/` blocks on just `phitopolis_logo_hero.svg` (its below-fold
  is canvas/SVG/CSS — nothing raster) and background-warms the globe chunk.
  `/about` blocks on its hero bg + primary photo + first 3 gallery strip tiles.
  Other routes: fonts + own chunk only. `useWarmupSignals(active, pathname)`.
- The **decoded-asset-store** option (open across multiple prior handoffs) was
  evaluated and is **not needed** — there is no raster imagery on `/`'s scroll
  path to race against the scroll.
- +7 tests (`tests/warmup-manifest.test.ts` new; 2 in `preloader.test.tsx`).

---

## Follow-ups for next session

1. **Rigorous verification** (handoff-mandated maintainer steps, not runnable via
   the in-app preview pane — it freezes rAF):
   - `tests/preview-cdp.test.ts` against `dist/` — cold-load `/` and `/about`,
     `driveScroll` with real wheel events, assert **zero** image/video requests
     during scroll and **zero CLS** after the intro.
   - LCP re-measure vs `docs/perf-baseline.md` (baseline 1912ms, target <1000ms).
   - `tests/e2e/ladder-probe.js` at 375/768/1440 — confirm only `#closing` pin
     geometry moved (the deliberate 1.3→2.0vh retune) and nothing downstream.
   - **Screencast** the cold first load at 1440 + 390: confirm the 4 intro phases
     read as distinct and the reveal is unmistakably rectangular; confirm the
     closing scene's phase order and mobile layout.
   - Reduced-motion pass: overlay gone within one frame, content lit, nav works.

2. **`/images/pillars/*.webp` 404s** — `OperatingPillars` renders `<img>` for
   three pillar photos that don't exist in the repo (`content.ts` line ~58 notes
   it). Degrades via an `imageFailed` placeholder but every home visitor eats a
   404 per card. A task chip was spawned. Either add the images or drop the
   `<img>`.

3. **Dead code** — `useVideoBg` is hard-coded `false` in `SuperHeroSequence.tsx`,
   so the whole `HERO_BG_VIDEO` background (`useBackgroundVideo.ts`, webm/mp4/
   poster + two effects + guarded JSX) is unreachable. Remove it, or re-enable
   the video and add a `blocking:false` range-fetch to `resolveRouteManifest("/")`
   (a comment there marks the spot).

4. **`lenis/dist/lenis.css` still not imported** — pre-existing, flagged in the
   root `CLAUDE.md` Lenis-skill note; untouched this cycle.

5. Merge `main` forward anywhere it's deployed (staging/UAT) per `PROJECT.md`.
