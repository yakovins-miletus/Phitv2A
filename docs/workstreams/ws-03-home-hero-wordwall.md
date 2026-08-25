# WS-03 — Home hero: photo drift wall → moving word columns

**Owner files (exclusive):** `src/features/hero/HeroImageWall.tsx` · `src/features/hero/DriftWall.tsx` · `src/features/hero/heroWallTiles.ts` · `src/features/hero/SuperHeroSequence.tsx`
**Depends on:** nothing hard. **Strongly recommended:** read WS-06 findings first.
**Feeds:** WS-05 (hands over the freed photo tiles).
**Agents:** Haiku to map the hero z-stack and timeline, Sonnet to implement.
**Acceptance bar:** `/design-taste-frontend`; must not regress `docs/hero-upgrade/stage-0-baseline.md`.

---

## Why

The brief: *"replace the background strips in the home sequence with simple words moving in
vertical strips so performance is lighter."* Located precisely — the layer behind
"7 YEARS OF EXCELLENCE" / "GENERATIONS OF COMPETITIVENESS" is `HeroImageWall`, rendered at
`SuperHeroSequence.tsx:650-654`: **29 photographic tiles** (`heroWallTiles.ts`) drifting
behind a perspective tilt via `DriftWall.tsx` (446 lines).

## ⚠️ Read this before touching anything

Two things make this far more delicate than "swap images for words."

**1. The flanking text uses `mixBlendMode: "difference"`.** From the `HeroImageWall.tsx`
docblock (L23-38) — its contrast against its own backdrop is `|255 − 2b|`, which is
**zero at b = 127.5**:

> A mid-grey backdrop does not make that text hard to read, it makes it invisible.
> **The constraint to preserve if any of these numbers are retuned: the composited
> backdrop under the flanking text must stay below roughly 95 per channel.**

Word columns on a mid-grey ground will make your hero headline *vanish*. The current
design reaches b ≈ 83 through three cooperating knobs: the 0.42 navy wash in
`SuperHeroSequence.tsx`, and the wall's own `dim` + `overlayColor`. `grayscale` is in there
for the same reason — it flattens hue variance across 29 different photos so the composite
is predictable. **A word wall must hit the same budget, or the blend mode has to go.**

**DECIDED (session, HITL):** prototype **both** and choose from the rendered result, not
from a description. Build (a) word columns constrained to hold b < 95 with the blend
intact, and (b) the blend removed with the headline lit conventionally. Screenshot both at
1440 and put them side by side for the call. Do not pick one on reasoning alone — this is
the hero's signature treatment and the difference is only visible in the pixels.

**2. The performance premise is unverified, and the evidence cuts against it.**
`DriftWall.tsx:318-380` already stops its rAF when paused, reduced-motion is on, or the tab
is hidden — the code comment says *"A paused wall costs one contained, un-animated
subtree."* So this may buy less than the brief assumes. **Treat this as a design change
with a possible perf upside, not as a perf fix.**

**DECIDED (session, HITL):** WS-03 proceeds **regardless** of what WS-06 finds — the word
wall is wanted for how it reads. Separately, WS-06's top confirmed cause becomes its own new
workstream (WS-15). So the perf question does not gate this file; it spawns a different one.

Also note `HeroImageWall.tsx` exists because it *already replaced* something — two 50vh
split panes. This layer has been iterated before; read the docblock before overwriting it.

## Target state

Vertical columns of drifting words (service names, disciplines, tech terms) replacing the
photo tiles behind the hero headline. Same z-position, same backplate, same pause
behaviour, same composited-luminance budget.

**Reuse rather than reinvent:** `PoweredBySection.tsx` (About) already solves
velocity-aware marquee columns — `useVelocity` + `useAnimationFrame`, three rows at
different speeds, reverse direction on row 2. Take that mechanism. Do not write a third
scroll-linked loop; `DriftWall` and `PoweredBySection` are already two.

## Steps

1. Read `HeroImageWall.tsx` in full, then `DriftWall.tsx:318-380`. Record the current
   composited backdrop luminance under the flanking text — you need the before number.
2. Prototype the blend question **both ways** (see DECIDED above) and present screenshots
   before committing to either. State the chosen path in the PR.
3. Build the word-column layer, generalising `DriftWall`'s pause/rAF contract rather than
   bypassing it. Words must be `aria-hidden` — the wall already is
   (`HeroImageWall.tsx`, `<Box aria-hidden>`), and decorative text must not enter the
   accessibility tree or the reading order.
4. Keep the navy backplate. The docblock explains why it exists: without it the gunshot
   phase grows white corners and the difference blend inverts there.
5. Hand the 29 tile paths from `heroWallTiles.ts` to WS-05 before deleting the manifest.
6. Preserve the reduced-motion path — `tests/home-reduced-motion.test.tsx` pins values here.
7. **Handed over from WS-01:** replace the hardcoded literal at `SuperHeroSequence.tsx:957`
   (`boxShadow: "0 0 8px #FFC72C"`) with `NOIR.gold`. It is the only palette-bypassing gold
   literal left in the app, and this workstream owns the file it lives in.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn tsc --noEmit && yarn test && yarn build && yarn preview
```

- **Legibility gate:** screenshot the hero mid-sequence; sample the composited backdrop
  under the flanking text. Must stay below ~95 per channel (or blend mode removed).
- **Perf gate:** DOM node count and frame p95 before/after, against
  `docs/hero-upgrade/stage-0-baseline.md` (frame p95 **1.0 ms**, LCP **1,112 ms**).
  A regression here fails the workstream even if it looks better.
- **Pause gate:** scroll the wall offscreen, confirm rAF stops (no frames in the profiler).
- `prefers-reduced-motion: reduce` → no drift, text still legible.
- Existing `tests/home-reduced-motion.test.tsx` and any hero tests still pass.

## Rollback

Keep `HeroImageWall` in the tree behind a flag until the legibility and perf gates both
pass. Do not delete `heroWallTiles.ts` until WS-05 has taken the paths.

## Out of scope

Home section order and copy (WS-02). The closing/CTA (WS-04). Theme tokens (WS-01).
Measuring the site's overall performance (WS-06).
