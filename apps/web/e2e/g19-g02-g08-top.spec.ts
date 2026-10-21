import { expect, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/** Bot-B G19 annotation paint + G02 strip QLabel + G08 resize — WIP / no PASS. */
test.describe('G19/G02/G08/G07 TOP (Bot-B)', () => {
  const outDir = path.resolve(
    process.cwd(),
    '../../artifacts/validation/ui-parity/bot-b',
  );

  test('G08 column widths default 278/390 + resize handles', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    const body = page.getByTestId('app-shell-body');
    await expect(body).toHaveAttribute('data-shell-resizable', 'true');
    await expect(body).toHaveAttribute('data-shell-columns', /278-390/);
    await expect(page.getByTestId('shell-col-resize-left')).toBeVisible();
    await expect(page.getByTestId('shell-col-resize-right')).toBeVisible();
    const tree = page.getByTestId('project-tree');
    const rail = page.getByTestId('context-rail');
    const t = await tree.boundingBox();
    const r = await rail.boundingBox();
    expect(Math.abs((t?.width ?? 0) - 278)).toBeLessThanOrEqual(10);
    expect(Math.abs((r?.width ?? 0) - 390)).toBeLessThanOrEqual(14);
    await page.screenshot({
      path: path.join(outDir, 'g08-columns-resize.png'),
      fullPage: true,
    });
  });

  test('G02 strip QLabel chrome', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await expect(page.getByTestId('chart-strip-qlabel-level')).toBeVisible();
    await expect(page.getByTestId('chart-strip-qlabel-level')).toContainText('参考');
    await expect(page.getByTestId('chart-strip-qlabel-level')).toContainText('动态');
    await expect(page.getByTestId('chart-strip-qlabel-stft')).toContainText('STFT');
    await expect(page.getByTestId('chart-strip-qlabel-palette')).toContainText('色板');
    await page.screenshot({
      path: path.join(outDir, 'g02-strip-qlabel.png'),
      fullPage: true,
    });
  });

  test('G19 AnnotationPanel multi-select paint chrome', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('rail-tab-marker').click();
    const panel = page.getByTestId('m06-panel');
    await expect(panel).toHaveAttribute('data-annotation-panel', 'true');
    await expect(page.getByTestId('m06-mark-list')).toHaveAttribute(
      'data-annotation-paint',
      'desktop-multi',
    );
    await expect(page.getByTestId('annotation-selection-summary')).toContainText('已选');
    await expect(page.getByTestId('annotation-select-all')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g19-annotation-multi-paint.png'),
      fullPage: true,
    });
  });

  test('G07 AnnotationPanel / DetectionPanel shell', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('bottom-tab-marks').click();
    await expect(page.getByTestId('bottom-pane-marks')).toHaveAttribute(
      'data-panel-shell',
      'annotation-panel',
    );
    await expect(page.getByTestId('bottom-annotation-selection-summary')).toContainText('已选');
    await expect(page.getByTestId('bottom-mark-list')).toHaveAttribute(
      'data-annotation-paint',
      'desktop-multi',
    );
    await page.getByTestId('bottom-tab-tasks').click();
    await expect(page.getByTestId('bottom-pane-tasks')).toHaveAttribute(
      'data-panel-shell',
      'detection-panel',
    );
    await expect(page.getByTestId('bottom-detection-shell')).toBeVisible();
    await expect(page.getByTestId('bottom-detect-run-list')).toBeVisible();
    await expect(page.getByTestId('bottom-detect-col-detail')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g07-annotation-detection-shell.png'),
      fullPage: true,
    });
  });

});
