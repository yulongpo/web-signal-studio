/**
 * Bot-G QUALITY supplement @ ab29e28 (5f8c849+C docs). NOT PASS.
 * Tree loaded gate; colorbar; shell zh/EN residue; center Aux Wave non-empty with IQ.
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const TIP = 'ab29e281c374a11531fc9df0d5a937f079fa096e';
const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-ab29e28-quality');
const DESKTOP = '17471a6488383b456281d12cb1a6d3d80290205d';
const SIGMF_DIR = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo';
const META = path.join(SIGMF_DIR, '0000000.sigmf-meta');
const DATA = path.join(SIGMF_DIR, '0000000.sigmf-data');
const DESKTOP_QA = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/desktop-17471a6');

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
async function shot(page: Page, name: string) {
  ensure();
  await withTimeout(page.screenshot({ path: path.join(OUT, name), fullPage: true }), 12000, 'shot:' + name);
}

test.describe('Bot-G QUALITY ab29e28 NOT PASS', () => {
  test.setTimeout(180_000);
  test('tree + colorbar + shell zh + aux wave', async ({ page }) => {
    ensure();
    expect(fs.existsSync(META)).toBe(true);
    const notes: any = {
      id: 'qa-web-ab29e28-quality', tip_web_base: TIP, tip_desktop_compare: DESKTOP,
      pass_claimed: false, matrix_pass_claimed: false, ui_parity_pass_claimed: false,
      g06_g17_claimed: false, quality: true, supplement_of: 'web-7969aba-quality',
      sigmf_demo_dir: SIGMF_DIR, captures: [] as string[], observations: {} as any,
      gaps: [] as string[], skipped: [] as string[],
    };
    const push = (n: string) => { if (!notes.captures.includes(n)) notes.captures.push(n); };
    for (const [src, dest] of [
      [path.join(DESKTOP_QA, 'desktop-primary-screen.png'), 'desktop-01-primary.png'],
      [path.join(DESKTOP_QA, 'ref-wideband-release.png'), 'desktop-02-wideband.png'],
    ] as [string, string][]) {
      if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(OUT, dest)); push(dest); }
    }

    await withTimeout(page.goto('/'), 20000, 'goto');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 20000 });

    // IQ load (input preferred; menu soft)
    notes.observations.load = {};
    try {
      await withTimeout((async () => {
        await page.getByTestId('menubar-file').click({ force: true, timeout: 2000 });
        await page.getByTestId('menu-load-demo-iq').click({ force: true, timeout: 2000, noWaitAfter: true });
      })(), 4000, 'menu-demo');
      notes.observations.load.menu = 'clicked';
      await sleep(2000);
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

    // Tree gate via evaluate
    let gateOk = false; let gateDetail: any = {};
    const t0 = Date.now();
    while (Date.now() - t0 < 20000) {
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
          return { ok, emptyVisible, hasEmptyPhrase, loaded, sample, nodes, tree: treeText.slice(0, 200) };
        }), 3000, 'gate');
        if (gateDetail.ok) { gateOk = true; break; }
      } catch (e: any) { gateDetail = { err: String(e?.message || e) }; }
      await sleep(400);
    }
    notes.observations.tree_gate = { ok: gateOk, ...gateDetail };
    if (!gateOk) {
      await shot(page, '01-FAIL-empty-tree.png').catch(() => {});
      push('01-FAIL-empty-tree.png');
      fs.writeFileSync(path.join(OUT, 'MANIFEST.json'), JSON.stringify({ pack: 'web-ab29e28-quality', tip_web_base: TIP, pass_claimed: false, result: 'FAIL_EMPTY_TREE', tree_gate: notes.observations.tree_gate }, null, 2));
      expect(gateOk, 'tree gate').toBe(true);
      return;
    }
    await shot(page, '01-project-tree-loaded.png'); push('01-project-tree-loaded.png');

    // Shell zh / EN residue — menubar + strip
    await page.getByTestId('btn-workspace-wideband').click({ force: true, timeout: 2500 }).catch(() => {});
    await page.getByTestId('btn-mode-stft').click({ force: true, timeout: 2500 }).catch(() => {});
    await sleep(250);
    const menubarText = await page.getByTestId('menubar').innerText().catch(() => '');
    const stripText = await page.getByTestId('chart-strip-main').innerText().catch(() => '');
    const shellText = menubarText + '\n' + stripText;
    // Flag obvious leftover English chrome tokens (soft — document only)
    const enResidue = Array.from(shellText.matchAll(/\b(File|Edit|View|Help|Open|Save|Settings|Workspace|Narrowband|Wideband|Palette|Colormap)\b/g)).map((m) => m[0]);
    notes.observations.shot02_shell = {
      has_cjk: /[\u4e00-\u9fff]/.test(shellText),
      en_residue_tokens: [...new Set(enResidue)].slice(0, 30),
      menubar_snippet: menubarText.slice(0, 300),
    };
    await shot(page, '02-shell-zh-en-residue.png'); push('02-shell-zh-en-residue.png');
    if (await page.getByTestId('menubar').count()) {
      await page.getByTestId('menubar').screenshot({ path: path.join(OUT, '02b-menubar-crop.png') }).catch(() => {});
      if (fs.existsSync(path.join(OUT, '02b-menubar-crop.png'))) push('02b-menubar-crop.png');
    }

    // Colorbar / colorscale — prefer waterfall where colorbar shows
    await page.getByTestId('btn-mode-waterfall').click({ force: true, timeout: 2500 }).catch(() => {});
    await sleep(400);
    const colorbar = page.getByTestId('display-colorscale');
    const palette = page.getByTestId('select-palette');
    notes.observations.shot03_colorbar = {
      chart_mode: await page.getByTestId('main-chart-host').getAttribute('data-chart-mode').catch(() => null),
      colorscale_visible: await colorbar.isVisible().catch(() => false),
      colorscale_text: await colorbar.innerText().catch(() => null),
      palette_visible: await palette.isVisible().catch(() => false),
      palette_value: await palette.inputValue().catch(() => null),
      strip_palette: await page.getByTestId('chart-strip-qlabel-palette-value').innerText().catch(() => null),
    };
    if (!notes.observations.shot03_colorbar.colorscale_visible) {
      notes.gaps.push('03 display-colorscale not visible — PARTIAL');
    }
    await shot(page, '03-colorbar-waterfall.png'); push('03-colorbar-waterfall.png');
    if (await colorbar.isVisible().catch(() => false)) {
      await colorbar.screenshot({ path: path.join(OUT, '03b-colorbar-crop.png') }).catch(() => {});
      if (fs.existsSync(path.join(OUT, '03b-colorbar-crop.png'))) push('03b-colorbar-crop.png');
    }

    // Aux Wave center — non-empty when IQ open
    await page.getByTestId('btn-mode-stft').click({ force: true, timeout: 2000 }).catch(() => {});
    const auxBtn = page.getByTestId('btn-aux-wave');
    if (await auxBtn.isVisible().catch(() => false)) {
      await auxBtn.click({ force: true, timeout: 2500 }).catch(() => {});
      await sleep(500);
    }
    const auxChart = page.getByTestId('aux-chart');
    const auxWaiting = page.getByTestId('aux-chart-waiting');
    notes.observations.shot04_aux = {
      aux_btn_active: await auxBtn.getAttribute('data-active').catch(() => null),
      aux_chart_visible: await auxChart.isVisible().catch(() => false),
      aux_waiting_visible: await auxWaiting.isVisible().catch(() => false),
      aux_waiting_text: await auxWaiting.innerText().catch(() => null),
      strip_aux: await page.getByTestId('chart-strip-aux').isVisible().catch(() => false),
      host_dsp: await page.getByTestId('main-chart-host').getAttribute('data-dsp-source').catch(() => null),
    };
    // non-empty: aux chart visible and not stuck on waiting-only
    const auxOk = notes.observations.shot04_aux.aux_chart_visible && !notes.observations.shot04_aux.aux_waiting_visible;
    if (!auxOk) notes.gaps.push('04 Aux Wave not clearly non-empty — PARTIAL');
    await shot(page, '04-aux-wave-center.png'); push('04-aux-wave-center.png');
    if (await auxChart.isVisible().catch(() => false)) {
      await auxChart.screenshot({ path: path.join(OUT, '04b-aux-chart-crop.png') }).catch(() => {});
      if (fs.existsSync(path.join(OUT, '04b-aux-chart-crop.png'))) push('04b-aux-chart-crop.png');
    }

    notes.skipped.push('G06/G17 — not invented');
    notes.absolute_png_paths = notes.captures.map((c: string) => path.join(OUT, c));
    const manifest = {
      pack: 'web-ab29e28-quality', tip_web_base: TIP, tip_desktop_compare: DESKTOP,
      evidence_sha_after_commit: 'PENDING_COMMIT', pass_claimed: false,
      matrix_pass_claimed: false, ui_parity_pass_claimed: false, quality: true,
      supplement_of: 'web-7969aba-quality',
      tree_gate: notes.observations.tree_gate, load: notes.observations.load,
      captures: notes.captures, gaps: notes.gaps, absolute_png_paths: notes.absolute_png_paths,
      observations: notes.observations, out_dir: OUT, sigmf_demo_dir: SIGMF_DIR,
    };
    fs.writeFileSync(path.join(OUT, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(OUT, 'notes.json'), JSON.stringify(notes, null, 2));
    fs.writeFileSync(path.join(OUT, 'COMPARISON_NOTES.md'), [
      '# web-ab29e28-quality NOT PASS (supplement after 7969aba)',
      '- tip: ' + TIP,
      '- tree_gate: ' + JSON.stringify(notes.observations.tree_gate),
      '- shell: ' + JSON.stringify(notes.observations.shot02_shell),
      '- colorbar: ' + JSON.stringify(notes.observations.shot03_colorbar),
      '- aux: ' + JSON.stringify(notes.observations.shot04_aux),
      '- gaps: ' + JSON.stringify(notes.gaps),
      '',
      ...notes.absolute_png_paths.map((p: string) => '- ' + p),
      '',
      'No PASS.',
    ].join('\n'));
    expect(notes.pass_claimed).toBe(false);
    expect(notes.observations.tree_gate.ok).toBe(true);
  });
});
