/**
 * Bot-G gesture / ROI / Level screenshot evidence @ tip 3d7ab59.
 * Out: artifacts/validation/ui-parity/qa/web-3d7ab59/
 * Compare notes vs desktop 17471a6 — does NOT claim PASS.
 * G26 IQ: signal_studio_rebuild/resources/sigmf_data_demo only.
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-3d7ab59');
const REBUILD_IQ = path.resolve(
  'D:/project/signal_studio_rebuild/resources/sigmf_data_demo',
);
const SIGMF_META = path.join(REBUILD_IQ, '0000000.sigmf-meta');
const SIGMF_DATA = path.join(REBUILD_IQ, '0000000.sigmf-data');
const TIP = '3d7ab591a0e4ee09b6a03286b528f32c3196a45d';
const DESKTOP_TIP = '17471a6488383b456281d12cb1a6d3d80290205d';

function ensure() {
  fs.mkdirSync(OUT, { recursive: true });
}

async function shot(page: Page, name: string) {
  ensure();
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}

async function openDemoIq(page: Page) {
  const menubarIq = page.getByTestId('menubar-input-iq');
  const legacyIq = page.getByTestId('input-iq-wav');
  if ((await menubarIq.count()) > 0) {
    await menubarIq.setInputFiles([SIGMF_META, SIGMF_DATA]);
  } else {
    await expect(legacyIq).toBeAttached();
    await legacyIq.setInputFiles([SIGMF_META, SIGMF_DATA]);
  }
  const host = page.getByTestId('main-chart-host');
  await expect
    .poll(async () => {
      const s = await host.getAttribute('data-dsp-source');
      if (!s || s === 'loading') return null;
      return s;
    }, { timeout: 30000 })
    .not.toBeNull();
}

async function waitChart(page: Page) {
  const host = page.getByTestId('main-chart-host');
  const chart = page.getByTestId('chart-main');
  await expect(chart).toBeVisible({ timeout: 20000 });
  await expect(chart).toHaveAttribute('data-wheel-model', 'desktop-axis');
  return { host, chart };
}

test.describe('Bot-G zoom/ROI/Level screenshots (evidence, NOT PASS)', () => {
  test.setTimeout(240_000);

  test('capture zoom-box, view-back, ROI→detect, Level @ 3d7ab59', async ({ page }) => {
    ensure();
    expect(fs.existsSync(SIGMF_META)).toBe(true);
    expect(fs.existsSync(SIGMF_DATA)).toBe(true);

    const notes: Record<string, unknown> = {
      id: 'qa-web-3d7ab59-gesture-roi-level',
      tip_web: TIP,
      tip_desktop_compare: DESKTOP_TIP,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      g26_iq: SIGMF_META,
      captures: [] as string[],
      observations: {} as Record<string, unknown>,
    };

    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 20000 });
    await openDemoIq(page);
    const { host, chart } = await waitChart(page);
    await page.waitForTimeout(400);

    const statusFile = await page.getByTestId('status-file').innerText().catch(() => null);
    (notes.observations as Record<string, unknown>).status_file = statusFile;
    (notes.observations as Record<string, unknown>).dsp_source =
      await host.getAttribute('data-dsp-source');

    // ----- 1) zoom-box -----
    const xMax0 = await chart.getAttribute('data-view-x-max');
    await chart.click({ button: 'right', position: { x: 180, y: 140 } });
    await expect(page.getByTestId('chart-context-menu')).toBeVisible();
    await page.getByTestId('chart-menu-zoom').click();
    await expect(chart).toHaveAttribute('data-gesture', 'zoom-box');
    const box = await chart.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + 160, box!.y + 120);
    await page.mouse.down();
    await page.mouse.move(box!.x + 420, box!.y + 360, { steps: 8 });
    await expect(page.getByTestId('chart-box-select')).toBeVisible().catch(async () => {
      // some builds use different overlay id during zoom
    });
    await shot(page, '01-zoom-box-drag.png');
    (notes.captures as string[]).push('01-zoom-box-drag.png');
    await page.mouse.up();
    await expect.poll(async () => chart.getAttribute('data-view-x-max')).not.toBe(xMax0);
    await page.waitForTimeout(200);
    await shot(page, '01b-zoom-box-applied.png');
    (notes.captures as string[]).push('01b-zoom-box-applied.png');
    (notes.observations as Record<string, unknown>).zoom_box = {
      view_x_max_before: xMax0,
      view_x_max_after: await chart.getAttribute('data-view-x-max'),
      gesture: await chart.getAttribute('data-gesture'),
    };

    // ----- 2) view back -----
    await chart.click({ button: 'right', position: { x: 180, y: 140 } });
    await expect(page.getByTestId('chart-menu-view-back')).toBeEnabled();
    await shot(page, '02-view-back-menu.png');
    (notes.captures as string[]).push('02-view-back-menu.png');
    await page.getByTestId('chart-menu-view-back').click();
    await expect.poll(async () => chart.getAttribute('data-view-x-max')).toBe(xMax0);
    await page.waitForTimeout(200);
    await shot(page, '02b-view-back-restored.png');
    (notes.captures as string[]).push('02b-view-back-restored.png');
    (notes.observations as Record<string, unknown>).view_back = {
      restored_view_x_max: await chart.getAttribute('data-view-x-max'),
      matches_pre_zoom: (await chart.getAttribute('data-view-x-max')) === xMax0,
    };

    // ----- 3) ROI confirm → Detect range -----
    await page.getByTestId('rail-tab-detect').click();
    const range = page.getByTestId('detect-sample-range');
    await expect(range).toBeVisible({ timeout: 10000 });
    await chart.click({ button: 'right', position: { x: 200, y: 160 } });
    await page.getByTestId('chart-menu-roi').click();
    await expect(host).toHaveAttribute('data-active-tool', 'detection-roi');
    await page.mouse.move(box!.x + 140, box!.y + 100);
    await page.mouse.down();
    await page.mouse.move(box!.x + 360, box!.y + 280, { steps: 6 });
    await page.mouse.up();
    const confirm = page.getByTestId('detection-roi-confirmation');
    await expect(confirm).toBeVisible();
    const roiStart = await confirm.getAttribute('data-start');
    const roiEnd = await confirm.getAttribute('data-end');
    await shot(page, '03-roi-confirmation.png');
    (notes.captures as string[]).push('03-roi-confirmation.png');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('rail-page-detect')).toBeVisible();
    await expect(range).toHaveAttribute('data-range-source', 'roi');
    await expect(range).toHaveAttribute('data-start', roiStart!);
    await expect(range).toHaveAttribute('data-end', roiEnd!);
    await page.waitForTimeout(250);
    await shot(page, '03b-detect-range-from-roi.png');
    (notes.captures as string[]).push('03b-detect-range-from-roi.png');
    if ((await page.getByTestId('detect-sample-range').count()) > 0) {
      await page.getByTestId('detect-sample-range').screenshot({
        path: path.join(OUT, '03c-detect-sample-range-crop.png'),
      });
      (notes.captures as string[]).push('03c-detect-sample-range-crop.png');
    }
    (notes.observations as Record<string, unknown>).roi_to_detect = {
      roi_start: roiStart,
      roi_end: roiEnd,
      range_source: await range.getAttribute('data-range-source'),
      range_start: await range.getAttribute('data-start'),
      range_end: await range.getAttribute('data-end'),
      task_status: await page.getByTestId('detect-task-status').innerText().catch(() => null),
    };

    // ----- 4) Level ref / dynamic popover -----
    const levelBtn = page.getByTestId('btn-open-level');
    await expect(levelBtn.first()).toBeVisible();
    await levelBtn.first().click();
    const levelPanel = page.getByTestId('temp-layer-level');
    await expect(levelPanel).toBeVisible();
    await expect(page.getByTestId('level-ref')).toBeVisible();
    await expect(page.getByTestId('level-range')).toBeVisible();
    await page.getByTestId('level-ref').fill('-15');
    await page.getByTestId('level-range').fill('80');
    await page.waitForTimeout(150);
    await shot(page, '04-level-popover.png');
    (notes.captures as string[]).push('04-level-popover.png');
    await levelPanel.screenshot({ path: path.join(OUT, '04b-level-popover-crop.png') });
    (notes.captures as string[]).push('04b-level-popover-crop.png');
    const refSummary = await page.getByTestId('level-ref-summary').innerText();
    const rangeSummary = await page.getByTestId('level-range-summary').innerText();
    (notes.observations as Record<string, unknown>).level = {
      ref_summary: refSummary,
      range_summary: rangeSummary,
      ref_value: await page.getByTestId('level-ref').inputValue(),
      range_value: await page.getByTestId('level-range').inputValue(),
      panel: 'temp-layer-level',
    };
    // Apply so chart reflects; optional screenshot after
    if ((await page.getByTestId('level-apply').count()) > 0) {
      await page.getByTestId('level-apply').click();
      await page.waitForTimeout(200);
      await shot(page, '04c-level-applied.png');
      (notes.captures as string[]).push('04c-level-applied.png');
    }

    (notes.observations as Record<string, unknown>).desktop_compare =
      'Reference baseline/desktop @ 17471a6 (primary + archival); no fresh desktop re-capture this turn.';
    (notes.observations as Record<string, unknown>).gaps =
      'No PASS. Desktop side-by-side interactive gestures not re-shot. G01 corner/File owned by Bot-B parallel.';

    fs.writeFileSync(
      path.join(OUT, 'capture-notes.json'),
      JSON.stringify(notes, null, 2) + '\n',
      'utf8',
    );
  });
});
