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
  expect(
    screen.getByText(/we view global markets as the ultimate intellectual puzzle/i),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /THE QUANTITATIVE R&D PARTNER FOR GLOBAL MARKETS/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /three integrated operating pillars/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Research Pillar" })).toBeInTheDocument();
  // Was "Elite Technical Talent". "Elite" was stripped in the 2026-08-09 copy pass:
  // it is undisclaimable filler, and the sentence beneath it carries the real claim.
  expect(screen.getByRole("heading", { name: "Technical Talent" })).toBeInTheDocument();

  // Beat 4 was cut: no leadership bio and no in-hero CTA.
  expect(screen.queryByText(/Founded by Filipina corporate leader/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/INITIATE TECHNICAL PARTNERSHIP/i)).not.toBeInTheDocument();
  // The Wall St. pedigree survives, reframed as a market advantage.
  expect(
    screen.getByRole("heading", { name: "Wall St. & Banking Leadership" }),
  ).toBeInTheDocument();

  expect(screen.getByText("Full-Stack Development")).toBeInTheDocument();
  expect(screen.getByText("From problem to production")).toBeInTheDocument();
  // ReachSection's heading became a SectionLede bound to CONTENT.ledes.reach.
  //
  // Asserted against the lede's current copy rather than a literal typed in here.
  // This test was already red before the glass revamp: it pinned the string "Two
  // offices. Two client regions. One clock that never stops.", which content.ts
  // stopped carrying. Reading the value from CONTENT keeps the real assertion — that
  // ReachSection renders its bound lede — without re-freezing prose that the copy
  // deck owns.
  expect(screen.getByText(CONTENT.ledes.reach.gunshot)).toBeInTheDocument();
  // Careers panel 1 heading, now bound to CONTENT.targetCandidates.
  expect(
    screen.getByText("For talents that outgrow large institutions"),
  ).toBeInTheDocument();
});
