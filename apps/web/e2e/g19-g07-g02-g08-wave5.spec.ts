import { expect, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/** Bot-B wave5: G19 full Qt column matrix + G07 live Detect feeds + G02 chrome + G08 collapse-to-min. No PASS. */
test.describe('Bot-B wave5 G19/G07/G02/G08 (no PASS)', () => {
  const outDir = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/bot-b');

  test('G19 full Qt annotation column matrix', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('bottom-tab-marks').click();
    const header = page.getByTestId('bottom-annotation-table-header');
    await expect(header).toHaveAttribute('data-column-matrix', 'qt-full');
    await expect(header.getByText('annotationId')).toBeVisible();
    await expect(header.getByText('/ ms').first()).toBeVisible();
    await expect(header.getByText('mean')).toBeVisible();
    await page.getByTestId('rail-tab-marker').click();
    await expect(page.getByTestId('annotation-table-header')).toHaveAttribute(
      'data-column-matrix',
      'qt-full',
    );
    await page.screenshot({
      path: path.join(outDir, 'g19-column-matrix-wave5.png'),
      fullPage: true,
    });
  });

  test('G07 live Detect feed shell (honest empty until real runs)', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('bottom-tab-tasks').click();
    await expect(page.getByTestId('bottom-detect-run-list')).toHaveAttribute(
      'data-live-feed',
      'local-compute',
    );
    await expect(page.getByTestId('bottom-detect-run-empty')).toBeVisible();
    await expect(page.getByTestId('bottom-detect-refresh')).toBeDisabled();
    await expect(page.getByTestId('bottom-detect-inspector-engine')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g07-live-detect-feed-wave5.png'),
      fullPage: true,
    });
  });

  test('G02 broader chrome QLabels', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await expect(page.getByTestId('chart-strip-qlabel-mode')).toBeVisible();
    await expect(page.getByTestId('chart-strip-qlabel-workspace')).toBeVisible();
    await page.getByTestId('btn-toolbar-overflow').click();
    await expect(page.getByTestId('overflow-qlabel-level')).toBeVisible();
    await expect(page.getByTestId('overflow-qlabel-caption')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g02-broader-chrome-wave5.png'),
      fullPage: true,
    });
  });

  test('G08 collapse-to-min bottom + left column', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('bottom-tab-marks').click();
    const panel = page.getByTestId('bottom-panel');
    await expect(panel).toHaveAttribute('data-expanded', 'true');
    await page.getByTestId('bottom-panel-resize').dblclick();
    await expect(panel).toHaveAttribute('data-collapsed-min', 'true');
    await expect(panel).toHaveAttribute('data-expanded', 'false');
    const body = page.getByTestId('app-shell-body');
    await page.getByTestId('shell-col-resize-left').dblclick();
    await expect(body).toHaveAttribute('data-shell-left-collapsed', 'true');
    await expect(body).toHaveAttribute('data-shell-collapse-min', '8');
    await page.screenshot({
      path: path.join(outDir, 'g08-collapse-to-min-wave5.png'),
      fullPage: true,
    });
  });
});
