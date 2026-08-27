# WS-06 — Performance audit (measurement only)

**Owner files (exclusive):** none — **this workstream edits no source.** It emits
`docs/workstreams/ws-06-findings.md`.
**Depends on:** nothing. **Feeds:** WS-03, and any later perf work.
**Agents:** Haiku to run inventory greps, `perf-runtime-auditor` for the measurement.
**Acceptance bar:** every claim carries a number.

---

## Why

The brief reports "some bits of lag especially the hero of about page" and proposes a fix
(replace background strips). Both halves need testing before anyone writes code:

- **The About hero is cheap.** `BackgroundReveal.tsx` is one `<img>` plus two CSS gradients
  — DOM only, no canvas, no three.js. `HeroGallery.tsx` adds three images. Nothing there
  obviously costs frames.
- **The proposed culprit does not exist.** The only stripe pattern in the codebase is a
  `repeating-linear-gradient` at `OperatingPillars.tsx:99-110`, used as a **placeholder for
  images that fail to load**. It is not decorative, not in a hero, and costs nothing.
- **The suspected replacement target already defends itself.** `DriftWall.tsx:318-380`
  stops its rAF entirely when paused, when reduced-motion is on, or when the tab is hidden
  — "A paused wall costs one contained, un-animated subtree." So the 29-tile hero wall may
  not be the villain either.

Three plausible theories, zero measurements. This file produces the measurements.

## Current state (verified)

- Last recorded baseline (`docs/perf-baseline.md`, 2026-08-02): production build via
  `vite preview`, Playwright 1440×900, Apple Silicon, unthrottled — explicitly
  **best-case**.
- `docs/hero-upgrade/stage-0-baseline.md`: LCP **1,112 ms**, frame p95 **1.0 ms**,
  32/44 hero nodes in the interactive window, 252 from the gunshot onward.
- `docs/perf-audit-2026-08-23.md`: home JS **463 KB → 196 KB** after three.js left the
  critical path.
- ⚠️ **The toolchain baseline is not green.** `docs/perf-baseline.md` records
  `npm run lint` at **30 errors / 12 warnings, already failing before any change** —
  including `react-hooks/refs` violations inside `SignalDiagram`, `ReachMap`,
  `PipelineDiagram`, `FollowTheSunDiagram`. Do not read a passing test run as a healthy
  baseline.

## Steps

1. Reproduce first. If the lag cannot be reproduced, say so and stop — that is a valid,
   valuable result. Record: machine, browser, throttling, viewport, and whether the dev
   server or a production build was used. **The brief's lag was felt in dev at
   `localhost:5180`; dev-server lag is not evidence of production lag.** Measure both.
2. Run `perf-runtime-auditor` against a production build (`yarn build && yarn preview`) for
   `/` and `/about`, capturing:
   - Core Web Vitals: LCP, CLS, lab INP under driven scroll
   - Long tasks during ScrollTrigger pin/unpin (home hero is pinned)
   - Heap growth across 3 full scroll cycles per route — leak check
   - Post-hydration DOM node count per route
   - Asset payload per route
3. Re-run `/about` at 4× and 6× CPU throttle. An M-series Mac hides everything.
4. Test the four hypotheses explicitly, each confirmed or killed with a number:
   - H1 `ServiceGlobe` / three.js — does the `useInView` gate at
     `MissionStatement.tsx:52-65` actually hold, or does three land on the critical path?
   - H2 `SuperHeroSequence` master pin + `gsap.quickTo` — long tasks during pin/unpin?
   - H3 Lenis — is `lenis.raf` on the GSAP ticker inflating frame time? (home only)
   - H4 `HeroImageWall` / `DriftWall` — 29 tiles. Does the pause actually engage offscreen?
5. Write `ws-06-findings.md`: ranked causes, each with its measurement, plus explicitly
   which hypotheses were **killed**. Name the file/line for each confirmed cause.
6. **Spawn WS-15.** The top confirmed cause becomes its own workstream file
   (`ws-15-<cause>.md`), written in this same format, with its owner-files header set from
   whatever the finding actually implicates. This was agreed in session: WS-03 proceeds as
   a design change either way, and the *real* perf cause gets fixed on its own terms rather
   than being smuggled into a hero redesign.

## Verification

Self-validating — the output is the evidence. It is complete when every one of H1-H4 is
marked confirmed or killed with a number attached, and the About-page lag from the brief is
either reproduced or declared unreproducible.

## Out of scope

**Any fix** — including the one this audit identifies; that becomes WS-15. This file does not change code. Fixes are separate workstreams, written after
this one lands and citing its findings. Aesthetic changes to the hero belong to WS-03
regardless of what this finds.
