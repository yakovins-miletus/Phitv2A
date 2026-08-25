# WS-01 — Design system: flatten surfaces, unify the accent

**Owner files (exclusive):** `src/shared/theme/**` · `tests/a11y-contrast.test.ts` · `tests/glass-tokens.test.ts` · `tests/theme.test.tsx`
**Shared-file boundary:** `src/app/AppShell.tsx` — **only** the nav active-link colour branch (~L916-941). Do not restructure that file; other workstreams append to its warmup manifest.
**Handed to WS-03:** the hardcoded `#FFC72C` at `SuperHeroSequence.tsx:957` is a real violation of this file's rule, but WS-03 owns that file. Do not edit it here.
**Depends on:** nothing. **Blocks:** WS-10 (services), WS-11 (careers), WS-12 (contact).
**Agents:** Haiku for exploration/inventory, Sonnet for implementation.
**Acceptance bar:** `/design-taste-frontend` + taste-skill six commitments.

---

## Why

Two complaints from the brief resolve to the same file tree, which is why they are one
workstream and not two.

**1. Everything is in a box.** This is not a per-page styling habit that can be fixed page
by page. It is a theme default:

```ts
// src/shared/theme/components.ts:281-283
MuiCard: {
  // Every bare <Card> becomes glass without touching its call site.
  defaultProps: { elevation: 0, variant: "glass" },
```

Every bare `<Card>` in the app silently acquires a tinted fill, a hairline border, a card
radius, a drop shadow, and a `scale(1.01)` hover — from `components.ts:259-277` (the
`glass` / `glassRaised` Paper variants) and `components.ts:284-303`. Removing containers at
the call site is whack-a-mole; the next component anyone writes will be in a box again.

**2. The accent renders in several colours, and the repo already knows.** The brief flagged
a "dark yellow" on careers and in home's mission core, and asked why the active nav link is
navy instead of gold. Both trace to a documented, previously-failed fix. From
`src/shared/theme/palette.ts:41-49`:

> This token was retired once before, and the note above records why: half the call sites
> wrote the gold literally and never picked the bronze up, so one brand role rendered in
> four colours. It is back on a narrower contract than last time, and the contract is the
> point: **Use it ONLY where brand gold is TEXT sitting on a light ground.**

The contract is not holding. Measured in this repo, outside `src/shared/theme/`:

| Token | Call sites |
|---|---|
| `NOIR.gold` | **187** |
| `NOIR.goldInk` | **10** |

Plus one hardcoded literal that bypasses the palette entirely:
`src/features/hero/SuperHeroSequence.tsx:957` → `boxShadow: "0 0 8px #FFC72C"`.
**That fix belongs to WS-03**, which owns that file. (Two other `FFC72C` hits —
`heroCity.ts:157`, `LogoParticleField.tsx:89` — are a comment and a colour-channel
comparison; leave them.)

**The numbers behind the tradeoff.** Brand gold as text on a light ground measures
**1.45:1** on `void` and **1.49:1** on `panel` — below both the AA body floor (4.5) and the
large-text floor. `goldInk #8C5F09` measures **5.21:1 / 5.34:1 / 5.59:1** on the same
grounds. So the "dark yellow" the brief called inconsistent is the only one of the two that
is readable; the inconsistency is that it is used 10 times against gold's 187.

## Current state (verified)

- **Nav active link**, `AppShell.tsx:916-918`: on a dark ground the label is `NOIR.gold`;
  on a light ground it is `NOIR.navyField` with a gold underline
  (`AppShell.tsx:928-941`, `backgroundColor: NOIR.gold`, unconditional). This is exactly
  the asymmetry the brief describes: "when texts are white in navbar the active works
  fine… why is it still primary [on light]?"
- **`goldInk` is live**, defined at `palette.ts:51`, on the narrow contract quoted above.
- **`glass` / `glassRaised`** remain valid Paper variants — the goal is to stop them being
  automatic, not to delete them.

## ⚠️ The test will fight you — this is the trap

`tests/a11y-contrast.test.ts:216-231` contains a test named
*"gold as text on a light surface is pinned as a known sub-AA pairing"*. Its comment says
plainly: **"NOT a guard — a record."** It asserts the failing ratio *stays* failing:

```ts
expect(ratio, `gold on ${name} — ${ratio.toFixed(2)}:1`).toBeLessThan(AA_LARGE);
```

So a correct fix **breaks a currently-green test**, and a naive executor will "fix" the
test by reverting the change. Do not. The suite passing today is not evidence the palette
is correct — that test records a known failure as an accepted one.

Required: invert it. Replace the pinned-failure test with a real guard asserting that
**gold-as-text-on-light does not ship** — i.e. that the token used in that role clears
`AA_BODY`. Keep `"gold carries text on every dark surface"` (L206) and
`"goldDark is still not a text colour on light"` (L234) as-is; both stay true.

## Target state

**Surfaces.** A bare `<Card>` is flat: no tint, no border, no shadow, no hover transform.
Containment becomes something a component asks for (`variant="glass"`), never something it
inherits. Padding stays — flat is not unspaced.

**Accent — one rule, written down:**

| Context | Token |
|---|---|
| Any ground, fills / borders / icons / decorative marks | `NOIR.gold` |
| **Text on a light ground** (overlines, eyebrows, mailto links, active nav label, contained-button labels) | `NOIR.goldInk` |
| Text on a dark ground | `NOIR.gold` (measures ≥9:1) |
| Large display type on light, ≥24px/≥19px bold, decorative | `NOIR.gold` permitted, case by case |

**Nav.** Active label → `goldInk` on light, `gold` on dark. Underline stays `NOIR.gold` on
both (it is a fill, not text — no contrast obligation).

## Steps

1. **Inventory before changing anything.** Haiku agent: classify all 187 `NOIR.gold` call
   sites into fill / border / icon / text-on-light / text-on-dark. Write the result to
   `docs/workstreams/ws-01-gold-inventory.md`. Only the text-on-light bucket changes.
2. **Flatten `MuiCard`.** `components.ts:281-303` — drop `variant: "glass"` from
   `defaultProps`; remove the hover `borderColor` / `boxShadow` / `transform: scale(1.01)`
   block. Keep `padding: "24px"`, `transition: T_GLASS`, `NO_TRANSFORM_ON_REDUCE`.
3. **Leave the Paper variants intact** (`components.ts:259-277`). They become opt-in.
4. **Opt the genuine containers back in** with an explicit `variant="glass"`: the contact
   form panel, expanded careers dossiers, and any modal/drawer surface. Judgement call —
   list what you opted in and why, in the PR notes.
5. **Apply the accent rule** to the text-on-light bucket from step 1.
6. **Fix the nav branch**, `AppShell.tsx:916-918` only.
7. **Invert the pinned test** per the section above.
8. **Encode the rule where it cannot be missed** — extend the `palette.ts:36-51` docblock
   with the table above, since the last attempt failed precisely because the contract lived
   only in prose.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn tsc --noEmit && yarn test && yarn build
```

- `grep -rn "NOIR.gold\b" src/ --include="*.tsx" | grep -iE "color:|Typography"` — spot-check no gold-as-text-on-light survives.
- `grep -rn "FFC72C" src/ --include="*.tsx" --include="*.ts" | grep -v theme/` — comments only.
- `grep -rn 'variant="glass' src/ --include="*.tsx"` — every hit is a deliberate opt-in from step 4.
- Screenshot all six routes at 375 / 768 / 1440, light and dark, before and after. Flattening removes the borders that were doing the grouping work; anything that reads as mush needs spacing, **not** its border back.
- Contrast: every changed text token ≥4.5:1 against its ground.

## Out of scope

Page-level layout and copy (WS-10/11/12 own those, and are defined against this file's
output). Diagram redesign (WS-07). `SuperHeroSequence.tsx` in its entirety (WS-03).
Anything else in `src/features/**` beyond the mechanical accent swaps from step 5.
