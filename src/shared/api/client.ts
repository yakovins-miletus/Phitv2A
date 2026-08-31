import createClient from "openapi-fetch";

import type { paths } from "./schema";

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL,
  // Resolve fetch at call time, not module-init time — test interceptors (MSW)
  // patch globalThis.fetch after this module has already been imported.
  fetch: (input) => globalThis.fetch(input),
});

/**
 * Resolves a root-relative media path (e.g. `/media/blog/xyz.webp`) returned
 * by Heimdall against the API's own origin, not the frontend's.
 *
 * `VITE_API_URL` is root-relative ("/") in production, so it can't be used as
 * a `new URL()` base directly — it has to be resolved against the current
 * origin first. Without this, a path like `image_url` handed straight to an
 * `<img src>` resolves against the Vite/frontend origin instead of the API's,
 * which happens to coincide in production (API is same-origin there) but
 * 404s in dev, where the API runs on a different port.
 */
export function resolveApiUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  const apiBase = new URL(import.meta.env.VITE_API_URL, window.location.origin);
  return new URL(path, apiBase).toString();
}
