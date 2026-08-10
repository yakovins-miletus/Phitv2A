# Checkpoint 1 — hero revert + 3D playground gallery

Date: 2026-08-10 · Stopped deliberately at a token budget, not at a natural seam.
Plan: `~/.claude/plans/let-s-revamp-and-overhaul-staged-candy.md`
Baseline: `docs/hero-upgrade/revamp-baseline.md`

## ⚠️ The tree does not typecheck right now

`src/features/hero/playground/variants.ts` lazy-imports `./scenes/MonolithScene`,
`./scenes/LatticeScene`, `./scenes/SwarmScene`, `./scenes/DepthScene`. **None of those four
files exist** — the agent writing them was stopped before it got there. `tsc -b` covers all of
`src`, so `yarn typecheck` will fail on those four unresolved imports until either the stubs
land or `variants.ts` is temporarily parked.

Nothing else is broken. `R3FHeroCanvas.tsx` and `SuperHeroSequence.tsx` are **untouched**, so
the running app is unaffected: the `3D PLAYGROUND` toggle still loads the old
`PlaygroundScene.tsx` sketch. The new `playground/` directory is orphaned, not wired in.

**Cheapest way to get back to green** if you need a clean tree before resuming: write the four
stubs (each ~40 lines, resting frame + correct props signature). That is the first item of the
resume list below anyway.

## Recorded baseline (pre-change floor)

| Check | Result |
|---|---|
| `yarn typecheck` | exit 0, clean |
| `yarn lint` | 27 errors, 210 warnings (198 of them `no-restricted-syntax`) |
| `yarn test` | 211 passed / 3 failed, 21 files |

The three failures are **pre-existing** and individually named, so "no new failures" is
measurable rather than a vibe:

- `tests/home-reduced-motion.test.tsx` → *reduced motion: every pitch section is reachable, not just the first* — cannot find heading "Elite Technical Talent"
- `tests/home-route.test.tsx` → *home route loads via the router: hero, services, new visual sections* — cannot find heading "Technical Talent"
- `tests/motion/ground-stops.test.ts` → *home page stops use lightmode grounds* — blog (#0A2A66): expected 39.53 to be > 200

## Done · W1 — default hero: void plane, dots, flat 3D P ✅

Complete and reviewed.

```
M  src/features/hero/HeroCanvas.tsx        +10/-10  (import swap only)
M  src/features/hero/heroLogoMask.ts       +34      (additive accessors)
D  src/features/hero/heroCityRenderer.ts   -666
?? src/features/hero/heroPlaneRenderer.ts  +613     (new)
```

What it does:

- **`drawPlaneFrame(ctx, state, w, h, elapsed, interaction?)`** replaces `drawCityFrame`, same
  contract, so `HeroCanvas.tsx` changed by one import and two call sites and nothing else.
- **Streets** ported unchanged — the perspective cue that keeps a dot field reading as a plane.
- **Sparse dot field**: stride 2 → 484 dots (was 1,936), radius 1.0 plane px at rest (below the
  city's 1.4 floor), alpha 0.11 in `RGB_FROST`, cursor lift 16 plane px (the city's storey was
  27). Deliberately quieter — these dots do texture work, not skyline work.
- **The flat 3D P is back**, recovered from `git show a9850f3:src/features/hero/heroCanvasRenderer.ts`
  (`drawImageOnPlane`, `drawLogo`, `buildShadowSprite`, `blitShadow`), and **`cx`/`cy` are driven
  off `state.moveLeft` again** (`heroPlaneRenderer.ts:511-512`). That is the line that resurrects
  the "P → P PHITOPOLIS" move — `heroPhases.moveLeftProgress()` has a consumer for the first time
  since the halftone rewrite.
- **One deliberate improvement over the legacy code:** the old extrusion set
  `ctx.filter = "brightness(...)"` per blit per frame. The darkened layer stack is now baked once
  into offscreen canvases at load (`ensureLogoLayers`); `ctx.filter` appears only there.
- Zero allocation in the frame path: module-scope typed arrays, `latticeIndexRect` bounding the
  cursor pass in O(1), counting-sort batching down to 6 `fillStyle` changes for the whole field.
- Reuses `cursorFalloff` / `skylineStretch` / `rippleCrest` / `easeToward` / `interactStrength`
  from `heroPointer.ts` rather than re-deriving them, so the existing unit tests still cover the
  interaction math.

Judgment calls accepted: no cast shadow for the dot field itself (only the P casts); `RGB_FROST`
for the dots; `ctx.shadowBlur = 10` kept on the ported `AT` text (legacy parity, a canvas shadow
not a CSS blur layer, so standing rule 5 holds).

**Not yet verified.** No typecheck, no lint, no test, no visual check has been run against it.
Everything above is code review, not measurement.

## Partial · W2 — playground shell 🟡

Five of ~12 files written before the stop.

| File | Lines | State |
|---|---|---|
| `playground/types.ts` | 64 | ✅ done — the scene contract |
| `playground/constants.ts` | 126 | ✅ done — the shared spatial system |
| `playground/variants.ts` | 71 | ✅ done — registry of all four |
| `playground/usePointerPlane.ts` | 212 | ✅ done |
| `playground/useLogoPoints.ts` | 119 | ✅ done |
| `playground/PlaygroundCanvas.tsx` | — | ❌ **stopped mid-write** |
| `playground/PlaygroundTabs.tsx` | — | ❌ not started |
| `playground/scenes/*.tsx` ×4 | — | ❌ not started (breaks typecheck) |
| `R3FHeroCanvas.tsx` rewrite | — | ❌ not started |
| `SuperHeroSequence.tsx` wiring + theme flip | — | ❌ not started |
| delete `PlaygroundScene.tsx` | — | ❌ not started |
| `README.md` standing-rule-1 amendment | — | ❌ not started |

### The contract wave 2 codes against — locked, do not drift

`playground/types.ts`:

```ts
export interface PointerPlane {
  x: number; z: number;        // ground-plane coords, world units, lerped
  nx: number; ny: number;      // normalised -1..1 screen position, lerped
  velocity: number;            // 0..1 smoothed pointer speed
  active: boolean;             // pointer is over the canvas
  clickAge: number;            // ms since last click, or -1
  clickX: number; clickZ: number;
}

export interface SceneProps {
  progressRef: RefObject<number>;      // pin progress 0..1, read per-frame, never renders
  pointerRef: RefObject<PointerPlane>; // mutated in place, never reallocated
  settleRef: RefObject<number>;        // 0 → 1 over ENTRANCE_MS on tab activation
  reduced: boolean;                    // paint a designed resting frame, start no loop
  lowPower: boolean;                   // cheap path: fewer instances, cheaper material
}

export type SceneComponent = (props: SceneProps) => JSX.Element;
```

`playground/constants.ts` exports: `GROUND_Y = 0`, `WORLD_EXTENT = 6`,
`GROUND_SIZE = WORLD_EXTENT * 2`, `CAMERA`, `FOG`, `ENTRANCE_MS = 600`, `PALETTE`,
`AMBIENT_INTENSITY = 0.32`, `ROOM_LIGHT_INTENSITY = 0.55`, `ROOM_LIGHT_POSITION = [-5, 8, 6]`.

`playground/variants.ts` exports: `PlaygroundVariantId = "monolith" | "lattice" | "swarm" | "depth"`,
`PlaygroundVariant { id, label, tagline, antialias?, load }`, `VARIANTS`,
`DEFAULT_VARIANT_ID = "monolith"`, `getVariant(id)`. Only Monolith sets `antialias: true`, with the
reasoning written in place.

`useLogoPoints(): { positions: Float32Array; count: number }` — reads
`getLogoRaster()` from `heroLogoMask.ts` (W1 shipped that accessor). Returns empty on `null`;
that is a valid state, not an error.

## Resume order

1. **Finish W2** — send the same agent (or a fresh Sonnet with the original handover) at
   `PlaygroundCanvas.tsx`, `PlaygroundTabs.tsx`, the four scene stubs, the `R3FHeroCanvas`
   rewrite, the `SuperHeroSequence` wiring + `data-playground` theme flip, deleting
   `PlaygroundScene.tsx`, and the README amendment. Stubs first — they unblock typecheck.
2. **Gate 1** (orchestrator, not delegated): `yarn typecheck` clean; `yarn lint` and `yarn test`
   at or under the floor above with only the three named failures; then dev server on 5180 and
   confirm visually that the P moves left and `PHITOPOLIS` lands beside it at ~0.25 / ~0.45 pin
   progress.
3. **Wave 2, four Sonnet agents in parallel**, one scene file each, all handed the locked
   contract verbatim: Monolith, Lattice, Swarm, Depth. Briefs are in the plan file.
4. **W4** verification sweep (Haiku): screenshot matrix, 375/1440, reduced motion, keyboard,
   console + network, WebGL context-leak check across four tab switches.
5. Closing gate: zero React renders from scroll, `--hp-*` still the only per-frame writes.

## Orchestration rules that made this work — keep them

- **Exclusive file ownership per agent.** W1 and W2 ran fully in parallel with zero collisions
  because their file sets were disjoint and stated in the handover.
- **No agent runs `yarn build` / `typecheck` / `test`.** Concurrent agents race on the TS build
  info file. The orchestrator gates centrally between waves.
- **An unrun check counts as failed, never as neutral.** Everything in W1 above is reviewed, not
  measured; it does not count as done until gate 1 passes.

## Not committed

The working tree is left dirty on `main` on purpose — nothing has been staged or committed, so
nothing half-finished is in history. `git status` at checkpoint:

```
M  src/features/hero/HeroCanvas.tsx
M  src/features/hero/heroLogoMask.ts
D  src/features/hero/heroCityRenderer.ts
?? docs/hero-upgrade/revamp-baseline.md
?? docs/hero-upgrade/checkpoint-1.md
?? src/features/hero/heroPlaneRenderer.ts
?? src/features/hero/playground/
```
