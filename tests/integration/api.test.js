/**
 * INTEGRATION TESTS: front end <-> LAMPAPI
 *
 * These run the real page markup (index.html / color.html) together with the
 * real js/code.js, and check the whole round trip for each endpoint:
 *
 *   1. what code.js SENDS: the URL, HTTP method, Content-type header and the
 *      JSON body the PHP script expects, and
 *   2. what code.js DOES with the JSON the PHP script sends back (validating
 *      that JSON's structure and how it ends up on the page).
 *
 * The PHP server isn't running in CI (LAMPAPI/ is kept out of this public
 * repo because it contains the DB password), so responses come from
 * tests/fixtures/*.json. Those fixtures follow the API contract documented in
 * docs/uml/class.puml, and the first block below checks that they do.
 */
const { loadPage, loadCodeJs, clearCookies } = require("../helpers/loadApp");
const { installFakeXhr, lastRequest } = require("../helpers/fakeXhr");

const loginSuccess = require("../fixtures/login-success.json");
const loginFailure = require("../fixtures/login-failure.json");
const searchFound = require("../fixtures/search-found.json");
const searchNone = require("../fixtures/search-none.json");
const addSuccess = require("../fixtures/add-success.json");

const JSON_HEADER = "application/json; charset=UTF-8";

// Mirrors the real user flow: log in on index.html (which writes the
// cookie), then open color.html, where a fresh code.js calls readCookie().
function logInAndOpenColorPage() {
  loadPage("index.html");
  loadCodeJs();
  installFakeXhr();
  doLogin();
  lastRequest().respond(200, loginSuccess);

  loadPage("color.html");
  loadCodeJs();
  installFakeXhr();
  readCookie();
}

// ---------------------------------------------------------------------------
// 1. API contract: the JSON shapes the PHP endpoints return
// ---------------------------------------------------------------------------
describe("LAMPAPI response JSON structure", () => {
  test("Login.php returns { id:int, firstName, lastName, error }", () => {
    for (const res of [loginSuccess, loginFailure]) {
      expect(Object.keys(res).sort()).toEqual(
        ["error", "firstName", "id", "lastName"],
      );
      expect(Number.isInteger(res.id)).toBe(true);
      expect(typeof res.firstName).toBe("string");
      expect(typeof res.lastName).toBe("string");
      expect(typeof res.error).toBe("string");
    }
    expect(loginSuccess.id).toBeGreaterThan(0);
    expect(loginFailure.id).toBe(0);
  });

  test("SearchColors.php returns { results: string[], error } when rows are found", () => {
    expect(Array.isArray(searchFound.results)).toBe(true);
    searchFound.results.forEach((c) => expect(typeof c).toBe("string"));
    expect(searchFound.error).toBe("");
  });

  test("AddColor.php returns { error } with an empty error on success", () => {
    expect(addSuccess).toEqual({ error: "" });
  });
});

// ---------------------------------------------------------------------------
// 2. Login.php  (index.html)
// ---------------------------------------------------------------------------
describe("doLogin() -> /LAMPAPI/Login.php", () => {
  beforeEach(() => {
    clearCookies();
    loadPage("index.html");
    loadCodeJs();
    installFakeXhr();
    jest.spyOn(console, "error").mockImplementation(() => {}); // jsdom navigation notice
    document.getElementById("loginName").value = "RickL";
    document.getElementById("loginPassword").value = "COP4331";
  });

  afterEach(() => console.error.mockRestore());

  test("POSTs { login, password } as JSON to Login.php", () => {
    doLogin();
    const req = lastRequest();

    expect(req.method).toBe("POST");
    expect(req.url).toBe("/LAMPAPI/Login.php");
    expect(req.async).toBe(true);
    expect(req.requestHeaders["Content-type"]).toBe(JSON_HEADER);
    expect(req.sentJson()).toEqual({ login: "RickL", password: "COP4331" });
  });

  test("shows an error message when the API returns id 0", () => {
    doLogin();
    lastRequest().respond(200, loginFailure);

    expect(document.getElementById("loginResult").innerHTML).toBe(
      "User/Password combination incorrect",
    );
    expect(document.cookie).not.toContain("userId=");
  });

  test("saves the user from the API response when login succeeds", () => {
    doLogin();
    lastRequest().respond(200, loginSuccess);

    expect(document.getElementById("loginResult").innerHTML).toBe("");
    expect(document.cookie).toContain("userId=3");
  });

  test("ignores the response until the request has finished (readyState 4, HTTP 200)", () => {
    doLogin();
    const req = lastRequest();
    req.status = 500;
    req.readyState = 4;
    req.responseText = "Internal Server Error";
    req.onreadystatechange.call(req); // would throw on JSON.parse if not guarded

    expect(document.getElementById("loginResult").innerHTML).toBe("");
  });
});

// ---------------------------------------------------------------------------
// 3. AddColor.php and SearchColors.php  (color.html)
// ---------------------------------------------------------------------------
describe("color.html -> AddColor.php / SearchColors.php", () => {
  beforeEach(() => {
    clearCookies();
    jest.spyOn(console, "error").mockImplementation(() => {}); // jsdom navigation notice
    logInAndOpenColorPage();
  });

  afterEach(() => console.error.mockRestore());

  test("addColor() POSTs { color, userId } as JSON to AddColor.php", () => {
    document.getElementById("colorText").value = "Teal";
    addColor();
    const req = lastRequest();

    expect(req.method).toBe("POST");
    expect(req.url).toBe("/LAMPAPI/AddColor.php");
    expect(req.requestHeaders["Content-type"]).toBe(JSON_HEADER);
    // Regression test for the Assignment 4 lint fix: this used to be sent
    // as {color:newColor,userId,userId}, which never included a userId key.
    expect(req.sentJson()).toEqual({ color: "Teal", userId: 3 });
  });

  test("addColor() confirms on the page when the API succeeds", () => {
    document.getElementById("colorText").value = "Teal";
    addColor();
    lastRequest().respond(200, addSuccess);

    expect(document.getElementById("colorAddResult").innerHTML).toBe(
      "Color has been added",
    );
  });

  test("searchColor() POSTs { search, userId } as JSON to SearchColors.php", () => {
    document.getElementById("searchText").value = "blue";
    searchColor();
    const req = lastRequest();

    expect(req.method).toBe("POST");
    expect(req.url).toBe("/LAMPAPI/SearchColors.php");
    expect(req.requestHeaders["Content-type"]).toBe(JSON_HEADER);
    expect(req.sentJson()).toEqual({ search: "blue", userId: 3 });
  });

  test("searchColor() renders every color in the API results", () => {
    document.getElementById("searchText").value = "blue";
    searchColor();
    lastRequest().respond(200, searchFound);

    expect(document.getElementById("colorSearchResult").innerHTML).toBe(
      "Color(s) has been retrieved",
    );
    const list = document.getElementById("colorList").innerHTML;
    expect(list.split(/<br>\s*/)).toEqual(["Blue", "Light Blue", "Navy Blue"]);
  });

  test("searchColor() shows the API error when nothing matches", () => {
    // When no rows match, SearchColors.php has no "results" array; it
    // answers with { id:0, firstName:"", lastName:"", error:"No Records Found" }.
    document.getElementById("searchText").value = "zzz";
    searchColor();

    expect(() => lastRequest().respond(200, searchNone)).not.toThrow();
    expect(document.getElementById("colorSearchResult").innerHTML).toBe(
      "No Records Found",
    );
    expect(document.getElementById("colorList").innerHTML.trim()).toBe("");
  });
});
