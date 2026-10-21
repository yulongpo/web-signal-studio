import { expect, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/** Bot-B G07/G06/G02 shell deepen — WIP / not ACCEPTANCE PASS. */
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

  test('G06 modulation / DL / demod control chrome (no fake results)', async ({
    page,
  }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('btn-workspace-narrowband').click();
    await expect(page.getByTestId('workspace-narrowband')).toBeVisible();

    await page.getByTestId('nb-page-modulation').click();
    await expect(page.getByTestId('nb-modulation-controls')).toBeVisible();
    await expect(page.getByTestId('nb-mod-type')).toBeVisible();
    await expect(page.getByTestId('nb-mod-run')).toBeDisabled();
    await page.getByTestId('nb-mod-type').selectOption('qam');
    await page.getByTestId('nb-mod-symbol-rate').fill('2.5e6');
    await page.screenshot({
      path: path.join(outDir, 'g06-modulation-controls.png'),
      fullPage: true,
    });

    await page.getByTestId('nb-page-deep-learning').click();
    await expect(page.getByTestId('nb-dl-config')).toBeVisible();
    await expect(page.getByTestId('nb-dl-run')).toBeDisabled();
    await expect(page.getByTestId('nb-dl-top5')).toContainText('等待真实识别');
    await page.getByTestId('nb-dl-target-rate').fill('1.024e6');
    await page.screenshot({
      path: path.join(outDir, 'g06-dl-controls.png'),
      fullPage: true,
    });

    // prefs survive page switch
    await page.getByTestId('nb-page-modulation').click();
    await expect(page.getByTestId('nb-mod-type')).toHaveValue('qam');
    await expect(page.getByTestId('nb-mod-symbol-rate')).toHaveValue('2.5e6');

    await page.getByTestId('nb-page-demodulation').click();
    await expect(page.getByTestId('nb-demod-controls')).toBeVisible();
    await expect(page.getByTestId('nb-demod-run')).toBeDisabled();
    await expect(page.getByTestId('nb-demod-export')).toBeDisabled();
    await page.getByTestId('nb-demod-mode').selectOption('fm');
    await page.screenshot({
      path: path.join(outDir, 'g06-demod-controls.png'),
      fullPage: true,
    });
  });

  test('G02 chart strip captions (nav/aux/main)', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await expect(page.getByTestId('chart-strip-caption-nav')).toContainText('全局时间导航');
    await expect(page.getByTestId('chart-strip-caption-aux')).toContainText('辅助分析');
    await expect(page.getByTestId('chart-strip-caption-main')).toContainText('宽带时频谱');
    // demoted toolbar stays chart-header variant, not a free-floating aux↔main bar
    await expect(page.getByTestId('spectrum-toolbar')).toHaveAttribute(
      'data-variant',
      'chart-header',
    );
    await page.screenshot({
      path: path.join(outDir, 'g02-chart-captions.png'),
      fullPage: true,
    });
  });
});
