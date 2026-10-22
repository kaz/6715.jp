import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const systemChromium =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 4,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    javaScriptEnabled: false,
    launchOptions: { executablePath: systemChromium },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], javaScriptEnabled: false } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, javaScriptEnabled: false } },
  ],
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory dist/client',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
