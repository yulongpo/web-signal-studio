/**
 * Bot-G pack @ 8733cc1: CN tree chrome, DetectionCard, axis-only pan.
 * Out: qa/web-8733cc1/  Desktop 17471a6. ui_parity_pass_claimed: false
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-8733cc1');
const TIP = '8733cc10d77e8a17077d398c0d9ef9a4c07139ee';
const DESKTOP = '17471a6488383b456281d12cb1a6d3d80290205d';
const META = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo/0000000.sigmf-meta';
const DATA = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo/0000000.sigmf-data';
const TOKEN = 'botg-dev-token';

function ensure() { fs.mkdirSync(OUT, { recursive: true }); }
async function shot(page: Page, name: string) {
  ensure();
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}

async function waitChart(page: Page) {
  const host = page.getByTestId('main-chart-host');
  const chart = page.getByTestId('chart-main');
  await expect(chart).toBeVisible({ timeout: 20000 });
  try {
    await expect.poll(async () => {
      const s = await host.getAttribute('data-dsp-source');
      return !s || s === 'loading' ? null : s;
    }, { timeout: 15000 }).not.toBeNull();
  } catch { /* continue */ }
  return { host, chart };
}

test.describe('Bot-G pack 8733cc1 NOT PASS', () => {
  test.setTimeout(150_000);

  test('CN tree + DetectionCard + axis-only pan', async ({ page }) => {
    ensure();
    const notes: any = {
      id: 'qa-web-8733cc1-cn-tree-detectioncard-axis-pan',
      tip_web: TIP,
      tip_desktop_compare: DESKTOP,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      g26_iq: META,
      captures: [] as string[],
      observations: {} as any,
    };
    const push = (n: string) => notes.captures.push(n);
    const o = notes.observations;

    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 20000 });

    // ----- 1) CN tree chrome -----
    const tree = page.getByTestId('project-tree');
    await expect(tree).toHaveAttribute('data-cn-chrome', 'true');
    await page.getByTestId('btn-load-sample').click();
    await expect(page.getByTestId('project-tree-sample')).toBeVisible();
    await expect(page.getByTestId('project-tree-sample')).toHaveAttribute(
      'data-presentation',
      'desktop-cn-chrome',
    );
    await page.waitForTimeout(250);
    await tree.screenshot({ path: path.join(OUT, '01-cn-tree-chrome.png') });
    push('01-cn-tree-chrome.png');
    await shot(page, '01b-cn-tree-chrome-context.png');
    push('01b-cn-tree-chrome-context.png');
    const treeText = await tree.innerText();
    o.cn_tree = {
      cn_chrome: await tree.getAttribute('data-cn-chrome'),
      presentation: await page
        .getByTestId('project-tree-sample')
        .getAttribute('data-presentation'),
      text_snippet: treeText.slice(0, 400),
      has_cn_iq_files: /IQ\s*文件|工程/.test(treeText),
      kinds: await page.locator('[data-tree-kind]').evaluateAll((els) =>
        [...new Set(els.map((e) => e.getAttribute('data-tree-kind')))]),
    };

    // ----- IQ for chart / detect -----
    const iq = page.getByTestId('menubar-input-iq');
    if (await iq.count()) await iq.setInputFiles([META, DATA]);
    else if (await page.getByTestId('input-iq-wav').count())
      await page.getByTestId('input-iq-wav').setInputFiles([META, DATA]);
    const { host, chart } = await waitChart(page);

    // ----- 2) DetectionCard -----
    await page.getByTestId('rail-tab-detect').click();
    await expect(page.getByTestId('detect-page')).toBeVisible();
    if (await page.getByTestId('detect-token-input').count()) {
      await page.getByTestId('detect-token-input').fill(TOKEN);
      await page.getByTestId('detect-refresh-caps').click();
      await page.waitForTimeout(1200);
    }
    const card = page.getByTestId('detection-card');
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card).toHaveAttribute('data-object-name', 'detectionCard');
    await shot(page, '02-detection-card.png');
    push('02-detection-card.png');
    await card.screenshot({ path: path.join(OUT, '02b-detection-card-crop.png') });
    push('02b-detection-card-crop.png');
    if (await page.getByTestId('detection-engine-select').count()) {
      await page.getByTestId('detection-profile-row').screenshot({
        path: path.join(OUT, '02c-detection-card-engine-row.png'),
      });
      push('02c-detection-card-engine-row.png');
    }
    if (await page.getByTestId('detect-engine-list').count()) {
      await page.getByTestId('detect-engine-inventory').screenshot({
        path: path.join(OUT, '02d-detection-engine-inventory.png'),
      }).catch(async () => {
        await page.getByTestId('detect-engine-list').screenshot({
          path: path.join(OUT, '02d-detection-engine-inventory.png'),
        });
      });
      push('02d-detection-engine-inventory.png');
    }
    o.detection_card = {
      visible: true,
      object_name: await card.getAttribute('data-object-name'),
      engine_select: (await page.getByTestId('detection-engine-select').count()) > 0,
      spectrum_mode: await page
        .getByTestId('detection-spectrum-mode')
        .inputValue()
        .catch(() => null),
      inventory_items: await page.getByTestId('detect-engine-item').count(),
      card_text: (await card.innerText()).slice(0, 350),
    };

    // ----- 3) axis-only pan -----
    await expect(chart).toHaveAttribute('data-axis-only-pan', 'true');
    const xMin0 = await chart.getAttribute('data-view-x-min');
    const xMax0 = await chart.getAttribute('data-view-x-max');
    const yMin0 = await chart.getAttribute('data-view-y-min');
    const yMax0 = await chart.getAttribute('data-view-y-max');
    const box = await chart.boundingBox();
    expect(box).toBeTruthy();

    // Y-axis pan
    await page.mouse.move(box!.x + 12, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + 12, box!.y + box!.height / 2 + 48, { steps: 6 });
    await shot(page, '03-axis-only-pan-y-drag.png');
    push('03-axis-only-pan-y-drag.png');
    await page.mouse.up();
    await expect.poll(async () => chart.getAttribute('data-view-y-min'), { timeout: 8000 }).not.toBe(yMin0);
    expect(await chart.getAttribute('data-view-x-min')).toBe(xMin0);
    expect(await chart.getAttribute('data-view-x-max')).toBe(xMax0);
    await shot(page, '03b-axis-only-pan-y-applied.png');
    push('03b-axis-only-pan-y-applied.png');
    const yMin1 = await chart.getAttribute('data-view-y-min');
    const yMax1 = await chart.getAttribute('data-view-y-max');

    // X-axis pan
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height - 12);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 + 64, box!.y + box!.height - 12, { steps: 6 });
    await shot(page, '03c-axis-only-pan-x-drag.png');
    push('03c-axis-only-pan-x-drag.png');
    await page.mouse.up();
    await expect.poll(async () => chart.getAttribute('data-view-x-min'), { timeout: 8000 }).not.toBe(xMin0);
    expect(await chart.getAttribute('data-view-y-min')).toBe(yMin1);
    expect(await chart.getAttribute('data-view-y-max')).toBe(yMax1);
    await shot(page, '03d-axis-only-pan-x-applied.png');
    push('03d-axis-only-pan-x-applied.png');

    // adjacent: physical caption after pan
    if (await page.getByTestId('chart-physical-caption').count()) {
      await page.getByTestId('chart-physical-caption').screenshot({
        path: path.join(OUT, '04-physical-caption-after-axis-pan.png'),
      });
      push('04-physical-caption-after-axis-pan.png');
    }

    o.axis_only_pan = {
      attr: await chart.getAttribute('data-axis-only-pan'),
      before: { xMin0, xMax0, yMin0, yMax0 },
      after_y: { yMin: yMin1, yMax: yMax1, x_unchanged: true },
      after_x: {
        xMin: await chart.getAttribute('data-view-x-min'),
        xMax: await chart.getAttribute('data-view-x-max'),
        y_unchanged: true,
      },
    };

    o.gaps =
      'No PASS. Desktop 17471a6 ref only. Pack prioritizes CN tree chrome, DetectionCard, axis-only pan @ 8733cc1.';

    fs.writeFileSync(path.join(OUT, 'capture-notes.json'), JSON.stringify(notes, null, 2) + '\n');
  });
});
