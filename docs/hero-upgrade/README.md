# Hero Upgrade — Dawn Environment, Service Artifacts, Live Cursor Layer

Working docs for the multi-stage upgrade of the **default** home hero
(`src/features/hero/`). Each stage has its own handover file; agents receive the
handover path and the repo path and nothing else.

## Goal

Take the default canvas hero from "flat box with abstract cubes and near-invisible
interaction" to:

1. **An above-the-clouds dawn environment** — a tokenized CSS gradient sky plus drifting
   cloud bands, so the isometric city the scene already draws reads as *Phitopolis at dawn*.
2. **Recognizable service artifacts** — eight of the sixteen abstract cubes become objects
   that say what we actually sell: a DevOps terminal, an AWS server rack, candlesticks and
   an orderbook ladder, a code-brace slab and a git graph, a bar chart and an ETL pipeline.
3. **Always-on cursor interaction** — light that follows the pointer and re-shades faces,
   hover lift, magnetic attraction, grid ripple, signal pulses that bow toward the cursor,
   and per-artifact tooltips and click activations.

## The one thing that governs every decision

This hero is a **deliberate rewrite**. `docs/perf-baseline.md` records that the previous
DOM/`preserve-3d` version injected **1,335 CSS rules per scroll pass** and dropped **32 % of
frames**. The rewrite exists to make those numbers zero. Its standing gates are:

| Gate | Target | **Measured today (stage 0)** |
|---|---|---|
| Home LCP | < 1,912 ms | **1,112 ms** ✅ — LCP element is `H4.MuiTypography-h4` ("Making Tomorrow's Technology…"), plain text |
| `drawHeroFrame` cost, interactive window (p<0.10) | — | **mean 0.70 ms / p95 1.0 ms** |
| `drawHeroFrame` cost, whole pin | — | **mean 0.22 ms / p95 0.70 ms**, max 1.2 ms |
| Frame p50 / p95 / p99 / max | — | **16.7 / 17.5 / 18.4 / 18.6 ms** |
| CSS rules injected by scroll | 0 | **+68** (was +1,335) ⚠️ sitewide, not hero-attributed |
| Blur layers under `#hero` | 0 | **2** ⚠️ — both from the 3D-toggle chip's `backdrop-filter` |
| Hero DOM nodes | < 20 | **32 before scroll / 44 after** |
| Tests | no new failures | **149 passed / 3 failed** (18 files) — all 3 pre-existing and unrelated to the hero |
| Lint | no new violations | **33 errors / 219 warnings** (207 of the warnings are `no-restricted-syntax`) |
| Build | — | `tsc -b` ~7.0 s + `vite build` ~2.4 s ≈ **9.0 s** |

Full numbers and the repeat instrumentation: **`docs/hero-upgrade/stage-0-baseline.md`**.
Re-run that file's "How to repeat this" section at the end of every stage.

**Three corrections to earlier assumptions, now that we have real numbers:**

1. **The test count is 149, not 82, and 3 already fail.** The gate is "no *new* failures",
   measured against those 3 named pre-existing ones — not "all green".
2. **The lint floor is 33 errors / 219 warnings, not 30/12.** 207 of those warnings are
   already `no-restricted-syntax`, which means the raw-hex ban this upgrade relies on
   **already exists as a rule**. Don't add a second one; check what the existing rule
   covers first.
3. **There is far more frame headroom than assumed.** At 0.70 ms mean in the interactive
   window against a 16.7 ms budget, the plan's "≤4.0 ms/frame" target is generous. The
   binding constraint is the *allocation* rate and the p95, not the mean.

Nothing in this upgrade may regress any of them. Stage 0 measured, stage 1 buys headroom,
every stage after that spends from a budget that has already been counted.

**Out of scope, tracked separately:** the `routes-*.js` chunk is now 1,057 kB (was 147 kB)
and trips Vite's size warning. Not a hero problem; not this workstream's to fix.

## Architecture, in one paragraph

The default hero is **not three.js**. It is a hand-rolled 2D `CanvasRenderingContext2D`
renderer with a custom projection that reproduces
`perspective(1600px) scale() rotateX(55°→0) rotateZ(-45°→0)` in plain arithmetic. Scene
objects are authored in **plane space** (a 22×22 grid, `GRID_CELL` 42) and pushed through
`project()`. There are no meshes, no shaders, no lights — only projected quads, rounded
rects, polylines, and sprite blits. Scroll progress arrives through an imperative ref, so
**scrolling causes zero React renders**. That property is load-bearing; preserve it.

## Standing rules for every stage

1. **The 3D playground variant is out of scope.** `PlaygroundScene.tsx` and
   `R3FHeroCanvas.tsx` internals must show no diff. The `use3D` switch stays.
2. **`CUBE_POSITIONS` is frozen.** `tests/motion/hero-scene.test.ts` pins it to 16 entries
   with an exact height array. Derive from it; never reorder or retype it.
3. **`SIGNAL_LOOPS` waypoints are frozen.** `segLens`/`totalL` are precomputed and pinned.
   Cursor effects on signals happen at *render* time, not by mutating the data.
4. **Raw hex lives only in `src/shared/theme/palette.ts`.** Scene colors derive from the
   existing `RGB_GOLD` / `RGB_STEEL` / `RGB_FROST` / `RGB_SHADOW` triplets via `shade()`.
5. **Zero new blur layers.** Blur is baked into sprites at build/load time, the way
   `buildShadowSprite` already does it. No CSS `filter: blur()`, no `backdrop-filter`.
6. **The null-2D-context contract.** `buildShadowSprite` and `buildGridSprite` both return
   the bare canvas when `getContext("2d")` is null, because jsdom has no working 2D
   context. Every new sprite builder must do the same, and every consumer must tolerate a
   zero-sized sprite. This is the failure mode most likely to break the test suite.
7. **`elapsed = 0` must be a valid resting frame.** `paintStill()` passes it under reduced
   motion and low power. Every painter stays a pure function of state at `elapsed = 0`.
8. **Stop rather than invent.** If a handover doesn't answer a design question, stop and
   report it. Do not guess.

## Stage ledger

| # | Stage | Tier | Status |
|---|---|---|---|
| 0 | Record perf baseline on the current build | Sonnet | ✅ `stage-0-baseline.md` |
| 1 | Allocation refactor + `heroPointer.ts` | Sonnet | ✅ frame p95 1.0 → 0.90 ms, paint byte-identical |
| 2 | Interaction gate rework | Sonnet | ✅ linear fade to 0 by p=0.10, touch scroll-capture bug fixed |
| 3 | Cursor light, hover lift, grid ripple, signal bow | Sonnet ⬆ | ✅ p95 0.90 ms worst-case, resting frame byte-identical |
| 4 | `DAWN` tokens, CSS sky, disc, sky choreography | Sonnet | ✅ seam asserted at 0.86, LCP unchanged, 0 new blur layers |
| 6 | Artifact model + atlas + `terminal` & `cloudRack` | Sonnet | — |
| 7 | Remaining six artifact kinds, by quadrant | Haiku | — |
| 5 | Cloud bands + scene re-tint | Sonnet ⬆ | — (moved after 7 — see below) |
| 7 | Remaining six artifact kinds, by quadrant | Haiku | — |
| 8 | Tooltips + click-activation micro-animations | Haiku | — |
| 9 | Polish pass + `drawNodeIcon` atlas conversion | Haiku | — |

Stages run **serially**. Stage 1 buys the frame budget stages 3–9 spend; the artifact
stages share the atlas stage 6 creates.

**Stage 5 moved to run after stage 7.** It was originally sequenced before the artifacts,
but that ordering was convenience, not dependency — the re-tint works on the shared base
color triplets and `shade()`, so it propagates to artifacts automatically whenever it
lands. Artifacts are the more central deliverable, so they go first. Nothing about stage 5
gets easier or harder for the wait.

**Tier changes are recorded, never silent.** Stage 3 was escalated Haiku → Sonnet (⬆): it
modifies `collectCube`'s shading math and adds render-time displacement to the signal
loops, and it defines the interaction primitives stage 8 reuses. A wrong call there is
expensive and hard to spot. Stages 5, 7, 8 and 9 stay on Haiku — by then the pattern is
established and the handovers are mechanical.

## Open design questions (raised by stages, not yet decided)

- **An invisible SEO `<h1>` swallows pointer events at plane centre.** Stage 3 found that
  the color-hidden "PHITOPOLIS" heading in `SuperHeroSequence.tsx` intercepts the pointer
  over the middle of the scene, so no interaction fires there. It needs
  `pointer-events: none` — it is decorative-for-sight, load-bearing-for-crawlers, and
  should never take input. **Assigned to stage 4**, which already opens that file.
- **Magnetic pull may be too subtle.** Stage 3 measured it reaching only ~55 % of its own
  `0.35 * GRID_CELL` cap at the closest tested point, reading as noise rather than as
  leaning. Candidate for a raised coefficient in the stage 9 polish pass — not before,
  since the artifacts land between now and then and change what "too subtle" means.
- **Plane-centre engagement is the weakest of the five effects.** No anchor is near enough
  for hover or magnet there, so only the cursor pool and grid glow carry it. Partly by
  design — the P mark owns that space and the artifacts land on the mid-ring — but re-check
  after stage 5's clouds and stage 7's artifacts fill the frame.
- **The signal bow has not been eyeballed live.** Unit-tested and structurally sound, but
  it is motion-only and did not show in a still. Verify it during stage 5's screenshot pass.
- **The on-canvas indicator hint** (`[ move cursor to tilt // click to ripple ]`). Stage 2
  reworded it and kept it, but flagged that a permanent hint may no longer earn its place
  now that interaction is default behavior rather than a discoverable mode. **Deferred to
  stage 8**, when per-artifact tooltips land — a standing hint plus tooltips is redundant,
  and that is the right moment to decide which survives.
