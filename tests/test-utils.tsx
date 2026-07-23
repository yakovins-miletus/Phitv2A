import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { theme } from "@/shared/theme/theme";

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

export function renderWithProviders(ui: ReactNode, queryClient = makeTestQueryClient()) {
  const result = render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </ThemeProvider>,
  );
  return { ...result, queryClient };
}
