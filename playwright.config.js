import { defineConfig, devices } from '@playwright/test';

const webPort = Number(process.env.WEB_PORT || 5174);
const apiPort = Number(process.env.API_PORT || 3001);

const homeDir = process.env.HOME || '';
const node20 = homeDir ? `${homeDir}/.nvm/versions/node/v20.19.6/bin/node` : '';
const npm20 = homeDir ? `${homeDir}/.nvm/versions/node/v20.19.6/bin/npm` : '';

// Allow overriding in CI or local shells.
const apiNode = process.env.LIT_API_NODE || node20 || 'node';
const npmBin = process.env.LIT_NPM_BIN || npm20 || 'npm';

const shouldDemo = /^(1|true)$/i.test(process.env.PW_DEMO || '');
const traceMode = shouldDemo ? 'on' : 'retain-on-failure';
const videoMode = shouldDemo ? 'on' : 'retain-on-failure';

const outputDir = '../output/playwright';
const testOutputDir = `${outputDir}/test-results`;
const apiLog = `${outputDir}/api.log`;
const webLog = `${outputDir}/web.log`;

const databaseUrl =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:55432/lit_e2e';

const apiCommand = `bash -lc 'mkdir -p \"${outputDir}\"; if [ -x \"${apiNode}\" ]; then \"${apiNode}\" server.js; else node server.js; fi > \"${apiLog}\" 2>&1'`;
const webCommand = `bash -lc 'mkdir -p \"${outputDir}\"; if [ -x \"${npmBin}\" ]; then \"${npmBin}\" run build; \"${npmBin}\" run preview -- --host localhost --port ${webPort}; else npm run build; npm run preview -- --host localhost --port ${webPort}; fi > \"${webLog}\" 2>&1'`;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: testOutputDir,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://localhost:${webPort}`,
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
  webServer: [
    {
      command: apiCommand,
      cwd: '../api',
      env: {
        NODE_ENV: 'test',
        PORT: String(apiPort),
        DATABASE_URL: databaseUrl,
        PGSSL: 'false',
      },
      port: apiPort,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: webCommand,
      cwd: '.',
      env: {
        VITE_API_URL: `http://localhost:${apiPort}`,
      },
      port: webPort,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
