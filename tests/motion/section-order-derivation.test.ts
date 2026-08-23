import { describe, expect, test } from "vitest";

import {
  ABOUT_SECTIONS,
  HOME_SECTIONS,
  sectionOrder,
} from "@/shared/sections";
import { refreshPriorityFor } from "@/shared/motion/beatThresholds";

/**
 * Guards PRD-home-client-focus US-5 AC-1: page order and motion priority must
 * follow from ONE ordered registry, with no second list to maintain by hand.
 *
 * Before this refactor every section component hardcoded its own `order={N}`.
 * Removing or reordering a section silently left those numbers stale, which is
 * exactly the desync these tests exist to make impossible — `refreshPriority`
 * must run top-to-bottom in page order, or a beat measured before an upstream
 * pin has settled reads offsets that are wrong by that pin's spacer height.
 */
describe("section order derives from registry position", () => {
  test("every home section's order is its index in HOME_SECTIONS", () => {
    HOME_SECTIONS.forEach((section, index) => {
      expect(sectionOrder(section.id), `home section "${section.id}"`).toBe(index);
    });
  });

  test("every about section's order is its index in ABOUT_SECTIONS", () => {
    ABOUT_SECTIONS.forEach((section, index) => {
      expect(sectionOrder(section.id), `about section "${section.id}"`).toBe(index);
    });
  });

  test("the two registries share no ids, so the home-then-about lookup is unambiguous", () => {
    const home = new Set(HOME_SECTIONS.map((s) => s.id));
    const collisions = ABOUT_SECTIONS.filter((s) => home.has(s.id)).map((s) => s.id);
    expect(collisions).toEqual([]);
  });

  test("an unknown id throws rather than silently returning a wrong order", () => {
    // Loud failure is deliberate: a typo'd id must not resolve to order 0 and
    // quietly win the refresh queue against every real section.
    expect(() => sectionOrder("no-such-section")).toThrow(/Unknown section/);
  });

  test("refreshPriority is strictly descending down each page, and stays positive", () => {
    for (const [label, sections] of [
      ["home", HOME_SECTIONS],
      ["about", ABOUT_SECTIONS],
    ] as const) {
      const priorities = sections.map((s) => refreshPriorityFor(sectionOrder(s.id)));
      for (let i = 1; i < priorities.length; i++) {
        expect(
          priorities[i]!,
          `${label}: "${sections[i]!.id}" must refresh after "${sections[i - 1]!.id}"`,
        ).toBeLessThan(priorities[i - 1]!);
      }
      // The whole scale must stay positive so migrated beats refresh ahead of
      // any trigger still sitting at an implicit 0 — see beatThresholds.ts.
      expect(Math.min(...priorities), `${label}: priorities must stay positive`).toBeGreaterThan(0);
    }
  });

  test("no section component re-declares a page order by hand", async () => {
    // The regression this whole refactor removes: a literal `order={N}` prop is
    // a second list. If one reappears, AC-1 is broken again.
    const fs = await import("node:fs");
    const path = await import("node:path");
    const SRC = path.resolve(__dirname, "../../src");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry.name)) {
          fs.readFileSync(full, "utf8")
            .split("\n")
            .forEach((line, i) => {
              // a literal numeric order prop, not a comment referencing one
              if (/^\s*order=\{\d+\}/.test(line)) {
                offenders.push(`${path.relative(SRC, full)}:${String(i + 1)}`);
              }
            });
        }
      }
    };
    walk(SRC);
    expect(offenders).toEqual([]);
  });
});
