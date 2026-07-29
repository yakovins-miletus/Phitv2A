// Second setup file for the `motion` vitest project, layered on top of
// tests/setup.ts.
//
// tests/setup.ts stubs prefers-reduced-motion to REDUCE at module scope, which
// is right for the unit project — every animation renders its deterministic
// final state. But it means SmoothScroll (`reduced === true` -> bail),
// AppShell's overscroll pressure machine (`if (reduced) return`) and every
// GSAP scrub early-return before doing anything, so no test in that project has
// ever entered the scroll/motion layer.
//
// This file flips the default the other way and swaps the no-op
// IntersectionObserver for a controllable one. It must run at MODULE scope, not
// in a hook: ScrollTrigger and Motion read matchMedia when they are imported,
// which happens before any beforeAll/beforeEach fires. Tests in this project
// must therefore `await import()` the component under test rather than using a
// static import at the top of the file.

import { stubMatchMedia } from "./setup";

interface FakeEntry {
  target: Element;
  isIntersecting: boolean;
  intersectionRatio: number;
}
type FakeCallback = (entries: FakeEntry[], observer: FakeIntersectionObserver) => void;

/** Every live observer, so a test can drive any of them by element. */
const liveObservers = new Set<FakeIntersectionObserver>();

class FakeIntersectionObserver {
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: number[];
  readonly targets = new Set<Element>();
  private readonly callback: FakeCallback;

  constructor(callback: FakeCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.rootMargin = options?.rootMargin ?? "";
    const t = options?.threshold ?? 0;
    this.thresholds = Array.isArray(t) ? t : [t];
    liveObservers.add(this);
  }

  observe(el: Element): void {
    this.targets.add(el);
  }
  unobserve(el: Element): void {
    this.targets.delete(el);
  }
  disconnect(): void {
    this.targets.clear();
    liveObservers.delete(this);
  }
  takeRecords(): FakeEntry[] {
    return [];
  }

  fire(el: Element, isIntersecting: boolean, intersectionRatio: number): void {
    this.callback([{ target: el, isIntersecting, intersectionRatio }], this);
  }
}

/**
 * Drive every observer watching `el`. Returns how many fired, so a test can
 * assert it actually exercised something instead of silently passing on zero.
 */
export function triggerIntersect(
  el: Element,
  isIntersecting: boolean,
  intersectionRatio = isIntersecting ? 1 : 0,
): number {
  let fired = 0;
  for (const observer of liveObservers) {
    if (!observer.targets.has(el)) continue;
    observer.fire(el, isIntersecting, intersectionRatio);
    fired += 1;
  }
  return fired;
}

/** Observers currently watching `el` — for asserting registration/teardown. */
export function observersFor(el: Element): number {
  let n = 0;
  for (const observer of liveObservers) if (observer.targets.has(el)) n += 1;
  return n;
}

export function resetObservers(): void {
  liveObservers.clear();
}

stubMatchMedia(false);
vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);

beforeEach(() => {
  // setup.ts's own beforeEach re-stubs reduce=true; undo that for this project.
  stubMatchMedia(false);
  resetObservers();
});
