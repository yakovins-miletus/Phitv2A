/**
 * Parity oracle for the scroll/motion refactor.
 *
 * Pixel-diffing Lenis + GSAP is nondeterministic — the smoothing loop means two
 * runs at "the same" scroll offset are never at the same offset. So what we lock
 * down is ScrollTrigger *geometry*: every trigger's resolved start/end, the
 * document height they were computed against, and the transform/opacity of a
 * fixed set of markers sampled at a fixed ladder of scroll positions. Layout
 * shifts, threshold changes, and pin-distance changes all surface here.
 * Screenshots are a secondary signal, not the gate.
 *
 * FULLY SYNCHRONOUS BY DESIGN. requestAnimationFrame is frozen in a hidden or
 * backgrounded tab and setTimeout is throttled to ~1s there, so an async probe
 * either stalls forever or takes minutes. Instead we drive Lenis and
 * ScrollTrigger by hand — `lenis.scrollTo(y, {immediate, force})` then
 * `lenis.raf()` then `ScrollTrigger.update()` — which lands the page exactly on
 * the requested offset in one synchronous pass. Verified: requested 2000/6000/
 * 11000 all yield scrollY === lenisScroll === the request.
 *
 * KNOWN BLIND SPOT: anything driven by React state rather than by GSAP is not
 * settled when we sample, because React's re-render is asynchronous. Today that
 * is the hero (SuperHeroSequence writes scrollProgress to state every scrub
 * frame). It reads consistently before and after any pure refactor, so the diff
 * stays valid — but Stage 10's hero work changes that mechanism, and must be
 * verified with the dedicated hero ladder described in the plan, not this one.
 *
 * Requires the DEV-only `window.__lenis` handle from
 * src/shared/components/SmoothScroll.tsx.
 *
 * Usage: paste `ladderProbe`'s body into the browser against `npm run dev`,
 * once per viewport. Compare runs with:
 *   diff <(jq -S . before.json) <(jq -S . after.json)
 */

/** Sampled at every stop. A missing selector records null rather than throwing. */
const MARKERS = [
  "header",
  "#stats",
  "#use-cases",
  "#daily-life",
  "footer",
  "[data-eyeflow]",
  // Sections touched by the reveal-choreography refactor. Without these the
  // pillars/position pair and the two orphan sections are unsampled, so a
  // threshold change there would not surface in the diff at all.
  // WS-02 re-order: "#hero-position" (MarketPosition) is gone — the section
  // was deleted outright. "#global-markets" is its replacement's sibling, the
  // lifted global-markets statement that now opens this run.
  "#global-markets",
  "#hero-pillars",
  "#hero-mission",
  "#process",
  "#closing",
];

/** 2dp, so sub-pixel jitter doesn't produce a diff on every line. */
const r2 = (n) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n * 100) / 100 : null);

function ladderProbe({ stops = 40 } = {}) {
  const ST = window.ScrollTrigger;
  if (!ST) return { error: "window.ScrollTrigger absent — is the home chunk loaded?" };
  const lenis = window.__lenis ?? null;

  const seek = (y) => {
    if (lenis) {
      lenis.scrollTo(y, { immediate: true, force: true });
      lenis.raf(performance.now());
    } else {
      window.scrollTo(0, y);
    }
    ST.update();
  };

  const sampleMarkers = () =>
    Object.fromEntries(
      MARKERS.map((sel) => {
        const el = document.querySelector(sel);
        if (!el) return [sel, null];
        const rect = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return [
          sel,
          {
            top: r2(rect.top),
            height: r2(rect.height),
            opacity: r2(parseFloat(cs.opacity)),
            transform: cs.transform === "none" ? "none" : cs.transform,
            visibility: cs.visibility,
          },
        ];
      }),
    );

  // Geometry first, at rest. start/end are absolute document offsets resolved
  // from layout — they need no scrolling to read, and they are the single most
  // sensitive parity signal available.
  ST.refresh();
  seek(0);

  const triggers = ST.getAll()
    .map((t) => ({
      id: t.vars.id ?? null,
      trigger:
        (t.trigger &&
          (t.trigger.id ||
            (t.trigger.dataset && t.trigger.dataset.stageSection) ||
            t.trigger.tagName)) ||
        null,
      start: r2(t.start),
      end: r2(t.end),
      pin: Boolean(t.pin),
      scrub: t.vars.scrub ?? false,
    }))
    // ScrollTrigger's own order is creation order, which the extraction stages
    // legitimately change. Sort so a pure move isn't reported as a diff.
    .sort((a, b) => a.start - b.start || String(a.id).localeCompare(String(b.id)));

  const docHeight = document.documentElement.scrollHeight;
  const maxScroll = Math.max(0, docHeight - window.innerHeight);

  const ladder = [];
  for (let i = 0; i < stops; i += 1) {
    const targetY = Math.round((i / (stops - 1)) * maxScroll);
    seek(targetY);
    ladder.push({
      targetY,
      actualY: Math.round(window.scrollY),
      // Keyed by index, not by vars.id: only 2 of 18 triggers declare an id, so
      // an id-keyed map would drop 16 of them. Index is stable because
      // `triggers` above is sorted by start offset.
      progress: ST.getAll()
        .slice()
        .sort((a, b) => a.start - b.start)
        .map((t) => r2(t.progress)),
      markers: sampleMarkers(),
    });
  }

  seek(0);

  return {
    url: location.pathname,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    lenisActive: Boolean(lenis),
    docHeight,
    triggerCount: triggers.length,
    triggers,
    ladder,
  };
}

export { ladderProbe, MARKERS };
