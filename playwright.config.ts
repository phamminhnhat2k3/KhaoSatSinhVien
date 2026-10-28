import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000", trace: "on-first-retry" },
  webServer: { command: process.env.PLAYWRIGHT_BASE_URL ? "npm run start -- --port 3015" : "npm run dev", url: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000", reuseExistingServer: !process.env.PLAYWRIGHT_BASE_URL }
});
