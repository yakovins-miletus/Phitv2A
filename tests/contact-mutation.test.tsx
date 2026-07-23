import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";

import { ContactForm } from "@/features/contact";

import { server } from "./msw/server";
import { makeTestQueryClient, renderWithProviders } from "./test-utils";

async function fillValidForm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText(/^name/i), "Ada Lovelace");
  await user.type(screen.getByLabelText(/^email/i), "ada@example.com");
  await user.type(screen.getByLabelText(/^subject/i), "Partnership question");
  await user.type(
    screen.getByLabelText(/^message/i),
    "We would like to explore a research partnership with your lab.",
  );
}

test("valid submission shows success", async () => {
  const user = userEvent.setup();
  const queryClient = makeTestQueryClient();
  renderWithProviders(<ContactForm />, queryClient);

  await fillValidForm(user);
  await user.click(screen.getByRole("button", { name: /send message/i }));

  expect(await screen.findByText("Message received.")).toBeInTheDocument();
});

test("server 422 problem detail reaches the UI as an alert", async () => {
  server.use(
    http.post("*/api/v1/contact-messages", () =>
      HttpResponse.json(
        {
          type: "about:blank",
          title: "Validation failed",
          status: 422,
          detail: "One or more fields are invalid.",
          errors: [{ field: "email", message: "value is not a valid email address" }],
        },
        { status: 422, headers: { "Content-Type": "application/problem+json" } },
      ),
    ),
  );
  const user = userEvent.setup();
  renderWithProviders(<ContactForm />);

  await fillValidForm(user);
  await user.click(screen.getByRole("button", { name: /send message/i }));

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("One or more fields are invalid.");
});

test("client validation blocks the request and marks the fields", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ContactForm />);

  await user.click(screen.getByRole("button", { name: /send message/i }));

  expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument();
  expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
});
