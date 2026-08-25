# WS-10 — Services: kill the false error state, de-containerize

**Owner files (exclusive):** `src/routes/services.tsx` · `src/features/services/**` (except `ServiceDrawer.tsx`, owned by WS-07)
**Depends on:** WS-01 (flattened surfaces). **Related:** WS-07 owns the diagrams rendered on this page.
**Agents:** Haiku to trace the query/error path, Sonnet to implement.
**Acceptance bar:** `/design-taste-frontend`.

---

## Why

Screenshot 2: the page renders **"Capabilities aren't available right now."** over an empty
body. The brief: *"services load properly and just statically display fine but then shows
that error that we don't like."*

`services.tsx:119-135` gates on `services.isError && services.data === undefined`, and
carries a comment defending itself:

```tsx
// Real API failure with nothing cached to fall back to — the CMS list, unlike
// FALLBACK_SERVICES, is genuinely empty here rather than just unfetched yet.
if (services.isError && services.data === undefined) {
```

**The reasoning is wrong.** `isError` means the request **failed** — it does not mean the
list is empty. A failed fetch tells you nothing about whether Phitopolis has capabilities;
it tells you the CMS is unreachable. Meanwhile `FALLBACK_SERVICES` — four fully-written
services — is defined 40 lines above at `services.tsx:15-84` and is used on **every other
path** (`const list = services.data ?? FALLBACK_SERVICES;`, L137). So the page has a good
answer for exactly this situation and deliberately refuses to use it.

Consequence: whenever Heimdall is down — or simply not running locally, which is what the
screenshot shows — a marketing site tells visitors it has no capabilities.

## Current state (verified)

- `services.tsx:92-94` — loader does `ensureQueryData(servicesQuery()).catch(() => undefined)`,
  so failures never throw; `data` is simply `undefined`.
- `services.tsx:15-84` — `FALLBACK_SERVICES`, four services with full copy.
- `services.tsx:119-135` — the error branch.
- `services.tsx:137` — `services.data ?? FALLBACK_SERVICES` on the happy path.
- Page composition: `ServicesHeroHeader` → `DetailedServiceList` → `TechStackSection`.

## Target state

Static-first: the page **always renders**, from the CMS when it answers and from
`FALLBACK_SERVICES` when it doesn't. A visitor never learns that a CMS exists.

Reserve a distinct state for the genuinely-empty case — a **successful** response with zero
services (`isSuccess && data?.length === 0`). That is a real editorial condition and
deserves different copy from a transport failure.

## Steps

1. **Reproduce first.** The brief says content displays *then* the error appears, which the
   `data === undefined` gate doesn't obviously explain. Determine whether it's initial
   load with the API down, a failed background refetch, or a navigation remount. Record
   what you found — the fix depends on it.
2. Delete the `isError && data === undefined` branch. Let `FALLBACK_SERVICES` carry it.
3. Add the true-empty branch: `isSuccess && data.length === 0` → an honest, calm message.
   Not "aren't available right now."
4. Consider a quiet, non-blocking staleness signal for the failure case if you want
   internal visibility — a console warning or a telemetry hook, never page copy.
5. De-containerize the layout per WS-01: the diagram sits in a large rounded card in
   screenshot 1 that WS-01's flatten removes. Re-space so the figure reads as a figure and
   not as an orphan.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn tsc --noEmit && yarn test && yarn build && yarn preview
```

- **The core check:** stop Heimdall entirely, hard-reload `/services`. Page must render
  four fallback services. No error copy anywhere.
- Start Heimdall, reload — CMS services render.
- Force a *successful* empty response (MSW handler in `tests/msw/`) — the new empty state
  shows, with its own copy.
- Kill the API mid-session and trigger a refetch — page must not flip to an error.
- Screenshots at 375 / 768 / 1440 after WS-01's flatten.

## Out of scope

The diagrams themselves (WS-07). Theme tokens (WS-01). Heimdall's services endpoint — this
workstream is frontend-only and must not require a backend change to pass.
