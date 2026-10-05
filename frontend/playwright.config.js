import { defineConfig, devices } from '@playwright/test';

// PW_CHROMIUM_PATH is optional: point it at an existing Chrome/Chromium if you
// cannot run `npx playwright install chromium`.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: executablePath ? { executablePath } : {} },
    },
  ],
  webServer: [
    {
      // Express backend with a throw-away database file so e2e runs never touch real data
      command: 'npm start --prefix ../backend',
      url: 'http://localhost:4000/api/health',
      env: { DATA_FILE: '../backend/data/e2e-db.json' },
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
