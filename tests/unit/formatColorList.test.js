/**
 * FRONT-END UNIT TESTS
 *
 * formatColorList(results) takes the "results" array from SearchColors.php
 * and builds the HTML for the color list on color.html: one color per line,
 * joined with "<br />\r\n" and no trailing separator.
 *
 * These are unit tests: the function is pure (no DOM, no network), so we
 * test it on its own with plain inputs and outputs.
 */
const { loadCodeJs } = require("../helpers/loadApp");

beforeEach(() => {
  loadCodeJs();
});

describe("formatColorList()", () => {
  test("returns an empty string when there are no colors", () => {
    expect(formatColorList([])).toBe("");
  });

  test("returns a single color with no line break", () => {
    expect(formatColorList(["Blue"])).toBe("Blue");
  });

  test("puts a <br /> between colors but not after the last one", () => {
    expect(formatColorList(["Blue", "Light Blue", "Navy Blue"])).toBe(
      "Blue<br />\r\nLight Blue<br />\r\nNavy Blue",
    );
  });

  test("keeps colors in the order the API returned them", () => {
    const html = formatColorList(["Red", "Green", "Blue"]);
    expect(html.split("<br />\r\n")).toEqual(["Red", "Green", "Blue"]);
  });

  test("keeps color names with spaces intact", () => {
    expect(formatColorList(["Hot Pink", "Sky Blue"])).toBe(
      "Hot Pink<br />\r\nSky Blue",
    );
  });
});
