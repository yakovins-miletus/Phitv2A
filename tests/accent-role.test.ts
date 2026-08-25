/**
 * Accent-role regression gate.
 *
 * `--accent-fg` (#ffc72c) is the brand-gold token for FILLS, BORDERS, and ICONS.
 * As TEXT on a light ground it measures ~1.45:1 — a WCAG AA failure. `--accent-ink`
 * exists in `src/shared/theme/glass.css` for exactly the "gold text on a light
 * ground" role (light scope: goldInk #8c5f09, 5.2-5.6:1; dark scope: plain gold,
 * already well clear).
 *
 * This file guards two things that let the bug happen twice before `--accent-ink`
 * was even adopted:
 *
 *   (a) `--accent-ink`'s light-scope value actually clears AA against the grounds
 *       it is meant to sit on, computed arithmetically from the shipped CSS — not
 *       a hand-typed number that can drift from the file.
 *
 *   (b) nothing under `src/` uses `var(--accent-fg)` for the `color` (text) CSS
 *       property. `tests/a11y-contrast.test.ts` only measures palette *tokens*;
 *       it is structurally blind to a component reaching for the wrong CSS
 *       variable, which is exactly how this bug shipped. This is the check that
 *       stops it coming back a third time.
 */

import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { NOIR } from "@/shared/theme/palette";

const ROOT = path.resolve(__dirname, "..");
const GLASS_CSS_PATH = path.join(ROOT, "src/shared/theme/glass.css");
const SRC_DIR = path.join(ROOT, "src");

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const channel = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const AA_BODY = 4.5;

/** Extract the LIGHT-scope `--accent-ink` value from glass.css. */
function extractLightAccentInk(): string {
  const css = fs.readFileSync(GLASS_CSS_PATH, "utf-8");

  // The light scope is the first `--accent-ink:` declaration in the file (the
  // dark-scope override comes later, nested under a dark-mode selector).
  const matches = [...css.matchAll(/--accent-ink:\s*(#[0-9a-fA-F]{3,8})\s*;/g)];
  if (matches.length === 0) {
    throw new Error("--accent-ink not found in glass.css — has the token been renamed or removed?");
  }
  return matches[0][1];
}

/** Recursively list every file under `dir` matching `exts`. */
function listFiles(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

describe("accent-ink text role", () => {
  const accentInk = extractLightAccentInk();

  test("clears AA (4.5:1) against NOIR.void", () => {
    expect(contrast(accentInk, NOIR.void)).toBeGreaterThanOrEqual(AA_BODY);
  });

  test("clears AA (4.5:1) against NOIR.panel", () => {
    expect(contrast(accentInk, NOIR.panel)).toBeGreaterThanOrEqual(AA_BODY);
  });

  test("clears AA (4.5:1) against NOIR.white", () => {
    expect(contrast(accentInk, NOIR.white)).toBeGreaterThanOrEqual(AA_BODY);
  });
});

describe("accent-fg must never be used for text", () => {
  test("no `color: \"var(--accent-fg)\"` sites remain under src/", () => {
    const files = listFiles(SRC_DIR, [".ts", ".tsx"]);
    const offenders: { file: string; line: number; text: string }[] = [];

    // Matches `color:` (not backgroundColor/borderColor/bgcolor/etc.) whose value
    // references --accent-fg, including ternaries split across lines.
    const colorPropRe = /(?<![A-Za-z0-9_$])color\s*:\s*(?:[^,{}\n]|\n)*?var\(--accent-fg\)/g;

    for (const file of files) {
      const contents = fs.readFileSync(file, "utf-8");
      const lines = contents.split("\n");
      let match: RegExpExecArray | null;
      colorPropRe.lastIndex = 0;
      while ((match = colorPropRe.exec(contents)) !== null) {
        const upToMatch = contents.slice(0, match.index);
        const lineNumber = upToMatch.split("\n").length;
        offenders.push({
          file: path.relative(ROOT, file),
          line: lineNumber,
          text: lines[lineNumber - 1]?.trim() ?? "",
        });
      }
    }

    expect(
      offenders,
      offenders.length > 0
        ? `Found ${offenders.length} site(s) using var(--accent-fg) as TEXT color. ` +
          `--accent-fg is the brand-gold FILL/BORDER/ICON token and fails WCAG AA ` +
          `(~1.45:1) as text on a light ground. The text role belongs to ` +
          `--accent-ink (src/shared/theme/glass.css), which resolves to a readable ` +
          `bronze on light grounds and plain gold on dark grounds. Offenders:\n` +
          offenders.map((o) => `  ${o.file}:${o.line}  ${o.text}`).join("\n")
        : undefined
    ).toEqual([]);
  });
});
