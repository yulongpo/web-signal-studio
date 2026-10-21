import { expect, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/** Bot-B wave6: G19 edit + G07 worker chrome + G02 + G08 right collapse. No PASS. */
test.describe('Bot-B wave6 G19/G07/G02/G08 (no PASS)', () => {
  const outDir = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/bot-b');

  test('G19 annotation inline edit chrome', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('rail-tab-marker').click();
    await expect(page.getByTestId('m06-panel')).toHaveAttribute(
      'data-annotation-edit',
      'inline-replaceMark',
    );
    await expect(page.getByTestId('m06-edit-mark')).toBeDisabled();
    await page.getByTestId('bottom-tab-marks').click();
    await expect(page.getByTestId('bottom-pane-marks')).toHaveAttribute(
      'data-annotation-edit',
      'inline-replaceMark',
    );
    await expect(page.getByTestId('bottom-edit-mark')).toBeDisabled();
    await page.screenshot({ path: path.join(outDir, 'g19-edit-wave6.png'), fullPage: true });
  });

  test('G07 detect worker residual chrome', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('bottom-tab-tasks').click();
    await expect(page.getByTestId('bottom-detect-inspector')).toHaveAttribute(
      'data-worker-chrome',
      'qt-residual',
    );
    await expect(page.getByTestId('bottom-detect-inspector-progress')).toBeVisible();
    await expect(page.getByTestId('bottom-detect-inspector-runid')).toBeVisible();
    await expect(page.getByTestId('bottom-detect-inspector-history')).toBeVisible();
    await expect(page.getByTestId('bottom-detect-inspector-blocks')).toBeVisible();
    await expect(page.getByTestId('bottom-detect-inspector-result')).toBeVisible();
    await page.screenshot({ path: path.join(outDir, 'g07-worker-chrome-wave6.png'), fullPage: true });
  });

  test('G02 broader strip QLabels', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await expect(page.getByTestId('chart-strip-qlabel-stft-value')).toBeVisible();
    await expect(page.getByTestId('chart-strip-qlabel-palette-value')).toBeVisible();
    await page.getByTestId('btn-toolbar-overflow').click();
    await expect(page.getByTestId('overflow-qlabel-iq')).toBeVisible();
    await expect(page.getByTestId('overflow-qlabel-workspace')).toBeVisible();
    await page.screenshot({ path: path.join(outDir, 'g02-broader-wave6.png'), fullPage: true });
  });

  test('G08 right-rail collapse-to-min', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    const body = page.getByTestId('app-shell-body');
    await page.getByTestId('shell-col-resize-right').dblclick();
    await expect(body).toHaveAttribute('data-shell-right-collapsed', 'true');
    await expect(body).toHaveAttribute('data-shell-right-collapse-min', '8');
    await page.screenshot({ path: path.join(outDir, 'g08-right-collapse-wave6.png'), fullPage: true });
  });
});
