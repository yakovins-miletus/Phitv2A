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
 *
 * ── EXTENDED FOR THE GLASS PALETTE ───────────────────────────────────────────────
 *
 * The original file measured foregrounds against *raw* grounds. That is no longer
 * where text lives: a glass surface is a white tint composited over the ground, so
 * every ground is effectively three or four grounds, each lighter than the one the
 * tokens were verified against. Glass is exactly where contrast quietly dies — a
 * 0.62 white that measured 5.9:1 on navy measures 4.81:1 on elevation-3 glass over
 * `navyField`, and one more elevation takes it under.
 *
 * So the surface matrix below (4 grounds × 3 elevations) is now the primary gate,
 * and the raw grounds are just its floor.
 *
 * The glass surfaces are modelled with the understudy at **zero alpha** — white
 * tint straight onto the ground. That is the worst case by construction: the
 * understudy (`--glass-under`, rgba of navyInk) only ever darkens a surface back
 * toward the darkest ground, so every figure here is a lower bound on what ships.
 */

import { describe, expect, test } from "vitest";

import { NOIR, DAWN, CHAPTER_ACCENTS, TECH_CAT_ACCENTS } from "@/shared/theme/palette";

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

/** The four dark grounds — `GROUNDS` in theme/grounds.ts, in depth order. */
const GROUNDS: Record<string, string> = {
  floor: NOIR.navyFloor,
  base: NOIR.navyInk,
  deep: NOIR.navyDeep,
  field: NOIR.navyField,
};

/** The glass fill alphas — `--glass-fill-1/2/3` in theme/glass.css. */
const GLASS_FILLS = [0.06, 0.09, 0.12] as const;

/**
 * Every surface text can land on: each ground bare, plus each glass elevation over
 * it. `field` + 0.12 is the lightest surface the design produces and therefore the
 * binding constraint on every white-ish foreground.
 */
const SURFACES: [string, string][] = Object.entries(GROUNDS).flatMap(([name, bg]) => [
  [name, bg] as [string, string],
  ...GLASS_FILLS.map((a) => [`glass ${a} over ${name}`, whiteOver(bg, a)] as [string, string]),
]);

describe("text on glass", () => {
  test("primary text clears AA on every surface", () => {
    // NOIR.frost = --text-1. Worst case is 8.95:1 on elevation-3 glass over field.
    for (const [name, surface] of SURFACES) {
      const ratio = contrast(NOIR.frost, surface);
      expect(ratio, `frost on ${name} — ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_BODY);
    }
  });

  test("the two muted text alphas clear AA on every surface", () => {
    // --text-2 (0.70) and --text-3 (0.60). A generic glass spec would put the
    // second of these at 0.50; that measures 3.71:1 on elevation-3 glass over
    // field and fails, which is why the token is 0.60. Pinned here so nobody
    // "tidies" it back down.
    for (const [name, surface] of SURFACES) {
      for (const alpha of [0.7, 0.6]) {
        const ratio = contrast(whiteOver(surface, alpha), surface);
        expect(ratio, `white@${alpha} on ${name} — ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_BODY);
      }
      const failing = contrast(whiteOver(surface, 0.5), surface);
      if (surface === whiteOver(GROUNDS.field!, 0.12)) {
        expect(failing, "white@0.50 must remain recognised as failing on the lightest glass").toBeLessThan(AA_BODY);
      }
    }
  });

  test("the disabled alpha stays recognisably sub-AA", () => {
    // --text-disabled (0.38). It must NOT accidentally become legible enough to
    // be reached for as body copy — the same trap the 0.36 alpha was.
    for (const [name, surface] of SURFACES) {
      const ratio = contrast(whiteOver(surface, 0.38), surface);
      expect(ratio, `white@0.38 on ${name} — ${ratio.toFixed(2)}:1`).toBeLessThan(AA_BODY);
    }
  });

  test("the two alphas the original audit caught are still caught", () => {
    // Values actually found in the codebase before the first contrast pass:
    //   0.22 -> 1.95:1  fails even the large-text floor  (an 8px year label)
    //   0.36 -> 3.02:1  large-text only, used for body copy
    for (const ground of Object.values(GROUNDS)) {
      expect(contrast(whiteOver(ground, 0.36), ground)).toBeLessThan(AA_BODY);
      expect(contrast(whiteOver(ground, 0.22), ground)).toBeLessThan(AA_LARGE);
    }
  });
});

/**
 * ── THE LIGHT GROUND ─────────────────────────────────────────────────────────
 *
 * `palette.ts` ships `mode: "light"` and `grounds.ts` still vends `void`, `panel`
 * and `white`, so the page default is off-white and only *sections* are navy.
 * glass.css used to describe the dark ground only, and the light page inherited
 * it: `<h1>` on /contact rendered `#F4F7FC` on `#F4F7FC` — 1.00:1, the same
 * colour as the paper.
 *
 * These are the `:root` values, modelled the same way as the dark block: the tint
 * is composited at full strength straight onto the ground, which is the worst
 * case here too — the light understudy is white, so it only ever lightens a
 * surface back toward `--g-white`, and every foreground below is dark.
 */
const LIGHT_GROUNDS: Record<string, string> = {
  void: NOIR.void,
  panel: NOIR.panel,
  white: NOIR.white,
};

/** `--glass-fill-1/2/3` on the light ground: navy, not white. */
const LIGHT_GLASS_FILLS = [0.03, 0.05, 0.07] as const;

/** Navy at `alpha` composited over an opaque background. */
function navyOver(bg: string, alpha: number): string {
  const h = bg.replace("#", "");
  const n = NOIR.navyField.replace("#", "");
  const mix = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16);
    const f = parseInt(n.slice(i, i + 2), 16);
    return Math.round(f * alpha + c * (1 - alpha));
  };
  return `#${[mix(0), mix(2), mix(4)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const LIGHT_SURFACES: [string, string][] = Object.entries(LIGHT_GROUNDS).flatMap(([name, bg]) => [
  [name, bg] as [string, string],
  ...LIGHT_GLASS_FILLS.map((a) => [`glass ${a} over ${name}`, navyOver(bg, a)] as [string, string]),
]);

describe("text on the light ground", () => {
  test("primary text clears AA on every light surface", () => {
    // --text-1 on :root is NOIR.navyField. Worst case is `white`, 12.62:1 — the
    // light ground has far more headroom than the dark one, which is exactly why
    // nothing noticed the tokens were inverted until the text went missing.
    for (const [name, surface] of LIGHT_SURFACES) {
      const ratio = contrast(NOIR.navyField, surface);
      expect(ratio, `navyField on ${name} — ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_BODY);
    }
  });

  test("the two muted navy alphas clear AA on every light surface", () => {
    // --text-2 (0.78) and --text-3 (0.68). 0.60 — the round number, and what the
    // dark ground uses — measures 4.19:1 on `void` and fails, which is why the
    // light token is 0.68. Pinned so nobody "aligns" the two grounds.
    for (const [name, surface] of LIGHT_SURFACES) {
      for (const alpha of [0.78, 0.68]) {
        const ratio = contrast(navyOver(surface, alpha), surface);
        expect(ratio, `navy@${alpha} on ${name} — ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_BODY);
      }
      const failing = contrast(navyOver(surface, 0.6), surface);
      if (surface === NOIR.void) {
        expect(failing, "navy@0.60 must remain recognised as failing on void").toBeLessThan(AA_BODY);
      }
    }
  });

  test("the disabled alpha stays recognisably sub-AA", () => {
    for (const [name, surface] of LIGHT_SURFACES) {
      const ratio = contrast(navyOver(surface, 0.38), surface);
      expect(ratio, `navy@0.38 on ${name} — ${ratio.toFixed(2)}:1`).toBeLessThan(AA_BODY);
    }
  });
});

describe("accent on glass", () => {
  test("gold carries text on every dark surface", () => {
    // Replaces "gold is <3:1 on void". That test guarded against reaching for gold
    // to fix a label on a light ground — the right instinct, wrongly retired when
    // the palette was assumed to be all-dark. Worst case 6.16:1 on dark.
    for (const [name, surface] of SURFACES) {
      const ratio = contrast(NOIR.gold, surface);
      expect(ratio, `gold on ${name} — ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_BODY);
    }
  });

  test("gold as text on a light surface is pinned as a known sub-AA pairing", () => {
    // NOT a guard — a record. `--accent-fg` is brand gold on BOTH grounds, so
    // every gold overline, mailto link and contained-button label on a light
    // page renders at these ratios: 1.45:1 on `void`, 1.49:1 on `panel`, under
    // both the body floor and the large-text floor. That is a deliberate
    // brand-consistency call taken over the contrast floor, made after the
    // per-ground bronze (`goldInk`) failed to hold — half the call sites wrote
    // the gold literally and never picked the bronze up, so one brand role
    // shipped in four colours.
    //
    // Pinned the same way NOIR.live and the two broken white alphas are: if
    // these numbers ever move, someone changed the accent and should say so.
    for (const [name, surface] of LIGHT_SURFACES) {
      const ratio = contrast(NOIR.gold, surface);
      expect(ratio, `gold on ${name} — ${ratio.toFixed(2)}:1`).toBeLessThan(AA_LARGE);
    }
  });

  test("goldDark is still not a text colour on light", () => {
    // The obvious wrong fix: reach for the existing darker gold. It was cut to
    // darken a fill and measures 1.75:1 as text on `void`.
    expect(contrast(NOIR.goldDark, NOIR.void)).toBeLessThan(AA_LARGE);
  });

  test("navy reads on a gold fill", () => {
    // `secondary.contrastText` is NOIR.navyInk. It was #FFFFFF, which is 1.70:1 on
    // brand gold — the contained-button pairing nobody measured.
    expect(contrast(NOIR.navyInk, NOIR.gold)).toBeGreaterThanOrEqual(AA_BODY);
    expect(contrast(NOIR.white, NOIR.gold)).toBeLessThan(AA_LARGE);
  });

  test("the live indicator is pinned as non-text on lifted glass", () => {
    // NOIR.live clears AA on the dark grounds themselves but measures 3.04-3.65:1
    // on glass over `field`. Asserted as a *failure* on purpose, the same way the
    // broken white alphas are: it documents that `live` is the dot, never the word.
    for (const alpha of GLASS_FILLS) {
      const surface = whiteOver(GROUNDS.field!, alpha);
      expect(contrast(NOIR.live, surface)).toBeLessThan(AA_BODY);
    }
  });
});

describe("hero motto over the dawn sky (stage 4)", () => {
  // The hero motto (SuperHeroSequence.tsx) is NOIR.navyField at 2.0-2.6rem /
  // 800 weight — large text, so the WCAG floor is 3:1, not the 4.5:1 body
  // floor. Computed against every DAWN stop the sky gradient walks through
  // (zenith 5.56 / upper 7.78 / mid 10.34 / haze 11.15 / warm 10.42 / ember
  // 8.88), the two pinned here are the worst case (zenith, the coolest and
  // lowest-contrast stop) and the reference point the token set's own TSDoc
  // cites alongside it (warm).
  test("navy motto on the coolest sky stop (zenith) clears even the body-text floor", () => {
    const ratio = contrast(NOIR.navyField, DAWN.zenith);
    expect(ratio, `navyField on zenith — ${ratio.toFixed(2)}:1`).toBeCloseTo(5.56, 1);
    expect(ratio).toBeGreaterThanOrEqual(AA_BODY);
  });

  test("navy motto on the warm band clears with wide margin", () => {
    const ratio = contrast(NOIR.navyField, DAWN.warm);
    expect(ratio, `navyField on warm — ${ratio.toFixed(2)}:1`).toBeCloseTo(10.42, 1);
    expect(ratio).toBeGreaterThanOrEqual(AA_BODY);
  });

  test("every sky stop clears the large-text floor for the motto", () => {
    for (const [name, hex] of Object.entries(DAWN)) {
      if (name.endsWith("Rgb")) continue;
      const ratio = contrast(NOIR.navyField, hex);
      expect(ratio, `navyField on ${name} — ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_LARGE);
    }
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

  test("every accent clears AA on the grounds it is rendered against", () => {
    // The assertion whose absence let a 2.27:1 text colour through: the original
    // ramp opened at #2E4C8F, which was fine on an off-white page and vanished
    // when the page went dark. JourneyTimeline renders these as text.
    //
    // `base` and `deep` only — the timeline's grounds. On `field` the 2019 stop is
    // 4.03:1 and on glass over field it is 2.84:1, which is why palette.ts
    // documents that the timeline may not move onto lifted or glass surfaces.
    const TIMELINE_GROUNDS = { base: NOIR.navyInk, deep: NOIR.navyDeep };
    const accents = { ...CHAPTER_ACCENTS, ...TECH_CAT_ACCENTS };

    for (const [key, colour] of Object.entries(accents)) {
      for (const [name, ground] of Object.entries(TIMELINE_GROUNDS)) {
        const ratio = contrast(colour, ground);
        expect(ratio, `${key} (${colour}) on ${name} — ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_BODY);
      }
    }
  });

  test("no Tailwind default, macOS system, or generic-glass colours survive in the palette", () => {
    const banned = [
      // Tailwind defaults, the original template residue.
      "#a78bfa", "#60a5fa", "#34d399", "#f472b6", "#e879f9", "#38bdf8", "#f59e0b",
      // macOS traffic lights and a neon "live" green.
      "#ff5f56", "#ffbd2e", "#27c93f", "#00e676",
      // The generic dark-glass template this revamp deliberately did NOT adopt:
      // its lime accent, its graphite base pair, and its off-white text. The brief
      // offered them as examples; the brand's own navy and gold answered instead.
      "#ccff00", "#0a0a0c", "#111114", "#141418", "#f5f5f0",
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

  test("the retired light tokens are still only what the unswept components need", () => {
    // DELETE WITH: NOIR.void / panel / white / ink / mist / hairline, once the
    // component sweep has re-pointed the last of the ~12 files that use them.
    // Until then they must at least still be internally consistent, so a partial
    // migration cannot leave a light-on-light pairing behind.
    for (const ground of [NOIR.void, NOIR.panel, NOIR.white]) {
      expect(contrast(NOIR.ink, ground)).toBeGreaterThanOrEqual(AA_BODY);
      expect(contrast(NOIR.mist, ground)).toBeGreaterThanOrEqual(AA_BODY);
    }
  });
});
