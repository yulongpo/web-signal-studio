import { expect, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/** Bot-B wave7 short deepen. No PASS. */
test.describe('Bot-B wave7 G19/G07/G02/G08 (no PASS)', () => {
  const outDir = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/bot-b');

  test('G19 edit path empty selection evidence', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('bottom-tab-marks').click();
    await expect(page.getByTestId('bottom-pane-marks')).toHaveAttribute('data-edit-path', 'replaceMark');
    await expect(page.getByTestId('bottom-pane-marks')).toHaveAttribute('data-edit-selection', 'empty');
    await expect(page.getByTestId('bottom-edit-mark')).toBeDisabled();
    await expect(page.getByTestId('bottom-edit-empty-hint')).toBeVisible();
    await page.getByTestId('rail-tab-marker').click();
    await expect(page.getByTestId('m06-panel')).toHaveAttribute('data-edit-selection', 'empty');
    await expect(page.getByTestId('m06-edit-empty-hint')).toBeVisible();
    await page.screenshot({ path: path.join(outDir, 'g19-edit-empty-wave7.png'), fullPage: true });
  });

  test('G07 multi-engine slots from real caps only', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('bottom-tab-tasks').click();
    await expect(page.getByTestId('bottom-detect-engine-slots')).toHaveAttribute(
      'data-multi-engine',
      'local-compute-caps',
    );
    await expect(page.getByTestId('bottom-detect-engine-ffscn')).toBeVisible();
    await expect(page.getByTestId('bottom-detect-engine-scn')).toBeVisible();
    await expect(page.getByTestId('bottom-detect-engine-honesty')).toContainText('No invented');
    await page.screenshot({ path: path.join(outDir, 'g07-engine-slots-wave7.png'), fullPage: true });
  });

  test('G02 strip physical caption + Level/Display QLabels', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await expect(page.getByTestId('chart-strip-caption-physical')).toBeVisible();
    await expect(page.getByTestId('chart-strip-qlabel-level-btn')).toBeVisible();
    await expect(page.getByTestId('chart-strip-qlabel-display-btn')).toBeVisible();
    await page.getByTestId('btn-toolbar-overflow').click();
    await expect(page.getByTestId('overflow-qlabel-stft-n')).toBeVisible();
    await page.screenshot({ path: path.join(outDir, 'g02-strip-wave7.png'), fullPage: true });
  });

  test('G08 shell edge hit attrs', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await expect(page.getByTestId('shell-col-resize-left')).toHaveAttribute('data-shell-edge', 'left');
    await expect(page.getByTestId('shell-col-resize-right')).toHaveAttribute('data-shell-edge', 'right');
    await page.getByTestId('bottom-tab-marks').click();
    await expect(page.getByTestId('bottom-panel-resize')).toHaveAttribute('data-shell-edge', 'bottom');
    await expect(page.getByTestId('bottom-panel-resize')).toHaveAttribute('data-hit-min-px', '29');
    await page.screenshot({ path: path.join(outDir, 'g08-shell-edge-wave7.png'), fullPage: true });
  });
});
