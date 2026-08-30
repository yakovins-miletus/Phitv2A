# Handoff — Closing section rebuild (home page)

**Created:** 2026-08-30 · **For:** a fresh session · **Status:** not started

## Goal (user's words)

> In the closing section on the home page, everything is entirely bugged.
> Elements are overlapping, it's not a proper closing with CTA reveal,
> everything looks janky.

Rebuild the closing beat into a clean, deliberate finish: the P mark settles,
the closing statement resolves, and a single clear CTA is revealed — no
overlap, no jank, works on mobile and desktop, works under reduced motion.

## What's there now (verified 2026-08-30)

### Composition

```
routes/index.tsx  (last thing before </main>)
  <PixelTransitionSection from="white" to="field" />
  <ClosingShelf />
      └─ <SectionBeat section={homeSection("closing")}
                      establishing={<MiniEstablishingShot .../>} >   ← establishing shot
           └─ <ClosingLatticeSection />                              ← bare child (ownsPin)
```

- `src/features/home/components/ClosingShelf.tsx` — the `SectionBeat` wrapper +
  a `MiniEstablishingShot` (`title="In closing"`, `tracer="Direct line to our
  technical leadership…"`, **no `category` prop**).
- `src/features/home/components/closing-scene/ClosingLattice.tsx` — the whole
  pinned scene (single file; the `IsometricTechLattice.tsx` referenced in old
  handovers was never built — it uses `HeroCanvas` in `mode="closure"` instead).
- `sections.ts` `closing` entry: `chapter: 5` (HORIZON), `choreo: "zoom-center"`,
  `ground: "field"`, `ownsPin: true`, `noExitDim: true`, `establishScale: "mini"`.

### The pinned scene (`ClosingLattice.tsx`)

- **Pin:** `ScrollTrigger.create({ trigger: el, pin: true, start: "top top",
  end: () => "+=" + window.innerHeight * 1.3, scrub: SCROLL_SPEED (0.65),
  anticipatePin: 1, invalidateOnRefresh: true })`.
- **Layers** (all inside a `100vh`, `minHeight {xs:580, md:680}`, `overflow:hidden`,
  centred flex container):
  1. `<HeroCanvas mode="closure" varsHostRef={containerRef} showLogo
     initialZoomProgress={reduced ? 1 : 0}>` — `position:absolute; inset:0;
     pointerEvents:none`. Publishes `--hp-px/py/pw` (the P's normalised screen box).
  2. Text wrapper — `position:relative; zIndex:4`. `display: reduced ? "none" :
     "block"`, `transform: translateX(calc(var(--closure-textshift) * -1 *
     var(--closure-textshift-vw)))` where `--closure-textshift-vw` is `18vw`
     (md) / `0vw` (xs). Contains an intro line ("HERE AT PHITOPOLIS") and the
     headline ("We create exciting technologies"), each with a blurred white
     backdrop, opacity driven by CSS vars.
  3. CTA card — `position:absolute; zIndex:6`. Mobile: bottom-sheet
     (`bottom:24; left:50%; translateX(-50%)`). Desktop: floated right of the P
     using `left: calc(var(--hp-px) * 100% + var(--hp-pw) * 50% + 32px);
     top:50%; translateY(-50%)`. Eyebrow "Let's Build Together", statement
     `CONTENT.closing.statement`, subline `CONTENT.closing.subline`, button →
     `/contact` (`CONTENT.closing.farewell` = "Start a Conversation").
- **Reveal logic** — one `onUpdate`, pure math, published as CSS vars (zero React
  re-renders):

  | scroll p | `--closure-intro-opacity` | `--closure-headline-opacity` | `--closure-cta-opacity` | `--closure-cta-pointer` |
  |---|---|---|---|---|
  | 0.00 | 0→ | 1 | 0 | none |
  | 0.35 (`PHASE_MOVE_END`) | ~0.4 | ~0.7 | 0 | none |
  | 0.44 | 0 | ~0.1 | ~0.1 | **auto** |
  | 0.50 | 0 | 0 | ~0.4 | auto |
  | 0.70+ | 0 | 0 | 1 | auto |

  Hero progress is clamped to `PHASE_MOVE_END` (0.35) so the canvas never enters
  the gunshot/smoke phases.

### Why it looks broken

| # | Symptom | Cause | File:line |
|---|---|---|---|
| 1 | Establishing shot has no eyebrow; jumps straight to "In closing" | `MiniEstablishingShot` called with no `category` prop | `ClosingShelf.tsx` ~L31 |
| 2 | CTA card misplaced / jumps on desktop | `left` uses `var(--hp-px, 0.3)` — **the fallback `0.3` is used until `HeroCanvas` paints its first frame and publishes `--hp-px`**, so the card starts at a wrong x then snaps | `ClosingLattice.tsx` ~L262 |
| 3 | Text + CTA visually overlap mid-scroll | The headline fades out (`--closure-headline-opacity`) over `p 0.35→0.50` while the CTA fades in (`--closure-cta-opacity`) over `p 0.33→0.50` — **overlapping windows**, both visible ~`p 0.40` in the same region on desktop | `ClosingLattice.tsx` ~L88–94 |
| 4 | Mobile reads as a glitch | On xs, `--closure-textshift-vw = 0vw` so the headline fades with **no pan** — a bare fade on a phone with the P behind it | `ClosingLattice.tsx` ~L166 |
| 5 | Mobile = squeezed desktop | `handover-2026-08-25` §3: mobile is desktop scaled via canvas `preserveAspectRatio` + a bottom-sheet CTA bolted on; never a bespoke small-screen composition | whole component |
| 6 | Reduced-motion DOM mismatch (2 failing tests) | Text wrapper gets `display:none` but not `opacity:0`; test also expects the establishing-shot category text | `ClosingLattice.tsx` ~L152 / `closing-lattice-pinned-scroll.test.tsx` L209, L248 |

### The 2 failing tests (baseline)

`tests/motion/closing-lattice-pinned-scroll.test.tsx`:
1. **"renders … HeroCanvas in closure mode and headline"** — `getByText("We
   create exciting technologies")` passes; `getByText("CAPABILITY // PLATFORM")`
   fails (that category string is never rendered — the `MiniEstablishingShot`
   has no `category`).
2. **"reduced motion: headline is hidden and CTA card is immediately active"** —
   expects the `aria-hidden="true"` wrapper's inline style to contain **both**
   `display: none` **and** `opacity: 0`; only `display: none` is set on that
   element (opacity lives on an inner node).

Decide during the rebuild whether the category string is `CAPABILITY //
PLATFORM` or something else, and update the test to match the real design (it
currently encodes an intent that was never implemented — don't just satisfy the
literal string).

## Rebuild direction

1. **One clean phase order, no overlapping opacity windows.** Sequence the scrub
   as discrete, non-overlapping segments: `[settle P] → [headline resolves] →
   [headline clears] → [CTA reveals]`. Each `--closure-*` var owns a disjoint
   `p` range. The CTA should not start appearing until the headline is fully
   gone.
2. **Fix the CTA anchor.** Don't position the CTA off a canvas var that is
   undefined on first paint. Either (a) lay the scene out with the P and the CTA
   in a real grid/flex relationship (CTA in normal flow, canvas absolutely
   behind), or (b) hold the CTA at `opacity:0` until `--hp-px` is known (gate on
   a "canvas ready" signal from `HeroCanvas`), then fade in — no positional
   snap.
3. **Purpose-built mobile.** Single column: P mark smaller and top/centre,
   statement below, CTA a full-width block at the bottom — a real layout
   function, not the desktop one squeezed. No text pan on mobile; if there's no
   pan, there's no fade-on-scroll either — just show it.
4. **Proper CTA card.** It's the last thing on the page and the primary
   conversion. Give it a clean reveal (rise + fade, or a short clip), a clear
   single action ("Start a Conversation" → `/contact`), and enough contrast /
   spacing that it never sits on top of the headline or the P's face.
5. **Reduced motion:** static final frame — P settled, statement visible, CTA
   visible and interactive immediately. The hidden-headline wrapper gets both
   `display:none` and `opacity:0` (or restructure so there's one element the
   test can assert on).
6. **Keep** the CSS-var / zero-re-render approach for the scrubbed animation
   (it's the right pattern), `ownsPin: true` + `noExitDim: true`, `SCROLL_SPEED`
   scrub, `refreshPriorityFor(sectionOrder("closing"))`, and the
   no-stranded-content invariant (DOM default = final lit state).
7. Consider whether the `HeroCanvas mode="closure"` reuse is still the right
   call, or whether a lighter closing visual (the P as a static/CSS element,
   or a small dedicated canvas) removes a class of the timing bugs. ADR-0001
   proposed a `nodeField.ts` archetype approach that was never built — evaluate,
   don't assume.

## Invariants

- `SectionBeat` INVARIANT: every tween `fromTo`/`from`, `immediateRender:false`,
  DOM default is the final lit state. If the pin never fires, the closing
  statement + CTA must render, lit and clickable.
- No `gsap`/`lenis` at route scope — this rides the lazy home chunk already.
- `prefers-reduced-motion` fully honoured (see #5).
- Anonymity: no client names anywhere (ADR-0001).

## Verification

- Headless CDP (`tests/preview-cdp.test.ts` harness): scroll into `#closing`
  with real wheel events, sample at 10 points through the 1.3vh pin — assert at
  no point do the headline and CTA both have computed `opacity > 0.1`
  simultaneously; assert the CTA's bounding box never intersects the headline's;
  assert the CTA button is `pointer-events:auto` and clickable at pin end and
  navigates to `/contact`.
- 1440, 768, 375 — screenshot the pin start / mid / end at each; the 375 shot
  must show the bespoke mobile layout, not a squeeze.
- reduced-motion: one static screenshot, CTA present + clickable, no overlap.
- Both `closing-lattice-pinned-scroll.test.tsx` tests green (updated to the real
  design).
- `ladder-probe.js`: `#closing` pin start/end unchanged unless the pin length is
  deliberately retuned (note it if so).
