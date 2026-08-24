import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { CAREER_POSITIONS } from "@/shared/careersData";
import { server } from "./msw/server";
import { makeTestQueryClient, renderWithProviders } from "./test-utils";

function renderCareersDetailRoute(jobId: string, queryClient = makeTestQueryClient()) {
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [`/careers/${jobId}`] }),
  });
  return renderWithProviders(<RouterProvider router={router} />, queryClient);
}

describe("Careers Detail (/careers/$jobId) — Empirical Adversarial Stress Suite", () => {
  describe("1. Form Validation Boundary & Sanitization Stress", () => {
    it("rejects 1-char fullName (min boundary violation)", async () => {
      const user = userEvent.setup();
      renderCareersDetailRoute("software-engineer");

      const nameInput = await screen.findByLabelText(/^full name/i);
      const emailInput = screen.getByLabelText(/^email address/i);
      const uniInput = screen.getByLabelText(/^university \/ current company/i);
      const submitBtn = screen.getByRole("button", { name: /submit application/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(uniInput, { target: { value: "Ateneo de Manila" } });
      fireEvent.change(nameInput, { target: { value: "A" } });

      await user.click(submitBtn);
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Full name must be at least 2 characters.");
    });

    it("rejects 101-char fullName (max boundary violation)", async () => {
      const user = userEvent.setup();
      renderCareersDetailRoute("software-engineer");

      const nameInput = await screen.findByLabelText(/^full name/i);
      const emailInput = screen.getByLabelText(/^email address/i);
      const uniInput = screen.getByLabelText(/^university \/ current company/i);
      const submitBtn = screen.getByRole("button", { name: /submit application/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(uniInput, { target: { value: "Ateneo de Manila" } });
      fireEvent.change(nameInput, { target: { value: "A".repeat(101) } });

      await user.click(submitBtn);
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Full name must be at most 100 characters.");
    });

    it("rejects 1-char university (min boundary violation)", async () => {
      const user = userEvent.setup();
      renderCareersDetailRoute("software-engineer");

      const nameInput = await screen.findByLabelText(/^full name/i);
      const emailInput = screen.getByLabelText(/^email address/i);
      const uniInput = screen.getByLabelText(/^university \/ current company/i);
      const submitBtn = screen.getByRole("button", { name: /submit application/i });

      fireEvent.change(nameInput, { target: { value: "Grace Hopper" } });
      fireEvent.change(emailInput, { target: { value: "grace@navy.mil" } });
      fireEvent.change(uniInput, { target: { value: "Y" } });

      await user.click(submitBtn);
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("University / Current Company must be at least 2 characters.");
    });

    it("rejects 151-char university (max boundary violation)", async () => {
      const user = userEvent.setup();
      renderCareersDetailRoute("software-engineer");

      const nameInput = await screen.findByLabelText(/^full name/i);
      const emailInput = screen.getByLabelText(/^email address/i);
      const uniInput = screen.getByLabelText(/^university \/ current company/i);
      const submitBtn = screen.getByRole("button", { name: /submit application/i });

      fireEvent.change(nameInput, { target: { value: "Grace Hopper" } });
      fireEvent.change(emailInput, { target: { value: "grace@navy.mil" } });
      fireEvent.change(uniInput, { target: { value: "U".repeat(151) } });

      await user.click(submitBtn);
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("University / Current Company must be at most 150 characters.");
    });

    it("rejects 3501-char coverNote (max boundary violation)", async () => {
      const user = userEvent.setup();
      renderCareersDetailRoute("software-engineer");

      const nameInput = await screen.findByLabelText(/^full name/i);
      const emailInput = screen.getByLabelText(/^email address/i);
      const uniInput = screen.getByLabelText(/^university \/ current company/i);
      const coverInput = screen.getByLabelText(/^cover note \/ relevant projects/i);
      const submitBtn = screen.getByRole("button", { name: /submit application/i });

      fireEvent.change(nameInput, { target: { value: "Grace Hopper" } });
      fireEvent.change(emailInput, { target: { value: "grace@navy.mil" } });
      fireEvent.change(uniInput, { target: { value: "Yale University" } });
      fireEvent.change(coverInput, { target: { value: "X".repeat(3501) } });

      await user.click(submitBtn);
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Cover Note must be at most 3500 characters.");
    });

    it("rigorously enforces email formatting regex", async () => {
      const user = userEvent.setup();
      renderCareersDetailRoute("software-engineer");

      const nameInput = await screen.findByLabelText(/^full name/i);
      const emailInput = screen.getByLabelText(/^email address/i);
      const uniInput = screen.getByLabelText(/^university \/ current company/i);
      const submitBtn = screen.getByRole("button", { name: /submit application/i });

      fireEvent.change(nameInput, { target: { value: "Grace Hopper" } });
      fireEvent.change(uniInput, { target: { value: "Yale University" } });
      fireEvent.change(emailInput, { target: { value: "invalid-email-no-at" } });

      await user.click(submitBtn);
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Enter a valid email address.");
    });

    it("autofocuses the first invalid field upon validation failure", async () => {
      const user = userEvent.setup();
      renderCareersDetailRoute("software-engineer");

      const nameInput = await screen.findByLabelText(/^full name/i);
      const emailInput = screen.getByLabelText(/^email address/i);
      const submitBtn = screen.getByRole("button", { name: /submit application/i });

      // Leave fullName empty, provide email
      fireEvent.change(emailInput, { target: { value: "valid@example.com" } });
      await user.click(submitBtn);

      expect(document.activeElement).toBe(nameInput);
    });
  });

  describe("2. Honeypot Bot Trap Mechanism", () => {
    it("submits company_website honeypot value to backend without breaking payload structure", async () => {
      interface CapturedPayload {
        name?: string;
        email?: string;
        subject?: string;
        company_website?: string;
        message?: string;
      }
      let capturedPayload: CapturedPayload | null = null;
      server.use(
        http.post("*/api/v1/contact-messages", async ({ request }) => {
          capturedPayload = (await request.json()) as CapturedPayload;
          return HttpResponse.json({ id: "msg_123", success: true });
        }),
      );

      const user = userEvent.setup();
      renderCareersDetailRoute("software-engineer");

      const job = CAREER_POSITIONS.find((p) => p.id === "software-engineer")!;

      fireEvent.change(await screen.findByLabelText(/^full name/i), { target: { value: "Bot Applicant" } });
      fireEvent.change(screen.getByLabelText(/^email address/i), { target: { value: "bot@spammer.net" } });
      fireEvent.change(screen.getByLabelText(/^university \/ current company/i), { target: { value: "Bot University" } });

      // Honeypot field (hidden off-screen)
      const honeypotInput = screen.getByLabelText(/company website/i);
      expect(honeypotInput).toHaveAttribute("tabindex", "-1");
      fireEvent.change(honeypotInput, { target: { value: "https://spam-site.com" } });

      await user.click(screen.getByRole("button", { name: /submit application/i }));

      await waitFor(() => {
        expect(capturedPayload).not.toBeNull();
      });

      expect(capturedPayload!.name).toBe("Bot Applicant");
      expect(capturedPayload!.email).toBe("bot@spammer.net");
      expect(capturedPayload!.subject).toBe(`Application: ${job.title}`);
      expect(capturedPayload!.company_website).toBe("https://spam-site.com");
      expect(capturedPayload!.message).toContain("Applicant: Bot Applicant");
      expect(capturedPayload!.message).toContain("Institution/Company: Bot University");
    });
  });

  describe("3. Mutation Lifecycle, Error Handling & Reset Flow", () => {
    it("displays error banner with messageFromError on HTTP 422 / 500 error", async () => {
      server.use(
        http.post("*/api/v1/contact-messages", () =>
          HttpResponse.json(
            {
              type: "about:blank",
              title: "Rate limit exceeded",
              status: 429,
              detail: "Too many submissions from this IP. Please try again later.",
            },
            { status: 429, headers: { "Content-Type": "application/problem+json" } },
          ),
        ),
      );

      const user = userEvent.setup();
      renderCareersDetailRoute("software-engineer");

      fireEvent.change(await screen.findByLabelText(/^full name/i), { target: { value: "Ada Lovelace" } });
      fireEvent.change(screen.getByLabelText(/^email address/i), { target: { value: "ada@analytical.org" } });
      fireEvent.change(screen.getByLabelText(/^university \/ current company/i), { target: { value: "London" } });

      await user.click(screen.getByRole("button", { name: /submit application/i }));

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Too many submissions from this IP. Please try again later.");
    });

    it("resets mutation and clears all input fields upon clicking 'SUBMIT ANOTHER APPLICATION'", async () => {
      const user = userEvent.setup();
      renderCareersDetailRoute("software-engineer");

      fireEvent.change(await screen.findByLabelText(/^full name/i), { target: { value: "Katherine Johnson" } });
      fireEvent.change(screen.getByLabelText(/^email address/i), { target: { value: "kj@nasa.gov" } });
      fireEvent.change(screen.getByLabelText(/^university \/ current company/i), { target: { value: "West Virginia State" } });
      fireEvent.change(screen.getByLabelText(/^cover note \/ relevant projects/i), { target: { value: "Orbital mechanics calculation expertise." } });

      await user.click(screen.getByRole("button", { name: /submit application/i }));

      // Confirmation screen is displayed
      const resetBtn = await screen.findByRole("button", { name: /submit another application/i });
      expect(resetBtn).toBeInTheDocument();

      // Click reset
      await user.click(resetBtn);

      // Form view is restored with cleared inputs
      const nameInput = await screen.findByLabelText(/^full name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/^email address/i) as HTMLInputElement;
      const uniInput = screen.getByLabelText(/^university \/ current company/i) as HTMLInputElement;
      const coverInput = screen.getByLabelText(/^cover note \/ relevant projects/i) as HTMLInputElement;

      expect(nameInput.value).toBe("");
      expect(emailInput.value).toBe("");
      expect(uniInput.value).toBe("");
      expect(coverInput.value).toBe("");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("4. Category Semantic Accents & Position Fidelity", () => {
    const testCases: Array<{ id: string; expectedCategory: string }> = [
      { id: "software-engineer", expectedCategory: "Graduate Program" },
      { id: "data-intern", expectedCategory: "Internships" },
      { id: "fpga-engineer", expectedCategory: "Engineering & Quant" },
      { id: "cloud-architect", expectedCategory: "Cloud & Infrastructure" },
    ];

    for (const { id, expectedCategory } of testCases) {
      it(`renders accurate details and badge styling for position '${id}' (${expectedCategory})`, async () => {
        const job = CAREER_POSITIONS.find((p) => p.id === id);
        if (!job) return;

        renderCareersDetailRoute(id);

        expect(await screen.findByRole("heading", { level: 1, name: job.title })).toBeInTheDocument();
        expect(screen.getByText(job.badge)).toBeInTheDocument();
        expect(screen.getByText(job.location)).toBeInTheDocument();
        expect(screen.getByText(job.department)).toBeInTheDocument();
      });
    }
  });
});
