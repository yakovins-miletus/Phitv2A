import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { HOME_SECTIONS } from "@/shared/sections";

// The page keeps two registries of "what is on screen", on purpose:
//
//   HOME_SECTIONS  ScrollTrigger, 50%/50% boundaries -> the EyeFlow rail.
//   NAV_ANCHORS    IntersectionObserver, -80px/-90% -> navbar compact/dark.
//
// They are separate because they answer different questions with different
// thresholds. The hazard is that the ids LOOK interchangeable — "daily-life" vs
// "daily-life-video" — and until NAV_ANCHORS existed both APIs took a bare
// string, so crossing them was a silent no-op rather than an error.

const sectionIds = HOME_SECTIONS.map((s) => s.id);
const anchorIds = Object.values(NAV_ANCHORS);

test("no id belongs to both registries", () => {
  const overlap = anchorIds.filter((id) => sectionIds.includes(id));
  expect(overlap).toEqual([]);
});

test("the near-miss pair is still a near miss, not a collision", () => {
  // These two are the reason the confusion is easy to fall into: the section is
  // the whole 100vh stage, the anchor is the film inside it that the navbar has
  // to go light over. Same feature, different geometry, different registry.
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
  const sources = await Promise.all(
    [
      "../../src/routes/index.tsx",
      "../../src/routes/about.tsx",
      "../../src/shared/components/AppShell.tsx",
      "../../src/features/home/components/DailyLifeSection/DailyLifeSection.tsx",
    ].map(async (rel) => {
      const { readFile } = await import("node:fs/promises");
      const { fileURLToPath } = await import("node:url");
      return readFile(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
    }),
  );
  const calls = sources.flatMap((src) => [...src.matchAll(/useNavbarAnchor\(([^,)]+)/g)].map((m) => m[1]!.trim()));
  expect(calls.length).toBe(4);
  for (const call of calls) expect(call).toMatch(/^NAV_ANCHORS\./);
});
