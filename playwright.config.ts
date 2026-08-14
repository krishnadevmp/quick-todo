import { defineConfig, devices } from '@playwright/test';

// ── Playwright config ────────────────────────────────────────────────────
// e2e tests live in ./e2e. Each test gets its own fresh, isolated browser
// context — nothing here touches a real browser profile's data.

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  // Reuses an already-running `npm run dev` if you have one open; otherwise
  // starts (and tears down) one for the test run.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
