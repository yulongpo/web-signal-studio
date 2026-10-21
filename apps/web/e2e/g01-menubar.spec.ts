import { expect, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/** Bot-B G01 menubar evidence — WIP / not ACCEPTANCE PASS. */
test.describe('G01 menubar / command-bar (Bot-B)', () => {
  test('34px menubar with File/View; Open IQ from menu; screenshots', async ({ page }) => {
    const outDir = path.resolve(
      process.cwd(),
      '../../artifacts/validation/ui-parity/bot-b',
    );
    fs.mkdirSync(outDir, { recursive: true });

    await page.goto('/');
    const bar = page.getByTestId('menubar');
    await expect(bar).toBeVisible();
    await expect(page.getByTestId('command-bar')).toBeVisible();

    const box = await bar.boundingBox();
    expect(box).toBeTruthy();
    expect(Math.abs((box?.height ?? 0) - 34)).toBeLessThanOrEqual(2);

    await expect(page.getByTestId('menubar-file')).toBeVisible();
    await expect(page.getByTestId('menubar-view')).toBeVisible();

    // NavChrome / strips / hosts still present
    await expect(page.getByTestId('global-nav')).toBeVisible();
    await expect(page.getByTestId('chart-strip-aux')).toBeVisible();
    await expect(page.getByTestId('chart-strip-main')).toBeVisible();

    await page.getByTestId('menubar-file').click();
    await expect(page.getByTestId('menubar-file-menu')).toBeVisible();
    await expect(page.getByTestId('menu-open-iq')).toBeVisible();

    await page.screenshot({
      path: path.join(outDir, 'g01-menubar-file-menu.png'),
      fullPage: true,
    });

    await page.getByTestId('menubar-view').click();
    await expect(page.getByTestId('menubar-view-menu')).toBeVisible();
    await page.getByTestId('menu-view-narrowband').click();
    await expect(page.getByTestId('status-workspace')).toHaveText('narrowband');
    await expect(page.getByTestId('workspace-narrowband')).toBeVisible();

    await page.screenshot({
      path: path.join(outDir, 'g01-menubar-view-narrowband.png'),
      fullPage: true,
    });

    // Open IQ reachable from menu without clicking SpectrumToolbar Open IQ
    await page.getByTestId('menubar-file').click();
    await expect(page.getByTestId('menu-open-iq')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g01-menubar-default.png'),
      fullPage: true,
    });
  });
});
