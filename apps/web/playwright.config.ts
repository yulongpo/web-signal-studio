import { defineConfig, devices } from "@playwright/test";

/**
 * Bot-C / apps/web e2e.
 * Chromium on Windows/CI often needs ANGLE+SwiftShader for WebGL2 (QA-G M-03/C-01).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: "../../artifacts/validation/p1g/playwright-report",
      },
    ],
  ],
  outputDir: "../../artifacts/validation/p1g/test-results",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
    launchOptions: {
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader-webgl",
        "--enable-webgl",
        "--enable-webgl2",
        "--ignore-gpu-blocklist",
        "--enable-unsafe-swiftshader",
        "--disable-gpu-sandbox",
      ],
    },
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173",
    cwd: ".",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
