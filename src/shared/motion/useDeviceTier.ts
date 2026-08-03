/**
 * Device capability tiering.
 *
 * Before this existed the site had exactly one capability query — `usePointerFine`,
 * which gates *affordances* (magnetic hovers) rather than *cost*. A 4-core, 4 GB laptop
 * at 1920px therefore got the full experience: three canvases, a cursor ring with two
 * `mix-blend-mode` layers, a header backdrop-blur, a grain overlay, Lenis smooth scroll
 * with lag smoothing disabled, and a 1.3 MB warm-up preload.
 *
 * This hook answers one question — "should this machine get the expensive path?" — from
 * hints the browser actually exposes. It is deliberately conservative: the hints are
 * coarse and some are absent on Safari (`deviceMemory` is Chromium-only), so an unknown
 * device is treated as capable. The cost of a false "low" (a quieter but correct site)
 * is much lower than a false "high" (jank), but a false "low" on a fast machine is still
 * a visible regression, so we only demote on positive evidence.
 */

import { useSyncExternalStore } from "react";

export type DeviceTier = "low" | "high";

/** Cores at or below this count read as low-powered. */
const LOW_CORE_COUNT = 4;
/** GB of RAM at or below this read as low-powered. `deviceMemory` is Chromium-only. */
const LOW_MEMORY_GB = 4;

interface ConnectionLike {
  saveData?: boolean;
  effectiveType?: string;
}

function readTier(): DeviceTier {
  if (typeof navigator === "undefined") return "high";

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: ConnectionLike };

  // Data Saver is an explicit user request for less. Honour it first.
  if (nav.connection?.saveData === true) return "low";

  // A genuinely slow connection implies a device we should not pile work onto.
  const eff = nav.connection?.effectiveType;
  if (eff === "slow-2g" || eff === "2g") return "low";

  const cores = nav.hardwareConcurrency;
  if (typeof cores === "number" && cores > 0 && cores <= LOW_CORE_COUNT) return "low";

  const mem = nav.deviceMemory;
  if (typeof mem === "number" && mem > 0 && mem <= LOW_MEMORY_GB) return "low";

  return "high";
}

/**
 * Subscribe to connection changes. Core count and memory never change at runtime, but
 * `saveData` and `effectiveType` do, so a user toggling Data Saver takes effect without
 * a reload.
 */
function subscribe(onChange: () => void): () => void {
  const nav = navigator as Navigator & { connection?: ConnectionLike & EventTarget };
  const conn = nav.connection;
  if (!conn || typeof conn.addEventListener !== "function") return () => {};
  conn.addEventListener("change", onChange);
  return () => conn.removeEventListener("change", onChange);
}

/**
 * The device tier. Returns `"high"` during SSR and on any browser that exposes no
 * usable hints — absence of evidence is not evidence of a slow machine.
 */
export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(subscribe, readTier, () => "high");
}

/** Convenience: true when the expensive path should be skipped. */
export function useIsLowPowerDevice(): boolean {
  return useDeviceTier() === "low";
}
