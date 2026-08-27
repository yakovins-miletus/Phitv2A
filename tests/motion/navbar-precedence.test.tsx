import { useEffect } from "react";
import { act, render } from "@testing-library/react";
import { NAV_ANCHORS, NavbarProvider } from "@/shared/components/NavbarContext";
import { useNavbar } from "@/shared/components/navbarHooks";

// `NavbarContext`'s `isOverDarkSection` used to be `darkAnchors.size > 0` — a plain
// boolean OR across every currently-intersecting anchor. Two anchors registered at
// once (which happens at every section boundary, briefly, since both sit inside the
// same IntersectionObserver detection band during the handoff) meant a dark anchor
// anywhere in the zone forced dark chrome even while a light anchor was ALSO
// intersecting and visually current. These tests pin the replacement: the anchor
// with the largest `top` (the one that most recently crossed into the detection band
// from below — standard scrollspy semantics) wins, not "any dark anchor wins".
//
// `registerAnchor` is called directly rather than through a real IntersectionObserver
// — this targets the precedence logic itself, which is orthogonal to whether the
// browser's observer wiring is correct (that's exercised implicitly by every anchor
// site actually working in the browser, not something a unit test can usefully fake).

function Probe() {
  const { isOverDarkSection } = useNavbar();
  return <div data-testid="probe">{isOverDarkSection ? "dark" : "light"}</div>;
}

function renderProbe() {
  let registerAnchor!: ReturnType<typeof useNavbar>["registerAnchor"];
  function Capture() {
    const navbar = useNavbar();
    useEffect(() => {
      registerAnchor = navbar.registerAnchor;
    });
    return null;
  }
  const utils = render(
    <NavbarProvider>
      <Capture />
      <Probe />
    </NavbarProvider>,
  );
  return { read: () => utils.getByTestId("probe").textContent, register: () => registerAnchor };
}

test("no active anchors defaults to light", () => {
  const { read } = renderProbe();
  expect(read()).toBe("light");
});

test("a single dark anchor makes the navbar dark", () => {
  const { read, register } = renderProbe();
  act(() => register()(NAV_ANCHORS.HOME_CLOSING, true, true, 0));
  expect(read()).toBe("dark");
  act(() => register()(NAV_ANCHORS.HOME_CLOSING, false));
  expect(read()).toBe("light");
});

test("the anchor with the larger top wins when two overlap: dark outgoing, light incoming", () => {
  const { read, register } = renderProbe();

  // Outgoing dark section: mostly scrolled past, very negative top.
  act(() => register()(NAV_ANCHORS.HOME_CLOSING, true, true, -900));
  expect(read()).toBe("dark");

  // Incoming light section freshly crosses the detection band: larger (less
  // negative) top. It should win even though the dark anchor is still
  // "intersecting" per its own IntersectionObserver entry.
  act(() => register()(NAV_ANCHORS.SITE_FOOTER, true, false, 10));
  expect(read()).toBe("light");

  // The outgoing dark anchor finally exits.
  act(() => register()(NAV_ANCHORS.HOME_CLOSING, false));
  expect(read()).toBe("light");
});

test("the anchor with the larger top wins when two overlap: light outgoing, dark incoming", () => {
  const { read, register } = renderProbe();

  // Outgoing light section, mostly scrolled past.
  act(() => register()(NAV_ANCHORS.HOME_REACH, true, false, -900));
  expect(read()).toBe("light");

  // Incoming dark section freshly crosses the band — should win over the
  // outgoing light anchor, the mirror case of the test above.
  act(() => register()(NAV_ANCHORS.DAILY_LIFE_VIDEO, true, true, 10));
  expect(read()).toBe("dark");
});

test("unregistering the winning anchor falls back to the next-largest top", () => {
  const { read, register } = renderProbe();

  act(() => register()(NAV_ANCHORS.HOME_REACH, true, false, -50));
  act(() => register()(NAV_ANCHORS.DAILY_LIFE_VIDEO, true, true, 20));
  expect(read()).toBe("dark");

  // The winner exits; the remaining (light) anchor should now decide.
  act(() => register()(NAV_ANCHORS.DAILY_LIFE_VIDEO, false));
  expect(read()).toBe("light");
});
