/**
 * The hero's enterprise/talent track, owned outside the component tree.
 *
 * This file used to also own the hero's 2D/3D "mode" (legacy vs. the R3F
 * Monolith room) and the command-palette commands that switched it — that
 * gallery/mode-switching surface was retired (see `SuperHeroSequence.tsx`,
 * `commandActions.ts`, `CommandPalette.tsx`, `TopNavMegaDrawer.tsx`), leaving
 * only the track store below. Kept as a module-scope `useSyncExternalStore`
 * singleton rather than a context for the same reason the mode store was:
 * `CommandPalette`/`TopNavMegaDrawer` are mounted in `AppShell`, `HeroSignalCore`
 * is mounted by the `/` route, and they are siblings with nothing shared above
 * them but `NavbarContext`.
 *
 * Zero dependency on `three` or anything else from `playground/` — this module
 * is imported by `CommandPalette.tsx`, which is in the entry bundle, so a
 * stray import here would drag the whole 3D stack in with it.
 */

import { useSyncExternalStore } from "react";

function readStorage<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  try {
    const stored = sessionStorage.getItem(key);
    if (stored && (valid as readonly string[]).includes(stored)) return stored as T;
  } catch {
    /* Safari private mode throws on access. The default is a fine answer. */
  }
  return fallback;
}

function writeStorage(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* Losing the memory is not worth losing the interaction over. */
  }
}

/* ── Hero Track Store (Enterprise vs Talent Dual-Track Portal) ────────────── */

export type HeroTrack = "enterprise" | "talent";

const TRACK_STORAGE_KEY = "phit:hero:track";
const HERO_TRACKS: readonly HeroTrack[] = ["enterprise", "talent"];

let trackState: HeroTrack = readStorage(TRACK_STORAGE_KEY, HERO_TRACKS, "enterprise");
const trackListeners = new Set<() => void>();

function notifyTrack(): void {
  for (const l of trackListeners) l();
}

export function useHeroTrack(): HeroTrack {
  return useSyncExternalStore(
    (l) => {
      trackListeners.add(l);
      return () => trackListeners.delete(l);
    },
    () => trackState
  );
}

export function setHeroTrack(track: HeroTrack): void {
  if (trackState === track) return;
  trackState = track;
  writeStorage(TRACK_STORAGE_KEY, track);
  notifyTrack();
}

