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

---

## Round 3 — Careers relight, home figures, pillars, about tail · 2026-08-24

**Goal:** three separate complaints with one cause. The site had accumulated
decorative complexity that reads as generated rather than designed. Acceptance
bar for this round was `/anthropic-skills:design-taste-frontend`.

Design read: B2B marketing site for a quant R&D firm, brand already fixed
(NOIR navy/gold, Outfit display). Mode is Redesign-Preserve. Dials moved from
roughly `VARIANCE 9 / MOTION 9 / DENSITY 6` to `6 / 4 / 3`.

Two rules from that standard drove most of the work: hand-rolled decorative SVG
is strongly discouraged (the home page had 1,855 lines of it), and "three
identical cards horizontally" is banned outright (which is exactly what the
operating pillars were).

### 3.1 · Careers back to light

The working tree had flipped the page from light to dark and grown it 465 to 797
lines. The interaction model that arrived with the dark pass is good and is
covered by 12 tests, so it was kept; only the theme and the decoration that rode
along with it were reverted.

The flip itself is three lines, because the page is written almost entirely in
CSS variables that are redefined per ground in `glass.css`. **One of the three is
easy to miss and was the whole trap:** `--g-floor` is a raw colour token
(`#04122e`) defined identically in BOTH the light and dark scopes, so flipping
`data-ground` alone leaves the page navy. It had to become `--g-void`. By
contrast `--g-page` on the next line IS ground-scoped and flips by itself.

Removed with it: per-category accent colours (collapsed to the one brand
accent), the decorative status dots, the offset folder-tab ears with their
`ml`-by-index cascade (now one hairline per group, not per row), and the stacked
translucent panel fills.

Three raw `NOIR.navyInk` references were deliberately KEPT: they are
`contrastText` on solid gold buttons, which is ground-independent.

All 12 careers tests pass unmodified.

### 3.2 · Three use-case figures

| File | before | after |
|---|---|---|
| `SignalDiagram.tsx` | 328 | **67** |
| `PipelineDiagram.tsx` | 299 | **87** |
| `FollowTheSunDiagram.tsx` | 270 | **82** |

Each is now one geometric mark on a shared spec, so the three read as a system:
one viewBox, two colours (`navyField` structure, `goldDark` accent), a 1.5/3
stroke scale. Gone: every `<defs>`, `<filter>` and `<linearGradient>`, the
`useId` calls, `FollowTheSunDiagram`'s interactive `useState`, its third accent
tone, the particle streams and the radar ping.

The draw-on gesture was re-expressed as `scaleX` rather than `stroke-dashoffset`,
because dashoffset is a paint-property animation and violates the repo's
transform/opacity rule. It reads as a wipe rather than a trace. That is a
deliberate change, not a regression.

Also deleted `UseCasesNarrative.tsx:279`, which rendered `0{index + 1} — {uc.tag}`
- a section-number label, an uppercase eyebrow and an em-dash, three separate
bans in a single line.

**The pin did not move, and that was the thing at risk.** The pin distance is a
function of card width, stack gap and card count only, none of which changed:

| | before | after |
|---|---|---|
| Slide travel, 1440 / 390 | 1811 / 663 | **1811 / 663** |
| Use-cases pin spacer | 2892 / 1573 | **2892 / 1573** |
| Card widths | 778 / 332 | **778 / 332** |

### 3.3 · Pillars as three full-bleed rows

`OperatingPillars.tsx` was a three-identical-cards grid with Phosphor icons and
no photography. It is now three stacked rows, each a full-viewport-width band
with the photograph contained at 640px inside it, image left and copy right, all
three reading the same direction.

Contained rather than edge-to-edge on purpose: the image never upscales, and
three rows in one deliberate sequence read as composition rather than as the
repetition the standard caps at two.

The images do not exist yet, deliberately. Each row renders a labelled "Image
pending" placeholder at the identical reserved aspect ratio, so the layout is
complete and the gap is visible rather than silent. The generation brief for
`/images/pillars/{research,development,support}.webp` at 2560x1440 is in the
plan file. State is per-row, so one missing asset cannot blank the others.

The component adds **no animation of its own** - that is required, not stylistic.
`SectionBeat`'s entrance fires `once: true`, so its invariant is that the DOM
default IS the final lit state; a beat whose trigger never fires must still
render visible. The section is revealed entirely by SectionBeat's existing
`grow-left` tween.

`hero-pillars` grows 1.04 to 2.20 screens at 1440 and 1.47 to 1.86 at 390. That
is the intended cost of three stacked rows. Dead scroll stayed 0 and horizontal
overflow stayed 0 at both viewports.

### 3.4 · About tail plus a page-wide eyebrow cull

| File | before | after |
|---|---|---|
| `DailyLifeSection.tsx` | 398 | **60** |
| `CertificationsSection.tsx` | 229 | **109** |
| `InternshipProgramSection.tsx` | 303 | **149** |
| `CandidatesAndCareersSection.tsx` | 403 | **351** |

`useDailyLifeVideo.ts` deleted with its only consumer.

Daily life was reimplementing HTML5 video controls by hand - play/pause, mute,
a hover volume slider, a scrub slider, a time display - and pinning the section
for `+=140%`, which inflated the pin-spacer and pushed everything below it. Both
are gone; it is a native `<video controls>` now. Browsers already do this, and
they do it with keyboard support nobody has to maintain.

Certifications lost the 88x88 circular badge ring with its double border, glow
and hover scale, the per-card chrome, and the filter tab bar (four providers is
not enough to need filtering; grouping already does the job).

Eyebrows across the About page: **11 to 3**, against a budget of 4. Two of the
removed ones were worth naming: `GRADUATE BATCH n OF m — year` was a pagination
label, an eyebrow and an em-dash at once (the year survives as a plain caption),
and the closing CTA eyebrow merely restated the heading directly beneath it.

### 3.5 · Errors and false starts this round

- **I told five agents to preserve each figure's `aria-label` verbatim. That was
  wrong.** When the drawing changes, the accessible description must change with
  it. `PipelineDiagram` was left announcing "ingest, transform, store, and
  analyze stages, with data pulses flowing between them" for a mark that draws
  four lines converging, and `FollowTheSunDiagram` announced "a timeline below"
  that no longer existed. Both rewritten by hand afterwards. A screen-reader user
  would have got a description of a figure that had been deleted.
- **The pillars shipped with `flex: 0 0 640px` on the image column.** The `md`
  breakpoint starts at 900px, where a non-shrinking 640px image plus the gap and
  the container padding leaves about 100px for the copy. Changed to `0 1 640px`
  with `minWidth: 0`. Caught by reading the code, not by the tests, which had
  nothing to say about it.
- **Six agents reported test failures that did not exist.** Each was running
  `npx vitest run` concurrently with the others, and several suites spin up their
  own preview server on a fixed port. Re-run serially at the end: 318/318, 35
  files. Every one of those "pre-existing unrelated failures" was contention.
- The careers agent left a decorative gold status dot with a glow above the page
  heading, having been told explicitly to remove decorative status dots. Removed
  by hand.

### 3.6 · Verification

| Check | Result |
|---|---|
| `npx tsc -b` | clean |
| `npx vitest run` | **318 passed / 318**, 35 files, no test modified |
| `npx eslint .` | **26 errors** (baseline 27), 81 warnings (was 83) |
| Use-cases pin span | **bit-identical** at 1440 and 390 |
| Dead scroll | 0 at both viewports |
| Horizontal overflow | 0 at both viewports |
| Careers ground | resolves `light`, body `#F4F7FC` |
| About eyebrows | 11 to 3 |
| Lines removed | ~1,290 across the seven rewritten components |

### 3.7 · Found but deliberately not fixed

- **`ServiceGlobe.tsx:488` renders `HQ · 14.5995° N, 120.9842° E [MNL]`** -
  fabricated GPS telemetry on the home page, the same invented-data pattern that
  was removed from the intro earlier today. Out of the agreed scope for this
  round. It is the strongest remaining candidate.
- **The About hero overlays pills on its photographs** (`TRUSTED COLLABORATION`,
  `ACADEMIC ENGAGEMENT`, `PHITOPOLIS R&D FIRM`), which the standard bans
  outright. Lives in the hero, not the tail sections that were in scope.
- **Em-dashes remain in copy**: 15 in `content.ts`, 14 in `routes/about.tsx`.
  The standard says zero. A full sweep is a content change and wants
  stakeholder review rather than an agent's judgement.
- **Home-page eyebrows are still over budget.** `routes/index.tsx:141` and
  several `MiniEstablishingShot` category labels. Enforcing the ratio across
  every route is its own round.
- **`JourneyTimeline`** (892 lines, 480vh of pinned horizontal scroll) is the
  single largest thing on About and was deliberately left alone.
- `daily-life.mp4` is 18.7MB. `preload="metadata"` keeps it off the load path,
  but there is an 806KB `daily-life-loop.mp4` sitting beside it that may be the
  better source.
