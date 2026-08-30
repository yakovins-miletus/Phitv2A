import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { screen } from "@testing-library/react";

import { routeTree } from "@/routeTree.gen";
import { CONTENT } from "@/shared/content";

import { makeTestQueryClient, renderWithProviders } from "./test-utils";

test("home route loads via the router: hero, services, new visual sections", async () => {
  const queryClient = makeTestQueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  renderWithProviders(<RouterProvider router={router} />, queryClient);

  expect(
    await screen.findByRole("heading", { level: 1, name: "Phitopolis" }),
  ).toBeInTheDocument();
  // The pitch is three sections now, not one four-beat deck. One assertion per
  // section, so a section silently failing to render is a test failure rather
  // than something only a screenshot would catch.
  //
  // (This used to assert `getByText("R&D firm")`, which passed only because the
  // deck split its exec summary on that literal to colour it gold — an assertion
  // on a styling implementation detail, not on the copy being present.)
  // "global markets" is wrapped in a gold <span>, so the sentence is split
  // across text nodes — match a contiguous tail fragment.
  expect(
    screen.getByText(/as the ultimate intellectual puzzle/i),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /THE QUANTITATIVE R&D PARTNER FOR GLOBAL MARKETS/i }),
  ).toBeInTheDocument();
  // Targets the OperatingPillars section eyebrow ("02 / OPERATING PILLARS"), not a heading role.
  expect(screen.getByText(/operating pillars/i)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Research Pillar" })).toBeInTheDocument();

  // Beat 4 was cut: no leadership bio and no in-hero CTA.
  expect(screen.queryByText(/Founded by Filipina corporate leader/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/INITIATE TECHNICAL PARTNERSHIP/i)).not.toBeInTheDocument();
  // WS-02: `MarketPosition` is deleted outright — it restated MissionStatement's
  // job, and its differentiator headings ("Technical Talent", "Wall St. &
  // Banking Leadership", "International Backing") no longer render anywhere
  // on Home.
  expect(screen.queryByRole("heading", { name: "Wall St. & Banking Leadership" })).not.toBeInTheDocument();

  // PRD-home-client-focus §2b: CapabilityRack (the "four disciplines" grid
  // duplicated from /services) no longer mounts on home — was previously
  // asserted present via `CONTENT.services[0].title` here; now asserted
  // absent instead, since that duplication is exactly what US-1 AC-3 forbids.
  expect(screen.queryByText(CONTENT.services[0]!.title)).not.toBeInTheDocument();
  // ReachSection's heading became a SectionLede bound to CONTENT.ledes.reach.
  //
  // Asserted against the lede's current copy rather than a literal typed in here.
  // This test was already red before the glass revamp: it pinned the string "Two
  // offices. Two client regions. One clock that never stops.", which content.ts
  // stopped carrying. Reading the value from CONTENT keeps the real assertion — that
  // ReachSection renders its bound lede — without re-freezing prose that the copy
  // deck owns.
  expect(screen.getByText(CONTENT.ledes.reach.gunshot)).toBeInTheDocument();
  // PRD-home-client-focus §2c/US-1 AC-1: the talent/culture narrative
  // (daily-life, careers, testimonials, blog) relocated to /about — was
  // previously asserted present here via the careers panel heading; now
  // asserted absent from home, since home must present no hiring content.
  expect(
    screen.queryByRole("heading", { name: /For talents that outgrow large institutions/i }),
  ).not.toBeInTheDocument();
  // US-1 AC-4: a contact CTA in the opening view — the hero's
  // "Start a conversation" CTA (see content.ts `cta`).
  // The CTA now renders in more than one place (hero + closing); assert at least one exists.
  expect(screen.getAllByRole("link", { name: /start a conversation/i }).length).toBeGreaterThan(0);
});
