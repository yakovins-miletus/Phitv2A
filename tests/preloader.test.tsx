import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { Preloader } from "@/shared/components/Preloader";
import * as motion from "@/shared/motion";

import { CHOREO_END_S, POST_HOLD_S } from "@/shared/components/preloaderChoreo";
import { mockReducedMotion, renderWithProviders } from "./test-utils";

/**
 * Real-timer windows derived from the choreography table. The intro is a ~8.5s
 * showcase: the exit waits on CHOREO_END plus the post-100 buffer plus the
 * reveal, so re-pacing the intro must widen these automatically rather than
 * turning them into failsafe tests.
 */
// Vitest's 5s default predates the showcase intro.
vi.setConfig({ testTimeout: 25000 });

const EXIT_WINDOW_MS = CHOREO_END_S * 1000 + POST_HOLD_S * 1000 + 2600 + 1600; // 2600 = EXIT_FADE_S (600) + OUT_DURATION_S (2000)

test("preloader ticks on real signals and reaches 100%", async () => {
  // jsdom: document.fonts is undefined and readyState is "complete", so zero
  // pending signals — the preloader completes immediately (the honest path).
  renderWithProviders(<Preloader onDone={() => {}} />);

  expect(screen.getByTestId("preloader")).toBeInTheDocument();
  expect(await screen.findByText("100%")).toBeInTheDocument();
});

test("warm-up signals drive the bar and the ticking label", async () => {
  let resolveFirst!: () => void;
  let resolveSecond!: () => void;
  const warmup = [
    { label: "CAPABILITIES", promise: new Promise<void>((resolve) => (resolveFirst = resolve)) },
    { label: "R&D LAB", promise: new Promise<void>((resolve) => (resolveSecond = resolve)) },
  ];

  renderWithProviders(<Preloader onDone={() => {}} warmup={warmup} />);
  expect(screen.getByText("00%")).toBeInTheDocument();

  resolveFirst();
  expect(await screen.findByText("50%")).toBeInTheDocument();
  expect(screen.getByText("WARMING — CAPABILITIES")).toBeInTheDocument();

  resolveSecond();
  expect(await screen.findByText("100%")).toBeInTheDocument();
  expect(screen.getByText("READY")).toBeInTheDocument();
});

test("a pending background signal does not hold the reveal", async () => {
  mockReducedMotion(false);
  const onDone = vi.fn();
  const onStartExit = vi.fn();
  const warmup = [
    { label: "HERO_CRIT", promise: Promise.resolve() },
    // never resolves — must not gate the exit
    { label: "ROUTE_WARM", blocking: false, promise: new Promise<void>(() => {}) },
    { label: "GLOBE", blocking: false, promise: new Promise<void>(() => {}) },
  ];

  renderWithProviders(
    <Preloader onDone={onDone} onStartExit={onStartExit} warmup={warmup} />,
  );

  // Blocking tier (1/1) is done immediately, so the bar reads 100% and the
  // reveal fires even though two background promises are still pending.
  expect(await screen.findByText("100%")).toBeInTheDocument();
  await waitFor(
    () => {
      expect(onStartExit).toHaveBeenCalled();
      expect(onDone).toHaveBeenCalled();
    },
    { timeout: EXIT_WINDOW_MS },
  );
});

test("progressPercent reflects only the blocking signal set", async () => {
  mockReducedMotion(false);
  let resolveCrit!: () => void;
  const warmup = [
    { label: "CRIT", promise: new Promise<void>((r) => (resolveCrit = r)) },
    { label: "BG_A", blocking: false, promise: new Promise<void>(() => {}) },
    { label: "BG_B", blocking: false, promise: new Promise<void>(() => {}) },
    { label: "BG_C", blocking: false, promise: new Promise<void>(() => {}) },
  ];

  renderWithProviders(<Preloader onDone={() => {}} warmup={warmup} />);
  // 3 of 4 signals are background; the bar ignores them entirely.
  expect(screen.getByText("00%")).toBeInTheDocument();

  resolveCrit();
  // 1/1 blocking resolved -> 100%, not 1/4.
  expect(await screen.findByText("100%")).toBeInTheDocument();
});

test("Escape skips the preloader", async () => {
  const user = userEvent.setup();
  // Fake a never-resolving fonts.ready so a pending signal exists and skip is
  // meaningful (the window `load` signal was removed — it delayed LCP).
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready: new Promise(() => undefined) },
  });

  renderWithProviders(<Preloader onDone={() => {}} />);
  expect(screen.getByText("00%")).toBeInTheDocument();

  await user.keyboard("{Escape}");
  expect(await screen.findByText("100%")).toBeInTheDocument();

  delete (document as { fonts?: unknown }).fonts;
});

test("resolves and triggers onDone when useReducedMotion transitions null -> false mid-flight", async () => {
  let reducedValue: boolean | null = null;
  const spy = vi.spyOn(motion, "useReducedMotion").mockImplementation(() => reducedValue);
  const onDone = vi.fn();
  const onStartExit = vi.fn();

  try {
    const { rerender } = renderWithProviders(
      <Preloader onDone={onDone} onStartExit={onStartExit} />
    );

    expect(screen.getByTestId("preloader")).toBeInTheDocument();

    // Transition from null to false on subsequent render
    reducedValue = false;
    rerender(<Preloader onDone={onDone} onStartExit={onStartExit} />);

    await waitFor(
      () => {
        expect(onDone).toHaveBeenCalled();
      },
      { timeout: EXIT_WINDOW_MS }
    );
  } finally {
    spy.mockRestore();
  }
});

test("unconditional failsafe resolves preloader when a signal hangs indefinitely", async () => {
  const hangingSignal = {
    label: "HANGING_ASSET",
    promise: new Promise(() => {}), // Never resolves
  };
  const onDone = vi.fn();
  const onStartExit = vi.fn();

  renderWithProviders(
    <Preloader onDone={onDone} onStartExit={onStartExit} warmup={[hangingSignal]} />
  );

  expect(screen.getByTestId("preloader")).toBeInTheDocument();
  expect(screen.getByText("00%")).toBeInTheDocument();

  // The post-choreography signal cap guarantees onDone and onStartExit are
  // invoked even though the signal never settles; the unconditional failsafe
  // (13000ms) sits above it as the last resort.
  await waitFor(
    () => {
      expect(onStartExit).toHaveBeenCalled();
      expect(onDone).toHaveBeenCalled();
    },
    { timeout: EXIT_WINDOW_MS }
  );
});

test("instant resolution when prefers-reduced-motion is true", () => {
  const onDone = vi.fn();
  const onStartExit = vi.fn();

  renderWithProviders(<Preloader onDone={onDone} onStartExit={onStartExit} />);

  expect(onDone).toHaveBeenCalled();
  expect(onStartExit).toHaveBeenCalled();
});
