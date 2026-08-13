import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { screen } from "@testing-library/react";
import { routeTree } from "@/routeTree.gen";
import { makeTestQueryClient, renderWithProviders } from "./test-utils";

test("home route loads footer with pathways, talent programs, enterprise contact, the brand-mark particle field, and next chapter section", async () => {
  const queryClient = makeTestQueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  renderWithProviders(<RouterProvider router={router} />, queryClient);

  expect(await screen.findByText("PATHWAYS")).toBeInTheDocument();
  expect(screen.getByText("Careers")).toBeInTheDocument();
  expect(screen.getByText("CONTACT")).toBeInTheDocument();

  // The footer's left column was a "signal or noise" minigame — four sparkline
  // cards with rounds, scoring and a streak counter, a second interactive system
  // competing with the navigation beside it. It is now the brand mark rendered as
  // a cursor-reactive particle field.
  expect(screen.queryByText("SIGNAL OR NOISE?")).not.toBeInTheDocument();
  expect(screen.queryByText(/CLASSIFY ANOMALY/i)).not.toBeInTheDocument();

  // Decorative, so it must stay out of the accessibility tree — the mark is
  // already announced by the wordmark and the nav.
  const footer = document.querySelector("footer");
  const field = footer?.querySelector("canvas");
  expect(field).not.toBeNull();
  expect(field?.closest("[aria-hidden]")).not.toBeNull();
  expect(screen.getAllByText("ABOUT PHITOPOLIS").length).toBeGreaterThan(0);
  expect(screen.queryByText("ENTERPRISE ENCRYPTED")).not.toBeInTheDocument();
});
