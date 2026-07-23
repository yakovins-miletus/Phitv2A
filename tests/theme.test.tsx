import { screen } from "@testing-library/react";

import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";

import { renderWithProviders } from "./test-utils";

test("PageHeader renders the quant-noir display heading", () => {
  renderWithProviders(
    <PageHeader overline="Research" title="Notes from the lab floor." lead="A lead." />,
  );

  const heading = screen.getByRole("heading", { level: 1, name: "Notes from the lab floor." });
  expect(heading).toBeInTheDocument();
  expect(window.getComputedStyle(heading).fontFamily).toContain("Space Grotesk");
});

test("MetricCard formats units and deltas", () => {
  renderWithProviders(
    <MetricCard
      label="Median deployed-model accuracy"
      value={94.2}
      unit="percent"
      deltaPct={1.7}
      caption="vs. Q1 2026"
    />,
  );

  expect(screen.getByText("94.2%")).toBeInTheDocument();
  expect(screen.getByText("+1.7%")).toBeInTheDocument();
  expect(screen.getByText("vs. Q1 2026")).toBeInTheDocument();
});
