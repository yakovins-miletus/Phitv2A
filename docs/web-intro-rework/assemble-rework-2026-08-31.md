# Web intro — "COORDINATE LOCK" (2026-08-31)

Addendum to `handoff.md`. The beat model, phase machine, signal tiers,
`useEntranceSettled()` hero gating and the `fresko-home-aperture` exit are all
unchanged — this rework rebuilt **Phase A (opening)**, the completion moment, and
the **content half of Phase D (exit)** of `src/shared/components/Preloader.tsx`.

## Two passes, and why the first was thrown away

**Pass 1 ("the city assembles")** flung the ten wordmark glyphs in from random
diagonals with entry rotation, a 10px motion blur, floating bokeh "satellites"
and a spring overshoot. It was rejected on sight: on a marketing site for a firm
whose product is precision, it read as a gradeschool generative toy. The glyphs
were literally unreadable for most of the animation.

**Pass 2 (this one)** is an instrument coming online. The design rule that
produced it:

> Axis-pure motion, no rotation anywhere, blur ≤ 5px, and the intro speaks the
> site's **existing** establishing-shot vocabulary rather than inventing its own.

That vocabulary is `stage/establishChoreo.ts`: the `.est-ruler` caliper hairline
(`scaleX 0→1`, expo-out), the gold `laser` sweep, and the rectangular `clip-path`
mask `inset(0% 100% 0% 0%)` → `inset(0% 0% 0% 0%)`.

## The composition

| Act | What happens |
|---|---|
| **1 — Rails** | Four 1px rules fly in, each translating along **its own long axis only** (top rail from the left, bottom from the right, left rail from the top, right from the bottom), closing a registration frame around the wordmark. |
| **2 — Pulses** | One 38px gold segment per rail runs inward and extinguishes — `PULSE_LEN_PX` matches the hero's `SIGNAL_TAIL_PX` exactly, so the intro and the hero read as the same instrument. Skipped on low-power. |
| **3 — Wordmark** | **Resolves in place; it does not fly.** A clip wipe with a 1px gold laser riding the edge; per-letter tracking closes via `trackingOffset()` (transform-only — animating `letterSpacing` would reflow) with a 4px blur that resolves. |
| **4 — Readout** | The caliper hairline draws `scaleX 0→1` from `left center`; the gold fill on top is still the only real-signal-driven element. Mono status/percent restyled to the house instrument spec (`MONO`, `0.16em`, uppercase, tabular-nums). |
| **Lock** | When the blocking signals resolve, four corner ticks snap into the frame and a **dedicated** gold bar makes one confirming sweep. The instrument reporting a fix. |
| **Exit** | Rails retract along their own axes, the wipe reverses, ticks/readout fade — then the preserved aperture opens. |

## Bugs found and fixed during verification

1. **The wordmark never appeared on a warm load.** The acts were *sequenced*:
   rails `0.52` → wipe at `0.64` → wipe `0.62` + stagger, landing at ~1.53s. But
   `entranceDone` opens at `2 * BEAT_S` (520ms) and on a warm cache the exit
   starts one `SETTLE_HOLD_MS` later (~1.04s) — so the wordmark was wiped *out*
   before it finished wiping *in*. Fixed by **overlapping** the acts
   (`WIPE_DELAY_S = 0.08` starts the wipe *during* the rails) and tightening
   every duration. The whole assembly now lands in ~0.68s, leaving ~360ms of the
   finished composition held still. `ASSEMBLY_BUDGET_S` plus five arithmetic
   tests pin this so it cannot silently regress.
2. **The lock sweep fought the wipe's laser.** Both drove `laserRef`; on a warm
   cache they overlap, and motion interrupts the first mid-flight and commits it
   wherever it landed — stranding a bright vertical bar across the wordmark. The
   lock now owns a separate element.
3. **Malformed keyframes.** The lock sweep had `x` with 2 stops against
   `opacity`/`times` with 3.
4. **Wordmark rest state was `WIPE_HIDDEN`**, so any failed tween left it
   permanently clipped out. Now rests at `WIPE_SHOWN` — the same "DOM default is
   the final lit state" rule `SectionBeat` follows; hiding is the letters' own
   `opacity: 0`.

## Files

- `src/shared/components/preloaderChoreo.ts` — rewritten: `RAILS`, `PULSES`,
  `TICKS`, the wipe literals, timing, `railStart`/`railExit` (axis-pure: exactly
  one non-zero component, on the rail's declared axis), `trackingOffset`.
  Pure module, no imports. Every `rot` field deleted.
- `src/shared/components/Preloader.tsx` — Phase A, lock, exit, JSX.
- `tests/motion/preloader-choreo.test.ts` — 22 parity tests including the
  axis-purity guarantee, `CHAR_BLUR_PX <= 5` readability guard, and the assembly
  budget arithmetic.

## Invariants held

`motion/react` only (no gsap — first-paint path) · `data-testid="preloader"` and
the `00%/50%/100%/WARMING — …/READY` strings · Phases B & C, `SETTLE_HOLD_MS`,
`MAX_SETTLE_MS`, `BEAT_FAILSAFE_MS`, Escape → `forced` · `reduced === true` →
instant `onStartExit()` + `finish()` · the `root.style.clipPath` aperture block,
its comment, `Promise.all(out)` and the belt-and-braces timer, **byte-for-byte** ·
transform / opacity / clipPath / filter only.

## Verified 2026-08-31

- `yarn test` — 48 files, **509 passed**. `yarn typecheck` clean, `yarn lint` 0
  errors.
- One unhandled `document is not defined` teardown error from `motion`'s
  projection node surfaces intermittently in the full run, attributed to whatever
  file is running (usually a `careers-*` test). **Pre-existing** — reproduced on
  the untouched committed `Preloader.tsx` (it even attributed one instance to
  `preloader.test.tsx` with this work absent). Not caused by this change.
- Browser preview at 1440×900 and 375×812: rails converge, wordmark wipes in
  behind the laser, caliper fills to full gold, ticks lock, aperture reveals the
  hero. Console clean apart from `localhost:8000` (Heimdall not running).
- Note for future debugging: holding the preloader open by inflating its timers
  makes `motion`'s rAF-driven tweens **freeze mid-flight** in the preview pane —
  values sampled that way look like stuck animations but are a capture artifact.
  Judge motion from a live screenshot burst instead.
