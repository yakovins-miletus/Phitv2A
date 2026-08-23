import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

const SRC = path.resolve(__dirname, "../../src");

/**
 * Guards against a whole class of invisible-but-scrollable elements.
 *
 * `TransitionCurtain`'s screen-reader announcer was written as
 * `{ position: "absolute", width: 1, height: 1, clip: "rect(0 0 0 0)" }`.
 * In MUI's `sx` system a *unitless* number is a ratio, so `width: 1` compiles to
 * `width: 100%` — not `1px`. `#root` is `position: static`, so the box resolved
 * against the initial containing block and rendered a full viewport tall, parked
 * past the end of the content. `clip` hid it visually while contributing a full
 * screen of dead scroll below the footer on EVERY route.
 *
 * Measured before the fix: `scrollHeight - bodyHeight === 757px` (exactly one
 * viewport) on `/`, `/about` and `/services`.
 */
describe("visually-hidden elements do not add scrollable area", () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry.name)) files.push(full);
    }
  };
  walk(SRC);

  test("no sx block combines a clip-based hide with a unitless width/height", () => {
    const offenders: string[] = [];

    for (const file of files) {
      const src = fs.readFileSync(file, "utf8");
      if (!src.includes("clip:")) continue;

      const lines = src.split("\n");
      lines.forEach((line, i) => {
        if (!/\bclip:\s*["'`]rect\(/.test(line)) return;
        // Inspect the surrounding style object for a ratio-valued box size.
        const window_ = lines.slice(Math.max(0, i - 12), i + 12).join("\n");
        const ratio = /\b(width|height)\s*:\s*(0?\.\d+|1)\s*,/.exec(window_);
        if (ratio) {
          offenders.push(
            `${path.relative(SRC, file)}:${String(i + 1)} — ${ratio[1]}: ${ratio[2]} ` +
              `is a RATIO in MUI sx (=${ratio[2] === "1" ? "100%" : "a percentage"}), not px`,
          );
        }
      });
    }

    expect(offenders).toEqual([]);
  });

  test("the curtain announcer specifically uses pixel units", () => {
    const src = fs.readFileSync(
      path.join(SRC, "shared/components/TransitionCurtain.tsx"),
      "utf8",
    );
    const at = src.indexOf('aria-live="polite"');
    expect(at, "announcer not found").toBeGreaterThan(-1);
    // The sx object follows the attribute; scan forward far enough to clear the
    // explanatory comment without running into unrelated JSX.
    const block = src.slice(at, at + 2500);
    expect(block).toMatch(/width:\s*"1px"/);
    expect(block).toMatch(/height:\s*"1px"/);
  });
});
