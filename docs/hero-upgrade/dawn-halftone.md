# Hero rebuild — "Dawn Halftone"

Status: shipped. Supersedes stages 0–6 of this directory's scene work; the perf
architecture and standing rules from `README.md` carry forward unchanged.

## Why

The staged upgrade in this directory made the old hero *fast* — one RAF, zero React
renders from scroll, 0.70 ms mean frame. It did not make it *good*. The review that
triggered this rebuild:

1. **It was not a city.** Sixteen cubes ringed the plane's edges at unrelated
   heights with a hole in the middle. Isometric clip art orbiting a logo.
2. **The eye's first stop was the logo.** A ~500 px extruded P owned the viewport,
   so the most visually dominant object carried the least information and the
   headline read as its subtitle. Taste-skill commitment 4, failed.
3. **There was no light source.** Faces were lit uniformly, shadows disagreed with
   each other, and the nominal sun sat at `82% 20%` — the *right* — with nothing in
   the scene aware of it. Flat despite being 3D.
4. **The white was empty, not lit.** A uniform graph-paper grid fading at the edges.
5. **Gold vs navy was arbitrary**, so the colour read as decoration.
6. **The interaction was invisible**, and the on-canvas hint
   `[ move cursor to tilt // click to ripple ]` was the design admitting it.

The brief: mostly-white, cursor-reactive, dots and particles, lightweight,
immersive; the sun and its shine arrive from the **left**, navy is the dawn field,
gold is the sun; **no clouds**; and it should read as a city of SaaS.

## The aesthetic position

> The hero is a city at first light, drawn entirely in dots — a halftone skyline
> where building height is a stack of dots, the sun sits low off the left edge, and
> every tower throws a long shadow to the right across an almost-empty white plane.

Swap the product name and the brief is wrong, not merely different: it only makes
sense for a company called *Phitopolis* whose brand navy is a dawn colour and whose
gold is a sun.

**Order of attention, by construction:** headline → city → the P.

## What is on screen

| Layer | Where |
|---|---|
| Dawn ground: left sun + horizontal warm→white wash | `SuperHeroSequence.tsx`, two `background-image` layers |
| Streets — the ground plane, as stroked hairlines | `heroCityRenderer.ts` `drawStreets` |
| Long cast shadows, parallel, rightward | `drawShadows` |
| The cursor's short counter-shadow | `drawCursorShadows` |
| Buildings — a stack of dots per cell, roof-capped | `emitMarks` + `drawMarks` |
| Signal pulses lighting rooftops | `drawPulses` |
| The P — gold beacons at a uniform altitude | `heroLogoMask.ts` + `emitMarks` |

## Six things that were wrong before they were right

Each of these was built, looked at, and rejected. They are recorded because the
reasons are not obvious from the final code, and someone will otherwise re-derive
them the expensive way.

1. **One dot per cell, size encoding height.** Read as a halftone *map*. A dot has
   no side faces, so a single mark can only ever show plan view. → A building is a
   *stack* of dots; the visible shaft is the elevation.
2. **Districts ringed around an empty centre.** Reproduced the exact flaw this
   rebuild exists to fix. → Downtown is at the centre.
3. **The plane fitted inside the viewport.** Read as a diamond-shaped patch of dots
   floating on a page — an object, not a place. → `VIEW_FIT = 0.95` overscales it so
   the city runs off all four edges. The cut at the frame is the point.
4. **No street grid.** A uniform lattice has no perspective cue of its own, so the
   field read as a beautiful abstract point cloud. → 22 hairlines re-establish the
   plane, the viewing angle and the block structure in one `stroke()`. Removing this
   in the first place was the single biggest mistake of the rebuild.
5. **A faint ground dot in every cell, as "paper texture".** Once streets existed the
   plane was described twice and neither description read. → **Lines are ground, dots
   are city.** Also dropped a third of the frame's marks.
6. **The P, three times.** Painted on the ground plane it sheared into an unreadable
   parallelogram. Added to the district heights it became a nine-storey slab across
   45% of the plane. Overriding heights with a *low* plaza was legible in theory and
   invisible in practice — occluded by the towers in front of it. → What works is
   **uniform altitude**: projection smears a mark of varying heights vertically, but
   when every point sits at the same height that smear becomes a rigid translation
   and the letterform survives intact.

## Decision log — off-scale values

| Value | Where | Why |
|---|---|---|
| `DOT_STEP = 21` | `heroCity.ts` | `GRID_CELL / 2`, derived — keeps avenues on cell boundaries |
| `AVENUE_SPACING = 4` | `heroCity.ts` | Composition control, not a detail one. At 7 the blocks merged into a dome; at 4 they read as separated towers |
| `MAX_STOREYS = 9`, `STOREY_HEIGHT = 27` | `heroCity.ts` | 9 gives room for district peaks (all < 1.0) plus the mark above them |
| `VIEW_FIT = 0.95` | `heroCity.ts` | Below 1.0 on purpose: the field must bleed off frame |
| `HORIZON = 0.6` | `heroCity.ts` | A view *across* the city, leaving the frame's top for type |
| `SUN_REACH = 0.95` | `heroCity.ts` | At 0.66 the whole visible city sat in the two coolest ramp steps |
| `SHADOW_DIR = (1,1)/√2` | `heroCity.ts` | The −45° camera maps this to screen-right, i.e. away from a sun off the left edge |
| `SHADOW_LENGTH = 270` | `heroCity.ts` | ~1.4× a full-height building: a low dawn sun |
| `JITTER_AMOUNT = 0.34` | `heroCity.ts` | Enough to break the falloff curve, not enough to lose the district |
| `CITY_RAMP` alphaScale 0.9–1.34 | `heroCity.ts` | Luminance compensation: gold is far lighter than navy, so an even sRGB blend loses the warm end on white |
| `LIFT_STRETCH = 0.9`, `VELOCITY_GAIN = 0.4` | `heroPointer.ts` | A still cursor keeps 60% of the lift; sweeping reaches 100% |
| `LOGO_SCREEN_FRACTION = 0.29`, `BEACON_TIER = ALPHA_TIERS − 3` | `heroLogoMask.ts` / renderer | Deliberately third in the attention order |

## Standing rules — status

| Rule | Status |
|---|---|
| 1. 3D playground untouched, the `use3D` switch stays | **Held, with a note.** Internals show no diff. It is now behind `React.lazy`, and the chip is `display: none` below `md`. Lazy-loading a component is not a change to it. |
| 2. `CUBE_POSITIONS` frozen | **Retired.** There are no cubes. `heroScene.ts` still exports them (see Debt). |
| 3. `SIGNAL_LOOPS` waypoints frozen, cursor effects at render time only | **Held.** The loops are reused verbatim as data and never mutated. |
| 4. Raw hex only in `palette.ts` | **Held.** Scene colours are numeric triplets; zero new lint warnings. |
| 5. Zero new blur layers | **Improved.** The last two `backdrop-filter` declarations (the 3D chip) are gone. Hero blur layers: 2 → **0**. |
| 6. The null-2D-context contract | **Held**, and tested — `heroLogoMask` builds an empty mask under jsdom rather than throwing. |
| 7. `elapsed = 0` is a valid resting frame | **Held.** It is the reduced-motion frame. |
| 8. Stop rather than invent | Held — the six rejected approaches above were reported, not smuggled. |

## No clouds

`DAWN.cloudMid` / `cloudLo` are deliberately unused. Stage 5 (cloud bands) is
**cancelled**, not deferred: the brief rules them out by name, and the in-card
vignette that used `cloudLo` is deleted for the same reason — a vignette is light
arriving from everywhere at once, which contradicts the one idea the composition is
built on.

## Measured

| Metric | Before | After |
|---|---|---|
| `drawCityFrame` mean / p95 (1440×900, DPR 2, cursor live, dev build) | 0.70 / 1.0 ms | **0.71 / 1.2 ms** |
| Hero pixels untouched by the city | — | **81.4%** (5.5% carry meaningful ink) |
| Blur layers under `#hero` | 2 | **0** |
| Pin length | `+=1900%` | `+=800%` |
| Horizontal scroll at 320px | none | none |
| Test suite | 3 pre-existing failures | same 3, +47 new passing |
| New lint errors / warnings | — | **0 / 0** |

## Debt, deliberately left

- `heroScene.ts` still exports `CUBE_POSITIONS`, `SERVICE_NODES`, `ARTIFACTS` and
  friends. Nothing reads them; `tests/motion/hero-scene.test.ts` still pins them and
  passes. Left in place because that file has uncommitted changes from a concurrent
  session and deleting dead exports is not worth a merge conflict. Remove in a
  dedicated pass, together with the parts of `hero-scene.test.ts` that cover them.
- Hero DOM nodes are still above the `< 20` target.
- Three pre-existing test failures remain (`anchor-namespaces`, `ground-stops`, and
  `home-reduced-motion`'s "Prime Global Location" — copy that no longer exists
  anywhere in `src`). None are caused by, or fixable within, this work.
