/**
 * Contrast regression gate.
 *
 * `NOIR.mist` was `#6B7FA8` and served as `text.secondary` across 108 usages in 38
 * files, at **3.74:1** on the site's own background — below the WCAG AA floor of 4.5:1
 * for body text. Nothing in CI could see that, so it survived indefinitely.
 *
 * This computes the real ratio from the shipped tokens. It is deliberately arithmetic
 * on `palette.ts` rather than a snapshot: changing a token to a failing value must fail
 * the build, not silently re-record.
 */

import { describe, expect, test } from "vitest";

import { NOIR, CHAPTER_ACCENTS, TECH_CAT_ACCENTS } from "@/shared/theme/palette";

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

/** White at `alpha` composited over an opaque background. */
function whiteOver(bg: string, alpha: number): string {
  const h = bg.replace("#", "");
  const mix = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16);
    return Math.round(255 * alpha + c * (1 - alpha));
  };
  return `#${[mix(0), mix(2), mix(4)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const AA_BODY = 4.5;
const AA_LARGE = 3;

/** Every light ground `text.secondary` is rendered against. */
const LIGHT_GROUNDS: Record<string, string> = {
  void: NOIR.void,
  panel: NOIR.panel,
  white: "#FFFFFF",
};

describe("text contrast", () => {
  test("secondary text clears AA on every light ground", () => {
    for (const [name, ground] of Object.entries(LIGHT_GROUNDS)) {
      const ratio = contrast(NOIR.mist, ground);
      expect(ratio, `NOIR.mist on ${name} — ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_BODY);
    }
  });

  test("primary text clears AA comfortably", () => {
    for (const [name, ground] of Object.entries(LIGHT_GROUNDS)) {
      const ratio = contrast(NOIR.ink, ground);
      expect(ratio, `NOIR.ink on ${name} — ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_BODY);
    }
  });

  test("white body text on navy clears AA at the alpha the fixes standardised on", () => {
    // Values actually found in the codebase before this pass:
    //   0.22 -> 1.95:1  fails even the large-text floor  (an 8px year label, no less)
    //   0.36 -> 3.02:1  large-text only, used for body copy
    //   0.50 -> 4.52:1  passes, but by 0.02 — no margin for a background tweak
    // Everything was standardised at 0.62 (5.9:1) so the margin is real rather than
    // incidental. This pins the two ends: 0.62 must pass, and the two values that were
    // genuinely broken must still be recognised as broken.
    const NAVY_GROUNDS = [NOIR.navyField, NOIR.navyDeep, NOIR.navyInk];

    for (const ground of NAVY_GROUNDS) {
      expect(contrast(whiteOver(ground, 0.62), ground)).toBeGreaterThanOrEqual(AA_BODY);
      expect(contrast(whiteOver(ground, 0.36), ground)).toBeLessThan(AA_BODY);
      expect(contrast(whiteOver(ground, 0.22), ground)).toBeLessThan(AA_LARGE);
    }
  });

  test("gold is used on dark grounds only — it cannot carry text on light ones", () => {
    // Guards against someone "fixing" a low-contrast label by reaching for the brand
    // gold: it is ~1.4:1 on the light ground and invisible.
    expect(contrast(NOIR.gold, NOIR.void)).toBeLessThan(AA_LARGE);
    expect(contrast(NOIR.gold, NOIR.navyDeep)).toBeGreaterThanOrEqual(AA_BODY);
  });
});

describe("palette integrity", () => {
  test("every token is a full-length hex", () => {
    for (const [key, value] of Object.entries(NOIR)) {
      if (key.endsWith("Rgb")) continue;
      expect(value, `NOIR.${key}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  test("chapter accents run navy → gold in chronological order", () => {
    // The ramp replaced seven Tailwind default hues. Its whole justification is that
    // the colour encodes time, so the monotonic warming is the contract.
    const years = Object.keys(CHAPTER_ACCENTS).sort();
    expect(years).toHaveLength(8);

    const lums = years.map((y) => luminance(CHAPTER_ACCENTS[y]!));
    for (let i = 1; i < lums.length; i++) {
      expect(lums[i]!, `${years[i]} should be lighter than ${years[i - 1]}`).toBeGreaterThan(lums[i - 1]!);
    }
    // It must land on the brand gold.
    expect(CHAPTER_ACCENTS["2026"]).toBe(NOIR.gold);
  });

  test("no Tailwind default or macOS system colours survive in the palette", () => {
    const banned = [
      "#a78bfa", "#60a5fa", "#34d399", "#f472b6", "#e879f9", "#38bdf8", "#f59e0b",
      "#ff5f56", "#ffbd2e", "#27c93f", "#00e676",
    ];
    const all = [
      ...Object.values(NOIR),
      ...Object.values(CHAPTER_ACCENTS),
      ...Object.values(TECH_CAT_ACCENTS),
    ].map((v) => v.toLowerCase());

    for (const bad of banned) {
      expect(all, `${bad} is off-brand template residue`).not.toContain(bad);
    }
  });
});
