import { expect } from '@playwright/test';

export function attachConsoleGuard(page, { ignore = [] } = {}) {
  const errors = [];

  page.on('pageerror', (err) => {
    errors.push({
      kind: 'pageerror',
      text: err?.message || String(err),
    });
  });

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    errors.push({
      kind: 'console.error',
      text: msg.text(),
    });
  });

  return () => {
    const filtered = errors.filter((e) => !ignore.some((re) => re.test(e.text)));
    expect(
      filtered,
      filtered.length
        ? `Console errors detected:\n${filtered.map((e) => `- [${e.kind}] ${e.text}`).join('\n')}`
        : 'No console errors',
    ).toEqual([]);
  };
}

