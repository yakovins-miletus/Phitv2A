# Phase 1 results — canvas hero

Measured the same way as the baseline: production build via `vite preview` on `:4173`,
Playwright at 1440×900, Apple Silicon, unthrottled, localhost. Same script, same
scroll pass (50 × 250px). Baseline numbers from `docs/perf-baseline.md`.

---

## Load

| Metric | Before | After | Δ |
|---|---:|---:|---:|
| FCP | 448 ms | **260 ms** | −42 % |
| **LCP** | 1,912 ms | **360 ms** | **−81 %** |
| Long tasks (count) | 2 | **1** | |
| Long tasks (total) | 280 ms | **74 ms** | −74 % |
| **Longest task** | 199 ms | **74 ms** | **−63 %** |
| CLS | 0.000 | 0.000 | — |
| Requests | 58 | **41** | −29 % |

## Hero cost

| Metric | Before | After | Δ |
|---|---:|---:|---:|
| **Hero subtree DOM nodes** | 250 | **34** | **−86 %** |
| Stacked logo `<img>` copies | 14 | **0** | −100 % |
| `filter: blur()` layers | 43 | **0** | −100 % |
| `preserve-3d` contexts | 30 | **0** | −100 % |
| Total document nodes | 1,167 | **944** | −19 % |
| Stylesheet rules at rest | 961 | **763** | −21 % |

## Scroll — the reported symptom

| Metric | Before | After | Δ |
|---|---:|---:|---:|
| **CSS rules injected by one scroll pass** | **1,335** | **3** | **−99.8 %** |
| Average FPS | 55.8 | **60.0** | |
| Frame p50 | 17 ms | 17 ms | — |
| Frame p95 | 33 ms | **17 ms** | −48 % |
| Frame p99 | 33 ms | **18 ms** | −45 % |
| **Frame max** | **100 ms** | **18 ms** | **−82 %** |
| Frames worse than 30 fps | 4 | **0** | −100 % |

> **On reading the frame numbers.** The raw "% of frames over 16.7 ms" counter still
> reports ~27 %, but that is an artefact of the threshold: at 60 Hz the nominal frame is
> 16.67 ms, and frames measured at 17–18 ms are *on time*. The honest signals are p99
> (33 ms → 18 ms), max (100 ms → 18 ms) and frames over 30 fps (4 → 0). Before, at least
> 5 % of frames were at 30 fps or worse with a 100 ms stall. Now nothing exceeds 18 ms.
> The scroll is locked to 60.

**The 1,335 → 3 figure is the headline.** Scrolling no longer writes to the stylesheet.
The 3 remaining rules are one-time mounts of the stage-gated elements, not per-frame
churn.

## Transfer

The 7.0 MB `grads/FocusedProgramming.JPG` and 2.3 MB `AboutPageHero.png` no longer load
on the home page at all. It now requests **7 images totalling ~872 KB** (six 1200px
career-card derivatives plus the logo SVG), against ~11.6 MB of images before.

| Image set | Before | After |
|---|---:|---:|
| Career-card backgrounds + warm-up | ~11.4 MB | **844 KB** (−93 %) |
| `FocusedProgramming` alone | 7,042 KB | **146 KB** (−98 %) |
| `AboutPageHero` alone | 2,276 KB | **146 KB** (−94 %) |

Generated with `sips` (no new dependencies). `cwebp`/`ffmpeg` are **not installed** on
this machine, so these are JPEG rather than WebP/AVIF — Phase 2 will need that tooling
to go further.

---

## Gates

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ clean |
| `npm test` | ✅ **102 passed / 102** (was 82; +20 new, 0 broken) |
| `npm run lint` | ✅ **30 errors** — identical to the pre-existing baseline, **no new violations** |
| `npm run build` | ✅ 2.43 s |
| Console errors | Only the pre-existing `phitv2.phit.b.com` DNS failures and Vercel 404s |

One new lint error was introduced mid-work (`setState` directly inside an effect in
`Preloader.tsx`) and fixed properly rather than suppressed — by deleting the now-vestigial
`"complete"` phase, whose only remaining job was to forward to `"dismissing"`.

---

## What changed

**New**
- `src/features/hero/heroScene.ts` — scene geometry + the 3D projection, pure.
- `src/features/hero/heroCanvasRenderer.ts` — the draw layer, pure.
- `src/features/hero/HeroCanvas.tsx` — one canvas, imperative progress, rAF that stops.
- `src/features/hero/heroVars.ts` — progress → CSS custom properties, plus the coarse stage.
- `src/shared/motion/useDeviceTier.ts` — the first capability tiering in the codebase.
- `tests/motion/hero-scene.test.ts` — 20 parity tests.

**Deleted — 1,104 lines**
- `HeroSignalP.tsx` (866), `ParticleField.tsx` (173, zero imports), `Hero3DText.tsx` (65, zero imports).

**Rewired**
- `SuperHeroSequence.tsx` — `useState` → ref + CSS variables; the four forced 1.5 s
  `lenis.scrollTo` snaps deleted (~3,150 characters); layout-property animation
  (`maxWidth`/`border`/`boxShadow`) reduced to a single threshold switch.
- `Preloader.tsx` — 2,750 ms of hardcoded buffers → one 180 ms settle; the four
  infinitely-repeating `feGaussianBlur` arcs → two-pass strokes.
- `CandidatesAndCareersSection.tsx`, `AppShell.tsx` — point at the derivatives.

`heroPhases.ts` was **not touched**. All 35 of its existing tests still pass, so the
nine-phase narrative is provably unchanged.

## Visual parity

`docs/baseline/baseline-hero-phase0.png` vs `docs/baseline/after-hero-v2.png`. The
isometric grid, 16 extruded cubes, 4 elevated service nodes with gold icons and glow,
travelling signal pulses, cast shadows and the extruded P all render as before.

Known cosmetic deltas, all minor and none structural:
- Cube top faces use a flat lighten rather than the old white gradient overlay.
- Service-node top faces have square rather than 14px-rounded corners.
- Cast shadows are marginally softer and wider.

`docs/baseline/after-hero-mobile.png` confirms the 375px layout.

## Carried into Phase 2

- `daily-life.mp4` (62.8 MB, 251 s, 720p) still autoplays ungated on `/blog` and
  `/innovation-hub`.
- `public/` is still 243 MB; only the six career images have derivatives.
- `cwebp` / `ffmpeg` must be installed before the real media pass.
- `useDeviceTier` exists and is wired into `HeroCanvas`, but nothing else consumes it
  yet — the header backdrop-blur, grain overlay and Lenis lag-smoothing still run on
  every device.
