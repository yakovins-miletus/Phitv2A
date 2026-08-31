import { screen } from "@testing-library/react";

import { ProcessDiagram, type ProcessModel } from "@/shared/components/diagrams/ProcessDiagram";
import { CONTENT } from "@/shared/content";

import { renderWithProviders } from "./test-utils";

// setup.ts stubs matchMedia with prefers-reduced-motion: reduce by default, so
// these are the deterministic reduced-motion assertions for the section.
//
// The diagram is a three-phase ascending growth model (Discover & Research -> Build -> Operate).
// Under reduced motion, all phases and their copy must be visible statically without motion dependency.

test("reduced motion: every named phase renders with its copy", () => {
  renderWithProviders(<ProcessDiagram model={CONTENT.process} />);

  for (const phase of CONTENT.process.phases) {
    expect(screen.getByRole("heading", { level: 3, name: phase.name })).toBeInTheDocument();
    expect(screen.getByText(phase.caption)).toBeInTheDocument();
  }
});

test("the composition renders all three growth phases", () => {
  renderWithProviders(<ProcessDiagram model={CONTENT.process} />);

  const headings = screen.getAllByRole("heading", { level: 3 });
  expect(headings).toHaveLength(CONTENT.process.phases.length);
  // Three-phase growth model (CONTENT.process.phases) — timeline-named, not the
  // old generic Discover/Build/Operate labels.
  expect(headings[0]?.textContent).toBe("2019: The Foundation");
  expect(headings[1]?.textContent).toBe("2020-2025: The Expansion");
  expect(headings[2]?.textContent).toBe("2026: The Powerhouse");
});

test("the growth story is one illustration, not one figure per phase", () => {
  renderWithProviders(<ProcessDiagram model={CONTENT.process} />);

  const imgs = screen.getAllByRole("img");
  expect(imgs).toHaveLength(1);
  expect(
    screen.getByRole("img", {
      name: /four departments .* growing from a small 2019 cluster .* 2026/i,
    }),
  ).toBeInTheDocument();
});

test("renders custom process model phases correctly", () => {
  const customModel: ProcessModel = {
    phases: [
      { id: "p1", name: "Prototype", caption: "Initial validation" },
      { id: "p2", name: "Scale", caption: "Production rollout" },
    ],
  };
  renderWithProviders(<ProcessDiagram model={customModel} />);

  expect(screen.getByRole("heading", { level: 3, name: "Prototype" })).toBeInTheDocument();
  expect(screen.getByText("Initial validation")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 3, name: "Scale" })).toBeInTheDocument();
  expect(screen.getByText("Production rollout")).toBeInTheDocument();
});

test("an empty phases model renders without crashing", () => {
  const emptyModel: ProcessModel = { phases: [] };
  const { container } = renderWithProviders(<ProcessDiagram model={emptyModel} />);

  expect(container.querySelectorAll("h3")).toHaveLength(0);
});
