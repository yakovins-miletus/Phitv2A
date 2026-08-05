import "@/shared/theme/fonts.css";
// The glass token layer. Imported here, as a real stylesheet, so every
// custom property resolves before the first Emotion insertion and before
// Preloader or GroundLayer paint their first frame. See glass.css's docblock.
import "@/shared/theme/glass.css";

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
