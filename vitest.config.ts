import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Standalone test config: Vite 8's rolldown-based types clash with vitest 3's
// `test` augmentation of vite.config.ts. Tests transform TSX via esbuild
// (tsconfig jsx: react-jsx), so the dev plugins aren't needed here.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    env: { VITE_API_URL: "http://localhost:8000" },
  },
});
