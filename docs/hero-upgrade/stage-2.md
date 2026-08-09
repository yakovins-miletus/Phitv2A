# Stage 2 — Interaction gate rework

**Tier:** Sonnet · **New geometry:** none
**Read first:** `docs/hero-upgrade/README.md`, `docs/hero-upgrade/stage-0-baseline.md`,
`docs/hero-upgrade/stage-1.md` (whose `heroPointer.ts` you are extending)

---

## Goal

Cursor interaction in the default hero is currently invisible to almost every visitor. It
is double-gated:

- **Scroll gate:** every handler hard-returns at `progressRef.current >= 0.02` — the first
  2 % of a pin that runs `+=1900%`. And it doesn't fade, it *snaps*: at 0.0199 the scene
  is tilted under the cursor, at 0.0201 it is not.
- **Toggle coupling:** the on-canvas indicator calls the state "Playground active", which
  reads as an opt-in tied to the `3D PLAYGROUND` switch, even though the switch actually
  selects the R3F variant.

After this stage, **interaction is a permanent property of the default hero**: on by
default, no toggle, and fading smoothly out as the scene flattens rather than cutting off.

Also fixes a latent bug: the canvas currently takes `pointerEvents: "auto"` on **touch**
devices, where it can swallow the opening scroll gesture.

**Done means:** interaction is live from the moment the page settles, its strength decays
to nothing by 10 % scroll with no visible step, and it never captures pointer events on a
coarse pointer. No new visual elements — this is the *same* interaction, correctly scoped.

---

## Files in scope

| Path | Mode |
|---|---|
| `src/features/hero/heroPointer.ts` | **additive** — the gate functions |
| `src/features/hero/HeroCanvas.tsx` | **modify** — apply the gates, deps, indicator copy |
| `tests/motion/hero-pointer.test.ts` | **additive** — gate tests |

Do not touch `heroPhases.ts`, `heroCanvasRenderer.ts`, `heroScene.ts`, `heroVars.ts`,
`SuperHeroSequence.tsx`, `R3FHeroCanvas.tsx`, or `PlaygroundScene.tsx`. **The `use3D`
switch stays exactly as it is** — this stage decouples interaction *from* it, it does not
remove or move it.

---

## The gate

Add to `heroPointer.ts`:

```ts
/**
 * Derived from the phase boundary, never restated — so a change to
 * PHASE_FLATTEN_END can't silently desync the interaction window.
 */
export const INTERACT_END = PHASE_FLATTEN_END * 0.5;   // 0.10
export const HIT_TEST_END = 0.04;

export function interactStrength(progress: number): number {
  return Math.max(0, Math.min(1, 1 - progress / INTERACT_END));
}
```

`PHASE_FLATTEN_END` is `0.20`, exported from `heroPhases.ts:17`. **Import it; do not write
`0.10` as a literal anywhere.**

**Why 0.10 is the right end point:** `sideFaceOpacity(flattenProgress(0.10))` is `0.1`.
Past that there is essentially no 3D surface left to tilt, light, or lift — the interaction
has nothing to act on. It is the last progress value where the effect is meaningful, and
the existing suite already pins that number.

`heroPointer.ts` is pure and DOM-free. Keep it that way — importing a constant from
`heroPhases.ts` is fine; importing React or touching `window` is not.

### Three tiers

| Tier | What | Gate |
|---|---|---|
| **0** | Camera tilt (and, from stage 3 on, cursor light / hover lift / ripple / signal bow) | `progress < INTERACT_END`, with **amplitude multiplied by `interactStrength(progress)`** — fades, never snaps |
| **1** | Click hit-testing and the ripple cascade | hard `progress < HIT_TEST_END` **and** `pointerFine` |
| **2** | `canvas.style.pointerEvents = "auto"` | `pointerFine && interactStrength(progress) > 0` |

Tier 0 is the important one and the easy one to get wrong: the tilt coefficient stays
`0.14`, the lerp stays `0.08`, but the *target* is scaled by `interactStrength` so the
scene eases back to rest as you scroll instead of jumping there. Existing behavior at
progress 0 must be **identical** — `interactStrength(0) === 1`, so it falls out for free.
Verify that rather than assuming it.

---

## Wiring in `HeroCanvas.tsx`

Today's four hard cut-offs (currently around lines 178, 238, 289, 334 — re-read, stage 1
moved them) each become one of the tiers above. Specifically:

- `isPlaygroundActive` disappears as a concept. The pointer-events line becomes tier 2.
- `onMouseMove`'s early return becomes tier 0: it should keep updating `mouseTarget` for
  the whole tier-0 window, not just the first 2 %.
- `onClick` / `triggerCascade`'s guards become tier 1.
- The `RippleScheduler` re-check at fire time uses `HIT_TEST_END`.
- The indicator `<div>` opacity currently ramps on `1 - progress / 0.02`. It should ramp on
  `interactStrength` instead so it fades with everything else.

**`usePointerFine()`** already exists at `src/shared/motion/index.ts:37` — its own docblock
says it is for exactly this ("gates affordances", as opposed to `useDeviceTier` which gates
cost). Call it in the component.

**The effect-deps trap:** the main effect is keyed `[isStatic]`. It must become
`[isStatic, pointerFine]`, or a pointer-type change never re-wires the listeners. This is
easy to miss and produces a bug that only shows on hybrid devices.

**Indicator copy.** It currently reads:

> `[ Playground active: move cursor to tilt // click elements to ripple ]`

"Playground active" is now wrong — this isn't a mode. Replace it with copy that describes
the affordance without claiming a state, in the same monospace/bracketed house style, e.g.
`[ move cursor to tilt // click to ripple ]`. Keep it `aria-hidden` if it isn't already
(the canvas is decorative). If you think the indicator should disappear entirely now that
interaction is always-on, **say so in your report — don't decide it yourself.**

---

## Tests

Add to `tests/motion/hero-pointer.test.ts`:

- `interactStrength(0) === 1` exactly, and `interactStrength(INTERACT_END) === 0` exactly.
- Monotonically non-increasing across `[0, 1]` sampled finely (mirror the monotonicity
  style already used in `tests/motion/hero-scene.test.ts`).
- `INTERACT_END` is **derived**: assert it equals `PHASE_FLATTEN_END * 0.5`, so a future
  edit to the phase boundary either follows or fails loudly.
- `HIT_TEST_END < INTERACT_END` — tier 1 is strictly inside tier 0.
- Clamping: negative and >1 progress values return 1 and 0 respectively, no `NaN`.

Plus a jsdom smoke test on `HeroCanvas` (the existing suite shows the pattern) asserting
`pointerEvents` stays `"none"` when `pointerFine` is false. Note jsdom has **no working 2D
context** — see rule 6 in the README; the component must not throw on that path.

---

## Acceptance gate

1. `yarn typecheck` clean.
2. `yarn test` — **163 passed / 3 failed** (the same three pre-existing failures named in
   `stage-0-baseline.md`), plus your new cases. No existing test file edited.
3. `yarn lint` — no worse than **33 errors / 219 warnings**.
4. **Behavior at progress 0 is unchanged.** Same canvas checksum method stage 1 used
   (`getImageData` sum under `reducedMotion: reduce`) — the resting frame must not move.
5. **Manual proof of the fade**, driven by Playwright at 1440×900: sample the camera tilt
   or the indicator opacity at progress 0.00, 0.02, 0.05, 0.10, 0.12 and show it decays
   smoothly to 0 and stays there. Paste the numbers. The old code would show a cliff
   between 0.02 and 0.021; yours must not.
6. **Coarse pointer**: with `hasTouch: true` / coarse pointer emulation, assert
   `canvas.style.pointerEvents` is `"none"` at progress 0 and the page still scrolls.
7. `git diff --stat` shows only the three files listed above.

---

## Stop conditions

- Removing the `use3D` switch or changing what it does → **not yours**. Stop.
- The resting frame checksum moves → stop; the gate change must not alter progress-0 paint.
- You conclude the indicator div should be deleted → report the recommendation, don't act.
- Any file outside the scope list needs to change → stop and report what and why.

Report back with: files changed, the tilt/opacity-vs-progress table proving the smooth
fade, the coarse-pointer result, the checksum comparison, gate output pasted, and any
recommendation you deliberately did not act on.
