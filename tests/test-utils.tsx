import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { Providers } from "@/app/providers";

import { stubMatchMedia } from "./setup";

/** Per-test override of the reduced-motion default (setup stubs reduce=true). */
export function mockReducedMotion(reduce: boolean): void {
  stubMatchMedia(reduce);
}

export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

/**
 * Renders under the app's *real* provider stack.
 *
 * This used to hand-roll `ThemeProvider` + `QueryClientProvider`, i.e. a subset of
 * what `src/app/providers.tsx` actually mounts. That divergence meant anything
 * living in `Providers` and nowhere else — `MotionConfig reducedMotion="user"`,
 * `CssBaseline`, and now `useGlassGate()` — was invisible to every test, however
 * carefully it had been centralised. Using the real component is what makes "the
 * gate is in one place" an assertable claim rather than a comment.
 */
export function renderWithProviders(ui: ReactNode, queryClient = makeTestQueryClient()) {
  const result = render(<Providers queryClient={queryClient}>{ui}</Providers>);
  return { ...result, queryClient };
}
