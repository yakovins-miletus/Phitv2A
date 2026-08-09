import { screen } from "@testing-library/react";

import { ProcessDiagram } from "@/shared/components/diagrams/ProcessDiagram";
import { CONTENT } from "@/shared/content";

import { renderWithProviders } from "./test-utils";

// setup.ts stubs matchMedia with prefers-reduced-motion: reduce by default, so
// these are the deterministic reduced-motion assertions for the pipeline.
//
// The regression they guard is the one home-reduced-motion.test.tsx documents
// for the pitch deck: content that only exists once a scroll animation has run.
// Every phase of this diagram is real copy, and the payload's travel is the
// only thing scroll drives — so with motion off, the whole pipeline must read
// as already run: all six phases present, in order, all shipped.

test("reduced motion: every phase renders, in scroll order, already shipped", () => {
  renderWithProviders(<ProcessDiagram steps={CONTENT.process} />);

  const headings = screen.getAllByRole("heading", { level: 3 });
  expect(headings.map((h) => h.textContent)).toEqual(CONTENT.process.map((s) => s.label));

  for (const step of CONTENT.process) {
    expect(screen.getByText(`Phase ${step.number}`)).toBeInTheDocument();
    expect(screen.getByText(step.caption)).toBeInTheDocument();
  }

  const statuses = screen.getAllByText(/^(QUEUED|RUNNING|SHIPPED)$/);
  expect(statuses).toHaveLength(CONTENT.process.length);
  expect(statuses.every((el) => el.textContent === "SHIPPED")).toBe(true);
});

test("reduced motion: the last phase ships with Phitopolis branding", () => {
  renderWithProviders(<ProcessDiagram steps={CONTENT.process} />);

  const last = CONTENT.process.at(-1);
  expect(last).toBeDefined();
  expect(screen.getByText("Phitopolis")).toBeInTheDocument();
  expect(screen.getByText(`BUILD ${last?.number} · SHIPPED`)).toBeInTheDocument();
});

test("an ordered process is an ordered list", () => {
  const { container } = renderWithProviders(<ProcessDiagram steps={CONTENT.process} />);

  const list = container.querySelector("ol");
  expect(list).not.toBeNull();
  expect(list?.querySelectorAll(":scope > li")).toHaveLength(CONTENT.process.length);
});

test("a single-step pipeline still ships instead of dividing by zero", () => {
  const solo = [{ number: "00", label: "Only", caption: "One phase." }];
  renderWithProviders(<ProcessDiagram steps={solo} />);

  expect(screen.getByRole("heading", { level: 3, name: "Only" })).toBeInTheDocument();
  expect(screen.getByText("BUILD 00 · SHIPPED")).toBeInTheDocument();
});
