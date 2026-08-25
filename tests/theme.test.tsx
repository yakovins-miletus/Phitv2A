import { screen } from "@testing-library/react";

import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { NOIR } from "@/shared/theme/palette";
import { theme } from "@/shared/theme/theme";

import { renderWithProviders } from "./test-utils";

test("the theme is the light quant-noir palette", () => {
  expect(theme.palette.mode).toBe("light");
  expect(theme.palette.background.default).toBe(NOIR.void);
  expect(theme.palette.text.primary).toBe(NOIR.ink);
  expect(theme.palette.secondary.contrastText).toBe(NOIR.navyInk);
  expect(theme.shape.borderRadius).toBe(4);
});

test("MuiCard is flat by default — no automatic glass variant", () => {
  const cardDefaults = theme.components?.MuiCard?.defaultProps as
    | { elevation?: number; variant?: string }
    | undefined;
  expect(cardDefaults?.variant).toBeUndefined();
  expect(cardDefaults?.elevation).toBe(0);
});

test("PageHeader renders the quant-noir display heading", () => {
  renderWithProviders(
    <PageHeader overline="Research" title="Notes from the lab floor." lead="A lead." />,
  );

  const heading = screen.getByRole("heading", { level: 1, name: "Notes from the lab floor." });
  expect(heading).toBeInTheDocument();
  expect(window.getComputedStyle(heading).fontFamily).toContain("Outfit");
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
