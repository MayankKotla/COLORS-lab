// ESLint flat config for the COLORS front end (plain browser scripts, no bundler).
import js from "@eslint/js";
import globals from "globals";

export default [
  // Third-party / generated files are not ours to lint.
  { ignores: ["node_modules/**", "js/md5.js", "**/*.min.js"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script", // loaded with <script src>, not as ES modules
      globals: {
        ...globals.browser,
        md5: "readonly", // provided by js/md5.js
      },
    },
    rules: {
      // Top-level functions (doLogin, addColor, ...) are called from HTML
      // onclick attributes, so ESLint can't see their usage. Only flag
      // unused *local* variables.
      "no-unused-vars": ["error", { vars: "local", args: "none" }],
      eqeqeq: ["error", "smart"],
      semi: ["error", "always"],
    },
  },
];
