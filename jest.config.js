// Jest config for the COLORS front end.
// Node/Jest are used ONLY as test tooling. The app itself is still LAMP
// (Apache + PHP + MySQL); nothing here runs the application.
module.exports = {
  // jsdom gives the tests a fake browser (document, cookies, DOM elements)
  // so js/code.js can run exactly as it does when loaded by a <script> tag.
  testEnvironment: "jsdom",
  testEnvironmentOptions: { url: "http://localhost/" },
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  // Print every test name in the CI log, so failures are easy to read in the
  // GitHub Actions tab.
  verbose: true,
};
