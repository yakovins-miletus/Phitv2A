# Stage 1 — Allocation refactor + `heroPointer.ts`

**Tier:** Sonnet · **Visual change:** none, deliberately
**Read first:** `docs/hero-upgrade/README.md`, `docs/hero-upgrade/stage-0-baseline.md`

---

## Goal

A **pure refactor that buys headroom**, before any feature spends it. Two halves:

1. **Kill the per-frame allocation** in `drawHeroFrame`. It builds a fresh `Drawable[]` —
   an object *and* a closure per drawn face, every frame, ~60 times a second — then
   `Array.sort`s it with a comparator. Stages 3–9 add eight decorated artifacts to that
   loop, so this grows unless it is fixed first.
2. **Create `src/features/hero/heroPointer.ts`**, a pure DOM-free module that will own all
   pointer math for stages 2, 3 and 8. Nothing in it changes behavior yet; stage 1 only
   moves the *existing* cascade onto it and adds the primitives, under test.

**Done means:** `git diff` shows no change in what is painted, all existing tests pass with
no edits to them, the new module's unit tests pass, and the stage-0 harness reports a frame
cost no worse than baseline (and ideally better at p95).

A screenshot at progress 0 before and after this stage must be pixel-identical. If it
isn't, something changed that shouldn't have.

---

## Files in scope

| Path | Mode |
|---|---|
| `src/features/hero/heroPointer.ts` | **create** |
| `tests/motion/hero-pointer.test.ts` | **create** |
| `src/features/hero/heroCanvasRenderer.ts` | **modify** — the sort/dispatch loop + a shade cache |
| `src/features/hero/HeroCanvas.tsx` | **modify** — anchor buffer + swap `triggerCascade` onto `RippleScheduler` |
| `src/features/hero/heroScene.ts` | **additive only** — `unproject2D` and nothing else |

**Anything outside this list is a stop condition.** In particular do not touch
`heroPhases.ts`, `heroVars.ts`, `SuperHeroSequence.tsx`, `R3FHeroCanvas.tsx`,
`PlaygroundScene.tsx`, or any existing test file.

---

## Part 1 — The draw loop

`heroCanvasRenderer.ts:304-357`. Today:

```ts
interface Drawable { depth: number; draw: () => void }
...
const items: Drawable[] = [];
for (...) collectCube(items, ctx, cam, cube, state, sprites, bounce);
for (...) collectNode(items, ctx, cam, node, state, sprites, bounce);
items.sort((a, b) => a.depth - b.depth);
for (const item of items) item.draw();
```

`collectCube` and `collectNode` each push **several** entries (contact shadow, walls, top
face, and for nodes ~14 stacked slabs), so the real count per frame is well above 20 —
count it before you start and put the number in your report.

**Replace with a preallocated, module-scope structure.** Shape it however is cleanest given
what `collect*` actually pushes, but it must satisfy:

- **Zero allocation per frame** in the collect → sort → draw path. No new objects, no new
  closures, no new arrays. Preallocate at module scope, sized with headroom for the eight
  artifacts stages 6–7 add (use a named constant, not a magic number, and grow-with-assert
  rather than silently truncating if the count is ever exceeded).
- **Insertion sort, not `Array.sort`.** n is small and the order is nearly-sorted frame to
  frame, so insertion sort is effectively O(n) and avoids the comparator dispatch. Sort an
  index array (`Int32Array`) against a parallel `Float64Array` of depths.
- **Identical paint order** for equal depths. `Array.sort` is stable in V8; your insertion
  sort must be too, or faces will z-fight differently and the screenshot will change.
- The closure body has to go somewhere. A small tagged dispatch (a kind enum + a few
  numeric params per entry, switched in the draw pass) is the intended shape — it also
  gives stages 6–7 the seam they need to dispatch cube vs. artifact. Keep the params in
  typed arrays.

**Also add the `shade()` memo.** `shade()` and the `rgba()` helpers build ~50 template
strings per frame. Stage 3 makes the blend factor *continuous* (a lambert term), which
would multiply that. Pre-empt it: quantise the blend factor to 1/32 steps and memoise on a
`Map` keyed by `(colorIndex << 8) | quantised`. Bounded at a couple hundred entries,
visually indistinguishable. **Verify the quantisation does not change the current output** —
today's call sites use a small set of fixed factors, so if 1/32 steps don't land exactly on
them, either pick a quantisation that does or special-case exact hits. The screenshot must
not move.

---

## Part 2 — `heroPointer.ts`

Pure, DOM-free, no imports from React or the renderer. Exports:

```ts
export const HOVER_RADIUS: number;          // 70 screen px
export const HIT_RADIUS: number;            // 60 screen px — today's click threshold

/** Project every hit-testable anchor into a shared preallocated buffer. */
export function writeAnchors(cam: Camera, state: HeroFrameState, out: Float32Array): number;

/** Nearest anchor within `radius`, or -1. Linear scan — see note below. */
export function findNearestAnchor(buf: Float32Array, count: number, x: number, y: number, radius: number): number;

/** Time-based replacement for the setTimeout cascade. */
export class RippleScheduler { … }
```

**`writeAnchors`** replaces the fact that `onClick` (`HeroCanvas.tsx:291-347`) currently
rebuilds a camera and re-projects all 20 anchors **on every click**. Project once per
frame into one `Float32Array` (x, y interleaved) and let hover, click, tooltip, and magnet
all read it. Anchor order must be: all `CUBE_POSITIONS` in index order, then all
`SERVICE_NODES` in index order — stages 3 and 8 depend on that mapping, so document it.

**On `findNearestAnchor`:** a linear scan over ~20 anchors is ~1 µs and beats a spatial
hash's build cost. Ship the scan. The point of the function boundary is that swapping in a
uniform screen-grid hash later is a one-function change. Do not build the hash now.

**`RippleScheduler`** replaces `triggerCascade`'s `setTimeout` storm
(`HeroCanvas.tsx:253-289`), which arms up to 20 timers per click and needs a `disposed`
race guard inside each one. Arm impulses with a delay; drain them from the frame loop
against `elapsed`. Requirements: each impulse fires **exactly once**, impulses fire in
delay order, the queue drains to empty, arming while impulses are pending does not drop or
double-fire any of them, and there are no timers and no allocation in `tick()`.

**`unproject2D` in `heroScene.ts`** — additive, next to `project()`. It inverts `project`'s
linear part at a fixed z, so stage 3 can turn a cursor position into plane coordinates:

```ts
/** Inverse of project()'s linear part at fixed z. Jacobian is
 *  [[cosZ, -sinZ], [sinZ·cosX, cosZ·cosX]] · scale · k. */
export function unproject2D(cam: Camera, k: number, dsx: number, dsy: number): Point2
```

Derive it from `project()` rather than transcribing the comment — and prove it with the
round-trip test below. Nothing calls it in stage 1; it lands here so stage 3 doesn't have
to invent math under deadline.

---

## Part 3 — Wire `HeroCanvas.tsx`

- Allocate the anchor buffer once in the effect; call `writeAnchors` **once per frame**,
  after the camera is built.
- `onClick` reads that buffer via `findNearestAnchor` instead of rebuilding a camera and
  re-projecting. **Behavior must be identical**, including the 60 px threshold and the
  cube-before-node tie-breaking the current loop happens to produce — check the current
  code's tie behavior and preserve it exactly.
- `triggerCascade` arms the `RippleScheduler`; the frame loop ticks it. Remove the
  `setTimeout`s and their `disposed`/`progress` guards (the scheduler is torn down with
  the effect, so the race is gone by construction).
- **Do not change any gate.** The `progress < 0.02` conditions stay exactly as they are —
  that is stage 2's job. Do not change the effect deps. Do not add `pointerFine`.

---

## Tests — `tests/motion/hero-pointer.test.ts`

- `unproject2D` round-trips a small delta through `project` to within 1e-6, at
  `flatten` 0, 0.5 and 1.
- `findNearestAnchor` returns -1 outside the radius, the true nearest inside it, and is
  stable and deterministic under exact ties.
- `writeAnchors` writes the documented count and ordering, and never allocates (assert on
  the returned count and on buffer contents for a known camera).
- `RippleScheduler`: each impulse fires exactly once; impulses fire in delay order; the
  queue drains to empty; re-arming mid-drain neither drops nor double-fires. **This is
  precisely the bug class the `setTimeout` cascade has today** — the tests matter more than
  the implementation.

No pixel snapshots. The existing suite's own header explains why: a snapshot "would happily
record a regression as the new truth."

---

## Acceptance gate

1. `yarn typecheck` clean.
2. `yarn test` — **149 passed / 3 failed**, where the 3 are the same pre-existing failures
   named in `stage-0-baseline.md` (reduced-motion copy drift, anchor-namespace count,
   ground-stops color). **Zero existing test files edited.** New tests additional on top.
3. `yarn lint` — no more than **33 errors / 219 warnings**. Note the repo already has a
   `no-restricted-syntax` rule; check what it covers before adding anything.
4. **Pixel-identical hero at progress 0.** Screenshot at 1440×900 before your changes and
   after; they must match. Include both in your report if they don't.
5. **Frame cost no worse than baseline** — re-run the "How to repeat this" instrumentation
   from `stage-0-baseline.md`. Baseline: interactive window mean 0.70 ms / p95 1.0 ms;
   whole pin mean 0.22 ms / p95 0.70 ms. Report your numbers next to those. p95 should
   improve; a regression on any of them is a stop condition.
6. `git diff --stat` shows only the five files listed above.

---

## Stop conditions

- The insertion sort changes paint order for equal depths → stop; do not "fix" it by
  changing z values.
- The `shade()` quantisation moves a pixel → stop and report; do not ship a visual change
  in a refactor stage.
- You need to touch a file outside the scope list → stop and report what and why.
- Any existing test needs editing to pass → stop. That means behavior changed.

Report back with: files changed, the per-frame entry count before and after, the frame-cost
comparison table, the gate results pasted as output, and any question you had to stop on.
