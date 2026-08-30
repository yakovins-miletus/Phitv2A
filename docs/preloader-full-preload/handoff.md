# Handoff — Full home + about preload (no scroll-triggered pop-in)

**Created:** 2026-08-30 · **Status:** DONE (2026-08-30, `chore/phase0-stabilize-baseline`)

## Resolution

- **Signal tiers** (`LoadSignal.blocking?: boolean`, absent === blocking): the
  reveal's Phase-C settle gate + progress bar now track only the **blocking**
  set (fonts + the landing route's above-fold-critical assets). Background
  signals — `WARM_ROUTES` route precompiles, the ServiceGlobe three.js chunk,
  lower/other-route imagery — keep warming without ever holding the overlay.
  `MAX_SETTLE_MS` / `BEAT_FAILSAFE_MS` unchanged, still absolute.
- **Route-aware manifest**: `resolveRouteManifest(pathname)` in `AppShell.tsx`.
  `/` blocks on just `phitopolis_logo_hero.svg` (the only network image the
  default hero fetches — the rest it draws is canvas/SVG/CSS, so
  `HOME_BACKGROUND_IMAGES` is empty) and background-warms the ServiceGlobe chunk.
  `/about` blocks on its hero bg + primary photo + first 3 gallery strip tiles.
  Other landing routes block on fonts + their own route chunk only. Paths
  filesystem- and component-verified.
- **No video signal**: `useVideoBg` is hard-coded `false` in
  `SuperHeroSequence.tsx` → `HERO_BG_VIDEO` is dead code. Documented; a
  `blocking:false` range-fetch is the noted re-enable path.
- **Zero-network-on-scroll**: confirmed structurally — the home below-fold is
  canvas/SVG/CSS, nothing raster to race; a manual scroll of `/` fired zero
  image/video requests. The rigorous `tests/preview-cdp.test.ts` pass + LCP
  re-measure remain a maintainer step. The "decoded asset store" option was
  evaluated and is **not needed**.
- +7 tests (`tests/warmup-manifest.test.ts` new; 2 in `preloader.test.tsx`).
  Gate: typecheck clean, **485/485**, lint 0.

---

## Goal (user's words)  _(original handoff below)_

**For:** a fresh session · **Status (orig):** not started

## Goal (user's words)

> The preloader should preload the HOME PAGE entirely and shouldn't lag when
> loading assets on the home page. Same for the ABOUT page.

By the time the intro reveal finishes, everything the reader will scroll
through on `/` (and on `/about` if that is the landing route) must already be
in the browser cache **and decoded** — no image pop-in, no late webfont shift,
no first-scroll hitch when a section mounts.

## How preloading works today (verified 2026-08-30)

| Piece | File | Notes |
|---|---|---|
| Overlay + progress + exit | `src/shared/components/Preloader.tsx` | `motion/react` only (no GSAP — eager-bundle rule). Progress = `resolved / total` signals. Timing consts L68–113. Session key `phitopolis:preloaded` (L53). |
| Signal orchestration | `src/shared/components/AppShell.tsx` `useWarmupSignals` (~L227–285) | Builds the signal array once at first render; route promises deferred via `__start` thunk fired from a mount effect (fixed this session — do not move back into render). |
| Route warm | `WARM_ROUTES` (`AppShell.tsx` ~L95) | `/about`, `/services`, `/blog`, `/contact` via `router.preloadRoute()`. |
| Asset manifest | `SECTION_MANIFEST` (`AppShell.tsx` ~L149–169) | **19 hand-curated assets.** Hero logo SVG, hero top/bottom-half webp, 4 service banners, about hero, ecotower, 1 grad photo, ~8 blog/gallery tiles. |
| Asset fetch | `preloadAsset()` (`AppShell.tsx` ~L171–216) | `new Image()` + `img.decode()`, falls back to `fetch(..., {cache:'force-cache'})`. 1200 ms per-asset timeout. |
| Entrance phase machine | `src/shared/motion/index.ts` + `AppShell.tsx` ~L495–546 | `covered → hero → header → open`. `SETTLE_MS 80`, `HEADER_AT_MS 300`, `OPEN_AT_MS 600`. |

### What is deliberately NOT preloaded (and now needs to be, for home)

From the `SECTION_MANIFEST` comment block and `docs/handover-2026-08-18-0830.md` §3.1:

- **Hero background video** — `/videos/hero-night-to-dawn.{webm,mp4}` + poster. Excluded as "opt-in monolith mode" but it renders on the default home hero (`SuperHeroSequence.tsx` ~L884 via `useBackgroundVideo`).
- **Below-fold home section imagery** — Process diagram SVGs, Reach world map, Closing scene, OperatingPillars card photos, UseCases card art. None in the manifest.
- **`ServiceGlobe`** R3F scene — `lazy()` + `useInView` gate (`MissionStatement.tsx` ~L27, L54). ~221 KB brotli three.js chunk fetched only when the sentinel is 900 px away.
- **Hero drift wall** (`HeroImageWall.tsx`) — currently commented out in `routes/index.tsx`; if re-enabled, 25 images.
- **`/about` `DailyLifeSection`** video (`/videos/daily-life.mp4`, ~63 MB) and `JourneyTimeline`'s ~27 hotlinked WordPress images (these 404 in some environments — see `handover-2026-08-18-0830.md` §3.3).

### The structural gap

`docs/handover-2026-08-18-0830.md` §3.1 point 4 is still open: **"Section components consume ready cache — NOT implemented."** Sections initialise their own assets on mount; the preloader only warms the HTTP cache. So even a complete manifest helps only because the browser cache is hot — there is no shared decoded-asset store.

## Work for this session

### 1. Make the home manifest complete

- Add every asset a first-viewport-to-footer scroll of `/` touches: hero video (webm + mp4 + poster), all below-fold section images/SVGs, OperatingPillars card photos, the closing scene's assets.
- Add the `ServiceGlobe` / any home R3F chunk as a **route-preload-style signal** (dynamic `import()` of the module during warm-up so the chunk is cached; the scene still renders lazily).
- Keep videos as a *lightweight* signal — preload the **poster** to decode, and kick a `fetch` with `Range: bytes=0-` (or a low-`preload` `<link>`) for the video so the first frames are cached without downloading 60 MB on the critical path. Decide the cutoff explicitly and `log()` what was deferred.

### 2. Generate the manifest instead of hand-maintaining it

- Add a Vite plugin or a prebuild script that walks the home + about route trees for static asset references (`import`ed URLs, `<img src>`, `background-image`, `SECTION_MANIFEST`-style declarations) and emits the list. Hand-curation has already drifted once.
- Alternative: a per-section `assets: string[]` field on `SectionDef` in `src/shared/sections.ts`, collated at build. This also gives section components a place to read from (addresses the structural gap).

### 3. Gate the reveal on "home is ready", not a fixed cap

- Today `MAX_SETTLE_MS = 1800` force-exits even if assets are still loading. For a true "no pop-in" guarantee the exit must wait for the home-critical signals (not the route warms, not `/about`'s heavy video) — with the failsafe (`BEAT_FAILSAFE_MS = 2600`) still absolute.
- Split signals into **blocking** (home-critical: hero, first 2–3 sections, fonts) and **background** (routes, about video, deep sections) — the bar shows all, the exit waits only on blocking + a short grace.
- Coordinate with the web-intro rework (`docs/web-intro-rework/handoff.md`) — that doc specifies the exact beat structure the progress bar sits inside.

### 4. About page

- Same treatment when `/about` is the landing route (the preloader runs once per session regardless of entry point, so it must warm whichever route the user actually landed on first).
- `DailyLifeSection` video + `JourneyTimeline` images: background-tier, never blocking. Fix or remove the hotlinked WordPress images first (they are a separate reliability problem).

## Invariants that must survive

- `Preloader` uses **`motion/react` only** — no GSAP import (eager-bundle rule, `Phitv2A/CLAUDE.md`).
- Failsafe (`BEAT_FAILSAFE_MS`) fires unconditionally — a stalled asset never traps the visitor.
- Escape key skips immediately.
- `prefers-reduced-motion: reduce` → instant resolve, no sequence.
- Once-per-session (`phitopolis:preloaded` sessionStorage key).
- 21 tests in `tests/preloader.test.tsx` + `tests/preloader-adversarial.test.tsx` must stay green.
- No `gsap`/`lenis` at route-module scope; three.js stays behind `React.lazy` (only its *chunk fetch* is warmed, not its render).

## Verification

- Headless CDP against `dist/` (see `tests/preview-cdp.test.ts` harness): load `/` cold, `waitForIntroGone`, then `driveScroll` the full page with real wheel events (`page.mouse.wheel` — never `window.scrollTo`, Lenis ignores it) and assert **zero** network requests fire for images/video during the scroll (everything already cached), and no CLS after the intro.
- Repeat for `/about` as the cold landing route.
- `docs/perf-baseline.md`: LCP target < 1000 ms, current baseline 1912 ms — re-measure against `vite preview` on `:4173`.
