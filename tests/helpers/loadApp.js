// Loads one of the real HTML pages plus js/code.js into Jest's jsdom
// "browser", the same way the browser does with <script src="js/code.js">.
//
// code.js is a plain browser script (no exports), so we read it as text and
// evaluate it in the global scope. Its top-level functions (doLogin,
// addColor, searchColor, formatColorList, ...) then become globals the tests
// can call, just like the onclick="..." attributes in the HTML do.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

function loadPage(htmlFile) {
  const html = fs.readFileSync(path.join(ROOT, htmlFile), "utf8");
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  // Only the <body> markup is needed; inline <script> tags are not run by
  // jsdom here, so readCookie() on page load won't fire by itself.
  document.body.innerHTML = body ? body[1] : html;
}

function loadCodeJs() {
  const src = fs.readFileSync(path.join(ROOT, "js", "code.js"), "utf8");
  // Indirect eval runs the code in the global (window) scope. Each call gets
  // fresh module state (userId = 0, etc.), so tests don't leak into each other.
  (0, eval)(src);
}

// Removes the cookie that saveCookie() writes (it's all one cookie named
// "firstName"), so each test starts logged out.
function clearCookies() {
  document.cookie = "firstName= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
}

module.exports = { loadPage, loadCodeJs, clearCookies };
