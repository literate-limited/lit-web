import { defineConfig, devices } from '@playwright/test';

// Staging runs should not start local servers. This config targets an already deployed instance.
const baseURL = process.env.PW_BASE_URL || 'http://54.252.154.92';

const shouldAssist = /^(1|true)$/i.test(process.env.PW_ASSIST || '');
const shouldDemo = /^(1|true)$/i.test(process.env.PW_DEMO || '');
// Assisted runs should always record, since the whole point is human review.
const traceMode = shouldAssist || shouldDemo ? 'on' : 'retain-on-failure';
const videoMode = shouldAssist || shouldDemo ? 'on' : 'retain-on-failure';

const outputDir = '../output/playwright';
const testOutputDir = `${outputDir}/test-results`;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: testOutputDir,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    trace: traceMode,
    screenshot: 'only-on-failure',
    video: videoMode,
    viewport: { width: 1280, height: 720 },
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
