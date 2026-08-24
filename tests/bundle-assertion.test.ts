import fs from "node:fs";
import path from "node:path";
import { describe, expect, test, beforeAll } from "vitest";

const DIST_DIR = path.resolve(__dirname, "../dist");

describe("Production Bundle & Chunk Isolation Assertions", () => {
  beforeAll(() => {
    const tempFiles = [
      path.resolve(__dirname, "e2e/check-browsers.mjs"),
      path.resolve(__dirname, "e2e/preview-cdp.test.ts"),
      path.resolve(__dirname, "e2e/test-cdp.mjs"),
    ];
    for (const file of tempFiles) {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch {
        // ignore error
      }
    }
  });

  test("dist/ directory and dist/index.html exist", () => {
    expect(fs.existsSync(DIST_DIR)).toBe(true);
    expect(fs.existsSync(path.join(DIST_DIR, "index.html"))).toBe(true);
  });

  test("dist/index.html does not preload or eagerly load gsap, lenis, SmoothScroll, or ScrollTrigger", () => {
    const html = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf8");

    const linksAndScripts = [
      ...html.matchAll(/<(?:link|script)[^>]+(?:href|src)="([^"]+)"/g),
    ]
      .map((m) => m[1])
      .filter((s): s is string => typeof s === "string");

    expect(linksAndScripts.length).toBeGreaterThan(0);

    const forbiddenSubstrings = ["gsap", "lenis", "smoothscroll", "scrolltrigger"];

    const offendingRefs: string[] = [];
    for (const ref of linksAndScripts) {
      const lower = ref.toLowerCase();
      for (const token of forbiddenSubstrings) {
        if (lower.includes(token)) {
          offendingRefs.push(`Forbidden token '${token}' found in ref: ${ref}`);
        }
      }
    }

    expect(offendingRefs).toEqual([]);
  });

  test("eager entry chunk (index-*.js) does not contain bundled gsap or lenis code", () => {
    const html = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf8");
    const entryMatch = html.match(/<script type="module" crossorigin src="\/assets\/(index-[^"]+\.js)"><\/script>/);
    expect(entryMatch).not.toBeNull();

    const entryFilename: string = entryMatch && entryMatch[1] ? entryMatch[1] : "";
    expect(entryFilename).toBeTruthy();
    const entryPath = path.join(DIST_DIR, "assets", entryFilename);
    expect(fs.existsSync(entryPath)).toBe(true);

    const entryContent = fs.readFileSync(entryPath, "utf8");

    // GSAP core markers
    const hasGsapCore =
      entryContent.includes("_ticker") &&
      entryContent.includes("Tween") &&
      entryContent.includes("Timeline");
    expect(hasGsapCore).toBe(false);

    // Lenis core markers
    const hasLenisCore =
      entryContent.includes("virtual-scroll") ||
      (entryContent.includes("class Lenis") || entryContent.includes("class SmoothScroll"));
    expect(hasLenisCore).toBe(false);
  });

  test("all preloaded chunks in dist/index.html are free of gsap and lenis engines", () => {
    const html = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf8");
    const preloads = [...html.matchAll(/<link rel="modulepreload" crossorigin href="\/assets\/([^"]+)">/g)]
      .map((m) => m[1])
      .filter((s): s is string => typeof s === "string");

    expect(preloads.length).toBeGreaterThan(0);

    const contaminatedChunks: string[] = [];
    for (const chunk of preloads) {
      if (!chunk.endsWith(".js")) continue;
      const chunkPath = path.join(DIST_DIR, "assets", chunk);
      if (!fs.existsSync(chunkPath)) continue;
      const content = fs.readFileSync(chunkPath, "utf8");

      // Verify no gsap engine in preloads
      if (
        content.includes("_ticker") &&
        content.includes("core") &&
        (content.includes("Timeline") || content.includes("Tween"))
      ) {
        contaminatedChunks.push(`GSAP engine in ${chunk}`);
      }

      // Verify no Lenis engine in preloads
      if (
        (content.includes("wheelMultiplier") && content.includes("touchMultiplier")) ||
        content.includes("class Lenis")
      ) {
        contaminatedChunks.push(`Lenis engine in ${chunk}`);
      }
    }

    expect(contaminatedChunks).toEqual([]);
  });

  /**
   * This used to assert three filenames: a `gsap-*` chunk, a `ScrollTrigger-*`
   * chunk and a `SmoothScroll-*` chunk. The `gsap-*` one existed only because
   * `TransitionCurtain` did its own `import("gsap")`, which created a second
   * chunk boundary; once the curtain was replaced by view transitions that
   * import went away and Rollup folded gsap core in with ScrollTrigger — one
   * fewer request, identical bytes, still lazy.
   *
   * A filename is not the invariant. The invariant is that gsap and Lenis load
   * lazily and never on first paint, so that is what this asserts now: present
   * in some async chunk, absent from every eagerly-preloaded one. That holds
   * however the bundler decides to group them.
   */
  test("gsap and lenis load lazily and are absent from the eager set", () => {
    const assetsDir = path.join(DIST_DIR, "assets");
    const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".js"));

    // `lagSmoothing` is gsap core; `Lenis` names its own class in the bundle.
    const hasGsap = (src: string) => src.includes("lagSmoothing");
    const hasLenis = (src: string) => /lenis/i.test(src) && src.includes("virtualScroll");

    const html = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf8");
    const eager = new Set(
      [...html.matchAll(/href="\/assets\/([A-Za-z0-9._-]+\.js)"/g)].map((m) => m[1]),
    );
    expect(eager.size).toBeGreaterThan(0);

    let gsapAsync = 0;
    let lenisAsync = 0;
    const leaked: string[] = [];

    for (const file of jsFiles) {
      const src = fs.readFileSync(path.join(assetsDir, file), "utf8");
      const gsap = hasGsap(src);
      const lenis = hasLenis(src);
      if (!gsap && !lenis) continue;
      if (eager.has(file)) {
        leaked.push(`${file} (${[gsap && "gsap", lenis && "lenis"].filter(Boolean).join(", ")})`);
      } else {
        if (gsap) gsapAsync++;
        if (lenis) lenisAsync++;
      }
    }

    expect(gsapAsync, "gsap should live in at least one async chunk").toBeGreaterThanOrEqual(1);
    expect(lenisAsync, "lenis should live in at least one async chunk").toBeGreaterThanOrEqual(1);
    expect(leaked, "gsap/lenis must never ship in an eagerly-preloaded chunk").toEqual([]);
  });
});
