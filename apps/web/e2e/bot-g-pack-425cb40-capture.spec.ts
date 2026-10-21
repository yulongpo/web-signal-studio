/**
 * Bot-G pack @ 425cb40 = B residual (e9153b8) + C G11 box-zoom + G02 physical caption.
 * Out: qa/web-425cb40/  Desktop 17471a6. ui_parity_pass_claimed: false
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-425cb40');
const TIP = '425cb400f8ccf10e2ca82b8d86330a851fd79965';
const PRIOR_B = 'e9153b861b80ee61100cf6a6b29b6d76d36f60a5';
const DESKTOP = '17471a6488383b456281d12cb1a6d3d80290205d';
const META = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo/0000000.sigmf-meta';
const DATA = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo/0000000.sigmf-data';

function ensure() { fs.mkdirSync(OUT, { recursive: true }); }
async function shot(page: Page, name: string) {
  ensure();
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}

test.describe('Bot-G pack 425cb40 NOT PASS', () => {
  test.setTimeout(150_000);
  test('G18/tooltip/G07/G02/G08/G19 + box-zoom + physical caption', async ({ page }) => {
    ensure();
    const notes: any = {
      id: 'qa-web-425cb40-combined',
      tip_web: TIP,
      tip_includes_b: PRIOR_B,
      tip_desktop_compare: DESKTOP,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      captures: [] as string[],
      observations: {} as any,
    };
    const push = (n: string) => notes.captures.push(n);
    const o = notes.observations;

    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 20000 });
    // optional IQ for chart gestures
    const iq = page.getByTestId('menubar-input-iq');
    if (await iq.count()) await iq.setInputFiles([META, DATA]);
    else if (await page.getByTestId('input-iq-wav').count())
      await page.getByTestId('input-iq-wav').setInputFiles([META, DATA]);
    await page.waitForTimeout(700);

    // G08
    const body = page.getByTestId('app-shell-body');
    await expect(body).toHaveAttribute('data-shell-columns', '278-390');
    o.g08 = { cols: await body.getAttribute('data-shell-columns') };
    await shot(page, '01-g08-shell-columns.png'); push('01-g08-shell-columns.png');

    // G02 chart-header
    await expect(page.getByTestId('chart-header-toolbar')).toBeVisible();
    await expect(page.getByTestId('spectrum-toolbar')).toHaveCount(0);
    await page.getByTestId('chart-strip-main').screenshot({ path: path.join(OUT, '02-g02-chart-header.png') });
    push('02-g02-chart-header.png');
    await page.getByTestId('btn-toolbar-overflow').click();
    await expect(page.getByTestId('toolbar-overflow-menu')).toBeVisible();
    await shot(page, '02b-g02-chart-header-overflow.png'); push('02b-g02-chart-header-overflow.png');
    await page.keyboard.press('Escape');

    // G02 physical axis caption
    const chart = page.getByTestId('chart-main');
    await expect(chart).toBeVisible({ timeout: 15000 });
    const caption = page.getByTestId('chart-physical-caption');
    await expect(caption).toBeVisible({ timeout: 10000 });
    await caption.screenshot({ path: path.join(OUT, '02c-g02-physical-caption.png') });
    push('02c-g02-physical-caption.png');
    o.g02_physical = {
      text: (await caption.innerText()).slice(0, 200),
      x_min: await caption.getAttribute('data-x-min'),
      x_max: await caption.getAttribute('data-x-max'),
      y_min: await caption.getAttribute('data-y-min'),
      y_max: await caption.getAttribute('data-y-max'),
    };
    await shot(page, '02d-g02-physical-caption-context.png'); push('02d-g02-physical-caption-context.png');

    // G07 dock
    const bottom = page.getByTestId('bottom-panel');
    await expect(bottom).toHaveAttribute('data-dock', 'annotation-detection');
    await page.getByTestId('bottom-tab-marks').click();
    await expect(page.getByTestId('bottom-pane-marks')).toHaveAttribute('data-host', 'annotation-panel');
    await shot(page, '03-g07-dock-marks.png'); push('03-g07-dock-marks.png');
    await page.getByTestId('bottom-tab-tasks').click();
    await expect(page.getByTestId('bottom-pane-tasks')).toHaveAttribute('data-host', 'detection-panel');
    await shot(page, '03b-g07-dock-tasks.png'); push('03b-g07-dock-tasks.png');
    await bottom.screenshot({ path: path.join(OUT, '03c-g07-dock-crop.png') });
    push('03c-g07-dock-crop.png');
    o.g07 = { dock: await bottom.getAttribute('data-dock') };

    // G18
    await page.getByTestId('rail-tab-display').click();
    const summary = page.getByTestId('display-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText(/参/);
    await expect(summary).toContainText(/动/);
    await shot(page, '04-g18-display-summary.png'); push('04-g18-display-summary.png');
    await summary.screenshot({ path: path.join(OUT, '04b-g18-display-summary-crop.png') });
    push('04b-g18-display-summary-crop.png');
    o.g18 = { text: (await summary.innerText()).slice(0, 240) };

    // G19 + tooltip
    await page.getByTestId('btn-load-sample').click();
    await expect(page.getByTestId('project-tree-sample')).toHaveAttribute('data-presentation', 'desktop-compact');
    await shot(page, '05-g19-tree-fields.png'); push('05-g19-tree-fields.png');
    await page.getByTestId('project-tree').screenshot({ path: path.join(OUT, '05b-g19-tree-crop.png') });
    push('05b-g19-tree-crop.png');
    const tipNode = page.locator('[data-has-tooltip="true"]').first();
    const label = (await tipNode.count())
      ? tipNode.locator('[data-testid^="tree-label-"], [data-testid^="tree-mark-"]').first()
      : page.locator('[data-testid^="tree-label-"]').first();
    const tipTarget = (await label.count()) ? label : page.locator('[data-testid^="tree-label-"]').first();
    o.g19 = {
      presentation: await page.getByTestId('project-tree-sample').getAttribute('data-presentation'),
      tooltip_title: await tipTarget.getAttribute('title'),
      has_tooltip_nodes: await page.locator('[data-has-tooltip="true"]').count(),
      kinds: await page.locator('[data-tree-kind]').evaluateAll((els) =>
        [...new Set(els.map((e) => e.getAttribute('data-tree-kind')))]),
    };
    await tipTarget.hover();
    await page.waitForTimeout(200);
    await page.getByTestId('project-tree').screenshot({ path: path.join(OUT, '06-project-tree-tooltip.png') });
    push('06-project-tree-tooltip.png');
    await shot(page, '06b-project-tree-tooltip-context.png'); push('06b-project-tree-tooltip-context.png');

    // G11 box-zoom
    const host = page.getByTestId('main-chart-host');
    await expect(chart).toHaveAttribute('data-box-zoom-min-px', '8');
    const before = await chart.getAttribute('data-view-x-max');
    const box = await chart.boundingBox();
    await page.mouse.move(box!.x + 160, box!.y + 120);
    await page.mouse.down();
    await page.mouse.move(box!.x + 400, box!.y + 340, { steps: 5 });
    await shot(page, '07-g11-box-zoom-drag.png'); push('07-g11-box-zoom-drag.png');
    await page.mouse.up();
    await page.waitForTimeout(250);
    await shot(page, '07b-g11-box-zoom-applied.png'); push('07b-g11-box-zoom-applied.png');
    // physical caption after zoom
    await caption.screenshot({ path: path.join(OUT, '07c-g02-physical-caption-after-zoom.png') });
    push('07c-g02-physical-caption-after-zoom.png');
    o.g11 = {
      tool: await host.getAttribute('data-active-tool'),
      gesture: await chart.getAttribute('data-gesture'),
      min_px: await chart.getAttribute('data-box-zoom-min-px'),
      edge_px: await chart.getAttribute('data-box-zoom-min-edge-px'),
      before,
      after: await chart.getAttribute('data-view-x-max'),
      caption_after: {
        x_min: await caption.getAttribute('data-x-min'),
        x_max: await caption.getAttribute('data-x-max'),
      },
    };

    o.gaps = 'No PASS. Desktop 17471a6 ref only. Folded e9153b8 B shots + C box-zoom/physical caption @ 425cb40.';
    fs.writeFileSync(path.join(OUT, 'capture-notes.json'), JSON.stringify(notes, null, 2) + '\n');
  });
});
