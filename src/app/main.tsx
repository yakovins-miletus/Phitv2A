import "@/shared/theme/fonts.css";

import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Providers } from "./providers";
import { queryClient } from "./queryClient";
import { router } from "./router";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root element #root is missing from index.html.");
}

createRoot(rootElement).render(
  <StrictMode>
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
