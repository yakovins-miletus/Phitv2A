import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { compression } from "vite-plugin-compression2";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    // Precompressed assets (.gz + .br) emitted at build time so any static
    // host/nginx can serve them with zero runtime cost.
    compression({ algorithms: ["gzip", "brotliCompress"] }),
  ],
  resolve: {
    alias: { "@": "/src" },
  },
  build: {
    rollupOptions: {
      output: {
        // Rolldown's successor to manualChunks: stable vendor chunks so app
        // churn doesn't invalidate framework bytes in the HTTP cache. All of
        // these are eager already; lazy libs (gsap, lenis, @mui/x-charts)
        // are deliberately NOT grouped so they stay in their route chunks.
        advancedChunks: {
          groups: [
            { name: "react", test: /node_modules\/(?:react|react-dom|scheduler)\// },
            {
              name: "mui",
              test: /node_modules\/(?:@mui\/(?:material|system|utils|styled-engine)|@emotion)\//,
            },
            { name: "motion", test: /node_modules\/(?:motion|framer-motion|motion-dom|motion-utils)\// },
            { name: "tanstack", test: /node_modules\/@tanstack\// },
          ],
        },
      },
    },
  },
});
