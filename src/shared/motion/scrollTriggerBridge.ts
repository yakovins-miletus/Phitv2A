/**
 * A typed, dependency-free bridge to ScrollTrigger.
 *
 * TransitionCurtain needs to refresh ScrollTrigger after every in-app route
 * push, but TransitionCurtain is mounted from AppShell — the root layout,
 * present on every route — so a static `import gsap` there would drag the
 * whole animation stack into the entry chunk for every visitor, including on
 * routes that never scroll-animate. TransitionCurtain now loads gsap itself
 * via a dynamic `import("gsap")` inside its click handler, so a static
 * top-level gsap import here would defeat that split just as surely.
 *
 * This module is the reason the split holds together: it is imported
 * statically (it has zero dependencies of its own, so that costs nothing),
 * and it works identically whether or not gsap has loaded yet:
 *
 *   - SmoothScroll (lazy, owns gsap) calls publishScrollTriggerRefresh() once
 *     ScrollTrigger is registered.
 *   - TransitionCurtain calls refreshScrollTriggers() after every navigation —
 *     on BOTH its full-motion path (gsap dynamically imported for the curtain
 *     sweep) and its prefers-reduced-motion fast path (gsap never touched at
 *     all). The reduced-motion path is exactly why this indirection still
 *     matters even though TransitionCurtain now imports gsap dynamically
 *     rather than eagerly: that path has no reason to ever load gsap, and
 *     calling through this bridge means it doesn't have to.
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

/**
 * Called by SmoothScroll on teardown so a dead ScrollTrigger.refresh closure
 * doesn't linger after Lenis unmounts (route away from "/", reduced motion
 * kicking in mid-session). Currently unconsumed: SmoothScroll.tsx's cleanup
 * doesn't call it yet, and that file is outside this module's ownership, so
 * wiring it up is a follow-up rather than something patched in from here. In
 * practice this is low-risk either way — ScrollTrigger.refresh() on a torn-
 * down instance is a harmless no-op — but the export stays so that follow-up
 * has a home to call into.
 */
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
