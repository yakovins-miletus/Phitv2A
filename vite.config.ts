import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
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

/**
 * Fail the production build when `VITE_API_URL` is unset or still a placeholder.
 *
 * `.env.production` shipped `https://phitv2.phit.b.com` — a hostname that does not
 * resolve. Dev was unaffected (it points at localhost:8000), so nothing surfaced
 * until a production build was actually loaded, where every data-driven surface
 * died on ERR_NAME_NOT_RESOLVED. A broken API base is not something the site can
 * degrade around, so it stops the build rather than shipping.
 */
function assertApiUrl(): Plugin {
  const PLACEHOLDER = /(\.b\.com|example\.(com|org)|changeme|your-domain|TODO|localhost)/i;
  return {
    name: "assert-api-url",
    apply: "build",
    configResolved(config) {
      if (config.mode !== "production") return;
      const url = config.env.VITE_API_URL as string | undefined;
      if (url === undefined || url === "") {
        throw new Error(
          "VITE_API_URL is not set. Set it in .env.production — `/` for the same-origin Nginx deployment.",
        );
      }
      if (PLACEHOLDER.test(url)) {
        throw new Error(
          `VITE_API_URL is a placeholder or a dev host: ${url}\n` +
            "Set it to `/` (same-origin behind Nginx) or to the real API origin.",
        );
      }
    },
  };
}

/**
 * Expose all files in the public/ directory as an array of paths for the preloader.
 */
function publicAssetsPlugin(): Plugin {
  const virtualModuleId = "virtual:public-assets";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "vite-plugin-public-assets",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const publicDir = path.resolve(process.cwd(), "public");
        const assets: string[] = [];

        function walk(dir: string) {
          if (!fs.existsSync(dir)) return;
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              walk(filePath);
            } else {
              if (file.startsWith(".") || file.endsWith(".html")) continue;
              const relPath = path.relative(publicDir, filePath);
              assets.push("/" + relPath.replace(/\\/g, "/"));
            }
          }
        }
        walk(publicDir);
        return `export default ${JSON.stringify(assets)};`;
      }
    },
  };
}

export default defineConfig({
  // `vite preview` does not read PORT on its own — it uses `preview.port` and
  // walks upward when that port is busy. The Claude Code preview harness
  // assigns a free port via PORT and then expects the server to actually bind
  // it, so without this the harness proxies one port while vite listens on
  // another and every request is refused. Falls back to vite's own default
  // when PORT is unset, so a plain `yarn preview` is unchanged.
  preview: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : undefined,
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    preloadFonts(),
    assertApiUrl(),
    publicAssetsPlugin(),
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
            // three.js and its React bindings. Unlike the groups above this one
            // is NOT eager — every consumer (R3FHeroCanvas, PlaygroundCanvas,
            // MonolithScene, ServiceGlobe) sits behind React.lazy, so this chunk
            // is only fetched when a 3D surface actually mounts.
            //
            // Grouping is hygiene, not the fix: it keeps ~190KB brotli of engine
            // in one cacheable chunk instead of duplicating slices of it across
            // four lazy chunks. What actually keeps it OFF the home critical path
            // is the source-level split in `features/hero/heroPalette.ts` —
            // `advancedChunks` decides which chunk a module lands in, never what
            // is reachable, so this line alone would not have helped.
            { name: "three", test: /node_modules\/(?:three|@react-three\/(?:fiber|drei))\// },
          ],
        },
      },
    },
  },
});
