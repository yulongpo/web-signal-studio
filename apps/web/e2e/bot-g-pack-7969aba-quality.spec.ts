/**
 * Bot-G QUALITY @ 7969aba — lean capture (NOT PASS). Node-timeouts only.
 * Prefer menu-load-demo-iq (soft); tree gate hard; 01≠03; NB 05/06.
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const TIP = '7969abaa3ed64234f250aa459dec16153666bddf';
const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-7969aba-quality');
const DESKTOP = '17471a6488383b456281d12cb1a6d3d80290205d';
const SIGMF_DIR = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo';
const META = path.join(SIGMF_DIR, '0000000.sigmf-meta');
const DATA = path.join(SIGMF_DIR, '0000000.sigmf-data');
const DESKTOP_QA = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/desktop-17471a6');
const REBUILD_CR = 'D:/project/signal_studio_rebuild/artifacts/chart-regression';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: NodeJS.Timeout;
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, rej) => {
        t = setTimeout(() => rej(new Error(label + ' timeout ' + ms)), ms);
      }),
    ]);
  } finally {
    clearTimeout(t!);
  }
}
function ensure() { fs.mkdirSync(OUT, { recursive: true }); }
async function shot(page: Page, name: string) {
  ensure();
  await withTimeout(page.screenshot({ path: path.join(OUT, name), fullPage: true }), 12000, 'shot ' + name);
}
function hash(p: string) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }

test.describe('Bot-G QUALITY 7969aba lean NOT PASS', () => {
  test.setTimeout(180_000);
  test('quality pack', async ({ page }) => {
    ensure();
    expect(fs.existsSync(META)).toBe(true);
    const notes: any = {
      id: 'qa-web-7969aba-quality', tip_web_base: TIP, tip_desktop_compare: DESKTOP,
      pass_claimed: false, matrix_pass_claimed: false, ui_parity_pass_claimed: false,
      g06_g17_claimed: false, quality: true, sigmf_demo_dir: SIGMF_DIR,
      captures: [] as string[], observations: {} as any, gaps: [] as string[], skipped: [] as string[],
      desktop_pairs: [] as any[],
    };
    const push = (n: string) => { if (!notes.captures.includes(n)) notes.captures.push(n); };

    for (const [src, dest] of [
      [path.join(DESKTOP_QA, 'desktop-primary-screen.png'), 'desktop-01-primary.png'],
      [path.join(DESKTOP_QA, 'ref-wideband-release.png'), 'desktop-02-wideband.png'],
      [path.join(DESKTOP_QA, 'ref-narrowband-release.png'), 'desktop-05-narrowband.png'],
      [path.join(REBUILD_CR, 'signal-studio-narrowband-release-gpu-screen2-4k-150.png'), 'desktop-05b-nb-regression.png'],
      [path.join(REBUILD_CR, 'real-iq-waveform.png'), 'desktop-05c-real-iq-wave.png'],
      [path.join(REBUILD_CR, 'real-iq-psd.png'), 'desktop-05d-real-iq-psd.png'],
    ] as [string, string][]) {
      if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(OUT, dest)); push(dest); }
    }

    await withTimeout(page.goto('/'), 20000, 'goto');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 20000 });

    // Prefer menu-load-demo-iq (soft 4s); then input-iq; then sample for tree.
    notes.observations.load = { prefer: 'menu-load-demo-iq' };
    try {
      await withTimeout((async () => {
        await page.getByTestId('menubar-file').click({ force: true, timeout: 2000 });
        await page.getByTestId('menu-load-demo-iq').click({ force: true, timeout: 2000, noWaitAfter: true });
      })(), 4000, 'menu-demo');
      notes.observations.load.via = 'menu-load-demo-iq';
      await sleep(3000);
    } catch (e: any) {
      notes.observations.load.menu_err = String(e?.message || e);
      await page.keyboard.press('Escape').catch(() => {});
    }
    try {
      const iq = (await page.getByTestId('input-iq-wav').count()) > 0
        ? page.getByTestId('input-iq-wav')
        : page.getByTestId('menubar-input-iq');
      await withTimeout(iq.setInputFiles([META, DATA]), 8000, 'setInputFiles');
      notes.observations.load.input = 'ok';
      await sleep(800);
    } catch (e: any) {
      notes.observations.load.input_err = String(e?.message || e);
    }
    // B sample-in-tree: ensure tree has content
    try {
      await withTimeout(page.getByTestId('btn-load-sample').click({ force: true, timeout: 2500 }), 3000, 'sample');
      notes.observations.load.sample = true;
      await sleep(600);
    } catch { /* soft */ }

    // Tree gate (max ~20s node loop)
    let gateOk = false;
    let gateDetail: any = {};
    const t0 = Date.now();
    while (Date.now() - t0 < 20000) {
      try {
        const detail = await withTimeout(page.evaluate(() => {
          const empty = document.querySelector('[data-testid="project-tree-empty"]');
          const emptyVisible = !!(empty && (empty as HTMLElement).offsetParent !== null);
          const emptyText = empty?.textContent || '';
          const tree = document.querySelector('[data-testid="project-tree"]');
          const treeText = tree?.textContent || '';
          const summary = document.querySelector('[data-testid="project-summary"]')?.textContent || '';
          const loaded = !!document.querySelector('[data-testid="project-tree-loaded"]');
          const sample = !!document.querySelector('[data-testid="project-tree-sample"]');
          const nodes = document.querySelectorAll('[data-testid^="tree-node-"]').length;
          const hasEmptyPhrase = /尚未打开工程/.test(emptyText + treeText);
          const fileMatch = (summary + treeText).match(/(\d+)\s*文件/);
          const filesCount = fileMatch ? Number(fileMatch[1]) : nodes;
          const channelWord = /通道|信道|channel/i.test(treeText + summary);
          const ok = !emptyVisible && !hasEmptyPhrase && (loaded || sample) && filesCount > 0 && (channelWord || nodes > 0);
          return { ok, emptyVisible, hasEmptyPhrase, loaded, sample, filesCount, nodes, channelWord, summary: summary.slice(0, 160), tree: treeText.slice(0, 200) };
        }), 3000, 'gate-eval');
        gateDetail = detail;
        if (detail.ok) { gateOk = true; break; }
      } catch (e: any) {
        gateDetail = { eval_err: String(e?.message || e) };
      }
      await sleep(400);
    }
    notes.observations.tree_gate = { ok: gateOk, ...gateDetail, elapsed_ms: Date.now() - t0 };
    if (!gateOk) {
      await shot(page, '01-FAIL-empty-tree.png').catch(() => {});
      push('01-FAIL-empty-tree.png');
      fs.writeFileSync(path.join(OUT, 'MANIFEST.json'), JSON.stringify({ pack: 'web-7969aba-quality', tip_web_base: TIP, pass_claimed: false, tree_gate: notes.observations.tree_gate, result: 'FAIL_EMPTY_TREE', captures: notes.captures }, null, 2));
      fs.writeFileSync(path.join(OUT, 'notes.json'), JSON.stringify(notes, null, 2));
      expect(gateOk, 'TREE GATE failed').toBe(true);
      return;
    }

    const host = page.getByTestId('main-chart-host');
    notes.observations.shot01 = {
      dsp_source: await host.getAttribute('data-dsp-source').catch(() => null),
      iq_format: await host.getAttribute('data-iq-format').catch(() => null),
      view: 'tree',
    };
    await shot(page, '01-project-tree-demo-loaded.png'); push('01-project-tree-demo-loaded.png');
    await withTimeout(page.getByTestId('project-tree').screenshot({ path: path.join(OUT, '01b-project-tree-crop.png') }), 8000, '01b').catch(() => {});
    if (fs.existsSync(path.join(OUT, '01b-project-tree-crop.png'))) push('01b-project-tree-crop.png');

    await page.getByTestId('btn-workspace-wideband').click({ force: true, timeout: 2500 }).catch(() => {});
    await page.getByTestId('btn-mode-stft').click({ force: true, timeout: 2500 }).catch(() => {});
    await sleep(300);
    notes.observations.shot02 = { chart_mode: await host.getAttribute('data-chart-mode').catch(() => null), view: 'stft' };
    await shot(page, '02-broadband-shell-stft.png'); push('02-broadband-shell-stft.png');

    await page.getByTestId('btn-mode-waterfall').click({ force: true, timeout: 2500 }).catch(() => {});
    await sleep(400);
    notes.observations.shot03 = { chart_mode: await host.getAttribute('data-chart-mode').catch(() => null), view: 'waterfall' };
    await shot(page, '03-broadband-waterfall.png'); push('03-broadband-waterfall.png');
    const h01 = hash(path.join(OUT, '01-project-tree-demo-loaded.png'));
    const h03 = hash(path.join(OUT, '03-broadband-waterfall.png'));
    notes.observations.shot01_vs_03 = { different: h01 !== h03, h01, h03 };
    expect(h01 !== h03, '01≠03').toBe(true);

    // 05/06 NB
    try {
      await withTimeout(page.getByTestId('btn-workspace-narrowband').click({ force: true, timeout: 3000 }), 4000, 'nb-click');
      await expect(page.getByTestId('workspace-narrowband')).toBeVisible({ timeout: 10000 });
      if ((await page.getByTestId('nb-page-observe').count()) > 0) {
        await page.getByTestId('nb-page-observe').click({ force: true, timeout: 2000 }).catch(() => {});
      }
      await expect(page.getByTestId('workspace-narrowband-observe')).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < 16; i++) {
        const a = await page.getByTestId('nb-panel-waveform').getAttribute('data-nb-chart-ready').catch(() => null);
        const b = await page.getByTestId('nb-panel-psd').getAttribute('data-nb-chart-ready').catch(() => null);
        const c = await page.getByTestId('nb-panel-stft').getAttribute('data-nb-chart-ready').catch(() => null);
        if (a === 'true' && b === 'true' && c === 'true') break;
        await sleep(200);
      }
      const pipe = page.getByTestId('nb-observe-pipeline');
      const pipeAll = (await pipe.count()) > 0 ? await pipe.evaluate((el) => {
        const o: Record<string, string> = {};
        for (const a of Array.from(el.attributes)) if (a.name.startsWith('data-')) o[a.name] = a.value;
        return o;
      }) : null;
      const split = page.getByTestId('nb-observe-split');
      notes.observations.shot05 = {
        wave_ready: await page.getByTestId('nb-panel-waveform').getAttribute('data-nb-chart-ready').catch(() => null),
        psd_ready: await page.getByTestId('nb-panel-psd').getAttribute('data-nb-chart-ready').catch(() => null),
        stft_ready: await page.getByTestId('nb-panel-stft').getAttribute('data-nb-chart-ready').catch(() => null),
        pipeline: pipeAll,
        nb_observe_top_h: (await split.count()) > 0 ? await split.getAttribute('data-nb-observe-top-h') : null,
      };
      if (notes.observations.shot05.wave_ready !== 'true') notes.gaps.push('05 chart-ready PARTIAL');
      await shot(page, '05-narrowband-observe-three-charts.png'); push('05-narrowband-observe-three-charts.png');
      await shot(page, '06-nb-ddc-pipeline-state.png'); push('06-nb-ddc-pipeline-state.png');
      notes.observations.shot06 = { pipeline: pipeAll, nb_observe_top_h: notes.observations.shot05.nb_observe_top_h };
    } catch (e: any) {
      notes.gaps.push('05/06 PARTIAL: ' + String(e?.message || e));
      await shot(page, '05-narrowband-PARTIAL.png').catch(() => {});
      push('05-narrowband-PARTIAL.png');
    }

    notes.skipped.push('G06/G17 — not invented');
    notes.absolute_png_paths = notes.captures.map((c: string) => path.join(OUT, c));
    const manifest = {
      pack: 'web-7969aba-quality', tip_web_base: TIP, tip_desktop_compare: DESKTOP,
      evidence_sha_after_commit: 'PENDING_COMMIT', pass_claimed: false, matrix_pass_claimed: false,
      ui_parity_pass_claimed: false, quality: true, tree_gate: notes.observations.tree_gate,
      shot01_vs_03: notes.observations.shot01_vs_03, load_via: notes.observations.load,
      captures: notes.captures, gaps: notes.gaps, absolute_png_paths: notes.absolute_png_paths,
      observations: notes.observations, out_dir: OUT, sigmf_demo_dir: SIGMF_DIR,
    };
    fs.writeFileSync(path.join(OUT, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(OUT, 'notes.json'), JSON.stringify(notes, null, 2));
    fs.writeFileSync(path.join(OUT, 'COMPARISON_NOTES.md'), [
      '# web-7969aba-quality NOT PASS',
      '- tip: ' + TIP,
      '- tree_gate: ' + JSON.stringify(notes.observations.tree_gate),
      '- load: ' + JSON.stringify(notes.observations.load),
      '- 01≠03: ' + JSON.stringify(notes.observations.shot01_vs_03),
      '- gaps: ' + JSON.stringify(notes.gaps),
      '- paths:',
      ...notes.absolute_png_paths.map((p: string) => '- ' + p),
    ].join('\n'));
    expect(notes.pass_claimed).toBe(false);
    expect(notes.observations.tree_gate.ok).toBe(true);
  });
});
