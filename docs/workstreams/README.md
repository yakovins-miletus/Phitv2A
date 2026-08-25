# Fresko workstreams

Each file is **independently executable**. One compiled brief was split into these so the
work can run in any order (bar two constraints below) without two files editing the same
source file.

**Handovers:** [claude-fresh-session-handover.md](claude-fresh-session-handover.md) ·
[antigravity-session-handover.md](antigravity-session-handover.md) ·
[COMMIT-NOTES.md](COMMIT-NOTES.md)

**How to use one:** open a single `ws-NN-*.md` and execute it. It carries its own evidence,
steps, and verification. You should not need this README, the other files, or the
conversation that produced them.

**Model policy:** Haiku agents for exploration, Sonnet agents for implementation.
**Acceptance bar:** `/design-taste-frontend` + taste-skill.

---

| # | Workstream | Owns | Status |
|---|---|---|---|
| WS-01 | [Design system: flatten + unify accent](ws-01-design-system-flatten.md) | `src/shared/theme/**`, contrast tests | ready |
| WS-02 | [Home: service-centric re-architecture](ws-02-home-architecture.md) | `routes/index.tsx`, `features/home/**`, `features/hero/description/**` | ready |
| WS-03 | [Home hero: photo wall → word columns](ws-03-home-hero-wordwall.md) | `features/hero/{HeroImageWall,DriftWall,heroWallTiles,SuperHeroSequence}` | ready |
| WS-04 | [Home closing: isometric lattice](ws-04-home-closing-isometric.md) | `features/home/components/ClosingShelf.tsx` + new scene dir | ready |
| WS-05 | [About hero: slanted photo strips](ws-05-about-hero-strips.md) | `features/about/{HeroGallery,BackgroundReveal}` | ready |
| WS-06 | [Performance audit (measure only)](ws-06-perf-audit.md) | *nothing — read-only* | ready |
| WS-07 | [Diagram craft](ws-07-diagram-craft.md) | `shared/components/diagrams/**`, `ServiceDrawer`, `ReachMap` | ready |
| WS-08 | [Blog: year navigation rail](ws-08-blog-year-rail.md) | `features/blog/**`, `routes/blog.index.tsx` | ready |
| WS-09 | Heimdall: year facets → **`Heimdall CMS/docs/workstreams/`** | Heimdall `app/features/blog/**` | ready |
| WS-10 | [Services: kill the false error](ws-10-services-polish.md) | `routes/services.tsx`, `features/services/**` | ready |
| WS-11 | [Careers: flatten the dossier](ws-11-careers-polish.md) | `routes/careers.*.tsx`, `shared/careersData.ts` | ready |
| WS-12 | [Contact: fewer surfaces](ws-12-contact-apple.md) | `routes/contact.tsx`, `features/contact/**` | ready |
| WS-13 | [Site intro: pace the reveal](ws-13-site-intro.md) | `shared/components/Preloader.tsx`, preloader tests | ready |
| WS-14 | [Lint backlog → real gate](ws-14-lint-backlog.md) | cross-cutting, mechanical only | ready |
| WS-15 | *(spawned by WS-06)* — fix the top confirmed perf cause | set by WS-06's findings | not yet written |

## Ordering constraints — only two

1. **WS-01 before WS-10, WS-11, WS-12.** Those three are written against flattened surface
   defaults. Running them first means doing the spacing work twice.
2. **WS-09's contract before WS-08 finishes.** Not its code — the contract is published in
   WS-09 and WS-08 builds a client-side stub against it, so both can run in parallel.

Everything else is order-free.

## Shared-file boundaries

Three files are touched by more than one workstream. These are the *only* permitted
overlaps:

| File | Who | Rule |
|---|---|---|
| `src/app/AppShell.tsx` | WS-01 | **Only** the nav active-link colour branch (~L916-941) |
| `src/app/AppShell.tsx` | WS-05, WS-13 | **Append-only** to the warmup asset manifest |
| `src/features/hero/SuperHeroSequence.tsx` | WS-03 owns it | WS-01 hands it the `#FFC72C` literal at L957 rather than editing it |
| diagram components | WS-07 owns them | WS-14 must not touch their lint errors |

## Things that will mislead an executor

Recorded here because each one has already caused, or nearly caused, a wrong fix:

- **A passing test suite is not a healthy baseline.** `tests/a11y-contrast.test.ts:216`
  asserts a *failing* contrast ratio stays failing — its own comment says
  "NOT a guard — a record." Fixing the accent correctly **breaks a green test**. See WS-01.
- **Lint has never been green.** 30 errors / 12 warnings predate all of this work
  (`docs/perf-baseline.md`). See WS-14.
- **The blog year nav was never "there."** Nothing to restore; it is a new build. See WS-08.
- **The hero wall is not naive.** `DriftWall` already pauses its rAF offscreen, and the
  headline's `mixBlendMode: "difference"` imposes a hard backdrop-luminance budget. See WS-03.
- **The preloader progress is real,** not a fake tween. See WS-13.

## Decisions resolved in session

- **D-07 (WS-02):** past the fold a visitor must believe **"they build the systems I
  need."** Capability leads; heritage is demoted. **`MarketPosition` is the only section
  cut.** Note the scope honesty section inside WS-02 — one deletion out of eight means the
  work is re-sequencing and narration, not demolition.
- **D-08 (WS-04):** the closing is **semi-factual** — real, named tech stacks as nodes
  (reusing `PoweredBySection`'s curated list), **no system counts and no client names**.
  Adding a number later is a new decision, not an implementation detail.
- **WS-13:** honest length first — load real assets into `useWarmupSignals` so the intro is
  genuinely longer, and buffer only the remainder.

## Cross-workstream handoffs

Three places where one file's decision lands in another file's code:

| From | To | What |
|---|---|---|
| WS-01 | WS-03 | the `#FFC72C` literal at `SuperHeroSequence.tsx:957` |
| WS-02 | WS-03 | capability-led hero copy (WS-03 owns the file) |
| WS-03 | WS-05 | the 29 freed photo tiles from `heroWallTiles.ts` |
| WS-05 | WS-13 | the `## Warm assets` list for the warmup manifest |
| WS-06 | WS-15 | the top confirmed perf cause becomes a new file |
