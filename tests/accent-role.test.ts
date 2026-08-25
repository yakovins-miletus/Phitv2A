/**
 * Accent-role regression gate.
 *
 * History: `--accent-fg` (#ffc72c) is the brand-gold token for FILLS,
 * BORDERS, and ICONS. As TEXT on a light ground it measures ~1.45:1 — a
 * WCAG AA failure. `--accent-ink` was introduced in `src/shared/theme/glass.css`
 * to carry the "gold text on a light ground" role instead, walked down to a
 * bronze (`goldInk`, #8c5f09, 5.2-5.6:1) in the light scope.
 *
 * Decision (2026-08): the user rejected the bronze outright. Bright gold
 * (`NOIR.gold` / `--accent-fg`, #ffc72c) is now the accent on every ground,
 * including as text on light grounds, accepting the sub-AA contrast that
 * follows. `--accent-ink`'s light-scope value was changed to #ffc72c to
 * match — it is no longer a distinct "readable" token, just an alias kept so
 * existing `var(--accent-ink)` call sites don't need a rename. See
 * `tests/a11y-contrast.test.ts` for the pinned, accepted contrast ratio.
 *
 * That makes the old two-token distinction (`--accent-fg` for fills only,
 * `--accent-ink` for text) moot: both resolve to the same color on both
 * grounds now, so there is no wrong one to reach for. This file is kept as a
 * record of that decision rather than deleted outright, so a future reader
 * finds the "why" instead of just a missing test.
 */

import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

const ROOT = path.resolve(__dirname, "..");
const GLASS_CSS_PATH = path.join(ROOT, "src/shared/theme/glass.css");

/** Extract the LIGHT-scope `--accent-ink` value from glass.css. */
function extractLightAccentInk(): string {
  const css = fs.readFileSync(GLASS_CSS_PATH, "utf-8");

  // The light scope is the first `--accent-ink:` declaration in the file (the
  // dark-scope override comes later, nested under a dark-mode selector).
  const matches = [...css.matchAll(/--accent-ink:\s*(#[0-9a-fA-F]{3,8})\s*;/g)];
  if (matches.length === 0) {
    throw new Error("--accent-ink not found in glass.css — has the token been renamed or removed?");
  }
  return matches[0]![1]!;
}

/** Extract the LIGHT-scope `--accent-fg` value from glass.css. */
function extractLightAccentFg(): string {
  const css = fs.readFileSync(GLASS_CSS_PATH, "utf-8");
  const matches = [...css.matchAll(/--accent-fg:\s*(#[0-9a-fA-F]{3,8})\s*;/g)];
  if (matches.length === 0) {
    throw new Error("--accent-fg not found in glass.css — has the token been renamed or removed?");
  }
  return matches[0]![1]!;
}

describe("accent-ink / accent-fg parity (post bright-gold decision)", () => {
  test("light-scope --accent-ink now equals --accent-fg (#ffc72c) — the bronze walk-down was retired", () => {
    const accentInk = extractLightAccentInk();
    const accentFg = extractLightAccentFg();
    expect(accentInk.toLowerCase()).toBe("#ffc72c");
    expect(accentInk.toLowerCase()).toBe(accentFg.toLowerCase());
  });
});
