import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { screen } from "@testing-library/react";

import { routeTree } from "@/routeTree.gen";

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
  // The hero's own copy. CONTENT.hero.tagline is no longer rendered anywhere —
  // the mission lede (CONTENT.ledes.mission) replaced it in HeroDescriptionSection.
  expect(
    screen.getByText("We took two milliseconds down to eighteen microseconds."),
  ).toBeInTheDocument();
  expect(screen.getByText("Full-Stack Development")).toBeInTheDocument();
  expect(screen.getByText("From problem to production")).toBeInTheDocument();
  // ReachSection's heading became a SectionLede bound to CONTENT.ledes.reach.
  expect(
    screen.getByText("Two offices. Two client regions. One clock that never stops."),
  ).toBeInTheDocument();
  // Careers panel 1 heading, now bound to CONTENT.targetCandidates.
  expect(
    screen.getByText("For talents that outgrow large institutions"),
  ).toBeInTheDocument();
});
