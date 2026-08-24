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

---

## Round 2 — Problem → Production, one screen · 2026-08-24

**Goal:** the section measured **4.05 viewports** (the diagram alone 3.34). Bring
it to exactly one, and replace the vertical pipeline with a composition that
actually carries the intended semantics.

### 2.1 · The metaphor

`docs/adr/0002-problem-to-production-metaphor.md` (proposed) holds the reasoning
trail. The short version: `prefers-reduced-motion` must receive a *static*
composition, and a still frame has no time — so any step-by-step form cannot
carry the meaning at all, regardless of height. The pipeline was not merely too
tall, it was the wrong category of diagram. Adopted: **containment and
refinement** — many raw problems in an open field, two of them named, drawn
across a material boundary into a Phitopolis vessel where Build and Operate are
visibly *interior*, resolving to one refined artifact.

Inversion disqualified four shapes before any aesthetic discussion: converging
funnel, orbit/particle swirl, WebGL scene, long scrub choreography. Those
exclusions are restated in the component header so they don't get reintroduced.

### 2.2 · What changed

| File | Change |
|---|---|
| `diagrams/ProcessDiagram.tsx` | Rewritten. Vertical spine + traveling payload gone. Two structurally distinct compositions — horizontal (field · vessel · artifact) at md+, vertical at xs — selected by `useMediaQuery`, not one layout reflowed. |
| `home/components/ProcessSection.tsx` | Establishing shot removed; its copy inline. Slab now fills the beat. |
| `shared/content.ts` | `CONTENT.process` from `{number,label,caption}[]` to role-based `{intake, rawCount, enclosed, output}`. |
| `shared/sections.ts` | `establishScale: "major"` → `"mini"`; label `"Process Pipeline"` → `"Problem To Production"` (the old name described the design that was just deleted). |
| `tests/process-diagram.test.tsx` | Rewritten for the role model — 4 tests, same count. |
| `diagrams/process/*` (5 files) | Deleted. Sub-components of the spine, no remaining importer. |

**The establishing shot had to go.** Measured breakdown at 1440×757 before the
cut: `80 (beat py) + 379 (mini shot) + 695 (content) + 80 = 1234px`. A "mini"
shot still reserves 0.5 screens, which left ~218px for the composition it was
announcing — not enough for anything. `ProcessEstablishingShot.tsx` is kept
(`/services` is the likely reuse) but now has no caller on the home page. This
is a design call worth a second opinion; it is not forced by the ADR.

### 2.3 · Errors and false starts this round

- **First render was structurally broken and I shipped it to a screenshot before
  looking at it.** Every absolutely-positioned child resolved against an inner
  wrapper of `height: auto` instead of the sized container, so the two intake
  chips landed superimposed on each other at the top and the vessel collapsed.
  The fix was to stop threading one DOM tree through a dozen responsive `sx`
  objects and write the two compositions as two explicit branches.
- **`preserveAspectRatio="none"` turned every SVG `<circle>` into a visible
  ellipse.** The distortion that makes the 0–100 coordinate space track the
  container is the same distortion that ruins round things. Lines survive it
  (with `vector-effect: non-scaling-stroke`); discs are DOM elements now.
- **The chamfered rim drew as a broken rectangle.** `clip-path` clips an
  element's own rendering, inset box-shadow included, so a single box with
  `clipPath` + `inset 0 0 0 1px` erased the rim along exactly the chamfered
  corners it existed to describe. Replaced with a gold outer box holding a 1px
  inset, identically clipped inner box.
- **The first "enclosure" failed its own ADR gate.** `navyPanel` on `navyDeep` is
  a ~2% luminance step — inside and outside read as the same material with a
  line between them, which inversion #4 explicitly disqualified. Now `navyField`
  with its own finer gold grid.
- **Three "375px" measurements in this session were actually taken at 490px.**
  The CDP harness's `launch({width})` sets the window, not the viewport; Chrome
  gave back `clientWidth: 490`. Every mobile number before the
  `Emulation.setDeviceMetricsOverride` fix was wrong, including one that read
  1.12 screens. All figures below are re-measured at a true 375.

### 2.4 · Numbers

| Measurement | Before | After |
|---|---|---|
| `process` footprint @1440 | 4.05 screens | **1.00** |
| `process` footprint @768 | — | **1.00** |
| `process` footprint @375 | — | **1.00** |
| Page `scrollHeight` @1440 | 19625px (25.9 screens) | 16555px (18.4 screens) |
| Footer dead space, all 3 viewports | 1px | 1px (unchanged) |
| Horizontal overflow, all 3 viewports | — | 0px |
| `/` LCP · CLS | 244ms · 0 | 264ms · 0 |

Reduced-motion falsifier (ADR-0002): a static 375px capture with motion disabled
reads as many things in the field, two named, an enclosure labelled "Inside
Phitopolis" holding Build and Operate, one output. Passes.

Animated path: after wheel-driven scroll into the section (Lenis ignores
`window.scrollTo`), **0 elements** inside `#process` remain below 5% opacity —
the entrance timeline completes and nothing is stranded.

### 2.5 · Verification

| Check | Result |
|---|---|
| `npx tsc -b` | clean **for the files this round touched** — see below |
| `npx vitest run` | 263 passed at 09:19; 259/263 at 09:24 — see below |
| `npx eslint .` | 27 errors at 09:19; 31 at 09:24 — see below |
| Jitter / pin probes | not re-run this round — the hero was untouched |

### 2.6 · Left undone, and one thing that went wrong outside this work

**A concurrent session rewrote two files mid-round.** At 09:20,
`shared/components/TransitionCurtain.tsx` (−560/+40) and
`shared/components/Preloader.tsx` (−577/+72) were reverted in the working tree to
a revision far older than HEAD, by an Antigravity teamwork run operating in the
same directory. Consequences, none of them caused by this round's changes and
none of them fixed here:

- Round 1's `aria-live` announcer is gone from the tree, so its guard test
  `tests/motion/no-dead-scroll.test.ts` fails. The fix is still in `dist/` only
  because that build predates 09:20.
- Both files now `import gsap` at module scope and `TransitionCurtain`
  statically imports `SmoothScroll` (hence lenis), putting both libraries in the
  eager bundle on every route — a direct violation of the bundle rule in
  `CLAUDE.md`.
- `Preloader`'s manifest-driven warm-up (`e81edda`) is gone; `warmup?:
  LoadSignal[]` is still declared but never read.
- `tsc -b` and `eslint` fail in those two files; 3 preloader tests fail.

Those files are deliberately **not** in this round's commit and were not touched
or reverted — a separate brief has been handed to that team to restore them.

Still open from Round 1: `/about` LCP variance (2008 → 1424 → 1432ms, unexplained)
and the pre-existing `Transitioner`/`AppShellInner` React console error.

New this round: the slab's `calc(100svh - 160px)` duplicates `SectionBeat`'s own
`py` because SectionBeat exports no token for it. If that padding changes, this
breaks silently. A shared constant would be the honest fix.
