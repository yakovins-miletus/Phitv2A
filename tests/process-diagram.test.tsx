import { screen } from "@testing-library/react";

import { ProcessDiagram } from "@/shared/components/diagrams/ProcessDiagram";
import { CONTENT } from "@/shared/content";

import { renderWithProviders } from "./test-utils";

// setup.ts stubs matchMedia with prefers-reduced-motion: reduce by default, so
// these are the deterministic reduced-motion assertions for the section.
//
// ADR-0002 makes the *static* frame the deliverable: the diagram no longer
// communicates through time, so with motion disabled every piece of meaning
// must already be on screen — the named problems, the enclosed operations and
// the single output. The regression guarded here is the one
// home-reduced-motion.test.tsx documents for the pitch deck: content that only
// exists once a scroll animation has run.

test("reduced motion: every named role renders with its copy", () => {
  renderWithProviders(<ProcessDiagram model={CONTENT.process} />);

  for (const entry of [...CONTENT.process.intake, ...CONTENT.process.enclosed, CONTENT.process.output]) {
    expect(screen.getByRole("heading", { level: 3, name: entry.label })).toBeInTheDocument();
    expect(screen.getByText(entry.caption)).toBeInTheDocument();
  }
});

test("the composition reads many-in, enclosed, one-out", () => {
  renderWithProviders(<ProcessDiagram model={CONTENT.process} />);

  // Many: the unnamed problems are decorative marks, so the count is also
  // stated in text — the only part of "many" a screen reader can reach.
  expect(screen.getByText(`${CONTENT.process.rawCount}+ problems in the field`)).toBeInTheDocument();

  // Enclosed: the boundary is named, not merely drawn.
  expect(screen.getByText("Inside Phitopolis")).toBeInTheDocument();

  // One out: exactly one output, and it is not one of the enclosed operations.
  const headings = screen.getAllByRole("heading", { level: 3 });
  expect(headings).toHaveLength(
    CONTENT.process.intake.length + CONTENT.process.enclosed.length + 1,
  );
  expect(headings.at(-1)?.textContent).toBe(CONTENT.process.output.label);
});

test("the decorative scatter never outruns rawCount", () => {
  // Guards the ADR's 375px legibility rule: the mark table is hand-placed and
  // longer than any sane rawCount, so the slice is what keeps the field from
  // becoming noise if the table is extended later.
  const { container } = renderWithProviders(<ProcessDiagram model={CONTENT.process} />);

  const marks = container.querySelectorAll("svg circle");
  expect(marks.length).toBeLessThanOrEqual(CONTENT.process.rawCount);
});

test("an empty field still renders the enclosure and the output", () => {
  const bare = { ...CONTENT.process, intake: [], rawCount: 0 };
  const { container } = renderWithProviders(<ProcessDiagram model={bare} />);

  expect(container.querySelectorAll("svg circle")).toHaveLength(0);
  expect(screen.getByRole("heading", { level: 3, name: CONTENT.process.output.label })).toBeInTheDocument();
});
