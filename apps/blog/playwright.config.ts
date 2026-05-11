import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "pnpm exec astro dev --host 127.0.0.1 --port 4321",
    cwd: ".",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: "http://127.0.0.1:4321"
  }
});
