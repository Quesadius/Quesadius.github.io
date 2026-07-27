// Lints the JS inside each page's <script> blocks via eslint-plugin-html.
// Deliberately minimal rule set: correctness only, no style rules, so CI
// failures always mean something real.
import html from "eslint-plugin-html";
import globals from "globals";

export default [
  {
    ignores: [
      "cribsolv.html", // minified build artifact of ~/Code/cribsolv — not source
      "node_modules/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  {
    files: ["*.html"],
    plugins: { html },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.browser,
        // Page-level CDN globals (loaded via <script src>):
        d3: "readonly",       // highpoints
        topojson: "readonly", // highpoints
        L: "readonly",        // nationalparks (Leaflet)
        tailwind: "writable", // Tailwind Play CDN inline config blocks
        // tictactoe supports optional host-injected config (typeof-guarded):
        __firebase_config: "readonly",
        __app_id: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "no-redeclare": "error",
      "no-unused-vars": [
        "error",
        { args: "none", caughtErrors: "none", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["tests/**/*.mjs", "*.mjs"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["error", { args: "none" }],
    },
  },
];
