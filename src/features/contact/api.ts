import { useMutation } from "@tanstack/react-query";

import { api } from "@/shared/api/client";
import { unwrap } from "@/shared/api/errors";
import type { components } from "@/shared/api/schema";

export type ContactMessageIn = components["schemas"]["ContactMessageIn"];
export type ContactMessageOut = components["schemas"]["ContactMessageOut"];

export function useSubmitContactMessage() {
  return useMutation({
    mutationFn: async (body: ContactMessageIn) =>
      unwrap(await api.POST("/api/v1/contact-messages", { body })),
  });
}
