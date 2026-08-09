---
date: 2026-08-09
target: Fresko (Master P Frontend) — " Master P Frontend/Phitv2A"
method: live browser pass on the built output + static read. Every number reproducible.
supersedes: partially — clair-canvas-works/frontend/reviews/2026-08-04-master-p-taste-audit-review.md
---

# Fresko — production-readiness pass, 2026-08-09

A Taste Skill audit ran on 2026-08-04 at commit `b495da8`. Fourteen commits later, roughly
40% of it was stale: the "glass revamp" split the four-beat hero chassis into three
components and removed the eight `<Divider />`s, both of which that review's correction
called its worst findings. **This is not a re-run.** Everything below was re-measured, and
the parts that were graded from a browser say so.

## What changed, and what it cost

| | before | after |
|---|---:|---:|
| Console errors on `/` (built output) | 5 SVG attribute throws + 2 Vercel 404s | **0** |
| Buzzword hits across `src/` | 57 | **0** |
| `public/images` | 118 MB | **44 MB** |
| `dist` | 159 MB | **79 MB** |
| First-visit transfer | — | **787 KB** / 45 requests |
| Requests on `/` (built) | 45 | **29** |
| Production API base | `https://phitv2.phit.b.com` (does not resolve) | same-origin `/` |
| Tests | 3 failing | 2 failing (both pre-existing) |

---

## Release blockers — fixed

### 1. The production API pointed at a domain that does not resolve

`.env.production` shipped `VITE_API_URL=https://phitv2.phit.b.com`. Dev points at
`localhost:8000`, so **nothing surfaced until a production build was loaded** — and then
blog, innovation hub, services, careers and contact all died at once on
`ERR_NAME_NOT_RESOLVED`. Captured in the console logs from the 2026-08-08 session before
this pass began.

Now same-origin (`VITE_API_URL=/`), because Heimdall binds `127.0.0.1:8000` behind Nginx —
there is no cross-origin request, no CORS to keep in sync, and no hostname to go stale.
`vite.config.ts` fails the build on a placeholder or dev host; verified by putting the old
value back and watching the build refuse.

> **The trap this creates, documented in `docs/deploy/ec2.md`:** if the Nginx `/api/`
> proxy is missing, requests fall through to the SPA fallback and return **200 with
> `index.html`**, so the client dies inside `JSON.parse` rather than at the network layer.
> `yarn preview` reproduces it exactly. Always verify with
> `curl -si <host>/api/v1/services | head -1`.

### 2. Five SVG attribute errors thrown on every home-page load

```
<circle> attribute r: Expected length, "undefined".      ×2
<rect> attribute height: Expected length, "undefined".   ×3
```

**Root cause, confirmed by instrumenting `setAttribute` in the live page**, not inferred:
`ServiceDrawer.tsx` animated `r` and `height` as keyframe arrays with **no `initial`**.
Motion renders SVG geometry by writing its own `latestValues` onto the element — and it
*overwrites the static JSX attribute*. Before the first keyframe resolves there is no
value, so it wrote `"undefined"`. `ServiceVector` ships inside `CapabilityRack`, which is
on the home page.

The fix is `initial={{ r: 120 }}` etc. — a static `r="120"` is **not** enough, which is
worth knowing: it is precisely what Motion overwrites.

*Method note, recorded because the first attempt was wrong:* I initially rewrapped four
diagram components' `scale` animations in `<motion.g>` on the theory that scale-on-a-
primitive was the cause. It was not, and those edits were reverted before the real fix —
a differential test (`/contact` clean, `/` not) plus a `setAttribute` hook located it in
one step. The counts matched exactly: 3 rects, 2 circles.

### 3. Two sitewide controls had no keyboard focus indicator

`AppShell.tsx:320` (the icon button in the app bar, **every route**) and
`PoweredBySection.tsx:428` (the `/about` filters) both set `outline: "none"` in `sx`.
Emotion injects `sx` after `MuiCssBaseline`, so the local rule beat the theme's designed
`*:focus-visible` ring at equal specificity.

Verified fixed in the browser: zero `outline` rules now target that button, and a real
keyboard tab shows `solid 2px rgb(255,199,44)` with the black halo. The four *other*
`outline: none` sites are correct idiom (modal containers with `tabIndex={-1}`, and the
skip-link target) and were left alone.

### 4. 118 MB of images

**177 of 212 rasters already had a `.webp` twin** — a previous migration converted them
and never deleted the originals. `docs/blog-image-migration.md` explains why it stalled:
the paths live in Heimdall's post bodies, so renaming files would 404 every article.

That dependency was unnecessary. A stored path is a *reference*, and resolving a reference
is the client's job — `preferWebp()` in `src/shared/bodyImages.ts` rewrites the extension
at render time, with an `onError` fallback to the stored path. Same 30 MB saving, one file,
**no database write**, and no window where the two systems disagree. The backend can keep
storing `.png` forever.

Then: 23 rasters with no twin were converted (`cwebp -q 82`), 29 `src` references rewritten
after verifying each target exists, and 200 superseded originals deleted.

While there: `src/features/innovation/bodyImages.ts` was a **verbatim duplicate** of the
blog one. Both now import from `shared/`.

### 5. Two pre-MVP markers

`hero.buildStatus` in `content.ts` was **dead data** — the `{buildStatus && …}` block its
own comment referenced does not exist. The *visible* marker was a hardcoded string:
`SuperHeroSequence.tsx:781` rendered `EXPLORE PHITOPOLIS // DIRECTORY | (PoC Draft, yet to
be presentable)`. Both gone.

### 6. Vercel Analytics 404s on every page load

`<Analytics />` and `<SpeedInsights />` fetch `/_vercel/insights/script.js`, which exists
only on Vercel's edge. On EC2 that is two 404s and two console errors **per navigation**,
plus the scripts' own failure warnings. Now gated to `*.vercel.app`
(`VITE_ANALYTICS=on` forces them). Verified: 0 Vercel requests in the built output.

---

## Copy — 57 buzzwords to 0

You chose *de-slop, invent nothing*. Every edit deletes a word or replaces an abstraction
with a specific **already in the file**. Nothing new is asserted; two spots that need a
fact I do not have are marked `[VERIFY]`.

The previous copy audit counted 21 hits and was never applied; by this pass it was 44 in
the three data files — and a further 13 hiding in components (`GraduateHallOfFameSection`,
`JobDetailsDrawer`, `routes/services.tsx`, `JourneyTimeline`). **The first version of my
guard test scanned only the three copy files and passed while those 13 sat there.** It now
walks all of `src/`.

`tests/copy-buzzwords.test.ts` scans string literals only — comments are stripped, because
the notes recording *what was removed and why* are worth more than a clean grep.

> **Still worth your attention.** `JobDetailsDrawer.tsx` carries its own duplicate of the
> careers copy that also lives in `careersData.ts`. I de-slopped both, but they will drift.

### The tagline

You kept `Making tomorrow's technology available today` in the hero. The closing statement
was the **same string**, so a reader who finished the page was told the same thing they
were told at the top. It now resolves instead of repeating, and a test asserts the two can
never be equal again.

You picked *"Built in Manila. Running in four time zones. Available today."* — **I shipped
"three"**. Manila and Hong Kong are both UTC+8, and New York and Miami are both US Eastern,
so the five cities on your reach map span three zones. "Four time zones" is checkable and
wrong. Say "four markets", or name the cities, if you want a four in the line; the
arithmetic is in a comment on `CONTENT.closing`.

---

## The closing shelf — new section

`sections.ts` has carried a `closing` entry ("Horizon Gateway") since the section list was
written, and **nothing ever rendered it**. `features/home/components/ClosingShelf.tsx`
fills that slot.

Four frames, at your pick: capabilities + use cases, the journey, the people, the writing.

Two decisions worth stating:

- **The frames are deliberately unequal (8/4, then 4/8).** The obvious build is four equal
  cards, which is the exact anti-pattern the taste standard leads with — nothing is more
  important than anything else, so the eye has no first stop. The first pass used 7/5 and
  it read as two cards of *nearly* the same size, which looks like a mistake rather than a
  decision. 2:1 is unmistakable.
- **The polaroid treatment is borrowed, not invented.** `JourneyTimeline` already renders
  its photos as scattered polaroids — 3px white border, 8px radius, deep shadow, small
  rotation. The shelf uses exactly that, so the close reads as the About timeline's
  language brought home. A distinctive treatment used twice in agreement is a system; used
  once it is noise.

*Bug found and fixed while building it:* `<Box component="img" width={1920} height={1080}>`
does **not** set the HTML attributes — MUI treats `width`/`height` as system *style* props,
so those numbers became `height: 1080px` in CSS and beat the aspect-ratio. Frames rendered
~1100px tall. A plain `<img>` keeps attributes as attributes (which is what reserves the
box against layout shift) with CSS sizing it inside a wrapper. **Worth checking anywhere
else this pattern is used.**

---

## Verified in the browser, not asserted

The 2026-08-04 review had to mark four implementation-gate items *unverified*. Three are
now settled:

| Item | Result |
|---|---|
| No horizontal scroll at 320/375px | **pass** — `scrollWidth === clientWidth === 375`, zero unclipped overflowing elements |
| Keyboard-only: focus visible | **pass** on the sites tested — skip link, hero CTAs, form inputs, and both repaired buttons all show the gold ring |
| Console clean on `/` | **pass** on the built output |
| Long-content stress (60-char names, 7-digit numbers, 40 items) | **still unverified** — needs seeded data |
| Slop test | **needs you.** See below |

**The slop test needs a human, and I am not it.** The prior review's own method note says
answering it from source while marking it unverified is worse than leaving it blank,
because the verdict is what gets read. Screenshots of the hero, the shelf and the close are
what I can offer; the answer to *"what product is this?"* is yours.

---

## Open — not fixed

1. **`Cannot update a component (Transitioner) while rendering a different component
   (AppShellInner)`** — a React error on every route. Transitioner is TanStack Router
   internal. I checked `NavbarContext`, `StageSection`, `useNavAutohide` and AppShellInner's
   render body without finding it; it needs a component-stack trace from React DevTools.
   Dev warning, no functional break — deprioritised below the blockers, not dismissed.
   Possibly related: 30 pre-existing `react-hooks/set-state-in-effect` lint errors.

2. **Two pre-existing test failures**, both confirmed present before this pass (verified by
   stashing every change and re-running):
   - `ground-stops › home page stops use lightmode grounds` — asserts every home ground has
     luminance > 200, but `blog` now uses `field` (navy `#0A2A66`). `grounds.ts` documents
     `white`/`void`/`panel` as **retired**, so the test encodes the old light-palette
     assumption while the site is deliberately going dark. It contradicts its own module's
     migration note. I did not change the assertion because the intent is yours.
   - `home-reduced-motion › every pitch section is reachable` — from the uncommitted hero
     work in progress.

3. **26 hotlinked images from `https://phitopolis.com/blog/wp-content/...`** in
   `JourneyTimeline`. An external host you do not control, in the middle of the About page,
   outside the whole optimisation story.

4. **Taste commitments 1, 3 and 6** (Phase 3) — not started. 46 ad-hoc `fontSize` literals
   with no ratio, 227 `MONO` references against 10 `DISPLAY_FONT`, 194 raw hex outside
   `palette.ts`, 66 references to `@deprecated` light-palette tokens, and measure
   constrained in `ch` at only 9 of 84 sites. These are systemic, not blocking, and each
   wants its own reviewable diff.

5. **`dist` is 79 MB, not the 25 MB I put in the plan.** That target was set before I knew
   the content mix — 180 blog photographs and 20 MB of video. It was the wrong metric:
   first-visit transfer is **787 KB**, and the rest is lazily fetched per article. Blog
   images were already encoded near-optimally; re-encoding 49 files at q78 bought 1 MB.
   Further reduction means downscaling below retina or moving video off the origin.

## Reproduce

```bash
cd " Master P Frontend/Phitv2A" && yarn typecheck && yarn test && yarn build
```

```bash
grep -rEno '#[0-9a-fA-F]{6}' --include='*.tsx' --include='*.ts' src | grep -v 'theme/palette.ts' | wc -l
```
