import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 45_000,
  fullyParallel: true,
  // One retry in CI only: absorbs transient CDN blips without hiding real breaks.
  retries: process.env.CI ? 1 : 0,
  globalSetup: "./tests/global-setup.mjs",
  use: {
    baseURL: "http://localhost:8765",
  },
  webServer: {
    command: "python3 -m http.server 8765",
    port: 8765,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
