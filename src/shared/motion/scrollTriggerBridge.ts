/**
 * A typed, dependency-free bridge to ScrollTrigger.
 *
 * AppShell needs to refresh ScrollTrigger on route change, but AppShell is the
 * root layout and lives in the eager bundle — importing gsap there would drag
 * the whole animation stack into the entry chunk for every visitor, including
 * on routes that never scroll-animate. That is why the original code reached
 * through `(window as any).ScrollTrigger`, published as an import-time side
 * effect by SmoothScroll (which rides the lazy home chunk).
 *
 * The mechanism was sound; the `as any` and the invisible coupling were not.
 * This module keeps the indirection and makes it explicit and typed:
 *
 *   - SmoothScroll (lazy, owns gsap) calls publishScrollTriggerRefresh().
 *   - AppShell (eager, no gsap) calls refreshScrollTriggers().
 *
 * refreshScrollTriggers() is a NO-OP until the home chunk has loaded. That is
 * correct — with no ScrollTriggers registered there is nothing to refresh —
 * and it is now a documented contract rather than an accident of load order.
 */

type RefreshFn = () => void;

let refresh: RefreshFn | null = null;

/** Called by SmoothScroll once gsap is available. */
export function publishScrollTriggerRefresh(fn: RefreshFn): void {
  refresh = fn;
}

/** Called by SmoothScroll on teardown. */
export function revokeScrollTriggerRefresh(): void {
  refresh = null;
}

/**
 * Recompute every ScrollTrigger's start/end against current layout.
 * Silently does nothing if the animation chunk has not loaded.
 */
export function refreshScrollTriggers(): void {
  refresh?.();
}

/** Whether the animation chunk has loaded and published its refresh hook. */
export function scrollTriggersAvailable(): boolean {
  return refresh !== null;
}
