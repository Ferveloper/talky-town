import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./apps/web/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://localhost:3100", trace: "off", screenshot: "only-on-failure" },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "tablet",
      use: { browserName: "chromium", viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      name: "tablet-landscape",
      use: { browserName: "chromium", viewport: { width: 1024, height: 768 }, hasTouch: true },
    },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
    { name: "mobile-small", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 800 } } },
  ],
  webServer: [
    {
      command: "node scripts/e2e-api.cjs",
      url: "http://localhost:3101/health",
      reuseExistingServer: false,
      timeout: 60000,
    },
    {
      command: "pnpm --filter @talkytown/web exec next start --port 3100",
      url: "http://localhost:3100",
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});
