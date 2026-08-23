# PRD-home-client-focus — Client-Centred Home Page

| Field | Value |
|---|---|
| ID | PRD-home-client-focus |
| Status | **Approved** |
| Stakeholder | yaakovins (product owner, Phitopolis) |
| Author | /product-brief |
| Created | 2026-08-23 |
| Last updated | 2026-08-24 |
| Inputs | Stakeholder interview 2026-08-23 (two rounds); `docs/scroll-audit-2026-08-23.md`; `docs/design-audit-2026-08-23.md`; root `CLAUDE.md`; `/Users/yaakovins/.claude/plans/not-sure-if-you-proud-llama.md` (approved implementation plan) |

> **Tooling note.** `/product-brief` references `gherkin-guide.md` for AC phrasing
> rules; that file is **not present** in the installed skill
> (`…/skills/product-brief/` contains only `SKILL.md` and `prd-template.md`).
> The acceptance criteria below therefore apply general Gherkin/BDD practice from
> memory — one behaviour per scenario, observable outcomes, no coupling to widget
> names. Any best-practice claim traceable only to that missing guide is marked
> `[UNCITED]`.

---

## 1. Problem Statement

The Fresko home page is built as a two-act narrative: **SERVICES** (hero →
capabilities → process → global reach) followed by **PEOPLE** (behind-the-code
film → careers → testimonials → blog). The second act is recruiting material,
and it occupies the back half of the page that institutional clients, investors
and partners land on first. A prospective client scrolling for evidence of
delivery capability instead reaches culture video and staff quotes, then a
closing shelf of four photo frames that says nothing about what the company
operates.

The page also carries an engineering artefact the audience was never meant to
see — a 3D "playground" gallery toggle in the hero, built to compare scene
variants — and a "four disciplines" capability grid duplicated verbatim from
`/services`.

Separately, and now fixed, content in the Operating Pillars and Market Position
sections visibly slid up and down during scroll (34px and 17px of measured
translate drift). That defect is recorded here for traceability only; it shipped
before this PRD (see §10).

---

## 2. Personas

### P1 · Dana — Institutional Client Evaluator
- **Role / context:** Head of technology at a trading firm or fund, arriving from a referral or a search for quantitative engineering partners. Evaluates on desktop, in a tab among four competitors.
- **Goal:** Establish in one scroll whether this firm builds and runs systems at the scale and reliability her mandate requires.
- **Pain today:** The back half of the page pivots to recruiting content. She reads culture video and staff testimonials where she expected delivery evidence, and the page ends on decorative photo frames rather than a statement of operational footprint.
- **Success looks like:** She reaches the end of the page with a concrete picture of the systems the firm runs and the technologies behind them, and never encounters hiring content she did not ask for.

### P2 · Marcus — Stakeholder / Investor
- **Role / context:** Existing or prospective capital partner, often on the page to re-check the firm's positioning before a conversation or to forward the link to a colleague.
- **Goal:** See breadth and seriousness of what the firm operates — how many systems, built on what — without needing an NDA-covered client list.
- **Pain today:** Nothing on the page conveys operational breadth. Global reach shows arcs on a map; the closing shows photographs. Neither answers "how much do they actually run?"
- **Success looks like:** The page closes on a legible representation of many systems in operation, which he can forward with no confidentiality concern.

### P3 · Priya — Engineering Candidate
- **Role / context:** Graduate or mid-career engineer researching the firm, arriving via `/careers` or a job posting.
- **Goal:** Understand the culture, the people, and what daily work looks like.
- **Pain today:** None acute — she is currently well served by the home page. **This PRD deliberately degrades her home-page experience and must not degrade her overall one:** every piece of content she relies on moves to `/about`, intact and in order.
- **Success looks like:** `/about` tells the complete talent story — culture film, testimonials, careers, blog feed — and every existing entry point still reaches it.

> **Deferred audience:** the general/press reader is not modelled separately;
> their needs are a subset of P2's. Recorded in §5.

---

## 3. User Stories

### US-1 · Home page reads client-first end to end — `Must`

> As Dana (P1), I want the home page to speak only to delivery capability, so that I can evaluate the firm without wading through recruiting content.

**Cost of Delay**

| User-Business Value | Time Criticality | Risk Reduction / Opportunity Enablement | CoD (sum) |
|---|---|---|---|
| 13 | 8 | 5 | **26** |

**Acceptance Criteria**

- **AC-1**
  ```gherkin
  Given a visitor is on the home page
  When they scroll from the top of the page to the bottom
  Then no culture film, staff testimonial, blog teaser, or hiring content is presented at any point
  ```
- **AC-2**
  ```gherkin
  Given a visitor is on the home page
  When they scroll from the top of the page to the bottom
  Then the narrative proceeds as mission, operating pillars, market position, applied use-cases, delivery process, global footprint, and operational footprint, in that order
  ```
- **AC-3**
  ```gherkin
  Given a visitor is on the home page
  When the page presents its capability narrative
  Then the capability taxonomy previously duplicated from the services page is not repeated on the home page
  ```
- **AC-4**
  ```gherkin
  Given a visitor is anywhere on the home page
  When they look for a way to begin an engagement
  Then a contact call-to-action is offered both in the opening view and again in the closing section
  ```

### US-2 · Talent narrative relocates to /about without loss — `Must`

> As Priya (P3), I want the culture, testimonial, careers and blog content to live on the about page, so that the talent story stays complete even though it left the home page.

**Cost of Delay**

| User-Business Value | Time Criticality | Risk Reduction / Opportunity Enablement | CoD (sum) |
|---|---|---|---|
| 8 | 8 | 8 | **24** |

**Acceptance Criteria**

- **AC-1**
  ```gherkin
  Given a visitor is on the about page
  When they scroll through it
  Then the culture film, the staff testimonials, the careers summary, and the blog feed are all present
  ```
- **AC-2**
  ```gherkin
  Given the culture film relies on a scroll-pinned sequence
  When a visitor scrolls through it on the about page
  Then the sequence pins, plays and releases exactly as it did on the home page
  ```
- **AC-3**
  ```gherkin
  Given any existing link or navigation entry that previously reached the relocated content
  When a visitor follows it
  Then they arrive at that content in its new location rather than at a missing anchor
  ```
- **AC-4**
  ```gherkin
  Given the site's chapter rail and navigation report the reader's position
  When a visitor scrolls either the home page or the about page
  Then the reported chapter and the navigation's light/dark treatment match the section actually on screen
  ```

### US-3 · Operational footprint closing scene — `Must`

> As Marcus (P2), I want the page to close on a wide view of the many systems the firm operates, so that I can gauge operational breadth and forward the page without confidentiality concerns.

**Cost of Delay**

| User-Business Value | Time Criticality | Risk Reduction / Opportunity Enablement | CoD (sum) |
|---|---|---|---|
| 13 | 5 | 8 | **26** |

**Acceptance Criteria**

- **AC-1**
  ```gherkin
  Given a visitor reaches the final section of the home page
  When the section comes into view
  Then a three-dimensional field of roughly thirty system nodes is presented, dense enough that operational breadth is legible at a glance
  ```
- **AC-2**
  ```gherkin
  Given the closing section is presented to any visitor
  When its contents are inspected in full, including all underlying data
  Then no client, customer, partner or counterparty is identifiable by name, logo or description
  ```
- **AC-3**
  ```gherkin
  Given a visitor has expressed a system preference for reduced motion
  When they reach the closing section
  Then a static composed view is presented with no camera movement and no orbital animation
  ```
- **AC-4**
  ```gherkin
  Given a visitor's device cannot present three-dimensional content
  When they reach the closing section
  Then an equivalent static visual is presented and the page never ends on empty space
  ```
- **AC-5**
  ```gherkin
  Given the technologies shown in the closing section are also listed on the about page
  When either list is changed
  Then both presentations reflect the change, with no possibility of the two disagreeing
  ```
- **AC-6**
  ```gherkin
  Given the closing field presents roughly thirty nodes
  When a visitor views the field
  Then only the nodes nearest the viewpoint carry archetype labels, and the remainder read as unlabelled silhouettes
  ```
- **AC-7**
  ```gherkin
  Given a visitor has reached the closing section
  When they decide to act on what they have seen
  Then a contact call-to-action is present within that section
  ```

### US-4 · Retire the playground gallery from the public hero — `Must`

> As Dana (P1), I want the hero to present one deliberate composition, so that I am not offered an internal scene-comparison tool while evaluating a vendor.

**Cost of Delay**

| User-Business Value | Time Criticality | Risk Reduction / Opportunity Enablement | CoD (sum) |
|---|---|---|---|
| 5 | 5 | 5 | **15** |

**Acceptance Criteria**

- **AC-1**
  ```gherkin
  Given a visitor is on the home page
  When they interact with the hero by any means available to them, including the command palette
  Then no scene-variant gallery, mode switcher, or sky-mode control is offered
  ```
- **AC-2**
  ```gherkin
  Given the playground gallery has been retired
  When the closing section is presented
  Then it reuses the same three-dimensional stage, so the hero and the closing read as one continuous world
  ```

### US-5 · Unambiguous scroll motion and a maintainable home route — `Should`

> As a maintainer, I want one declarative source for the page's section order and motion behaviour, so that changing the page cannot silently desynchronise the rails that depend on it.

**Cost of Delay**

| User-Business Value | Time Criticality | Risk Reduction / Opportunity Enablement | CoD (sum) |
|---|---|---|---|
| 3 | 3 | 13 | **19** |

**Acceptance Criteria**

- **AC-1**
  ```gherkin
  Given the home page's sections are declared in one ordered registry
  When a section is added, removed, or reordered in that registry
  Then its page position and motion priority follow automatically, with no second list to update by hand
  ```
- **AC-2**
  ```gherkin
  Given a section's motion is linked to scroll position
  When that motion is not a pin or a progress-linked narrative
  Then it does not reverse as the reader changes scroll direction
  ```
- **AC-3**
  ```gherkin
  Given the home route has been restructured
  When the page is scrolled at any supported viewport
  Then its observable motion behaviour is unchanged from before the restructuring
  ```

### US-6 · Measure whether readers reach the close — `Won't` (this cycle)

> As Marcus (P2) and the product owner, I want scroll-depth to the closing section recorded, so that the North-Star KPI in §4 can be read rather than estimated.

**Cost of Delay**

| User-Business Value | Time Criticality | Risk Reduction / Opportunity Enablement | CoD (sum) |
|---|---|---|---|
| 5 | 2 | 8 | **15** |

**Acceptance Criteria**

- **AC-1**
  ```gherkin
  Given a visitor scrolls the home page
  When they reach the closing section
  Then that arrival is recorded such that the proportion of visitors reaching it can be reported
  ```

> Tagged `Won't` for this cycle by stakeholder decision (§7 OQ-1): the KPI ships
> unmeasurable rather than delaying the redesign. **Consequence, stated plainly:
> the North-Star KPI in §4 cannot be evaluated until this story is built.**

---

## 4. Goals & Success Metrics (KPIs)

### North-Star KPI

| KPI | Baseline | Target | Measurement |
|---|---|---|---|
| Share of home-page visitors who scroll to the closing section | **TBD → OQ-1** | 40% by 2026-11-30 | Scroll-depth event on the closing section — **not instrumented; requires US-6, which is `Won't` this cycle** |

### Supporting KPIs

| KPI | Baseline | Target | Measurement |
|---|---|---|---|
| Home-page sections addressed to recruiting audiences | 5 of 13 | 0 | Count of sections in the home section registry |
| Home-page Largest Contentful Paint (desktop, 1440) | TBD → OQ-2 | No regression vs. pre-change measurement | `perf-runtime-auditor` over a production build |
| Positional drift of section content during scroll | 34.2px (pillars) / 16.6px (market position) | 0px | CDP scroll probe (§10) |
| Dead internal anchors after the content move | 0 | 0 | `link-crawl-auditor` across all routes |

---

## 5. Out of Scope (Not v1)

- **Analytics instrumentation** — deferred to US-6 (`Won't`); the redesign is not gated on it, at the cost of an unreadable North-Star KPI.
- **Naming real clients or partners anywhere in the closing scene** — anonymity is a hard requirement (US-3 AC-2), not a placeholder pending legal review. Even an approved client list would not be added under this PRD.
- **Changes to `/services`, `/careers`, `/blog` or `/contact` as destinations** — only the home page and `/about` change.
  > **Correction, 2026-08-24.** This PRD and its source plan both stated that
  > `CapabilityRack` also renders on `/services`. It does not — `routes/services.tsx`
  > never imported it. Removing it from home therefore leaves the component with
  > **zero render sites**. This is not a content loss: `/services` presents the same
  > disciplines through `DetailedServiceList` (Heimdall-backed) and `TechStackSection`.
  > `CapabilityRack.tsx` is now dead code and should be deleted or re-adopted —
  > tracked as OQ-5.
- **The general reader / press persona** — needs are a subset of P2's; modelling them separately would add no story.
- **Redesign of `/about`'s existing sections** — this PRD adds content to that page; it does not restyle what is already there.

---

## 6. Constraints

- React 19 + Vite + TypeScript strict; TanStack Router/Query (source: root `CLAUDE.md`).
- Motion stack is GSAP 3.15 + `@gsap/react` `useGSAP()`; Lenis owns the frame loop via `SmoothScroll.tsx`. No second rAF loop and no `scrollerProxy` (source: root `CLAUDE.md`).
- Eager modules must not import GSAP; ScrollTrigger access from the shell goes through `scrollTriggerBridge.ts`. Three.js must stay out of the eager route chunk (source: root `CLAUDE.md`).
- `prefers-reduced-motion` support is mandatory for all motion (source: root `CLAUDE.md`, `StrictHandbookMotion.md`).
- Blog and services content is served by the Heimdall API at `localhost:8000` in development (source: root `CLAUDE.md`).
- Section identity is currently encoded across four independent registries that deliberately do not align (`HOME_SECTIONS`, `CHAPTERS`, `NAV_ANCHORS`, beat `order`). US-5 addresses this; until then all four move together (source: in-code documentation).
- The closing scene's node/technology model is a structural choice binding the codebase — **needs ADR** before US-3 is built.

---

## 7. Open Questions

| # | Question | Raised by | Blocks approval? | Resolution |
|---|---|---|---|---|
| OQ-1 | No analytics exists, so the North-Star KPI has no baseline and no measurement path. Accept an unmeasurable North-Star this cycle? | author | No | **RESOLVED** — stakeholder chose "TBD baselines + blocking Open Question"; instrumentation deferred to US-6 (`Won't`). Recorded so the gap is a decision, not an oversight. |
| OQ-2 | Home-page LCP has never been baselined, so "no regression" has nothing to compare against. | author | No | **OPEN** — capture a baseline with `perf-runtime-auditor` against the current production build *before* US-3 lands, or the perf KPI is unfalsifiable. Owner: engineering, during Wave 2. |
| OQ-3 | How many system nodes should the closing field present, and what are their archetype names? Breadth is the message, so the count is a product decision, not an implementation detail. | author | No | **RESOLVED** 2026-08-24 — ~30 nodes, mostly unlabeled: only the nodes nearest the camera carry archetype labels, the remainder read as silhouettes. Density is the message. Folded into US-3 AC-1 and AC-6. |
| OQ-5 | `CapabilityRack.tsx` now has zero render sites (see §5 correction), which also strands `NAV_ANCHORS.HOME_SERVICES` — its only consumer. Delete both, or re-adopt the component on `/services`? | author | No | **OPEN** — owner: stakeholder. Leaving it is the one option with no upside. |
| OQ-6 | The four relocated components still live under `src/features/home/components/` but now render only on `/about`. The directory name is now a lie, and `NAV_ANCHORS` ids were already renamed `HOME_*`→`ABOUT_*` to match reality. Move the files to `src/features/about/components/`? | author | No | **OPEN** — owner: engineering. Pure rename; deferred so it does not collide with the in-flight US-5 refactor. |
| OQ-4 | With careers and blog leaving the home page, is the contact call-to-action (US-1 AC-4) the hero CTA alone, or does the closing section also carry one? | author | No | **RESOLVED** 2026-08-24 — both: the hero CTA is retained and the closing section carries a second one, so the scroll ends on an action rather than on a visual. Folded into US-1 AC-4 and US-3 AC-7. |

---

## 8. Traceability

| PRD story | Status | Evidence |
|---|---|---|
| US-1 · Home reads client-first | **AC-1..3 verified; AC-4 partial** | CDP scroll of `/` reports stage sections exactly `hero, hero-mission, hero-pillars, hero-position, use-cases, process, reach, closing` — no culture/testimonial/blog/careers content (AC-1, AC-2). CapabilityRack unmounted (AC-3). AC-4: hero CTA present and `ClosingShelf` already carries a `/contact` link, but the *node-field* closing (US-3) has not been built, so AC-4 is only satisfied against the interim closing. |
| US-2 · Talent moves to /about | **AC-1..4 all verified** | AC-1: CDP scroll of `/about` reports `daily-life, daily-life-stage, candidates, testimonials, blog`. AC-2: dense pin probe on the production build shows `daily-life-stage` pinned via a 1817px `pin-spacer`, held at `top: 0` for 16 of 41 samples across its range, then released — a working pin/hold/release. Home's own two pins (6813px hero, 2750px use-cases) also verified healthy, so the move did not disturb them. AC-3: EyeFlow's three programmatic scroll targets (`use-cases`, `reach`, `closing`) all resolve at runtime; no `href="#…"` in source points at a moved section; every `NAV_ANCHORS` id has exactly one consumer. AC-4: zero duplicate-order and zero unknown-section errors on both routes. |
| US-3 · Node field closing | **Not started** | Blocked on ADR-0001's open texture-sourcing question. `ClosingShelf` remains the closing beat. |
| US-4 · Retire playground gallery | **AC-1 verified; AC-2 not applicable yet** | Gallery, mode store, sky toggle and palette commands removed; hero confirmed `data-hero-mode="legacy"` at runtime. The 3D hero was never live for a default visitor. AC-2 depends on US-3. |
| US-5 · Unambiguous scroll motion | **AC-1..3 all verified** | AC-1: `sectionOrder(id)` derives page order from array position in `HOME_SECTIONS`/`ABOUT_SECTIONS`; every literal `order={N}` prop is gone, and a new test (`tests/motion/section-order-derivation.test.ts`) fails if one reappears, if the two registries ever collide on an id, or if `refreshPriority` stops descending strictly down either page. The overloaded `bare` flag was split into a declared `SectionDef.ownsPin`. AC-2: `STAGE_EXIT` is opacity-only, guarded by test; jitter probe on the **production build** reports 0px drift on both sections. AC-3: behaviour-preserving confirmed by identical `document.scrollHeight` before and after the refactor — `/` 19621px and `/about` 27496px, unchanged to the pixel — plus identical stage-section id lists, CLS 0, and zero console errors on both routes. |
| US-6 · Scroll-depth measurement | **`Won't` this cycle** | Accepted at sign-off. North-Star KPI remains unreadable. |

### Anchor audit note — a probe that was wrong, not the code

An initial anchor audit reported 13 "missing" ids across the two routes. That was
a **faulty probe, not a defect**: `useNavbarAnchor` registers an element by *ref*
with an IntersectionObserver and never writes a DOM `id`, so `NAV_ANCHORS` values
are internal keys and `getElementById` was always going to miss them. Recorded
here so the false positive is not rediscovered later.

One genuine finding did come out of it: `NAV_ANCHORS.HOME_SERVICES` has exactly
one consumer, `CapabilityRack.tsx`, which no longer mounts anywhere — so the
anchor is dead in practice. Folded into OQ-5.

### Verification run — 2026-08-24, quiet tree, both agents complete

| Check | Result |
|---|---|
| `npx tsc -b` | clean, exit 0 |
| `npx vitest run` | **255 passed / 255** (25 files) |
| `npx eslint .` | 27 errors, 91 warnings — **identical to HEAD baseline**; per-file diff confirms all 27 pre-date this work |
| CDP runtime, `/` and `/about` | zero console errors, zero duplicate-order, zero unknown-section |
| Jitter probe (post-renumbering) | `hero-pillars` 0px, `hero-position` 0px — Wave 1 fix survives the order changes |

### Verification run — 2026-08-24, after the US-5 refactor (production build, port 55468)

| Check | Result |
|---|---|
| `npx tsc -b` | clean |
| `npx vitest run` | **261 passed / 261** (255 existing + 6 new order-derivation guards) |
| `npx eslint .` | 27 errors, 91 warnings — unchanged from baseline |
| Stage section ids | `/` and `/about` **identical** to pre-refactor |
| `document.scrollHeight` | `/` 19621px, `/about` 27496px — **unchanged to the pixel**, the strongest available evidence the refactor altered no layout |
| LCP / CLS | `/` 264ms / 0 · `/about` 1424ms / 0 |
| Jitter probe | 0px drift on both sections |
| Pins | `/about` `daily-life-stage` holds at `top:0` for 16/41 samples (1817px spacer); `/` holds two pins (6813px, 2750px) |

An earlier report of "12 pre-existing test failures" was **wrong**: it came from a
stash-and-compare run that raced against the other agent's live edits to
`sections.ts`. Re-run on a quiet tree, the suite is fully green.

---

## 9. Approval

- [x] Stakeholder sign-off — 2026-08-24, by yaakovins: **"Approved — build against it"**

Approved with US-6 remaining `Won't` for this cycle. The consequence is recorded
and accepted: the North-Star KPI in §4 cannot be read until scroll-depth
instrumentation ships. OQ-2 (LCP baseline) remains OPEN and is owned by
engineering during Wave 2 — it does not block approval, but leaving it unanswered
makes the perf KPI unfalsifiable.

**These acceptance criteria are the loop's termination condition.** No wave is
reported complete until its stories' ACs pass under the Validate and Kritikos
gates; an unrun check counts as failed, never as neutral.

---

## 10. Prior work — recorded, not proposed

The scroll jitter reported alongside this initiative ("things moving back and
forth in the 3 pillars and leadership") was diagnosed and fixed before this PRD
was written, and is **not** a story above.

`docs/scroll-audit-2026-08-23.md` attributed it to the entrance from-state snap;
that attribution was stale — `SectionBeat.tsx` already mitigates the entrance.
The actual cause was the **scrubbed exit dim**: a bidirectional tween carrying
`y: -40, scale: 0.94` over `bottom 30% → bottom top`, which reversed on every
scroll-direction change while the section was still being read. The recede is now
opacity-only and starts at `bottom 10%`.

Measured by CDP scroll probe against the running page:

| `.stage-inner` translateY drift while on screen | `#hero-pillars` | `#hero-position` |
|---|---|---|
| Before | 34.2px | 16.6px |
| After | 0px | 0px |

Guarded by `tests/motion/beat-thresholds-usage.test.ts`, which fails if any
transform is reintroduced into `STAGE_EXIT`.
