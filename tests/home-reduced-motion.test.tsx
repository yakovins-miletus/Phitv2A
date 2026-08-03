import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { screen, within } from "@testing-library/react";

import { routeTree } from "@/routeTree.gen";

import { makeTestQueryClient, renderWithProviders } from "./test-utils";

// setup.ts stubs matchMedia with prefers-reduced-motion: reduce by default —
// these tests are the deterministic reduced-motion evidence.

async function renderHome() {
  const queryClient = makeTestQueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  renderWithProviders(<RouterProvider router={router} />, queryClient);
  await screen.findByRole("heading", { level: 1, name: "Phitopolis" });
}

test("reduced motion: no preloader overlay mounts, hero text is present immediately", async () => {
  await renderHome();

  expect(screen.queryByTestId("preloader")).not.toBeInTheDocument();
  expect(screen.getByText("[ SCROLL TO EXPLORE ↓ ]")).toBeInTheDocument();
  // The core-mission block renders CONTENT.hero.description, split around
  // "R&D firm" so that phrase can be gold — so the sentence is broken across
  // elements and needs a node-spanning matcher.
  expect(
    screen.getByText(/we view global markets as the ultimate intellectual puzzle/i),
  ).toBeInTheDocument();
  expect(screen.getByText("R&D firm")).toBeInTheDocument();
});

test("reduced motion: hero scene is one decorative canvas, not a DOM particle field", async () => {
  await renderHome();

  // The hero scene is now a single canvas (HeroCanvas) rather than the ~250 styled
  // DOM nodes HeroSignalP used to mount. Under reduce it still mounts — it paints one
  // static, fully-flattened frame and never starts a rAF loop, which is asserted
  // deterministically in tests/motion/hero-scene.test.ts.
  const hero = document.querySelector("#hero");
  expect(hero).not.toBeNull();

  const canvases = (hero as HTMLElement).querySelectorAll("canvas");
  expect(canvases).toHaveLength(1);

  // Purely decorative: it must never reach the accessibility tree.
  expect(canvases[0]).toHaveAttribute("aria-hidden");

  // The old implementation stacked 12-14 copies of the same logo SVG to fake extrusion
  // depth. Nothing should stack images like that any more.
  expect(
    (hero as HTMLElement).querySelectorAll('img[src*="phitopolis_logo_hero"]').length,
  ).toBeLessThanOrEqual(1);
});

test("reduced motion: use-case narrative stacks vertically, all slides reachable", async () => {
  await renderHome();

  // The pinned horizontal scrub never runs under reduce; every slide and its
  // diagram must still be present in the document.
  expect(screen.getByText("Algorithmic Signal Generation")).toBeInTheDocument();
  expect(screen.getByText("Cloud-Native Infrastructure")).toBeInTheDocument();
  expect(screen.getByText("High-Frequency Trading Support")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /noise to alpha/i })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /cloud-native data pipeline/i })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /follow-the-sun coverage/i })).toBeInTheDocument();
});
