import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/shared/api/errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const isClientError =
          error instanceof ApiError &&
          error.problem.status >= 400 &&
          error.problem.status < 500;
        return !isClientError && failureCount < 2;
      },
    },
  },
});
