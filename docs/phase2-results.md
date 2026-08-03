# Phase 2 results — site-wide performance

Same measurement setup as `docs/perf-baseline.md`: production build via `vite preview`
on `:4173`, Playwright at 1440×900, unthrottled, localhost.

---

## 1. The video — the biggest single win

`daily-life.mp4` was **62,788,203 B · 251 s · 1280×720 · ~2 Mbps**, used three ways:
as genuine content in `DailyLifeSection`, and as a *decorative background* on both
`/blog` and `/innovation-hub` with `autoPlay`, no poster and no gate.

| `/blog` | Before | After |
|---|---:|---:|
| Video requests | **40 range requests** | **1** |
| Bytes pulled in first ~13 s | **~15.5 MB, still climbing** | **842 KB, complete** |
| File served | `daily-life.mp4` (251 s) | `daily-life-loop.webm` (12 s) |
| Poster | none | `daily-life-poster.jpg` (39 KB) |
| `preload` | `metadata` (overridden by autoplay) | `none` |
| Total page requests | 68 | **31** |

Three derivatives, none of which existed before:

| File | Size | Used by |
|---|---:|---|
| `daily-life.mp4` (re-encoded, 251 s) | **17.9 MB** (was 62.8 MB, −70 %) | `DailyLifeSection` — real content |
| `daily-life-loop.mp4` (12 s) | **787 KB** | hero backgrounds, fallback |
| `daily-life-loop.webm` (12 s, VP9) | **842 KB** | hero backgrounds, preferred |
| `daily-life-poster.jpg` | **39 KB** | all three |

New `src/shared/components/useBackgroundVideo.ts` gates both hero backgrounds:
nothing loads until the element is near the viewport, playback pauses off-screen and
in a hidden tab, and **reduced-motion users and low-power devices never load the video
at all** — they get the poster. A looping background film is exactly what WCAG 2.2.2 is
about, and neither hero previously honoured it.

`DailyLifeSection` keeps the full film (it has real controls and its own gate) and gains
a poster so the frame is never empty.

## 2. Images

| | Before | After |
|---|---:|---:|
| `public/` | **243 MB** | **102 MB** (−58 %) |
| `public/images` | 166 MB | **76 MB** |
| `public/videos` | 60 MB | **20 MB** |
| `public/logos` | 9.7 MB | **3.7 MB** |
| `dist/` | 274 MB | **115 MB** |

Three passes:

1. **In-place downscale + recompress** — 196 files over 150 KB, capped at 1920px.
   168 MB → 98.6 MB. Paths and formats unchanged, so nothing could break.
2. **WebP conversion for statically-referenced images** — 15 files, **10.2 MB → 1.75 MB
   (−83 %)**, with all 15 paths updated across 7 source files. Best cases:
   `AboutPageHero.png` 2,277 → 108 KB (−96 %), `DLSUexpo.png` 2,716 → 205 KB (−93 %),
   the five AWS cert badges ~260 → ~31 KB each (−88 %).
3. **Blog body images resized to the column they render in** — the article column is
   `maxWidth: 760`, so 1920px images were 2.5× oversized even for retina. 117 files
   resized to 1520px, 86.2 MB → 69.5 MB.

Deleted (recoverable via `git checkout`): `grads/2024B1.HEIC` (2.4 MB — Chrome and
Firefox cannot decode HEIC, and nothing referenced it) and
`logos/schools/stacked-aim-bunel-sophia` (4.6 MB, no file extension, unreferenced —
actually a 2816×1536 PNG).

Attributes added across 26 render sites: **30 × `decoding="async"`** (there were zero)
and **14 × `loading="lazy"`** (there were five). LCP candidates and chrome — the AppShell
logo, the preloader mark, the About hero, the hero split-panes — are deliberately left
eager.

## 3. Build and hosting

- **Font preloading.** A new `preloadFonts()` Vite plugin injects
  `<link rel="preload" … as="font" crossorigin>` for the content-hashed woff2 files.
  Verified in `dist/index.html`. They were previously undiscoverable until `fonts.css`
  had been fetched and parsed — one serialised round trip before a `font-display: swap`
  reflow.
- **Cache headers, finally set.** `netlify.toml` and `vercel.json` had *no* headers block
  at all, despite the README documenting the policy. Both now set
  `max-age=31536000, immutable` on `/assets/*`, a finite 7-day lifetime on the
  non-hashed `/images`, `/videos` and `/logos`, and `no-cache` on `/index.html`.
- **`@mui/x-charts` removed** — a declared dependency with zero imports in `src/`.
- **`html { scroll-snap-type: y proximity }` removed.** Its own comment claimed "only
  About's own sections carry `scroll-snap-align`", but `scroll-snap-align` appears
  **nowhere** in `src/`. It had no snap targets — pure cost on every route, and root-level
  snap combined with Lenis and GSAP pinning is a known jank source.

## 4. Runtime

`JourneyTimeline`'s canvas loop (spring physics, a 180-slot ring buffer, and
`ctx.measureText` per year per frame) ran at 60 fps for the entire 480 vh About page,
on-screen or not, and kept running in a backgrounded tab. It now:

- stops via `IntersectionObserver` and `visibilitychange`,
- reads `offsetWidth` / `offsetHeight` / `innerHeight` from cached values instead of
  forcing a synchronous reflow **every frame**,
- debounces resize (120 ms) instead of reallocating the backing store per event,
- registers `mousemove` and `resize` as `passive`.

---

## Gates

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ clean |
| `npm test` | ✅ **102 / 102** |
| `npm run lint` | ✅ **30 errors** — the pre-existing baseline, no new violations |
| `npm run build` | ✅ 1.61 s |
| Font preload in `dist/index.html` | ✅ both woff2 |

---

## Not done, and why

**`public/` is 102 MB, not the <15 MB target.** 69.5 MB of that is blog body images, and
they cannot be reformatted from here:

- `src/features/blog/fallback.ts` contains **zero** image paths — blog bodies come from
  the API (`VITE_API_URL`), with a twin server-side implementation named in
  `bodyImages.ts` as `backend/app/features/blog/body_images.py`.
- The paths (`/images/blog/<slug>/02.png`) therefore live in **backend content**, not in
  this repo. Renaming them to `.webp` would break every blog post body, and I cannot see
  or update that content.

What was safe has been done: they are downscaled to exactly 2× their 760px render column.
The remaining ~50 MB needs a coordinated change — convert to WebP here *and* update the
stored body text server-side. `bodyImages.ts`'s regex already accepts `webp` and `avif`,
so the frontend is ready for it.

**Other items deliberately left:**

- **`AppShell`'s `checkIsAtBottom()` forced layout** inside non-passive `wheel` /
  `touchmove` handlers. This is real (a full layout read per wheel tick), but it lives
  inside the overscroll-navigation hijack that Phase 3 deletes outright. Optimising code
  that is about to be removed would be wasted work.
- **`useDeviceTier` is consumed by `HeroCanvas` and `useBackgroundVideo` only.** The
  header `backdrop-filter`, `GrainOverlay` and Lenis `lagSmoothing(0)` still run on every
  device. `GrainOverlay` and the grain/handle decorations are deleted in Phase 3; the
  header blur and lag smoothing should be tier-gated after that.
- **`vite-plugin-compression2`** still emits 219 `.br`/`.gz` sidecars. Netlify and Vercel
  compress on the fly and ignore sidecars, so on those hosts these are dead build
  artefacts — but the README targets nginx (`brotli_static on`), and both a
  `netlify.toml` and a `vercel.json` exist, so the actual deployment target is ambiguous.
  Flagging rather than guessing.
- **`avifenc` is not installed** (`brew install libavif`), so no AVIF variants. WebP
  covers ~96 % of browsers and was the larger win.
- **`.env.production` still points at `https://phitv2.phit.b.com`**, which does not
  resolve. Every production route fires failing API calls. Deploy config, unchanged.
