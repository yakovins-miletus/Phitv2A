import { describe, expect, it } from "vitest";

import { homeSection } from "@/shared/sections";
import { UseCasesNarrative } from "@/features/services/components/UseCasesNarrative";
import { CONTENT } from "@/shared/content";
import { NavbarProvider } from "@/shared/components/NavbarContext";

import { renderWithProviders } from "../test-utils";

// Regression guard for the vertical rebuild: the section dropped its pinned
// horizontal scrub (`ownsPin` + `bare`) for a plain vertical stack of ~90svh
// blocks with a sticky crossfading background.

describe("use-cases: vertical rebuild", () => {
  it("is a normal beat — no longer ownsPin, still noExitDim", () => {
    const def = homeSection("use-cases");
    expect(def.ownsPin ?? false).toBe(false);
    expect(def.noExitDim).toBe(true);
  });

  it("renders exactly one .uc-block per use case, no bare wrapper", () => {
    const { container } = renderWithProviders(
      <NavbarProvider>
        <UseCasesNarrative />
      </NavbarProvider>,
    );

    const blocks = container.querySelectorAll(".uc-block");
    expect(blocks).toHaveLength(CONTENT.useCases.length);
    expect(container.querySelector(".beat-bare-content")).toBeNull();
  });
});
