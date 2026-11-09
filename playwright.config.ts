import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Every Home test renders the 3D journey in software GL (SwiftShader, itself multi-threaded); more than 3
  // such pages at once starve the timing-sensitive tests.
  workers: 3,
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  projects: [
    {
      name: "desktop",
      testIgnore: /(\.timing|smoothness)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    // Safari on a desktop (spec §7): the same suite in WebKit at the desktop size.
    {
      name: "webkit",
      testIgnore: /(\.timing|smoothness)\.spec\.ts/,
      use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 } },
    },
    { name: "mobile", testIgnore: /(\.timing|smoothness)\.spec\.ts/, use: { ...devices["iPhone 13"] } },
    // Timing-sensitive tests, once the suite above is done, so no other page loads the CPU meanwhile.
    {
      name: "timing-desktop",
      testMatch: /\.timing\.spec\.ts/,
      dependencies: ["desktop", "webkit", "mobile"],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "timing-mobile",
      testMatch: /\.timing\.spec\.ts/,
      dependencies: ["desktop", "webkit", "mobile"],
      use: { ...devices["iPhone 13"] },
    },
    // The scroll on a phone (e2e/smoothness.spec.ts): the production build (port 3200), Chromium as an iPhone 14 on
    // the GPU (headed: headless draws a 2D canvas in software), alone once the rest is done.
    {
      name: "smoothness",
      testMatch: /smoothness\.spec\.ts/,
      dependencies: ["desktop", "webkit", "mobile"],
      use: {
        ...devices["iPhone 14"],
        browserName: "chromium",
        baseURL: "http://localhost:3200",
        launchOptions: { headless: false, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] },
      },
    },
  ],
  webServer: [
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run build && npm run start -- -p 3200",
      url: "http://localhost:3200",
      reuseExistingServer: !process.env.CI,
      timeout: 600_000,
    },
  ],
});
