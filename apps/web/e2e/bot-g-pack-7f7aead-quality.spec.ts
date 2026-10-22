/**
 * Bot-G QUALITY @ 7f7aead (C colorscale+partition + B 4K rails/MenuBar + NB DDC). NOT PASS.
 * BB page vs NB page SEPARATE shots (XOR). viewport 4K. Soft 02≠01. Tree gate HARD.
 * 06: nb-observe-pipeline 「真实 DDC」. display-colorscale visible on BB waterfall.
 * pass_claimed=false always.
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const BASELINE = '7f7aead43b066ff8332d6e4ddc023db3ddc64f08';
const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-7f7aead-quality');
const SIGMF_DIR = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo';
const META = path.join(SIGMF_DIR, '0000000.sigmf-meta');
const DATA = path.join(SIGMF_DIR, '0000000.sigmf-data');
const VIEWPORT = { width: 3840, height: 2160 };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, rej) => { t = setTimeout(() => rej(new Error(label + ' timeout ' + ms)), ms); }),
    ]);
  } finally { if (t) clearTimeout(t); }
}
function ensure() { fs.mkdirSync(OUT, { recursive: true }); }
function hash(p: string) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }
async function shot(page: Page, name: string) {
  ensure();
  await withTimeout(page.screenshot({ path: path.join(OUT, name), fullPage: true }), 25000, 'shot:' + name);
}
async function shotEl(page: Page, testId: string, name: string) {
  ensure();
  const el = page.getByTestId(testId);
  if ((await el.count()) === 0) return false;
  if (!(await el.isVisible().catch(() => false))) return false;
  await withTimeout(el.screenshot({ path: path.join(OUT, name) }), 15000, 'shotEl:' + name);
  return fs.existsSync(path.join(OUT, name));
}

test.describe('Bot-G QUALITY 7f7aead BB/NB XOR + colorscale 4K (NOT PASS)', () => {
  test.setTimeout(300_000);
  test.use({ viewport: VIEWPORT });

  test('BB vs NB separate + colorscale + 06 DDC', async ({ page }) => {
    ensure();
    expect(fs.existsSync(META)).toBe(true);
    const notes: any = {
      id: 'qa-web-7f7aead-quality',
      baseline_sha: BASELINE,
      tip_web_base: BASELINE,
      pack: 'web-7f7aead-quality',
      pass_claimed: false,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      viewport: VIEWPORT,
      contains: { C: '29d29df/0396f85', B: 'c676a15/1760499' },
      focus: 'BB-page vs NB-page SEPARATE; colorscale; 06 DDC; 4K',
      sigmf_demo_dir: SIGMF_DIR,
      captures: [] as string[],
      observations: {} as any,
      gaps: [] as string[],
      skipped: [] as string[],
    };
    const push = (n: string) => { if (!notes.captures.includes(n)) notes.captures.push(n); };

    await withTimeout(page.goto('/'), 30000, 'goto');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 30000 });

    notes.observations.load = { prefer: 'menu-load-demo-iq' };
    try {
      await withTimeout((async () => {
        await page.getByTestId('menubar-file').click({ force: true, timeout: 2000 });
        await page.getByTestId('menu-load-demo-iq').click({ force: true, timeout: 2000, noWaitAfter: true });
      })(), 4000, 'menu-demo');
      notes.observations.load.via = 'menu-load-demo-iq';
      await sleep(2500);
    } catch (e: any) {
      notes.observations.load.menu_err = String(e?.message || e);
      await page.keyboard.press('Escape').catch(() => {});
    }
    try {
      const iq = (await page.getByTestId('input-iq-wav').count()) > 0
        ? page.getByTestId('input-iq-wav') : page.getByTestId('menubar-input-iq');
      await withTimeout(iq.setInputFiles([META, DATA]), 8000, 'setInputFiles');
      notes.observations.load.input = 'ok';
      await sleep(900);
    } catch (e: any) {
      notes.observations.load.input_err = String(e?.message || e);
    }
    try {
      await withTimeout(page.getByTestId('btn-load-sample').click({ force: true, timeout: 2500 }), 3000, 'sample');
      notes.observations.load.sample = true;
      await sleep(500);
    } catch { /* soft */ }

    let gateOk = false; let gateDetail: any = {};
    const t0 = Date.now();
    while (Date.now() - t0 < 25000) {
      try {
        gateDetail = await withTimeout(page.evaluate(() => {
          const empty = document.querySelector('[data-testid="project-tree-empty"]') as HTMLElement | null;
          const emptyVisible = !!(empty && empty.offsetParent !== null);
          const emptyText = empty?.textContent || '';
          const treeText = document.querySelector('[data-testid="project-tree"]')?.textContent || '';
          const loaded = !!document.querySelector('[data-testid="project-tree-loaded"]');
          const sample = !!document.querySelector('[data-testid="project-tree-sample"]');
          const nodes = document.querySelectorAll('[data-testid^="tree-node-"]').length;
          const hasEmptyPhrase = /尚未打开工程/.test(emptyText + treeText);
          const ok = !emptyVisible && !hasEmptyPhrase && (loaded || sample) && nodes > 0;
          return { ok, emptyVisible, hasEmptyPhrase, loaded, sample, nodes, tree: treeText.slice(0, 220) };
        }), 3000, 'gate');
        if (gateDetail.ok) { gateOk = true; break; }
      } catch (e: any) { gateDetail = { err: String(e?.message || e) }; }
      await sleep(400);
    }
    notes.observations.tree_gate = { ok: gateOk, ...gateDetail, elapsed_ms: Date.now() - t0 };
    if (!gateOk) {
      await shot(page, '01-FAIL-empty-tree.png').catch(() => {});
      push('01-FAIL-empty-tree.png');
      fs.writeFileSync(path.join(OUT, 'MANIFEST.json'), JSON.stringify({ pack: 'web-7f7aead-quality', baseline_sha: BASELINE, pass_claimed: false, result: 'FAIL_EMPTY_TREE', tree_gate: notes.observations.tree_gate, captures: notes.captures }, null, 2));
      expect(gateOk, 'tree gate HARD').toBe(true);
      return;
    }

    await shot(page, '01-project-tree-loaded.png'); push('01-project-tree-loaded.png');
    if (await shotEl(page, 'project-tree', '01b-project-tree-crop.png')) push('01b-project-tree-crop.png');

    // ===== BROADBAND PAGE ONLY =====
    await page.getByTestId('btn-workspace-wideband').click({ force: true, timeout: 4000 }).catch(() => {});
    try {
      await page.getByTestId('menubar-view').click({ force: true, timeout: 1500 });
      await page.getByTestId('menu-view-wideband').click({ force: true, timeout: 1500 });
    } catch { await page.keyboard.press('Escape').catch(() => {}); }
    await sleep(400);
    await page.getByTestId('btn-mode-waterfall').click({ force: true, timeout: 3000 }).catch(() => {});
    await sleep(1000);

    const bbPartition = await page.locator('[data-chart-partition]').first().getAttribute('data-chart-partition').catch(() => null);
    const bbHost = page.getByTestId('main-chart-host');
    const colorbarDom = page.locator('[data-testid="display-colorscale"][data-color-scale-dom="true"]');
    let colorscaleVisible = await colorbarDom.isVisible().catch(() => false);
    if (!colorscaleVisible) colorscaleVisible = await page.getByTestId('display-colorscale').isVisible().catch(() => false);
    const colorbarText = await page.getByTestId('display-colorscale').innerText().catch(() => null);
    notes.observations.broadband = {
      partition: bbPartition,
      partition_ok: bbPartition === 'broadband-nav-aux-main',
      chart_mode: await bbHost.getAttribute('data-chart-mode').catch(() => null),
      colorscale_visible: colorscaleVisible,
      colorscale_text: colorbarText ? String(colorbarText).slice(0, 200) : null,
      color_scale_dom_count: await page.locator('[data-color-scale-dom="true"]').count().catch(() => 0),
      nav_present: (await page.getByTestId('global-nav').count().catch(() => 0)) > 0,
      aux_present: (await page.getByTestId('aux-chart').count().catch(() => 0)) > 0,
      nb_workspace_count: await page.getByTestId('workspace-narrowband').count().catch(() => 0),
      menubar_snippet: (await page.getByTestId('menubar').innerText().catch(() => '')).slice(0, 300),
    };
    if (bbPartition !== 'broadband-nav-aux-main') notes.gaps.push('BB partition expected broadband-nav-aux-main got ' + bbPartition + ' — PARTIAL');
    if (!colorscaleVisible) notes.gaps.push('BB display-colorscale not visible — PARTIAL');

    await shot(page, '02-broadband-waterfall-4k.png'); push('02-broadband-waterfall-4k.png');
    if (colorscaleVisible && (await shotEl(page, 'display-colorscale', '02b-display-colorscale-crop.png'))) push('02b-display-colorscale-crop.png');

    const h01 = hash(path.join(OUT, '01-project-tree-loaded.png'));
    const h02 = hash(path.join(OUT, '02-broadband-waterfall-4k.png'));
    notes.observations.shot02_ne_01 = { different: h01 !== h02, h01, h02, soft: true };
    if (h01 === h02) notes.gaps.push('02≈01 soft-fail');

    await page.getByTestId('btn-mode-stft').click({ force: true, timeout: 2500 }).catch(() => {});
    await sleep(500);
    await shot(page, '03-broadband-stft-4k.png'); push('03-broadband-stft-4k.png');
    notes.observations.broadband_stft = {
      partition: await page.locator('[data-chart-partition]').first().getAttribute('data-chart-partition').catch(() => null),
      chart_mode: await bbHost.getAttribute('data-chart-mode').catch(() => null),
    };

    // ===== NARROWBAND PAGE ONLY (separate) =====
    await withTimeout(page.getByTestId('btn-workspace-narrowband').click({ force: true, timeout: 4000 }), 5000, 'nb-click').catch(async () => {
      try {
        await page.getByTestId('menubar-view').click({ force: true, timeout: 1500 });
        await page.getByTestId('menu-view-narrowband').click({ force: true, timeout: 1500 });
      } catch { /* soft */ }
    });
    await expect(page.getByTestId('workspace-narrowband')).toBeVisible({ timeout: 15000 });
    if ((await page.getByTestId('nb-page-observe').count()) > 0) {
      await page.getByTestId('nb-page-observe').click({ force: true, timeout: 3000 }).catch(() => {});
    }
    await expect(page.getByTestId('workspace-narrowband-observe')).toBeVisible({ timeout: 15000 });
    await sleep(400);

    const nbPartition = await page.locator('[data-chart-partition]').first().getAttribute('data-chart-partition').catch(() => null);
    const nbNav = await page.getByTestId('global-nav').count().catch(() => 0);
    const nbAux = await page.getByTestId('aux-chart').count().catch(() => 0);
    notes.observations.narrowband = {
      partition: nbPartition,
      partition_ok: nbPartition === 'narrowband-only',
      global_nav_count: nbNav,
      aux_chart_count: nbAux,
      main_chart_host_count: await page.getByTestId('main-chart-host').count().catch(() => 0),
      xor_ok: nbPartition === 'narrowband-only' && nbNav === 0 && nbAux === 0,
      menubar_snippet: (await page.getByTestId('menubar').innerText().catch(() => '')).slice(0, 300),
    };
    if (nbPartition !== 'narrowband-only') notes.gaps.push('NB partition expected narrowband-only got ' + nbPartition + ' — PARTIAL');
    if (nbNav > 0 || nbAux > 0) notes.gaps.push('NB page still mounts BB nav/aux — PARTIAL');

    let chartsReady = false;
    const tReady = Date.now();
    while (Date.now() - tReady < 90000) {
      const a = await page.getByTestId('nb-panel-waveform').getAttribute('data-nb-chart-ready').catch(() => null);
      const b = await page.getByTestId('nb-panel-psd').getAttribute('data-nb-chart-ready').catch(() => null);
      const c = await page.getByTestId('nb-panel-stft').getAttribute('data-nb-chart-ready').catch(() => null);
      if (a === 'true' && b === 'true' && c === 'true') { chartsReady = true; break; }
      await sleep(500);
    }
    notes.observations.chart_ready = {
      ok: chartsReady,
      wave: await page.getByTestId('nb-panel-waveform').getAttribute('data-nb-chart-ready').catch(() => null),
      psd: await page.getByTestId('nb-panel-psd').getAttribute('data-nb-chart-ready').catch(() => null),
      stft: await page.getByTestId('nb-panel-stft').getAttribute('data-nb-chart-ready').catch(() => null),
      elapsed_ms: Date.now() - tReady,
    };
    if (!chartsReady) notes.gaps.push('NB chart-ready timeout — PARTIAL');
    await sleep(600);

    await shot(page, '05-narrowband-observe-4k.png'); push('05-narrowband-observe-4k.png');

    const pipeline = page.getByTestId('nb-observe-pipeline');
    await expect(pipeline).toBeVisible({ timeout: 15000 });
    const pipeText = ((await pipeline.innerText().catch(() => '')) || '').trim();
    const pipeTitle = (await pipeline.getAttribute('title').catch(() => null)) || '';
    const pipeAttrs = {
      'data-nb-source': await pipeline.getAttribute('data-nb-source').catch(() => null),
      'data-nb-pipeline': await pipeline.getAttribute('data-nb-pipeline').catch(() => null),
      'data-nb-ddc-kind': await pipeline.getAttribute('data-nb-ddc-kind').catch(() => null),
      'data-nb-ddc-status': await pipeline.getAttribute('data-nb-ddc-status').catch(() => null),
      'data-nb-lo-hz': await pipeline.getAttribute('data-nb-lo-hz').catch(() => null),
      'data-nb-decimation': await pipeline.getAttribute('data-nb-decimation').catch(() => null),
    };
    const combined = pipeText + '\n' + pipeTitle + '\n' + JSON.stringify(pipeAttrs);
    const hasRealDdc = /真实 DDC/.test(combined);
    notes.observations.shot06_pipeline = {
      text: pipeText.slice(0, 400), title: pipeTitle.slice(0, 400), attrs: pipeAttrs, has_真实_DDC: hasRealDdc,
    };
    if (!hasRealDdc) notes.gaps.push('06 missing 「真实 DDC」 — PARTIAL');
    if (await shotEl(page, 'nb-observe-pipeline', '06-nb-ddc-pipeline-state.png')) push('06-nb-ddc-pipeline-state.png');
    else {
      await shot(page, '06-nb-ddc-pipeline-state.png'); push('06-nb-ddc-pipeline-state.png');
      notes.gaps.push('06 element shot fallback fullPage');
    }

    notes.absolute_png_paths = notes.captures.map((c: string) => path.join(OUT, c));
    const manifest = {
      pack: 'web-7f7aead-quality',
      baseline_sha: BASELINE,
      tip_web_base: BASELINE,
      evidence_sha_after_commit: 'PENDING_COMMIT',
      pass_claimed: false,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      viewport: VIEWPORT,
      tree_gate: notes.observations.tree_gate,
      broadband: notes.observations.broadband,
      narrowband: notes.observations.narrowband,
      chart_ready: notes.observations.chart_ready,
      shot02_ne_01: notes.observations.shot02_ne_01,
      shot06_has_真实_DDC: hasRealDdc,
      captures: notes.captures,
      gaps: notes.gaps,
      absolute_png_paths: notes.absolute_png_paths,
      out_dir: OUT,
      observations: notes.observations,
    };
    fs.writeFileSync(path.join(OUT, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(OUT, 'notes.json'), JSON.stringify(notes, null, 2));
    fs.writeFileSync(path.join(OUT, 'NOTES.md'), [
      '# web-7f7aead-quality BB/NB XOR + colorscale 4K (NOT PASS)',
      '- baseline_sha: ' + BASELINE,
      '- tip_sha: PENDING_COMMIT',
      '- pass_claimed: false',
      '- viewport: 3840x2160',
      '- contains: C 29d29df/0396f85 + B c676a15',
      '- tree_gate: ' + JSON.stringify(notes.observations.tree_gate),
      '- broadband: ' + JSON.stringify(notes.observations.broadband),
      '- narrowband: ' + JSON.stringify(notes.observations.narrowband),
      '- chart_ready: ' + JSON.stringify(notes.observations.chart_ready),
      '- 真实 DDC: ' + String(hasRealDdc) + ' | ' + pipeText.slice(0, 200),
      '- 02≠01 soft: ' + String(notes.observations.shot02_ne_01.different),
      '- gaps: ' + JSON.stringify(notes.gaps),
      '',
      '## PNG',
      ...notes.absolute_png_paths.map((p: string) => '- ' + p),
      '',
      'No PASS. BB and NB shot on separate pages (XOR).',
      '',
    ].join('\n'));

    expect(notes.pass_claimed).toBe(false);
    expect(gateOk).toBe(true);
    expect(fs.existsSync(path.join(OUT, '06-nb-ddc-pipeline-state.png'))).toBe(true);
    if (!hasRealDdc) console.warn('[PARTIAL] missing 真实 DDC');
    if (!colorscaleVisible) console.warn('[PARTIAL] colorscale not visible');
  });
});
