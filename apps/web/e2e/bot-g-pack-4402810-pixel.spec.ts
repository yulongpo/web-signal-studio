/**
 * Bot-G PIXEL @ 4402810 (D Aux/NB IQ feed + mark-driven DDC). NOT PASS.
 * viewport 4K. BB vs NB SEPARATE pages. Side-by-side desktop@17471a6 same-res.
 * Assert: 01!==03 hash, colorscale visible, Aux/Observe non-empty,
 * DDC=real-marker|real-channel else record needs_active_mark.
 * pass_claimed=false always.
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const BASELINE = '44028104021a3067fadc0dcc4d827651de3f4579';
const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-4402810-pixel');
const SIGMF_DIR = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo';
const META = path.join(SIGMF_DIR, '0000000.sigmf-meta');
const DATA = path.join(SIGMF_DIR, '0000000.sigmf-data');
const DESKTOP_DIR = 'D:/project/signal_studio_rebuild/artifacts/chart-regression';
const DESKTOP_BB = path.join(DESKTOP_DIR, 'signal-studio-release-gpu-screen2-4k-150.png');
const DESKTOP_NB = path.join(DESKTOP_DIR, 'signal-studio-narrowband-release-gpu-screen2-4k-150.png');
const DESKTOP_REF_SHA = '17471a6488383b456281d12cb1a6d3d80290205d';
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

/** Side-by-side deferred to post-step _pixel_sxs.ps1 (same-res Web|Desktop). */
function sideBySide(_w: string, _d: string, outName: string, _a: string, _b: string): string | null {
  return outName;
}

test.describe('Bot-G PIXEL 4402810 BB/NB + desktop sxs 4K (NOT PASS)', () => {
  test.setTimeout(360_000);
  test.use({ viewport: VIEWPORT });

  test('pixel pack: BB/NB separate + sxs desktop + DDC mark', async ({ page }) => {
    ensure();
    expect(fs.existsSync(META)).toBe(true);
    expect(fs.existsSync(DESKTOP_BB)).toBe(true);
    expect(fs.existsSync(DESKTOP_NB)).toBe(true);

    // Copy desktop refs into pack (same-res evidence)
    fs.copyFileSync(DESKTOP_BB, path.join(OUT, 'desktop-bb-17471a6-4k.png'));
    fs.copyFileSync(DESKTOP_NB, path.join(OUT, 'desktop-nb-17471a6-4k.png'));

    const notes: any = {
      id: 'qa-web-4402810-pixel',
      baseline_sha: BASELINE,
      tip_web_base: BASELINE,
      pack: 'web-4402810-pixel',
      pass_claimed: false,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      viewport: VIEWPORT,
      desktop_ref_sha: DESKTOP_REF_SHA,
      contains: { D: '4402810/f1ed98f', C: '6e78061', B: '27e3e29' },
      focus: 'pixel BB|NB separate + sxs desktop 4K; Aux/Observe; DDC real-marker|real-channel',
      sigmf_demo_dir: SIGMF_DIR,
      captures: ['desktop-bb-17471a6-4k.png', 'desktop-nb-17471a6-4k.png'] as string[],
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
      fs.writeFileSync(path.join(OUT, 'MANIFEST.json'), JSON.stringify({ pack: 'web-4402810-pixel', baseline_sha: BASELINE, pass_claimed: false, result: 'FAIL_EMPTY_TREE', tree_gate: notes.observations.tree_gate, captures: notes.captures }, null, 2));
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
    await sleep(1200);

    // Seed active mark for later NB real-marker DDC (D Q7-10/11)
    const markSeed = await page.evaluate(() => {
      const hook = (window as any).__wssM06;
      if (!hook?.addManualMark) return { ok: false, reason: 'no-__wssM06' };
      const id = 'qa-pixel-mark';
      hook.addManualMark({
        id,
        name: 'pixel-mark',
        start: '0',
        end: '200000',
        lowerHz: 2.49e9,
        upperHz: 2.51e9,
      });
      hook.setSelection?.({ activeMarkId: id, selectedMarkIds: [id] });
      const st = hook.getState?.() || null;
      return { ok: true, id, markCount: st?.marks?.length ?? st?.annotations?.length ?? null };
    }).catch((e: any) => ({ ok: false, reason: String(e?.message || e) }));
    notes.observations.mark_seed = markSeed;
    if (!markSeed.ok) notes.gaps.push('mark seed failed: ' + JSON.stringify(markSeed) + ' — may needs_active_mark');
    await sleep(600);

    const bbPartition = await page.locator('[data-chart-partition]').first().getAttribute('data-chart-partition').catch(() => null);
    const bbHost = page.getByTestId('main-chart-host');
    const colorbarDom = page.locator('[data-testid="display-colorscale"][data-color-scale-dom="true"]');
    let colorscaleVisible = await colorbarDom.isVisible().catch(() => false);
    if (!colorscaleVisible) colorscaleVisible = await page.getByTestId('display-colorscale').isVisible().catch(() => false);
    const colorbarText = await page.getByTestId('display-colorscale').innerText().catch(() => null);

    // Aux non-empty probe (D Q7-07)
    const auxInfo = await page.evaluate(() => {
      const ready = document.querySelector('[data-chart-slot="aux"][data-aux-ready="true"]') as HTMLElement | null;
      const waiting = document.querySelector('[data-testid="aux-chart-waiting"]') as HTMLElement | null;
      const slot = document.querySelector('[data-chart-slot="aux"]') as HTMLElement | null;
      const el = ready || slot;
      return {
        ready: !!ready,
        waiting_visible: !!(waiting && waiting.offsetParent !== null),
        feed: el?.getAttribute('data-aux-wave-feed') || null,
        peak: el?.getAttribute('data-aux-wave-peak') || null,
        points: el?.getAttribute('data-aux-points') || null,
        amp_domain: el?.getAttribute('data-aux-amp-domain') || null,
        chart_aux_count: document.querySelectorAll('[data-testid="chart-aux"]').length,
      };
    });
    const auxNonEmpty = !!(auxInfo.ready && auxInfo.feed === 'opened_iq_session' && Number(auxInfo.peak || 0) > 0);
    notes.observations.aux = { ...auxInfo, non_empty: auxNonEmpty };
    if (!auxNonEmpty) notes.gaps.push('Aux empty/not-ready feed=' + auxInfo.feed + ' peak=' + auxInfo.peak + ' — PARTIAL');

    notes.observations.broadband = {
      partition: bbPartition,
      partition_ok: bbPartition === 'broadband-nav-aux-main',
      chart_mode: await bbHost.getAttribute('data-chart-mode').catch(() => null),
      colorscale_visible: colorscaleVisible,
      colorscale_text: colorbarText ? String(colorbarText).slice(0, 200) : null,
      color_scale_dom_count: await page.locator('[data-color-scale-dom="true"]').count().catch(() => 0),
      nav_present: (await page.getByTestId('global-nav').count().catch(() => 0)) > 0,
      aux_present: auxInfo.ready || auxInfo.chart_aux_count > 0,
      nb_workspace_count: await page.getByTestId('workspace-narrowband').count().catch(() => 0),
      menubar_snippet: (await page.getByTestId('menubar').innerText().catch(() => '')).slice(0, 300),
    };
    if (bbPartition !== 'broadband-nav-aux-main') notes.gaps.push('BB partition expected broadband-nav-aux-main got ' + bbPartition + ' — PARTIAL');
    if (!colorscaleVisible) notes.gaps.push('BB display-colorscale not visible — PARTIAL');

    await shot(page, '02-broadband-waterfall-4k.png'); push('02-broadband-waterfall-4k.png');
    if (colorscaleVisible && (await shotEl(page, 'display-colorscale', '02b-display-colorscale-crop.png'))) push('02b-display-colorscale-crop.png');
    if (await shotEl(page, 'chart-aux', '02c-aux-wave-crop.png')) push('02c-aux-wave-crop.png');
    else {
      const auxShot = await page.locator('[data-chart-slot="aux"]').first().screenshot({ path: path.join(OUT, '02c-aux-wave-crop.png') }).then(() => true).catch(() => false);
      if (auxShot) push('02c-aux-wave-crop.png');
    }

    const h01 = hash(path.join(OUT, '01-project-tree-loaded.png'));
    const h02 = hash(path.join(OUT, '02-broadband-waterfall-4k.png'));
    notes.observations.shot02_ne_01 = { different: h01 !== h02, h01, h02, soft: true };
    if (h01 === h02) notes.gaps.push('02≠01 soft-fail');

    await page.getByTestId('btn-mode-stft').click({ force: true, timeout: 2500 }).catch(() => {});
    await sleep(700);
    await shot(page, '03-broadband-stft-4k.png'); push('03-broadband-stft-4k.png');
    const h03 = hash(path.join(OUT, '03-broadband-stft-4k.png'));
    notes.observations.shot01_ne_03 = { different: h01 !== h03, h01, h03, hard: true };
    if (h01 === h03) notes.gaps.push('01≠03 HARD-fail (hashes equal)');
    notes.observations.broadband_stft = {
      partition: await page.locator('[data-chart-partition]').first().getAttribute('data-chart-partition').catch(() => null),
      chart_mode: await bbHost.getAttribute('data-chart-mode').catch(() => null),
    };

    // Side-by-side BB Web | Desktop
    notes.observations.sxs_bb_pending = { web: '02-broadband-waterfall-4k.png', desk: 'desktop-bb-17471a6-4k.png', out: '04-sxs-bb-web-vs-desktop-4k.png' };
    // sxs composite filled post-run by _pixel_sxs.ps1; push after exists
    notes.gaps.push('sxs_pending:' + '04-sxs-bb-web-vs-desktop-4k.png');

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
    await sleep(500);

    // Re-assert mark selection after page switch
    await page.evaluate(() => {
      const hook = (window as any).__wssM06;
      if (!hook?.setSelection) return;
      hook.setSelection({ activeMarkId: 'qa-pixel-mark', selectedMarkIds: ['qa-pixel-mark'] });
    }).catch(() => {});
    await sleep(800);

    const nbPartition = await page.locator('[data-chart-partition]').first().getAttribute('data-chart-partition').catch(() => null);
    const nbNav = await page.getByTestId('global-nav').count().catch(() => 0);
    const nbAux = await page.locator('[data-chart-slot="aux"]').count().catch(() => 0);
    notes.observations.narrowband = {
      partition: nbPartition,
      partition_ok: nbPartition === 'narrowband-only',
      global_nav_count: nbNav,
      aux_slot_count: nbAux,
      xor_ok: nbPartition === 'narrowband-only' && nbNav === 0,
      menubar_snippet: (await page.getByTestId('menubar').innerText().catch(() => '')).slice(0, 300),
    };
    if (nbPartition !== 'narrowband-only') notes.gaps.push('NB partition expected narrowband-only got ' + nbPartition + ' — PARTIAL');
    if (nbNav > 0) notes.gaps.push('NB page still mounts BB nav — PARTIAL');

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
    if (!chartsReady) notes.gaps.push('NB chart-ready timeout — PARTIAL (Observe may be empty / needs_active_mark)');
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
    const ddcKind = pipeAttrs['data-nb-ddc-kind'] || '';
    const combined = pipeText + '\n' + pipeTitle + '\n' + JSON.stringify(pipeAttrs);
    const hasRealDdcText = /真实 DDC/.test(combined);
    const isRealMarkerOrChannel = ddcKind === 'real-marker' || ddcKind === 'real-channel';
    const needsActiveMark = ddcKind === 'needs_active_mark' || pipeAttrs['data-nb-source'] === 'needs_active_mark' || /needs_active_mark/.test(combined);
    notes.observations.shot06_pipeline = {
      text: pipeText.slice(0, 400),
      title: pipeTitle.slice(0, 400),
      attrs: pipeAttrs,
      ddc_kind: ddcKind || null,
      has_真实_DDC: hasRealDdcText,
      is_real_marker_or_channel: isRealMarkerOrChannel,
      needs_active_mark: needsActiveMark,
    };
    if (!isRealMarkerOrChannel) {
      if (needsActiveMark) notes.gaps.push('DDC=needs_active_mark (no invent PASS; mark drive missing/inactive)');
      else notes.gaps.push('DDC kind=' + ddcKind + ' not real-marker|real-channel — PARTIAL');
    }

    // Observe non-empty: chart-ready true OR panels have canvas paint
    const observeNonEmpty = chartsReady && isRealMarkerOrChannel;
    notes.observations.observe = { non_empty: observeNonEmpty, chartsReady, ddcKind };
    if (!observeNonEmpty) notes.gaps.push('Observe empty/not real-driven — PARTIAL');

    if (await shotEl(page, 'nb-observe-pipeline', '06-nb-ddc-pipeline-state.png')) push('06-nb-ddc-pipeline-state.png');
    else {
      await shot(page, '06-nb-ddc-pipeline-state.png'); push('06-nb-ddc-pipeline-state.png');
      notes.gaps.push('06 element shot fallback fullPage');
    }
    if (await shotEl(page, 'workspace-narrowband-observe', '06b-nb-observe-workspace.png')) push('06b-nb-observe-workspace.png');

    notes.observations.sxs_nb_pending = { web: '05-narrowband-observe-4k.png', desk: 'desktop-nb-17471a6-4k.png', out: '07-sxs-nb-web-vs-desktop-4k.png' };
    // sxs composite filled post-run by _pixel_sxs.ps1; push after exists
    notes.gaps.push('sxs_pending:' + '07-sxs-nb-web-vs-desktop-4k.png');

    notes.absolute_png_paths = notes.captures.map((c: string) => path.join(OUT, c));
    const ddcSummary = isRealMarkerOrChannel ? ddcKind : (needsActiveMark ? 'needs_active_mark' : (ddcKind || 'unknown'));
    const manifest = {
      pack: 'web-4402810-pixel',
      baseline_sha: BASELINE,
      tip_web_base: BASELINE,
      evidence_sha_after_commit: 'PENDING_COMMIT',
      pass_claimed: false,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      viewport: VIEWPORT,
      desktop_ref_sha: DESKTOP_REF_SHA,
      tree_gate: notes.observations.tree_gate,
      broadband: notes.observations.broadband,
      narrowband: notes.observations.narrowband,
      aux: notes.observations.aux,
      observe: notes.observations.observe,
      chart_ready: notes.observations.chart_ready,
      shot02_ne_01: notes.observations.shot02_ne_01,
      shot01_ne_03: notes.observations.shot01_ne_03,
      ddc_kind: ddcSummary,
      shot06_has_真实_DDC: hasRealDdcText,
      mark_seed: notes.observations.mark_seed,
      captures: notes.captures,
      gaps: notes.gaps,
      absolute_png_paths: notes.absolute_png_paths,
      out_dir: OUT,
      observations: notes.observations,
    };
    fs.writeFileSync(path.join(OUT, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(OUT, 'notes.json'), JSON.stringify(notes, null, 2));
    fs.writeFileSync(path.join(OUT, 'NOTES.md'), [
      '# web-4402810-pixel BB/NB + desktop sxs 4K (NOT PASS)',
      '- baseline_sha: ' + BASELINE,
      '- tip_sha: PENDING_COMMIT',
      '- pass_claimed: false',
      '- viewport: 3840x2160',
      '- desktop_ref: signal_studio_rebuild@' + DESKTOP_REF_SHA,
      '- contains: D 4402810/f1ed98f (Aux/NB feed + mark DDC)',
      '- tree_gate: ' + JSON.stringify(notes.observations.tree_gate),
      '- broadband: ' + JSON.stringify(notes.observations.broadband),
      '- aux_non_empty: ' + String(auxNonEmpty) + ' ' + JSON.stringify(notes.observations.aux),
      '- narrowband: ' + JSON.stringify(notes.observations.narrowband),
      '- chart_ready: ' + JSON.stringify(notes.observations.chart_ready),
      '- observe_non_empty: ' + String(observeNonEmpty),
      '- ddc_kind: ' + ddcSummary + ' | real_marker_or_channel=' + String(isRealMarkerOrChannel) + ' | needs_active_mark=' + String(needsActiveMark),
      '- 真实 DDC text: ' + String(hasRealDdcText) + ' | ' + pipeText.slice(0, 200),
      '- 01≠03 hard: ' + String(notes.observations.shot01_ne_03.different),
      '- 02≠01 soft: ' + String(notes.observations.shot02_ne_01.different),
      '- mark_seed: ' + JSON.stringify(notes.observations.mark_seed),
      '- gaps: ' + JSON.stringify(notes.gaps),
      '',
      '## PNG',
      ...notes.absolute_png_paths.map((p: string) => '- ' + p),
      '',
      'No PASS. BB and NB shot on separate pages; desktop sxs same 4K res.',
      '',
    ].join('\n'));

    expect(notes.pass_claimed).toBe(false);
    expect(gateOk).toBe(true);
    expect(fs.existsSync(path.join(OUT, '06-nb-ddc-pipeline-state.png'))).toBe(true);
    expect(notes.observations.shot01_ne_03.different, '01≠03 HARD').toBe(true);
    if (!isRealMarkerOrChannel) console.warn('[PARTIAL] DDC=' + ddcSummary);
    if (!colorscaleVisible) console.warn('[PARTIAL] colorscale not visible');
    if (!auxNonEmpty) console.warn('[PARTIAL] Aux empty');
  });
});
