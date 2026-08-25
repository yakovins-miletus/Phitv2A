# WS-16 — About page: seven section fixes

**Owner files (exclusive):** `src/features/about/**` · `src/features/home/components/CandidatesAndCareersSection.tsx` · `src/features/home/components/DailyLifeSection/**` · the `schools` block in `src/shared/content.ts`
**Not owned:** `GroundLayer`, `sections.ts`, `groundStops.ts` → **WS-17**. `src/routes/index.tsx` → **WS-02**.
**Depends on:** WS-02 removing the people-sections from Home (see Ownership note). **Related:** WS-17 owns all ground/background behaviour.
**Agents:** Haiku to inventory, Sonnet to implement. **Acceptance bar:** `/design-taste-frontend`.

---

## ⚠️ Ownership note — read before touching anything

`DailyLifeSection`, `CandidatesAndCareersSection`, `TestimonialsSection` and `BlogSection`
currently render on **both** `/about` and `/`. Per the session decision, Home becomes
service-centric with **no people content**, so all four leave Home and live only on About.

**WS-02 removes them from `src/routes/index.tsx`. This workstream must not edit that file.**
Once WS-02 lands they are About-only, so editing them here is safe and needs no variant
props. If WS-02 has not landed yet, coordinate — do not fork the components.

---

## The seven items

### 1. Core principles — merge two stacked boxes into one row
`src/features/about/components/PrinciplesValuesShowcase.tsx:208-267`

Two bordered boxes ("OUR COMMITMENT", "VALUE DELIVERED TO CLIENTS") sit stacked in a
`Stack spacing={3.5}` (L170), each with its own fill, 1px border and a 4px coloured left
edge. Put them side by side in one row.

While there: per WS-01 these are exactly the containerization being removed sitewide. Prefer
one row divided by a hairline or by spacing over two re-bordered cells. Keep the mono
labels in the house treatment.

### 2. Talent section — credibility pass, and split the international schools
Data: `src/shared/content.ts:220-232`. Rendered inline in `src/routes/about.tsx:75-174`
(move it into a component under `src/features/about/components/` as part of this work).

**Two changes, both agreed:**

(a) **Restructure around the schools.** The named institutions are verifiable and carry real
weight; the round percentages are the weakest thing on the page. Make the logo wall the
hero of the section and demote the discipline split to quiet supporting detail.

(b) **Segregate the international schools onto their own sub-section.** `Brunel`
(`content.ts:230`) and `Sophia` (`content.ts:231`) are the two internationals — currently
mixed in with the nine Philippine schools. Give them their own labelled group; that
separation is itself a credibility signal.

> ⛔ **BLOCKED SUB-ITEM.** "37% QS TOP 1000 EDUCATED", "15% ADVANCED OR INTERNATIONAL
> DEGREE" and the discipline percentages must be captioned with their basis — e.g.
> "of 40 engineers, as of Q3 2026". **The real figures have not been supplied.** Do not
> invent a denominator or a date. Build the layout with the caption slot present and
> clearly marked TODO, and report the blocker. An unsourced statistic on a marketing page
> is the opposite of the credibility this item is chasing.

### 3. Add the 2026 Batch 2 cohort
`src/features/about/components/GraduateHallOfFameSection.tsx:25-71`

Existing convention in `public/images/grads/`: `2023Grads.webp`, `2024B1.webp`,
`2024B2Grads.webp`, `2024B2and2025.webp`, `2026B1Grads.webp`.

**The new asset must be named `2026B2Grads.webp` and placed in `public/images/grads/`.**

Add the entry keyed `id: "2026-b2"`, `year: "2026 Batch 2"`, image
`/images/grads/2026B2Grads.webp`, following the shape of the `2026-b1` entry. The image is
supplied separately — if it is not present yet, add the data entry and confirm the section
degrades gracefully rather than rendering a broken image.

### 4. Certifications — one full screen, self-moving shelf
`src/features/about/components/CertificationsSection.tsx:59`

Currently a static responsive `Grid` (`xs:12 sm:6 md:4 lg:3`) per provider group. Rebuild as
a **single full-viewport section** with the badges on a self-moving shelf.

**Hard requirement: it must NOT pause on hover.** For the record, nothing in the repo pauses
on hover today — `CertificationsSection` has no marquee at all, and `PoweredBySection`'s
marquee (L287-330) has no hover-pause logic. So there is nothing to remove; the rule is
simply **do not add it**.

Reuse `PoweredBySection`'s `TechMarqueeRow` mechanism (`useAnimationFrame` + velocity) rather
than writing a third scroll-linked loop. Must still stop offscreen and honour
`prefers-reduced-motion` (static, all badges legible).

### 5. "These are the people who do it" — wrong ground
`src/features/home/components/DailyLifeSection/DailyLifeSection.tsx`

The section renders gold display type on a **white** ground, which makes the preceding beat
("that is the work") blend into it — there is no visual break between the two statements.

**It should sit on the primary navy ground.** Gold on navy is also the correct, readable
pairing (9:1+); gold on white is 1.45:1 and is the failure WS-01 spent its time removing.

> The ground for this section is declared in `src/shared/sections.ts`, which **WS-17 owns**.
> Do not edit it here. State the required ground in your handoff and let WS-17 apply it.
> Anything inside the component itself — spacing, type scale, video framing — is yours.

The scroll choreography the brief floated (video enters left → scales to full screen →
shrinks and settles right) is **deferred**, not part of this item. The ground is the bug.

### 6. Candidates — kill the rotating title
`src/features/home/components/CandidatesAndCareersSection.tsx:308-326`

Inactive card titles are rendered with `transform: rotate(-90deg)`, springing to
`rotate(0deg)` when active. Remove the rotation entirely: titles render flat and identical
in treatment to the descriptions, active or not. Keep the size/weight change if it helps the
active state read; lose the geometry.

**Already done, do not "fix" it:** `activeIndex` initialises to `0` (L55), so the first card
is already expanded by default. Verify that survives your change; add nothing.

### 7. About CTA — make it feel like an institution
`src/features/about/components/AcademySection.tsx:33-234`

Currently a plain two-column grid of two track cards ("Graduate Program", "Internship
Program") on navy, with a "VIEW OPEN POSITIONS" button. It presents contents; it does not
present a place.

Target: read as an **academy or university house** — a built structure containing the
programmes rather than two cards beside each other. Architectural framing, a masthead or
crest treatment, programmes as halls or departments within it. This is the one item on the
page with real creative latitude; take it.

Constraints: navy ground stays, gold is the accent not the surface, one clear CTA to
`/careers` survives, and it must not become another set of bordered boxes — that is the
containerization WS-01 removed. Reduced-motion renders a composed static version.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn tsc --noEmit && yarn test && yarn build && yarn preview
```

- All 339+ tests pass. `tests/accent-role.test.ts` will fail the build on any
  `color: "var(--accent-fg)"` — gold text goes through `var(--accent-ink)`.
- Screenshot `/about` end to end at 375 / 768 / 1440 and compare against the eight reference
  screenshots this workstream came from.
- Certifications: confirm the shelf keeps moving while the pointer is over it, and stops
  when scrolled offscreen.
- Candidates: no rotated text at any breakpoint; first card expanded on load.
- Contrast ≥4.5:1 on every text colour touched.
- `prefers-reduced-motion: reduce` — shelf static, no rotation, page fully readable.

## Out of scope

`src/routes/index.tsx` (WS-02). All ground/background behaviour including the navy ground for
item 5 (WS-17). The About hero strips (WS-05). The video scroll choreography (deferred).
Inventing statistics for item 2 (blocked).
