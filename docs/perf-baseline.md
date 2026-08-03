# Performance baseline — 2026-08-02

Measured **before** any change, so every later phase is judged against real numbers.

**Method.** Production build (`npm run build`) served by `vite preview` on `:4173`,
driven by Playwright at 1440×900 on Apple Silicon, unthrottled, localhost.
These are therefore **best-case** numbers — a low-powered target machine will be
substantially worse.

---

## 1. Toolchain gates

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ clean |
| `npm test` | ✅ **82 passed / 82**, 13 files, 5.68 s |
| `npm run lint` | ❌ **30 errors, 12 warnings — already failing before any change** |
| `npm run build` | ✅ 1.73 s |

### Pre-existing lint failures (not caused by this work)

| Rule | Count |
|---|---|
| `react-refresh/only-export-components` | 11 |
| `typescript-eslint/no-unused-vars` | 3 |
| `typescript-eslint/no-explicit-any` | 3 |
| `react-hooks/exhaustive-deps` | 1 |
| `react-hooks/refs` (Cannot access ref value during render) | in `SignalDiagram`, `ReachMap`, `PipelineDiagram`, `FollowTheSunDiagram` |
| `react-hooks/set-state-in-effect` | `useNavAutohide.ts:74` |

> **Gate for all later phases is therefore "no _new_ violations", not "lint clean."**
> The test count is **82**, not the 54 estimated during exploration.

---

## 2. Home page (`/`) — load

| Metric | Value |
|---|---|
| FCP | **448 ms** |
| **LCP** | **1,912 ms** |
| CLS | 0.000 |
| Long tasks | 2, total 280 ms, **max 199 ms** (a separate run recorded a single **557 ms** task) |
| Requests | 58 |
| **Transfer** | **11.89 MB** |
| Document height | 41,639 px |

### Transfer is images, not JavaScript

Of 11.89 MB, roughly **11.6 MB is images** and only ~430 KB is JS.

| KB | Asset |
|---:|---|
| **7,043** | `/images/grads/FocusedProgramming.JPG` |
| **2,277** | `/images/AboutPageHero.png` |
| 975 | `/images/data-science-banner.png` |
| 805 | `/images/software-engineer-banner.png` |
| 287 | `/images/ops-support-banner.jpg` |
| 277 | `/images/quant-research-banner.jpg` |
| 86 | `mui-DWVtRPLQ.js` |
| 58 | `react-BfEZsqbi.js` |
| 48 | `inter-latin-wght.woff2` |
| 45 | `motion-CMjcBaJ6.js` |
| 45 | `StatStrip-DAErTwAW.js` *(contains GSAP + ScrollTrigger)* |
| 39 | `routes-rPzlpsAC.js` *(contains Lenis)* |

**Root cause of the two worst offenders** — `CandidatesAndCareersSection.tsx:26-29` maps
job titles to full-resolution *About-page photographs*, used as **decorative card
backgrounds** on the home page:

```ts
"Full Stack Developer": "/images/AboutPageHero.png",          // 2.3 MB
"R&D Internship Program": "/images/grads/FocusedProgramming.JPG", // 7.0 MB
```

A ~400 px card is loading a 7 MB photo. `TopNavMegaDrawer.tsx:36,50` reuses the same two
files as hover previews.

---

## 3. Home hero — the reported symptom

### Static cost (measured in the live DOM)

| Metric | Measured |
|---|---|
| Hero subtree DOM nodes | **250** |
| Stacked `<img>` copies of the same 26 KB logo SVG | **14** |
| Elements with `filter: blur()` | **43** |
| Elements with `transform-style: preserve-3d` | **30** |
| Canvases | 1 |
| Total document nodes | 1,167 |

### Scroll cost — the actual defect

Scrolling from the top through the pinned hero (50 steps × 250 px, ~3 s):

| Metric | Measured |
|---|---|
| **CSS rules before scroll** | **961** |
| **CSS rules after scroll** | **2,296** |
| **Rules injected purely by scrolling** | **+1,335 (+139 %)** |
| Average FPS | 55.8 |
| Frame p50 / p95 / p99 | 17 / 33 / 33 ms |
| Frame max | **100 ms** |
| **Frames missing 60 fps** | **56 of 173 — 32 %** |
| Frames worse than 30 fps | 4 |

**Interpretation.** `SuperHeroSequence.tsx:81` calls `setScrollProgress` on every
ScrollTrigger tick. Every one of the 250 hero nodes has an `sx` object that interpolates
that progress, so Emotion cannot cache and re-serializes on each frame — measured directly
as **1,335 new stylesheet rules injected by a single scroll pass**. Combined with 32 cube
faces animating `width`/`height` (layout, not transform) and 43 live blur layers, the
compositor cannot keep up. **32 % of frames miss 60 fps on an unthrottled M-series Mac
serving a production build over localhost.** That is the "particles loading one at a time."

There is **no particle system**: `ParticleField.tsx` has zero imports.

### Visual parity targets
- `baseline-hero-phase0.png` — 3D isometric state at scroll 0 (extruded P, 16 cubes,
  4 elevated service nodes with gold glow, grid floor, cast shadows, gold signal lines).
- `baseline-home-1440.png` — flattened state (P + PHITOPOLIS wordmark).

The canvas rewrite must reproduce both.

---

## 4. `/blog` — the video

`daily-life.mp4`: **62,788,203 B · 251 s (4 min 11 s) · 1280×720 · ~2 Mbps**, used as a
**decorative background loop**.

`BlogVideoHero.tsx` sets `autoPlay` with no poster and no IntersectionObserver gate.
Measured on `/blog`, ~13 s after load:

| Metric | Measured |
|---|---|
| Range requests issued for the mp4 | **40** |
| Buffered | **65 s of 251 s (26 %)** |
| Estimated bytes pulled | **~15.5 MB and still climbing** |
| `readyState` | 4 (HAVE_ENOUGH_DATA) |
| `poster` | none |

**Correction to the exploration report:** it is *not* a single 62.8 MB download. The browser
range-streams it. But it autoplays unprompted and had pulled ~15.5 MB within 13 seconds,
continuing — for decoration. `/innovation-hub` does the same via `InnovationHero.tsx`.
A 251-second 720p file is being used where a ~10-second loop would do.

---

## 5. Bundle

| Chunk | raw B |
|---|---:|
| mui | 294,842 |
| react | 189,644 |
| routes *(Lenis)* | 146,711 |
| motion | 141,713 |
| tanstack | 122,796 |
| **StatStrip** *(GSAP + ScrollTrigger)* | 115,793 |
| index (entry) | 104,042 |
| about | 62,061 |

- **Eager set: 876,534 B raw / ~236,615 B brotli.**
- Home first-load: **1,157,283 B raw / ~314,855 B brotli**, 17 JS requests.
- `StatStrip-DAErTwAW.js` is misnamed — it is the `/` ∩ `/about` shared chunk and rolldown
  hoisted all of GSAP + ScrollTrigger into it, so GSAP is in the home critical path.
- `.br`/`.gz` sidecars are emitted for every asset (219 files) but **neither
  `netlify.toml` nor `vercel.json` has a headers block**, so they are never served and no
  `Cache-Control: immutable` is set on `/assets/*`.
- `@mui/x-charts` is declared in `package.json:25` with **zero usage** in `src/`.

---

## 6. `public/` — 243 MB

| Dir | Size |
|---|---:|
| `public/images` | **166 M** |
| `public/videos` | **60 M** |
| `public/logos` | 9.7 M |
| `public/2020` | 5.2 M |
| `public/pdfs` | 1.8 M |

**41 files > 1 MB · 189 files > 200 KB.** 124 PNG, 94 JPG, only 25 WebP, zero AVIF.
Includes `grads/2024B1.HEIC` (2.5 MB — Chrome and Firefox cannot decode HEIC) and
`logos/schools/stacked-aim-bunel-sophia` (4.9 MB, **no file extension**).

`dist/` totals **274 MB** because `public/` is copied wholesale.

---

## 7. Environment note (flagged, not a defect to fix here)

`.env.production` sets `VITE_API_URL=https://phitv2.phit.b.com`, which does **not resolve**.
Every route in a production build fires failing API calls (`ERR_NAME_NOT_RESOLVED`) and
falls back to local fixtures. Also 404s on `/_vercel/insights/script.js` and
`/_vercel/speed-insights/script.js` outside Vercel. Both are deploy-config decisions.

---

## Targets for the work

| Metric | Baseline | Target |
|---|---:|---:|
| Home LCP (unthrottled localhost) | 1,912 ms | < 1,000 ms |
| Home transfer | 11.89 MB | < 1.5 MB |
| CSS rules injected by hero scroll | **+1,335** | **0** |
| Frames missing 60 fps through hero | **32 %** | < 5 % |
| Hero DOM nodes | 250 | < 20 |
| Blur layers in hero | 43 | 0 |
| `public/` | 243 MB | < 15 MB |
| Tests passing | 82 / 82 | 82 / 82 (+ new) |
| Lint | 30 errors (pre-existing) | no new violations |
