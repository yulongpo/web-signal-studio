/**
 * Bot-G combined evidence @ tip 905cdad (>= ef2713a DDC):
 *  - G01 menubar (folds/supersedes interim d9263ac / web-d8297d1)
 *  - G06 observe with non-empty DDC wave/PSD/STFT (supersedes empty web-6c17a53)
 * Out: artifacts/validation/ui-parity/qa/web-905cdad/
 * ui_parity_pass_claimed: false
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-905cdad');
const TIP = '905cdadda26b0ef453256be8352a30824851addf';
const DDC_TIP = 'ef2713a735cc96407ff2dcf7156f08fffb74a6a3';
const DESKTOP_TIP = '17471a6488383b456281d12cb1a6d3d80290205d';

function ensure() {
  fs.mkdirSync(OUT, { recursive: true });
}

async function shot(page: Page, name: string) {
  ensure();
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}

async function waitNbChartsReady(page: Page) {
  await expect(page.getByTestId('nb-observe-pipeline')).toBeVisible({ timeout: 15000 });
  await expect
    .poll(
      async () => page.getByTestId('nb-panel-waveform').getAttribute('data-nb-chart-ready'),
      { timeout: 90000 },
    )
    .toBe('true');
  await expect
    .poll(
      async () => page.getByTestId('nb-panel-psd').getAttribute('data-nb-chart-ready'),
      { timeout: 60000 },
    )
    .toBe('true');
  await expect
    .poll(
      async () => page.getByTestId('nb-panel-stft').getAttribute('data-nb-chart-ready'),
      { timeout: 60000 },
    )
    .toBe('true');
}

test.describe('Bot-G G01 + NB observe DDC (evidence, NOT PASS)', () => {
  test.setTimeout(240_000);

  test('menubar + narrowband observe non-empty DDC @ 905cdad', async ({ page }) => {
    ensure();
    const notes: Record<string, unknown> = {
      id: 'qa-web-905cdad-g01-nb-observe-ddc',
      tip_web: TIP,
      tip_ddc_feature: DDC_TIP,
      tip_desktop_compare: DESKTOP_TIP,
      supersedes: {
        g01_interim: 'qa/web-d8297d1 commit d9263ac on work/bot-g-qa',
        narrowband_observe_empty: 'qa/web-6c17a53 empty DDC hosts',
      },
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      captures: [] as string[],
      observations: {} as Record<string, unknown>,
    };

    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 20000 });

    const bar = page.getByTestId('menubar');
    await expect(bar).toBeVisible();
    await expect(page.getByTestId('command-bar')).toBeVisible();
    const box = await bar.boundingBox();
    (notes.observations as Record<string, unknown>).menubar_height_px = box?.height ?? null;
    (notes.observations as Record<string, unknown>).menubar_height_near_34 =
      box != null && Math.abs(box.height - 34) <= 2;

    await shot(page, '01-menubar-default.png');
    (notes.captures as string[]).push('01-menubar-default.png');

    await page.getByTestId('menubar-file').click();
    await expect(page.getByTestId('menubar-file-menu')).toBeVisible();
    await expect(page.getByTestId('menu-open-iq')).toBeVisible();
    await page.waitForTimeout(200);
    await shot(page, '01b-menubar-file-menu.png');
    (notes.captures as string[]).push('01b-menubar-file-menu.png');
    await bar.screenshot({ path: path.join(OUT, '01c-menubar-bar-crop.png') });
    (notes.captures as string[]).push('01c-menubar-bar-crop.png');
    (notes.observations as Record<string, unknown>).menu_open_iq_visible = true;

    await page.getByTestId('btn-workspace-narrowband').click();
    await expect(page.getByTestId('workspace-narrowband')).toBeVisible();
    await expect(page.getByTestId('workspace-narrowband-stub')).toHaveCount(0);
    await expect(page.getByTestId('workspace-narrowband-observe')).toBeVisible();

    await waitNbChartsReady(page);
    await page.waitForTimeout(500);

    const waveReady = await page.getByTestId('nb-panel-waveform').getAttribute('data-nb-chart-ready');
    const psdReady = await page.getByTestId('nb-panel-psd').getAttribute('data-nb-chart-ready');
    const stftReady = await page.getByTestId('nb-panel-stft').getAttribute('data-nb-chart-ready');
    const pipeline = page.getByTestId('nb-observe-pipeline');
    const pipeSrc = await pipeline.getAttribute('data-nb-source');
    const pipeKind = await pipeline.getAttribute('data-nb-pipeline');
    const pipeLabel = (await pipeline.innerText()).trim();
    const loHz = await pipeline.getAttribute('data-nb-lo-hz');
    const decim = await pipeline.getAttribute('data-nb-decimation');

    Object.assign(notes.observations as object, {
      narrowband_stub_visible: false,
      nb_wave_ready: waveReady === 'true',
      nb_psd_ready: psdReady === 'true',
      nb_stft_ready: stftReady === 'true',
      nb_charts_non_empty: waveReady === 'true' && psdReady === 'true' && stftReady === 'true',
      nb_pipeline_source: pipeSrc,
      nb_pipeline_kind: pipeKind,
      nb_pipeline_label: pipeLabel.slice(0, 240),
      nb_lo_hz: loHz,
      nb_decimation: decim,
      nb_chart_waveform_mounted: (await page.getByTestId('nb-chart-waveform').count()) > 0,
      nb_chart_psd_mounted: (await page.getByTestId('nb-chart-psd').count()) > 0,
      nb_chart_stft_mounted: (await page.getByTestId('nb-chart-stft').count()) > 0,
    });

    await shot(page, '06-narrowband-observe-ddc.png');
    (notes.captures as string[]).push('06-narrowband-observe-ddc.png');
    await page.getByTestId('nb-panel-waveform').screenshot({
      path: path.join(OUT, '06b-nb-panel-waveform.png'),
    });
    (notes.captures as string[]).push('06b-nb-panel-waveform.png');
    await page.getByTestId('nb-panel-psd').screenshot({
      path: path.join(OUT, '06c-nb-panel-psd.png'),
    });
    (notes.captures as string[]).push('06c-nb-panel-psd.png');
    await page.getByTestId('nb-panel-stft').screenshot({
      path: path.join(OUT, '06d-nb-panel-stft.png'),
    });
    (notes.captures as string[]).push('06d-nb-panel-stft.png');

    await page.getByTestId('menubar-view').click();
    await page.getByTestId('menu-view-wideband').click();
    await expect(page.getByTestId('status-workspace')).toHaveText('wideband');
    await page.getByTestId('menubar-view').click();
    await page.getByTestId('menu-view-narrowband').click();
    await expect(page.getByTestId('status-workspace')).toHaveText('narrowband');
    await waitNbChartsReady(page);
    await page.waitForTimeout(300);
    await shot(page, '01d-menubar-view-narrowband-filled.png');
    (notes.captures as string[]).push('01d-menubar-view-narrowband-filled.png');

    (notes.observations as Record<string, unknown>).before =
      'web-6c17a53 empty DDC hosts; interim G01 d9263ac @ d8297d1 only';
    (notes.observations as Record<string, unknown>).after =
      'web-905cdad G01 menubar + observe DDC filled (data-nb-chart-ready=true)';

    fs.writeFileSync(
      path.join(OUT, 'capture-notes.json'),
      JSON.stringify(notes, null, 2) + '\n',
      'utf8',
    );

    expect(waveReady).toBe('true');
    expect(psdReady).toBe('true');
    expect(stftReady).toBe('true');
  });
});
