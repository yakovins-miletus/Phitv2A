/**
 * The hero's mode and time-of-day, owned outside the component tree.
 *
 * Before this file, both lived as `useState` inside `HeroSignalCore`
 * (`SuperHeroSequence.tsx`) — fine while the only thing that read or wrote them
 * was the hero itself. The command palette changes that: `CommandPalette` is
 * mounted in `AppShell`, `HeroSignalCore` is mounted by the `/` route, and they
 * are siblings with nothing shared above them but `NavbarContext`. The palette
 * needs to both *set* the mode (running a command) and *read* it (to mark the
 * live one with `● ACTIVE`), so a one-way `CustomEvent` — the precedent at
 * `CommandPalette.tsx`'s `toggle-id-overlay` — is not enough here.
 *
 * A module-scope `useSyncExternalStore` singleton instead of a context: it
 * needs no provider, so it does not force `AppShell` and the `/` route into a
 * shared ancestor, and there is exactly one hero on the page, ever — a second
 * instance is not a case this needs to support.
 *
 * Zero dependency on `three` or anything else from `playground/` — this module
 * is imported by `CommandPalette.tsx`, which is in the entry bundle, so a
 * stray import here would drag the whole 3D stack in with it.
 */

import { useSyncExternalStore } from "react";


export type HeroMode = "legacy" | "monolith";

export interface HeroModeState {
  mode: HeroMode;
}

/**
 * Legacy, not Monolith, is what a visitor lands on.
 *
 * The R3F room is the polished experience, but react-three-fiber's `<Canvas>`
 * cannot acquire a WebGL context under jsdom (this repo's test environment has
 * no mock for one), and several route-level tests — reduced-motion's "exactly
 * one decorative canvas" check among them — render the home route and expect
 * the hero to mount reliably. Defaulting to Monolith broke those; nothing here
 * exercised the R3F path before, so the gap was latent rather than something
 * this change could fix in scope. Switching a default hero mode is a one-line
 * change whenever a WebGL test mock lands.
 */
const DEFAULT_MODE: HeroMode = "legacy";

const MODE_STORAGE_KEY = "phit:hero:mode";

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

const HERO_MODES: readonly HeroMode[] = ["legacy", "monolith"];

let state: HeroModeState = {
  mode: readStorage(MODE_STORAGE_KEY, HERO_MODES, DEFAULT_MODE),
};

const listeners = new Set<() => void>();

function notify(): void {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): HeroModeState {
  return state;
}

export function useHeroModeState(): HeroModeState {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function setHeroMode(mode: HeroMode): void {
  if (state.mode === mode) return;
  state = { ...state, mode };
  writeStorage(MODE_STORAGE_KEY, mode);
  notify();
}

