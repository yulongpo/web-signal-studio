/**
 * Bot-G pack @ e134bb6 (G19 residual + prior gates). Out: qa/web-e134bb6/
 * Desktop 17471a6. ui_parity_pass_claimed: false
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-e134bb6');
const TIP = 'e134bb699232acf00ae4f9632b92d4b792302d32';
const IMPL_BA868E4 = 'ba868e4895bd6170cfa91d3642fe0dd516686242';
const DESKTOP = '17471a6488383b456281d12cb1a6d3d80290205d';
const TOKEN = 'botg-dev-token';
const META = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo/0000000.sigmf-meta';
const DATA = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo/0000000.sigmf-data';

function ensure() { fs.mkdirSync(OUT, { recursive: true }); }
async function shot(page: Page, name: string) {
  ensure();
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}

test.describe('Bot-G pack e134bb6 NOT PASS', () => {
  test.setTimeout(180_000);
  test('detect/tree/G19/G07/G06/G11/G14/G13', async ({ page }) => {
    ensure();
    const notes: any = {
      id: 'qa-web-e134bb6-combined',
      tip_web_sync: TIP,
      tip_impl_ba868e4: IMPL_BA868E4,
      tip_desktop_compare: DESKTOP,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      g26_iq: META,
      captures: [] as string[],
      observations: {} as Record<string, unknown>,
    };
    const push = (n: string) => notes.captures.push(n);
    const o = notes.observations;

    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 20000 });
    const iqIn = page.getByTestId('menubar-input-iq');
    if (await iqIn.count()) await iqIn.setInputFiles([META, DATA]);
    else await page.getByTestId('input-iq-wav').setInputFiles([META, DATA]);
    await page.waitForTimeout(800);

    const host = page.getByTestId('main-chart-host');
    const chart = page.getByTestId('chart-main');
    await expect(chart).toBeVisible({ timeout: 15000 });

    // 1 Detect
    await page.getByTestId('rail-tab-detect').click();
    await page.getByTestId('detect-token-input').fill(TOKEN);
    await page.getByTestId('detect-refresh-caps').click();
    await page.waitForTimeout(1500);
    await shot(page, '01-detect-capabilities.png'); push('01-detect-capabilities.png');
    if (await page.getByTestId('detect-debug-chips').count()) {
      await page.getByTestId('detect-debug-chips').screenshot({ path: path.join(OUT, '01b-detect-debug-chips.png') });
      push('01b-detect-debug-chips.png');
    }
    if (await page.getByTestId('detect-real-runtime').count()) {
      await page.getByTestId('detect-real-runtime').screenshot({ path: path.join(OUT, '01c-detect-real-runtime.png') });
      push('01c-detect-real-runtime.png');
      o.real_runtime = {
        code: await page.getByTestId('detect-real-runtime').getAttribute('data-code'),
        engine: await page.getByTestId('detect-real-runtime').getAttribute('data-engine'),
      };
    }

    // 2+G19 tree three-source / presentation
    await page.getByTestId('btn-load-sample').click();
    await expect(page.getByTestId('project-tree-sample')).toBeVisible({ timeout: 8000 });
    await page.evaluate(() => {
      window.__wssM06?.addManualMark?.({ id: 'm1', name: 'manual-1', start: '0', end: '500' });
    });
    await page.waitForTimeout(300);
    await page.getByTestId('project-tree').screenshot({ path: path.join(OUT, '02-project-tree-three-source.png') });
    push('02-project-tree-three-source.png');
    await shot(page, '02b-g19-tree-presentation.png'); push('02b-g19-tree-presentation.png');
    // hover a tree label for tooltip if any
    const label = page.locator('[data-testid^="tree-label-"]').first();
    if (await label.count()) {
      await label.hover();
      await page.waitForTimeout(200);
      await page.getByTestId('project-tree').screenshot({ path: path.join(OUT, '02c-g19-tree-row-hover.png') });
      push('02c-g19-tree-row-hover.png');
      o.g19_label_title = await label.getAttribute('title');
    }
    const treeText = await page.getByTestId('project-tree').innerText();
    o.g19 = {
      engineering: await page.getByTestId('project-tree-sample').getAttribute('data-engineering'),
      kinds: await page.locator('[data-tree-kind]').evaluateAll((els) =>
        [...new Set(els.map((e) => e.getAttribute('data-tree-kind')))]),
      text_snippet: treeText.slice(0, 400),
    };

    // 3 G07
    await page.getByTestId('bottom-tab-tasks').click();
    await shot(page, '03-g07-bottom-tasks.png'); push('03-g07-bottom-tasks.png');
    await page.getByTestId('bottom-panel').screenshot({ path: path.join(OUT, '03b-g07-bottom-crop.png') });
    push('03b-g07-bottom-crop.png');
    await page.getByTestId('bottom-tab-log').click();
    await shot(page, '03c-g07-bottom-log.png'); push('03c-g07-bottom-log.png');
    if (await page.getByTestId('status-bar').count()) {
      await page.getByTestId('status-bar').screenshot({ path: path.join(OUT, '03d-status-bar.png') });
      push('03d-status-bar.png');
    }

    // 4 G06
    await page.getByTestId('btn-workspace-narrowband').click();
    await expect(page.getByTestId('workspace-narrowband')).toBeVisible();
    if (await page.getByTestId('nb-page-observe').count()) await page.getByTestId('nb-page-observe').click();
    await page.waitForTimeout(1500);
    await shot(page, '04-nb-observe.png'); push('04-nb-observe.png');
    await page.getByTestId('nb-page-modulation').click();
    await page.waitForTimeout(800);
    await shot(page, '04b-nb-modulation.png'); push('04b-nb-modulation.png');
    await page.getByTestId('nb-page-demodulation').click();
    await page.waitForTimeout(800);
    await shot(page, '04c-nb-demodulation.png'); push('04c-nb-demodulation.png');
    await page.getByTestId('nb-page-deep-learning').click();
    await page.waitForTimeout(400);
    await shot(page, '04d-nb-dl-blocked.png'); push('04d-nb-dl-blocked.png');
    o.nb_blocked = (await page.getByTestId('nb-dl-blocked-code').innerText().catch(() => '')).slice(0, 200);

    await page.getByTestId('btn-workspace-wideband').click();
    await page.waitForTimeout(250);

    // 5 G11
    const before = await chart.getAttribute('data-view-x-max');
    const box = await chart.boundingBox();
    await page.mouse.move(box!.x + 160, box!.y + 120);
    await page.mouse.down();
    await page.mouse.move(box!.x + 400, box!.y + 340, { steps: 5 });
    await shot(page, '05-g11-zoom-box-drag.png'); push('05-g11-zoom-box-drag.png');
    await page.mouse.up();
    await page.waitForTimeout(200);
    await shot(page, '05b-g11-zoom-box-applied.png'); push('05b-g11-zoom-box-applied.png');
    o.g11 = { before, after: await chart.getAttribute('data-view-x-max'), gesture: await chart.getAttribute('data-gesture') };

    // 6 G14
    await page.getByTestId('btn-header-detection-roi').click();
    await expect(host).toHaveAttribute('data-active-tool', 'detection-roi');
    await shot(page, '06-g14-roi-header.png'); push('06-g14-roi-header.png');
    await page.getByTestId('chart-strip-main').screenshot({ path: path.join(OUT, '06b-g14-roi-strip.png') });
    push('06b-g14-roi-strip.png');
    await page.mouse.move(box!.x + 140, box!.y + 100);
    await page.mouse.down();
    await page.mouse.move(box!.x + 340, box!.y + 260, { steps: 4 });
    await page.mouse.up();
    if (await page.getByTestId('detection-roi-confirmation').count()) {
      await shot(page, '06c-g14-roi-confirmation.png'); push('06c-g14-roi-confirmation.png');
      await page.keyboard.press('Escape');
    }

    // 7 G13
    await chart.click({ button: 'right', position: { x: 180, y: 140 } });
    if (await page.getByTestId('chart-menu-mark').count()) {
      await page.getByTestId('chart-menu-mark').click();
      await page.mouse.move(box!.x + 150, box!.y + 110);
      await page.mouse.down();
      await page.mouse.move(box!.x + 320, box!.y + 240, { steps: 4 });
      await page.mouse.up();
      await page.waitForTimeout(250);
      await shot(page, '07-g13-mark-handles.png'); push('07-g13-mark-handles.png');
      o.g13 = {
        marks: await page.getByTestId('chart-mark-layer').getAttribute('data-mark-count').catch(() => null),
        handles: await page.locator('[data-testid^="chart-mark-handle"]').count(),
      };
    } else {
      await shot(page, '07-g13-no-mark-menu.png'); push('07-g13-no-mark-menu.png');
    }

    o.gaps = 'No PASS. Desktop 17471a6 ref only. G19 presentation partial in UI (tooltips/badges still B gaps).';
    fs.writeFileSync(path.join(OUT, 'capture-notes.json'), JSON.stringify(notes, null, 2) + '\n');
  });
});
