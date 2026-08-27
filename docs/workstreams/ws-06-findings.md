# WS-06 — Runtime performance audit (measurement only)

No source file was touched to produce this report. Deliverable per the workstream spec.

## Method and environment

- **Build measured:** production preview. `dist/` was built at 08:42 today (`vite build`,
  `tsc -b` clean) and served by `vite preview` on `:4173`, already running before this audit
  started. The dev server (`localhost:5180`, where the brief's lag was originally felt) was
  also running and was separately checked for contrast — see "Dev vs. prod" below.
- **Harness:** the shared CDP harness at
  `/Users/yaakovins/Documents/Project Armstrong/.claude/skills/web-audit/scripts/cdp.mjs`
  (`withBrowser`, `navigateAndSettle`, `driveScroll`, `rafTicksDuringScroll`, `clickElement`,
  `Profiler.*`). Driver scripts live in the scratchpad, not in the repo.
- **⚠️ Measurement conditions: CONTENDED, not exclusive.** At the time of measurement there
  were **12 Chromium-family processes** already running on this machine, including two
  separate `chrome-devtools-mcp` instances and other headless `chromium` processes — almost
  certainly other agents/tools running in parallel. Per the metric contract, contention has
  produced up to a **13× LCP spread** on this exact harness (290 ms exclusive vs 3,736 ms
  contended). **Every absolute timing number below (LCP, TTFB, long-task durations) must be
  read as `contended — not a valid CWV reading`.** Ratios and presence/absence findings
  (three.js loaded or not, pause engaged or not, DOM node counts, payload bytes) are not
  timing-sensitive and remain trustworthy under contention.
- **Cold vs. warm:** reported separately per route, never averaged, per the metric contract.
  "Cold" = first navigation in a fresh profile/cache. "Warm" = second `navigateAndSettle` in
  the same browser session/cache immediately after.
- **rAF sanity:** `rafTicks` was 60–61 on every run (never 0), so the frame loop was alive
  throughout and GSAP/Lenis/ScrollTrigger were measurable, not frozen.
- **Hydration:** `settle.hydrated === true` on every route before any DOM-shaped metric was
  read.

## Dev vs. prod — the brief's original complaint

The brief's lag was felt in **dev** at `localhost:5180`, which was confirmed still running.
Dev serves unminified, unbundled ESM with no tree-shaking — categorically different from
what a visitor gets. No dev-server number in this report is presented as a production
number; dev was not driven through the CDP harness for CWV because a dev-only lag is not
evidence of a production regression, per WS-06's own scope. The only production-relevant
finding from the dev/prod gap is structural, covered under H2/throttle below.

## Measurements vs. baseline

| Metric | Home `/` cold | Home `/` warm | About `/about` cold | About `/about` warm | Stage-0 baseline (`/`) | Verdict |
|---|---|---|---|---|---|---|
| LCP | 592 ms | 212 ms | 1,996 ms | 848 ms | 1,112 ms | **contended — not comparable to baseline**, but even so home cold (592 ms) beats baseline; about cold (1,996 ms) is worse. Directionally consistent with contention, not a clean regression call. |
| CLS | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | held |
| TTFB | 4 ms | 4 ms | 3 ms | 3 ms | — | held (local preview, not meaningful beyond sanity) |
| Long tasks (load) | 2 / 183 ms / max 105 ms | 0 | 1 / 105 ms / max 105 ms | 1 / 69 ms / max 69 ms | 1 / 148 ms / max 148 ms | **contended — not comparable**, count is in the same ballpark |
| DOM nodes (post-hydration) | 709 | 698 | 1,751 | 1,742 | — (baseline used a different metric: 32/44 "hero nodes in interactive window") | not directly comparable; recorded as new baseline for DOM-count regressions |
| fps at rest / during scroll | 61 / 61 | — | 61 / 60 | — | frame p95 1.0 ms (i.e. ~60fps) | **held** — no scroll-driven frame drop on either route at 1x |
| JS transferred | 479 KB | ~0 (cached) | 442 KB | ~0 (cached) | home JS 463 KB → 196 KB (2026-08-23 doc) | see note below |
| Total transfer | 3,536 KB | 10 KB | 1,927 KB | 32 KB | home total 4,959 KB → 2,879 KB (2026-08-23 doc) | roughly consistent, not an apples-to-apples re-run of that doc's method |
| Largest JS chunk | `mui-*.js` 78 KB | — | `mui-*.js` 78 KB | — | three.js was 908 KB/191 KB brotli, on the critical path | **no chunk over 250 KB on either route's critical path** — see H1 |

**JS transfer note:** the 2026-08-23 doc's "196 KB" figure was measured a specific way
(first visit, no scroll, 3 consecutive runs). This run's "479 KB" home-cold figure includes
more of the route's own chunk plus MUI/motion/tanstack vendor chunks captured across the
full `Network` log, not a directly repeatable comparison to that number — flagging the
method difference rather than asserting a regression. What **is** directly comparable and
confirmed is the qualitative claim: **three.js (`three-Cu23sccg.js`, 908 KB raw on disk) is
never fetched on either route's critical path** — see H1.

## Main-thread blocking during scroll

**At 1×, unthrottled:** zero long tasks were observed across a full 16-step scripted scroll
of `/` (all sections: `hero-sequence`, `hero-mission`, `hero-pillars`, `hero-position`,
`use-cases`, `reach`, `closing`) and a 16-step scroll of `/about`. The only long tasks on
either route fired once, near load, before any scroll input — see the CWV table.

**At 4×/6× CPU throttle on `/about`:** long tasks appear and cluster at the very top of the
scroll pass (`frac 0`, i.e. immediately post-hydration, section = an anonymous
`MuiBox-root css-18kliib` wrapper around the hero):

| Throttle | Long tasks (total) | Total ms | Max ms | Where they cluster |
|---|---:|---:|---:|---|
| 1× | 1 | 69 | 69 | load, not scroll |
| 4× | 14 | 1,182 | 392 | 7 of 14 at `frac 0` (hero, load-adjacent) |
| 6× | 15 | 1,864 | 618 | 8 of 15 at `frac 0` (hero, load-adjacent) |

A `Profiler.start`/`stop` capture across load + first scroll steps of `/about` at 6×
attributed self-time (top non-idle entries, by `functionName @ file:line`):

- `G`/`h` inside `MiniEstablishingShot-CsoNBQRJ.js` — ~340 µs·samples combined self-time.
  `MiniEstablishingShot` (`src/shared/components/establishing/MiniEstablishingShot.tsx`)
  is instantiated by `CandidatesAndCareersSection`, `BlogSection`, and `ClosingShelf`, all
  three of which render on `/about`. Each instance calls `gsap.registerPlugin(ScrollTrigger)`
  and builds its own `ScrollTrigger`/timeline inside `useGSAP`, so `/about` pays for three
  independent trigger registrations at once during hydration, not one.
- `e` inside `ScrollTrigger-DDi3XPDo.js` — ~99 µs·samples. Consistent with the above: more
  registered triggers means more work inside ScrollTrigger's own refresh/measure path.
- `pe`/`getExtension` inside `SpecularButton-gVjIkt0p.js`
  (`src/shared/components/ui/specular/SpecularFx.tsx`) — ~71 µs·samples combined. This is a
  WebGL context probe for the specular rim effect on every `SpecularButton`, which is used
  site-wide (nav, forms, drawers) — not `/about`-specific, but it fires on every route's
  first paint including `/about`.

None of these individually is large (tens to a few hundred ms each), but under 4×/6×
throttle they land close together right after hydration, which reads as a stutter right
at the point a reader lands on the hero — consistent with "lag... especially the hero of
the about page," but **only reproducible under artificial CPU throttling**, not at native
M-series speed.

## Memory — heap across 3 scroll cycles

Ran 3 full down/up scroll cycles per route with `HeapProfiler.collectGarbage` before each
"up" read, per the metric contract's 3-cycle minimum for a leak claim.

| Route | Cycle 1 (down / up-after-GC) | Cycle 2 | Cycle 3 | Verdict |
|---|---|---|---|---|
| `/` | 28.5 / 20.6 MB | 23.8 / 20.8 MB | 23.5 / 21.1 MB | **no leak** — post-GC floor is flat (20.6→20.8→21.1 MB, +0.5 MB over 3 cycles, within `performance.memory`'s quantization noise) |
| `/about` | 15.5 / 15.3 MB | 18.0 / 15.4 MB | 18.1 / 15.5 MB | **no leak** — post-GC floor flat (15.3→15.4→15.5 MB) |

Chromium's `performance.memory` is coarse/quantized; treat these as trend signals only, per
the contract. Three cycles ran on each route; no sustained post-GC growth on either.

## Asset payload

No single JS chunk on either route's critical path exceeds ~250 KB. Largest observed on
either route: `mui-BqD7CB-i.js` at 78 KB. `three-Cu23sccg.js` (908 KB raw / not measured
brotli in this run) exists on disk but is **not requested** until a reader scrolls the home
page into the Mission section — confirmed below under H1. `dist/` is served without
compression headers by `vite preview` (no `content-encoding` on any response) — this is a
known property of `vite preview`, not something to read as a production gzip/brotli
failure; the deployed nginx config is the source of truth for real compression, and this
localhost target is explicitly out of scope for that per the metric contract.

## Lab INP

Drove interactions with `clickElement('a[href="/about"]')` on both routes before reading:

- On `/`: `verdict: navigated` — the click hit the nav link and the route changed. This
  **contradicts** the metrics contract's own note that this selector is intercepted by an
  overlay on this codebase (`div.MuiBox-root`) — worth flagging as a doc/behavior drift
  since that note is dated, but it means the nav link itself works cleanly from home.
- On `/about`, the same selector targets a self-link (already on `/about`), so
  `verdict: clicked target, no navigation — investigate` is an artifact of testing a
  same-page link, not a defect — noted so it isn't mistaken for a broken link.
- Lab INP (`readVitals().inpMs`, cumulative counter, valid post-interaction): **32 ms** on
  both routes, `interactionCount` 39 (home) / 19 (about). Well under the 200 ms "needs
  improvement" INP threshold. Contended-environment caveat applies as with all timing
  numbers.

## H1–H4

### H1 — ServiceGlobe / three.js reaching the critical path: **KILLED**

Verified at runtime, not just in the bundle. Fresh navigation + `settle` (no scroll) on
`/` and `/about`: **zero requests** matching `three-*` or `ServiceGlobe-*`. After a full
16-step scripted scroll of `/` that passes through the Mission section, `three-Cu23sccg.js`
(908 KB) and `ServiceGlobe-C-IvxUay.js` (6.5 KB) **are** fetched — confirming the
`useInView` gate at `MissionStatement.tsx:52-65` (`DeferredServiceGlobe`) behaves exactly as
designed: the chunk downloads only once the reader approaches the section, never on load.
`tests/bundle-assertion.test.ts` passing is corroborated by this runtime evidence, not
contradicted by it.

### H2 — SuperHeroSequence pin/unpin long tasks: **KILLED**

A full 16-step scripted scroll through the entire 800%-tall home pin (`SuperHeroSequence`,
sections reported as `hero-sequence` at 6 of the 16 steps) produced **zero long tasks** at
1× CPU. The two long tasks recorded on `/` fired at load, before any scroll input, not
during the pin. `gsap.quickTo` (`SuperHeroSequence.tsx:473,555`) is doing its job of
avoiding per-tick GSAP tween construction during the pin — this was not re-tested under CPU
throttle (out of the workstream's explicit throttle scope, which named `/about` only).

### H3 — Lenis inflating frame time via `gsap.ticker`: **KILLED**, but with a doc-staleness finding

`rafTicksDuringScroll` was 61 fps on `/` and 60 fps on `/about` — no measurable drop
attributable to Lenis riding the GSAP ticker; there is exactly one frame loop, as designed
(`SmoothScroll.tsx` comments this explicitly, and no second `requestAnimationFrame` chain
was observed). **However:** the assumption stated in the workstream brief and in
`CLAUDE.md` ("Lenis... home route only") is **stale**. Reading `src/routes/about.tsx:38,182`
shows `<SmoothScroll />` is now also mounted on `/about`
("PRD-home-client-focus §US-2 AC-2 requires the culture film's pinned ScrollTrigger to pin,
play and release exactly as it did on the home page"). This is not a performance defect —
fps held steady — but it means H3's "(home only)" framing needs correcting going forward,
and any future Lenis-specific audit must include `/about`.

### H4 — DriftWall (`HeroImageWall`, 29 tiles) pause not actually engaging: **KILLED**

Empirically verified via inline `transform` sampling on `.dw-track` elements (not just
reading the source):
- The wall does not even mount until the pin reaches its `wallMounted` latch
  (`SuperHeroSequence.tsx:346`, gated on the gunshot stage) — confirmed by `.dw-track`
  count going from 0 at scroll fractions 0–0.65 of the pin to populated only from ~0.55
  onward.
- Once mounted, at pin progress **0.55 and 0.65** the tiles' `transform` values changed
  across a 700 ms sample window — **the rAF loop is genuinely animating** while the wall is
  in view.
- At pin progress **0.75, 0.85, and 0.99** the same tiles' `transform` values were
  **byte-identical** across a 700 ms window — **the rAF loop has genuinely stopped**,
  matching `wallDrift = g > 0.01 && progress < 0.98` in `heroVars.ts:233`. The pause is not
  merely present in source, it demonstrably takes effect before the reader scrolls past it.

`DriftWall.tsx:318-380`'s claim holds under direct measurement.

## About-page lag — REPRODUCED, conditionally

**Not reproducible at native, unthrottled 1× speed** on this machine: `/about` at 1× shows
1 long task (69 ms, at load) and a flat 60–61 fps scroll pass — nothing a user would call
lag.

**Reproduced under 4×/6× CPU throttling**, which stands in for lower-end or thermally
throttled hardware: 14–15 long tasks appear, clustered in the first ~500 ms after
hydration on the hero section, up to 618 ms in a single task at 6×. Attributed by
`Profiler.*` self-time to three independent `MiniEstablishingShot`
(`src/shared/components/establishing/MiniEstablishingShot.tsx`) instances on `/about`
(`CandidatesAndCareersSection`, `BlogSection`, `ClosingShelf`) each registering their own
`ScrollTrigger`/timeline during hydration, plus WebGL context probing in
`SpecularFx`/`SpecularButton` (site-wide, not `/about`-specific) firing on the same first
paint. This matches the workstream brief's own framing almost exactly: "An M-series Mac
hides everything at 1×."

**The proposed fix in the original brief (replace background image "strips") is not
implicated by any of the above** — `BackgroundReveal.tsx` and `HeroGallery.tsx` never
appear in the long-task profile, and the only stripe pattern in the codebase
(`OperatingPillars.tsx:99-110`) is an image-load placeholder, not something that runs
during the hero's hydration window. Confirms the workstream brief's own prior read of that
theory.

## Ranked causes (confirmed only)

1. **Redundant per-section ScrollTrigger registration on `/about`'s hydration path.**
   `MiniEstablishingShot.tsx` calls `gsap.registerPlugin(ScrollTrigger)` and builds its own
   `useGSAP` timeline per instance; three instances mount simultaneously on `/about`
   (`CandidatesAndCareersSection`, `BlogSection`, `ClosingShelf`). Evidence: 7–8 of the
   14–15 throttled long tasks land in the same `frac 0` window, and `Profiler` attributes
   the largest non-idle self-time buckets to `MiniEstablishingShot`'s own functions and to
   `ScrollTrigger`'s internal measure/refresh path. This is the highest-value target because
   it is `/about`-specific, matches the brief's symptom (hero-adjacent stutter), and is
   plural — three registrations doing overlapping setup work rather than one shared driver.
2. **`SpecularFx` WebGL context probing on first paint, site-wide.** Smaller (tens of ms),
   but fires on every route via nav/CTA buttons, and stacks with cause 1 in the same
   hydration window on `/about`. Lower priority: it is not `/about`-specific and each call is
   cheap in isolation.

## Not measured

- **Brotli/gzip size of `three-Cu23sccg.js`** — only raw on-disk size (908 KB) was read from
  `dist/`; the harness did not capture its `encodedDataLength` because it is never fetched
  under this session's navigation + scroll pattern (H1). Would require forcing the
  `useInView` gate to fire while `Network` domain is recording, not done here.
- **H2 under CPU throttle** — the workstream explicitly scoped the 4×/6× re-run to
  `/about` only; the home pin's long-task behavior under throttle is unmeasured.
- **Real compression/cache headers** — `vite preview` sends no `content-encoding`; per the
  metric contract this is `N/A — requires deployed target`, not a pass/fail on localhost.
- **Field INP** — everything reported is lab INP from one scripted click per route, not real
  user interaction data.
- **Exact self-time in wall-clock ms per `Profiler` bucket** — the raw `Profiler` output
  reports sample-weighted µs by `timeDeltas`, which were summed and reported as relative
  ranking ("top non-idle entries"), not converted to a certified per-function ms figure;
  treat the ranking as directionally reliable, not a byte-for-byte profile.

## Recommendation for WS-15

**WS-15 should consolidate `/about`'s three independent `MiniEstablishingShot` GSAP
registrations (`CandidatesAndCareersSection`, `BlogSection`, `ClosingShelf`) into a single
shared trigger-refresh pass**, using the `selfDriven={false}` mode `MiniEstablishingShot`
already exposes (it already supports a parent-driven mode with no own trigger/timeline —
see `MiniEstablishingShot.tsx`'s `selfDriven` prop) so `/about`'s three instances stop each
registering `ScrollTrigger` and building their own timeline during the same hydration
window. This is the single highest-value fix implied by these findings: it is the only
confirmed, `/about`-specific main-thread cost that lines up with the brief's symptom, it has
a number attached (7–8 of 14–15 throttled long tasks, up to 618 ms max, concentrated at
hydration), and the component already has the escape hatch built in — no new API surface
needed. Do not implement it here; this file only measures.
