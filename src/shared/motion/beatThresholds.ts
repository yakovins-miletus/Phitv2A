/**
 * Single source of truth for home-page **reveal** thresholds.
 *
 * Before this module the page carried four hand-tuned values with no
 * convention behind them — major establishing shots at `top 78%`, mini shots at
 * `top 85%`, `StageSection` at `top 78%`, and `AppetizerReveal` (since deleted;
 * its scrub was folded into `SectionBeat`) at `top 78%`. A
 * shot and the section it announces therefore fired at two different scroll
 * offsets, which is one of the reasons the pairs read as mistimed. Every reveal
 * trigger now starts from `BEAT_START`; tuning the page's entrance feel is a
 * one-line change here rather than a hunt through four components.
 *
 * NOT a reveal, and deliberately exempt from this convention:
 * `useStagePresence` (`StageSection.tsx`) uses `top 50%` / `bottom 50%`. That
 * trigger animates nothing — it is a *presence tracker* that reports which
 * section owns the viewport middle to `setActiveSection()` for the dot rail,
 * and it runs under reduced motion too. Its thresholds describe "occupies the
 * middle of the screen", which is a different question from "has entered far
 * enough to start playing". Do not fold it into these constants.
 */

/**
 * Entrance threshold: a beat starts when its trigger's top reaches 75% of the
 * viewport height, i.e. a quarter of the way up from the fold. Slightly earlier
 * than the old 78% majority so the reveal has visibly begun by the time the
 * element is comfortably on screen, and much later than the old mini-shot 85%,
 * which fired while the shot was still essentially at the bottom edge.
 */
export const BEAT_START = "top 75%";

/**
 * Where a beat's ENTRANCE trigger arms — deliberately earlier than
 * `BEAT_START`, and not interchangeable with it.
 *
 * The content tween runs `immediateRender: false`, so its from-vars are written
 * when the trigger fires rather than when the tween is built. That is what
 * guarantees the no-stranded-content invariant: a beat whose trigger never
 * fires renders lit instead of blank. The cost is that the moment the trigger
 * fires is now visible to the reader — and at `BEAT_START` the section is
 * already a quarter of the way up the viewport, so correctly-placed content
 * was seen snapping down ~90px and dimming to ~0.15 before re-animating.
 *
 * "top bottom+=45%" arms while the section's top edge is still ~0.45
 * viewport-heights BELOW the fold — 0% visible, with runway to spare. Plain
 * "top bottom" was not early enough: upstream pinned tracks push the moment
 * ScrollTrigger reports entry to when the section box is already well inside
 * the viewport (measured: services y=87, process y=71, candidates y=47), so
 * the from-vars — written on first render because the content tween is
 * `immediateRender: false` — landed in front of the reader and the 0.45s
 * `CONTENT_ENTER_DURATION` tween had no offscreen scroll distance to run
 * before the section was being read. Firing 45% of a viewport early gives the
 * from-vars a guaranteed-unseen landing and the reveal real scroll runway to
 * complete in.
 *
 * `BEAT_START` remains the threshold for everything else (the exit range is
 * still expressed relative to it); this constant governs only when the
 * entrance timeline is armed.
 */
export const BEAT_ENTER_START = "top bottom+=45%";

/**
 * Exit-dim range, for the scrubbed recede that Phase 3+ will create as a
 * separate top-level trigger (GreenSock forbids `scrub` + `toggleActions` on
 * one trigger, but permits two triggers on one element with disjoint ranges).
 *
 * This used to be derived (`bottom 30%`) from a retired single-timeline split of
 * 0.35 enter / 0.47 hold / 0.18 exit. That derivation no longer describes the
 * code — the entrance and the exit have been two separate triggers since Phase
 * 3 — and the value it produced was actively wrong: on a `minHeight: 100svh`
 * section, `bottom 30%` opens the dim while the section is still ~70% on screen
 * and being read, so a scrub reversal there is a reversal the reader watches.
 *
 * `bottom 10%` instead: the recede begins only once the section is genuinely
 * leaving. The end is unchanged — the dim completes exactly as the section
 * clears the top of the viewport.
 */
export const BEAT_EXIT_START = "bottom 10%";
export const BEAT_EXIT_END = "bottom top";

/**
 * SCRUB POLICY — when a ScrollTrigger may use `scrub` at all.
 *
 * `SCROLL_SPEED` appears in several components with no shared statement of when
 * scrubbing is legitimate, and the ambiguity has cost real bugs (see STAGE_EXIT
 * in stageChoreo.ts). The rule:
 *
 *   SCRUB      pins and progress-linked narratives — anything where the reader's
 *              scroll position IS the timeline position and reversing is the
 *              intended, legible behaviour (UseCasesNarrative, DailyLifeSection,
 *              JourneyTimeline).
 *   DO NOT     entrances and recedes. These are events, not progressions. A
 *   SCRUB      scrubbed one plays backwards on every scroll micro-reversal.
 *              Use a time-based tween on a `once` trigger instead.
 *
 * The one scrubbed tween that is not a pin — SectionBeat's exit dim — is
 * permitted only because it animates opacity alone, which makes its reversal
 * imperceptible. That exemption does not generalise.
 */

/**
 * Page order → `refreshPriority`.
 *
 * ScrollTrigger sorts its refresh queue with `(refreshPriority || 0) * -1e6 +
 * _sortY` (`node_modules/gsap/ScrollTrigger.js`, `_sort`). **Higher priority
 * refreshes first**, and anything that does not declare one sits at an implicit
 * 0. Refresh must run top-to-bottom, because refreshing a trigger reverts the
 * pins above it — a trigger measured before an upstream pin has settled reads
 * offsets that are wrong by that pin's spacer height.
 *
 * Hence the whole scale is kept **positive**: every beat that opts in refreshes
 * ahead of the un-migrated triggers still sitting at 0, in page order among
 * themselves, and the un-migrated ones then refresh last by their own page
 * position. A negative scale would invert that and push the three pins *behind*
 * every establishing shot below them — measured at ~850px of trigger
 * displacement on the ladder probe at all three viewports.
 *
 * `order` is the page index (hero = 0, counting down the page); the base is
 * simply larger than the number of ordered beats so nothing goes non-positive.
 */
export const BEAT_REFRESH_BASE = 20;

export function refreshPriorityFor(order: number): number {
  return BEAT_REFRESH_BASE - order;
}
