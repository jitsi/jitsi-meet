import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'https://localhost:8080',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
