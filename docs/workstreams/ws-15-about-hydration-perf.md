# WS-15 — About hydration perf: already satisfied (no code change)

**Owner files:** none — closed after investigation.
**Depends on:** WS-06 findings. **Status:** ✅ moot — the recommended fix was already in the code.

---

## Why this exists

WS-06's perf audit measured 14-15 long tasks (max ~618 ms at 6× CPU throttle) clustered
just after hydration on `/about`, and attributed them to three `MiniEstablishingShot`
instances each registering its own `ScrollTrigger` at once, plus `SpecularFx` WebGL probing.
It recommended consolidating the three shots onto the component's existing
`selfDriven={false}` shared-driver mode.

## What investigation found

The fix is **already applied**. Every establishing-shot call site that renders passes
`selfDriven={false}` and is driven by `SectionBeat`'s single shared timeline off the
`.est-*` class hooks — no per-shot ScrollTrigger is created:

- `CandidatesAndCareersSection.tsx:95`, `BlogSection.tsx:243`, `ClosingShelf.tsx:86`,
  `CapabilityRack.tsx:26`, `index.tsx:152` — all `selfDriven={false}`
- `SeamEstablishingShot` (about.tsx:236) and `PillarsEstablishingShot`
  (OperatingPillars.tsx:43) forward `selfDriven={false}` to `MajorEstablishingShot`

`MiniEstablishingShot.tsx:60` and `MajorEstablishingShot.tsx` both early-return before any
`ScrollTrigger.create` when `selfDriven` is false. So the hydration-time trigger storm WS-06
described cannot occur with the current code.

## Consequence — the perf picture is stale, not closed

WS-06 ran at an earlier commit, before WS-02 (home re-order) and WS-16 (About rebuilt:
CertificationsSection became a full-viewport marquee, TalentSection extracted, etc.). Its
measurements no longer describe the current `/about`. If lag still reproduces:

- It is **not** the establishing shots (already shared-driver).
- `SpecularFx` mounts in the **navbar** (AppShell.tsx:432, 795), so it is global to every
  route, not `/about`-specific — an unlikely sole cause of an About-specific complaint.
- The honest next step is a **fresh** production-build profile of `/about` at 4×/6× throttle.
  This environment's CDP pane freezes rAF when backgrounded and cannot drive Lenis scroll,
  so a reliable scroll-driven capture needs a real browser / manual profile — do not
  prescribe a fix without that number, per WS-06's own measure-first rule.

## Verdict

No code change. The specific remedy is in place. Any remaining `/about` lag is a new,
unmeasured question and should be re-audited on the current build rather than fixed on a
stale attribution.
