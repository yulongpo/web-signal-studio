import { expect, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/** Bot-B G19 table/paging/quality + G07/G02/G08/G18 shell — WIP / no PASS. */
test.describe('G19 table/paging + G07/G02/G08/G18 (Bot-B)', () => {
  const outDir = path.resolve(
    process.cwd(),
    '../../artifacts/validation/ui-parity/bot-b',
  );

  test('G08 bottom height clamp 100-500 + resize handle', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('bottom-tab-marks').click();
    const panel = page.getByTestId('bottom-panel');
    await expect(panel).toHaveAttribute('data-expanded', 'true');
    const handle = page.getByTestId('bottom-panel-resize');
    await expect(handle).toBeVisible();
    const before = Number(await panel.getAttribute('data-bottom-height'));
    expect(before).toBeGreaterThanOrEqual(100);
    expect(before).toBeLessThanOrEqual(500);
    const box = await handle.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y - 80, { steps: 6 });
      await page.mouse.up();
    }
    const after = Number(await panel.getAttribute('data-bottom-height'));
    expect(after).toBeGreaterThanOrEqual(100);
    expect(after).toBeLessThanOrEqual(500);
    expect(after).toBeGreaterThanOrEqual(before);
    await page.screenshot({
      path: path.join(outDir, 'g08-bottom-height-resize.png'),
      fullPage: true,
    });
  });

  test('G02 overflow QLabel CN parity', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('btn-toolbar-overflow').click();
    await expect(page.getByTestId('overflow-qlabel-stft')).toContainText('STFT');
    await expect(page.getByTestId('overflow-qlabel-palette')).toContainText('色板');
    await page.screenshot({
      path: path.join(outDir, 'g02-overflow-qlabel.png'),
      fullPage: true,
    });
  });

  test('G19 annotation table paging quality chrome', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('bottom-tab-marks').click();
    await expect(page.getByTestId('bottom-annotation-table-header')).toBeVisible();
    await expect(page.getByTestId('bottom-annotation-paging')).toBeVisible();
    await expect(page.getByTestId('bottom-annotation-page-size')).toContainText('200');
    await expect(page.getByTestId('bottom-annotation-quality-menu')).toBeVisible();
    await expect(page.getByTestId('bottom-annotation-selection-summary')).toContainText('页');
    await page.getByTestId('rail-tab-marker').click();
    await expect(page.getByTestId('annotation-paging')).toBeVisible();
    await expect(page.getByTestId('annotation-quality-filter')).toBeVisible();
    await expect(page.getByTestId('annotation-table-header')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g19-annotation-table-paging.png'),
      fullPage: true,
    });
  });

  test('G07 fuller AnnotationPanel / DetectionPanel', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('bottom-tab-marks').click();
    await expect(page.getByTestId('bottom-pane-marks')).toHaveAttribute(
      'data-panel-shell',
      'annotation-panel',
    );
    await expect(page.getByTestId('bottom-quality-accept')).toBeDisabled();
    await page.getByTestId('bottom-tab-tasks').click();
    await expect(page.getByTestId('bottom-detect-table-header')).toBeVisible();
    await expect(page.getByTestId('bottom-detect-inspector')).toBeVisible();
    await expect(page.getByTestId('bottom-detect-status-filter')).toBeVisible();
    await expect(page.getByTestId('bottom-detect-run-empty')).toContainText('暂无检测');
    await page.screenshot({
      path: path.join(outDir, 'g07-annotation-detection-fuller.png'),
      fullPage: true,
    });
  });

  test('G18 display-summary shell STFT/palette; PSD mode owned by C/D', async ({
    page,
  }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('rail-tab-display').click();
    const summary = page.getByTestId('display-summary');
    await expect(summary).toContainText('STFT N');
    await expect(summary).toContainText('PSD N');
    await expect(summary).toContainText('参考');
    await expect(summary).toContainText('动态');
    await page.screenshot({
      path: path.join(outDir, 'g18-display-summary-shell.png'),
      fullPage: true,
    });
  });
});
