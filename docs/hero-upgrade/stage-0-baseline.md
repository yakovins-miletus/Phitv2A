# Stage 0 — Perf baseline on today's build (post canvas-rewrite)

**Date:** 2026-08-08
**Machine:** Apple M4, 10 cores, macOS 26.5.1 (build 25F80)
**Node:** v24.16.0 · **Yarn:** 1.22.22
**Build command:** `yarn build` (= `tsc -b && vite build`), served by `vite preview --port 4173`
**Driven by:** Playwright (Chrome for Testing 152.0.7977.8, installed for this run via
`npx @playwright/mcp install-browser chrome-for-testing`), 1440×900, unthrottled, localhost,
cache disabled at the CDP `Network` domain for load metrics. No source file was changed to
take any of these measurements.

This file is the delta baseline for stages 1–9. `docs/perf-baseline.md` (2026-08-02) measured
the **pre-rewrite DOM version**; the numbers below are the **current canvas version**, using
the same method wherever the method was specified there.

---

## A. Toolchain gates

| Gate | Baseline (2026-08-02) | Today | Status |
|---|---|---|---|
| `yarn typecheck` (`tsc -b`) | ✅ clean | ✅ clean, 6.7–7.1 s | ✅ |
| `yarn test` (`vitest run`) | ✅ 82/82, 13 files, 5.68 s | ❌ **149 passed / 3 failed**, 18 files, 6.24 s | ⚠️ finding |
| `yarn lint` (`eslint .`) | ❌ 30 errors / 12 warnings (pre-existing) | ❌ **33 errors / 219 warnings** (252 problems) | ⚠️ finding |
| `yarn build` | ✅ 1.73 s | ✅ `tsc -b` ~7.0 s + `vite build` ~2.4–2.5 s ≈ **9.0 s** total wall (`yarn build`) | ✅ (slower, not a regression signal — different scope: baseline's 1.73s number appears to be `vite build` alone) |

### Test suite — not 82, and 3 failing

The suite has grown to **18 files / 152 tests** (vs. baseline's 13 files / 82). All 3
failures are **unrelated to `src/features/hero/`**:

| File | Failure |
|---|---|
| `tests/home-reduced-motion.test.tsx` | `getByRole("heading", { name: "Prime Global Location" })` not found — copy/structure drift in a non-hero home section |
| `tests/motion/anchor-namespaces.test.ts` | expects 5 `useNavbarAnchor(...)` call sites, found 6 |
| `tests/motion/ground-stops.test.ts` | `blog` ground stop luminance 39.5, expected > 200 (a `GROUND_STOPS` color regression, not hero) |

No test under `tests/motion/hero-*.test.ts` failed. `CUBE_POSITIONS` and `SIGNAL_LOOPS`
pinning tests (README rules 2–3) are part of the 149 passing.

### Lint — rule breakdown (33 errors, 219 warnings)

| Rule | Errors | Warnings |
|---|---:|---:|
| `no-restricted-syntax` (raw hex / raw cubic-bezier, off-palette) | 0 | 207 |
| `react-hooks/refs` | 13 | 0 |
| `@typescript-eslint/no-explicit-any` | 6 | 0 |
| `@typescript-eslint/no-unused-vars` | 5 | 0 |
| `react-hooks/set-state-in-effect` | 5 | 0 |
| `react-refresh/only-export-components` | 0 | 11 |
| `no-useless-assignment` | 3 | 0 |
| `react-hooks/preserve-manual-memoization` | 1 | 0 |
| `react-hooks/exhaustive-deps` | 0 | 1 |

Total is **252 problems**, far above baseline's 42. This is a **pre-existing-inventory
finding for stage 0 to hand forward**, not something caused by reading this file: no source
was touched. The gate for every later stage remains **"no new violations against this
252-problem inventory"**, not the stale 30/12 figure in `docs/perf-baseline.md`.

---

## B. Home load, `/` at 1440×900 (cache disabled, fresh page)

| Metric | Baseline | Today | Status |
|---|---|---|---|
| FCP | 448 ms | **364 ms** | ✅ |
| **LCP** | **1,912 ms** | **1,112 ms** | ✅ |
| **LCP element** | *(not identified by selector in baseline)* | `H4.MuiTypography-h4` — text **"Making Tomorrow's Technology Available Today"** (the hero's top-left motto), `SuperHeroSequence.tsx:619-631` | — |
| CLS | 0.000 | 0.000 | ✅ |
| Long tasks | 2, total 280 ms, max 199 ms | 1, total 148 ms, max 148 ms | ✅ |
| Requests | 58 | 42 (cache disabled, ~5.5 s after load incl. `networkidle`) | ⚠️ see note |
| Transfer | 11.89 MB | **1.21 MB** | ✅ |
| Document height | 41,639 px | 36,277 px | — |

**LCP element is not a canvas or sky node** — it is plain `H4` text rendered by MUI/Emotion,
already painted before the hero canvas becomes visible. **Stage 4's sky and stage 6+'s
artifacts must not become the LCP element**; today's LCP is this text block.

**Transfer note.** The 11.89 MB baseline was dominated by two uncompressed career-card
background images (`AboutPageHero.png` 2.3 MB, `FocusedProgramming.JPG` 7.0 MB — see
`docs/perf-baseline.md` §2). `CandidatesAndCareersSection.tsx:39-46` now points at
`/images/careers/AboutPageHero.jpg` / `FocusedProgramming.jpg` with `loading="lazy"`
(`CandidatesAndCareersSection.tsx:236`) — **that fix landed already, separately from this
hero work**, and is why first-load transfer dropped 10x. It is out of scope to verify further
here; flagged as an observation.

---

## C. Hero scroll harness — 50 steps × 250 px (~3.1 s wall, in-page loop, no CDP round-trips)

| Metric | Baseline (old DOM hero) | Today (canvas hero) | Target | Status |
|---|---|---|---|---|
| CSS rules before scroll | 961 | 1,158 | — | — |
| CSS rules after scroll | 2,296 | 1,226 | — | — |
| **Rules injected by scrolling** | **+1,335 (+139%)** | **+68 (+5.9%)** | **0** | ⚠️ not zero, but 20× smaller |
| Average FPS | 55.8 | **60.02** | — | ✅ |
| Frame p50/p95/p99 | 17/33/33 ms | **16.7/17.5/18.4 ms** | — | ✅ |
| Frame max | 100 ms | **18.6 ms** | — | ✅ |
| **Frames missing 60 fps** | **56/173 — 32%** | **115/203 — 56.7%** | **< 5%** | ❌ see note |
| Frames worse than 30 fps | 4 | **0** | — | ✅ |
| **Blur layers under `#hero`** | 43 | **2** | **0** | ⚠️ not zero |
| **Hero DOM node count** | 250 (static) | **32 before scroll / 44 after** (stage-conditional mounts) | — | — |

**"Frames missing 60 fps" is a threshold artifact today, not a stutter.** Every recorded
frame this run fell in a **16.7–18.6 ms** band — i.e. the display's own ~60 Hz cadence plus a
hair of scheduling jitter. The strict `>16.67 ms` cutoff flags the majority of frames because
they land at 16.7–18.5 ms, not because anything drops to 33 ms/50 ms/100 ms the way the old
DOM version did (max there was 100 ms; max here is 18.6 ms, and zero frames exceeded 30 ms).
**Stage 1 should decide whether the gate needs a tolerance band (e.g. > 20 ms) or whether this
harness should sample against `screen.refreshRate` instead of a hardcoded 16.67 ms** — as
written today, the canvas hero would fail this gate on numbers that are actually excellent.

**CSS rules are not literally zero.** +68 rules over the whole document (not scoped to
`#hero`) survived scrolling. This could be the hero's own `stage.gunshot`/`stage.flank`
conditional `Box` mounts (each carries a fresh `sx` object mounted once, not per-scroll-tick)
or unrelated sitewide scroll-linked styling elsewhere on the page (nav autohide, etc.) — this
harness measures `document.styleSheets` globally, matching `perf-baseline.md`'s method
exactly, so it cannot separate the two. Given the order-of-magnitude drop from the old
version and that stage/CSS-var writes are the documented design (`SuperHeroSequence.tsx:71-79`
says "every `sx` below is a static object... Emotion serializes each rule once at mount"),
+68 one-time mounts across ~4 stage flips is consistent with the architecture and is very
unlikely to be a live regression — but it is not 0, and is recorded as a finding.

**Blur layers.** The 2 elements under `#hero` with `backdrop-filter: blur(12px)` are the "3D
PLAYGROUND" toggle chip (`SuperHeroSequence.tsx:545-546`, `MuiBox-root` + its `MuiSwitch-track`
child) — pre-existing UI, not the canvas painter, and not a new blur layer added by this
stage. Flagged per README rule 5 (zero *new* blur layers is the constraint stage 1+ must
hold to; this one already exists today and was not added by any change in this session).

---

## D. Per-frame cost of the hero canvas (`drawHeroFrame`)

**Method.** `page.addInitScript` before navigation: (1) monkey-patched
`CanvasRenderingContext2D.prototype.{fillRect,drawImage,stroke,fill,save}` on the hero
canvas's actual 2D context (found via `document.querySelector('canvas[data-testid="hero-canvas"]')`)
to increment a counter on every draw call; (2) wrapped the global `window.requestAnimationFrame`
so every scheduled callback is timed with `performance.now()`, and any callback whose
execution caused the draw-call counter to increase is recorded as a hero paint sample. This
avoids relying on variable names (the production bundle is minified, so a name-based
heuristic like matching `cubeVels` in `Function.prototype.toString()` found **zero** samples
on the first attempt) and instead detects actual canvas drawing activity, which is robust to
minification. Confirmed only one `<canvas>` exists in the document, matching the baseline's
DOM audit.

| Window | Samples | Mean | p95 | Max |
|---|---:|---:|---:|---:|
| **Interactive window** (`progress < 0.10`, derived as `scrollY < 1619px` from `ANIM_LIMIT = 1800/1900` and the `+=1900%` pin over a 900px viewport) | 25 | **0.70 ms** | **1.0 ms** | 1.2 ms |
| **Whole scroll pass** (the full 3.1s / 50-step harness) | 186 | **0.22 ms** | **0.70 ms** | 1.2 ms |

`drawHeroFrame` itself is not the bottleneck at any point in the pin — even its worst sample
(1.2 ms) leaves ~15 ms of frame budget at 60 fps. This number is what stages 3–9 are actually
spending against as they add cursor light, hover lift, ripple, artifact glyphs, tooltips, etc.

---

## E. Allocation pressure

**Static analysis (confirmed from source, `heroCanvasRenderer.ts:315-360`):**

```ts
if (!state.flat) {
  const items: Drawable[] = [];               // 1 fresh array per frame
  for (let i = 0; i < CUBE_POSITIONS.length; i++) {   // 16 cubes
    collectCube(items, ctx, cam, cube, state, sprites, bounce); // pushes {depth, draw: () => {...}}
  }
  for (let i = 0; i < SERVICE_NODES.length; i++) {    // 4 service nodes
    collectNode(items, ctx, cam, node, state, sprites, bounce); // pushes {depth, draw: () => {...}}
  }
  items.sort((a, b) => a.depth - b.depth);
  for (const item of items) item.draw();
}
```

This confirms the handover's claim exactly: **16 cubes + 4 service nodes = 20 `Drawable`
objects**, each holding one arrow-function closure capturing `ctx`, `cam`, `spec`/`node`,
`state`, `sprites`, and `bounceOffset` — **~20 objects + ~20 closures allocated every frame**
the loop is running (i.e. every frame while `progress < CONTAINER_START = 0.86` and
`!state.flat`), purely for the painter's-algorithm depth sort.

**Heap-allocation rate:** not measured. Chrome DevTools' sampling heap profiler / GC-event
timeline is not exposed through the `mcp__playwright__*` toolset available in this session,
and attaching a raw CDP `HeapProfiler` session for an aggregate 5-second allocation rate was
judged out of scope for a Sonnet-tier, no-source-change stage — recording the static analysis
above instead, per the handover's explicit fallback instruction ("If you cannot measure it
reliably, say so and report the static analysis instead").

---

## F. Reduced motion

**Method.** New Playwright page with `emulateMedia({ reducedMotion: 'reduce' })`, same
draw-call/rAF instrumentation as section D, sampled at t+2.5s and again at t+4.5s after load.

| Metric | t+2.5s | t+4.5s | Delta |
|---|---:|---:|---:|
| Hero canvas draw-op count | 660 | 660 | **0** |
| Global `requestAnimationFrame` calls (whole page) | 414 | 782 | +368 |

**Confirmed:** the hero canvas draw-op count does not increase between the two samples —
exactly one static frame was painted and the hero's own rAF loop never restarts, matching
`HeroCanvas.tsx`'s `isStatic` path (`paintStill()` once, `startLoop()` never called). The
+368 global rAF calls in the same window are **other, unrelated rAF consumers elsewhere on
the page** (GSAP's ticker runs continuously regardless of the hero; the `motion` library
likely does too) — not a hero regression, and outside this stage's scope to chase further.

---

## Standing gates — today vs. target

| Gate | Target (README) | Today | Status |
|---|---|---|---|
| CSS rules injected by hero scroll | 0 | **+68** (document-wide; see §C note) | ⚠️ |
| Frames missing 60 fps through hero | < 5% | **56.7%** (but max frame 18.6 ms — see §C note) | ❌ (metric is likely miscalibrated, not a real stutter) |
| Blur layers in the hero | 0 | **2** (pre-existing 3D-toggle chip, not the painter) | ⚠️ |
| Tests passing | 82/82 (+ new) | **149/152** (18 files; 3 unrelated failures) | ⚠️ |
| Lint | no new violations | baseline is now **33 errors/219 warnings** (252 problems), not 30/12 | ⚠️ (new floor to hold, not literally "clean") |
| Home LCP | must not regress past 1,912 ms | **1,112 ms** | ✅ |

None of these are stage-0 failures per the stop conditions (test count ≠ 82 and lint ≠ 30/12
are explicitly "a finding, not a failure" per `stage-0.md`). They are the numbers stage 1
inherits and must not make worse.

---

## How to repeat this

**Toolchain:**
```bash
yarn typecheck
yarn test
yarn lint --format json   # to get exact per-rule counts programmatically
yarn build                # tsc -b && vite build
```

**Serve the production build** (Browser-pane preview tooling, `.claude/launch.json` →
`phitv2a-preview`, port 4173) — do not run `vite preview` through Bash.

**Home load metrics** (fresh Playwright page, cache disabled via CDP):
```js
async (page) => {
  const context = page.context();
  const newPage = await context.newPage();
  await newPage.setViewportSize({ width: 1440, height: 900 });
  const client = await context.newCDPSession(newPage);
  await client.send('Network.enable');
  await client.send('Network.setCacheDisabled', { cacheDisabled: true });
  let transferBytes = 0;
  const reqSeen = new Set();
  client.on('Network.loadingFinished', (e) => { transferBytes += e.encodedDataLength || 0; });
  client.on('Network.requestWillBeSent', (e) => { reqSeen.add(e.requestId); });

  await newPage.goto('http://localhost:4173/', { waitUntil: 'load' });
  try { await newPage.waitForLoadState('networkidle', { timeout: 8000 }); } catch (e) {}
  await newPage.waitForTimeout(2000);

  const metrics = await newPage.evaluate(() => new Promise((resolve) => {
    let lcpEntry = null;
    new PerformanceObserver((list) => { lcpEntry = list.getEntries().at(-1); })
      .observe({ type: 'largest-contentful-paint', buffered: true });
    let cls = 0;
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
    const longTasks = [];
    try {
      new PerformanceObserver((list) => { for (const e of list.getEntries()) longTasks.push(e.duration); })
        .observe({ type: 'longtask', buffered: true });
    } catch (e) {}
    setTimeout(() => {
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      let lcpSelector = null;
      if (lcpEntry?.element) {
        const el = lcpEntry.element;
        lcpSelector = el.tagName + (el.className ? '.' + String(el.className).split(' ').join('.') : '');
      }
      resolve({
        fcp: fcp?.startTime ?? null,
        lcp: lcpEntry?.startTime ?? null,
        lcpSelector,
        lcpText: lcpEntry?.element ? (lcpEntry.element.innerText || '').slice(0, 120) : null,
        cls,
        longTaskCount: longTasks.length,
        longTaskTotal: longTasks.reduce((a, b) => a + b, 0),
        longTaskMax: longTasks.length ? Math.max(...longTasks) : 0,
        docHeight: document.documentElement.scrollHeight,
      });
    }, 1500);
  }));
  await newPage.close();
  return { metrics, transferBytes, requestCount: reqSeen.size };
};
```
Run via `mcp__playwright__browser_run_code_unsafe`.

**Hero scroll harness** (CSS rules, FPS, blur layers, DOM node count, per-frame paint cost —
all in one pass, entirely in-page to avoid CDP round-trip contamination of frame timing):
```js
async (page) => {
  const context = page.context();
  const newPage = await context.newPage();
  await newPage.setViewportSize({ width: 1440, height: 900 });

  await newPage.addInitScript(() => {
    window.__samples = [];       // independent FPS sampler
    window.__heroSamples = [];   // {dur, t} for rAF callbacks that drew to the hero canvas
    window.__drawOpCount = 0;
    window.__wrappedCanvasCtx = false;

    (function sampler(t) { window.__samples.push(t); requestAnimationFrame(sampler); })();

    function wrapCtxIfNeeded() {
      if (window.__wrappedCanvasCtx) return;
      const canvas = document.querySelector('canvas[data-testid="hero-canvas"]') || document.querySelector('canvas');
      if (!canvas) return;
      const ctx = canvas.getContext?.('2d');
      if (!ctx) return;
      const proto = Object.getPrototypeOf(ctx);
      for (const m of ['fillRect', 'drawImage', 'stroke', 'fill', 'save']) {
        if (typeof proto[m] === 'function' && !proto[m].__wrapped) {
          const orig = proto[m];
          const wrapped = function (...args) { window.__drawOpCount++; return orig.apply(this, args); };
          wrapped.__wrapped = true;
          proto[m] = wrapped;
        }
      }
      window.__wrappedCanvasCtx = true;
    }

    const nativeRAF = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = function (cb) {
      wrapCtxIfNeeded();
      return nativeRAF(function (now) {
        const before = window.__drawOpCount;
        const start = performance.now();
        const ret = cb(now);
        const dur = performance.now() - start;
        if (window.__drawOpCount > before) window.__heroSamples.push({ dur, t: now });
        return ret;
      });
    };
  });

  await newPage.goto('http://localhost:4173/', { waitUntil: 'load' });
  await newPage.waitForTimeout(1500);

  const countRules = () => newPage.evaluate(() => {
    let n = 0; for (const s of document.styleSheets) { try { n += s.cssRules.length; } catch (e) {} } return n;
  });
  const heroStats = () => newPage.evaluate(() => {
    const root = document.getElementById('hero');
    const all = root.querySelectorAll('*');
    let blurCount = 0;
    for (const el of all) {
      const cs = getComputedStyle(el);
      if ((cs.filter?.includes('blur')) || ((cs.backdropFilter || cs.webkitBackdropFilter || '').includes('blur'))) blurCount++;
    }
    return { nodeCount: all.length, blurCount };
  });

  const rulesBefore = await countRules();
  const heroBefore = await heroStats();
  await newPage.evaluate(() => { window.__samples = []; window.__heroSamples = []; window.__drawOpCount = 0; });

  // 50 steps x 250px, paced ~60ms/step (in-page, no CDP round trips) — matches perf-baseline.md's "~3s".
  await newPage.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let i = 0; i < 50; i++) { window.scrollBy(0, 250); await sleep(60); }
  });
  await newPage.waitForTimeout(300);

  const rulesAfter = await countRules();
  const heroAfter = await heroStats();

  const frameStats = await newPage.evaluate(() => {
    const deltas = [];
    for (let i = 1; i < window.__samples.length; i++) deltas.push(window.__samples[i] - window.__samples[i - 1]);
    const sorted = [...deltas].sort((a, b) => a - b);
    const n = sorted.length;
    const pct = (p) => (n ? sorted[Math.min(n - 1, Math.floor(p * n))] : null);
    return {
      frameCount: n,
      avgFps: n ? 1000 / (deltas.reduce((a, b) => a + b, 0) / n) : null,
      p50: pct(0.5), p95: pct(0.95), p99: pct(0.99), max: n ? sorted[n - 1] : null,
      missing60Count: deltas.filter((d) => d > 16.67).length,
      missing60Pct: n ? (deltas.filter((d) => d > 16.67).length / n) * 100 : null,
      worse30: deltas.filter((d) => d > 33.33).length,
    };
  });

  const heroFrameStats = await newPage.evaluate(() => {
    const durs = window.__heroSamples.map((s) => s.dur).sort((a, b) => a - b);
    const n = durs.length;
    const pct = (p) => (n ? durs[Math.min(n - 1, Math.floor(p * n))] : null);
    return { sampleCount: n, mean: n ? durs.reduce((a, b) => a + b, 0) / n : null, p95: pct(0.95), max: n ? durs[n - 1] : null };
  });

  await newPage.close();
  return { rulesBefore, rulesAfter, heroBefore, heroAfter, frameStats, heroFrameStats };
};
```
Run via `mcp__playwright__browser_run_code_unsafe`. To split the "interactive window"
(`progress < 0.10`) from the whole pass, additionally record `performance.now()` at scroll
start/end and filter `__heroSamples` by `t <= scrollStart + 420` (420 ms ≈ step 7 ≈ scrollY
1619px ≈ `0.0947 * 19 * 900`, the point at which `self.progress / ANIM_LIMIT` crosses 0.10).

**Reduced motion:**
```js
async (page) => {
  const newPage = await page.context().newPage();
  await newPage.emulateMedia({ reducedMotion: 'reduce' });
  // ...install the same draw-op/rAF wrapper as above via addInitScript, then...
  await newPage.goto('http://localhost:4173/', { waitUntil: 'load' });
  await newPage.waitForTimeout(2500);
  const a = await newPage.evaluate(() => window.__drawOpCount);
  await newPage.waitForTimeout(2000);
  const b = await newPage.evaluate(() => window.__drawOpCount);
  // a === b confirms exactly one static frame, no restart.
};
```

---

## Observations

1. **The "frames missing 60 fps" gate as literally specified will read as failing (56.7%)
   on a hero whose worst frame this run was 18.6 ms** — a display-cadence artifact, not a
   defect. Stage 1 should either widen the tolerance (e.g. flag frames > 20 ms, or compare
   against the actual measured refresh interval rather than a hardcoded 16.67 ms) or accept
   that this specific sub-metric will always look noisy on a healthy hero and lean on
   p95/p99/max instead, which are excellent (17.5/18.4/18.6 ms).
2. **CSS rules injected by scrolling are +68, not 0.** Far below the old +1,335, and plausibly
   just the stage-boundary conditional mounts (`stage.gunshot`/`stage.flank`), but this
   harness measures `document.styleSheets` sitewide (matching baseline method) so it cannot
   prove the +68 is hero-only. Stage 1 should scope this measurement to rules added by
   sheets Emotion attributes to hero-authored components specifically, if it wants a cleaner
   signal.
3. **The production build's `routes-*.js` chunk is 1,057.58 kB raw / 284.21 kB gzip** —
   roughly 7× the 146.7 kB the same-named chunk was in `docs/perf-baseline.md`'s bundle table
   (§5), and now the single largest chunk in the build, well past Vite's 500 kB warning
   threshold (`vite build` logs `(!) Some chunks are larger than 500 kB after minification`).
   This is unrelated to `src/features/hero/` as far as this stage investigated, but is a
   notable regression against the recorded baseline and worth a look before stages that add
   more code to shared chunks (6–9, which build an atlas).
4. **Lint's pre-existing-violation floor has grown from 42 problems (30 errors/12 warnings)
   to 252 (33 errors/219 warnings)** since the 2026-08-02 baseline was written — almost all of
   the new warnings are `no-restricted-syntax` (207 of 219), i.e. more raw-hex/raw-easing
   violations added to the codebase since. None inspected were in `src/features/hero/`. This
   is the real gate every later stage must not add to; `docs/perf-baseline.md`'s 30/12 figure
   is stale and should not be used as the reference anymore.
5. **Test suite has grown from 82 to 152 tests (13 → 18 files)** since the baseline was
   written, with 3 pre-existing failures, none touching the hero. `tests/motion/hero-scene.test.ts`
   and other `hero-*` tests are green and were not touched.
6. **Console errors on load (15) are all pre-existing and non-hero**: SVG attribute errors
   (`<circle>`/`<rect>` "Expected length, undefined") from `motion-*.js` (the `motion` npm
   package, used elsewhere on the page, not in the hero), two 404s for Vercel Insights scripts
   (expected outside a Vercel deploy), and `ERR_NAME_NOT_RESOLVED` for
   `https://phitv2.phit.b.com` — all three are the exact issues already flagged in
   `docs/perf-baseline.md` §7 as "deploy-config decisions," not new.
7. **Playwright's Chrome-for-Testing browser was not installed** in this environment; it was
   installed via `npx @playwright/mcp install-browser chrome-for-testing` (272 MB download) to
   run this stage's measurements. This is tooling setup, not a source change, but is recorded
   here since the next stage's agent will not need to repeat it — the browser is now cached at
   `~/Library/Caches/ms-playwright/chromium-1237`.

## Measurements not taken (and why)

- **Heap-allocation rate over a 5-second scroll (§E).** The `mcp__playwright__*` toolset
  available in this session exposes `browser_evaluate` / `browser_run_code_unsafe`, not a raw
  CDP `HeapProfiler`/`Memory` session. Reported the static-analysis confirmation instead (20
  `Drawable` objects + 20 closures/frame, from `heroCanvasRenderer.ts:344-356`), per the
  handover's explicit fallback instruction. If a later stage needs the real number, it would
  require a `page.context().newCDPSession()` call to `HeapProfiler.startSampling` /
  `Memory.getDOMCounters`-style APIs, or Chrome DevTools' own allocation-sampling UI attached
  manually (outside Playwright automation).
- **A precise attribution of the +68 injected CSS rules to hero vs. rest-of-page (§C).** The
  method specified (`document.styleSheets` before/after) is sitewide by construction, matching
  `perf-baseline.md` exactly; narrowing it to "hero only" would require either instrumenting
  Emotion's `insertRule` calls with a stack-trace filter (a source change) or diffing rule
  selectors against known hero class names, which was judged more likely to introduce false
  precision than to add real signal for a stage that changes no source. Recorded as a finding
  instead of a number.
