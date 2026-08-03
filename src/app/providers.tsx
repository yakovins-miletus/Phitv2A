import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClientProvider } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

import { theme } from "@/shared/theme/theme";

interface ProvidersProps {
  queryClient: QueryClient;
  children: ReactNode;
}

export function Providers({ queryClient, children }: ProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* `reducedMotion="user"` makes every Motion component honour
          prefers-reduced-motion by default — transform and layout animations
          collapse to their end state while opacity still fades.

          29 animated files had no guard of their own, including three infinite
          marquees in PoweredBySection (exactly what WCAG 2.2.2 targets) and
          SmoothSection, which documented its own violation in a comment and
          wraps every block on the About page. Components that already call
          useReducedMotion keep working; this is the floor beneath them. */}
      <MotionConfig reducedMotion="user">
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
