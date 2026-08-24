import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
  createRootRoute,
  createRoute,
  Outlet,
} from "@tanstack/react-router";
import { hasReducedMotionListener, prefersReducedMotion } from "motion-dom";
import { TransitionCurtainProvider, useTransitionCurtain } from "@/shared/components/TransitionCurtain";
import { mockReducedMotion, renderWithProviders } from "../test-utils";

function setTestReducedMotion(reduce: boolean) {
  mockReducedMotion(reduce);
  hasReducedMotionListener.current = true;
  prefersReducedMotion.current = reduce;
}

function TestNavControls({ target = "/about" }: { target?: string }) {
  const { navigateWithCurtain } = useTransitionCurtain();
  return (
    <div>
      <div id="main-content" tabIndex={-1}>
        Main Content Landmark
      </div>
      <button onClick={() => navigateWithCurtain(target)}>Go to {target}</button>
      <button onClick={() => navigateWithCurtain("/services")}>Go to /services</button>
      <button
        onClick={() => {
          navigateWithCurtain("/about");
          navigateWithCurtain("/about");
          navigateWithCurtain("/services");
          navigateWithCurtain("/contact");
        }}
      >
        Rapid Click 4x
      </button>
    </div>
  );
}

function buildTestRouter(initialPath = "/", navigateDelay = 0, shouldFail = false) {
  const rootRoute = createRootRoute({
    component: () => (
      <TransitionCurtainProvider>
        <TestNavControls target="/about" />
        <Outlet />
      </TransitionCurtainProvider>
    ),
  });

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <div>Home Route Body</div>,
  });

  const aboutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/about",
    component: () => <div>About Route Body</div>,
  });

  const servicesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/services",
    component: () => <div>Services Route Body</div>,
  });

  const contactRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/contact",
    component: () => <div>Contact Route Body</div>,
  });

  const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, servicesRoute, contactRoute]);
  const history = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({
    routeTree,
    history,
  });

  if (navigateDelay > 0 || shouldFail) {
    const originalNavigate = router.navigate.bind(router);
    router.navigate = vi.fn().mockImplementation(async (opts) => {
      if (navigateDelay > 0) {
        await new Promise((res) => setTimeout(res, navigateDelay));
      }
      if (shouldFail) {
        throw new Error("Simulated router navigation failure");
      }
      return originalNavigate(opts);
    });
  }

  return router;
}

describe("TransitionCurtain Stress & Verification Suite", () => {
  describe("Screen Reader Announcer & Dead Scroll", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      setTestReducedMotion(false);
    });

    it("renders announcer with aria-live='polite' and exact 1px dimensions", async () => {
      const router = buildTestRouter("/");
      renderWithProviders(<RouterProvider router={router} />);

      await screen.findByText("Home Route Body");
      const announcer = document.querySelector('[aria-live="polite"]');
      expect(announcer).toBeInTheDocument();
      expect(announcer).toHaveStyle({
        position: "absolute",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      });
    });

    it("announcer text is empty initially, announces during transition, and clears on finish", async () => {
      const router = buildTestRouter("/");
      renderWithProviders(<RouterProvider router={router} />);

      await screen.findByText("Home Route Body");
      const announcer = document.querySelector('[aria-live="polite"]');
      expect(announcer).toBeEmptyDOMElement();

      const button = screen.getByRole("button", { name: "Go to /about" });
      await userEvent.click(button);

      // Announcer updates to polite message during transition
      expect(announcer).toHaveTextContent(/Navigating to ABOUT PHITOPOLIS/i);

      // After transition finishes completely, announcer clears and landmark receives focus
      await waitFor(
        () => {
          expect(announcer).toBeEmptyDOMElement();
          expect(document.activeElement?.id).toBe("main-content");
        },
        { timeout: 4000 },
      );
    });
  });

  /**
   * These replace the old "Timing Boundaries & Settle Gate Architecture (R5)"
   * block, which asserted a hand-rolled IN / SETTLE / OUT budget with an 800ms
   * settle cap. That architecture is gone. Timing now belongs to the browser's
   * view transition (durations live in `viewTransitions.css`), so asserting
   * wall-clock beats in jsdom — which implements none of it — would be testing
   * a stopwatch against a mock.
   *
   * What is worth asserting instead is the contract this component still owns:
   * it hands the router the right options, it flags the right transition kind,
   * it always cleans that flag up, and it never caps a slow route.
   */
  describe("Transition contract", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      setTestReducedMotion(false);
    });

    it("requests a view transition and completes promptly on a fast route", async () => {
      const router = buildTestRouter("/", 0);
      const navigateSpy = vi.spyOn(router, "navigate");
      renderWithProviders(<RouterProvider router={router} />);

      await screen.findByText("Home Route Body");
      const announcer = document.querySelector('[aria-live="polite"]');

      const start = performance.now();
      await userEvent.click(screen.getByRole("button", { name: "Go to /about" }));

      await waitFor(
        () => {
          expect(announcer).toBeEmptyDOMElement();
          expect(document.activeElement?.id).toBe("main-content");
        },
        { timeout: 4000 },
      );

      expect(navigateSpy).toHaveBeenCalledWith({ to: "/about", viewTransition: true });
      // No self-imposed floor any more. The old suite asserted >= 0.50s because
      // the curtain had a minimum sweep to play out; there is nothing left to
      // wait for, so the only meaningful bound is an upper one.
      expect((performance.now() - start) / 1000).toBeLessThan(1.0);
    });

    it("does NOT cap a slow route — it waits for it", async () => {
      // The old settle gate revealed the destination at 800ms whether or not
      // the route had resolved, because the curtain was opaque and something
      // had to come down. Nothing is covering the page now: the outgoing route
      // stays on screen and readable until the incoming one is genuinely ready,
      // so capping would mean cutting to an unready page for no benefit.
      const router = buildTestRouter("/", 1000);
      renderWithProviders(<RouterProvider router={router} />);

      await screen.findByText("Home Route Body");
      const start = performance.now();
      await userEvent.click(screen.getByRole("button", { name: "Go to /about" }));

      await waitFor(() => expect(router.state.location.pathname).toBe("/about"), {
        timeout: 4000,
      });
      expect((performance.now() - start) / 1000).toBeGreaterThanOrEqual(0.9);
    });

    it("flags home arrivals differently from interior routes, and always clears the flag", async () => {
      const router = buildTestRouter("/about");
      renderWithProviders(<RouterProvider router={router} />);
      await screen.findByText("About Route Body");

      const seen: (string | undefined)[] = [];
      const spy = vi.spyOn(router, "navigate").mockImplementation(async () => {
        seen.push(document.documentElement.dataset.routeTransition);
      });

      await userEvent.click(screen.getByRole("button", { name: "Go to /services" }));
      await waitFor(() => expect(seen).toHaveLength(1));
      expect(seen[0]).toBe("page");

      await waitFor(() =>
        expect(document.documentElement.dataset.routeTransition).toBeUndefined(),
      );
      spy.mockRestore();
    });

    it("clears the transition flag even when navigation throws", async () => {
      const router = buildTestRouter("/", 50, true);
      renderWithProviders(<RouterProvider router={router} />);
      await screen.findByText("Home Route Body");

      await userEvent.click(screen.getByRole("button", { name: "Go to /about" }));

      await waitFor(
        () => expect(document.documentElement.dataset.routeTransition).toBeUndefined(),
        { timeout: 4000 },
      );
    });
  });

  describe("Reduced Motion Path (WCAG 2.3.3)", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      setTestReducedMotion(true);
    });

    it("executes an immediate route change and never requests a view transition", async () => {
      const router = buildTestRouter("/");
      const navigateSpy = vi.spyOn(router, "navigate");
      renderWithProviders(<RouterProvider router={router} />);

      await screen.findByText("Home Route Body");
      const announcer = document.querySelector('[aria-live="polite"]');
      const button = screen.getByRole("button", { name: "Go to /about" });

      const start = performance.now();
      await userEvent.click(button);

      // The announcer fires on BOTH paths now. It used to describe the curtain,
      // which reduced-motion visitors never saw; it now describes the route
      // change, which they do — and reduced-motion visitors are among the most
      // likely to be using assistive tech, so suppressing it here was backwards.
      expect(announcer).toHaveTextContent(/Navigating to About Phitopolis/i);

      // Route change completes immediately
      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/about");
      });
      const elapsed = (performance.now() - start) / 1000;
      expect(elapsed).toBeLessThan(0.20);
      expect(await screen.findByText("About Route Body")).toBeInTheDocument();
      // Focus is deferred by two frames on every path now, so that it lands
      // after the incoming route has committed its own `#main-content` rather
      // than on the outgoing route's node moments before it unmounts.
      await waitFor(() => expect(document.activeElement?.id).toBe("main-content"));
      expect(navigateSpy).toHaveBeenCalledWith({ to: "/about" });
      expect(navigateSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ viewTransition: true }),
      );
    });
  });

  describe("Rapid Clicks & Re-entrancy Stress", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      setTestReducedMotion(false);
    });

    it("handles 4 rapid consecutive clicks without crashing or creating multiple transitions", async () => {
      const router = buildTestRouter("/");
      const navigateSpy = vi.spyOn(router, "navigate");

      renderWithProviders(<RouterProvider router={router} />);

      await screen.findByText("Home Route Body");
      const rapidButton = screen.getByRole("button", { name: "Rapid Click 4x" });
      await userEvent.click(rapidButton);

      // First click locks navigatingRef.current = true; remaining 3 clicks are ignored
      expect(navigateSpy).toHaveBeenCalledTimes(1);
      expect(navigateSpy).toHaveBeenCalledWith({ to: "/about", viewTransition: true });

      // After transition completes, landmark is focused and route changed
      await waitFor(
        () => {
          expect(router.state.location.pathname).toBe("/about");
          expect(document.activeElement?.id).toBe("main-content");
        },
        { timeout: 4000 },
      );
    });

    it("re-enables navigation after the active transition completes", async () => {
      const router = buildTestRouter("/");
      renderWithProviders(<RouterProvider router={router} />);

      await screen.findByText("Home Route Body");
      const buttonAbout = screen.getByRole("button", { name: "Go to /about" });
      await userEvent.click(buttonAbout);

      const announcer = document.querySelector('[aria-live="polite"]');

      // Wait for the full transition lifecycle to complete (announcer cleared + focus shifted)
      await waitFor(
        () => {
          expect(router.state.location.pathname).toBe("/about");
          expect(announcer).toBeEmptyDOMElement();
          expect(document.activeElement?.id).toBe("main-content");
        },
        { timeout: 4000 },
      );

      // Subsequent navigation to /services succeeds
      const buttonServices = screen.getByRole("button", { name: "Go to /services" });
      await userEvent.click(buttonServices);

      await waitFor(
        () => {
          expect(router.state.location.pathname).toBe("/services");
          expect(announcer).toBeEmptyDOMElement();
        },
        { timeout: 4000 },
      );
    });
  });

  describe("Navigation Failure & Resilience", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      setTestReducedMotion(false);
    });

    it("gracefully catches router failure and restores UI/focus without stranding overlay", async () => {
      const router = buildTestRouter("/", 50, true); // Simulated failure
      renderWithProviders(<RouterProvider router={router} />);

      await screen.findByText("Home Route Body");
      const button = screen.getByRole("button", { name: "Go to /about" });
      await userEvent.click(button);

      // Overlay should tear down and focus landmark despite router error
      await waitFor(
        () => {
          const announcer = document.querySelector('[aria-live="polite"]');
          expect(announcer).toBeEmptyDOMElement();
          expect(document.activeElement?.id).toBe("main-content");
        },
        { timeout: 4000 },
      );
    });
  });
});
