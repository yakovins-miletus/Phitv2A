import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative as relativePath } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Ratchet against marketing filler in the copy files.
 *
 * A copy audit in `docs/copy-audit.md` counted 21 buzzword hits across these three
 * files. Nothing was applied, and by the time of the 2026-08-09 audit the count had
 * risen to 44 — the file drifts back toward adjectives whenever someone adds a
 * section, because no single edit looks like a problem on its own. This test is the
 * thing that notices.
 *
 * The rule these words fail is `content.ts`'s own contract: a claim carries a number
 * or a named specific. "world-class", "scalable", "seamless" carry neither, and no
 * competitor would claim the opposite — a word nobody would disclaim adds nothing.
 *
 * ── SCOPE: STRING LITERALS ONLY ──────────────────────────────────────────────────
 * Comments are stripped before scanning. The comments in `content.ts` quote the
 * banned words when they explain what was removed and why, and that record is worth
 * more than a clean grep.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, "..", "src");

/**
 * The whole tree, not just the three copy files.
 *
 * Scoping this to `content.ts` / `sections.ts` / `careersData.ts` was the first
 * version of this test, and it passed while 13 more buzzwords sat in components —
 * `GraduateHallOfFameSection`, `JobDetailsDrawer`, `routes/services.tsx`,
 * `JourneyTimeline`. Copy does not live only in the copy files, so the guard cannot
 * either. (`JobDetailsDrawer` in particular carries its own duplicate of the
 * careers copy; see the separate finding about that.)
 */
function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

/** Words that describe without informing. Case-insensitive, whole-word. */
const BUZZWORDS = [
  "elite",
  "world-class",
  "best-in-class",
  "cutting-edge",
  "bleeding-edge",
  "state-of-the-art",
  "scalable",
  "robust",
  "seamless",
  "seamlessly",
  "supercharge",
  "breathtaking",
  "effortless",
  "frictionless",
  "turnkey",
  "holistic",
  "synergy",
  "paradigm",
  "unparalleled",
  "revolutionary",
  "game-changing",
  "next-level",
  "leverage",
  "elevate",
  "harness",
  "unlock",
  "empower",
  "delve",
  "tapestry",
  "testament",
];

/** Remove `//` line comments and block comments so only real copy is scanned. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("copy is free of marketing filler", () => {
  it("no buzzwords anywhere in src/", () => {
    const hits: string[] = [];

    for (const file of sourceFiles(SRC)) {
      const source = stripComments(readFileSync(file, "utf8"));
      for (const word of BUZZWORDS) {
        const pattern = new RegExp(`\\b${word.replace("-", "[- ]")}\\b`, "gi");
        for (const match of source.matchAll(pattern)) {
          const line = source.slice(0, match.index).split("\n").length;
          hits.push(`${relativePath(SRC, file)}:${String(line)} — "${match[0]}"`);
        }
      }
    }

    expect(
      hits,
      `Remove the word, don't reword around it — the sentence underneath is the claim:\n${hits.join("\n")}`,
    ).toEqual([]);
  });

  it("the hero tagline is not reused as the closing statement", async () => {
    const { CONTENT } = (await import("@/shared/content")) as {
      CONTENT: { hero: { tagline: string }; closing: { statement: string } };
    };
    // A closing statement should resolve, not repeat. Reusing the hero line means a
    // reader who finishes the page is told the same thing they were told at the top.
    expect(CONTENT.closing.statement).not.toBe(CONTENT.hero.tagline);
  });
});
