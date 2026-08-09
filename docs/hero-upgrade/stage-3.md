# Stage 3 — Cursor light, hover lift, magnetic pull, grid ripple, signal bow

**Tier:** Sonnet (escalated from Haiku — see README) · **New geometry:** none
**Read first:** `docs/hero-upgrade/README.md`, `docs/hero-upgrade/stage-0-baseline.md`,
and the `heroPointer.ts` that stages 1–2 built.

---

## Goal

Build the **entire cursor interaction layer** on the scene that exists today — the 16
cubes, the 4 service nodes, the grid, the 3 signal loops. **No artifacts, no sky.** Those
come later and will inherit this layer for free.

This is deliberate sequencing: if the interaction doesn't feel good, we find out now,
against a scene we already trust, and nothing downstream was wasted.

Five effects, all fading out via `interactStrength` (stage 2), all disabled under
`isStatic`:

| | Effect | One line |
|---|---|---|
| A | **Cursor light** | A warm light follows the pointer and re-shades nearby faces |
| B | **Hover lift** | The object under the cursor rises and gains a rim |
| C | **Magnetic pull** | Nearby objects lean toward the cursor, capped inside their cell |
| D | **Grid ripple** | The grid cells under the cursor glow; a click sends a ring outward |
| E | **Signal bow** | Pulses travelling the loops bend toward the cursor and snap back |

**Done means:** moving the cursor over the hero makes the scene feel lit and reactive
rather than decorative, at no measurable frame cost, with the resting frame (progress 0,
pointer absent, reduced motion) **byte-identical to today**.

---

## Files in scope

| Path | Mode |
|---|---|
| `src/features/hero/heroPointer.ts` | **additive** — hover/magnet state helpers |
| `src/features/hero/heroCanvasRenderer.ts` | **modify** — lambert in `collectCube`/`collectNode`, rim stroke, cursor pool, grid ripple pass, signal bow |
| `src/features/hero/HeroCanvas.tsx` | **modify** — hover state, cursor plane position, wire the interaction object |
| `tests/motion/hero-pointer.test.ts` | **additive** |

Do not touch `heroScene.ts` (stage 1 already added `unproject2D`; **use it, don't rewrite
it**), `heroPhases.ts`, `heroVars.ts`, `SuperHeroSequence.tsx`, `R3FHeroCanvas.tsx`,
`PlaygroundScene.tsx`, or any existing test file.

---

## The interaction object

`drawHeroFrame`'s optional `playground` parameter is the existing channel. Rename it to
something honest (`interaction`) and extend it. **Every field required, the whole parameter
optional** — the repo runs `exactOptionalPropertyTypes`, under which `{ tiltX?: number }`
will not accept `undefined`, so a growing optional-field object gets painful fast. The
current parameter already has the right shape; keep it.

It carries at least: tilt, the cursor position in **plane space**, hover strengths per
object, magnetic offsets, ripple state, and a `lowDetail` boolean (see Perf below).

---

## A. Cursor light

Turn the cursor into a light source in the scene's own coordinate space.

- Use `unproject2D` (added in stage 1, in `heroScene.ts`) to convert the pointer's screen
  position to plane coordinates at `z = 0`. That is the light position.
- Per face, compute `lambert = clamp01(1 - dist(faceCentre, light) / (5 * GRID_CELL))`,
  multiplied by `interactStrength`.
- **Fold it into the `shade()` arguments that are already being computed** — e.g. the left
  wall goes from `shade(base, 0.12)` to `shade(base, 0.12 + 0.22 * lambert)`, the top face
  similarly. **Zero new draw calls.** You are perturbing gradient stops that already exist,
  not adding a pass.
- Plus **one** screen-space pool: a single radial gradient at the cursor,
  `globalCompositeOperation = "lighter"`, alpha ≤ 0.10, drawn **after** the object loop and
  **before `drawLogo`** so it never washes out the P mark. Restore the composite op.

**Critical interaction with stage 1:** `shade()` is now memoized on a quantised blend
factor. A continuous lambert term will blow past the memo unless it is quantised too.
Quantise `lambert` on the way in, at whatever granularity stage 1's memo uses, and confirm
the cache stays bounded (report the entry count). This is the single most likely
performance mistake in this stage.

Because `lambert` is multiplied by `interactStrength`, which is 0 when static, the resting
frame is unchanged by construction. Verify it, don't assume it.

## B. Hover lift

- Pointer within `HOVER_RADIUS` (70 screen px) of an anchor, using stage 1's
  `findNearestAnchor` against the per-frame anchor buffer.
- Ease a per-object `hoverStrength` with the same `0.12` lerp the tilt uses — so hover
  *arrives and leaves* smoothly rather than toggling.
- Drives three things: **(a)** roughly `+10` z, pushed through the **existing bounce
  offset channel** — no renderer API change needed; **(b)** a lightening of the top face,
  `shade(base, +0.18 * strength)`; **(c)** a gold rim stroke that reuses the path
  `gradientQuad` has already traced, rather than re-tracing it.

## C. Magnetic pull

- Within ~120 screen px, objects lean toward the cursor.
- Displacement is computed in plane space via `unproject2D`, and **hard-capped at
  `0.35 * GRID_CELL`**. Three reasons, all load-bearing: objects never leave their grid
  cell, the contact shadow stays under them, and no two anchors can cross.
- Add `offsetX`/`offsetY` channels symmetric with the bounce channel.
- **Sort on the un-offset anchor depth.** If you sort on the displaced position, objects
  will pop past each other in the painter's order as they lean. This is the bug this stage
  is most likely to ship.

## D. Grid ripple

`drawGrid` currently draws 78 lines in **one** `beginPath` and then applies a
`destination-in` mask. **Preserve that** — the expensive mistake here is per-cell strokes.

- **Hover:** one extra pass after the grid — the cursor's cell plus its 8 neighbours,
  filled with a gold at `0.10 * falloff * interactStrength`. Nine fills, traced with
  `traceRoundedPlaneRect`.
- **Click:** a **single expanding ring** — one rounded rect at radius `r(t)`, stroked with
  alpha decaying over ~700 ms. One path, not N cells. Drive it from `elapsed`, not a timer.

## E. Signal bow

**Do not mutate `SIGNAL_LOOPS`.** Its `segLens`/`totalL` are precomputed and pinned by
`tests/motion/hero-scene.test.ts` (README rule 3).

Displace at *render* time only: in `drawSignals`, after `pointAtLoopDistance` returns a
point, pull it toward the light —
`bulge = 0.28 * smoothstep(dist) * interactStrength`, applied when the cursor is within
about `3 * GRID_CELL` of the segment. The pulse bows toward the cursor and snaps back as it
passes. Arc-length parameterisation, pulse timing, and the existing node-glow proximity
math must all be untouched. Cost is a couple of flops per sample — negligible.

---

## Perf

Baseline to beat (from `stage-0-baseline.md`, as improved by stages 1–2): interactive
window **mean 0.57 ms / p95 0.70 ms**, whole pin **mean 0.20 ms / p95 0.60 ms**.

Budget for this stage: **p95 must stay under 1.5 ms in the interactive window.** There is
real headroom against the 16.7 ms frame — the constraint is allocation and p95, not mean.

- **No allocation in the frame path.** Stage 1 made the draw loop allocation-free; keep it
  that way. Preallocate hover/offset arrays at module or effect scope.
- Quantise `lambert` (see A) so the `shade()` memo keeps working.
- **Mid-tier degradation:** `useDeviceTier` already exists in `src/shared/motion/`. On
  mid tier, set `lowDetail` and skip the cursor pool, the grid ripple, and the rim stroke —
  keep lambert and hover lift, which are free. One boolean, checked once.
- The `isStatic` path (reduced motion / low power) paints one frame with `elapsed = 0` and
  no interaction object at all. Nothing here may change that.

---

## Tests

`tests/motion/hero-pointer.test.ts`, additive and pure:

- Lambert falloff: 1 at the light position, 0 at and beyond `5 * GRID_CELL`, monotonically
  decreasing between, never negative or `NaN`.
- Lambert quantisation produces a **bounded** set of distinct values (assert an upper
  bound) — this is the memo-safety property.
- Magnetic displacement magnitude never exceeds `0.35 * GRID_CELL`, for a swept set of
  cursor positions including far-away and exactly-coincident ones.
- Hover strength easing is monotone toward its target and converges (no oscillation).
- The signal-bow displacement is **zero** when `interactStrength` is 0, and when the cursor
  is beyond the influence radius.
- `SIGNAL_LOOPS` is not mutated: snapshot `segLens`/`totalL` before and after a simulated
  frame and assert deep equality.

No pixel snapshots.

---

## Acceptance gate

1. `yarn typecheck` clean.
2. `yarn test` — 171 passed / 3 failed (the same three pre-existing failures), plus yours.
   **No existing test file edited.**
3. `yarn lint` — no worse than 33 errors / 219 warnings.
4. **Resting frame byte-identical.** Use the `getImageData` checksum method under
   `reducedMotion: reduce` at progress 0 that stages 1–2 used. Must match exactly.
5. **Frame cost** — re-run the stage-0 harness. Report interactive-window and whole-pin
   mean/p95 next to the numbers above. p95 over 1.5 ms in the interactive window is a stop
   condition.
6. **Visual proof, and this is the real deliverable of the stage.** At 1440×900, capture
   the hero at progress 0 with the pointer parked at three distinct positions (near a
   corner cube, over a service node, at plane centre) and with no pointer. Four images.
   They must be visibly, obviously different — if you can't tell them apart, the effects
   are too subtle and that is a finding to report, not to hide.
7. **Depth-sort sanity**: with magnetic pull at maximum, no object pops in front of one it
   was behind. Demonstrate it — sweep the cursor across the scene and confirm no z-order
   flicker.
8. `git diff --stat` shows only the four files in scope.

---

## Stop conditions

- The resting-frame checksum moves → stop. Interaction must be inert at rest.
- Interactive-window p95 exceeds 1.5 ms → stop and report which effect costs the most.
- The `shade()` memo grows unbounded → stop; that means lambert isn't quantised.
- Sorting on displaced depth causes z-order popping and you can't fix it inside the cap →
  stop and report rather than raising the cap.
- Any file outside scope needs to change → stop and report.

Report back with: files changed, the four proof images, the frame-cost table, the
`shade()` memo entry count, the depth-sort result, gate output pasted, and your own honest
read on whether the five effects together feel good or fight each other — you are the first
person to see them, and that judgment is worth more than the metrics.
