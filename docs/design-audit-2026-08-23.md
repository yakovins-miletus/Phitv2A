# Design-system audit — 2026-08-23

Brief: audit the site to Apple-level refinement and readiness.

**The brand is not the problem.** Navy/gold, the isometric 3D hero, the mono meta-rail —
it passes the slop test: you would remember it, and swapping the company name would make
it wrong rather than merely different. What undermines it is inconsistency. The site
behaves as if it has no design system, while a real one sits in the theme unused.

Measured against the production build, not inferred from source.

---

## What was measured

| | found | bar |
|---|---:|---|
| Distinct literal `fontSize` values | **57** (+76 responsive objects) | 6–8 |
| Distinct `lineHeight` values | 16 | 3–4 |
| Distinct `letterSpacing` values | 20+ | 2–3 |
| Distinct `borderRadius` values | 24 | 4 (tokens already exist) |
| Distinct `boxShadow` values | 50+ | 3 (tokens already exist) |
| Raw-hex lint warnings | 81 across 44 files | 0 |
| Card treatments | 7+ | 1–2 |
| CTA treatments | 4+ | 1–2 |
| Section `py` values | 6 | 3 |

Much of that is not variety, it's noise: 0.68 / 0.6875 / 0.7rem are the same size to the
eye, as are 0.72 / 0.74 / 0.75 / 0.76 / 0.78.

**The key insight**: `glass.css` *already* defines `--r-control/--r-card/--r-panel/--r-pill`
and `--glass-shadow-1/2/3`, and `theme.ts:123-135` documents that the corner language is
deliberately owned by them. The system exists. The code just doesn't use it. That makes
this consolidation, not invention.

### Real defect found
`theme.ts` defined `xl: 1536` **and** `"2xl": 1536` — identical values. Every
`<Container maxWidth="2xl">` (`Section`, `SectionBeat`, `MajorEstablishingShot`,
`InternshipProgramSection`) silently resolved to the same width as `xl`; the wider tier
those call sites believed they were opting into never existed.

### Accessibility defect found
`BlogSection`'s article cards were `<Box onClick={navigate(...)} sx={{cursor:"pointer"}}>`
with no `role`, `tabIndex` or key handler — invisible to the keyboard, unannounced by
screen readers, impossible to open in a new tab.

### Verified good — left alone
No horizontal overflow at 390px or 1440px. Disciplined `100vw` usage (every instance is
pinned or intentional). The grounds/dark-band system is coherent and contrast-tested.
Form state coverage is complete: contact and careers both implement loading, success,
error, validation and a honeypot; blog and careers lists both have empty states.

---

## What was changed

1. **Removed the duplicate `2xl` breakpoint** and repointed all 7 references to `xl`.
   Visually a no-op *today* (the values were identical) — the point is that the trap is
   gone. Rejected the alternative of giving `2xl` a real value: a fourth tier above `lg`
   is the same sprawl this pass removes. `3xl` (1920) is currently unused by any call
   site but is a genuinely distinct value, so it stays.

2. **Cookie banner — the fix was copy, not geometry.** It was already compact (720px);
   what bloated it was *three sentences of developer TODO rendered as user-facing UI*
   ("AWAITING LEGAL REVIEW… Replace it with counsel-approved language…"). Measured: it
   covered the hero's CTAs at 1440×900 and took ~1/3 of the viewport at 390×844 — the
   first thing any visitor saw was the site apologising for itself. Now one line with a
   small "Draft" chip, ~1/8 of the mobile viewport.
   - The instruction moved into a code comment, where notes to ourselves belong.
   - **No legal language was invented.** The rendered copy states only that the notice is
     provisional and claims nothing about what is or isn't set — the component's own doc
     comment explicitly declined to assert the cookie posture as settled fact, and that
     restraint was preserved.
   - **No Accept/Reject pair was added.** The wiring is dismiss-only, so consent buttons
     would imply a choice was recorded when none is.

3. **Defined the type scale** in `theme.ts`: `TYPE_SCALE` (8 steps), `LINE_HEIGHT` (3),
   `TRACKING` (3). Every MUI variant (`h1`–`h4`, `body1/2`, `subtitle1`, `overline`) now
   derives from it, so `variant=` and token usage cannot drift apart. Added a `micro`
   variant for the mono meta-rail (the register that was drifting between 0.68–0.7rem)
   and gave `caption` a theme entry — MUI ships it, it simply had none, which is why the
   codebase hand-rolled 0.72–0.78rem equivalents.

4. **`BlogSection` cards rebuilt as real anchors.** `RouterLink` gives keyboard access,
   focus, and open-in-new-tab for free — strictly less code than bolting
   `role`/`tabIndex`/`onKeyDown` onto a div. Hover moved from React state to CSS
   `:hover`/`:focus-visible` descendants, which also removed two full card re-renders per
   pointer crossing and made the hover treatment work for keyboard users, which the
   mouse-only handlers never did. Radius/shadow now use the glass tokens; `rgba()`
   literals now use the existing `NOIR.*Rgb` triplets.
   Verified in-browser: 3/3 cards are `<a>`, focusable, correct `href`; 0 clickable divs.

---

## Not done, and why

- **The preloader stays.** It forces **~5.74s before any content appears** (4.29s scripted
  entrance + 1.45s exit) and is *not* gated on load speed — measured, content only appears
  between the 4s and 7s marks. This is the single largest perceived-performance cost on
  the site and it entirely masks the 268KB JS reduction from the previous session. Kept at
  the owner's explicit direction as an intentional brand statement. Recorded here so the
  trade-off stays visible rather than being rediscovered.
- **`privacy.tsx` / `terms.tsx`** remain 14-section "awaiting legal review" scaffolds, per
  the same direction. These are a genuine launch blocker and need counsel, not code.
- **The bulk migration.** The scale, rhythm and measure systems are *defined*; only
  `BlogSection` and the cookie notice consume them so far. The remaining ~40 files still
  carry the 57 font sizes and 81 hex warnings. This was deliberately scoped to "tokens +
  high-traffic surfaces" — the pattern is proven end-to-end on one representative file,
  and the rest is mechanical follow-up.

## Open items for a follow-up

- Apply `TYPE_SCALE`/`micro`/`caption` across the remaining call sites; migrate the rest
  of the `rgba()` literals, then extend the eslint rule to catch `rgba(10,42,102` and
  `rgba(255,255,255` (**land those two together** — the rule reveals the violations, so
  adding it first would blow the warning baseline).
- Section rhythm (`compact`/`default`/`spacious`) and body-copy measure (~65ch) are
  designed but unapplied. Constraining narrative copy changes section heights, which can
  disturb `SectionBeat` pin/scroll math — verify motion after.
- Button consolidation: raw `<Button>` still in `ContactForm`, `ServiceDrawer`,
  `DetailedServiceList`, `EcotowerMap`, `JobDetailsDrawer`, `NotFoundPage`, `ErrorPanel`.
- `MetricCard`/`StatStrip` have no card chrome at all — deliberate "flat stat" variant or
  an inconsistency? A design call, not a mechanical one.
- The right-hand chapter rail (`EyeFlow`) stacks 9 low-contrast labels and reads closer to
  debug UI than navigation.
- `/services` has no offline fallback and renders its error state when the API is down,
  while `BlogSection` has `FALLBACK_BLOG_PAGE`. Inconsistent resilience — worth aligning.

## Verification

`yarn typecheck` clean · **253 tests pass** · `yarn lint` unchanged at the pre-existing
27 errors / 105 warnings · no horizontal overflow at 390 or 1440 · bundle guard confirms
three.js is still off the home critical path.

Screenshots must be taken over CDP, not the in-app Browser pane (which freezes
`requestAnimationFrame`, so scroll-driven sections never settle) — and any capture must
wait past the ~5.74s preloader.
