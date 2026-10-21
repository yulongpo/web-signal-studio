import { expect, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/** Bot-B G01 menubar evidence — WIP / not ACCEPTANCE PASS. */
test.describe('G01 menubar / command-bar (Bot-B)', () => {
  test('File/Edit/View/Analysis/Help menus; Open IQ; screenshots', async ({ page }) => {
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
    await expect(page.getByTestId('menubar-edit')).toBeVisible();
    await expect(page.getByTestId('menubar-view')).toBeVisible();
    await expect(page.getByTestId('menubar-analysis')).toBeVisible();
    await expect(page.getByTestId('menubar-tools')).toBeVisible();
    await expect(page.getByTestId('menubar-help')).toBeVisible();

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

    await page.getByTestId('menubar-edit').click();
    await expect(page.getByTestId('menubar-edit-menu')).toBeVisible();
    await expect(page.getByTestId('menu-edit-undo')).toBeVisible();
    await expect(page.getByTestId('menu-edit-redo')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g01-menubar-edit-menu.png'),
      fullPage: true,
    });

    await page.getByTestId('menubar-analysis').click();
    await expect(page.getByTestId('menubar-analysis-menu')).toBeVisible();
    await expect(page.getByTestId('menu-analysis-detect')).toBeVisible();
    await expect(page.getByTestId('menu-analysis-roi')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g01-menubar-analysis-menu.png'),
      fullPage: true,
    });
    await page.getByTestId('menu-analysis-detect').click();
    await expect(page.getByTestId('rail-page-detect')).toBeVisible();

    await page.getByTestId('menubar-help').click();
    await expect(page.getByTestId('menubar-help-menu')).toBeVisible();
    await page.getByTestId('menu-help-mouse').click();
    await expect(page.getByTestId('menubar-dialog')).toBeVisible();
    await expect(page.getByTestId('menubar-dialog-title')).toContainText('鼠标');
    await page.screenshot({
      path: path.join(outDir, 'g01-menubar-help-dialog.png'),
      fullPage: true,
    });
    await page.getByTestId('menubar-dialog-close').click();

    await page.getByTestId('menubar-view').click();
    await expect(page.getByTestId('menubar-view-menu')).toBeVisible();
    await page.getByTestId('menu-view-narrowband').click();
    await expect(page.getByTestId('status-workspace')).toHaveText('narrowband');
    await expect(page.getByTestId('workspace-narrowband')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g01-menubar-view-narrowband.png'),
      fullPage: true,
    });

    await page.screenshot({
      path: path.join(outDir, 'g01-menubar-default.png'),
      fullPage: true,
    });
  });
});

  test('rename mark via M06 + view history back/forward', async ({ page }) => {
    const outDir = path.resolve(
      process.cwd(),
      '../../artifacts/validation/ui-parity/bot-b',
    );
    fs.mkdirSync(outDir, { recursive: true });

    await page.goto('/');

    const seeded = await page.evaluate(() => {
      const hook = window.__wssM06;
      if (!hook) return false;
      hook.addManualMark({ id: 'm-g01', name: 'mark-g01', start: '0', end: '1000' });
      hook.setSelection({ activeMarkId: 'm-g01', selectedMarkIds: ['m-g01'] });
      return true;
    });
    expect(seeded).toBe(true);

    await page.getByTestId('menubar-edit').click();
    await expect(page.getByTestId('menu-edit-rename-mark')).toBeEnabled();
    await page.getByTestId('menu-edit-rename-mark').click();
    await expect(page.getByTestId('menubar-dialog')).toBeVisible();
    await page.getByTestId('menu-rename-input').fill('mark-renamed');
    await page.screenshot({
      path: path.join(outDir, 'g01-menubar-edit-rename.png'),
      fullPage: true,
    });
    await page.getByTestId('menu-rename-apply').click();
    const name = await page.evaluate(() => {
      const hook = window.__wssM06;
      const ann = hook?.session.annotations.annotations.find((a) => a.id === 'm-g01');
      return ann?.name ?? null;
    });
    expect(name).toBe('mark-renamed');

    // At full 0..1, zoom-out is a no-op; zoom-in first to create history entries.
    await page.getByTestId('nav-zoom-in').click();
    await page.getByTestId('nav-zoom-in').click();
    await page.getByTestId('nav-zoom-out').click();
    await page.getByTestId('menubar-view').click();
    await expect(page.getByTestId('menu-view-back')).toBeEnabled();
    await page.screenshot({
      path: path.join(outDir, 'g01-menubar-view-history.png'),
      fullPage: true,
    });
    await page.getByTestId('menu-view-back').click();
    await page.getByTestId('menubar-view').click();
    await expect(page.getByTestId('menu-view-forward')).toBeEnabled();
    await page.getByTestId('menu-view-forward').click();
  });
