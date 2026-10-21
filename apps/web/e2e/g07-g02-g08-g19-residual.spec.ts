import { expect, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/** Bot-B residual G07/G02/G08/G19 — WIP / not ACCEPTANCE PASS. */
test.describe('G07/G02/G08/G19 residuals (Bot-B)', () => {
  const outDir = path.resolve(
    process.cwd(),
    '../../artifacts/validation/ui-parity/bot-b',
  );

  test('G08 column widths ~278/390', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    const body = page.getByTestId('app-shell-body');
    await expect(body).toHaveAttribute('data-shell-columns', /278-390/);
    const box = await body.boundingBox();
    expect(box).toBeTruthy();
    const tree = page.getByTestId('project-tree');
    const rail = page.getByTestId('context-rail');
    const t = await tree.boundingBox();
    const r = await rail.boundingBox();
    expect(t).toBeTruthy();
    expect(r).toBeTruthy();
    expect(Math.abs((t?.width ?? 0) - 278)).toBeLessThanOrEqual(8);
    expect(Math.abs((r?.width ?? 0) - 390)).toBeLessThanOrEqual(12);
    await page.screenshot({
      path: path.join(outDir, 'g08-shell-columns.png'),
      fullPage: true,
    });
  });

  test('G07 annotation/detection dock hosts', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('bottom-tab-marks').click();
    await expect(page.getByTestId('bottom-pane-marks')).toHaveAttribute(
      'data-host',
      'annotation-panel',
    );
    await expect(page.getByTestId('bottom-annotation-toolbar')).toBeVisible();
    await page.getByTestId('bottom-tab-tasks').click();
    await expect(page.getByTestId('bottom-pane-tasks')).toHaveAttribute(
      'data-host',
      'detection-panel',
    );
    await expect(page.getByTestId('bottom-detect-run-list')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g07-dock-hosts.png'),
      fullPage: true,
    });
  });

  test('G02 chart-header toolbar + overflow focus', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await expect(page.getByTestId('chart-strip-main')).toHaveAttribute(
      'data-toolbar-habit',
      'retired-aux-main',
    );
    await expect(page.getByTestId('chart-header-toolbar')).toBeVisible();
    // no free-floating legacy spectrum-toolbar testid
    await expect(page.getByTestId('spectrum-toolbar')).toHaveCount(0);
    await page.getByTestId('btn-toolbar-overflow').click();
    const menu = page.getByTestId('toolbar-overflow-menu');
    await expect(menu).toBeVisible();
    await expect(page.getByTestId('select-stft-n')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await page.screenshot({
      path: path.join(outDir, 'g02-overflow-focus.png'),
      fullPage: true,
    });
  });

  test('G19 tree presentation detail/badges', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('btn-load-sample').click();
    await expect(page.getByTestId('project-tree-sample')).toHaveAttribute(
      'data-presentation',
      'desktop-cn-chrome',
    );
    await page.screenshot({
      path: path.join(outDir, 'g19-tree-presentation.png'),
      fullPage: true,
    });
  });

  test('G18 display-summary 参考/动态', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('rail-tab-display').click();
    const summary = page.getByTestId('display-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText('参考');
    await expect(summary).toContainText('动态');
    await page.screenshot({
      path: path.join(outDir, 'g18-display-summary.png'),
      fullPage: true,
    });
  });

});
