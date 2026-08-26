# Handoff — 2026-08-26 home-page fixes

Covers a batch of home-page and About-page work requested after
`docs/handover-2026-08-25-workstreams-closeout.md` was closed out. Two distinct
bodies of work are sitting in the tree together — read §1 before doing anything.

**Branch:** `fix/ws-01-theme-ws-10-services`
**HEAD:** `501c7b2` — "docs: handover for the three genuinely open items from this session"
**Gate:** `yarn typecheck && yarn test && yarn lint && yarn build`
Expected green state: typecheck clean, 339+ tests passing, lint **0 errors / 3
warnings** (only the deliberately out-of-scope `react-hooks/exhaustive-deps` in
`HeroCanvas.tsx:496`, `AppShell.tsx:549`, `FloatingIdOverlay.tsx:302`), build passes.

---

## 0. Read this first — nothing is committed

At the time of writing, **44 files are modified and 4 are untracked, with zero
commits made.** That is two sessions of work stacked in one dirty tree:

- **Batch A** — the three items from `handover-2026-08-25-workstreams-closeout.md`
  (WS-14 lint splits, the Preloader timer race, the closing-scene mobile layout).
- **Batch B** — the home-page fixes described in this document.

They are independent and were verified independently, but they are *not*
separated by commit. **Commit them as separate logical changes before doing
anything else**, or a future revert of one will take the other with it.

Also note the prior branch history warning that still applies — run:

```bash
git log --format="%h %ad %s" --date=format:"%Y-%m-%d %H:%M" -40 --all | sort -k2,3
```

and read anything you don't recognise before assuming the branch is only what
you added. A previous session found seven items of unaudited out-of-band work on
this exact branch.

---

## 1. Status at a glance

| # | Item | Status |
|---|---|---|
| A1 | WS-14 lint splits (5 files) | ✅ Done, gate-verified |
| A2 | Preloader post-100-beat race | ✅ Done, test-first, gate-verified |
| A3 | Closing-scene lattice mobile layout | ⚠️ Done & verified, **but see §6 — may not be wanted** |
| B1 | About certifications → 4 rows | ✅ Done, gate-verified |
| B2 | Ground tile-wipe ("grey squares") | ✅ Done, gate-verified — **not yet seen by a human** |
| B3 | Hero word columns → tech stack | ✅ Done, gate-verified — **not yet seen by a human** |
| B4 | Hero isometric: outer "application" nodes | ❌ **Not started** — full spec in §5 |

Full gate re-run after everything above landed: typecheck clean, lint 0 errors /
3 warnings, **339/339 tests passing**, build passes.

---

## 2. The valuable diagnosis: the "grey squares" are not a bug

The user reported "bugged pixel by pixel thingies" — scattered grey squares over
the home page, worst on light backgrounds, in and around the "Real World
Applications" cards and the navy "From our practices" section.

**They are a deliberate effect.** Established empirically, not by guesswork
(three wrong hypotheses were eliminated first: they are not CSS backgrounds, not
broken `<img>`s — only 3 images exist on the page and none are broken — and not
SVG shapes):

- `src/shared/components/ground/GroundLayer.tsx` paints the whole page background
  as **one fixed, full-viewport WebGL canvas at `z-index: -1`**. Sections are
  transparent and it shows through. It owns the per-section ground colour.
- At **every** section boundary it runs a **per-tile hashed wipe**, implemented in
  `src/shared/components/ground/glGround.ts`. Each tile gets a random threshold
  from `hash(tileCoord + 0.5)`; as the boundary's scroll-scrubbed progress
  advances, tiles flip from the old ground colour to the new one.
- `TILE_SIZE_CSS_PX = 64` (`glGround.ts` ~line 91) — which is exactly the 40–90px
  square size reported. Mid-boundary you are looking at a half-flipped tile field.

The code calls this "the site's tile-wipe visual language", inherited from a
retired `PixelWipe`. It is intentional, documented, and load-bearing to the
design's identity. It simply *reads* as a rendering artifact at 64px on a
near-white ground.

**Degradation ladder (don't break it):** `prefers-reduced-motion` → static ground,
no loop; low-power device → CSS crossfade; no WebGL2 / context lost → CSS
crossfade; otherwise → WebGL tile wipe. A non-tiled path therefore already
exists and is exercised.

`window.__ground` is exposed in DEV for inspection.

**Decision taken: keep the motif, tune it down.** Explicitly *not* replaced with a
crossfade. What landed:

| Constant | File | Before | After |
|---|---|---|---|
| `TILE_SIZE_CSS_PX` | `glGround.ts` | 64 | **20** |
| `DEFAULT_BAND` | `groundStops.ts` | 560 | **220** |

`TILE_SIZE_CSS_PX` 64 was inherited from the retired `PixelWipe`, which played
**once** as a route-transition overlay. Now every section boundary plays it, so a
half-flipped frame is common rather than rare — at 64px that reads as broken
blocks. 20px still reads as the same tile language, just fine enough to look like
dissolve/grain. DPR scaling (`TILE_SIZE_CSS_PX * dpr`) needed no change.

`DEFAULT_BAND` is the blend window and it lives in **`groundStops.ts`**, not
`GroundLayer.tsx` — which is why that file is in the diff. Verified: the change is
`DEFAULT_BAND` and its comment only; **no ground colours were touched**. 560px was
tuned for a CSS crossfade, where a long ramp merely means slow colour drift; for
the GL tile wipe it is the distance you *sit in* a half-flipped state. 220 resolves
the dissolve before you can linger in it. Per-boundary overrides still work — stops
that need a narrower runway declare their own `band` (see `buildGroundStops`).

No shader change was needed for a soft edge: `glGround.ts` already does
`smoothstep(threshold - band, threshold + band, uProgress)` with `band = 0.05`, so
tiles already fade rather than snap.

⚠️ **Not yet visually confirmed by a human.** `window.__ground` is exposed in DEV
with `{ renderer, color, progress, stop, act, positions }` — use it to see which
stop/progress is live while eyeballing a boundary.

### Why this closed out the "poor home page design" complaint

The user separately called out "From our practices" and "Real World Applications"
as poorly designed. When asked to characterise the problem they answered **"mostly
the grey squares"** — so `ProcessSection.tsx` and `UseCasesNarrative.tsx` need
**no redesign**. Fixing the wipe is the fix. Do not re-scope this into a redesign.

---

## 3. Decisions on record (do not re-litigate)

All four were put to the user explicitly and answered:

| Question | Decision | Rationale |
|---|---|---|
| Grey squares | **Keep tile wipe, tune it down** | Preserves the deliberate visual language; a crossfade would discard it |
| Word columns → tech stack | **Keep vertical columns** | Content swap, not an animation rewrite — preserves hero rhythm and velocity coupling |
| Hero outer nodes | **Extend the grid plane itself** | Truest to "a larger city"; rejected zooming out and rejected corner-gap placement |
| Weak home sections | **Mostly the grey squares** | No redesign of ProcessSection / UseCasesNarrative |

Earlier, for the closing-scene mobile layout (batch A): breakpoint
`theme.breakpoints.down("sm")` (<600px), and connector lines **dropped entirely**
on mobile.

---

## 4. What landed, per item

### A1 — WS-14 lint splits ✅
Five files split so no module exports both a component and a non-component value.
New files: `navbarHooks.ts`, `megaNavItems.ts`, `transitionCurtainContext.ts`.
`SmoothScroll.tsx` and `StageSection.tsx` just had dead re-export lines deleted.
~25 import sites repointed, plus 4 test files.

**Deviation worth knowing:** the plan called the new navbar file
`navbarContext.ts`, next to `NavbarContext.tsx`. macOS's **case-insensitive
filesystem** makes TS module resolution collide on names differing only by case
(`TS1149`/`TS2303`/`TS2459`, and Vitest silently resolving a hook to `undefined`).
Renamed to `navbarHooks.ts`. **Remember this constraint when adding sibling files.**

Result: lint warnings 11 → 3.

### A2 — Preloader post-100-beat race ✅
`src/shared/components/Preloader.tsx`. `completedAt100Ref` was a permanent
"completion was seen" latch, never reset; if `reduced` (or `triggerExit`, which
depends on it) changed identity inside the 200ms post-100 window, the effect
re-ran, cleanup killed the pending timer, and the re-run hit a dead branch — so
`triggerExit()` never fired again for that path. The 2600ms `BEAT_FAILSAFE_MS`
still rescued it, so the real-world symptom was a ~2.6s wait with the exit
animation skipped, never a hang.

Fix: reset the ref in the effect's cleanup, turning it into a "timer is pending"
flag so a re-run reschedules. Done **test-first** — a new test in
`tests/preloader-adversarial.test.tsx` was confirmed failing before the fix and
passing after, asserting exit well inside the failsafe window.

Note the implementing agent hit a subtlety worth remembering: the existing
"null → false" test calls `rerender(<Preloader …/>)` **without** the `<Providers>`
wrapper, which swaps the root element type and forces a full remount — resetting
the ref and masking the race. The new test wraps `rerender` in the same providers
so it is a true update.

**Flagged, not fixed:** the existing "null → false" test's
`waitFor(…, { timeout: 2500 })` has only 100ms of margin against the 2600ms
failsafe. Not flaking today; tight by design.

### A3 — Closing-scene lattice mobile layout ⚠️
`src/features/home/components/closing-scene/IsometricTechLattice.tsx`. Added a
`down("sm")` branch with a real vertical-stack composition (bands of ≤3 nodes,
64px touch-friendly nodes, mobile viewBox `364×534`), connector lines dropped,
separators and labels recomputed. New test file `tests/isometric-tech-lattice.test.tsx`.

Verified live: at 390px the SVG is `viewBox="0 0 364 534"` with 12 circles (no
data loss) and exactly 2 lines (separators only); at 768px it correctly still
renders the desktop `viewBox="0 0 900 660"` with 11 lines. **See §6.**

### B1 — About certifications → 4 rows ✅
`src/features/about/components/CertificationsSection.tsx`. Was 2 rows of 8; now
`MARQUEE_ROWS = 4` with a **round-robin** distribution
(`allBadges.filter((_, i) => i % MARQUEE_ROWS === r)`) — stays balanced if the
badge count stops dividing evenly, and mixes providers across rows instead of
clustering all 5 AWS badges into row 0. Speeds `[26, 20, 23, 17]` px/s, alternating
direction.

**The non-obvious part:** the marquee wraps at `scrollWidth / N`, where the row's
content is repeated `N` times. Halving row length (8 → 4 badges) would have
narrowed each row below the viewport and made the loop seam visible. `REPEAT_COUNT`
was introduced (4) **and the wrap divisor changed to match** — these two must
always be edited together, and there's a comment saying so. Reduced-motion static
grid untouched; all 16 badges still render.

### B3 — Hero word columns → tech stack ✅
The hero's drifting word columns now show the "powered by" technology set instead
of abstract words.

- **New shared module `src/shared/content/techStack.ts`** — `TECH_SLUGS`,
  `ROW1/2/3_TECHS` and `LOCAL_TECHS` were lifted verbatim out of
  `PoweredBySection.tsx` so the tech list has one owner, plus three new curated
  arrays `HERO_TECH_COLUMN_1/2/3` for the hero.
- `PoweredBySection.tsx` (on /about) now imports that data; **no rendering logic
  was touched** — `TechCard`, `TechMarqueeRow`, layout, category filter and colours
  are unchanged.
- `HeroWordWall.tsx` swapped its three word arrays for the hero columns.
  **The animation, layout, velocity coupling, reduced-motion handling,
  tab-visibility pause and `paused` prop are all untouched** — this is a pure
  content swap, 8 entries per column exactly as before.
- Kept the `HeroWordWall` name: "word wall" still describes the mechanism
  (drifting text columns), and renaming would have meant touching
  `SuperHeroSequence.tsx` plus the case-collision risk from A1, for no gain.

**Deliberately text-forward — zero new network requests.** `PoweredBySection`
pulls ~71 of its 76 icons from the **Simple Icons CDN**, which is fine on /about
but unacceptable in the LCP-critical hero. No CDN images were introduced and the
5 local SVGs were left unused, keeping the swap free of new render branches or
asset loads. Hero request count is unchanged before/after; the `HeroWordWall`
chunk is 2.1 KB (908 B brotli).

> If logos are wanted here later, the path is to **vendor** ~24 Simple Icons SVGs
> into `public/logos/tech/` alongside the 5 already there and reference them
> same-origin. Do not solve it by pointing the hero at the CDN.

⚠️ **Not yet visually confirmed by a human.**

---

## 5. B4 — Hero outer "application" nodes (NOT STARTED)

The largest remaining piece. Full spec follows so it can be picked up cold.

### 5.1 What the user asked for

Extend the hero's isometric scene with **nodes outside the current blue/yellow box
cluster**, representing *applications that have been developed*, each connected by
visible **signals** back to the inner nodes. This is the *hero* scene — not the
closing-scene lattice, which is a different component entirely (that confusion
already cost one round trip).

### 5.2 Critical correction: this is a 2D canvas, not WebGL/R3F

Despite the isometric 3D look, the hero is a **hand-rolled 2D canvas renderer**
with its own projection math. No three.js, no React Three Fiber. Files, all in
`src/features/hero/`:

| File | Role |
|---|---|
| `heroScene.ts` (499 L) | Scene **data** (`CUBE_POSITIONS`, `SERVICE_NODES`, `SIGNAL_LOOPS`) + camera/projection math |
| `heroPlaneRenderer.ts` (1200+ L) | The painter — `drawPlaneFrame()`: streets grid, dot field, cubes/nodes/signals, flat P logo |
| `heroCity.ts` | Lattice constants (`DOT_STEP`, `DOTS_PER_AXIS`), density masks, halftone dot field, `VIEW_FIT`, `HORIZON` |
| `heroPhases.ts` | Scroll phase boundaries and curves (flatten, moveLeft, word reveal) |
| `heroPointer.ts` | Cursor falloff / stretch / ripple math (pure) |
| `heroPalette.ts` | `RGB_NAVY`, `RGB_GOLD`, `RGB_STEEL`, `RGB_FROST`, `RGB_SHADOW` |
| `HeroCanvas.tsx` (514 L) | React host: pointer events, scroll progress via imperative ref, frame loop |

### 5.3 The data you'll extend

```ts
// heroScene.ts:75-95 — 16 cubes on a 22×22 cell grid
interface CubeSpec { c: number; r: number; h: number; type: "gold" | "navy" }
// heroScene.ts:113-118 — 4 elevated icon nodes, a 2×2 quad
const SERVICE_NODE_SIZE = 60;
const SERVICE_NODES = [
  { cx:  5*GRID_CELL, cy:  5*GRID_CELL, elevation: 28, icon: "activity" },  // (210,210)
  { cx: 17*GRID_CELL, cy:  5*GRID_CELL, elevation: 28, icon: "code"     },  // (714,210)
  { cx:  5*GRID_CELL, cy: 17*GRID_CELL, elevation: 28, icon: "package"  },  // (210,714)
  { cx: 17*GRID_CELL, cy: 17*GRID_CELL, elevation: 28, icon: "shield"   },  // (714,714)
];
```

**Signals already exist** — this is the good news. `buildSignalLoops()`
(`heroScene.ts:137-180`) produces three closed circuits:

```ts
interface SignalLoop { waypoints: Pt[]; color: Rgb; pulseOffsets: number[] }
// 1. inner quad joining the 4 service nodes  (gold)
// 2. mid-perimeter highway                    (steel)
// 3. outer grid boundary                      (gold)
```

Rendered by `drawSignals()` (`heroPlaneRenderer.ts:619-691`) as canvas strokes:
a tail traced over `SIGNAL_SAMPLES = 14` points across `SIGNAL_TAIL_PX = 38`,
stroked twice (outer glow `rgba(color,0.22)` at `14*cam.scale`, inner core
`rgba(color,0.95)` at `5.5*cam.scale`), travelling at
`SIGNAL_SPEED_PX_PER_MS = 0.25`. Gold pulses light service nodes as they pass via
`drawNodeGlow()` — a radial halo peaking within ±90px.

> Note: all three existing loops are **closed** (last waypoint == first). A spur
> from an outer node to an inner node is an **open** path; a pulse would wrap from
> end back to start. Decide whether that reads as a transmission burst (fine) or
> needs an out-and-back waypoint list (closed, safer). Prefer out-and-back.

### 5.4 Geometry, and the tension you must resolve

```
GRID_CELL   = 42            heroScene.ts
GRID_CELLS  = 22
PLANE_SIZE  = 924           = 22 × 42, heroScene.ts:30
PERSPECTIVE = 1600          heroScene.ts:32
VIEW_FIT    = 0.95          heroCity.ts:74
HORIZON     = 0.6           heroCity.ts:86
```

`makeCamera()` (`heroScene.ts:223-247`) applies rotateZ(−45°) → rotateX(55°) →
scale, with `wrapperScale = 1.25 − 0.25*flatten`. `viewScale ≈ min(w,h) / (PLANE_SIZE × VIEW_FIT)`.

**The tension:** the plane already bleeds off all four screen edges *by design*.
Extending the plane while holding cube scale constant pushes the new outer ring
**further off-screen**, which defeats the purpose. Keeping the ring on-screen
requires giving back some zoom. These pull against each other and the balance can
only be found empirically.

Recommended approach:

1. Add `PLANE_MARGIN_CELLS` (start ~4) and derive
   `PLANE_SIZE = (GRID_CELLS + 2*PLANE_MARGIN_CELLS) * GRID_CELL`.
2. **Recentre in one place, not twenty.** Growing the plane moves its centre, so
   existing content must shift by `PLANE_MARGIN_CELLS * GRID_CELL` to stay put.
   Apply that offset at the single point where `CUBE_POSITIONS` / `SERVICE_NODES`
   are converted to world coordinates — do **not** rewrite the 20 hand-authored
   coordinate literals.
3. Retune `VIEW_FIT` (and/or `wrapperScale`) so the outer ring is genuinely
   visible. A modest overall zoom-out is expected and acceptable; the user chose
   plane extension over zoom-out as the *concept*, but some rescale is unavoidable.
4. Review everything keyed off `PLANE_SIZE`: the grid edge fade
   (inner `0.44 × PLANE_SIZE` → outer `0.72 × PLANE_SIZE`,
   `heroPlaneRenderer.ts:155-156`), the `heroCity.ts` dot field
   (`DOTS_PER_AXIS`, density masks), and signal loop 3 (the outer boundary), which
   will move outward with the plane.

### 5.5 Wiring the new nodes in

- **Hit-testing:** `HeroCanvas.tsx:372-409` loops `SERVICE_NODES` with radius
  `SERVICE_NODE_SIZE * 0.9` and is live only while `progress < HIT_TEST_END (0.04)`;
  a hit calls `onNodeSelect?.(index)`. Extend the loop if outer nodes should be
  interactive, or leave them decorative — decide and say which.
- **Active-node reactions:** `heroPlaneRenderer.ts:716-747` gives each of the 4
  service nodes a *different* reactive pattern when selected (sine ripple, stepped
  falloff, checkerboard, perimeter emphasis). Adding selectable nodes means
  deciding their patterns too.
- **Reduced motion:** `HeroCanvas.tsx:114-122` — `isStatic` renders one frame via
  `paintStill()` at progress 0 and never loops. New content must appear correctly
  in that single static frame.
- **Performance:** ~510 drawables/frame today, with a painter's-algorithm sort
  over just the 20 cubes+nodes. Adding 6–12 nodes plus connector lines is
  comfortably under 5% extra draw cost — no instancing or LOD concern. Zero
  allocation in the frame loop is a deliberate property; preserve it (pre-allocate
  any new buffers at module load).

### 5.6 Verification

CLI gate, plus **live visual checks at 1440×900 and 390px** — this is a visual
change and the gate cannot judge it. Confirm: outer nodes are actually on-screen,
signals read as connections rather than clutter, the flatten/scroll collapse still
looks right, and the reduced-motion static frame is sane.

Driving the page in headless/preview: use `page.mouse.wheel()` or Lenis directly
(`window.__lenis.scrollTo(y, { immediate: true })` — exposed in DEV, and by far
the fastest way past the long pinned hero). **Never `window.scrollTo`** — Lenis
ignores it and you'll get false failures. `window.ScrollTrigger` is also exposed
in DEV.

---

## 6. Open question: is A3 (mobile lattice) wanted?

`IsometricTechLattice.tsx` is the **closing-scene** lattice — the
APPLICATIONS/TECHNOLOGIES/INFRASTRUCTURE node diagram near the page footer. Its
mobile layout was built because `handover-2026-08-25-workstreams-closeout.md` §3
asked for it.

When the user later said *"I didn't mean this nodes"*, they were redirecting to
the **hero** scene (§5) — not necessarily rejecting the mobile work. It was
raised with them and not answered. **Confirm before committing**: keep it, or
`git checkout` that file plus `tests/isometric-tech-lattice.test.tsx`.

---

## 7. Known unrelated noise (don't chase these)

- **`careers-detail-adversarial.test.tsx` / `careers-index.test.tsx` flake.** Under
  full parallel test runs, `motion-dom`'s `DocumentProjectionNode` throws
  `ReferenceError: document is not defined` *after* environment teardown, making
  `yarn test` exit 1 even though all assertions pass. Running those files in
  isolation is clean. Pre-existing, unrelated to any work here, observed
  independently by three agents. Worth fixing separately (a projection-cleanup
  cancellation), but it is **not** a regression from this batch.
- **`three.js` chunk > 500 kB build warning.** Pre-existing.
- **`AppShell.tsx` fetch-in-component lint hook flag (~line 204).** Pre-existing.
- **The 3 `react-hooks/exhaustive-deps` warnings** are deliberately out of scope —
  adding the missing dep can turn a run-once effect into run-every-render. They
  need a considered read of each effect, not a mechanical fix. Leave them.

---

## 8. Continuation checklist

- [ ] Run the gate. If red and you didn't just break it, something else touched the tree.
- [ ] Run the `git log --all` sort command in §0.
- [ ] **Separate batch A and batch B into distinct commits** before new work (§0).
- [ ] Confirm `PoweredBySection` on /about still looks right after the data extraction (§4, B3).
- [ ] Confirm whether A3 stays or goes (§6).
- [ ] Visually check B2 and B3 at 1440×900 and 390px — neither has been seen by a human yet.
- [ ] Then pick up B4 (§5), the only fully unstarted item.
