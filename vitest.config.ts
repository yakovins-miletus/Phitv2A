import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Standalone test config: Vite 8's rolldown-based types clash with vitest 3's
// `test` augmentation of vite.config.ts. Tests transform TSX via esbuild
// (tsconfig jsx: react-jsx), so the dev plugins aren't needed here.
//
// Two projects, because the reduced-motion default is load-bearing and
// opposite in each:
//
//   unit   — prefers-reduced-motion: reduce. Every animation renders its final
//            state, so content assertions are deterministic. This is the right
//            default for almost everything and what the existing suite was
//            written against.
//   motion — prefers-reduced-motion: no-preference, plus a controllable
//            IntersectionObserver. Needed because SmoothScroll, AppShell's
//            overscroll pressure machine and every GSAP scrub early-return
//            under reduce, so the unit project can never reach them.
//
// Keep the split. Flipping `unit` to no-preference would race the existing
// content assertions against animations; folding `motion` back in would hide
// the scroll layer again, which is how it went untested in the first place.
const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };
const env = { VITE_API_URL: "http://localhost:8000" };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "jsdom",
          globals: true,
          env,
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/*.test.{ts,tsx}"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "motion",
          environment: "jsdom",
          globals: true,
          env,
          setupFiles: ["./tests/setup.ts", "./tests/setup.motion.ts"],
          include: ["tests/motion/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
