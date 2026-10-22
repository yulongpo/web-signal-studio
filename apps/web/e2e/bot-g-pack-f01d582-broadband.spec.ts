/**
 * Bot-G pack @ f01d582: BROADBAND_GAP §4 full-shell screenshots for user.
 * Desktop 17471a6. No PASS. No invent G06/G17.
 * IQ only: D:/project/signal_studio_rebuild/resources/sigmf_data_demo
 * Supersedes web-81493fe.
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-f01d582');
const TIP = 'f01d58215aec970e450d88402bb21a4200dc2040';
const DESKTOP = '17471a6488383b456281d12cb1a6d3d80290205d';
const SIGMF_DIR = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo';
const SIGMF_META = path.join(SIGMF_DIR, '0000000.sigmf-meta');
const SIGMF_DATA = path.join(SIGMF_DIR, '0000000.sigmf-data');
const EXPORT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-f01d582-export');

function ensure() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(EXPORT, { recursive: true });
}
async function shot(page: Page, name: string) {
  ensure();
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage: true });
  fs.copyFileSync(p, path.join(EXPORT, name));
}
async function shotEl(page: Page, testId: string, name: string) {
  ensure();
  const p = path.join(OUT, name);
  await page.getByTestId(testId).screenshot({ path: p });
  fs.copyFileSync(p, path.join(EXPORT, name));
}

test.describe('Bot-G pack f01d582 BROADBAND NOT PASS', () => {
  test.setTimeout(180_000);

  test('BROADBAND_GAP section4 six-shot pack', async ({ page }) => {
    ensure();
    expect(fs.existsSync(SIGMF_META)).toBe(true);
    expect(fs.existsSync(SIGMF_DATA)).toBe(true);

    const notes: any = {
      id: 'qa-web-f01d582-broadband-gap-s4',
      tip_web_evidence: TIP,
      tip_desktop_compare: DESKTOP,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      pass_claimed: false,
      g06_g17_claimed: false,
      supersedes: 'web-81493fe',
      sigmf_demo_dir: SIGMF_DIR,
      export_dir: EXPORT,
      captures: [] as string[],
      observations: {} as any,
      gaps: [] as string[],
      skipped: [] as string[],
    };
    const push = (n: string) => {
      if (!notes.captures.includes(n)) notes.captures.push(n);
    };

    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 25000 });
    await expect(page.getByTestId('chart-strip-main')).toBeVisible({ timeout: 15000 });

    const wb = page.getByTestId('btn-workspace-wideband');
    if (await wb.isVisible()) await wb.click();
    await page.waitForTimeout(300);

    // ===== 01 default wideband STFT/Waterfall + strip stamps =====
    await page.getByTestId('btn-mode-stft').click();
    await page.waitForTimeout(250);
    const strip = page.getByTestId('chart-strip-main');
    notes.observations.shot01 = {
      chart_mode: await page.getByTestId('main-chart-host').getAttribute('data-chart-mode'),
      strip_wave: await strip.getAttribute('data-strip-wave'),
      strip_dsp: await strip.getAttribute('data-strip-dsp'),
      stft_segment_ms: await strip.getAttribute('data-stft-segment-ms'),
      a3: await strip.getAttribute('data-dsp-analysis-samples'),
    };
    await shot(page, '01-wideband-shell-stft-strip.png');
    push('01-wideband-shell-stft-strip.png');
    await page.getByTestId('btn-mode-waterfall').click();
    await page.waitForTimeout(350);
    notes.observations.shot01_waterfall = {
      chart_mode: await page.getByTestId('main-chart-host').getAttribute('data-chart-mode'),
    };
    await shot(page, '01b-wideband-shell-waterfall.png');
    push('01b-wideband-shell-waterfall.png');
    await page.getByTestId('btn-mode-stft').click();
    await page.waitForTimeout(200);

    // ===== 02 pan/zoom/box + aux Wave/PSD + cursor =====
    const host = page.getByTestId('main-chart-host');
    await host.click({ button: 'right' });
    await page.waitForTimeout(150);
    const zoomItem = page.getByTestId('chart-menu-zoom');
    if (await zoomItem.isVisible().catch(() => false)) {
      await zoomItem.click();
      await page.waitForTimeout(150);
    } else {
      await page.keyboard.press('Escape');
    }
    const bb = await host.boundingBox();
    if (bb) {
      await page.mouse.move(bb.x + bb.width * 0.3, bb.y + bb.height * 0.3);
      await page.mouse.down();
      await page.mouse.move(bb.x + bb.width * 0.6, bb.y + bb.height * 0.6, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(200);
      await page.mouse.move(bb.x + bb.width * 0.5, bb.y + bb.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(bb.x + bb.width * 0.55, bb.y + bb.height * 0.55, { steps: 5 });
      await page.mouse.up();
    }
    const auxWave = page.getByTestId('btn-aux-wave');
    const auxPsd = page.getByTestId('btn-aux-psd');
    if (await auxWave.isVisible()) {
      await auxWave.click();
      await page.waitForTimeout(250);
    }
    notes.observations.shot02 = {
      gesture: await host.getAttribute('data-chart-gesture'),
      aux_wave_active: await auxWave.getAttribute('data-active').catch(() => null),
      aux_psd_visible: await auxPsd.isVisible(),
      cursor: await page.getByTestId('bottom-scale-cursor').innerText().catch(() => null),
      g18_linked: await host.getAttribute('data-g18-linked-cursor'),
    };
    await shot(page, '02-pan-zoom-aux-cursor.png');
    push('02-pan-zoom-aux-cursor.png');
    if (await auxPsd.isVisible()) {
      await auxPsd.click();
      await page.waitForTimeout(250);
      await shot(page, '02b-aux-psd.png');
      push('02b-aux-psd.png');
    }

    // ===== 03 auto-N + fixed SegmentMs BW visible =====
    await page.getByTestId('btn-toolbar-overflow').click();
    const menu = page.getByTestId('toolbar-overflow-menu');
    await expect(menu).toBeVisible({ timeout: 5000 });
    const autoToggle = page.getByTestId('toggle-stft-auto-nb');
    if (await autoToggle.isChecked()) await autoToggle.uncheck();
    await page.getByTestId('select-stft-segment-ms').selectOption('10');
    await page.waitForTimeout(400);
    const fixedStore = await page.evaluate(async () => {
      const mod = await import('/src/store/uiStore.ts');
      const s = (mod as any).useUiStore.getState();
      return {
        stftAutoNbPref: s.stftAutoNbPref,
        stftSegmentMsPref: s.stftSegmentMsPref,
        dspSegmentMs: s.dspSegmentMs,
        dspAutoNb: s.dspAutoNb,
      };
    });
    notes.observations.shot03_fixed = {
      data_auto_n: await page.getByTestId('overflow-spectral-segment-ms').getAttribute('data-auto-n'),
      store: fixedStore,
      segment_text: await page.getByTestId('overflow-stft-segment-ms').innerText(),
    };
    await shot(page, '03-fixed-segment-ms.png');
    push('03-fixed-segment-ms.png');
    await autoToggle.check();
    await expect(page.getByTestId('overflow-spectral-segment-ms')).toHaveAttribute('data-auto-n', 'on');
    for (let i = 0; i < 20; i++) {
      const a = await page.getByTestId('chart-strip-value-auto-nb').getAttribute('data-dsp-auto-nb');
      const s = await page.getByTestId('chart-strip-value-segment-ms').getAttribute('data-dsp-segment-ms');
      if (a === 'true' && String(s).match(/^0/)) break;
      await page.waitForTimeout(250);
    }
    notes.observations.shot03_auto_n = {
      data_auto_n: await page.getByTestId('overflow-spectral-segment-ms').getAttribute('data-auto-n'),
      strip_auto_nb: await page.getByTestId('chart-strip-value-auto-nb').getAttribute('data-dsp-auto-nb'),
      strip_segment_ms: await page.getByTestId('chart-strip-value-segment-ms').getAttribute('data-dsp-segment-ms'),
      segment_text: await page.getByTestId('overflow-stft-segment-ms').innerText(),
    };
    await shot(page, '03b-auto-n-on.png');
    push('03b-auto-n-on.png');
    await page.keyboard.press('Escape');

    // ===== 04 BottomScale physical-view =====
    const scale = page.getByTestId('bottom-scale-chrome');
    await expect(scale).toBeVisible();
    let bound = false;
    for (let i = 0; i < 25; i++) {
      if ((await scale.getAttribute('data-axis-bind')) === 'physical-view') {
        bound = true;
        break;
      }
      await page.waitForTimeout(200);
    }
    const view = page.getByTestId('bottom-scale-view');
    notes.observations.shot04 = {
      data_axis_bind: await scale.getAttribute('data-axis-bind'),
      bound_physical_view: bound,
      delta_t: await view.getAttribute('data-delta-t'),
      delta_f: await view.getAttribute('data-delta-f'),
      view_text: await view.innerText(),
      honesty: await page.getByTestId('bottom-scale-honesty').innerText(),
    };
    await shot(page, '04-bottom-scale-physical-view.png');
    push('04-bottom-scale-physical-view.png');
    await shotEl(page, 'bottom-scale-chrome', '04b-bottom-scale-crop.png');
    push('04b-bottom-scale-crop.png');
    if (!bound) notes.gaps.push('04 physical-view bind not settled');

    // ===== 05 live mode-wheel =====
    const wheel = page.getByTestId('mode-wheel');
    await expect(wheel).toBeVisible({ timeout: 5000 });
    await expect(wheel).toHaveAttribute('data-live-dom', 'true');
    notes.observations.shot05 = {
      data_live_dom: await wheel.getAttribute('data-live-dom'),
      data_g16: await wheel.getAttribute('data-g16'),
      data_matrix: await wheel.getAttribute('data-matrix'),
      data_g16_host: await wheel.getAttribute('data-g16-host'),
      data_no_invent: await wheel.getAttribute('data-no-invent'),
      note: 'data-matrix=insufficient allowed',
    };
    await shot(page, '05-mode-wheel-live.png');
    push('05-mode-wheel-live.png');
    await shotEl(page, 'mode-wheel', '05b-mode-wheel-crop.png');
    push('05b-mode-wheel-crop.png');

    // ===== 06 Open IQ / MenuBar soft stamps + SigMF load =====
    const menubar = page.getByTestId('menubar');
    await expect(menubar).toBeVisible();
    notes.observations.shot06_menubar = {
      data_g08_shortcuts: await menubar.getAttribute('data-g08-shortcuts'),
      data_g08_soft: await menubar.getAttribute('data-g08-soft'),
      data_g08_accel_inventory: await menubar.getAttribute('data-g08-accel-inventory'),
      data_menubar_shortcuts: await menubar.getAttribute('data-menubar-shortcuts'),
      data_g10_soft: await menubar.getAttribute('data-g10-soft'),
      open_iq_visible: await page.getByTestId('btn-open-iq-wav').isVisible(),
      input_iq: await page.getByTestId('input-iq-wav').count(),
    };
    await shot(page, '06-menubar-open-iq-stamps.png');
    push('06-menubar-open-iq-stamps.png');
    await shotEl(page, 'menubar', '06b-menubar-crop.png');
    push('06b-menubar-crop.png');

    await page.getByTestId('input-iq-wav').setInputFiles([SIGMF_META, SIGMF_DATA]);
    await page.waitForTimeout(900);
    notes.observations.shot06_sigmf = {
      dsp_source: await host.getAttribute('data-dsp-source'),
      dsp_label: await host.getAttribute('data-dsp-label'),
      iq_format: await host.getAttribute('data-iq-format'),
      path: SIGMF_DIR,
    };
    await shot(page, '06c-sigmf-demo-loaded.png');
    push('06c-sigmf-demo-loaded.png');

    const maxBtn = page.getByTestId('window-maximize');
    if ((await maxBtn.count()) > 0) {
      await shot(page, '06d-g10-before-maximize.png');
      push('06d-g10-before-maximize.png');
      await maxBtn.click();
      await page.waitForTimeout(350);
      notes.observations.shot06_g10 = {
        present: true,
        aria_pressed: await maxBtn.getAttribute('aria-pressed'),
      };
      await shot(page, '06e-g10-after-maximize.png');
      push('06e-g10-after-maximize.png');
      if ((await maxBtn.getAttribute('aria-pressed')) === 'true') {
        await maxBtn.click();
      }
    } else {
      notes.observations.shot06_g10 = { present: false };
      notes.skipped.push('G10 maximize chrome absent in this tip — soft only');
    }

    notes.skipped.push('G06/G17 — not invented');

    const absPngs = notes.captures.map((c: string) => path.join(OUT, c));
    notes.absolute_png_paths = absPngs;
    notes.export_png_paths = notes.captures.map((c: string) => path.join(EXPORT, c));

    fs.writeFileSync(path.join(OUT, 'notes.json'), JSON.stringify(notes, null, 2), 'utf8');
    fs.writeFileSync(path.join(EXPORT, 'notes.json'), JSON.stringify(notes, null, 2), 'utf8');
    fs.writeFileSync(
      path.join(OUT, 'capture-notes.json'),
      JSON.stringify(
        {
          tip: TIP,
          desktop: DESKTOP,
          pass_claimed: false,
          matrix_pass_claimed: false,
          ui_parity_pass_claimed: false,
          g06_g17_claimed: false,
          supersedes: 'web-81493fe',
          sigmf_demo_dir: SIGMF_DIR,
          absolute_png_paths: absPngs,
          export_dir: EXPORT,
        },
        null,
        2,
      ),
      'utf8',
    );
    fs.writeFileSync(
      path.join(OUT, 'COMPARISON_NOTES.md'),
      [
        '# Bot-G web-f01d582 BROADBAND_GAP §4 vs desktop 17471a6 (NOT PASS)',
        '',
        '- HEAD/sync: ' + TIP,
        '- Desktop: ' + DESKTOP,
        '- SigMF: ' + SIGMF_DIR,
        '- supersedes: web-81493fe',
        '- pass_claimed: false',
        '- User-facing broadband screenshots',
        '',
        '## Shots',
        '- 01: ' + JSON.stringify(notes.observations.shot01),
        '- 01b: ' + JSON.stringify(notes.observations.shot01_waterfall),
        '- 02: ' + JSON.stringify(notes.observations.shot02),
        '- 03 fixed: ' + JSON.stringify(notes.observations.shot03_fixed),
        '- 03 auto-N: ' + JSON.stringify(notes.observations.shot03_auto_n),
        '- 04: ' + JSON.stringify(notes.observations.shot04),
        '- 05: ' + JSON.stringify(notes.observations.shot05),
        '- 06 menubar: ' + JSON.stringify(notes.observations.shot06_menubar),
        '- 06 sigmf: ' + JSON.stringify(notes.observations.shot06_sigmf),
        '- 06 g10: ' + JSON.stringify(notes.observations.shot06_g10),
        '',
        '## Absolute PNG paths (HH-laptop)',
        ...absPngs.map((p: string) => '- ' + p),
        '',
        '## Export copy',
        '- ' + EXPORT,
        '',
        '## Gaps',
        ...(notes.gaps.length ? notes.gaps.map((g: string) => '- ' + g) : ['- (none)']),
        '',
        'No PASS. No invented G06/G17.',
      ].join('\n'),
      'utf8',
    );
    fs.copyFileSync(path.join(OUT, 'COMPARISON_NOTES.md'), path.join(EXPORT, 'COMPARISON_NOTES.md'));
    fs.writeFileSync(
      path.join(OUT, 'QA_CHECKLIST.md'),
      [
        '# QA checklist web-f01d582 BROADBAND (NOT PASS)',
        '',
        '- [x] Sync f01d582',
        '- [x] 01 STFT/Waterfall + strip',
        '- [x] 02 pan/zoom/aux/cursor',
        '- [x] 03 auto-N + fixed SegmentMs',
        '- [x] 04 BottomScale physical-view',
        '- [x] 05 mode-wheel live (matrix insufficient OK)',
        '- [x] 06 Open IQ / MenuBar soft + SigMF',
        '- [x] pass claims false',
        '',
      ].join('\n'),
      'utf8',
    );

    expect(notes.observations.shot05.data_live_dom).toBe('true');
    expect(notes.pass_claimed).toBe(false);
  });
});
