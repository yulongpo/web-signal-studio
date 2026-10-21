/**
 * Chart gesture + detection ROI wiring.
 * Does not claim UI_PARITY_ACCEPTANCE PASS. Desktop header chrome stays with bot B.
 */
import { expect, test } from '@playwright/test';

async function waitChart(page: import('@playwright/test').Page) {
  const host = page.getByTestId('main-chart-host');
  await expect
    .poll(async () => host.getAttribute('data-dsp-source'), { timeout: 20_000 })
    .not.toBe('loading');
  const chart = page.getByTestId('chart-main');
  await expect(chart).toHaveAttribute('data-wheel-model', 'desktop-axis');
  await expect(chart).toHaveAttribute('data-box-zoom-min-px', '8');
  return { host, chart };
}

function span(min: string | null, max: string | null) {
  return Number(max) - Number(min);
}

test.describe('chart gestures and detection range', () => {
  test('axis wheel zooms only the axis under the pointer', async ({ page }) => {
    await page.goto('/');
    const { chart } = await waitChart(page);
    const box = await chart.boundingBox();
    expect(box).toBeTruthy();
    const x0 = await chart.getAttribute('data-view-x-min');
    const y0 = await chart.getAttribute('data-view-y-min');
    const yMax0 = await chart.getAttribute('data-view-y-max');

    await page.mouse.move(box!.x + 8, box!.y + box!.height / 2);
    await page.mouse.wheel(0, -120);
    await expect.poll(async () => chart.getAttribute('data-view-y-min')).not.toBe(y0);
    expect(await chart.getAttribute('data-view-x-min')).toBe(x0);

    const yAfter = await chart.getAttribute('data-view-y-min');
    const yMaxAfter = await chart.getAttribute('data-view-y-max');
    await page.mouse.move(box!.x + box!.width / 2, box!.y + 80);
    await page.mouse.wheel(0, -120);
    await expect.poll(async () => chart.getAttribute('data-view-x-min')).not.toBe(x0);
    expect(await chart.getAttribute('data-view-y-min')).toBe(yAfter);
    expect(await chart.getAttribute('data-view-y-max')).toBe(yMaxAfter);
    expect(span(yAfter, yMaxAfter)).toBeLessThan(span(y0, yMax0));
  });

  test('context menu uses detection ROI, Esc leaves the range, Enter writes it', async ({
    page,
  }) => {
    await page.goto('/');
    const { host, chart } = await waitChart(page);
    await page.getByTestId('rail-tab-detect').click();
    const range = page.getByTestId('detect-sample-range');
    await expect(range).toHaveAttribute('data-range-source', 'default');
    const start0 = await range.getAttribute('data-start');
    const end0 = await range.getAttribute('data-end');

    await chart.click({ button: 'right', position: { x: 200, y: 160 } });
    const menu = page.getByTestId('chart-context-menu');
    await expect(menu).toBeVisible();
    await expect(page.getByTestId('chart-menu-mark')).toBeVisible();
    await expect(page.getByTestId('chart-menu-zoom')).toBeVisible();
    await expect(page.getByTestId('chart-menu-view-back')).toBeVisible();
    await expect(page.getByTestId('chart-menu-view-fit')).toBeVisible();
    await expect(page.getByTestId('chart-menu-view-reset')).toBeVisible();
    await page.getByTestId('chart-menu-roi').click();
    await expect(host).toHaveAttribute('data-active-tool', 'detection-roi');
    await expect(chart).toHaveAttribute('data-gesture', 'box');

    const box = await chart.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + 120, box!.y + 80);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width - 80, box!.y + box!.height - 90, { steps: 8 });
    await expect(page.getByTestId('chart-box-select')).toBeVisible();
    await page.mouse.up();
    const confirm = page.getByTestId('detection-roi-confirmation');
    await expect(confirm).toBeVisible();
    await expect(confirm).toHaveAttribute('data-tool', 'detection-roi');
    await page.keyboard.press('Escape');
    await expect(confirm).toHaveCount(0);
    await expect(range).toHaveAttribute('data-start', start0!);
    await expect(range).toHaveAttribute('data-end', end0!);
    await expect(range).toHaveAttribute('data-range-source', 'default');

    await chart.click({ button: 'right', position: { x: 200, y: 160 } });
    await page.getByTestId('chart-menu-roi').click();
    await page.mouse.move(box!.x + 140, box!.y + 100);
    await page.mouse.down();
    await page.mouse.move(box!.x + 360, box!.y + 280, { steps: 6 });
    await page.mouse.up();
    await expect(confirm).toBeVisible();
    const roiStart = await confirm.getAttribute('data-start');
    const roiEnd = await confirm.getAttribute('data-end');
    expect(roiStart).toMatch(/^\d+$/);
    expect(roiEnd).toMatch(/^\d+$/);
    expect(BigInt(roiEnd!) > BigInt(roiStart!)).toBe(true);
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('rail-page-detect')).toBeVisible();
    await expect(range).toHaveAttribute('data-range-source', 'roi');
    await expect(range).toHaveAttribute('data-start', roiStart!);
    await expect(range).toHaveAttribute('data-end', roiEnd!);
    await expect(page.getByTestId('detect-sample-range-source')).toContainText('不会自动运行');
    await expect(page.getByTestId('detect-task-status')).toContainText('idle');
    await expect(page.getByTestId('detect-candidate-item')).toHaveCount(0);
    await expect(host).toHaveAttribute('data-dsp-source', /synthetic-stft-worker|file-stft-worker|fsa-wav-stft|demo-fallback/);
  });

  test('zoom-box shrinks the view and back restores it', async ({ page }) => {
    await page.goto('/');
    const { chart } = await waitChart(page);
    const before = await chart.getAttribute('data-view-x-max');
    await chart.click({ button: 'right', position: { x: 180, y: 140 } });
    await page.getByTestId('chart-menu-zoom').click();
    await expect(chart).toHaveAttribute('data-gesture', 'zoom-box');
    const box = await chart.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + 160, box!.y + 120);
    await page.mouse.down();
    await page.mouse.move(box!.x + 420, box!.y + 360, { steps: 8 });
    await page.mouse.up();
    await expect.poll(async () => chart.getAttribute('data-view-x-max')).not.toBe(before);
    await chart.click({ button: 'right', position: { x: 180, y: 140 } });
    await expect(page.getByTestId('chart-menu-view-back')).toBeEnabled();
    await page.getByTestId('chart-menu-view-back').click();
    await expect.poll(async () => chart.getAttribute('data-view-x-max')).toBe(before);
  });

  test('persistent mark drag shows on the chart and in the mark list', async ({ page }) => {
    await page.goto('/');
    const { chart } = await waitChart(page);
    await chart.click({ button: 'right', position: { x: 180, y: 140 } });
    await page.getByTestId('chart-menu-mark').click();
    const box = await chart.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + 150, box!.y + 110);
    await page.mouse.down();
    await page.mouse.move(box!.x + 340, box!.y + 260, { steps: 6 });
    await page.mouse.up();
    await expect(page.getByTestId('chart-mark-note')).toContainText('已写入');
    await expect(page.getByTestId('chart-mark-layer')).toHaveAttribute('data-mark-count', '1');
    await page.getByTestId('rail-tab-marker').click();
    await expect(page.getByTestId('m06-mark-count')).toHaveText('marks:1');
  });


  test('navigate box-drag zooms the view (G11)', async ({ page }) => {
    await page.goto('/');
    const { host, chart } = await waitChart(page);
    await expect(host).toHaveAttribute('data-active-tool', 'navigate');
    await expect(chart).toHaveAttribute('data-gesture', 'zoom-box');
    const before = await chart.getAttribute('data-view-x-max');
    const box = await chart.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + 160, box!.y + 120);
    await page.mouse.down();
    await page.mouse.move(box!.x + 420, box!.y + 360, { steps: 8 });
    await page.mouse.up();
    await expect.poll(async () => chart.getAttribute('data-view-x-max')).not.toBe(before);
  });

  test('physical caption exposes live axis ranges (G02)', async ({ page }) => {
    await page.goto('/');
    await waitChart(page);
    const caption = page.getByTestId('chart-physical-caption');
    await expect(caption).toBeVisible();
    await expect(caption).toHaveAttribute('data-x-min', /.+/);
    await expect(caption).toHaveAttribute('data-y-min', /.+/);
  });

  test('header Detection ROI retires select entry (G14)', async ({ page }) => {
    await page.goto('/');
    const { host } = await waitChart(page);
    await page.getByTestId('btn-header-detection-roi').click();
    await expect(host).toHaveAttribute('data-active-tool', 'detection-roi');
  });

});
