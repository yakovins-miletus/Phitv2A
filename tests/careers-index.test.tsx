import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, beforeEach } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { makeTestQueryClient, renderWithProviders } from "./test-utils";
import { CAREER_POSITIONS } from "@/shared/careersData";

function renderCareersRoute() {
  const queryClient = makeTestQueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: ["/careers"] }),
  });

  return renderWithProviders(<RouterProvider router={router} />, queryClient);
}

describe("CareersIndexPage — Archival Engineering Register", () => {
  beforeEach(() => {
    // Reset any state if needed
  });

  test("renders archival register header and classification in MONO", async () => {
    renderCareersRoute();

    expect(await screen.findByText(/REGISTER · PHITOPOLIS R&D MANILA/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Active Engineering Positions & Graduate Fellowships/i,
        level: 1,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open engineering roles, quantitative research fellowships, and paid R&D internships/i)
    ).toBeInTheDocument();
  });

  test("renders all position files initially with offset tab ears and closed state", async () => {
    renderCareersRoute();

    expect(await screen.findByText(/REGISTER · PHITOPOLIS R&D MANILA/i)).toBeInTheDocument();

    for (const pos of CAREER_POSITIONS) {
      expect(screen.getByRole("heading", { name: pos.title, level: 2 })).toBeInTheDocument();
    }
  });

  test("filters positions by category chips", async () => {
    const user = userEvent.setup();
    renderCareersRoute();

    expect(await screen.findByText(/REGISTER · PHITOPOLIS R&D MANILA/i)).toBeInTheDocument();

    // Click Graduate Program filter
    const gradChip = screen.getByText(/GRADUATE PROGRAM \[1\]/i);
    await user.click(gradChip);

    expect(screen.getByText("Technical Graduate Program")).toBeInTheDocument();
    expect(screen.queryByText("Quantitative Researcher")).not.toBeInTheDocument();
    expect(screen.queryByText("DevOps & Cloud SRE Engineer")).not.toBeInTheDocument();

    // Click All filter
    const allChip = screen.getByText(/ALL \[7\]/i);
    await user.click(allChip);

    expect(screen.getByText("Technical Graduate Program")).toBeInTheDocument();
    expect(screen.getByText("Quantitative Researcher")).toBeInTheDocument();
  });

  test("filters positions by keyword search query", async () => {
    const user = userEvent.setup();
    renderCareersRoute();

    expect(await screen.findByText(/REGISTER · PHITOPOLIS R&D MANILA/i)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search by role, stack/i);
    await user.type(searchInput, "Kubernetes");

    expect(screen.getByText("DevOps & Cloud SRE Engineer")).toBeInTheDocument();
    expect(screen.queryByText("Technical Graduate Program")).not.toBeInTheDocument();
  });

  test("renders archival 0 MATCHES empty state when search returns no hits", async () => {
    const user = userEvent.setup();
    renderCareersRoute();

    expect(await screen.findByText(/REGISTER · PHITOPOLIS R&D MANILA/i)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search by role, stack/i);
    await user.type(searchInput, "nonexistent-quantum-stack-xyz");

    expect(screen.getByText(/ARCHIVE STATUS \/\/ 0 MATCHES/i)).toBeInTheDocument();
    expect(screen.getByText(/No positions match your search query/i)).toBeInTheDocument();

    // Reset button clears search
    const resetBtn = screen.getByRole("button", { name: /RESET REGISTERS/i });
    await user.click(resetBtn);

    expect(screen.getByText("Technical Graduate Program")).toBeInTheDocument();
  });

  test("expands folder tab in place to reveal mono meta-rail, summary, stack, and single Open full role CTA", async () => {
    renderCareersRoute();

    expect(await screen.findByText(/REGISTER · PHITOPOLIS R&D MANILA/i)).toBeInTheDocument();

    const targetPos = CAREER_POSITIONS[0]!;
    const folderTrigger = screen.getByRole("button", { name: new RegExp(targetPos.title, "i") });

    expect(folderTrigger).toHaveAttribute("aria-expanded", "false");

    // Click to expand
    await userEvent.setup().click(folderTrigger);

    expect(folderTrigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(targetPos.department.toUpperCase())).toBeInTheDocument();
    expect(screen.getByText(/ROLE SPECIFICATION SUMMARY/i)).toBeInTheDocument();
    expect(screen.getByText(targetPos.summary)).toBeInTheDocument();

    // Single Open full role CTA link
    const ctaButton = screen.getByRole("link", { name: /OPEN FULL ROLE/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute("href", "/careers/technical-graduate-program");

    // Click again to collapse
    await userEvent.setup().click(folderTrigger);
    expect(folderTrigger).toHaveAttribute("aria-expanded", "false");
  });

  test("keyboard navigation toggles folder expansion with Enter and Space", async () => {
    renderCareersRoute();

    expect(await screen.findByText(/REGISTER · PHITOPOLIS R&D MANILA/i)).toBeInTheDocument();

    const targetPos = CAREER_POSITIONS[0]!;
    const folderTrigger = screen.getByRole("button", { name: new RegExp(targetPos.title, "i") });

    // Enter key expands
    fireEvent.keyDown(folderTrigger, { key: "Enter", code: "Enter" });
    expect(folderTrigger).toHaveAttribute("aria-expanded", "true");

    // Space key collapses
    fireEvent.keyDown(folderTrigger, { key: " ", code: "Space" });
    expect(folderTrigger).toHaveAttribute("aria-expanded", "false");
  });

  test("quiet brochure trigger opens brochure drawer", async () => {
    const user = userEvent.setup();
    renderCareersRoute();

    expect(await screen.findByText(/REGISTER · PHITOPOLIS R&D MANILA/i)).toBeInTheDocument();

    const brochureBtn = screen.getByRole("button", { name: /PROGRAM BROCHURE \(PDF\)/i });
    await user.click(brochureBtn);

    // BrochureDrawer displays heading
    expect(screen.getByText(/2026 Technical Graduate Program Brochure/i)).toBeInTheDocument();
  });
});
