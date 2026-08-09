# Stage 6 — Artifact model, sprite atlas, and the first two kinds

**Tier:** Sonnet · **Kinds shipped:** 2 of 8
**Read first:** `docs/hero-upgrade/README.md`, `docs/hero-upgrade/stage-0-baseline.md`

---

## Goal

This is the heart of the whole upgrade. Sixteen anonymous extruded cubes currently tell a
visitor nothing about what Phitopolis does. Eight of them become **recognizable artifacts
of the four services we actually sell**.

Stage 6 builds the **model, the atlas, and exactly two kinds** — a DevOps terminal and an
AWS server rack, both in the Ops quadrant. Two, not eight, because that gives us one
coherent corner to look at and measure before committing to the pattern six more times.
Stage 7 does the rest.

**Done means:** the bottom-right of the scene reads as *ops infrastructure* rather than
abstract blocks, at no meaningful frame cost, with every existing test green and untouched.

---

## The constraint that dictates the whole model

`tests/motion/hero-scene.test.ts` pins `CUBE_POSITIONS` to 16 entries with an exact height
array. **Do not touch it. Derive from it.**

Which leads to the governing invariant, and it is the single most important sentence in
this handover:

> **An artifact is a *decoration of a cube's envelope*, never a replacement.**
> Same `c`, `r`, `h`, `type`. Same one-cell footprint. Same contact-shadow radius. Same
> depth key. It only changes what is painted **inside and on top of** that envelope.

That is what lets every existing parity test pass with zero edits, and what keeps the
painter's-algorithm sort correct without special cases.

---

## Files in scope

| Path | Mode |
|---|---|
| `src/features/hero/heroScene.ts` | **additive only** — types, data, `buildArtifacts`, labels |
| `src/features/hero/heroArtifacts.ts` | **create** — the painter table |
| `src/features/hero/heroCanvasRenderer.ts` | **modify** — atlas, dispatch, export 5 private helpers |
| `tests/motion/hero-artifacts.test.ts` | **create** |

Do not touch `heroPhases.ts`, `heroVars.ts`, `heroPointer.ts`, `HeroCanvas.tsx`,
`SuperHeroSequence.tsx`, `R3FHeroCanvas.tsx`, `PlaygroundScene.tsx`, `palette.ts`, or any
existing test file.

---

## 1. The model — `heroScene.ts`, additive

Follow the existing `buildSignalLoops()` pattern: a pure module-init derivation, no DOM, no
side effects.

```ts
export type ArtifactKind =
  | "cube" | "cloudRack" | "terminal" | "barChart"
  | "braceSlab" | "gitGraph" | "candles" | "orderbook" | "pipeline";

export type ArtifactPayload =
  | { readonly kind: "cube" }
  | { readonly kind: "terminal"; readonly cols: number; readonly rows: number }
  | { readonly kind: "cloudRack"; readonly units: number }
  /* …one variant per kind; stage 7 fills the remaining six… */;

export interface ArtifactSpec {
  readonly cube: CubeSpec;              // byte-identical to CUBE_POSITIONS[i]
  readonly payload: ArtifactPayload;
  readonly serviceSlug: string | null;  // matches the slugs in src/routes/services.tsx
}

export const ARTIFACT_PAYLOADS: readonly ArtifactPayload[] = [/* 16, index-aligned */];
export const ARTIFACTS: readonly ArtifactSpec[] = buildArtifacts();
export const ARTIFACT_LABELS = { /* … */ } satisfies Record<ArtifactKind, string>;
```

Declare all nine kinds now — stage 7 only fills in payloads and painters, it should not
have to widen the type. Use `satisfies` on the label map so a missing kind is a **compile**
error, not a runtime hole.

### The full assignment (stage 6 implements only rows 11 and 15)

| idx | cell | h | artifact | service |
|---|---|---|---|---|
| 0–7 | outer perimeter | 32–70 | **stays a plain cube** | — |
| 8 | (1,6) | 32 | `candles` | Quantitative Research |
| 12 | (6,1) | 36 | `orderbook` | Quantitative Research |
| 9 | (20,6) | 46 | `braceSlab` | Full-Stack Development |
| 13 | (16,1) | 58 | `gitGraph` | Full-Stack Development |
| 10 | (1,16) | 52 | `barChart` | Data Science |
| 14 | (6,20) | 46 | `pipeline` | Data Science |
| **11** | **(20,16)** | **40** | **`terminal`** | **Ops Support** ← this stage |
| **15** | **(16,20)** | **52** | **`cloudRack`** | **Ops Support** ← this stage |

Four reasons this exact split, all of which you can check:

1. **Silhouette.** The outer ring carries the tallest masses and defines the plane's
   outline; detailing those fights the frame. The mid ring is already the content ring.
2. **The P stays legible.** `drawLogo` puts the mark at plane centre, roughly cells
   6.5–15.5. Every artifact sits at c or r ∈ {1, 6, 16, 20}, outside that box at every
   breakpoint. Critically, idx 6 at (11,0) — the tallest cube, directly behind the mark in
   depth — **stays plain**.
3. **Signal routing, for free.** The steel "mid-perimeter highway" loop already runs
   `midTL(1.5,1.5) → midTR(20.5,1.5) → midBR → midBL` — exactly the ring the artifacts sit
   on. Pulses will now visibly travel *between the service objects* with **no waypoint
   change**. The gold inner quad through the four `SERVICE_NODES` is untouched, so the P
   stays framed as it is.
4. **Two artifacts per service, adjacent to that service's node.** The nodes are
   activity@(5,5)=quant, code@(17,5)=SWE, package@(5,17)=data, shield@(17,17)=ops. Each
   pair is the two mid-ring cells nearest its node, so an artifact reads as an annotation
   of the node rather than free-floating decoration.

Source `ARTIFACT_LABELS` copy from the four service titles in `src/routes/services.tsx` /
`src/shared/content.ts` so it stays single-sourced. Stage 8 renders them.

---

## 2. The two kinds

Both build **only** from primitives that already exist — `gradientQuad`,
`traceRoundedPlaneRect`, `tracePoly`, `shade`, `blitShadow` — plus one generalization of
`drawImageOnPlane` taking a source sub-rect (call it `drawSpriteOnPlane`). **No new math.**

**`terminal`** (idx 11) — a *standing quad* on the cube top: four points sharing an (x,y)
edge, z from `hz` to `hz + 26`. `gradientQuad` already handles vertical quads. Fill
`shade(RGB_STEEL, -0.62)`. Chrome: three dots from the atlas. Content: three pre-rasterized
text rows plus a 2 px caret blinking at ~530 ms, and one scanline — a translucent
horizontal bar whose z scrolls `hz → hz + 26` over ~2.4 s.

**`cloudRack`** (idx 15) — three stacked rounded plane-rects at `z = h · {0.25, 0.55, 0.85}`,
each inset 3 px, separated by 2 px gaps in `shade(base, -0.5)`. A six-dot LED strip on the
+y wall. A cloud-outline decal from the atlas on the top face.

**Token rule: add zero new RGB triplets.** Everything derives from the existing
`RGB_GOLD` / `RGB_STEEL` / `RGB_FROST` / `RGB_SHADOW` via `shade()` (README rule 4). Note
the repo already has a `no-restricted-syntax` lint rule — check what it covers before
adding another.

**Visual restraint:** gold should be ≤ 15 % of each artifact's area. These sit near the P
mark and must not out-compete it. If a kind reads as louder than the logo, tone it down.

---

## 3. Flatten parity — the rule that must not be forgotten

Put this in `heroArtifacts.ts` and route **every** height through it:

```ts
/** The only way an artifact is allowed to compute a height. */
export function artifactZ(base: number, local: number, flatten: number): number {
  return base + local * (1 - flatten);
}
```

1. Ground shadow: `blitShadow(..., state.sideOpacity * 0.9)` — identical to `collectCube`.
2. Envelope walls and top: identical to `collectCube`.
3. **Standing furniture** (terminal screen, rack tiers): z via `artifactZ`, alpha
   `state.sideOpacity * αlocal`.
4. **Flat decals** on the top face: z = `hz + ε`, alpha `state.topOpacity * αlocal`.
5. **No artifact reads `elapsed` when `state.sideOpacity <= 0.01`** — freeze and skip the
   draw, mirroring the guards already in the renderer.

This is automatically correct: side opacity hits 0 at `flatten ≈ 0.556` and top opacity at
0.5, both well before `state.flat` short-circuits the loop. Rule 3 is belt-and-braces —
it drives every local z to zero at `flatten = 1`, so even a mis-gated draw collapses into
the plane rather than floating over the flat layout.

**`elapsed = 0` must be a valid resting frame** (README rule 7) — `paintStill()` passes it
under reduced motion. Every painter stays a pure function of state at `elapsed = 0`.

---

## 4. The atlas

**One offscreen atlas, built once in `createSprites`, for every glyph whose shape doesn't
change per frame. Path-draw only what is driven by time, hover, or `flatten`.**

| Atlas (blit) | Path-drawn |
|---|---|
| cloud outline, terminal chrome dots, a monospace glyph strip, rack corrugation | scanline y, caret blink, LED state, anything `flatten`-driven |

Why: path-drawing these means ~24 separate stroke setups per frame, and strokes are the
expensive part. Atlas blitting replaces them with ≤ 24 `drawImage` calls on the GPU fast
path, and roughly quarters the projection count.

`artifactAtlasSize(dpr)` mirrors `measure()`'s **DPR ceiling of 2**, clamped 512…1024.

**The null-2D-context contract (README rule 6) is the failure mode most likely to break the
suite.** `buildShadowSprite` and `buildGridSprite` both return the bare canvas when
`getContext("2d")` is null, because jsdom has no working 2D context. `buildArtifactAtlas`
must do the same, **and every consumer must tolerate a zero-sized atlas.** Write an explicit
test for this.

Also note, in TSDoc: an atlas decal is screen-space affine, so the perspective divide across
its own span is dropped — the same documented approximation `drawImageOnPlane` already
makes for the logo and grid. At ≤ 42 plane units the error is sub-pixel.

**Interaction with stage 1:** the draw loop is allocation-free, using preallocated typed
arrays sized with headroom for exactly this. Dispatch cube vs. artifact by index; **do not
reintroduce per-frame objects or closures.** If the preallocated capacity is too small, grow
the named constant — do not silently truncate.

---

## 5. Tests — `tests/motion/hero-artifacts.test.ts`

- `ARTIFACTS.length === 16`, and `ARTIFACTS[i].cube` deep-equals `CUBE_POSITIONS[i]` for
  every `i`. This is the invariant guard.
- Exactly two non-`"cube"` payloads this stage, both at index ≥ 8. (Stage 7 raises it to 8.)
- Every `ArtifactKind` has a label.
- Every artifact's footprint stays inside the plane.
- **Logo-collision guard** — no artifact's projected screen box at `flatten = 0` overlaps the
  logo box, computed with `drawLogo`'s own `baseW`/shift rule, at 375 / 768 / 1440 widths.
  This is the test that protects reason 2 above from a future edit.
- `artifactZ(base, local, 1) === base` over a table.
- The null-ctx contract: a zero-sized atlas doesn't throw for any consumer.

No pixel snapshots — the existing suite's header explains why.

---

## Acceptance gate

1. `yarn typecheck` clean.
2. `yarn test` — 196 passed / 3 failed (the same three pre-existing failures), plus yours.
   **No existing test file edited.**
3. `yarn lint` — no worse than 33 errors / 219 warnings.
4. **Frame cost.** Re-run the stage-0 harness. Reference after stage 3: interactive window
   mean 0.57 / p95 0.70 ms, whole pin mean 0.20 / p95 0.60 ms; worst-case sweep p95 0.90 ms.
   Two artifacts must not push interactive p95 past **1.5 ms**.
5. **Visual proof at 1440×900, progress 0** — a full hero shot plus a zoomed crop of cells
   (20,16) and (16,20). The terminal must read as a terminal and the rack as a rack **at
   normal viewing size**, not only in the crop. If they don't, say so — that is the finding.
6. **The P still wins.** Compare against a stage-4 screenshot: the mark must remain the
   focal point.
7. **Flatten parity** — screenshots at progress 0.10 / 0.20 / 0.30 showing artifacts
   collapsing in lockstep with the plain cubes, with nothing floating or lingering.
8. `git diff --stat` shows only the four files in scope.

---

## Stop conditions

- `CUBE_POSITIONS` needs editing → stop. The model is wrong, not the data.
- An existing test needs editing to pass → stop. Behavior changed.
- An artifact floats above the flat layout at `flatten = 1` → the `artifactZ` rule was
  bypassed somewhere. Fix that, don't special-case the symptom.
- Interactive p95 exceeds 1.5 ms with only two kinds → stop and report; six more are coming
  and the budget won't hold.
- You want a color outside the four existing triplets → stop and report what and why.
- Any file outside scope needs to change → stop and report.

Report back with: files changed, the visual proof shots and crops, the frame-cost table,
the flatten-parity shots, gate output pasted, the atlas size and glyph inventory, and your
honest read on whether these two objects are legible enough at real viewing size to justify
building six more — that judgment is the actual output of this stage.
