import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { CAREER_POSITIONS } from "@/shared/careersData";
import { makeTestQueryClient, renderWithProviders } from "./test-utils";

function renderCareersDetailRoute(jobId: string, queryClient = makeTestQueryClient()) {
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [`/careers/${jobId}`] }),
  });
  return renderWithProviders(<RouterProvider router={router} />, queryClient);
}

describe("Careers Detail Route (/careers/$jobId)", () => {
  it("renders role title, technical mono meta-rail, and 3 distinct section lists", async () => {
    const jobId = "software-engineer";
    const job = CAREER_POSITIONS.find((p) => p.id === jobId)!;

    renderCareersDetailRoute(jobId);

    // D4: Eye's first stop - Role title H1
    const heading = await screen.findByRole("heading", { level: 1, name: job.title });
    expect(heading).toBeInTheDocument();

    // Meta-rail facts
    expect(screen.getByText(job.badge)).toBeInTheDocument();
    expect(screen.getByText(job.location)).toBeInTheDocument();
    expect(screen.getByText(job.department)).toBeInTheDocument();
    expect(screen.getByText(job.type.toUpperCase())).toBeInTheDocument();

    // Left column: 3 separately-headed lists & prose
    expect(screen.getByRole("heading", { name: "Role Overview" })).toBeInTheDocument();
    expect(screen.getByText(job.description)).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Key Responsibilities" })).toBeInTheDocument();
    for (const resp of job.responsibilities) {
      expect(screen.getByText(resp)).toBeInTheDocument();
    }

    expect(screen.getByRole("heading", { name: "Candidate Requirements & Qualifications" })).toBeInTheDocument();
    for (const req of job.requirements) {
      expect(screen.getByText(req)).toBeInTheDocument();
    }

    expect(screen.getByRole("heading", { name: "Benefits & Compensation" })).toBeInTheDocument();
    for (const benefit of job.benefits) {
      expect(screen.getByText(benefit)).toBeInTheDocument();
    }

    // Technology stack pills
    expect(screen.getByText("TECHNOLOGY STACK & TOOLS")).toBeInTheDocument();
    for (const tech of job.stack) {
      expect(screen.getByText(tech)).toBeInTheDocument();
    }
  });

  it("validates form fields and displays alert on invalid submission", async () => {
    const user = userEvent.setup();
    renderCareersDetailRoute("software-engineer");

    const submitBtn = await screen.findByRole("button", { name: /submit application/i });
    expect(submitBtn).toBeInTheDocument();

    await user.click(submitBtn);

    // Client-side validation triggers Alert summary
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/must be at least 2 characters/i);
    expect(alert).toHaveTextContent(/enter a valid email address/i);
  });

  it("successfully submits application and displays confirmation panel", async () => {
    const user = userEvent.setup();
    renderCareersDetailRoute("software-engineer");

    const nameInput = await screen.findByLabelText(/^full name/i);
    fireEvent.change(nameInput, { target: { value: "Linus Torvalds" } });
    fireEvent.change(screen.getByLabelText(/^email address/i), { target: { value: "linus@kernel.org" } });
    fireEvent.change(screen.getByLabelText(/^university \/ current company/i), {
      target: { value: "University of Helsinki" },
    });
    fireEvent.change(screen.getByLabelText(/^cover note \/ relevant projects/i), {
      target: { value: "Extensive experience with C++, Git, and Linux kernel architectures." },
    });

    const submitBtn = screen.getByRole("button", { name: /submit application/i });
    await user.click(submitBtn);

    expect(await screen.findByText("Application Received!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit another application/i })).toBeInTheDocument();
  });

  it("renders dark glass not-found state when jobId is invalid", async () => {
    renderCareersDetailRoute("non-existent-position-slug");

    expect(await screen.findByText("ERROR 404 · POSITION NOT FOUND")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Position Not Found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return to careers register/i })).toBeInTheDocument();
  });
});
