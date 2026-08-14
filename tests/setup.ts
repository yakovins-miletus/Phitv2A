import "@testing-library/jest-dom/vitest";

import { server } from "./msw/server";

// jsdom lacks matchMedia/IntersectionObserver/ResizeObserver. The default
// stub reports prefers-reduced-motion: REDUCE so every animation renders its
// deterministic final state in tests (the jsdom landmine from the build
// contract). Override per-test with mockReducedMotion(false) from test-utils.
export function stubMatchMedia(reduce: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    // "no-preference" first: the query string "(prefers-reduced-motion:
    // no-preference)" also contains the substring "reduce".
    matches: query.includes("no-preference")
      ? !reduce
      : query.includes("prefers-reduced-motion")
        ? reduce
        : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

class ObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): never[] {
    return [];
  }
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: number[] = [];
}

// Module scope, not hooks: GSAP's ScrollTrigger reads matchMedia at module
// IMPORT time (gsap.registerPlugin in routes/index.tsx), which happens before
// any beforeAll/beforeEach fires.
stubMatchMedia(true);
vi.stubGlobal("IntersectionObserver", ObserverStub);
vi.stubGlobal("ResizeObserver", ObserverStub);
if (typeof globalThis.requestAnimationFrame === "undefined") {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(cb, 16));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});
beforeEach(() => {
  stubMatchMedia(true);
  sessionStorage.clear();
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});
