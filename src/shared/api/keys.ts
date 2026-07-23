/**
 * Cross-feature query-key roots. Features build their key factories on these,
 * which lets one feature invalidate another's cache (contact -> metrics)
 * without importing from a sibling feature folder.
 */
export const keyRoots = {
  services: ["services"],
  team: ["team"],
  blog: ["blog"],
  innovation: ["innovation"],
} as const satisfies Record<string, readonly [string]>;
