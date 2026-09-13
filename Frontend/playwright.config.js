import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1,
  reporter: 'list', use: { baseURL: 'http://localhost:5189', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'node node_modules/vite/bin/vite.js --host localhost', url: 'http://localhost:5189', reuseExistingServer: false },
});
