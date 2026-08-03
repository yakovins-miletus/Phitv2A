import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { screen } from "@testing-library/react";
import { routeTree } from "@/routeTree.gen";
import { makeTestQueryClient, renderWithProviders } from "./test-utils";

test("home route loads footer with pathways, talent programs, enterprise contact, signal or noise minigame, and next chapter section", async () => {
  const queryClient = makeTestQueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  renderWithProviders(<RouterProvider router={router} />, queryClient);

  expect(await screen.findByText("PATHWAYS")).toBeInTheDocument();
  expect(screen.getByText("TALENT PROGRAMS")).toBeInTheDocument();
  expect(screen.getByText("ENTERPRISE CONTACT")).toBeInTheDocument();
  expect(screen.getByText("SIGNAL OR NOISE?")).toBeInTheDocument();
  expect(screen.getByText(/NEXT CHAPTER/i)).toBeInTheDocument();
  expect(screen.getAllByText("ABOUT PHITOPOLIS").length).toBeGreaterThan(0);
  expect(screen.queryByText("ENTERPRISE ENCRYPTED")).not.toBeInTheDocument();
});
