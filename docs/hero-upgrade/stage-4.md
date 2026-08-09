# Stage 4 — `DAWN` tokens, the CSS sky, the disc, and the sky choreography

**Tier:** Sonnet · **New network bytes:** zero
**Read first:** `docs/hero-upgrade/README.md`, `docs/hero-upgrade/stage-0-baseline.md`

---

## Goal

Put the hero **above the clouds at dawn** — the first half, with no image assets at all.

The scene already draws a city: sixteen extruded blocks on an isometric grid. Wrapping it
in a sunrise sky turns that into *Phitopolis at dawn*. This stage builds the sky, the sun
glow, the translucent disc motif, the scroll choreography that burns the haze off and hands
cleanly back to the site's own background, and cursor parallax on all of it.

**Clouds are stage 5.** Nothing here loads an image. That is the point: a CSS gradient
costs zero bytes, paints in the first style pass, and cannot regress LCP — so we prove the
choreography and the handoff before spending a single byte.

**Done means:** the hero reads as a sunrise, the sky is fully gone by the time the pin
hands off at progress 0.86, the LCP element is still the motto text, and the whole thing
moves under the cursor.

---

## The one hard structural fact

The "Scaled Hero Container" in `SuperHeroSequence.tsx` is `width: 100%`, `height: 100%`,
`zIndex: 5`, `bgcolor: NOIR.void`, and only scales down during the gunshot phase. **At
progress 0 it covers the entire viewport.** Anything you place *behind* it is invisible.

**The sky must live inside that card.** Verify this yourself before writing any JSX —
if you put the sky behind the card you will see nothing and waste the stage.

---

## Files in scope

| Path | Mode |
|---|---|
| `src/shared/theme/palette.ts` | **additive** — the `DAWN` token object |
| `src/features/hero/heroPhases.ts` | **additive** — four curves |
| `src/features/hero/heroVars.ts` | **additive** — four vars |
| `src/features/hero/SuperHeroSequence.tsx` | **modify** — sky Box, vignette, `varsHostRef`, the `<h1>` fix |
| `src/features/hero/HeroCanvas.tsx` | **modify** — publish `--hp-mx` / `--hp-my` |
| `src/features/hero/R3FHeroCanvas.tsx` | **trivial** — accept and ignore `varsHostRef` |
| `tests/motion/hero-phases.test.ts` | **additive** |
| `tests/a11y-contrast.test.ts` | **additive** |

Do not touch `heroCanvasRenderer.ts`, `heroScene.ts`, `heroPointer.ts`,
`PlaygroundScene.tsx`, `GroundLayer.tsx`, `groundStops.ts`, `grounds.ts`, `sections.ts`,
or `glass.css`.

---

## 1. Tokens — `palette.ts`

Add `export const DAWN = { … } as const` as a **sibling** of `NOIR`, not folded into it —
`NOIR`'s own docblock scopes it to quant-noir surface tokens, and sky is a different
concern. `palette.ts` is the only file where raw hex may live (README rule 4).

Vertical ramp, top → bottom, hue-walked navy 220° → gold 44°, the same walk
`CHAPTER_ACCENTS` already establishes:

| Token | Hex | Role |
|---|---|---|
| `zenith` | `#8FA6D0` | top of frame — the `RGB_STEEL` hue at high lightness |
| `upper` | `#B6C4DF` | upper sky |
| `mid` | `#DCE0E9` | neutral pivot, sits on `NOIR.void`'s hue |
| `haze` | `#F2E6DC` | cream, top of the cloud sea |
| `warm` | `#F8DCC2` | peach band |
| `ember` | `#F6C98B` | gold walked down to the horizon |
| `cloudMid` | `#F1E8E0` | cream cloud body (stage 5 uses it) |
| `cloudLo` | `#C9C6D2` | cool shadowed underside (stage 5) |

Reuse `NOIR.gold` for the sun core and `NOIR.white` for lit cloud tops — **do not duplicate
either**. Add rgb triplets `zenithRgb`, `warmRgb`, `cloudLoRgb` for `rgba()` composition,
matching the existing `goldRgb` / `voidRgb` convention.

**Why this is Phitopolis and not the reference site:** the reference's teal becomes our own
steel-blue at the cool end and our own gold at the warm end. No off-brand hue enters the
file. Write that reasoning into the TSDoc — the next reader will otherwise assume the
palette drifted.

**WCAG.** The only persistent text over the sky is the motto in `SuperHeroSequence.tsx`,
`NOIR.navyField` at 2.0–2.6 rem / 800 weight — large text, 3:1 floor. Measure and record in
the TSDoc; expected roughly navy-on-`zenith` 5.55:1, navy-on-`warm` 10.4:1. **Compute them
yourself, don't copy those numbers.** Pin the two worst cases in `tests/a11y-contrast.test.ts`
the way `mist` and `CHAPTER_ACCENTS` are already pinned.

## 2. Curves — `heroPhases.ts`

Four pure functions, in the file's existing parity-locked house style:

```
sunAltitude(p)   0→0.20: 0→0.35 · 0.20→0.50: 0.35→1.0 · ≥0.50: 1.0
hazeDensity(p)   ≤0.20: 1.0 · 0.20→0.50: 1.0→0.45 · 0.50→0.60: hold
                 0.60→0.70: 0.45→0.10 · ≥0.70: 0.10
skyPresence(p)   ≤0.60: 1.0 · 0.60→0.70: 1.0→0.15 · 0.70→0.86: 0.15→0 · ≥0.86: 0
cloudDrift(p)    monotonic across [0,1]
```

Express the boundaries using the **existing exported constants** (`PHASE_FLATTEN_END`,
`WORD_REVEAL_END`, `DWELL_END`, `GUNSHOT_END`, `CONTAINER_START`), never as fresh literals.
That is what keeps them from desyncing.

**`skyPresence(CONTAINER_START) === 0` is the contract this whole stage rests on.** At 0.86
the card interior returns to pure `NOIR.void`, which is byte-identical to what `GroundLayer`
is already painting behind it — so the existing crossfade into the next section is
completely unchanged and none of the ground files need editing. Assert it, don't assume it.

## 3. Vars — `heroVars.ts`

Add `sun`, `haze`, `sky`, `drift` to `HeroVars`; write them as `--hp-sun`, `--hp-haze`,
`--hp-sky`, `--hp-drift` in the existing per-frame `writeHeroVars` batch. Reuse the file's
existing number formatter — do not invent a second one.

The `reduced` branch returns the **settled** sky: `{ sun: 1, haze: 0.10, sky: 0, drift: 0 }`,
matching the file's existing "motionless final layout" contract. Leave `HeroStage` alone.

## 4. The layers — `SuperHeroSequence.tsx`

Inside the scaled card:

| z | Layer |
|---|---|
| 0–1 | Sky `Box` — the gradient, plus sun glow and disc as further `background-image` layers on the **same** Box |
| 2 | *(stage 5: far cloud band)* |
| 4 | the scene canvas, unchanged |
| 4.5 | *(stage 5: near cloud wisps)* |
| 5 | in-card vignette `Box` |
| 6 | DOM copy, unchanged |

Sky gradient:
`linear-gradient(180deg, zenith 0%, upper 22%, mid 44%, haze 62%, warm 80%, ember 100%)`,
with `opacity: var(--hp-sky, 1)`.

Vignette:
`radial-gradient(ellipse at center, transparent 62%, rgba(var(--dawn-cloudLoRgb), 0.28) 100%)`.

**The disc.** The reference's translucent circle is worth adopting because it is already
ours — the preloader's signature graphic is a ring, so a soft disc in the hero reads as a
callback to the loader the visitor just watched. Implement as a third `background-image`
radial on the sky Box — **no new node, no blur, no image**:

```
radial-gradient(circle at 82% 20%,
  rgba(var(--dawn-zenithRgb), 0.22) 0%,
  rgba(var(--dawn-zenithRgb), 0.13) 46%,
  rgba(var(--dawn-zenithRgb), 0.00) 47%)
```

The hard 46 → 47 % stop is deliberate: the disc should read as a *graphic* with an edge,
not a glow. `82% 20%` with a generous radius is chosen so the existing `3D PLAYGROUND`
switch pill sits **inside** the disc rather than colliding with it. **Do not move or change
the switch.** Optionally drive a `NOIR.gold` inner core at ~0.10 alpha off `--hp-sun` so the
disc doubles as the sun.

**Zero new blur layers** (README rule 5). Stage 0 measured 2 blur layers under `#hero`,
both from the toggle chip's existing `backdrop-filter`. That count must not go up.

**Also fix, while you are in this file:** stage 3 found that the color-hidden "PHITOPOLIS"
`<h1>` intercepts pointer events over the middle of the scene, so cursor interaction dies
there. Give it `pointer-events: none`. It is decorative for sighted users and load-bearing
for crawlers; it should never take input. Confirm the fix by checking that a pointer event
at plane centre now reaches the canvas.

## 5. Parallax

The lerp already exists in `HeroCanvas.tsx`'s rAF loop (`mouseCurrent`). **Do not duplicate
it, do not lift it into React, do not add a store.** Make that loop the publisher:

- Add an optional `varsHostRef?: RefObject<HTMLElement | null>` prop.
- Immediately after the lerp, `setProperty("--hp-mx", …)` / `("--hp-my", …)`.
- `SuperHeroSequence` passes the card Box's ref to **both** canvas forks.
  `R3FHeroCanvas` accepts and ignores it — leaving the vars at 0 is fine for now.

Differential parallax by depth, on the DOM layers: sky ×4px, disc ×10px. The disc gets the
strongest multiplier so it reads as a lens element in front of everything.

Reduced motion is **free**: `startLoop` already returns early when `isStatic`, so the vars
are never written and `var(--hp-mx, 0)` falls back to 0. Confirm that rather than adding a
branch.

---

## Tests

`tests/motion/hero-phases.test.ts` — additive:
- Each of the four curves pinned at **every** boundary value, matching the file's existing
  style for the curves already there.
- `skyPresence(CONTAINER_START) === 0` exactly, and `skyPresence(p) === 0` for all
  `p > CONTAINER_START`.
- Each curve is clamped to its stated range across `[0, 1]` with no `NaN`.
- `cloudDrift` is monotonically non-decreasing.

`tests/a11y-contrast.test.ts` — additive: the two worst-case motto-over-sky ratios, pinned
with the computed values.

---

## Acceptance gate

1. `yarn typecheck` clean.
2. `yarn test` — 188 passed / 3 failed (the same three pre-existing failures named in
   `stage-0-baseline.md`), plus yours. **No existing test file edited.**
3. `yarn lint` — no worse than 33 errors / 219 warnings.
4. **The handoff, asserted not eyeballed.** At progress ≥ 0.86, read the dev probe
   `window.__ground` and assert its color is `rgb(244, 247, 252)`, and that the card's
   computed `--hp-sky` is `0`. This is the seam the whole stage rests on.
5. **LCP unchanged in kind and not regressed in time.** `vite preview` on 4173,
   `PerformanceObserver` on `largest-contentful-paint`: the LCP *element* must still be the
   motto `H4.MuiTypography-h4`, **not** a sky node, and LCP must stay at or under the
   1,112 ms stage-0 figure. If the sky Box becomes the LCP candidate, stop and report —
   the fallback is to paint the gradient into the canvas instead of the DOM.
6. **Blur layers under `#hero` still 2**, not 3.
7. **Screenshots at 1440×900, progress 0 / 0.25 / 0.50 / 0.70 / 0.86.** The sunrise must be
   visible at 0 and fully gone at 0.86 with no visible seam into the next section.
8. **Parallax proof:** sample computed `--hp-mx` / `--hp-my` with the pointer at two
   different positions and show the sky and disc transforms differ.
9. **Reduced motion:** `--hp-mx` unset, sky at settled values, no rAF loop.
10. **Plane-centre pointer fix confirmed** — interaction now fires at scene centre.
11. `git diff --stat` shows only the eight files in scope.

---

## Stop conditions

- The sky is invisible → you put it behind the card. Re-read "The one hard structural fact".
- The sky Box becomes the LCP element → stop and report before working around it.
- Blur-layer count rises above 2 → stop.
- `skyPresence(0.86)` is not exactly 0, or `window.__ground` doesn't match at the seam →
  stop; that breaks the handoff and the ground files are out of scope to compensate.
- The disc and the `3D PLAYGROUND` switch visually collide and you cannot resolve it by
  moving the *disc* → report it; the switch is not yours to move.
- Any file outside scope needs to change → stop and report.

Report back with: files changed, the five screenshots, the `window.__ground` + `--hp-sky`
assertion output at the seam, the LCP element and timing, the blur-layer count, the
parallax sample, the contrast figures you computed, gate output pasted, and your read on
whether the sunrise reads as *our* brand at dawn or as a borrowed look.
