import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { screen } from "@testing-library/react";

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
  expect(
    screen.getByText(/we view global markets as the ultimate intellectual puzzle/i),
  ).toBeInTheDocument();
});

test("reduced motion: every pitch section is reachable, not just the first", async () => {
  await renderHome();

  // The regression this guards is real and shipped. The pitch was one pinned 100vh
  // deck holding four beats, switched by `display: none` off a scroll-driven beat
  // index — and its ScrollTrigger was skipped entirely under reduce:
  //
  //     if (reduced || !containerRef.current) return;
  //
  // so `activeBeat` stayed 0 forever. Beats 1-3 existed in the DOM but were never
  // displayed, and the only other way to reach them was a tab bar built from
  // `<Box onClick>` with no tabIndex and no key handler — unreachable by keyboard
  // too. Under reduced motion the page silently lost three quarters of its pitch.
  //
  // They are three ordinary sections now, so scrolling is the only requirement.
  expect(
    screen.getByRole("heading", { name: /THE QUANTITATIVE R&D PARTNER FOR GLOBAL MARKETS/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Research Pillar" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Support & Delivery Pillar" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Technical Talent" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "International Backing" })).toBeInTheDocument();

  // And no beat-switching tab bar survives to be un-focusable.
  expect(screen.queryByText(/01 EXECUTIVE SUMMARY/i)).not.toBeInTheDocument();
});

test("reduced motion: the ground layer paints one static ground and starts no loop", async () => {
  await renderHome();

  // Rung 1 of the ground layer's degradation ladder. setup.ts stubs
  // prefers-reduced-motion: reduce, so this is the reduce path by construction.
  const host = document.querySelector<HTMLElement>('[data-ground-layer]');
  expect(host).not.toBeNull();

  // Decorative and behind everything: it must never reach the accessibility tree
  // and must never become the LCP element.
  expect(host).toHaveAttribute("aria-hidden");

  // A ground is painted — the page is never a flash of unstyled white — but the
  // WebGL canvas stays hidden and no renderer is created under reduce.
  //
  // Asserted as the specific colour rather than merely "non-empty": non-empty would
  // also accept a light ground regressing back into the track, which is the failure
  // that matters now that every foreground is off-white. `hero` opens on `base`.
  expect(host!.style.backgroundColor).toBe("rgb(244, 247, 252)");

  const canvas = host!.querySelector("canvas");
  expect(canvas).not.toBeNull();
  expect(canvas!.style.opacity).toBe("0");
});

test("reduced motion: the glass blur gate is off", async () => {
  await renderHome();

  // The one place glass cost is gated (theme/useGlassGate.ts) lives in Providers,
  // and this passes only if it really does. setup.ts stubs
  // prefers-reduced-motion: reduce at module scope, so the reduce half of the gate
  // is what is being asserted — jsdom exposes no hardwareConcurrency or
  // deviceMemory, so useIsLowPowerDevice() reads "high" here.
  //
  // glass.css also gates blur in an @media (prefers-reduced-motion: reduce) block,
  // which is what covers users before React mounts; media queries are stubbed in
  // jsdom, so the hook is the observable half.
  expect(document.documentElement.dataset.glass).toBe("off");
});

test("the ground layer is not occluded by the root backgrounds", async () => {
  await renderHome();

  // Regression guard for a bug that made the entire layer invisible while every
  // other signal said it was working.
  //
  // `index.html` paints `html { background: #061226 }` as a pre-JS anti-flash
  // colour, and CssBaseline paints `body` with `background.default`. Because *html*
  // carries a background of its own, body's stops propagating to the viewport
  // canvas and paints as an ordinary in-flow block instead — which per CSS painting
  // order happens AFTER negative-z-index descendants. So `z-index: -1` put the
  // ground layer *underneath* body's opaque fill.
  //
  // Nothing observable in the DOM caught this: the canvas had opacity 1, WebGL was
  // rendering, and the sampler reported correct colours the whole time. Only the
  // painting order was wrong.
  const html = document.documentElement.style.backgroundColor;
  const body = document.body.style.backgroundColor;
  expect(html).toBe("transparent");
  expect(body).toBe("transparent");
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
