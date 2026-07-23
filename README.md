# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Production serving (performance)

`npm run build` emits precompressed `dist/assets/*.br` and `*.gz` next to every asset — configure the static host to serve them (nginx: `brotli_static on; gzip_static on;`).

Recommended cache headers:

- `/assets/*` → `Cache-Control: public, max-age=31536000, immutable` (filenames are content-hashed)
- `/index.html` → `Cache-Control: no-cache` (so deploys take effect immediately)

Bundle rules that keep the eager chunk small (enforced by comments at the import sites):

- Route files with a `loader` must import query fns from `@/features/<x>/api` and components from their component file directly — never the feature barrel. The loader stays in the eager bundle and drags everything it imports with it.
- No `gsap`/`lenis` imports at route-module scope; scroll wiring lives in `src/shared/components/SmoothScroll.tsx`, which rides the lazy home chunk.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
