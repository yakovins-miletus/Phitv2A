import { renderHook, act } from "@testing-library/react";

import {
  HOME_SECTIONS,
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
  // "closing" is never rendered as a section but must stay: EyeFlow draws one
  // rail dot per entry, so removing it silently changes the visible dot count.
  expect(HOME_SECTIONS.map((s) => s.id)).toContain("closing");
  expect(homeSection("closing").chapter).toBe(3);
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
  expect(new Set(chapters)).toEqual(new Set([0, 1, 2, 3]));
});
