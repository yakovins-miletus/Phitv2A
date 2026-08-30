import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { ABOUT_SECTIONS, HOME_SECTIONS } from "@/shared/sections";

// The page keeps two registries of "what is on screen", on purpose:
//
//   HOME_SECTIONS  ScrollTrigger, 50%/50% boundaries -> the EyeFlow rail.
//   NAV_ANCHORS    IntersectionObserver, -80px/-90% -> navbar compact/dark.
//
// They are separate because they answer different questions with different
// thresholds. The hazard is that the ids LOOK interchangeable — "daily-life" vs
// "daily-life-video" — and until NAV_ANCHORS existed both APIs took a bare
// string, so crossing them was a silent no-op rather than an error.

// PRD-home-client-focus §US-2 moved `daily-life` (and candidates/testimonials/
// blog) out of HOME_SECTIONS into ABOUT_SECTIONS — both registries feed the
// same "section ids" namespace the anchor namespace must stay disjoint from,
// so this test now checks against their union.
const sectionIds = [...HOME_SECTIONS, ...ABOUT_SECTIONS].map((s) => s.id);
const anchorIds = Object.values(NAV_ANCHORS);

test("no id belongs to both registries", () => {
  const overlap = anchorIds.filter((id) => sectionIds.includes(id));
  expect(overlap).toEqual([]);
});

test("the near-miss pair is still a near miss, not a collision", () => {
  // These two are the reason the confusion is easy to fall into: the section is
  // the whole 100vh stage, the anchor is the film inside it that the navbar has
  // to go light over. Same feature, different geometry, different registry.
  // `daily-life` now lives on /about (ABOUT_SECTIONS) rather than home.
  expect(sectionIds).toContain("daily-life");
  expect(anchorIds).toContain("daily-life-video");
  expect(sectionIds).not.toContain("daily-life-video");
  expect(anchorIds).not.toContain("daily-life");
});

test("anchor ids are unique", () => {
  expect(new Set(anchorIds).size).toBe(anchorIds.length);
});

test("section ids are unique", () => {
  expect(new Set(sectionIds).size).toBe(sectionIds.length);
});

test("every anchor id is registered in NAV_ANCHORS, none left as bare strings", async () => {
  // useNavbarAnchor's parameter is typed to NavAnchorId, so a bare string is a
  // compile error. This asserts the registry still covers every live call site,
  // which typing alone cannot tell you.
  //
  // This used to scan a hand-written list of four files and assert the call count
  // was exactly 5. Both halves rotted: the count assertion started failing the
  // moment anyone added an anchor to one of those four files (it was at 6), and the
  // file list never covered the other nine call sites at all — so the check that
  // actually matters was not running on most of the codebase. Walking `src/` costs
  // a few milliseconds and removes both failure modes; the count is no longer
  // asserted because scanning everything is what the count was standing in for.
  const { readdir, readFile } = await import("node:fs/promises");
  const { join, resolve } = await import("node:path");

  // `import.meta.url` is not a file: URL under this vitest project, so resolve from
  // the process cwd (vitest runs from the package root) rather than from the module.
  const SRC = resolve(process.cwd(), "src");

  async function walk(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        return /\.tsx?$/.test(entry.name) ? [full] : [];
      }),
    );
    return files.flat();
  }

  const files = await walk(SRC);
  const sources = await Promise.all(files.map((f) => readFile(f, "utf8")));

  const calls = sources.flatMap((src, i) =>
    [...src.matchAll(/useNavbarAnchor\(([^,)]+)/g)]
      // The hook's own definition and its import are not call sites.
      .filter(() => !files[i]!.endsWith("navbarHooks.ts"))
      // `VideoPageHero` is the shared cinematic header for /blog, /careers and
      // /services; it forwards a typed `NavAnchorId` prop (`anchor`) straight to
      // the hook, so the bare-string hazard cannot apply — the id literal lives
      // at each page's `<VideoPageHero anchor={NAV_ANCHORS.*}>` call site.
      .filter(() => !files[i]!.endsWith("VideoPageHero.tsx"))
      .map((m) => `${files[i]!.slice(SRC.length + 1)}: ${m[1]!.trim()}`),
  );

  expect(calls.length).toBeGreaterThan(0);
  for (const call of calls) expect(call).toMatch(/: NAV_ANCHORS\./);
});
