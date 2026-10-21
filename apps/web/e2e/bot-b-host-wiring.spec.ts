/**
 * Bot-B host wiring evidence (NOT PASS): Nav/Aux/Splitter + chrome separation.
 * Screenshots → artifacts/validation/ui-parity/bot-b/
 */
import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/bot-b');

function ensure() {
  fs.mkdirSync(OUT, { recursive: true });
}

async function shot(page: import('@playwright/test').Page, name: string) {
  ensure();
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}

test.describe('Bot-B host wiring (evidence, not PASS)', () => {
  test('embeddables + chrome separation + splitter defaults', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible();
    await expect(page.getByTestId('nav-chart-host')).toBeVisible();
    await expect(page.getByTestId('navigation-chart')).toBeVisible();
    await expect(page.getByTestId('nav-chrome')).toBeVisible();
    await expect(page.getByTestId('nav-seg-stft')).toBeVisible();
    await expect(page.getByTestId('nav-zoom-in')).toBeVisible();
    await expect(page.getByTestId('nav-pause')).toBeVisible();
    await expect(page.getByTestId('chart-strip-aux')).toBeVisible();
    await expect(page.getByTestId('chart-strip-main')).toBeVisible();
    await expect(page.getByTestId('btn-open-level')).toBeVisible();
    // Settings hang on aux/spec headers — Level is NOT inside nav-chrome
    await expect(page.getByTestId('nav-chrome').getByTestId('btn-open-level')).toHaveCount(0);
    await expect(page.getByTestId('splitter-nav-aux')).toBeVisible();
    await expect(page.getByTestId('splitter-aux-main')).toBeVisible();
    const navH = Number(await page.getByTestId('splitter-nav-aux').getAttribute('data-size-px'));
    const auxH = Number(await page.getByTestId('splitter-aux-main').getAttribute('data-size-px'));
    expect(navH).toBe(82);
    expect([205, 176]).toContain(auxH);
    await shot(page, 'wiring-hosts-overview.png');
    await shot(page, 'wiring-nav-chrome.png');
    await page.getByTestId('aux-chart').screenshot({
      path: path.join(OUT, 'wiring-aux-with-param-strip.png'),
    });
    await page.getByTestId('main-chart').screenshot({
      path: path.join(OUT, 'wiring-main-with-param-strip.png'),
    });
  });
});
