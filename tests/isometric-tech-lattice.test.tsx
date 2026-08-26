import { createRef } from "react";

import {
  IsometricLattice,
  type IsometricLatticeHandle,
} from "@/features/home/components/closing-scene/IsometricTechLattice";

import { stubMatchMedia } from "./setup";
import { renderWithProviders } from "./test-utils";

/**
 * setup.ts's `stubMatchMedia` only models `prefers-reduced-motion`; any other
 * query (including MUI's width-based breakpoint queries) falls through to
 * `matches: false`. IsometricLattice needs BOTH knobs (reduced-motion AND
 * `theme.breakpoints.down("sm")`, which MUI resolves to a `(max-width:...)`
 * query) controlled independently per test, so this combines them locally
 * rather than editing the shared stub.
 */
function stubMediaQueries({ reduced, mobile }: { reduced: boolean; mobile: boolean }): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("no-preference")
      ? !reduced
      : query.includes("prefers-reduced-motion")
        ? reduced
        : query.includes("max-width")
          ? mobile
          : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

afterEach(() => {
  // Restore setup.ts's default (reduced-motion, non-mobile-aware) stub so
  // later test files aren't affected by this file's overrides.
  stubMatchMedia(true);
});

function renderLattice(reduced = false) {
  const ref = createRef<IsometricLatticeHandle>();
  const result = renderWithProviders(<IsometricLattice ref={ref} reduced={reduced} />);
  return { ref, ...result };
}

// Total stacks across LAYERS (apps=3, core=6, infra=3) — used to assert the
// mobile relayout keeps every node rather than dropping any.
const TOTAL_NODE_COUNT = 12;

test("desktop width, not reduced: renders the 3-row layout with connector lines", () => {
  stubMediaQueries({ reduced: false, mobile: false });
  const { container } = renderLattice(false);

  // 2 fixed separator lines + 9 connector lines (one per non-apps node) —
  // asserting > 2 proves connectors rendered on top of the separators.
  const lines = container.querySelectorAll("line");
  expect(lines.length).toBeGreaterThan(2);

  const nodeLabels = container.querySelectorAll("text");
  // Sanity: labels exist (3 layer labels + a badge + name label per node).
  expect(nodeLabels.length).toBeGreaterThan(0);
});

test("mobile width (<600px), not reduced: vertical-stack layout with no connectors, all nodes kept", () => {
  stubMediaQueries({ reduced: false, mobile: true });
  const { container } = renderLattice(false);

  // Every node renders a <g> wrapping a <circle> — one per placed node.
  const nodeGroups = container.querySelectorAll("g > circle");
  expect(nodeGroups.length).toBe(TOTAL_NODE_COUNT);

  // Only the 2 fixed separator lines should remain — connectors are dropped
  // entirely on mobile, so total <line> count must equal exactly 2.
  const lines = container.querySelectorAll("line");
  expect(lines.length).toBe(2);
});

test("mobile + reduced motion: renders without crashing and without connectors or labels", () => {
  stubMediaQueries({ reduced: true, mobile: true });
  expect(() => renderLattice(true)).not.toThrow();

  const { container } = renderLattice(true);
  // reduced=true gates off both separators/connectors and layer labels.
  expect(container.querySelectorAll("line").length).toBe(0);
  // Nodes themselves are still rendered under reduced motion (static frame).
  expect(container.querySelectorAll("g > circle").length).toBe(TOTAL_NODE_COUNT);
});
