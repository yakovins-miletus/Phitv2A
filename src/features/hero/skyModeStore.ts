/**
 * The Monolith room's day/night toggle, owned outside the component tree.
 *
 * Same shape as `heroModeStore.ts`, one door down: a module-scope
 * `useSyncExternalStore` singleton with sessionStorage persistence, so the
 * toggle button mounted in the hero chrome and anything else that ever wants
 * to read "is it day or night" agree without a shared ancestor. There is
 * exactly one sky, ever — a second instance is not a case this needs to
 * support.
 *
 * Zero dependency on `three` or `playground/` — this module is safe to import
 * from anywhere without dragging the 3D stack along with it, exactly like
 * `heroModeStore.ts`.
 */

import { useSyncExternalStore } from "react";

export type SkyMode = "day" | "night";

export interface SkyModeState {
  mode: SkyMode;
}

/** Night is what a visitor lands on — the room's existing dawn/twilight look
 *  stays the default; the day sky is the thing a visitor opts into. */
const DEFAULT_MODE: SkyMode = "night";

const SKY_STORAGE_KEY = "phit:sky:mode";

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

const SKY_MODES: readonly SkyMode[] = ["day", "night"];

let state: SkyModeState = {
  mode: readStorage(SKY_STORAGE_KEY, SKY_MODES, DEFAULT_MODE),
};

const listeners = new Set<() => void>();

function notify(): void {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SkyModeState {
  return state;
}

export function useSkyModeState(): SkyModeState {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function setSkyMode(mode: SkyMode): void {
  if (state.mode === mode) return;
  state = { ...state, mode };
  writeStorage(SKY_STORAGE_KEY, mode);
  notify();
}

export function toggleSkyMode(): void {
  setSkyMode(state.mode === "day" ? "night" : "day");
}
