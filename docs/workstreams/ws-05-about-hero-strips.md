# WS-05 — About hero: right-hand images → slanted photo strips

**Owner files (exclusive):** `src/features/about/components/HeroGallery.tsx` · `src/features/about/components/BackgroundReveal.tsx`
**Shared-file boundary:** may **append** asset paths to the warmup manifest in `src/app/AppShell.tsx`. **Do not edit `src/shared/components/Preloader.tsx`** — WS-13 owns it.
**Depends on:** WS-03 for the tile paths (copyable — not blocking).
**Agents:** Haiku to inventory available imagery, Sonnet to implement.
**Acceptance bar:** `/design-taste-frontend`.

---

## Why

From the brief: *"we move the moving bg strips in the hero about page and is slightly
slanted with z facing slightly and only reaching slightly to the top left."* Clarified in
session: the strips **replace the three right-hand images** in the About hero composition.

## Current state (verified)

`HeroGallery.tsx:22-142` — a 12-column, 2-row grid on `sm+`, stacking on `xs`:

| Slot | Asset | Grid | Border |
|---|---|---|---|
| Left (primary, full height) | `/images/AboutPage1.webp` | cols 1/8, rows 1/3 | **2.5px gold** |
| Top right | `/images/AboutPageHero2.webp` | cols 8/13, row 1 | 1.5px white 18% |
| Bottom right | `/images/AteneoQR.webp` | cols 8/13, row 2 | 1.5px white 18% |

Behind it, `BackgroundReveal.tsx` is a sticky parallax hero: one `<img>`
(`/images/about-hero-bg.webp`) plus two gradient overlays, entering via `motion/react` at
1.4s ease-out-expo. **DOM only — no canvas, no three.js.**

The two right-hand slots are what the strips replace. The gold-bordered left image stays.

## Target state

A column of photo strips occupying the right-hand region: **slanted, with a slight Z
rotation, angled toward the top-left**, drifting gently. Source imagery: the 29 tiles in
`heroWallTiles.ts` that WS-03 frees from the home hero.

**Restraint clause.** "Slightly" appears twice in the brief and is the operative word — a
few degrees of rotation, a shallow perspective. This is a tilt, not a carousel. Resist
adding a third motion system to a page that already runs `motion/react` entrances,
`JourneyTimeline`'s cursor-following GSAP string, and `PoweredBySection`'s velocity marquee.

## ⚠️ Cost discipline

The About hero is currently near-free. Adding N images can undo that on the exact page the
brief says feels laggy. Hard rules:

- **Cap the strip count.** Start at 6-8 visible tiles, not 29. Justify any increase with a
  measurement.
- **Explicit `width`/`height`** on every strip — no CLS on the LCP surface.
- **The first painted strip must not become the LCP element** unless it is preloaded.
  `BackgroundReveal`'s background image should stay the LCP candidate.
- Any drift animation is **transform/opacity only**, and must stop offscreen. `DriftWall.tsx:318-380`
  is the reference contract for pausing.
- Honour `prefers-reduced-motion`: no drift, static composition.

## Steps

1. Take the tile paths from `heroWallTiles.ts` (coordinate with WS-03; copy them, don't
   wait for it).
2. Rebuild the right-hand grid region of `HeroGallery.tsx` as the slanted strip group.
   Keep the left gold-bordered primary image and the `xs` stacking behaviour.
3. Verify the strip imagery is appropriate for About — the home tiles were chosen to be
   *grayscaled and blended*, not to be looked at directly. Some will not survive scrutiny
   at full colour. Swap those out.
4. **Declare** the required warm assets in a `## Warm assets` section at the bottom of this
   file. WS-13 (or whoever owns the manifest) consumes that list. Do not edit the Preloader.
5. Re-check the `xs` breakpoint — a slanted strip column is a desktop idea; on mobile it
   likely reverts to the stacked layout.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn typecheck && yarn test && yarn build && yarn preview
```

- **About LCP before/after** — must not regress. This is the page the brief called laggy.
- CLS = 0 on `/about` (explicit dimensions).
- Screenshots at 375 / 768 / 1440. Confirm the slant reads as deliberate, not as a bug.
- `prefers-reduced-motion: reduce` → static, composed, still good.
- Confirm no edit to `Preloader.tsx`: `git diff --name-only` must not list it.

## Warm assets

*(populate during implementation — the list WS-13 consumes)*

## Out of scope

`Preloader.tsx` internals (WS-13). The rest of the About page — `PoweredBySection`,
`JourneyTimeline`, `TalentSection` and below are untouched. Theme tokens (WS-01).
