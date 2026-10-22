/**
 * Bot-G QA remake @ 7137c22 — pack web-7137c22-06 (NB observe DDC pipeline).
 * 06-focused ONLY: no broadband UI shots. pass_claimed=false always.
 * Path: 窄带 → 信号观察 → chart-ready → [data-testid=nb-observe-pipeline]
 * Soft: 02≠01; soft-assert 「真实 DDC」 (PARTIAL if missing, no PASS invent).
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const BASELINE = '7137c2292409d8e11e51b96ec3abbff3ef4b276d';
const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-7137c22-06');
const SIGMF_DIR = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo';
const META = path.join(SIGMF_DIR, '0000000.sigmf-meta');
const DATA = path.join(SIGMF_DIR, '0000000.sigmf-data');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, rej) => {
        t = setTimeout(() => rej(new Error(label + ' timeout ' + ms)), ms);
      }),
    ]);
  } finally {
    if (t) clearTimeout(t);
  }
}
function ensure() {
  fs.mkdirSync(OUT, { recursive: true });
}
function hash(p: string) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}
async function shot(page: Page, name: string) {
  ensure();
  await withTimeout(page.screenshot({ path: path.join(OUT, name), fullPage: true }), 15000, 'shot:' + name);
}
async function shotEl(page: Page, testId: string, name: string) {
  ensure();
  const el = page.getByTestId(testId);
  if ((await el.count()) === 0) return false;
  if (!(await el.isVisible().catch(() => false))) return false;
  await withTimeout(el.screenshot({ path: path.join(OUT, name) }), 12000, 'shotEl:' + name);
  return fs.existsSync(path.join(OUT, name));
}

test.describe('Bot-G web-7137c22-06 NB DDC pipeline (NOT PASS)', () => {
  test.setTimeout(240_000);

  test('06-nb-ddc-pipeline-state + soft 02≠01', async ({ page }) => {
    ensure();
    expect(fs.existsSync(META)).toBe(true);
    expect(fs.existsSync(DATA)).toBe(true);

    const notes: any = {
      id: 'qa-web-7137c22-06',
      baseline_sha: BASELINE,
      tip_web_base: BASELINE,
      pack: 'web-7137c22-06',
      focus: 'narrowband-observe-ddc-pipeline',
      pass_claimed: false,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      sigmf_demo_dir: SIGMF_DIR,
      captures: [] as string[],
      observations: {} as any,
      gaps: [] as string[],
      skipped: ['broadband UI shots — 06-focused pack; colorbar PARTIAL deferred to C'] as string[],
    };
    const push = (n: string) => {
      if (!notes.captures.includes(n)) notes.captures.push(n);
    };

    await withTimeout(page.goto('/'), 25000, 'goto');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 25000 });

    // --- IQ load: prefer menu-load-demo-iq; then input-iq; soft sample ---
    notes.observations.load = { prefer: 'menu-load-demo-iq' };
    try {
      await withTimeout(
        (async () => {
          await page.getByTestId('menubar-file').click({ force: true, timeout: 2000 });
          await page.getByTestId('menu-load-demo-iq').click({ force: true, timeout: 2000, noWaitAfter: true });
        })(),
        4000,
        'menu-demo',
      );
      notes.observations.load.via = 'menu-load-demo-iq';
      await sleep(2500);
    } catch (e: any) {
      notes.observations.load.menu_err = String(e?.message || e);
      await page.keyboard.press('Escape').catch(() => {});
    }
    try {
      const iq =
        (await page.getByTestId('input-iq-wav').count()) > 0
          ? page.getByTestId('input-iq-wav')
          : page.getByTestId('menubar-input-iq');
      await withTimeout(iq.setInputFiles([META, DATA]), 8000, 'setInputFiles');
      notes.observations.load.input = 'ok';
      await sleep(900);
    } catch (e: any) {
      notes.observations.load.input_err = String(e?.message || e);
    }
    // Soft Add-signal (f-wire) — optional; do not invent confirm success
    try {
      await withTimeout(
        (async () => {
          await page.getByTestId('menubar-file').click({ force: true, timeout: 1500 });
          await page.getByTestId('menu-open-iq').click({ force: true, timeout: 1500 });
        })(),
        3500,
        'open-iq-menu',
      );
      const dlg = page.getByTestId('add-signal-dialog');
      if ((await dlg.count()) > 0 && (await dlg.isVisible().catch(() => false))) {
        notes.observations.load.data_add_signal = await dlg.getAttribute('data-add-signal').catch(() => null);
        await page.getByTestId('add-signal-close').click({ force: true }).catch(() => {});
        await page.keyboard.press('Escape').catch(() => {});
      }
    } catch (e: any) {
      notes.observations.load.add_signal_soft = String(e?.message || e);
      await page.keyboard.press('Escape').catch(() => {});
    }
    try {
      await withTimeout(page.getByTestId('btn-load-sample').click({ force: true, timeout: 2500 }), 3000, 'sample');
      notes.observations.load.sample = true;
      await sleep(500);
    } catch {
      /* soft */
    }

    // --- Tree gate HARD ---
    let gateOk = false;
    let gateDetail: any = {};
    const t0 = Date.now();
    while (Date.now() - t0 < 25000) {
      try {
        gateDetail = await withTimeout(
          page.evaluate(() => {
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
          }),
          3000,
          'gate',
        );
        if (gateDetail.ok) {
          gateOk = true;
          break;
        }
      } catch (e: any) {
        gateDetail = { err: String(e?.message || e) };
      }
      await sleep(400);
    }
    notes.observations.tree_gate = { ok: gateOk, ...gateDetail, elapsed_ms: Date.now() - t0 };
    if (!gateOk) {
      await shot(page, '01-FAIL-empty-tree.png').catch(() => {});
      push('01-FAIL-empty-tree.png');
      fs.writeFileSync(
        path.join(OUT, 'MANIFEST.json'),
        JSON.stringify(
          {
            pack: 'web-7137c22-06',
            baseline_sha: BASELINE,
            pass_claimed: false,
            result: 'FAIL_EMPTY_TREE',
            tree_gate: notes.observations.tree_gate,
            captures: notes.captures,
          },
          null,
          2,
        ),
      );
      fs.writeFileSync(path.join(OUT, 'NOTES.md'), [
        '# web-7137c22-06 FAIL_EMPTY_TREE',
        '- baseline: ' + BASELINE,
        '- pass_claimed: false',
        '- tree_gate: ' + JSON.stringify(notes.observations.tree_gate),
        '',
      ].join('\n'));
      expect(gateOk, 'tree gate HARD — never treat empty / 尚未打开工程 as loaded').toBe(true);
      return;
    }

    // 01: tree loaded (not broadband)
    await shot(page, '01-project-tree-loaded.png');
    push('01-project-tree-loaded.png');
    if (await shotEl(page, 'project-tree', '01b-project-tree-crop.png')) push('01b-project-tree-crop.png');

    // --- 窄带 → 信号观察 ---
    await withTimeout(
      page.getByTestId('btn-workspace-narrowband').click({ force: true, timeout: 4000 }),
      5000,
      'nb-click',
    );
    await expect(page.getByTestId('workspace-narrowband')).toBeVisible({ timeout: 15000 });
    if ((await page.getByTestId('nb-page-observe').count()) > 0) {
      await page.getByTestId('nb-page-observe').click({ force: true, timeout: 3000 }).catch(() => {});
    }
    await expect(page.getByTestId('workspace-narrowband-observe')).toBeVisible({ timeout: 15000 });

    // Wait chart-ready (soft-poll; do not invent PASS)
    let chartsReady = false;
    const tReady = Date.now();
    while (Date.now() - tReady < 90000) {
      const a = await page.getByTestId('nb-panel-waveform').getAttribute('data-nb-chart-ready').catch(() => null);
      const b = await page.getByTestId('nb-panel-psd').getAttribute('data-nb-chart-ready').catch(() => null);
      const c = await page.getByTestId('nb-panel-stft').getAttribute('data-nb-chart-ready').catch(() => null);
      if (a === 'true' && b === 'true' && c === 'true') {
        chartsReady = true;
        break;
      }
      await sleep(500);
    }
    notes.observations.chart_ready = {
      ok: chartsReady,
      wave: await page.getByTestId('nb-panel-waveform').getAttribute('data-nb-chart-ready').catch(() => null),
      psd: await page.getByTestId('nb-panel-psd').getAttribute('data-nb-chart-ready').catch(() => null),
      stft: await page.getByTestId('nb-panel-stft').getAttribute('data-nb-chart-ready').catch(() => null),
      elapsed_ms: Date.now() - tReady,
    };
    if (!chartsReady) notes.gaps.push('NB chart-ready timeout — PARTIAL; still capturing pipeline');
    await sleep(600);

    // 02: post-load NB observe full page (must differ from 01; no broadband)
    await shot(page, '02-nb-observe-ready.png');
    push('02-nb-observe-ready.png');
    const h01 = hash(path.join(OUT, '01-project-tree-loaded.png'));
    const h02 = hash(path.join(OUT, '02-nb-observe-ready.png'));
    const soft02ne01 = h01 !== h02;
    notes.observations.shot02_ne_01 = { different: soft02ne01, h01, h02, soft: true };
    if (!soft02ne01) notes.gaps.push('02≈01 soft-fail (hashes equal)');

    // 06 REQUIRED: pipeline element
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
      text: pipeText.slice(0, 400),
      title: pipeTitle.slice(0, 400),
      attrs: pipeAttrs,
      has_真实_DDC: hasRealDdc,
    };
    if (!hasRealDdc) notes.gaps.push('06 missing 「真实 DDC」 — PARTIAL (shot saved, no PASS invent)');

    const got06 = await shotEl(page, 'nb-observe-pipeline', '06-nb-ddc-pipeline-state.png');
    if (got06) {
      push('06-nb-ddc-pipeline-state.png');
    } else {
      // fallback full-page if element shot failed
      await shot(page, '06-nb-ddc-pipeline-state.png');
      push('06-nb-ddc-pipeline-state.png');
      notes.gaps.push('06 element screenshot failed — used fullPage fallback');
    }
    // Extra context crop of observe workspace (still NB-only)
    if (await shotEl(page, 'workspace-narrowband-observe', '06b-nb-observe-workspace.png')) {
      push('06b-nb-observe-workspace.png');
    }

    notes.absolute_png_paths = notes.captures.map((c: string) => path.join(OUT, c));
    const manifest = {
      pack: 'web-7137c22-06',
      baseline_sha: BASELINE,
      tip_web_base: BASELINE,
      evidence_sha_after_commit: 'PENDING_COMMIT',
      pass_claimed: false,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      focus: 'narrowband-observe-ddc-pipeline',
      tree_gate: notes.observations.tree_gate,
      chart_ready: notes.observations.chart_ready,
      shot02_ne_01: notes.observations.shot02_ne_01,
      shot06_has_真实_DDC: hasRealDdc,
      captures: notes.captures,
      gaps: notes.gaps,
      skipped: notes.skipped,
      absolute_png_paths: notes.absolute_png_paths,
      out_dir: OUT,
      sigmf_demo_dir: SIGMF_DIR,
      observations: notes.observations,
    };
    fs.writeFileSync(path.join(OUT, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(OUT, 'notes.json'), JSON.stringify(notes, null, 2));
    fs.writeFileSync(
      path.join(OUT, 'NOTES.md'),
      [
        '# web-7137c22-06 NB DDC pipeline remake (NOT PASS)',
        '- baseline_sha: ' + BASELINE,
        '- tip_sha: PENDING_COMMIT (filled after git commit)',
        '- pass_claimed: false',
        '- focus: narrowband-observe only (no broadband shots)',
        '- tree_gate: ' + JSON.stringify(notes.observations.tree_gate),
        '- chart_ready: ' + JSON.stringify(notes.observations.chart_ready),
        '- 真实 DDC visible: ' + String(hasRealDdc),
        '- pipeline text: ' + pipeText.slice(0, 300),
        '- 02≠01 soft: ' + String(soft02ne01) + ' (h01=' + h01.slice(0, 12) + ' h02=' + h02.slice(0, 12) + ')',
        '- gaps: ' + JSON.stringify(notes.gaps),
        '- skipped: ' + JSON.stringify(notes.skipped),
        '',
        '## PNG',
        ...notes.absolute_png_paths.map((p: string) => '- ' + p),
        '',
        'No PASS. Colorbar deferred (PARTIAL OK).',
        '',
      ].join('\n'),
    );

    expect(notes.pass_claimed).toBe(false);
    expect(gateOk).toBe(true);
    expect(fs.existsSync(path.join(OUT, '06-nb-ddc-pipeline-state.png'))).toBe(true);
    // Soft asserts — document only, do not hard-fail pack on missing 真实 DDC
    if (!hasRealDdc) {
      console.warn('[PARTIAL] 06 missing 真实 DDC');
    }
    if (!soft02ne01) {
      console.warn('[SOFT-FAIL] 02≈01');
    }
  });
});
