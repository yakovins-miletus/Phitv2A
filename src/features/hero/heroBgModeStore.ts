/**
 * The Monolith hero's background mode, owned outside the component tree.
 *
 * Modeled exactly on `heroModeStore.ts` — same reasoning applies here: the
 * command palette (`CommandPalette.tsx`, mounted in `AppShell`) needs to both
 * *set* this and *read* it (to mark the live one with `● ACTIVE`), and
 * `HeroSignalCore` (mounted by the `/` route) is a sibling with nothing
 * shared above it but `NavbarContext`. A one-way `CustomEvent` is not enough
 * when a reader needs the live value, so this is a module-scope
 * `useSyncExternalStore` singleton rather than a context — no provider
 * required, and there is exactly one hero on the page, ever.
 *
 * Zero dependency on `three` or anything else from `playground/` — this
 * module is imported by `CommandPalette.tsx`, which is in the entry bundle,
 * so a stray import here would drag the whole 3D stack in with it.
 */

import { useSyncExternalStore } from "react";

export type HeroBgMode = "static" | "video";

export interface HeroBgModeState {
  mode: HeroBgMode;
}

/**
 * Static — the shader sky/cloud stack — is what a visitor lands on. Video is
 * an opt-in look, not a replacement default: it is a single baked 8s loop
 * with no day/night control, while static is the fully interactive room.
 */
const DEFAULT_MODE: HeroBgMode = "static";

const MODE_STORAGE_KEY = "phit:hero:bgMode";

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

const HERO_BG_MODES: readonly HeroBgMode[] = ["static", "video"];

let state: HeroBgModeState = {
  mode: readStorage(MODE_STORAGE_KEY, HERO_BG_MODES, DEFAULT_MODE),
};

const listeners = new Set<() => void>();

function notify(): void {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): HeroBgModeState {
  return state;
}

export function useHeroBgModeState(): HeroBgModeState {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function setHeroBgMode(mode: HeroBgMode): void {
  if (state.mode === mode) return;
  state = { ...state, mode };
  writeStorage(MODE_STORAGE_KEY, mode);
  notify();
}
