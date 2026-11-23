/**
 * FRONT-END UNIT TESTS: login cookie
 *
 * After login, saveCookie() stores firstName, lastName and userId in a
 * cookie, and color.html calls readCookie() to restore them. If either side
 * breaks, the user gets bounced back to the login page, so we check that
 * what saveCookie() writes is what readCookie() reads.
 */
const { loadPage, loadCodeJs, clearCookies } = require("../helpers/loadApp");
const { installFakeXhr, lastRequest } = require("../helpers/fakeXhr");
const loginSuccess = require("../fixtures/login-success.json");

beforeEach(() => {
  clearCookies();
  loadPage("index.html");
  loadCodeJs();
  installFakeXhr();
  // doLogin() ends with window.location.href = "color.html". jsdom can't
  // navigate between pages and logs "Not implemented: navigation", so we
  // silence that one expected message.
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe("saveCookie() / readCookie()", () => {
  test("a successful login stores the user's id and name in the cookie", () => {
    document.getElementById("loginName").value = "RickL";
    document.getElementById("loginPassword").value = "COP4331";
    doLogin();
    lastRequest().respond(200, loginSuccess);

    expect(document.cookie).toContain("firstName=Rick");
    expect(document.cookie).toContain("lastName=Leinecker");
    expect(document.cookie).toContain("userId=3");
  });

  test("readCookie() restores the userId that saveCookie() wrote", () => {
    // Log in to write the cookie...
    doLogin();
    lastRequest().respond(200, loginSuccess);

    // ...then load a fresh copy of code.js (like opening color.html, where
    // userId starts at 0) and read the cookie back.
    loadPage("color.html");
    loadCodeJs();
    installFakeXhr();
    readCookie();

    // The restored userId must be the one sent with the next API call.
    document.getElementById("colorText").value = "Teal";
    addColor();
    expect(lastRequest().sentJson().userId).toBe(3);
  });
});
