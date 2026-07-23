import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Preloader } from "@/shared/components/Preloader";

import { renderWithProviders } from "./test-utils";

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
