# Handover — Closing section + navbar island-v2

**Date:** 2026-08-30 23:30 · **Branch:** `main` · **Status:** working tree, **NOT committed**

> Two unrelated pieces of work this session: the closing-section rebuild
> (§ everything below) and a new navbar mode (§ Navbar: island-v2, at the end).

All changes this session are uncommitted. Green gate: `yarn typecheck` clean ·
`yarn lint` 0 errors · `yarn test` 486/486 (one pre-existing unrelated flake, see
§4).

## What changed

The desktop closing beat (`ClosingLatticeSection`, Mode A) was rebuilt across
three iterations this session:

1. **Cinematic hand-off** — the headline "We create exciting technologies"
   builds in word-by-word (SplitText) on a right-hand stage, recedes with depth
   (scale + lift + blur), then hands off to the CTA card that rises into the
   same grid cell. Headline and CTA opacity windows are disjoint.
2. **Lattice canvas restored** as a background layer — `<HeroCanvas mode="closure">`
   held at `setProgress(0)` (solid 3D P, never the particle-converge window),
   `setZoomProgress(CLOSURE_ZOOM_HOLD = 0.82)` held, offset left ~12% so the P
   clears the right-hand stage, subtle scroll drift. A radial `mask-image`
   dissolves the outermost nodes into the frame; a navy vignette
   (`--closure-vignette-opacity`) fades in over pin `p ∈ [0.03, 0.17]`.
3. **Buffered spine + word-order fix** — every beat is now followed by a rest
   buffer (pin `2.6vh → 3.0vh`). The word reveal was changed from a staggered
   `.from()` (which on a scrubbed timeline renders not-yet-started words at
   their natural visible state → last word appeared first) to
   `gsap.set(hidden) + .to(shown)`. The scrub timeline is forced to total
   duration 1 via a full-span spacer tween so tween positions == pin progress.

### Files

| File | Change |
|---|---|
| `src/features/home/components/closing-scene/closingPhases.ts` | **NEW** (created earlier this session, still untracked). Pure ramp math + all phase constants + the buffered phase-table doc comment. |
| `src/features/home/components/closing-scene/ClosingLattice.tsx` | Mode A: canvas layer + radial mask + vignette overlay + right-hand headline/CTA stack; `useGSAP` rewrite (spacer tween, `set`+`to` reveals, drift, `setProgress(0)`/`setZoomProgress`). Modes B/C: static vignette added to C; `HeadlineBlock` gained `compact` + `eyebrowRef`/`headlineRef`, dropped the old `withBackdrop` plates. |
| `src/features/hero/heroScene.ts` | `APPLICATION_NODES` 6 → 10 (`app-edge-w/e`, `app-far-nw/se`) — closure-only render, point-symmetric, no signal spurs. Hero unaffected at runtime. |
| `tests/motion/closing-lattice-pinned-scroll.test.tsx` | Pin 2.6→3.0, phase anchors rewritten for the buffered timings, canvas assertion flipped (was "no canvas"), `vignetteOpacityFor` block added. |
| `tests/motion/hero-scene.test.ts`, `hero-challenger-1-m1.test.ts`, `hero-challenger-2-signal-loops-and-isolation.test.ts` | `APPLICATION_NODES` count 6→10; challenger-2 "every node has a spur" relaxed to "the 6 original nodes are wired, `app-edge-*`/`app-far-*` are decorative". |

## Key tuning knobs (all in `closingPhases.ts` unless noted)

`CLOSING_PIN_VH` 3.0 · `CLOSURE_ZOOM_HOLD` 0.82 · `CLOSURE_DRIFT_X_FROM/TO`
−12/−14 · phase constants `SETTLE_END` 0.20, `WORD_IN_START/END` 0.30/0.46,
`HEADLINE_OUT_START/END` 0.58/0.70, `CTA_IN_START/END` 0.80/0.93,
`CTA_POINTER_AT` 0.87, `VIGNETTE_IN_START/END` 0.03/0.17 ·
`CLOSURE_VIGNETTE_BG` / `CLOSURE_CANVAS_MASK` (gradient strings in
`ClosingLattice.tsx`) · frost plate on the headline wrapper `::before`
(`ClosingLattice.tsx`, `rgba(247,250,252,0.32)` blur 3px).

## Open issues / not verified

1. **Not committed.** Decide whether to squash the three iterations into one
   `feat(closing): …` commit or keep the history.
2. **Modes B (mobile) and C (reduced motion) not visually verified this
   session** — only unit tests. The 4 new nodes render there too (shared
   constant). Mode C gained a static vignette; Mode B has none. Screencast both.
3. **`ladder-probe.js`** — `#closing` pin end moved (`2.6 → 3.0` vh). The harness
   has no committed baseline JSON, so nothing to regenerate, but any threshold
   parity run should expect `#closing` `end` to be `+0.4·innerHeight` vs the
   pre-session state.
4. **Pre-existing test flake** — `yarn test` reports "1 error" (unhandled
   `ReferenceError: document is not defined` from `motion-dom` projection
   cleanup, attributed to a `careers-detail*` file, moves between files
   run-to-run). Present before this session's changes; the careers files pass
   clean in isolation. Not caused by this work — but worth fixing separately
   (a `motion/react` layout-projection node not torn down before the vitest
   env is disposed).
5. **P is left-of-centre, not dead-centre.** The user asked for "centered 3D";
   a truly centred P at this size collides with the right-hand headline/CTA
   stage (and the dot-rail pins the right edge). Current compromise: `−12%`
   offset. If the stage moves or shrinks, revisit `CLOSURE_DRIFT_X_*`.
6. **`closingHeroProgressFor` / `closingZoomFor` / `ZOOM_MAX`** in
   `closingPhases.ts` are now **dead in production** (Mode A holds the camera,
   doesn't scrub it). Kept + still unit-tested as the "scrubbed camera"
   alternative. Delete if a future pass confirms they won't be used.
7. **`useVideoBg` dead code** and **`/images/pillars/* 404`** — carried over
   from the open-rework cycle handoff, still open, unrelated to this work.

## Verification recipe (desktop Mode A)

Playwright MCP (the embedded preview pane pauses rAF — drive scroll with
`window.__lenis.scrollTo(y, { immediate: true })` via `browser_evaluate`, wait
~1.6s for the scrub). 1440×900. Find the pin:
`ScrollTrigger.getAll().find(t => t.pin && t.trigger?.dataset.testid === 'closing-lattice-section')`;
`y = pin.start + p*(pin.end - pin.start)`. Sample `p ≈ 0.10 / 0.25 / 0.35 / 0.42 / 0.65 / 0.90`:

- p 0.10 / 0.25: P solid 3D, lattice + vignette framed, **headline words all
  opacity 0** (buffer). Never any particle scatter.
- p 0.35: words revealing **We → create → exciting → technologies** in that
  order (`[...document.querySelectorAll('#closing .closing-word')].map(w => getComputedStyle(w).opacity)`).
- p 0.42: headline fully lit, legible over the canvas.
- p 0.65: headline receding, CTA still absent.
- p 0.90: CTA lit + `pointer-events:auto`, headline gone.

---

# Navbar: island-v2 mode

A new `NavbarMode` — **island, tightened**. Same content as `island` (P mark +
PHITOPOLIS wordmark + all 5 nav items + Contact + menu button), just a denser,
lighter-weight pill: narrower (`maxWidth {xs:1000, xl:1200}` vs island's
`{xs:1200, xl:1536}`), shorter (`minHeight 46` vs `54`), less padding
(`0 20px` vs `0 32px`), smaller type (wordmark `0.8rem`, nav `0.72rem`, logo
mark `15px`), tighter gaps, lighter chrome (`rgba(255,255,255,0.42)` bg,
`0 2px 8px rgba(0,0,0,0.05)` shadow). Always-light, SpecularFx rim, `borderRadius
100px` — all shared with island via `isAnyIsland`.

> First cut of this stripped the nav/wordmark/Contact to a `[P ☰]` capsule; the
> user corrected it — v2 keeps everything, it's just the compact variant.

Selected from ⌘K / the mega-drawer command search: **"Navbar: Island v2 Mode"**
(`sys-nav-island-v2`). Like every other navbar mode it is **not persisted** —
resets to `glassmorphism` on reload. On `/` it only appears below the hero
(home-at-top is force-`minimal`, unchanged).

### Files

| File | Change |
|---|---|
| `src/shared/components/NavbarContext.tsx` | `'island-v2'` added to the `NavbarMode` union; `derivedIsCompact` comment. |
| `src/shared/components/commandActions.ts` | `sys-nav-island-v2` command entry. |
| `src/shared/components/AppShell.tsx` | `isIslandV2` / `isAnyIsland` booleans (~line 704). `isAnyIsland` replaces `isIsland` in the shared pill treatment (bg/blur/radius/rim, `onDark` exclusion, the center-nav gate, the 12× `(isStandardOrGlass \|\| isAnyIsland \|\| isMinimal)` compact-chip checks). `isIslandV2`-only tighter values on: Toolbar `maxWidth` / `minHeight` / `padding` / `bgcolor` / `boxShadow`; nav `gap` + nav-item `fontSize`/`letterSpacing`; logo `gap` + mark `height`; wordmark `fontSize`/`letterSpacing`; right-cluster `gap`. |

### Open / follow-ups

- **Not committed.** Separate commit from the closing work
  (`feat(navbar): island-v2 compact capsule mode`).
- **No test** — there is no per-mode navbar rendering test in the repo
  (`navbar-precedence.test.tsx` only covers the dark-anchor precedence logic).
  Low priority since v2 is a styling delta of `island`, not new structure.
- **Persistence** — no navbar mode persists across reload (existing design).
  If island-v2 should be sticky or become the default, add a `localStorage`
  read in the `NavbarProvider` `useState` initializer (template:
  `FloatingIdOverlay.tsx:23-30`) — but that changes behavior for *all* modes,
  so it's a product call.
- Verified live at 1440 and 390 (Playwright, ⌘K → "island v2"): Toolbar
  1000×46, `rgba(255,255,255,0.42)` bg, all 5 nav links + wordmark + Contact
  present, no overflow. On mobile it goes near-full-width like `island` does
  (no horizontal inset) — not a v2 regression, but a nicer mobile pill for
  both island modes is a possible follow-up.
