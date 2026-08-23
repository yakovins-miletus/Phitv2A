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
  // "closing" (ClosingShelf) DOES render as a section — it mounts its own
  // SectionBeat (`id={section.id}`) and is now home's final chapter (HORIZON)
  // since `blog`, which it used to share a chapter with, relocated to /about
  // (PRD-home-client-focus §US-2). It owns its own chapter's scroll target.
  expect(HOME_SECTIONS.map((s) => s.id)).toContain("closing");
  expect(homeSection("closing").chapter).toBe(7);
  expect(chapterTarget(homeSection("closing").chapter)).toBe("closing");
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
  // Eight chapters now (0-7), not ten — the PEOPLE-act chapters (7-9) were
  // pruned along with their sections when they relocated to /about
  // (PRD-home-client-focus §US-2); `closing` became chapter 7 (HORIZON).
  expect(new Set(chapters)).toEqual(new Set([0, 1, 2, 3, 4, 5, 6, 7]));
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

test("home is a single SERVICES act front to back, now that PEOPLE relocated to /about", () => {
  // PRD-home-client-focus §US-2 moved the whole PEOPLE act (daily-life,
  // candidates, testimonials, blog) to /about, so home's act sequence no
  // longer changes at all — this replaces the old "Services then People"
  // two-act partition test, which is no longer true of the page.
  const acts = HOME_SECTIONS.map((s) => actOfChapter(s.chapter));
  const switches = acts.filter((act, i) => i > 0 && act !== acts[i - 1]).length;
  expect(switches).toBe(0);
  expect(new Set(acts)).toEqual(new Set(["services"]));
});
