/**
 * Bot-G G06 narrowband screenshot refresh @ tip 6c17a53.
 * Writes artifacts/validation/ui-parity/qa/web-6c17a53/
 * Replaces stub appearance from qa/web-17937bb/06-narrowband.png.
 * Does NOT claim PASS / matrix PASS.
 * G26: IQ only from signal_studio_rebuild/resources/sigmf_data_demo.
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-6c17a53');
const REBUILD_IQ = path.resolve(
  'D:/project/signal_studio_rebuild/resources/sigmf_data_demo',
);
const SIGMF_META = path.join(REBUILD_IQ, '0000000.sigmf-meta');
const SIGMF_DATA = path.join(REBUILD_IQ, '0000000.sigmf-data');
const TIP = '6c17a53d4731ca0984b43a1e3cb837ae5c6224f7';
const DESKTOP_TIP = '17471a6488383b456281d12cb1a6d3d80290205d';
const PRIOR_STUB_PACK = 'qa/web-17937bb/06-narrowband.png';

function ensure() {
  fs.mkdirSync(OUT, { recursive: true });
}

async function shot(page: Page, name: string) {
  ensure();
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}

async function waitDspSettled(page: Page) {
  const host = page.getByTestId('main-chart-host');
  if ((await host.count()) === 0) return;
  try {
    await expect
      .poll(async () => {
        const s = await host.getAttribute('data-dsp-source');
        if (!s || s === 'loading') return null;
        return s;
      }, { timeout: 25000 })
      .not.toBeNull();
  } catch {
    // IQ open best-effort; narrowband chrome is the capture target
  }
}

test.describe('Bot-G G06 narrowband screenshots (evidence, NOT PASS)', () => {
  test.setTimeout(180_000);

  test('capture narrowband observe / page-switch / overflow @ 6c17a53', async ({ page }) => {
    ensure();
    expect(fs.existsSync(SIGMF_META)).toBe(true);
    expect(fs.existsSync(SIGMF_DATA)).toBe(true);

    const notes: Record<string, unknown> = {
      id: 'qa-web-6c17a53-narrowband',
      tip_web: TIP,
      tip_desktop_compare: DESKTOP_TIP,
      replaces: PRIOR_STUB_PACK,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      g26_iq: SIGMF_META,
      captures: [] as string[],
      observations: {} as Record<string, unknown>,
    };

    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 20000 });

    // Open locked SigMF demo (G26) before narrowband for realistic chrome
    await expect(page.getByTestId('input-iq-wav')).toBeAttached();
    await page.getByTestId('input-iq-wav').setInputFiles([SIGMF_META, SIGMF_DATA]);
    await waitDspSettled(page);
    await page.waitForTimeout(600);

    await expect(page.getByTestId('btn-workspace-narrowband')).toBeVisible();
    await page.getByTestId('btn-workspace-narrowband').click();
    await page.waitForTimeout(400);

    const stubCount = await page.getByTestId('workspace-narrowband-stub').count();
    await expect(page.getByTestId('workspace-narrowband')).toBeVisible();
    await expect(page.getByTestId('workspace-narrowband-observe')).toBeVisible();
    (notes.observations as Record<string, unknown>).narrowband_stub_visible = stubCount > 0;
    (notes.observations as Record<string, unknown>).workspace_narrowband_visible = true;

    await shot(page, '06-narrowband.png');
    (notes.captures as string[]).push('06-narrowband.png');

    // Persist settings + page switch (parity with Bot-B G06 themes)
    await page.getByTestId('nb-select-stft-fft').selectOption('2048');
    await page.getByTestId('nb-select-freq-mode').selectOption('rf');
    await page.getByTestId('nb-check-grid').uncheck();
    await page.getByTestId('nb-page-modulation').click();
    await expect(page.getByTestId('workspace-narrowband-modulation')).toBeVisible();
    await page.getByTestId('nb-page-observe').click();
    await expect(page.getByTestId('nb-select-stft-fft')).toHaveValue('2048');
    await expect(page.getByTestId('nb-select-freq-mode')).toHaveValue('rf');
    await expect(page.getByTestId('nb-check-grid')).not.toBeChecked();
    await page.waitForTimeout(300);
    await shot(page, '06b-narrowband-page-switch.png');
    (notes.captures as string[]).push('06b-narrowband-page-switch.png');

    await page.getByTestId('nb-btn-overflow').click();
    await expect(page.getByTestId('nb-overflow-menu')).toBeVisible();
    await expect(page.getByTestId('nb-overflow-stft-fft')).toHaveValue('2048');
    await page.waitForTimeout(200);
    await shot(page, '06c-narrowband-overflow.png');
    (notes.captures as string[]).push('06c-narrowband-overflow.png');

    await page.getByTestId('nb-page-demodulation').click();
    await expect(page.getByTestId('workspace-narrowband-demodulation')).toBeVisible();
    const demod = await page.getByTestId('workspace-narrowband-demodulation').innerText();
    (notes.observations as Record<string, unknown>).demod_text_snippet = demod.slice(0, 200);
    (notes.observations as Record<string, unknown>).demod_fake_claim =
      /demodulated iq|live ddc|real ddc output/i.test(demod);
    await shot(page, '06d-narrowband-demodulation.png');
    (notes.captures as string[]).push('06d-narrowband-demodulation.png');

    const statusFile = await page.getByTestId('status-file').innerText().catch(() => null);
    const statusWs = await page.getByTestId('status-workspace').innerText().catch(() => null);
    (notes.observations as Record<string, unknown>).status_file = statusFile;
    (notes.observations as Record<string, unknown>).status_workspace = statusWs;
    (notes.observations as Record<string, unknown>).before =
      'web-17937bb/06-narrowband.png showed workspace-narrowband-stub';
    (notes.observations as Record<string, unknown>).after =
      'web-6c17a53 shows NarrowbandWorkspace four-tab stacked; stub count=' + stubCount;

    fs.writeFileSync(
      path.join(OUT, 'capture-notes.json'),
      JSON.stringify(notes, null, 2) + '\n',
      'utf8',
    );
  });
});
