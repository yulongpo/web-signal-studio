/**
 * Bot-G pack @ 8f73f69: real-signal 01–06 (resilient, NOT PASS).
 * Load via input-iq; add-signal soft only; per-shot races.
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const TIP = '8f73f69461c044fc8bce3cc6efbc4f0903e0af06';
const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-8f73f69-real');
const DESKTOP = '17471a6488383b456281d12cb1a6d3d80290205d';
const SIGMF_DIR = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo';
const SIGMF_META = path.join(SIGMF_DIR, '0000000.sigmf-meta');
const SIGMF_DATA = path.join(SIGMF_DIR, '0000000.sigmf-data');
const DESKTOP_QA = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/desktop-17471a6');
const DESKTOP_BASE = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/baseline');
const REBUILD_CR = 'D:/project/signal_studio_rebuild/artifacts/chart-regression';

function ensure() { fs.mkdirSync(OUT, { recursive: true }); }
async function shot(page: Page, name: string) {
  ensure();
  await page.screenshot({ path: path.join(OUT, name), fullPage: true, timeout: 15000 });
}
async function shotEl(page: Page, testId: string, name: string) {
  ensure();
  const el = page.getByTestId(testId);
  if ((await el.count()) === 0) return false;
  await el.screenshot({ path: path.join(OUT, name), timeout: 10000 });
  return true;
}
function copyDesktop(src: string, destName: string) {
  ensure();
  if (!fs.existsSync(src)) return false;
  fs.copyFileSync(src, path.join(OUT, destName));
  return true;
}
async function race<T>(p: Promise<T>, ms: number, label: string): Promise<T | null> {
  try {
    return await Promise.race([
      p,
      new Promise<null>((_, rej) => setTimeout(() => rej(new Error(label + ' timeout ' + ms + 'ms')), ms)),
    ]);
  } catch (e: any) {
    return null;
  }
}

test.describe('Bot-G pack 8f73f69 real-signal NOT PASS', () => {
  test.setTimeout(360_000);
  test('real-signal 01–06 Web vs desktop', async ({ page }) => {
    ensure();
    expect(fs.existsSync(SIGMF_META)).toBe(true);
    expect(fs.existsSync(SIGMF_DATA)).toBe(true);
    const notes: any = {
      id: 'qa-web-8f73f69-real-signal',
      tip_web_base: TIP,
      tip_desktop_compare: DESKTOP,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      pass_claimed: false,
      g06_g17_claimed: false,
      sigmf_demo_dir: SIGMF_DIR,
      captures: [] as string[],
      desktop_pairs: [] as any[],
      observations: {} as any,
      gaps: [] as string[],
      skipped: [] as string[],
    };
    const push = (n: string) => { if (!notes.captures.includes(n)) notes.captures.push(n); };
    const pair = (web: string, desk: string | null, note: string) => {
      notes.desktop_pairs.push({ web, desktop: desk, note });
    };

    for (const [src, dest, note] of [
      [path.join(DESKTOP_QA, 'desktop-primary-screen.png'), 'desktop-01-primary.png', '01/02'],
      [path.join(DESKTOP_QA, 'ref-wideband-release.png'), 'desktop-03-wideband-stft.png', '03'],
      [path.join(REBUILD_CR, 'signal-studio-release-gpu-screen2-4k-150.png'), 'desktop-03b-wideband-gpu.png', '03b'],
      [path.join(DESKTOP_QA, 'ref-narrowband-release.png'), 'desktop-05-narrowband.png', '05'],
      [path.join(REBUILD_CR, 'signal-studio-narrowband-release-gpu-screen2-4k-150.png'), 'desktop-05b-nb-chart-regression.png', '05b'],
      [path.join(REBUILD_CR, 'real-iq-waveform.png'), 'desktop-05c-real-iq-wave.png', '05c'],
      [path.join(REBUILD_CR, 'real-iq-psd.png'), 'desktop-05d-real-iq-psd.png', '05d'],
      [path.join(DESKTOP_BASE, 'desktop-ref-wideband-release.png'), 'desktop-04-wideband-baseline.png', '04'],
    ] as [string, string, string][]) {
      if (copyDesktop(src, dest)) { push(dest); notes.desktop_pairs.push({ web: null, desktop: dest, note, src }); }
      else notes.gaps.push('desktop missing ' + src);
    }

    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 25000 });
    const host = page.getByTestId('main-chart-host');

    // 01 load + tree
    try {
      const iq = page.getByTestId('menubar-input-iq');
      if ((await iq.count()) > 0) await iq.setInputFiles([SIGMF_META, SIGMF_DATA]);
      else await page.getByTestId('input-iq-wav').setInputFiles([SIGMF_META, SIGMF_DATA]);
      await page.waitForTimeout(900);
      notes.observations.load = { via: 'input-iq (menu-load-demo skipped to avoid hang)' };
      const tree = page.getByTestId('project-tree');
      await expect(tree).toBeVisible({ timeout: 8000 });
      const treeText = await tree.innerText().catch(() => '');
      notes.observations.shot01 = {
        dsp_source: await host.getAttribute('data-dsp-source').catch(() => null),
        iq_format: await host.getAttribute('data-iq-format').catch(() => null),
        tree_snippet: treeText.slice(0, 400),
        has_cjk: /[\u4e00-\u9fff]/.test(treeText),
      };
      await shot(page, '01-project-tree-cn-demo-loaded.png'); push('01-project-tree-cn-demo-loaded.png');
      if (await shotEl(page, 'project-tree', '01b-project-tree-crop.png')) push('01b-project-tree-crop.png');
      pair('01-project-tree-cn-demo-loaded.png', 'desktop-01-primary.png', 'tree vs desktop primary');
    } catch (e: any) {
      notes.gaps.push('01 PARTIAL: ' + String(e?.message || e));
      await shot(page, '01-project-tree-PARTIAL.png').catch(() => {});
      push('01-project-tree-PARTIAL.png');
    }

    // 02 soft dialog — 12s race
    notes.observations.shot02 = { file_pick: 'skipped-soft-only' };
    const ok02 = await race((async () => {
      await page.keyboard.press('Escape').catch(() => {});
      await page.getByTestId('menubar-file').click({ force: true, timeout: 2000 });
      await page.getByTestId('menu-open-iq').click({ force: true, timeout: 2000, noWaitAfter: true });
      const dlg = page.getByTestId('add-signal-dialog');
      const vis = await dlg.isVisible({ timeout: 2500 }).catch(() => false);
      notes.observations.shot02.dialog_visible = vis;
      notes.observations.shot02.data_add_signal = vis ? await dlg.getAttribute('data-add-signal') : null;
      notes.observations.shot02.title = vis ? await page.getByTestId('add-signal-title').innerText().catch(() => null) : null;
      if (vis) {
        await shot(page, '02-add-signal-dialog.png'); push('02-add-signal-dialog.png');
        if (await shotEl(page, 'add-signal-dialog', '02b-add-signal-dialog-crop.png')) push('02b-add-signal-dialog-crop.png');
        pair('02-add-signal-dialog.png', 'desktop-01-primary.png', 'add-signal soft');
        await page.getByTestId('add-signal-close').click({ force: true, timeout: 1500 }).catch(async () => page.keyboard.press('Escape'));
      } else {
        notes.gaps.push('02 dialog not visible — PARTIAL');
        await shot(page, '02-add-signal-dialog-PARTIAL.png'); push('02-add-signal-dialog-PARTIAL.png');
        pair('02-add-signal-dialog-PARTIAL.png', 'desktop-01-primary.png', 'add-signal PARTIAL');
        await page.keyboard.press('Escape').catch(() => {});
      }
      return true;
    })(), 12000, 'shot02');
    if (!ok02) {
      notes.gaps.push('02 soft-timeout PARTIAL');
      if (!notes.captures.some((c: string) => c.startsWith('02-'))) {
        await shot(page, '02-add-signal-dialog-PARTIAL.png').catch(() => {});
        push('02-add-signal-dialog-PARTIAL.png');
      }
      await page.keyboard.press('Escape').catch(() => {});
    }

    // 03 broadband STFT
    try {
      await page.getByTestId('btn-workspace-wideband').click({ force: true, timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(200);
      await page.getByTestId('btn-mode-stft').click({ force: true, timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(250);
      const menubarText = await page.getByTestId('menubar').innerText().catch(() => '');
      const stripText = await page.getByTestId('chart-strip-main').innerText().catch(() => '');
      notes.observations.shot03 = {
        chart_mode: await host.getAttribute('data-chart-mode').catch(() => null),
        has_cjk: /[\u4e00-\u9fff]/.test(menubarText + stripText),
        has_en: /[A-Za-z]{3,}/.test(menubarText + stripText),
      };
      await shot(page, '03-broadband-shell-stft-cjk-en.png'); push('03-broadband-shell-stft-cjk-en.png');
      pair('03-broadband-shell-stft-cjk-en.png', 'desktop-03-wideband-stft.png', 'STFT vs desktop WB');
    } catch (e: any) {
      notes.gaps.push('03 PARTIAL: ' + String(e?.message || e));
      await shot(page, '03-broadband-PARTIAL.png').catch(() => {});
      push('03-broadband-PARTIAL.png');
    }

    // 04 waterfall
    try {
      await page.getByTestId('btn-mode-waterfall').click({ force: true, timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(350);
      notes.observations.shot04 = { chart_mode: await host.getAttribute('data-chart-mode').catch(() => null) };
      await shot(page, '04-broadband-waterfall.png'); push('04-broadband-waterfall.png');
      pair('04-broadband-waterfall.png', 'desktop-04-wideband-baseline.png', 'waterfall vs desktop');
      await page.getByTestId('btn-mode-stft').click({ force: true, timeout: 2000 }).catch(() => {});
    } catch (e: any) {
      notes.gaps.push('04 PARTIAL: ' + String(e?.message || e));
      await shot(page, '04-waterfall-PARTIAL.png').catch(() => {});
      push('04-waterfall-PARTIAL.png');
    }

    // 06a mark soft
    let markBefore: string | null = null;
    try {
      await host.click({ button: 'right', timeout: 2000 });
      await page.waitForTimeout(120);
      if (await page.getByTestId('chart-menu-mark').isVisible({ timeout: 1500 }).catch(() => false)) {
        await page.getByTestId('chart-menu-mark').click({ force: true, timeout: 2000 });
        await page.waitForTimeout(200);
        markBefore = await page.getByTestId('chart-mark-layer').getAttribute('data-mark-count').catch(() => null);
        await shot(page, '06a-broadband-mark-before-nb.png'); push('06a-broadband-mark-before-nb.png');
      } else {
        await page.keyboard.press('Escape').catch(() => {});
        notes.gaps.push('06 mark menu absent — soft');
      }
    } catch (e: any) {
      notes.gaps.push('06a soft: ' + String(e?.message || e));
      await page.keyboard.press('Escape').catch(() => {});
    }
    notes.observations.shot06_mark_before = { mark_count: markBefore };

    // 05 NB Observe
    try {
      await page.getByTestId('btn-workspace-narrowband').click({ force: true, timeout: 4000 });
      await expect(page.getByTestId('workspace-narrowband')).toBeVisible({ timeout: 8000 });
      if ((await page.getByTestId('nb-page-observe').count()) > 0) {
        await page.getByTestId('nb-page-observe').click({ force: true, timeout: 2000 }).catch(() => {});
      }
      await expect(page.getByTestId('workspace-narrowband-observe')).toBeVisible({ timeout: 8000 });
      const wave = page.getByTestId('nb-panel-waveform');
      const psd = page.getByTestId('nb-panel-psd');
      const stft = page.getByTestId('nb-panel-stft');
      for (let i = 0; i < 16; i++) {
        const a = await wave.getAttribute('data-nb-chart-ready').catch(() => null);
        const b = await psd.getAttribute('data-nb-chart-ready').catch(() => null);
        const c = await stft.getAttribute('data-nb-chart-ready').catch(() => null);
        if (a === 'true' && b === 'true' && c === 'true') break;
        await page.waitForTimeout(200);
      }
      const pipeline = page.getByTestId('nb-observe-pipeline');
      let pipeAll: any = null;
      if ((await pipeline.count()) > 0) {
        pipeAll = await pipeline.evaluate((el) => {
          const o: Record<string, string> = {};
          for (const attr of Array.from(el.attributes)) if (attr.name.startsWith('data-')) o[attr.name] = attr.value;
          return o;
        });
      }
      notes.observations.shot05 = {
        wave_ready: await wave.getAttribute('data-nb-chart-ready').catch(() => null),
        psd_ready: await psd.getAttribute('data-nb-chart-ready').catch(() => null),
        stft_ready: await stft.getAttribute('data-nb-chart-ready').catch(() => null),
        wave_mounted: (await page.getByTestId('nb-chart-waveform').count()) > 0,
        psd_mounted: (await page.getByTestId('nb-chart-psd').count()) > 0,
        stft_mounted: (await page.getByTestId('nb-chart-stft').count()) > 0,
        pipeline: pipeAll,
        mark_in_nb: await page.getByTestId('chart-mark-layer').getAttribute('data-mark-count').catch(() => null),
      };
      if (notes.observations.shot05.wave_ready !== 'true' || notes.observations.shot05.psd_ready !== 'true' || notes.observations.shot05.stft_ready !== 'true') {
        notes.gaps.push('05 NB panels not all chart-ready — PARTIAL');
      }
      await shot(page, '05-narrowband-observe-three-charts.png'); push('05-narrowband-observe-three-charts.png');
      if (await shotEl(page, 'nb-panel-waveform', '05b-nb-wave-crop.png')) push('05b-nb-wave-crop.png');
      if (await shotEl(page, 'nb-panel-psd', '05c-nb-psd-crop.png')) push('05c-nb-psd-crop.png');
      if (await shotEl(page, 'nb-panel-stft', '05d-nb-stft-crop.png')) push('05d-nb-stft-crop.png');
      if ((await pipeline.count()) > 0 && (await shotEl(page, 'nb-observe-pipeline', '05e-nb-pipeline-crop.png'))) push('05e-nb-pipeline-crop.png');
      pair('05-narrowband-observe-three-charts.png', 'desktop-05-narrowband.png', 'NB vs desktop');
      await shot(page, '06b-nb-after-broadband-mark.png'); push('06b-nb-after-broadband-mark.png');
      notes.observations.shot06_after = { mark_before: markBefore, mark_in_nb: notes.observations.shot05.mark_in_nb, pipeline: pipeAll };
      if (!markBefore || markBefore === '0') notes.gaps.push('06 mark→DDC PARTIAL');
      pair('06b-nb-after-broadband-mark.png', 'desktop-05b-nb-chart-regression.png', 'mark→NB');
    } catch (e: any) {
      notes.gaps.push('05/06 PARTIAL: ' + String(e?.message || e));
      await shot(page, '05-narrowband-PARTIAL.png').catch(() => {});
      push('05-narrowband-PARTIAL.png');
    }

    notes.skipped.push('G06/G17 — not invented');
    notes.absolute_png_paths = notes.captures.map((c: string) => path.join(OUT, c));
    const manifest = {
      pack: 'web-8f73f69-real',
      tip_web_base: TIP,
      tip_desktop_compare: DESKTOP,
      evidence_sha_after_commit: 'PENDING_COMMIT',
      pass_claimed: false,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      g06_g17_claimed: false,
      sigmf_demo_dir: SIGMF_DIR,
      out_dir: OUT,
      load_via: notes.observations.load,
      captures: notes.captures,
      desktop_pairs: notes.desktop_pairs,
      gaps: notes.gaps,
      skipped: notes.skipped,
      absolute_png_paths: notes.absolute_png_paths,
      observations: notes.observations,
      note: 'add-signal soft only; menu-load-demo skipped (hang); input-iq used',
    };
    fs.writeFileSync(path.join(OUT, 'MANIFEST.json'), JSON.stringify(manifest, null, 2), 'utf8');
    fs.writeFileSync(path.join(OUT, 'notes.json'), JSON.stringify(notes, null, 2), 'utf8');
    fs.writeFileSync(path.join(OUT, 'COMPARISON_NOTES.md'), [
      '# Bot-G web-8f73f69-real vs desktop 17471a6 (NOT PASS)',
      '',
      '- tip_web_base: ' + TIP,
      '- tip_desktop_compare: ' + DESKTOP,
      '- SigMF: ' + SIGMF_DIR,
      '- pass_claimed: false',
      '',
      '## Observations',
      JSON.stringify(notes.observations, null, 2),
      '',
      '## Gaps',
      ...(notes.gaps.length ? notes.gaps.map((g: string) => '- ' + g) : ['- (none)']),
      '',
      '## Absolute PNG paths',
      ...notes.absolute_png_paths.map((p: string) => '- ' + p),
      '',
      'No PASS.',
    ].join('\n'), 'utf8');
    fs.writeFileSync(path.join(OUT, 'QA_CHECKLIST.md'), [
      '# QA web-8f73f69-real (NOT PASS)',
      '- [x] base 8f73f69',
      '- [x] 01–06 captured or PARTIAL noted',
      '- [x] pass_claimed false',
      '',
    ].join('\n'), 'utf8');
    expect(notes.pass_claimed).toBe(false);
  });
});
