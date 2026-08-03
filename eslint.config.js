import js from "@eslint/js";
import pluginQuery from "@tanstack/eslint-plugin-query";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "src/routeTree.gen.ts"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...pluginQuery.configs["flat/recommended"],
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Design-token enforcement.
      //
      // palette.ts opens with "the single source of truth … so no raw hex ever
      // lives outside this file". That claim was false by 224 hex literals, and
      // among them were the Tailwind default palette and the macOS traffic-light
      // colours, sitting inside a navy-and-gold brand. A comment cannot hold a
      // line; a rule can.
      //
      // Warn, not error: the repo still carries a long tail of legacy literals,
      // and turning this to `error` today would bury the real errors. It stops
      // the bleeding now and can be promoted once the tail is cleared.
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "Literal[value=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
          message:
            "Raw hex colour. Import a token from @/shared/theme/palette (NOIR, CHAPTER_ACCENTS, TECH_CAT_ACCENTS) or use a theme callback.",
        },
        {
          selector: "Literal[value=/cubic-bezier\\(/]",
          message:
            "Raw cubic-bezier. Use EASE_OUT_EXPO_CSS / EASE_IN_OUT_QUART_CSS from @/shared/motion/easing.",
        },
        {
          selector: "TemplateElement[value.raw=/cubic-bezier\\(/]",
          message:
            "Raw cubic-bezier. Use EASE_OUT_EXPO_CSS / EASE_IN_OUT_QUART_CSS from @/shared/motion/easing.",
        },
      ],
    },
  },
  {
    // TanStack file-based routes must export the Route object next to the
    // page component; the fast-refresh rule doesn't apply to them.
    files: ["src/routes/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // The token definitions themselves, and the canvas renderer, are where raw
    // colour values are supposed to live.
    files: [
      "src/shared/theme/palette.ts",
      "src/shared/motion/easing.ts",
      "src/features/hero/heroScene.ts",
      "src/features/hero/heroCanvasRenderer.ts",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
);
