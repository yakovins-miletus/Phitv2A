import { useSyncExternalStore } from "react";

/**
 * consent — the analytics-consent store.
 *
 * This is plumbing for a Google Analytics integration that does NOT exist yet.
 * There is no GA script, no measurement ID, no `gtag` anywhere in the tree.
 * What lives here is the GDPR consent gate that such an integration will sit
 * behind: a single localStorage-backed choice ("granted" | "denied"), a tiny
 * pub/sub so the UI and any future provider react to it, and a cross-tab sync.
 *
 * Storage posture (carried over from CookieNotice's original header): a grep of
 * `src/` for `document.cookie` finds zero matches — the site sets no cookies.
 * `localStorage`/`sessionStorage` hold only first-party UI state (hero
 * background, admin debug-overlay toggle, "seen the preloader this session").
 * The key written here, `phitopolis_analytics_consent`, is the first storage
 * entry that records a *decision* rather than a preference — hence the care
 * around it. `@vercel/analytics` / `@vercel/speed-insights` in `__root.tsx`
 * remain separately gated by `useVercelAnalytics` and are not governed here.
 */

export type AnalyticsConsent = "granted" | "denied";

/**
 * Flip to `true` — and wire a provider that reads `hasAnalyticsConsent()` — when
 * GA is added. Until then the consent banner does not render, because there is
 * nothing to consent to. This is the one switch that says "an analytics
 * provider actually exists"; everything else here is inert without it.
 */
export const ANALYTICS_PROVIDER_ENABLED = false;

/** localStorage key. The literal string is also referenced in docs/comments —
 *  grep for it before renaming. */
const STORAGE_KEY = "phitopolis_analytics_consent";

/** In-process subscribers. `window` "storage" events are bridged into this set
 *  (see below) so another tab's choice propagates here too. */
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function isConsent(value: unknown): value is AnalyticsConsent {
  return value === "granted" || value === "denied";
}

/**
 * The current stored choice, or `null` if the visitor has not chosen (or the
 * stored value is junk, or storage is unreadable). SSR/no-window safe.
 */
export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isConsent(raw) ? raw : null;
  } catch {
    // Locked-down contexts (private-mode quotas, storage disabled) throw on
    // access — treat exactly as "no choice recorded".
    return null;
  }
}

/**
 * Persist the visitor's choice and notify subscribers. Best-effort: if storage
 * throws, subscribers are still notified so the UI updates for this session.
 */
export function setAnalyticsConsent(choice: AnalyticsConsent): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Best-effort — the banner will simply reappear next visit, a safe failure
    // mode for a consent notice rather than a defect.
  }
  notify();
}

/**
 * The gate a future GA integration calls before loading gtag / before any
 * `gtag('consent', 'update', ...)`. Only an explicit "granted" counts.
 */
export function hasAnalyticsConsent(): boolean {
  return getAnalyticsConsent() === "granted";
}

/**
 * Subscribe to consent changes — both in-process (`setAnalyticsConsent`) and
 * from other tabs (`window` "storage"). Returns an unsubscribe function.
 */
export function subscribeAnalyticsConsent(listener: () => void): () => void {
  listeners.add(listener);

  // Attach the shared "storage" bridge on the first subscriber only.
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key === STORAGE_KEY || event.key === null) notify();
}

/**
 * React binding over the store. `null` until a choice is made; re-renders on
 * change from this tab or another. `getServerSnapshot` returns `null`.
 */
export function useAnalyticsConsent(): AnalyticsConsent | null {
  return useSyncExternalStore(
    subscribeAnalyticsConsent,
    getAnalyticsConsent,
    () => null,
  );
}
