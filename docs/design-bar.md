# The Fresko design bar

The acceptance standard every section checkpoint is judged against. Approved
once so it does not get re-litigated per section.

Derived from the `design-taste-frontend` anti-slop skill, **adapted to this
stack**. The skill assumes Tailwind + Next.js; Fresko is MUI 7 + Vite +
TanStack Router. Where a skill rule names a Tailwind mechanism, the MUI
equivalent is given. Where a rule does not survive translation, it is listed
under "Not adopted" with the reason.

---

## Design read

> A B2B marketing and recruiting site for a quant R&D firm, addressing
> institutional buyers and technical candidates in equal measure, with a
> navy-and-gold engineered language, leaning on an existing MUI theme plus a
> heavy GSAP/Lenis/R3F motion layer.

**Mode: Redesign — Preserve.** The brand exists, the tokens are real, and most
sections are built. Brand tokens are starting material, not optional input.

## Dials

| Dial | Value | Reading |
|---|---|---|
| `DESIGN_VARIANCE` | **8** | Already asymmetric: full-bleed photo bands, pinned scroll, split composition. Matched, not raised. |
| `MOTION_INTENSITY` | **8** | Beat system, Lenis, ScrollTrigger pins, view transitions, R3F. Matched. **Deliberately not raised** despite the preserve-mode `+1` default: the motion budget is already the site's main performance risk. |
| `VISUAL_DENSITY` | **4** | Roughly one section per viewport, generous spacing. Matched. |

## Brand tokens (locked — these are the answer, not a starting point)

| Role | Token | Value |
|---|---|---|
| Accent | `NOIR.gold` | `#FFC72C` — *"the sitewide secondary/accent, and the only one"* |
| Primary text / ink | `NOIR.ink` | `#0A2A66` (Phitopolis Navy) |
| Light grounds | `NOIR.void` / `NOIR.panel` | `#F4F7FC` / `#F8FAFC` |
| Secondary text | `NOIR.mist` | `#5C719D` (raised from `#6B7FA8`, which measured 3.74:1) |
| Display | `DISPLAY_FONT` | Outfit |
| Mono | `MONO` | system mono stack |
| Type ramp | `TYPE_SCALE` | 8 steps, `micro` → `display` |

The skill's LILA rule (no default AI-purple) and its serif ban are both
already satisfied: the accent is a brand gold, the display face is Outfit (a
sans on the skill's approved list, not Inter, not a serif).

## Audit findings — measured, not asserted

**Eyebrow budget: over by 2×.** The skill allows `ceil(sections / 3)`. The home
page has 8 content sections, so the budget is **3**. It currently carries **6**:

| Eyebrow | File |
|---|---|
| `APPLIED ARCHITECTURES` | `routes/index.tsx:140` |
| `CORE DISCIPLINES` | `CapabilityRack.tsx:27` |
| `MARKET POSITIONING` | `MarketPosition.tsx:55` |
| `HUMAN CAPITAL` | `CandidatesAndCareersSection.tsx:96` |
| `TECHNICAL DISPATCHES` | `BlogSection.tsx:244` |
| `GATEWAY TERMINAL` | `ClosingShelf.tsx:87` |

Separately from the count, the *register* is a flagged tell. "GATEWAY
TERMINAL", "TECHNICAL DISPATCHES" and "HUMAN CAPITAL" are performative-craftsman
labels of exactly the kind the skill bans by name. The three that survive
should read as plain language or be dropped; the headline alone is usually
enough.

**Em-dash count: the existing audit figure is wrong.** `docs/copy-audit.md`
reports 15 em-dashes in `content.ts` and 14 in `about.tsx`. All 15 in
`content.ts` are inside **code comments** — zero appear in any copy string.
Comments do not ship. The real violations are in rendered text and are far
fewer; confirmed examples:

- `AcademySection.tsx:89` — two em-dashes as parenthetical bracketing
- `PoweredBySection.tsx:393` — one in body copy
- `PrinciplesValuesShowcase.tsx:199` — used as a *separator* between number and label
- `TestimonialsSection.tsx:53` — inside a real testimonial quote
- `InnovationPostArticle.tsx:40`, `JourneyTimeline.tsx:749` — in `alt` text

Because a repo-wide grep cannot reliably separate comment from copy, em-dashes
are checked **per section during its checkpoint**, where the visible strings are
being read anyway. No repo-wide sweep.

---

## The bar

### Non-negotiable (a section does not pass without these)

1. **Zero em-dashes in rendered text.** Headlines, body, labels, buttons, quotes, captions, `alt`. Comments are exempt. Use a period, a comma, parentheses, or a colon.
2. **WCAG AA contrast** on every text/background pair, every button label, and every form control. The palette already carries measured ratios; new pairs get measured, not eyeballed.
3. **`prefers-reduced-motion` honoured.** Non-negotiable at `MOTION_INTENSITY 8`. Under reduce, the section must reach its final lit state.
4. **The `SectionBeat` invariant.** Every tween is `fromTo`/`from` with `immediateRender: false`; the DOM default is the final lit state. Never `gsap.set()` something hidden and animate it in.
5. **Transform and opacity only.** Never animate `top`, `left`, `width`, `height`, `margin`, `padding`.
6. **Bundle rules hold.** No `gsap`/`lenis` at route-module scope; loaders import from `@/features/<x>/api`, never the barrel.
7. **No invented data.** No fabricated telemetry, coordinates, metrics, or fake-precise numbers. Three instances of this have already shipped and been removed.
8. **Motion must be motivated.** Each animation justified in one sentence: hierarchy, storytelling, feedback, or state transition. "It looked good" is not one.

### Enforced with judgement (deviation allowed, but stated and recorded)

9. **Eyebrow budget** `ceil(sections / 3)` per route, and plain-language labels.
10. **One layout family per page.** No two sections sharing a composition; max 2 consecutive image-and-text splits.
11. **Copy self-audit** every visible string. No buzzwords (the audit found 21), no filler verbs, no performative-craftsman labels.
12. **Real images.** No div-based fake UI, no hand-rolled decorative SVG. Missing art becomes an explicit image brief for you to generate, wired through `ImagePlaceholder.tsx`.
13. **Token discipline.** New type uses `TYPE_SCALE`; new colour uses `NOIR`. Each section migrates its own literals as it is touched, never as a repo-wide sweep.
14. **Full interactive states.** Loading, empty, and error, not just the success state.

### Not adopted (and why)

- **Tailwind utility rules** (`min-h-[100dvh]`, `dark:`, `max-w-7xl`). This is MUI `sx` + a theme. Intent is kept: viewport-stable heights, theme-driven colour, contained max-widths.
- **"Dark mode mandatory."** Fresko uses a per-section *ground* system (light and navy grounds), not a user-toggled theme. The Page Theme Lock is satisfied by the ground registry in `sections.ts`, which is deliberate composition rather than section-level inversion.
- **Icon-library ban.** The site uses MUI icons throughout. Swapping families is churn with no user-visible benefit.
- **"No centered hero."** The hero is a pinned, choreographed sequence, not a centered text block. The rule does not apply.
- **Motion library choice.** The skill defaults to Motion; this repo deliberately runs both — Motion for micro-interactions, GSAP/Lenis for scroll narrative — with a documented boundary. Kept.

---

## Per-section checkpoint format

```
SECTION — <route> / <name>                    (file: <path>)

element        current              proposed             img?  copy?
─────────────  ───────────────────  ───────────────────  ────  ─────
...

Copy proposed:  "<exact string>"
Image brief:    "<prompt + dimensions + format>"   ← you generate, I wire
Bar exceptions: <rule> — <why>
Gate impact:    <tests that will need updating>
Not changing:   <what I deliberately left alone, and why>
```

Every approved decision is recorded as an Octavia Pattern with its rejected
alternatives, so a later session cannot silently re-propose what was declined.
