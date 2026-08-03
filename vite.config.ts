import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { compression } from "vite-plugin-compression2";

/**
 * Inject `<link rel="preload">` for the emitted woff2 files.
 *
 * The fonts are only referenced from `fonts.css`, so the browser cannot discover them
 * until it has fetched and parsed the stylesheet — one serialised round trip before a
 * font that `font-display: swap` will then swap in, causing a visible reflow of the
 * hero copy. Their filenames are content-hashed, so the preload has to be generated at
 * build time rather than hardcoded in index.html.
 */
function preloadFonts(): Plugin {
  return {
    name: "preload-fonts",
    apply: "build",
    enforce: "post",
    transformIndexHtml(html, ctx) {
      const fonts = Object.keys(ctx.bundle ?? {}).filter((f) => f.endsWith(".woff2"));
      if (fonts.length === 0) return html;
      const tags = fonts
        .map((f) => `    <link rel="preload" href="/${f}" as="font" type="font/woff2" crossorigin />`)
        .join("\n");
      return html.replace("</head>", `${tags}\n  </head>`);
    },
  };
}

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    preloadFonts(),
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
        // these are eager already; lazy libs (gsap, lenis) are deliberately
        // NOT grouped so they stay in their route chunks.
        // (@mui/x-charts used to be listed here; it was a declared dependency
        // with zero imports in src/ and has been removed from package.json.)
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
