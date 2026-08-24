import { describe, expect, test } from "vitest";
import { ESLint } from "eslint";

describe("ESLint Workspace Quality Gate", () => {
  test("workspace passes ESLint with 0 errors", async () => {
    const eslint = new ESLint();
    const results = await eslint.lintFiles(["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"]);
    const errorResults = results.filter((r) => r.errorCount > 0);
    for (const r of errorResults) {
      for (const m of r.messages.filter((m) => m.severity === 2)) {
        console.log(`ERROR IN ${r.filePath}:${m.line}:${m.column} (${m.ruleId}): ${m.message}`);
      }
    }
    expect(errorResults.length).toBe(0);
  });
});
