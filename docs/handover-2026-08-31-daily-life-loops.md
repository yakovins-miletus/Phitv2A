# Handover — per-route hero video loops + preloader warm-up (2026-08-31)

## Context

Two related pieces of work in one session:

1. **Home pillars gap** (from the earlier "HOME PAGE ONLY" audit) — `OperatingPillars`
   renders three `<img>` backgrounds (`/images/pillars/{research,development,support}.webp`)
   on `/`. The files landed 2026-08-24 but the warm-up manifest still excluded them
   on a stale "don't exist on disk" belief, so they popped in on scroll.

2. **Per-surface hero video loops** — the blog hero's shared `daily-life-loop` was
   cut from a weak segment. Requested: recut the blog loop from the film's *intro*,
   add distinct loops for `/careers` and `/services`, keep all three very light, and
   warm them in the preloader.

## What shipped

### Video assets (`public/videos/`)

Cut from `daily-life.mp4` (1280×720, 251s, h264). Each transcoded to 880–900w,
20fps, no audio, `+faststart`:

| File | Segment | mp4 | webm | poster |
|---|---|---:|---:|---:|
| `daily-life-blog-loop.*` | `00:13.5`–`00:20.5` — arrival through the World Plaza lobby | 273 KB | 356 KB | 37 KB |
| `daily-life-careers-loop.*` | `03:15`–`03:21.5` — graduate cohort at the window | 169 KB | 204 KB | 30 KB |
| `daily-life-services-loop.*` | `00:43.5`–`00:51` — world-clocks wall → engineers at desks | 218 KB | 253 KB | 29 KB |

Encoder (for re-cuts): `ffmpeg -ss <t> -t <dur> -i daily-life.mp4 -an -vf "scale=900:-2,fps=20,hqdn3d=2:1:2:2" -c:v libx264 -crf 33 -preset veryslow -pix_fmt yuv420p -movflags +faststart out.mp4` (webm: `libvpx-vp9 -crf 42 -b:v 0`).

### Code

- **`src/shared/components/useBackgroundVideo.ts`** — added `BLOG_LOOP`,
  `CAREERS_LOOP`, `SERVICES_LOOP` (same `{webm,mp4,poster}` shape as
  `BACKGROUND_LOOP`). `BACKGROUND_LOOP` unchanged — still used by the Innovation
  hero backgrounds.
- **`src/features/blog/components/BlogVideoHero.tsx`** — `BACKGROUND_LOOP` → `BLOG_LOOP`.
- **`src/features/services/components/ServicesHeroHeader.tsx`** — gated `<video>`
  layered over `/images/ecotower-bgc.webp` in the same slot (`objectFit:cover`,
  same `objectPosition`), fades `0 → 0.85` over 1.2s once decoded. Under the
  existing white gradient mask it reads on the right half of the band. Anchor
  unchanged (`SERVICES_PAGE`, `dark:false`) — the treatment stays visually light.
- **`src/routes/careers.index.tsx`** — new inline `CareersVideoHero`: a full-bleed
  dark band (`50/58vh`) above the light "register" header, gated `CAREERS_LOOP`
  video + navy gradient, mono kicker + a `<p>` headline ("A day in the life is the
  interview."). Headline is a `<p>` not a heading — the page's real `<h1>` stays
  in the register section. New anchor `CAREERS_HERO` (`dark:true`) so the navbar
  inverts over the band. Return wrapped in a fragment.
- **`src/shared/components/navbarAnchors.ts`** — `CAREERS_HERO: 'careers-hero'`.
- **`src/shared/components/AppShell.tsx`** —
  - `HOME_BACKGROUND_IMAGES` now lists the three pillar webps (was `[]`); stale
    "deliberately absent" comment for pillars removed.
  - `resolveRouteManifest` normalizes a trailing slash, then adds `/blog`,
    `/careers`, `/services` branches → each background-warms its loop's
    `webm + mp4 + poster` (never blocking). `preloadAsset` handles video via
    `fetch(url, {cache:'force-cache'})`, posters via `new Image()`.
- **`src/shared/content.ts`** — corrected the stale "pillars not yet in the repo" comment.
- **`tests/warmup-manifest.test.ts`** — assertions for the pillars background tier
  and the three video-loop routes (loops are background-only, never `blocking`,
  trailing-slash tolerant).

## Verification done

- `yarn typecheck` clean · `yarn lint` 0 errors (33 pre-existing warnings) ·
  `yarn vitest run` — 357/357 in the touched suites (warmup-manifest, preloader,
  motion/, anchor-namespaces, navbar-precedence) · `yarn build` clean.
- Preview pane (`vite preview`): `/careers` dark band renders with the cohort
  video (`readyState 4`, 199 KB webm from cache, navbar light chrome); `/services`
  video layer loads (247 KB) and fades over the ecotower still; `/blog` hero shows
  the new lobby-arrival poster and `BLOG_LOOP` sources. 0 console errors on all three.

## Follow-up session — 2026-08-31 (later)

Closed the follow-up list:

- **Preloader warm path — CONFIRMED end-to-end.** `vite preview` + Browser pane,
  `sessionStorage` cleared, cold-load `/careers`: `daily-life-careers-loop`
  `.webm` + `.mp4` + poster all fetched at `startTime ≈ 33 ms` (during the intro
  overlay) with the `<video>` element still `src="" readyState 0` — i.e. the
  `resolveRouteManifest` warm did the fetch, not the `useBackgroundVideo`
  IntersectionObserver. Repeated for a cold `/blog` load: all three at `≈ 48 ms`.
  0 console errors on both. (`/services` shares the same manifest branch and is
  covered by `warmup-manifest.test.ts`; the once-per-session `phitopolis:preloaded`
  gate means only the first cold route in a session shows the warm.)
- **Reveal text** — pane still suspends IO so headlines don't paint in
  screenshots, but every hero headline queried `opacity: 1` via JS. The new
  `/careers` line renders: `"See a day here before you decide to spend years."`
- **Careers band copy + spacing** — placeholder headline replaced with
  `"See a day here before you decide to spend years."` (still a `<p>`, kicker
  unchanged). Register section `pt` trimmed `{xs:12, md:16}` → `{xs:6, md:9}` so
  the dark band and the light header read as one unit. Screenshot confirms the
  navbar chrome inverts to light over the band (`CAREERS_HERO`, `dark:true`).
- **`useVideoBg` dead code — REMOVED.** `const useVideoBg = false` in
  `SuperHeroSequence.tsx` gated an entire unreachable `<video>` background path
  (parallax `useEffect`, ping-pong-playback `useEffect`, the `{useVideoBg && …}`
  render block, the `useBackgroundVideo()` call + 4 destructured vars, the two
  parallax refs, and the `HERO_BG_VIDEO` import). All removed. `HERO_BG_VIDEO`
  had no other consumer so it was also deleted from `useBackgroundVideo.ts`
  (the `public/videos/hero-night-to-dawn.*` files stay on disk).
- **`tests/preview-cdp.test.ts`** — runs green, 7/7 (was not skipped; needs a
  fresh `yarn build` first). Transition-smoothness metrics nominal
  (deferred refresh: 1 long task 58 ms, 1 dropped frame).
- **LCP** — not re-measured with a clean CDP trace this session (embedded pane
  blocks popups and drops the buffered LCP entry). No expected change: the loops
  are background-tier (`warmup-manifest.test.ts` asserts `blocking: []` for all
  three routes) and `/`'s manifest is unchanged. `docs/perf-baseline.md` home
  LCP 1,912 ms still stands until a dedicated CDP re-measure.

Gate: `yarn typecheck` clean · `yarn lint` 0 errors (33 warnings) ·
`yarn vitest run` 487/487 (+ the known `careers-*` `document is not defined`
motion-dom teardown flake, moves between files run-to-run) · `yarn build` clean.

## Still open

- **`daily-life-loop.*` (the original 12s shared loop)** is now only referenced by
  the Innovation heroes (`InnovationHero.tsx`, `InnovationLabComingSoon.tsx` via
  `BACKGROUND_LOOP`). If those are reworked, it can go.
- Dedicated CDP LCP re-measure for `/`, `/blog`, `/careers`, `/services` vs
  `docs/perf-baseline.md`.

## Resume in next session

```
Continue the daily-life video-loop work — see docs/handover-2026-08-31-daily-life-loops.md
```
