/**
 * Bot-G pack @ 1dbf673 (evidence tip). Impl baseline 9248453 (+ f4c67be wave).
 * OpenHand, Detection全参, G06 BLOCKED, G19/G02/G08/G07. Desktop 17471a6.
 * ui_parity_pass_claimed: false
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-1dbf673');
const TIP = '1dbf67316bca088b1aefea4b948953a04391eb75';
const IMPL_BASELINE = '9248453b0f58375bd50e93719a6371574c3d0a84';
const IMPL_F4C67BE = 'f4c67be09ef7d53b60ff4b243ee900bcd0ca123b';
const DESKTOP = '17471a6488383b456281d12cb1a6d3d80290205d';
const META = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo/0000000.sigmf-meta';
const DATA = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo/0000000.sigmf-data';
const TOKEN = 'botg-dev-token';
const REPO = path.resolve(process.cwd(), '../..');

function ensure() { fs.mkdirSync(OUT, { recursive: true }); }
async function shot(page: Page, name: string) {
  ensure();
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}
function copyDoc(rel: string, dest: string) {
  const src = path.join(REPO, rel);
  if (!fs.existsSync(src)) return null;
  fs.copyFileSync(src, path.join(OUT, dest));
  return dest;
}
async function waitChart(page: Page) {
  const host = page.getByTestId('main-chart-host');
  const chart = page.getByTestId('chart-main');
  await expect(chart).toBeVisible({ timeout: 20000 });
  try {
    await expect.poll(async () => {
      const s = await host.getAttribute('data-dsp-source');
      return !s || s === 'loading' ? null : s;
    }, { timeout: 12000 }).not.toBeNull();
  } catch { /* continue */ }
  return { host, chart };
}
async function setAxisCursor(page: Page, chart: ReturnType<Page['getByTestId']>, which: 'x' | 'y' | 'plot') {
  await chart.evaluate((el, w) => {
    const r = el.getBoundingClientRect();
    let clientX = r.left + r.width * 0.5;
    let clientY = r.top + r.height * 0.45;
    if (w === 'x') { clientX = r.left + r.width * 0.5; clientY = r.bottom - 10; }
    else if (w === 'y') { clientX = r.left + 10; clientY = r.top + r.height * 0.5; }
    el.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, cancelable: true, clientX, clientY,
      pointerId: 1, pointerType: 'mouse', isPrimary: true,
    }));
  }, which);
}

test.describe('Bot-G pack 1dbf673 NOT PASS', () => {
  test.setTimeout(180_000);

  test('fold OpenHand/Detect/G06 + G19/G02/G08/G07', async ({ page }) => {
    ensure();
    const notes: any = {
      id: 'qa-web-1dbf673-openhand-detect-g06-g19-g02-g08-g07',
      tip_web_evidence: TIP,
      tip_impl_baseline: IMPL_BASELINE,
      tip_impl_f4c67be_wave: IMPL_F4C67BE,
      tip_desktop_compare: DESKTOP,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      g26_iq: META,
      captures: [] as string[],
      docs: [] as string[],
      observations: {} as any,
    };
    const push = (n: string) => notes.captures.push(n);
    const o = notes.observations;

    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 20000 });

    // G08
    const body = page.getByTestId('app-shell-body');
    await expect(body).toHaveAttribute('data-shell-resizable', 'true');
    await expect(body).toHaveAttribute('data-shell-columns', /278-390/);
    await expect(page.getByTestId('shell-col-resize-left')).toBeVisible();
    await expect(page.getByTestId('shell-col-resize-right')).toBeVisible();
    const treeBox = await page.getByTestId('project-tree').boundingBox();
    const railBox = await page.getByTestId('context-rail').boundingBox();
    await shot(page, '01-g08-columns.png'); push('01-g08-columns.png');
    o.g08 = { columns: await body.getAttribute('data-shell-columns'), tree_w: treeBox?.width, rail_w: railBox?.width };

    // G02
    await expect(page.getByTestId('chart-strip-qlabel-level')).toBeVisible();
    await expect(page.getByTestId('chart-strip-qlabel-stft')).toBeVisible();
    await expect(page.getByTestId('chart-strip-qlabel-palette')).toBeVisible();
    await shot(page, '02-g02-strip-qlabel.png'); push('02-g02-strip-qlabel.png');
    if (await page.getByTestId('chart-strip-main').count()) {
      await page.getByTestId('chart-strip-main').screenshot({ path: path.join(OUT, '02b-g02-strip-main-crop.png') });
      push('02b-g02-strip-main-crop.png');
    }
    o.g02 = {
      level: (await page.getByTestId('chart-strip-qlabel-level').innerText()).slice(0, 80),
      stft: (await page.getByTestId('chart-strip-qlabel-stft').innerText()).slice(0, 80),
      palette: (await page.getByTestId('chart-strip-qlabel-palette').innerText()).slice(0, 80),
    };

    // OpenHand
    const { chart } = await waitChart(page);
    await expect(chart).toHaveAttribute('data-axis-only-pan', 'true');
    await setAxisCursor(page, chart, 'x');
    await expect(chart).toHaveAttribute('data-interaction-cursor', 'grab');
    await shot(page, '03-openhand-xaxis.png'); push('03-openhand-xaxis.png');
    await chart.screenshot({ path: path.join(OUT, '03b-openhand-xaxis-crop.png') }); push('03b-openhand-xaxis-crop.png');
    await setAxisCursor(page, chart, 'y');
    await expect(chart).toHaveAttribute('data-interaction-cursor', 'grab');
    await shot(page, '03c-openhand-yaxis.png'); push('03c-openhand-yaxis.png');
    const box = await chart.boundingBox();
    await page.mouse.move(box!.x + 12, box!.y + box!.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box!.x + 12, box!.y + box!.height * 0.5 + 40, { steps: 5 });
    let dragCur = await chart.getAttribute('data-interaction-cursor');
    if (dragCur !== 'grabbing') {
      await chart.evaluate((el) => {
        const r = el.getBoundingClientRect();
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + 10, clientY: r.top + r.height * 0.5, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 }));
        el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r.left + 10, clientY: r.top + r.height * 0.5 + 40, pointerId: 1, pointerType: 'mouse', buttons: 1 }));
      });
      dragCur = await chart.getAttribute('data-interaction-cursor');
    }
    await shot(page, '03d-closedhand-yaxis-drag.png'); push('03d-closedhand-yaxis-drag.png');
    await page.mouse.up();
    await setAxisCursor(page, chart, 'plot');
    await expect(chart).toHaveAttribute('data-interaction-cursor', 'crosshair');
    await shot(page, '03e-plot-crosshair.png'); push('03e-plot-crosshair.png');
    o.openhand = { x_hover: 'grab', y_hover: 'grab', drag_cursor: dragCur, plot: 'crosshair' };

    // G19
    await page.getByTestId('rail-tab-marker').click();
    const panel = page.getByTestId('m06-panel');
    await expect(panel).toHaveAttribute('data-annotation-panel', 'true');
    await expect(page.getByTestId('m06-mark-list')).toHaveAttribute('data-annotation-paint', 'desktop-multi');
    await shot(page, '04-g19-annotation-paint.png'); push('04-g19-annotation-paint.png');
    await panel.screenshot({ path: path.join(OUT, '04b-g19-annotation-panel-crop.png') }); push('04b-g19-annotation-panel-crop.png');
    o.g19 = {
      paint: await page.getByTestId('m06-mark-list').getAttribute('data-annotation-paint'),
      summary: (await page.getByTestId('annotation-selection-summary').innerText().catch(() => '')).slice(0, 80),
    };

    // G07 — expand bottom if needed; read attrs only while pane visible
    if (await page.getByTestId('bottom-toggle').count()) {
      const collapsed = await page.getByTestId('bottom-panel').getAttribute('data-collapsed');
      if (collapsed === 'true') await page.getByTestId('bottom-toggle').click();
    }
    await page.getByTestId('bottom-tab-marks').click();
    await expect(page.getByTestId('bottom-pane-marks')).toBeVisible({ timeout: 8000 });
    const marksShell = await page.getByTestId('bottom-pane-marks').getAttribute('data-panel-shell');
    expect(marksShell).toBe('annotation-panel');
    await shot(page, '05-g07-annotation-panel-shell.png'); push('05-g07-annotation-panel-shell.png');

    await page.getByTestId('bottom-tab-tasks').click();
    await expect(page.getByTestId('bottom-pane-tasks')).toBeVisible({ timeout: 8000 });
    const tasksShell = await page.getByTestId('bottom-pane-tasks').getAttribute('data-panel-shell');
    expect(tasksShell).toBe('detection-panel');
    await expect(page.getByTestId('bottom-detection-shell')).toBeVisible();
    await shot(page, '05b-g07-detection-panel-shell.png'); push('05b-g07-detection-panel-shell.png');
    await page.getByTestId('bottom-detection-shell').screenshot({ path: path.join(OUT, '05c-g07-detection-shell-crop.png') });
    push('05c-g07-detection-shell-crop.png');
    o.g07 = {
      marks_shell: marksShell,
      tasks_shell: tasksShell,
      detect_cols: (await page.getByTestId('bottom-detect-columns').count()) > 0,
    };

    // Detection 全参
    const iq = page.getByTestId('menubar-input-iq');
    if (await iq.count()) await iq.setInputFiles([META, DATA]);
    else if (await page.getByTestId('input-iq-wav').count())
      await page.getByTestId('input-iq-wav').setInputFiles([META, DATA]);
    await waitChart(page);
    await page.getByTestId('rail-tab-detect').click();
    await expect(page.getByTestId('detect-page')).toBeVisible();
    if (await page.getByTestId('detect-token-input').count()) {
      await page.getByTestId('detect-token-input').fill(TOKEN);
      await page.getByTestId('detect-refresh-caps').click();
      await page.waitForTimeout(1000);
    }
    const card = page.getByTestId('detection-card');
    await expect(card).toBeVisible({ timeout: 10000 });
    const grid = page.getByTestId('detection-param-grid');
    await expect(grid).toBeVisible({ timeout: 10000 });
    await expect(grid).toHaveAttribute('data-object-name', 'detectionParameterGrid');
    await shot(page, '06-detection-full-params.png'); push('06-detection-full-params.png');
    await card.screenshot({ path: path.join(OUT, '06b-detection-card-crop.png') }); push('06b-detection-card-crop.png');
    await grid.screenshot({ path: path.join(OUT, '06c-detection-param-grid.png') }); push('06c-detection-param-grid.png');
    const adv = page.getByTestId('detection-advanced-section');
    if (await adv.count()) {
      await adv.locator('summary').click().catch(async () => { await adv.click(); });
      await page.waitForTimeout(150);
      await adv.screenshot({ path: path.join(OUT, '06d-detection-advanced.png') });
      push('06d-detection-advanced.png');
    }
    const paramIds = [
      'detection-fft-size', 'detection-hop-milliseconds', 'detection-model-frames',
      'detection-score-threshold', 'detection-nms-iou', 'detection-topk',
      'detection-batch-size', 'detection-merge-frequency-hz',
    ];
    const present: Record<string, string | null> = {};
    for (const tid of paramIds) {
      const el = page.getByTestId(tid);
      present[tid] = (await el.count()) ? await el.getAttribute('data-object-name') : null;
    }
    o.detection_full_params = { grid: await grid.getAttribute('data-object-name'), params: present, count: Object.values(present).filter(Boolean).length };

    // G06 BLOCKED + Bot-B docs
    const docs: string[] = [];
    for (const [src, dest] of [
      ['artifacts/validation/bot-d/BOT_D_G06_EYE_BITSTREAM_97fc7c0.md', 'G06_EYE_BITSTREAM_BLOCKED.md'],
      ['docs/acceptance/evidence/bot-e/G06_RECOGNITION_ASSESS_BLOCKED.md', 'G06_RECOGNITION_ASSESS_BLOCKED.md'],
      ['artifacts/validation/bot-d/BOT_D_G07_HANDOFF_TO_B.md', 'G07_HANDOFF_TO_B.md'],
      ['docs/acceptance/evidence/bot-e/G17_PARAM_GRID_INDEX.md', 'G17_PARAM_GRID_INDEX.md'],
      ['artifacts/validation/ui-parity/bot-b/BOT_B_G19_ANNOTATION_PAINT.md', 'BOT_B_G19_ANNOTATION_PAINT.md'],
      ['artifacts/validation/ui-parity/bot-b/BOT_B_G02_STRIP.md', 'BOT_B_G02_STRIP.md'],
      ['artifacts/validation/ui-parity/bot-b/BOT_B_G08_COLUMNS.md', 'BOT_B_G08_COLUMNS.md'],
      ['artifacts/validation/ui-parity/bot-b/BOT_B_G07_BOTTOM.md', 'BOT_B_G07_BOTTOM.md'],
      ['artifacts/validation/ui-parity/INCREMENTAL_f4c67be.md', 'INCREMENTAL_f4c67be.md'],
      ['artifacts/validation/ui-parity/INCREMENTAL_9248453.md', 'INCREMENTAL_9248453.md'],
    ] as const) {
      const d = copyDoc(src, dest);
      if (d) docs.push(d);
    }
    notes.docs = docs;
    o.g06_blocked = {
      eye: 'BLOCKED EYE_TIMING_SYNC_MISSING',
      bitstream: 'BLOCKED BITSTREAM_DEMOD_MISSING',
      recognition: 'BLOCKED RECOGNITION_ENGINE_MISSING',
      docs,
      status: 'PARTIAL with honest BLOCKED; not CLOSED',
    };
    o.gaps = 'No PASS. Evidence tip 1dbf673; impl baseline 9248453 (+f4c67be OpenHand/Detect/G06). Desktop 17471a6 ref only.';

    fs.writeFileSync(path.join(OUT, 'capture-notes.json'), JSON.stringify(notes, null, 2) + '\n');

    const cmp = `# web-1dbf673 vs desktop 17471a6 (Bot-G, NOT PASS)

| Field | Value |
|-------|--------|
| Asia/Shanghai | 2026-10-21 |
| Evidence sync tip / HEAD | \`${TIP}\` (\`1dbf673\`) |
| Impl baseline | \`${IMPL_BASELINE}\` (\`9248453\` G19/G02/G08/G07) |
| Prior impl wave | \`${IMPL_F4C67BE}\` (\`f4c67be\` OpenHand / Detection全参 / G06 BLOCKED) |
| Desktop tip | \`${DESKTOP}\` (\`17471a6\`, reused) |
| Pack | \`qa/web-1dbf673/\` |
| **ui_parity_pass_claimed** | **false** |
| **matrix_pass_claimed** | **false** |

## Themes

| Theme | Evidence | Note |
|-------|----------|------|
| G08 cols | \`01-g08-columns.png\` | 278/390 + resize |
| G02 strip | \`02-*\` QLabel | 参考·动态 / STFT / 色板 |
| OpenHand (G11) | \`03-*\` | grab / ClosedHand / crosshair |
| G19 paint | \`04-*\` | \`desktop-multi\` |
| G07 panels | \`05-*\` | annotation + detection shells |
| Detection 全参 (G17) | \`06-*\` | \`detection-param-grid\` |
| G06 BLOCKED 文档 | \`G06_*_BLOCKED.md\` | eye / bitstream / recognition |

## Gaps

1. Not UI_PARITY / matrix PASS — CAO decides.
2. Desktop interactive not re-shot.
3. G06 PARTIAL (BLOCKED residuals). G11/G17/G07/G19/G02/G08 deepened only — not CLOSED.
4. OpenHand cursor attr via PointerEvent dispatch (raw mouse.move hits GL canvas).

## Reproduce

\`\`\`text
cd apps/web && npx playwright test e2e/bot-g-pack-1dbf673-capture.spec.ts
\`\`\`
`;
    fs.writeFileSync(path.join(OUT, 'COMPARISON_NOTES.md'), cmp);

    // Append tip section to shared COMPARISON_NOTES
    const shared = path.join(REPO, 'artifacts/validation/ui-parity/qa/COMPARISON_NOTES.md');
    if (fs.existsSync(shared)) {
      fs.appendFileSync(shared, `\n\n---\n\n## web-1dbf673 @ 1dbf673 (Bot-G, NOT PASS)\n\n` + cmp.split('\n').slice(2).join('\n'));
    }
  });
});
