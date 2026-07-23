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
  expect(
    screen.getByText("Making tomorrow's technology available today."),
  ).toBeInTheDocument();
  expect(screen.getByText("Full-Stack Development")).toBeInTheDocument();
  expect(screen.getByText("From problem to production")).toBeInTheDocument();
  expect(screen.getByText("International presence")).toBeInTheDocument();
  expect(screen.getByText("Join our Technical Graduate Program")).toBeInTheDocument();
});
