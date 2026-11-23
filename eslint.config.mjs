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
  {
    // Test tooling runs in Node (CommonJS) under Jest, not in the browser.
    files: ["tests/**/*.js", "jest.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.browser, // tests drive a jsdom "browser" (document, window)
        // Functions from js/code.js, loaded into the jsdom window by
        // tests/helpers/loadApp.js:
        doLogin: "readonly",
        readCookie: "readonly",
        saveCookie: "readonly",
        doLogout: "readonly",
        addColor: "readonly",
        searchColor: "readonly",
        formatColorList: "readonly",
      },
    },
  },
];
