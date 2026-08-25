# WS-04 — Home closing: isometric tech-stack lattice

**Owner files (exclusive):** `src/features/home/components/ClosingShelf.tsx` + a new closing-scene directory under `src/features/home/components/`
**Depends on:** WS-01 (tokens). **Coordinates with:** WS-02 (section order).
**Agents:** Haiku to map the current closing + `ServiceGlobe`'s lazy pattern, Sonnet to implement.
**Acceptance bar:** `/design-taste-frontend`; home JS budget is a hard gate.

---

## Decision from the session — the claim boundary

The brief asked for a closing that shows *"many supported technologies + developed systems…
zooming out showing supports of nodes/applications using renowned tech stacks."*

That phrasing implies a factual claim: *these are the systems we built.* Nothing in the
repo holds such an inventory, and inventing one on a public marketing site is not
acceptable. **Decided: semi-factual.**

| Allowed | Not allowed |
|---|---|
| Real, named tech stacks as the nodes — you genuinely use them | Counts of systems built |
| Reading as scale and interconnection | Named clients |
| "Built on" framing | "N systems delivered" / "N applications in production" |

Source of truth for the stacks: `PoweredBySection.tsx` (About) already curates ~76
technologies across four categories — AI/ML, Languages & Frameworks, Cloud & Infra, Data &
Storage — with local SVGs in `/logos/tech/` and a `cdn.simpleicons.org` fallback. **Reuse
that list.** Do not assemble a second, divergent inventory.

**If anyone later wants real system counts in here, that is a new decision and a new file.**
Do not add numbers because the composition looks empty without them.

## Why

`ClosingShelf.tsx` currently closes the homepage with four polaroid-style photo frames —
3px white borders, ≤1.2° rotation, deep shadows — on a navy field, linking to contact and
careers. It is a scrapbook. After a page that (per WS-02) now argues capability first, a
scrapbook is the wrong last impression: it closes on *who we are* immediately after the
page spent seven sections earning *what we build*.

## Current state (verified)

- `ClosingShelf.tsx` — "Horizon Gateway" mini establishing shot + a 4-frame shelf gallery
  on a 12-column grid (one 8-col panoramic, two 4-col portrait, one 8-col panoramic), ground
  `NOIR.navyField`, frames link to `/contact` and `/careers`.
- **The lazy-3D pattern to copy:** `MissionStatement.tsx:52-65` gates `ServiceGlobe` behind
  `useInView` with a 900px prefetch margin and a `Suspense` boundary. That gate is why home
  JS is 196 KB rather than 463 KB (`docs/perf-audit-2026-08-23.md`).
- `vite.config.ts:133-160` groups `three` / `@react-three/fiber` into a cacheable chunk that
  is **lazy, not eager**. This workstream must not change that.
- `PlaygroundCanvas.tsx` — the other R3F mount; its imperative scroll-progress handle (zero
  React renders on scroll) is the established pattern for scroll-driven 3D here.

## ⚠️ This is the largest build in the set, and the easiest to regress

- **Budget gate.** Home JS must stay ~196 KB. A closing scene at the *bottom* of the page
  has no excuse for entering the critical path — gate it exactly as `ServiceGlobe` is
  gated, `useInView` + `Suspense`, and verify against `dist/`.
- **Zero React renders on scroll.** `docs/hero-upgrade/README.md` records this as a standing
  rule: scroll progress arrives via an imperative handle, never state. Follow it.
- **Reduced motion must render a static frame** — a composed still of the lattice, not a
  blank section and not a spinning scene.
- **Consider not using three.js at all.** A zoom-out isometric lattice is achievable in SVG
  or CSS 3D transforms at a fraction of the weight, and it re-themes for free. Evaluate that
  first and record why you rejected it, if you do. Reaching for R3F because the scene is
  "3D" is the expensive default.

## Target state

An isometric structure that resolves as the page ends: nodes representing applications,
supported by named tech-stack layers beneath them, revealed by a scroll-driven zoom-out that
shows the supporting structure was always there. Ground stays `NOIR.navyField`. Gold marks
the single element carrying meaning, per WS-01's accent rule — not every node.

**The CTA must survive.** The current shelf's real job is routing to `/contact` and
`/careers`. Whatever replaces it must close with at least as clear a call to action; an
atmospheric scene with no exit is a worse closing than a scrapbook with one.

## Steps

1. Evaluate SVG / CSS-3D versus R3F. Record the decision and its reasoning.
2. Pull the stack list from `PoweredBySection.tsx`; pick a legible subset — a lattice of 76
   logos is noise. Aim for the recognisable ones.
3. Build the scene behind a `useInView` + `Suspense` gate modelled on
   `MissionStatement.tsx:52-65`.
4. Drive the zoom-out from scroll via an imperative handle, not state.
5. Author the reduced-motion static composition as a first-class design, not a fallback.
6. Rebuild the CTA into the new closing.
7. Delete the shelf frames; check whether their imagery is referenced elsewhere (WS-05 may
   want it) before removing assets.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn tsc --noEmit && yarn test && yarn build && yarn preview
```

- **Budget gate (hard fail):** home entry JS ≤ ~196 KB. Confirm `three` is absent from the
  entry chunk — `tests/bundle-assertion.test.ts` exists for exactly this class of check;
  extend it rather than checking by eye.
- Scroll to the closing with the profiler on: **zero React renders** attributable to scroll.
- Scene does not initialise until near-viewport — verify the chunk request fires late in
  the network panel, not on load.
- `prefers-reduced-motion: reduce` → static composed frame, CTA reachable.
- CTA links to `/contact` and `/careers` work; keyboard reachable; focus visible.
- **Claim audit:** read every string in the scene. No counts, no client names. If a number
  appears, it must be independently true and someone must have approved it.
- Screenshots at 375 / 768 / 1440. On mobile the isometric read usually collapses — have a
  deliberate small-screen composition, not a squeezed desktop one.

## Out of scope

Other home sections and their order (WS-02). The hero (WS-03). Theme tokens (WS-01).
Adding system counts, client names, or any factual claim beyond the tech stacks themselves.
