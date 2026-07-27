import { test, expect } from "@playwright/test";

// Load-time smoke test for every deployed page: the page must reach a
// page-specific "ready" state with zero uncaught exceptions and zero
// console.error output. Read-only by design — no games are created, so
// CI never writes to the shared Firestore project.

const PAGES = [
  {
    file: "index.html",
    ready: (page) => expect(page.locator("body")).toContainText("Hello World"),
  },
  {
    file: "accordion.html",
    ready: (page) => expect(page.locator("#board")).toBeAttached(),
  },
  {
    file: "lostcities.html",
    ready: (page) => expect(page).toHaveTitle(/Lost Cities/),
  },
  {
    file: "cribbage.html",
    ready: (page) => expect(page.locator("#app")).toBeAttached(),
  },
  {
    file: "tictactoe.html",
    ready: (page) => expect(page.locator("#board")).toBeAttached(),
  },
  {
    file: "trash.html",
    ready: (page) => expect(page.locator("#game-board")).toBeAttached(),
  },
  {
    file: "mahjong.html",
    ready: (page) => expect(page.locator("#app")).toBeAttached(),
  },
  {
    // Dictionary badge flips to "TWL06 ✓" only after the word list downloads
    // and parses — this asserts the full CDN fetch path end to end.
    file: "words.html",
    ready: (page) =>
      expect(page.locator("#dict-info")).toHaveText("TWL06 ✓", {
        timeout: 20_000,
      }),
  },
  {
    // React app mounted => #root has children.
    file: "cribsolv.html",
    ready: (page) => expect(page.locator("#root > *").first()).toBeAttached(),
  },
  {
    // Choropleth drawn => dozens of state paths in the SVG (needs the
    // TopoJSON CDN fetch + local CSV fixture).
    file: "highpoints.html",
    ready: async (page) => {
      await expect
        .poll(() => page.locator("svg path").count(), { timeout: 20_000 })
        .toBeGreaterThan(40);
    },
  },
  {
    file: "nationalparks.html",
    ready: (page) => expect(page.locator(".leaflet-container")).toBeAttached(),
  },
];

for (const { file, ready } of PAGES) {
  test(`${file} loads clean`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
    });

    await page.goto(`/${file}`, { waitUntil: "load" });
    await ready(page);

    expect(errors, `${file} logged errors`).toEqual([]);
  });
}
