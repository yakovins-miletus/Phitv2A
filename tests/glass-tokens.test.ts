/**
 * The glass token layer's integrity gate.
 *
 * `glass.css` is a real stylesheet, for the reasons its own docblock gives. The
 * cost of that decision is a small cross-language mirror: four ground hex values,
 * the accent rgb triplet and two easing curves are spelled in CSS as well as in
 * TypeScript. ESLint's no-restricted-syntax rule only matches TS AST nodes, so
 * `.css` is completely invisible to it — nothing else in the toolchain can see a
 * drift between the two.
 *
 * So this file reads the stylesheet as text and compares it against the modules it
 * mirrors. It also enforces two things that are otherwise unenforceable:
 *
 *   - A typo'd custom property is **silently ignored by CSS**. `var(--glas-fill-1)`
 *     does not warn, it just renders nothing. The same class of failure the
 *     `justify` ESLint rule was written for, one layer down.
 *   - The gate must be applied *completely* in all three of its blocks. A block
 *     that drops the blur but forgets the understudy alpha leaves a 6%-white
 *     surface floating over unblurred content with text on it.
 *
 * Deliberately string analysis, not `getComputedStyle`: vitest stubs `.css`
 * imports, so in jsdom none of these properties resolve at all.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

import { EASE_IN_OUT_QUART_CSS, EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";
import { NOIR } from "@/shared/theme/palette";

// Vitest runs with the project root as cwd (vitest.config.ts lives there), and
// esbuild's transform leaves `import.meta.url` unusable in this setup.
const read = (relative: string) => readFileSync(resolve(process.cwd(), relative), "utf8");

const glassCss = read("src/shared/theme/glass.css");
const glassTs = read("src/shared/theme/glass.ts");
const indexHtml = read("index.html");

/**
 * The `:root` block only — the LIGHT ground, which is the page default. Gate
 * blocks and the dark block redeclare several of these names.
 *
 * Both selectors are anchored to the start of a line (`/m`): glass.css names them
 * in prose in its own docblock, and an unanchored match starts inside that
 * comment and then runs on to the *next* `{` it finds — which silently made the
 * dark block resolve to `:root`'s contents.
 */
const ROOT_BLOCK = /^:root[\s\S]*?\{([\s\S]*?)\n\}/m.exec(glassCss)?.[1] ?? "";

/** The `[data-ground="dark"]` block — the navy ground, plus the portal chrome. */
const DARK_BLOCK = /^\[data-ground="dark"\][\s\S]*?\{([\s\S]*?)\n\}/m.exec(glassCss)?.[1] ?? "";

/** Read a custom property's value out of a given block of CSS text. */
function tokenIn(block: string, name: string): string | undefined {
  const m = new RegExp(`--${name}\\s*:\\s*([^;]+);`).exec(block);
  return m?.[1]?.trim();
}

const rootToken = (name: string) => tokenIn(ROOT_BLOCK, name);
const darkToken = (name: string) => tokenIn(DARK_BLOCK, name);

/**
 * The five tokens the gate owns. They are identical on both grounds and the gate
 * blocks select `:root` / `html`, so a redeclaration inside the dark block would
 * out-specify the gate and leave navy sections blurring on a machine that asked
 * for no blur. glass.css states this contract; this is what enforces it.
 */
const GATED_TOKENS = ["glass-blur", "glass-saturate", "glass-under-a", "nav-blur", "scrim-blur"];

/** The three blocks that must gate glass cost, keyed by how they are selected. */
const GATE_BLOCKS: Record<string, string> = {
  'html[data-glass="off"]': /html\[data-glass="off"\]\s*\{([\s\S]*?)\n\}/.exec(glassCss)?.[1] ?? "",
  "@media (prefers-reduced-motion: reduce)":
    /@media \(prefers-reduced-motion: reduce\)\s*\{\s*:root\s*\{([\s\S]*?)\n\s*\}/.exec(glassCss)?.[1] ?? "",
  "@supports not (backdrop-filter)":
    /@supports not \(\(backdrop-filter[\s\S]*?:root\s*\{([\s\S]*?)\n\s*\}/.exec(glassCss)?.[1] ?? "",
};

describe("glass.css mirrors its TypeScript sources", () => {
  test("the parser found the blocks it is asserting against", () => {
    // Guards the guard: a refactor that renames a selector must fail loudly here
    // rather than making every assertion below vacuously pass on an empty string.
    expect(ROOT_BLOCK.length).toBeGreaterThan(500);
    expect(DARK_BLOCK.length).toBeGreaterThan(500);
    for (const [selector, block] of Object.entries(GATE_BLOCKS)) {
      expect(block.length, `${selector} — block not found`).toBeGreaterThan(40);
    }
  });

  test("ground tokens equal their NOIR counterparts", () => {
    const pairs: [string, string][] = [
      ["g-void", NOIR.void],
      ["g-panel", NOIR.panel],
      ["g-white", NOIR.white],
      ["g-floor", NOIR.navyFloor],
      ["g-ink", NOIR.navyInk],
      ["g-deep", NOIR.navyDeep],
      ["g-field", NOIR.navyField],
    ];
    for (const [name, expected] of pairs) {
      expect(rootToken(name)?.toLowerCase(), `--${name}`).toBe(expected.toLowerCase());
    }
  });

  test("each ground's foreground tokens equal their NOIR counterparts", () => {
    // The bug this pair of assertions exists for: `:root` carried the DARK values
    // while palette.ts shipped `mode: "light"`, so --text-1 was near-white on an
    // off-white page — <h1> on /contact measured 1.00:1. Pinning both grounds
    // means neither set can be "simplified" back into the other.
    expect(rootToken("text-1")?.toLowerCase(), "--text-1 on light").toBe(
      NOIR.navyField.toLowerCase(),
    );
    expect(darkToken("text-1")?.toLowerCase(), "--text-1 on dark").toBe(NOIR.frost.toLowerCase());

    // --accent-fg is deliberately NOT per-ground: brand gold is the accent as
    // text on both. The light ground used to carry a bronze (`goldInk`) for the
    // 4.5:1 floor; that split is retired, and the sub-AA reading it existed to
    // avoid is pinned in a11y-contrast.test.ts rather than hidden. Both grounds
    // stay asserted so neither can drift back apart unnoticed.
    expect(rootToken("accent-fg")?.toLowerCase(), "--accent-fg on light").toBe(
      NOIR.gold.toLowerCase(),
    );
    expect(darkToken("accent-fg")?.toLowerCase(), "--accent-fg on dark").toBe(
      NOIR.gold.toLowerCase(),
    );
  });

  test("the dark ground does not redeclare a gated token", () => {
    for (const name of GATED_TOKENS) {
      expect(
        darkToken(name),
        `--${name} is gated on :root; redeclaring it in the dark block out-specifies the gate`,
      ).toBeUndefined();
    }
  });

  test("tokens whose value contains var() are declared on both grounds", () => {
    // A custom property's var()s are substituted at computed-value time on the
    // element the declaration lands on, and descendants inherit the SUBSTITUTED
    // value. So --glass-under declared only on :root would carry white into a
    // navy section no matter what --glass-under-rgb says there.
    for (const name of ["glass-under", "glass-filter", "nav-fill", "glass-border"]) {
      expect(rootToken(name), `--${name} on light`).toBeDefined();
      expect(darkToken(name), `--${name} must be redeclared on the dark ground`).toBeDefined();
    }
  });

  test("rgb triplet tokens equal their NOIR counterparts", () => {
    // The accent is one colour on both grounds; the understudy is the ground's
    // own darkest/lightest neutral, so it is one per ground.
    expect(rootToken("accent-rgb")).toBe(NOIR.goldRgb);
    expect(rootToken("glass-under-rgb")).toBe(NOIR.whiteRgb);
    expect(darkToken("glass-under-rgb")).toBe(NOIR.navyInkRgb);
  });

  test("easing tokens equal the shared curves", () => {
    // Raw cubic-bezier in TS is an ESLint error; in CSS it can only be caught here.
    expect(rootToken("ease-out")).toBe(EASE_OUT_EXPO_CSS);
    expect(rootToken("ease-in-out")).toBe(EASE_IN_OUT_QUART_CSS);
  });
});

describe("motion rules are mechanically enforced", () => {
  const DURATION = /^([\d.]+)(s|ms)$/;

  test("no duration token exceeds the 0.35s interaction ceiling", () => {
    const names = ["dur-fast", "dur", "dur-slow", "dur-max"];
    for (const name of names) {
      const raw = rootToken(name);
      const m = DURATION.exec(raw ?? "");
      expect(m, `--${name} is "${raw ?? "missing"}"`).not.toBeNull();
      const seconds = m![2] === "ms" ? Number(m![1]) / 1000 : Number(m![1]);
      expect(seconds, `--${name}`).toBeLessThanOrEqual(0.35);
    }
  });

  test("nothing is timed linear", () => {
    // `linear-gradient` is not a timing function, hence the boundary guards.
    const linearTiming = /(?<!-)\blinear\b(?!-)/.exec(glassCss);
    expect(linearTiming, `found "linear" as a timing function`).toBeNull();
  });

  test("backdrop-filter is never transitioned", () => {
    // Transitioning a blur recomputes it on every frame of the transition. The
    // --t-glass token exists partly to make that omission explicit.
    expect(rootToken("t-glass")).not.toContain("backdrop-filter");
  });
});

describe("the blur gate is applied completely", () => {
  test.each(Object.keys(GATE_BLOCKS))("%s drops blur and lifts the understudy", (selector) => {
    const block = GATE_BLOCKS[selector]!;
    expect(tokenIn(block, "glass-blur"), "--glass-blur").toBe("0px");
    expect(tokenIn(block, "nav-blur"), "--nav-blur").toBe("0px");
    expect(tokenIn(block, "scrim-blur"), "--scrim-blur").toBe("0px");
    expect(tokenIn(block, "glass-saturate"), "--glass-saturate").toBe("100%");
    // The whole point of the tint/understudy split: when the blur goes, the
    // surface must become opaque in the same declaration block.
    expect(tokenIn(block, "glass-under-a"), "--glass-under-a").toBe("0.94");
  });

  test("the ungated defaults are the full-fidelity values", () => {
    expect(rootToken("glass-blur")).toBe("20px");
    expect(rootToken("glass-saturate")).toBe("160%");
    expect(rootToken("glass-under-a")).toBe("0.55");
  });
});

describe("every custom property consumed is declared", () => {
  /** `--hp-*` is the hero's per-frame numeric channel, written imperatively by
   *  heroVars.ts. It is deliberately not part of the token layer. */
  const FOREIGN_NAMESPACE = /^--hp-/;

  const declared = new Set(
    [...glassCss.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((m) => m[1]!),
  );

  /** Comments discuss tokens in prose (`var(--glass-*)`), which is not a usage. */
  const stripComments = (source: string) =>
    source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  function consumedIn(source: string): string[] {
    return [...stripComments(source).matchAll(/var\((--[a-z0-9-]+)/gi)]
      .map((m) => m[1]!)
      .filter((name) => !FOREIGN_NAMESPACE.test(name));
  }

  test("glass.ts references only declared tokens", () => {
    for (const name of consumedIn(glassTs)) {
      expect(declared, `glass.ts uses ${name}, which glass.css does not declare`).toContain(name);
    }
  });

  test("glass.css references only tokens it declares", () => {
    for (const name of consumedIn(glassCss)) {
      expect(declared, `glass.css uses ${name} without declaring it`).toContain(name);
    }
  });

  test("glass.ts carries no raw colour literals", () => {
    // The tokens are the only place colour is authored. ESLint enforces this for
    // most of src via no-restricted-syntax; asserting it here means the rule
    // cannot be silenced for this file without the suite noticing.
    expect(glassTs).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(glassTs).not.toMatch(/rgba?\(/);
  });
});

describe("the pre-JS paint matches the base ground", () => {
  test("index.html paints void (#F4F7FC)", () => {
    const background = /html\s*\{[^}]*background:\s*([^;]+);/.exec(indexHtml)?.[1]?.trim();
    expect(background?.toLowerCase()).toBe(NOIR.void.toLowerCase());

    const themeColor = /<meta name="theme-color" content="([^"]+)"/.exec(indexHtml)?.[1];
    expect(themeColor?.toLowerCase()).toBe(NOIR.void.toLowerCase());

    expect(indexHtml).toMatch(/color-scheme:\s*light dark/);
  });
});
