import { expect, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/** Bot-B G07 bottom + G06 page chrome + G02 captions — WIP / not ACCEPTANCE PASS. */
test.describe('G07 bottom + G06 page chrome + G02 captions (Bot-B)', () => {
  const outDir = path.resolve(
    process.cwd(),
    '../../artifacts/validation/ui-parity/bot-b',
  );

  test('G07 bottom panel tabs, task progress, log strip', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    const panel = page.getByTestId('bottom-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('data-expanded', 'false');
    const box = await panel.boundingBox();
    expect(box).toBeTruthy();
    expect(Math.abs((box?.height ?? 0) - 29)).toBeLessThanOrEqual(3);
    await expect(page.getByTestId('bottom-task-progress')).toBeVisible();
    await expect(page.getByTestId('bottom-task-bar')).toBeVisible();

    await page.getByTestId('bottom-tab-tasks').click();
    await expect(panel).toHaveAttribute('data-expanded', 'true');
    await expect(page.getByTestId('bottom-content')).toBeVisible();
    await expect(page.getByTestId('bottom-task-summary')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g07-bottom-tasks.png'),
      fullPage: true,
    });

    await page.getByTestId('bottom-tab-log').click();
    await expect(page.getByTestId('bottom-log-strip')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g07-bottom-log.png'),
      fullPage: true,
    });

    await page.getByTestId('bottom-toggle').click();
    await expect(panel).toHaveAttribute('data-expanded', 'false');
  });

  test('G06 narrowband page chrome (Bot-D pipelines; shell only)', async ({
    page,
  }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('btn-workspace-narrowband').click();
    await expect(page.getByTestId('workspace-narrowband')).toBeVisible();

    await page.getByTestId('nb-page-modulation').click();
    await expect(page.getByTestId('workspace-narrowband-modulation')).toBeVisible();
    await expect(page.getByTestId('nb-modulation-pipeline')).toBeVisible();
    await expect(page.getByTestId('nb-modulation-note')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g06-modulation-controls.png'),
      fullPage: true,
    });

    await page.getByTestId('nb-page-deep-learning').click();
    await expect(page.getByTestId('workspace-narrowband-deep-learning')).toBeVisible();
    await expect(page.getByTestId('nb-dl-config')).toBeVisible();
    await expect(page.getByTestId('nb-dl-note')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g06-dl-controls.png'),
      fullPage: true,
    });

    await page.getByTestId('nb-page-demodulation').click();
    await expect(page.getByTestId('workspace-narrowband-demodulation')).toBeVisible();
    await expect(page.getByTestId('nb-demod-pipeline')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g06-demod-controls.png'),
      fullPage: true,
    });

    await page.getByTestId('nb-page-observe').click();
    await expect(page.getByTestId('workspace-narrowband-observe')).toBeVisible();
  });

  test('G02 chart strip captions / header toolbar habit', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await expect(page.getByTestId('chart-strip-main')).toBeVisible();
    const caption = page.getByTestId('chart-caption-main');
    if (await caption.count()) {
      await expect(caption).toBeVisible();
    }
    await expect(page.getByTestId('chart-header-toolbar')).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, 'g02-captions.png'),
      fullPage: true,
    });
  });
});
