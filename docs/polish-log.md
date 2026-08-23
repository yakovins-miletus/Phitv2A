# Polish log

Append-only, chronological. One entry per round. Records what changed and why,
audit numbers **before and after**, and every error hit along the way —
including false starts and my own wrong turns. A log that records only successes
is a marketing document.

Conventions: measurements come from the CDP harness
(`.claude/skills/web-audit/scripts/cdp.mjs`) against the **production build**
(`yarn build` + `vite preview`), never the Claude Code Browser pane — that tab
reports `visibilityState: "hidden"`, so `requestAnimationFrame` never fires and
GSAP is frozen there.

---

## Round 1 — Correctness · 2026-08-24

**Goal:** two structural defects that distort every later measurement.

### 1.1 · One full viewport of dead scroll below the footer, on every route

*Reported as:* "when scrolling through the pages i find myself scrolling past the footer".

**Root cause.** `src/shared/components/TransitionCurtain.tsx` renders the
curtain's screen-reader announcer as a visually-hidden box:

```jsx
sx={{ position: "absolute", width: 1, height: 1, clip: "rect(0 0 0 0)" }}
```

In MUI's `sx` system a **unitless number is a ratio**, so `width: 1` compiles to
`width: 100%` — not `1px`. `#root` is `position: static`, so this
absolutely-positioned box resolved against the *initial containing block* (the
viewport) and rendered a full `100vh`, parked at `top: <body height>`. `clip`
hides it visually but contributes nothing to layout or scroll extent — hence an
invisible element that was nonetheless fully scrollable.

Diagnosis path, for the record: measured `scrollHeight − bodyHeight` = exactly
one viewport on all three routes; `/services` reproduced it despite having **no
pin-spacers**, which ruled out ScrollTrigger; walking the DOM for elements whose
bottom exceeded `scrollHeight − 30` returned exactly one node, and its parent
chain was `div[aria-live=polite] → #root`.

**Fix.** `width: "1px", height: "1px"`.

| Route | dead space before | after |
|---|---|---|
| `/` | 757px (1.00 screens) | **1px (0.00)** |
| `/about` | 757px (1.00) | **1px (0.00)** |
| `/services` | 757px (1.00) | **1px (0.00)** |

`/` document height: 19621px → **18865px**.

**Guard.** `tests/motion/no-dead-scroll.test.ts` — fails if any `sx` block
combines a `clip: rect(...)` hide with a unitless `width`/`height`, and asserts
the announcer specifically uses pixel units.

### 1.2 · Navbar stayed `minimal` for 19 viewport-heights

**Root cause.** `AppShell.tsx` gated the home navbar on
`window.scrollY < window.innerHeight * 19`. That literal was correct only while
the hero pin was `+=1900%`. The pin was later shortened to `+=800%` and this was
never updated — so on a ~26-screen page the navbar stayed transparent for ~73% of
the document and the glass treatment was effectively unreachable.

The same fact was independently encoded in **three** places and two of them had
drifted:

| File | Encoded as | Correct? |
|---|---|---|
| `SuperHeroSequence.tsx` | `HERO_PIN_DISTANCE = "+=800%"` | source of truth |
| `EyeFlow.tsx` | `const heroHeight = 9 * winH` (×2, hand-written) | right value, duplicated |
| `AppShell.tsx` | `innerHeight * 19` | **stale** |

**Fix.** New gsap-free module `src/shared/motion/heroPin.ts` exporting
`HERO_PIN_SCREENS`, `HERO_TOTAL_SCREENS`, `HERO_PIN_DISTANCE` and
`heroTotalHeight(vh)`. All three consumers now derive from it. Kept gsap-free
deliberately so `AppShell` — an eager-bundle module — can import it, same
reasoning as `scrollTriggerBridge.ts`.

Measured navbar glass/tint engagement on `/`:

| | before | after |
|---|---|---|
| First decorated screen | ~19 | **9** (= `heroTotalHeight`) |

Dark/light tint flips still track the ground correctly: white tint over screens
9–11, dark `rgba(30,30,30,0.25)` over the navy sections at 18–19.

### Errors and false starts this round

- The first version of `no-dead-scroll.test.ts` asserted against a 700-character
  regex window on the source. My own explanatory comment pushed the assertion
  past that window and the test failed on correct code. Widening the window to
  2500 chars *also* failed — the multiline regex was simply brittle. Replaced
  with `indexOf` + a plain slice. Noted because a test that fails on correct code
  is worse than no test.
- First navbar probe measured `backgroundColor` on the `<header>` element and
  reported "always transparent" at every scroll depth. That was the probe being
  wrong, not the navbar: in glass mode the AppBar is `bgcolor: transparent` by
  design and the tint lives on a child layer. Re-probed across all descendants
  for `backdrop-filter` / non-transparent background.

### Verification

| Check | Result |
|---|---|
| `npx tsc -b` | clean |
| `npx vitest run` | **263 passed / 263** (261 + 2 new) |
| `npx eslint .` | 27 errors, 91 warnings — unchanged from baseline |
| Footer probe | dead space 757px → **1px** on all 3 routes |
| Navbar probe | glass engages at screen **9**, was 19 |
| Jitter probe | `hero-pillars` 0px, `hero-position` 0px |
| Production vitals | `/` LCP 244ms CLS 0 · `/about` LCP 1432ms CLS 0 · 0 console errors |

### Left undone

- `/about` LCP has swung 2008 → 1424 → 1432ms across runs with no code change to
  explain the first reading. Unpinned; needs a repeated-run methodology before
  any perf claim is trustworthy.
- Pre-existing React console error on every route
  (`Cannot update a component (Transitioner) while rendering AppShellInner`).
  Untouched — it lives in files that were already dirty before this work began.
