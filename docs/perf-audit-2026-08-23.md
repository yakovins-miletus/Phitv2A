# Performance audit — 2026-08-23

Brief: full-site audit, "everything should be fast else the website is useless",
plus a specific complaint that **image assets render late**.

Everything here was measured against the **production build** (`yarn build` → `dist/`,
served by `vite preview` on `:4173`) and driven through headless Chromium over CDP.
The in-app Browser pane freezes `requestAnimationFrame` in this workspace, so anything
scroll- or IntersectionObserver-driven is unmeasurable there.

## Result

Home page (`/`), first visit, no scrolling — stable across 3 consecutive runs:

| | before | after | |
|---|---:|---:|---|
| JavaScript | 463 KB | **196 KB** | −58% |
| All resources | 4,959 KB | **2,879 KB** | −42% |
| Requests | 108 | 103 | |

`yarn typecheck` clean · 253 tests pass (was 252, +1 added) · lint unchanged.

---

## 1. three.js was on the home critical path (biggest win)

**Every visit to `/` downloaded the entire 3D engine** — `heroScene-*.js`, 882KB raw /
191KB brotli with three.js inlined — statically imported by the home route chunk, to
render a hero that is a **2D canvas**. The 3D playground that actually needs three.js
is behind `React.lazy` and most visitors never open it.

Two independent edges caused it, and cutting either one alone left the engine on the
critical path:

1. **`playground/constants.ts` reached into `heroScene.ts` for one colour.** It imports
   `* as THREE` and also imported `RGB_STEEL`. `heroScene.ts` is pure 2D math but is
   statically required by the default hero (`SuperHeroSequence` → `HeroCanvas` →
   `heroScene`), so that single shared value welded three.js into the eager chunk.
   Note `type Rgb` erases at compile time — only the runtime value mattered.
   → Extracted the palette to a dependency-free leaf, `features/hero/heroPalette.ts`.
   `heroScene.ts` re-exports for back-compat, but the playground must import from the
   leaf **directly**; going through the re-export silently restores the edge.

2. **`ServiceGlobe` was imported statically by `MissionStatement`.** It renders an R3F
   scene and sits on the home page.

**A config-only fix does not work, and this is the trap.** `advancedChunks` groups
decide which chunk a module lands in — they never change reachability. Adding a `three`
group without the source changes just renames the chunk the eager code still statically
imports. A `three` group *was* added, but as cache hygiene (one cacheable chunk instead
of slices duplicated across four lazy chunks), not as the fix.

**`React.lazy` alone was also not enough** — worth recording, because it looked correct
and was verified wrong. A lazy import fires as soon as the component *renders*, and
`MissionStatement` renders during first paint, so `three-*.js` (270KB transferred) was
still fetched before any scroll. Deferring the *download* required deferring the
*render*: `ServiceGlobe` is now gated on `useInView` (`motion/react`, already in the
eager bundle) with a 900px below-fold margin, so its chunk fetches as the reader
approaches rather than on load. It is a decorative background sphere ~6 viewports down.

Verify it stays fixed:
```bash
yarn build
grep -o 'import{[^}]*}from"\./[A-Za-z0-9_-]*\.js"' dist/assets/routes-*.js | grep three
# must print nothing; three must also be absent from dist/index.html
```

## 2. Images

**~4MB of the home page was prefetched imagery nobody had scrolled to.**

- **Hero drift wall — 2.55MB for 25 tiles.** The tiles are sourced from full-size blog
  photos (1520px+) but render at **330×396**, and all 25 are warmed via
  `<link rel="prefetch">` on the home page. Generated 2×-retina derivatives into
  `public/images/hero-wall/` → **1.68MB (−34%)**, pixel-identical on screen.
  Sizing had to be **measured, not read off the props**: `HeroImageWall` passes
  `tileWidth={300} tileHeight={360}`, but `DriftWall` applies a zoom, so the real box is
  330×396. Targeting the nominal 300×360 would have shipped visibly soft tiles.
  `tests/motion/hero-wall-tiles.test.ts` now pins the path shape *and* asserts each
  derivative exists on disk — the old test only checked the path pattern, which a
  never-generated file would pass.
- **BlogSection loaded eagerly ~24,000px down the page.** Four blog cards (~1MB, one of
  them 557KB) were fetched during initial load for a section ~27 viewports past the
  fold. Added `loading="lazy" decoding="async"`.
- **Timeline: 26 rasters, 9.9MB → 5.3MB WebP.** Wired through the existing
  `preferWebp()` helper rather than editing 26 hardcoded paths. `handleImgError`
  previously hid a failed image outright; it now retries the original raster
  (`data-fallback-src`) before hiding, so a future photo added without a WebP twin
  degrades to "slower" rather than "invisible".
- **Three oversized backgrounds → WebP**: `about-hero-bg` 1794K→98K (−95%),
  `hero-sky-bg` 1553K→56K (−96%), `careers-hero-bg` 865K→136K (−84%).
  **`seo.ts` deliberately still points at `hero-sky-bg.jpg`** for the OG share image —
  social scrapers are unreliable with WebP. Both files are committed.

### Measured and deliberately NOT done

- **Blog WebPs are already optimal.** 47 files over 300KB (19.9MB) looked like an easy
  win; re-encoding one at q80 made it *bigger* (465K → 471K). They are already at that
  quality point. Only dimensional downscaling would help, and that trades sharpness.
- **`daily-life.mp4` (18MB) has little headroom.** It is 1280×720 at **594kbps** (lean
  for 720p) and the moov atom is already ahead of mdat, so faststart is set and it
  streams progressively rather than blocking. Its size is a function of being 251
  seconds long. A CRF re-encode risks artifacts for a small gain — **so the re-encode
  you asked to review was not produced; the measurement said don't.** The real issue is
  different: `DailyLifeSection.tsx` starts loading it on scroll-into-view, so a reader
  passing by pulls data for a 4-minute film they may never watch. **Click-to-play would
  save far more than any re-encode** — a behaviour change, so it needs a decision.

## 3. Runtime (SpecularFx)

- `pointermove` listener was not `{ passive: true }` — it never calls `preventDefault`.
- `devicePixelRatio` was uncapped; every other canvas caps at 2. On a 3×-DPR phone this
  allocated 2.25× the pixels of any other surface to draw a 1px button rim, up to six at
  once. Now capped at 2, matching convention.
- `new Renderer()` was unguarded and threw `TypeError` where WebGL is unavailable
  (documented in `scroll-audit-2026-08-23.md`, previously unfixed). Contained — it fires
  outside React's render phase — but it silently killed that button's rim for the
  session. Now caught, and the button degrades to plain working UI.

### Explicitly not changed

- **`EyeFlow.tsx:134` is a non-issue.** An exploration pass flagged
  `setActiveChapter` inside a `gsap.ticker` callback as a HIGH-severity per-frame React
  re-render. It is called every frame, but `intervalIdx` is a 0–9 integer that changes
  ~10 times down the whole page, and React bails out on `Object.is`-equal values. A
  ref-guard would save nothing. Recorded so it isn't re-flagged.
- **`SpecularButton` eagerly loads `ogl` (51KB) on every route.** A real cost, but a
  deliberate UX trade (warm WebGL context = no pop-in on first hover), consistent with
  the documented `DriftWall` eager-load decision. Flagged, not changed.

## Notes for next time

- **Test-suite gap fixed.** `tests/setup.ts` never cleared GSAP's deferred work, so a
  ScrollTrigger `setTimeout` could fire after jsdom teardown and throw
  `ReferenceError: requestAnimationFrame is not defined`, reported against whatever file
  was running. Any async render would have exposed it; the new lazy boundary did.
  `afterEach` now calls `ScrollTrigger.killAll()`.
- **Lint baseline is 27 errors / 105 warnings, not zero.** The "0 eslint errors" claim in
  `handover-2026-08-18-0830.md` is stale. Verified identical before and after this work —
  all pre-existing, none introduced here.
- **Originals are retained on disk** next to every WebP twin (they back the `onError`
  fallback and the OG image). `public/` therefore grew; a cleanup pass could drop the
  superseded timeline rasters once the conversions have been eyeballed in production.
