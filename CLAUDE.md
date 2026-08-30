# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Fresko** — the public-facing marketing site for Phitopolis (a fintech
engineering / quant R&D firm). React 19 + Vite + TypeScript (strict) +
TanStack Router/Query, MUI 7 for components, and a heavy GSAP/Lenis/R3F motion
layer on the home page. This repo is one of five sibling projects under
Project Armstrong (see the root `CLAUDE.md` one level up) — nothing outside
this directory builds or deploys with it.

## Commands

```bash
yarn install
yarn dev              # vite dev server
yarn build            # tsc -b && vite build — full typecheck gates the build
yarn typecheck        # tsc -b only
yarn lint             # eslint .
yarn test             # vitest run
yarn preview          # serve the built dist/
yarn typegen          # regenerate src/shared/api/schema.d.ts from a running Heimdall (localhost:8000)
```

Run a single test file: `yarn vitest run path/to/file.test.tsx`.

Deploy gate used before pushing to staging (yarn is not installed on the UAT
box, so it's invoked via npx there):
```bash
yarn typecheck && yarn test && yarn lint
```
Green baseline: typecheck clean, all tests passing, 0 eslint errors (warnings
tolerated — mostly raw-hex colors and react-refresh export warnings).

Backend note: `.env.development` points at `http://localhost:8000` — run
Heimdall CMS's `uvicorn app.main:app --reload --port 8000` alongside `yarn dev`
for anything that hits the API.

## Bundle-splitting rules (enforced by convention, not lint)

The eager route chunk must stay small — these are load-bearing, not style
preferences:

- Route files with a `loader` (`src/routes/*.tsx`) must import query functions
  from `@/features/<x>/api` and components directly from their component
  file — **never the feature barrel**. The loader ships in the eager bundle
  and drags in whatever it imports.
- **No `gsap`/`lenis` imports at route-module scope.** All scroll wiring lives
  in `src/shared/components/SmoothScroll.tsx`, which rides the lazy home
  chunk. `AppShell.tsx` needs to trigger a ScrollTrigger refresh but must stay
  eager, so it goes through `src/shared/motion/scrollTriggerBridge.ts`
  (a plain callback registry) instead of importing gsap directly.

## Architecture: the home page as "beats"

The home page (`src/routes/index.tsx`) is modeled as a sequence of **beats** —
an establishing shot (a short GSAP-driven headline/caliper animation) plus the
section it announces, played as **one timeline on one ScrollTrigger** via
`SectionBeat` (`src/shared/components/stage/SectionBeat.tsx`). This replaced
an earlier two-components-two-clocks design (separate shot + content triggers)
that fell out of sync at fast scroll speeds.

Key pieces, in the order you'll need them:

- **`src/shared/motion/beatThresholds.ts`** — single source of truth for every
  reveal threshold (`BEAT_START`, `BEAT_ENTER_START`, `BEAT_EXIT_START/END`)
  and the `refreshPriorityFor(order)` scheme that forces ScrollTrigger to
  refresh top-to-bottom (refreshing bottom-up reads offsets before upstream
  pins have settled). Tune the page's entrance feel here, not per-component.
- **`src/shared/components/stage/SectionBeat.tsx`** — the beat component
  itself. Two separate ScrollTriggers per beat: a one-shot, non-scrubbed
  entrance (`toggleActions: "none none none none"` + a manual `onEnter` that
  decides `tl.play()` vs `tl.progress(1)` depending on whether the section is
  already meaningfully on screen when the trigger fires) and a scrubbed exit
  dim over a disjoint range. **INVARIANT: every tween is `fromTo`/`from` with
  `immediateRender: false`; the DOM default is always the final lit state.**
  If you add a beat and the entrance trigger never fires, content must render
  lit, not hidden — never `gsap.set()` something hidden and animate it in.
  A 2s failsafe (`BEAT_FAILSAFE_MS`) rescues any beat whose trigger fires but
  whose timeline never played.
- **`src/shared/components/stageChoreo.ts`** / **`establishChoreo.ts`** — the
  actual from/to tween values for content and establishing-shot variants
  (`rise`, `grow-left`, `grow-right`, `zoom-center`, `spotlight-clip`).
- **`src/shared/components/stage/stagePresence.ts`** (`useStagePresence`) —
  a *separate* concern from reveals: tracks which section occupies the
  viewport middle (`top 50%` / `bottom 50%`) for the dot-rail nav, runs even
  under reduced motion, and is deliberately exempt from the beat-threshold
  convention above.
- **`src/shared/components/SmoothScroll.tsx`** — wires Lenis to GSAP's ticker
  (`lenis.raf` driven by `gsap.ticker`, `lenis.on("scroll", ScrollTrigger.update)`,
  `gsap.ticker.lagSmoothing(0)` while Lenis owns the frame loop, restored on
  cleanup). Only mounted by the lazy home chunk — Lenis smoothing is a
  home-page-only treatment; `getLenis()`/`stopLenis()`/`startLenis()` are
  no-ops on every other route. Issues two `ScrollTrigger.refresh()` calls
  after mount: one on next frame (layout may have shifted under the
  preloader), one on `document.fonts.ready` (FOUT→webfont reflow drifts
  every below-fold trigger).
- **`src/shared/motion/scrollSpeed.ts`** — `SCROLL_SPEED` (0.65s) drives Lenis
  `scrollTo` calls and every ScrollTrigger `scrub`; `LENIS_SMOOTH_DURATION`
  (0.45s) is the raw wheel/trackpad smoothing only, deliberately split so
  tuning one doesn't retune the other.
- **`src/shared/sections.ts`** — the `SectionDef`/`ChapterDef` registry (ground
  color per section, choreo variant, kicker label). The page is modeled as
  two "acts" (`services`, `people`) of ten chapters total.

Two beats opt out of the normal `.stage-inner` wrapping via the `bare` prop
(`UseCasesNarrative`, `DailyLifeSection`) because their `children` is itself a
pinned ScrollTrigger — GSAP requires `containerAnimation` for a trigger whose
ancestor moves, and that disables pinning/snapping, which isn't acceptable
there. `bare` beats must also pass `noExitDim`.

## Known scroll/motion gap areas (check before assuming a bug is new)

See `docs/handover-2026-08-18-0830.md` §3.2 for the last documented sweep.
Some items there predate `d85bbb1` (nested-`SectionBeat` fix on services) and
`e81edda` (manifest-driven preloading) — re-verify against current `main`
before citing them. Still-relevant, structural facts:

- Fast scrolling can outrun the ~0.4-0.9s reveal tweens; this is inherent to
  scroll-reveal at fixed durations, not a bug to "fix" without a design call.
- `docs/perf-baseline.md`, `docs/phase1-results.md` / `phase2-results.md` /
  `phase3-results.md` track the beat-refactor's measured before/after state.
- `tests/e2e/ladder-probe.js` is a dev-only harness (reads
  `window.ScrollTrigger` and `window.__lenis`, both stripped from production)
  that walks every trigger's resolved start/end across viewports — the
  parity check for threshold regressions.
- Driving scroll in headless verification must use `page.mouse.wheel()` (or
  equivalent), never `window.scrollTo` — Lenis ignores programmatic scroll
  and a script using it will report false failures.

## Open rework — CLOSED 2026-08-30

All three areas below were rebuilt and merged. Cycle summary + the remaining
maintainer verification steps:
[`docs/open-rework-cycle-2026-08-30/handoff.md`](docs/open-rework-cycle-2026-08-30/handoff.md).
Each per-area handoff now carries a `## Resolution` block at its top.

1. **Preloader full-preload** → `LoadSignal.blocking?` tiers (reveal gates only on
   the blocking set), route-aware `resolveRouteManifest(pathname)` in
   `AppShell.tsx` replacing `SECTION_MANIFEST`, ServiceGlobe chunk
   background-warmed. `/`'s below-fold is canvas/SVG/CSS so there is no raster
   imagery to race — the "decoded asset store" idea was evaluated and dropped.
   [`docs/preloader-full-preload/handoff.md`](docs/preloader-full-preload/handoff.md)

2. **Web intro** → beat-sequenced `Preloader.tsx` (`BEAT_S = 0.26s`, 4 phases,
   `SETTLE_HOLD_MS` replacing `POST_100_BEAT_MS`), rectangular `clip-path` reveal
   unified with `viewTransitions.css` `fresko-home-aperture`, hero pin
   ScrollTrigger gated on `useEntranceSettled()`. `Preloader.tsx` stays
   `motion/react`-only.
   [`docs/web-intro-rework/handoff.md`](docs/web-intro-rework/handoff.md)

3. **Home closing section** → `ClosingLattice.tsx` rebuilt into 3 render modes
   (desktop 5-phase disjoint scrub / bespoke mobile static stack / reduced-motion
   final frame); CTA in a grid column, no `--hp-px` snap; pin 1.3vh → 2.0vh.
   [`docs/closing-section-rebuild/handoff.md`](docs/closing-section-rebuild/handoff.md)

**Still open (next session):** run `tests/preview-cdp.test.ts` + LCP re-measure +
`ladder-probe.js` parity, screencast-verify the intro/closing motion in a real
browser, and the `/images/pillars/*` 404 + `useVideoBg` dead-code items. See the
cycle handoff.

## Motion library versions & the root-level GSAP/Lenis skills

GSAP appears in **21 source files**. Library versions in use:

| Library | Version | Role |
|---|---|---|
| `gsap` | 3.15.0 | Primary animation engine. **All former Club/premium plugins are free and installed** — ScrollTrigger, ScrollSmoother, SplitText, MorphSVG, DrawSVG, Flip, Draggable, Inertia, Observer, CustomEase/Bounce/Wiggle, GSDevTools. |
| `@gsap/react` | 2.1.2 | `useGSAP()` hook — the required pattern for GSAP in components (27 usages). |
| `lenis` | 1.3.25 | Smooth scroll, **home route only**. |
| `motion` | 12.x | Micro-interactions (separate from GSAP; don't mix on the same element). |
| `@react-three/fiber` + `three` | 9.x / 0.185 | 3D hero and playground scenes. |

**[../../StrictHandbookMotion.md](../../StrictHandbookMotion.md)** (at the Project Armstrong root) has the copy-paste audit prompt for reviewing GSAP/Lenis usage against content-order, accessibility, and lifecycle rules — use it before any large motion refactor.

### Official GSAP agent skills (installed at the Project Armstrong root)

The root `.claude/skills/gsap-*` are the **official GreenSock skills**, MIT-licensed, vendored from
[github.com/greensock/gsap-skills](https://github.com/greensock/gsap-skills) (commit `aed9cfd`).
Seven are installed — `gsap-core`, `gsap-react`, `gsap-scrolltrigger`, `gsap-timeline`,
`gsap-plugins`, `gsap-performance`, `gsap-utils`. `gsap-frameworks` is deliberately **not**
installed: it covers Vue/Svelte/Nuxt, and nothing in this workspace uses those.

They load automatically when animation work comes up, or invoke one directly (e.g. `/gsap-scrolltrigger`).
There is **no official GSAP MCP server** — GreenSock ships skills, not an MCP; the "GSAP MCP"
packages on npm/LobeHub are unaffiliated community projects. Use these skills instead.

To refresh them later:

```bash
npx skills add https://github.com/greensock/gsap-skills --skill gsap-react
```

### Lenis skill (hand-authored, no official one exists)

The root `.claude/skills/lenis/` is **not vendored from an upstream skill** — darkroom.engineering
(Lenis's maintainer) publishes no `.claude-plugin`, skill, or MCP. The only third-party
"Lenis MCP/skill" results found online are unaffiliated, low-adoption personal repos
(0-star MCP server, an unrelated-named skill repo) — deliberately not installed;
running a stranger's MCP server means running their code for no real benefit over
reading the docs. Instead the skill was authored directly from the
[official README](https://github.com/darkroomengineering/lenis) (MIT) and scoped to
this repo's actual usage — including the one live gap found while writing it:
**`lenis/dist/lenis.css` is never imported**, despite the README recommending it.
Not fixed automatically — flag it if you're touching `stopLenis()`/`startLenis()`.
