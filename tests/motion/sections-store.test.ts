import { renderHook, act } from "@testing-library/react";

import {
  CHAPTERS,
  HOME_SECTIONS,
  actOfChapter,
  chapterTarget,
  homeSection,
  setActiveSection,
  useActiveSection,
} from "@/shared/sections";

// The module-level active-section store is one of four systems that answer
// "what is on screen". It is the only one with a single writer (useStagePresence
// in StageSection) and a single reader (EyeFlow), and therefore the only one
// that can be reasoned about in isolation. These tests pin that down.

afterEach(() => {
  setActiveSection("hero");
});

test("useSyncExternalStore contract: subscribers see updates, snapshot is stable", () => {
  const { result, rerender } = renderHook(() => useActiveSection());
  expect(result.current).toBe("hero");

  act(() => { setActiveSection("use-cases"); });
  expect(result.current).toBe("use-cases");

  // Stable identity across re-renders with no intervening write. If the store
  // returned a fresh value each call, useSyncExternalStore would loop forever.
  const before = result.current;
  rerender();
  expect(result.current).toBe(before);
});

test("writing the active id twice notifies subscribers only once", () => {
  let renders = 0;
  renderHook(() => { renders += 1; return useActiveSection(); });
  const baseline = renders;

  act(() => { setActiveSection("blog"); });
  const afterFirst = renders;
  expect(afterFirst).toBeGreaterThan(baseline);

  // setActiveSection early-returns on an unchanged id. Without that guard every
  // ScrollTrigger callback — which fire on every scroll frame — would re-render
  // both rails continuously.
  act(() => { setActiveSection("blog"); });
  expect(renders).toBe(afterFirst);
});

test("unsubscribed listeners stop receiving updates", () => {
  let renders = 0;
  const { unmount } = renderHook(() => { renders += 1; return useActiveSection(); });
  act(() => { setActiveSection("process"); });
  const atUnmount = renders;

  unmount();
  act(() => { setActiveSection("reach"); });
  expect(renders).toBe(atUnmount);
});

test("every section EyeFlow can land on resolves, including the rail-only one", () => {
  // EyeFlow calls homeSection(useActiveSection()), which THROWS on an unknown
  // id. Any id a ScrollTrigger can write must therefore exist in HOME_SECTIONS.
  for (const section of HOME_SECTIONS) {
    expect(homeSection(section.id).id).toBe(section.id);
  }
  // "closing" is never rendered as a section. It is kept because it is harmless
  // and shares its chapter with `blog`, which sorts first and so owns that
  // chapter's scroll target. (The old comment here claimed it had to stay
  // because "EyeFlow draws one rail dot per entry" — that described the retired
  // ScrollRail. EyeFlow renders one label per chapter, not per section.)
  expect(HOME_SECTIONS.map((s) => s.id)).toContain("closing");
  expect(homeSection("closing").chapter).toBe(9);
  expect(chapterTarget(homeSection("closing").chapter)).toBe("blog");
});

test("homeSection throws loudly on an unknown id rather than returning undefined", () => {
  expect(() => homeSection("no-such-section")).toThrow(/Unknown home section/);
});

test("chapters are contiguous and non-decreasing down the page", () => {
  // EyeFlow derives the active chapter from section order; a section filed under
  // an out-of-order chapter would make the chapter rail jump backwards on scroll.
  const chapters = HOME_SECTIONS.map((s) => s.chapter);
  for (let i = 1; i < chapters.length; i += 1) {
    expect(chapters[i]!).toBeGreaterThanOrEqual(chapters[i - 1]!);
  }
  expect(new Set(chapters)).toEqual(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
  // Every declared chapter is actually used by a section, so the rail never
  // renders a label you cannot scroll to.
  expect(new Set(CHAPTERS.map((c) => c.index))).toEqual(new Set(chapters));
});

test("every chapter belongs to exactly one act", () => {
  // The bug this guards: `chapter: 2` used to hold BOTH `reach` (the last
  // Services beat) and `daily-life` (the first People beat), so the act seam ran
  // through the middle of a chapter and the rail read REACH over the people
  // film. An act must be a property of the chapter, never of the section.
  for (const { index } of CHAPTERS) {
    const acts = new Set(
      HOME_SECTIONS.filter((s) => s.chapter === index).map((s) => actOfChapter(s.chapter)),
    );
    expect(acts.size).toBeLessThanOrEqual(1);
  }
});

test("the acts partition the page in order: all of SERVICES, then all of PEOPLE", () => {
  // Sections are declared in scroll order, so the act sequence must change
  // exactly once. Two changes would mean the page cuts back to Services after
  // introducing the people — which is the narrative the two-act split exists to
  // prevent.
  const acts = HOME_SECTIONS.map((s) => actOfChapter(s.chapter));
  const switches = acts.filter((act, i) => i > 0 && act !== acts[i - 1]).length;
  expect(switches).toBe(1);
  expect(acts[0]).toBe("services");
  expect(acts.at(-1)).toBe("people");

  // The seam is between `reach` and `daily-life` specifically. If someone moves
  // a section across it, this is the test that should fail.
  const ids = HOME_SECTIONS.map((s) => s.id);
  const lastServices = ids[acts.lastIndexOf("services")];
  const firstPeople = ids[acts.indexOf("people")];
  expect(lastServices).toBe("reach");
  expect(firstPeople).toBe("daily-life");
});
