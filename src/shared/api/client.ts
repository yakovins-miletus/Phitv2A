import createClient from "openapi-fetch";

import type { paths } from "./schema";

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL,
  // Resolve fetch at call time, not module-init time — test interceptors (MSW)
  // patch globalThis.fetch after this module has already been imported.
  fetch: (input) => globalThis.fetch(input),
});
