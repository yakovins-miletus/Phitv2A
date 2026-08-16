# Handover — Production-readiness audit & remediation

**Date:** 2026-08-17 (session ran 2026-08-16 evening → 2026-08-17 00:44 PST)
**Branch:** `audit/production-readiness-2026-08-17` (branched from `main` @ `44c71d0 "alph 0.7.1 - Pre audit"`)
**Scope:** Fresko public site only (`" Master P Frontend/Phitv2A"`). Heimdall, Newton, and the AWS staging config were **not** touched.
**Diff:** 62 files changed, +1497 / −2321. 22 files deleted, 5 created.

---

## 1. Why this ran

The site was believed to be far from production-ready on three axes: **content**, **performance**, and **improper GSAP/Lenis usage**. A four-lens audit (security, runtime performance, dynamic accessibility, route health) was run against a production preview build over isolated CDP, then a remediation pass, then the audit was re-run to verify.

**The headline finding reversed one of the three assumptions.**

---

## 2. What was disproved

Do not re-litigate these — they were tested, not assumed.

| Belief | Reality | Evidence |
|---|---|---|
| Lenis double-drives rAF alongside `gsap.ticker` | **False.** `lenis@1.3.25` defaults `autoRaf = false` (`node_modules/lenis/dist/lenis.mjs:433`) and `SmoothScroll.tsx` never overrides it | Source + runtime: one scroll loop |
| GSAP is misused | **Mostly false.** No `scrollerProxy`, no `scrub: true`, no `gsap.to(window, …)`, all four raw `ScrollTrigger.create` calls already inside `useGSAP` scopes | Full import-graph trace |
| The site is slow | **False.** LCP was already 400 ms, CLS 0, TTFB 11 ms | Uncontended CDP measurement |
| The 18 MB `daily-life.mp4` is a load-time problem | **False.** Correctly gated: `preload="none"` + IntersectionObserver + poster | `DailyLifeSection.tsx:155` |
| Placeholder content is everywhere | **False.** Zero `lorem`/`TODO`/`John Doe`/`example.com`/`console.log`/`debugger` in `src/` | Exhaustive grep |

**Caveat on measurement:** LCP swings 290 ms → 3736 ms purely from browser contention. Any future perf number taken while other browsers/agents are running is invalid. Run the perf pass alone.

---

## 3. What was actually wrong, and what changed

### 3.1 The site was lying to users (highest severity)

| Defect | Fix |
|---|---|
| `careers.$jobId.tsx` called `setFormSubmitted(true)` **unconditionally** after `mutate()` and never rendered `mutation.isError` — **job applications were silently dropped while candidates read "Application Received!"** | Gated on `mutation.isSuccess`, renders `messageFromError`, disables submit while pending |
| Innovation Lab waitlist never sent the email anywhere, then said "We will notify you at launch." | Form removed entirely |
| Footer GitHub/LinkedIn/Twitter all `href="#"` | Removed (no real URLs exist anywhere in the repo — **if these accounts exist, add them back**) |
| `src/features/innovation/fallback.ts` held **nine fabricated employees** ("Dr. Aris Thorne", "David K., Principal SRE Engineer") with invented checkable claims ("12-microsecond tick-to-trade", "18% slippage reduction"), re-exported through a public barrel | **Deleted.** Also deleted `InnovationPostList.tsx`, the component that would have rendered it |

### 3.2 The preloader blocked all mouse input for ~5.5 s on **every** hard page load

Found only in the post-fix verification pass — **worse than anything in the original audit**.

`Preloader.tsx` wrote `sessionStorage[PRELOADER_SESSION_KEY]` on completion; `AppShell.shouldShowPreloader()` **never read it**. The gate was dead code, so the full opaque `z-index: 99999` overlay replayed on every load of every route.

Measured with `elementFromPoint` at 150 ms intervals: blocked from **t=2007 ms through t=5088 ms**; `pointer-events` released at t≈5241 ms; clickable at t≈5549 ms. It intercepted a real click on the **job-application Submit button**. Keyboard passed straight through — so sighted keyboard users were activating controls behind an opaque screen.

**Fixed on three axes:** session gate wired (guarded `sessionStorage`, fails open), the empty full-viewport "Center Interactive Foreground Layer" set to `pointer-events: none`, and `inert` applied to the app wrapper while the preloader is up. The splash `<h1>` became a `<p>` (it was a duplicate `<h1>` on every route).

> Two subagents disagreed here and one was right: the perf auditor attributed the blocking to hero pointer gating (`heroVars.ts` `panelInteractive`); the a11y auditor traced it to the preloader with timing data. **The a11y attribution is correct.** The hero gating is a separate, much smaller issue affecting only the 3-link hero mini-nav.

### 3.3 Bundle — GSAP and Lenis were on every route

`vite.config.ts:125` states the invariant in its own comment ("lazy libs (gsap, lenis) … stay in their route chunks"). The import graph violated it via two `AppShell` edges: `→ Preloader` and `→ TransitionCurtain → SmoothScroll`.

| | Before | After |
|---|---|---|
| Eager JS, every route | 1111 KB raw / **303 KB br** | 992.7 KB / **262.0 KB br** |
| GSAP in eager chunks | 110 KB, `modulepreload`ed | **0** |
| Long tasks during scroll | 216 ms | **0 across 44 scroll steps** |
| `dist/` | 90 MB | 84 MB |

**Approach:** `Preloader.tsx` was **rewritten from GSAP onto `motion` v12** (already eager, so this removes the dependency rather than deferring it — and lazy-loading the preloader would have risked a blank flash at first paint). `TransitionCurtain.tsx` now `import("gsap")` dynamically behind a `requestIdleCallback` warm. Verified at runtime: gsap loads with `initiator: "script"`, never `"parser"`.

`scrollTriggerBridge.ts` was vestigial (AppShell no longer imported it; `revokeScrollTriggerRefresh()` was exported and never called) — rewired.

### 3.4 GSAP correctness

- `EyeFlow.tsx` ran **5× `getElementById` + 5× `getBoundingClientRect()` + `scrollHeight` every frame**, permanently, on home — a forced sync layout per frame, and the source of the 216 ms long task. Now caches offsets; re-measures only on `ScrollTrigger.refresh` and a 150 ms-debounced resize. Redundant `scroll` listener dropped. Reduced-motion guard added.
- Hero pin (`+=800%`) gained `anticipatePin: 1` and `invalidateOnRefresh: true`.
- Per-tick `gsap.to(proxy, …)` across that pin → `gsap.quickTo` (same `"drift"` ease, same 0.4 s).
- Missing `useGSAP` dependency arrays fixed in `SuperHeroSequence`, `FillText`, `AppetizerReveal` — `useReducedMotion()` returns `null` on first render, so the wrong branch was sticking permanently.
- `FillText.tsx`'s `gsap.matchMedia()` now reverts on unmount.

### 3.5 Accessibility

- **`TransitionCurtain` had no reduced-motion guard** — a ~4 s full-viewport sequence with counter-rotating rings on *every* navigation (WCAG 2.3.3). Now takes a fast path: **verified at 31 ms with the curtain never visible**.
- **Blog cards were `<div onClick>`** — keyboard-unreachable, crawler-invisible, which silently defeated the per-post SEO work. Now real router links (stretched-link pattern; the category `Chip` is a DOM sibling, not nested).
- ContactForm validation errors were announced to nobody (`[aria-live]` query returned `[]`, focus stayed on Submit). Now a `role="alert"` summary + focus moves to first invalid field + `aria-invalid`/`aria-describedby`.
- Video play/pause, mute, and seek slider had **no accessible name**; slider thumb was **7×7 px** (WCAG 2.5.8 needs 24×24). Labelled and hit-area enlarged to 24×24 with the visible dot unchanged.
- Article images had `alt=""`; now derive from `post.title`.
- `lenis/dist/lenis.css` is now imported (was never imported — which is *why* three components hand-roll `document.body.style.overflow`).

### 3.6 SEO, legal, content accuracy

- `pageHead()` extended: canonical, `og:url`, `og:image`, `og:site_name`, Twitter card, plus a 4th options param `{ noindex, canonicalPath }`. **All 10+ existing call sites unchanged.**
- `blog.$slug` and `innovation-hub.$slug` emitted identical titles for every post — now derive from the post.
- Soft-404 fixed client-side: the not-found route gets its own title/description, `noindex, nofollow`, and no canonical echoing the bogus path.
- `public/robots.txt` + `public/sitemap.xml` created (static routes only; `/innovation-hub/*` deliberately excluded).
- `/privacy` + `/terms` + `CookieNotice` scaffolded.
- Cert counts now derive from array length (AWS claimed **14**, listed **5**; Azure **4** vs **3**). "Six open roles" derives from the real 7. Disciplines summed to 95% → explicit "Other" row. Removed `100% Equal-opportunity employer` (a policy rendered as a statistic).
- Innovation Hub de-promoted from all five surfaces (nav, footer + DEMO badge, command palette, contact FAQ, reading chain, `WARM_ROUTES`). Route still resolves by direct URL **by design**.
- Sweep: 8 dead components + `features/team/`, 6 dead `CONTENT` keys, ~6.9 MB orphaned media, `NotFoundPage` wired up, `data-lenis-prevent` added to 5 scroll containers.

---

## 4. OPEN — needs a human decision

**Nothing below was guessed at. Each needs your call.**

| # | Item | Detail |
|---|---|---|
| 1 | **Legal text** | `/privacy` and `/terms` are scaffolds with visible "AWAITING LEGAL REVIEW" callouts. **28 sections need counsel-approved text.** Policy prose was deliberately not generated — fabricated legal text is worse than none. Remove the top `Alert` on both pages once real content ships. |
| 2 | **`jobs@` vs `careers@phitopolis.com`** | Footer said `careers@`, `content.ts` said `jobs@`. Evidence favoured `jobs@` (2 places vs 1), so that is what ships. **Confirm it is a real inbox.** |
| 3 | **`VITE_SITE_URL = https://phitopolis.com`** | New env var backing every canonical/OG URL, added to `.env.production` and `.env.development`. **Confirm the production host.** |
| 4 | **26 hotlinked WordPress images** | `JourneyTimeline.tsx` loads the About timeline from `https://phitopolis.com/blog/wp-content/uploads/…`. All 200 today and correctly `loading="lazy"` (they are *not* the `/about` LCP cause). But ~9.6 MB from an unmirrored legacy host at ~2.0 s/image. **If that WordPress is decommissioned at launch, the About centrepiece goes blank.** Error handler is fixed; mirroring into `public/` is still to do. |
| 5 | **Crawler unfurling** | `dist/index.html` still has no static metadata — LinkedIn/Slack/WhatsApp don't run JS, so shared links unfurl bare. Real fix is build-time prerendering. Not attempted; it is a larger architectural change. |
| 6 | **One `[VERIFY]` marker** | Remains in `CONTENT.coreCompetencies` — flagged by a prior author as a business-taste call. (Two others disappeared with the dead `CONTENT.partnerships` block.) |
| 7 | **Social accounts** | Footer icons were removed because no real URLs exist in the repo. Add back if the accounts exist. |
| 8 | **Blog thumbnails** | Four blog-preview cards on `/` all use the same `01.webp` with `alt=""`. Needs real per-post thumbnails or a product decision. |

### Server-side — deliberately out of scope

You noted the AWS staging instance has nginx/Docker/443 changes **not reflected in this repo**, so nothing here touches server config. Two findings live there:

- **No CSP** in the production nginx block (`SETUP.md:228-231` sets HSTS, `X-Frame-Options`, `Referrer-Policy` — but no `Content-Security-Policy`).
- **Precompression is unproven end-to-end.** `.br`/`.gz` are emitted at build time; `vite preview` does not serve them (no `Content-Encoding` header locally). `SETUP.md:225-226` has `brotli_static on; gzip_static on;` — **verify on the instance.**
- The SPA returns **HTTP 200 for unmatched paths**. The client-side 404 head is fixed; a true 404 status needs an nginx rewrite.
- `.env*` is **not gitignored** and both env files are tracked. Harmless today (only public values), but the next `VITE_*` secret someone adds ships into the bundle *and* git history.

---

## 5. Known-good verification recipe

```bash
cd " Master P Frontend/Phitv2A" && yarn build
```

Eager-bundle regression check — **no eagerly-preloaded chunk may contain GSAP or Lenis**:
```bash
grep -l "registerPlugin" $(grep -oE '/assets/[A-Za-z0-9_.-]+\.js' dist/index.html | sed 's|^|dist|')
```
Expect no output. Eager total should stay ≈262 KB brotli.

Browser auditors — **prove rAF is alive first** (the Claude Browser pane freezes it, which makes every animation look broken):
```bash
node ".claude/skills/web-audit/scripts/cdp.mjs" --selftest --url http://localhost:4173
```
Must print non-zero rAF ticks. Then run `perf-runtime-auditor` **alone**, and only afterwards `sec-auditor` / `a11y-dynamic-auditor` / `link-crawl-auditor` concurrently.

Serve via `preview_start` (config `phitv2a-preview`), never Bash.

**Manual checks no tool covers:**
- Submit a job application with Heimdall stopped → must show an error, not "Application Received!"
- Hard-reload twice → the preloader must appear only on the **first** load of a session.
- `prefers-reduced-motion: reduce` → no 4 s curtain, no preloader.
- Tab to a blog card → must be focusable and openable in a new tab.

**Environment note:** Heimdall (`localhost:8000`) was **not running** during the final audit. `/services` therefore rendered its graceful "Capabilities aren't available right now" state and blog detail fell back correctly — those are **not defects**, but per-post `<title>` derivation could not be observed end-to-end. Re-verify with Heimdall up.

---

## 6. Status

`yarn typecheck` ✅ · `yarn build` ✅ · eager bundle 262.0 KB br with 0 GSAP chunks ✅

Pre-existing lint errors remain in files this pass did not own (raw hex colours, one `any`, a `set-state-in-effect` in `TopNavMegaDrawer.tsx`, a `fetch()`-in-component flag on `AppShell`'s `preloadAsset`). None were introduced here; none block the build.

Full audit plan and prioritisation live at `~/.claude/plans/the-master-p-frontend-greedy-shannon.md`.
