import { test, expect } from '@playwright/test';

const targets = [
  { name: 'localhost (direct)', url: 'http://localhost' },
  { name: 'mathmadness.app', url: 'https://mathmadness.app' },
  { name: 'playliterate.app', url: 'https://playliterate.app' },
];

for (const target of targets) {
  test(`smoke test: ${target.name}`, async ({ page, context }) => {
    test.setTimeout(30_000);

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.toString());
    });

    try {
      await page.goto(target.url, { waitUntil: 'networkidle', timeout: 15_000 });

      // Check page loaded
      await expect(page).toHaveTitle(/LIT|Math|Play/i);

      // Check for main content (exists on all brands)
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Take screenshot
      await page.screenshot({ path: `tests/e2e/screenshots/${target.name.replace(/\s+/g, '-')}.png` });

      // Check console
      if (consoleErrors.length > 0) {
        console.warn(`⚠️ ${target.name} console errors:`, consoleErrors);
      }

      console.log(`✅ ${target.name} smoke test passed`);
    } catch (err) {
      console.error(`❌ ${target.name} failed:`, err.message);
      throw err;
    }
  });
}
