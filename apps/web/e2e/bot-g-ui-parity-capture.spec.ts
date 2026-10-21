/**
 * Bot-G FULL UI screenshot evidence @ tip 17937bb.
 * Writes artifacts/validation/ui-parity/qa/web-17937bb/ — does NOT claim PASS.
 * G26: IQ only from signal_studio_rebuild/resources/sigmf_data_demo.
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-17937bb');
const REBUILD_IQ = path.resolve(
  'D:/project/signal_studio_rebuild/resources/sigmf_data_demo',
);
const SIGMF_META = path.join(REBUILD_IQ, '0000000.sigmf-meta');
const SIGMF_DATA = path.join(REBUILD_IQ, '0000000.sigmf-data');
const TIP = '17937bb3a735d0df7058a3714aa353a88abb0e23';
const DESKTOP_TIP = '17471a6488383b456281d12cb1a6d3d80290205d';

function ensure() {
  fs.mkdirSync(OUT, { recursive: true });
}

async function shot(page: Page, name: string) {
  ensure();
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}

async function waitDspSettled(page: Page) {
  const host = page.getByTestId('main-chart-host');
  await expect
    .poll(async () => {
      const s = await host.getAttribute('data-dsp-source');
      if (!s || s === 'loading') return null;
      return s;
    }, { timeout: 25000 })
    .not.toBeNull();
}

test.describe('Bot-G UI parity screenshots (evidence, NOT PASS)', () => {
  test.setTimeout(180_000);

  test('capture shell / IQ / workspace / rails / status / charts', async ({ page }) => {
    ensure();
    expect(fs.existsSync(SIGMF_META)).toBe(true);
    expect(fs.existsSync(SIGMF_DATA)).toBe(true);

    const notes: Record<string, unknown> = {
      id: 'qa-web-17937bb-screenshots',
      tip_web: TIP,
      tip_desktop_compare: DESKTOP_TIP,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      g26_iq: SIGMF_META,
      captures: [] as string[],
      observations: {} as Record<string, unknown>,
    };

    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 20000 });
    await shot(page, '01-shell-default.png');
    (notes.captures as string[]).push('01-shell-default.png');

    // Host wiring / splitter presence (C+B)
    const hasNav = await page.getByTestId('nav-chart-host').count();
    const hasAux = await page.getByTestId('chart-strip-aux').count();
    const hasSplitNav = await page.getByTestId('splitter-nav-aux').count();
    const hasSplitAux = await page.getByTestId('splitter-aux-main').count();
    notes.observations = {
      ...(notes.observations as object),
      nav_chart_host: hasNav > 0,
      chart_strip_aux: hasAux > 0,
      splitter_nav_aux: hasSplitNav > 0,
      splitter_aux_main: hasSplitAux > 0,
    };
    if (hasNav > 0 && hasAux > 0) {
      await shot(page, '02-tri-chart-hosts.png');
      (notes.captures as string[]).push('02-tri-chart-hosts.png');
    }

    // Open locked SigMF demo (G26)
    await expect(page.getByTestId('input-iq-wav')).toBeAttached();
    await page.getByTestId('input-iq-wav').setInputFiles([SIGMF_META, SIGMF_DATA]);
    await waitDspSettled(page);
    await page.waitForTimeout(800);
    await shot(page, '03-wideband-with-sigmf-demo.png');
    (notes.captures as string[]).push('03-wideband-with-sigmf-demo.png');

    const statusFile = await page.getByTestId('status-file').innerText().catch(() => null);
    const statusWs = await page.getByTestId('status-workspace').innerText().catch(() => null);
    const dspSource = await page.getByTestId('main-chart-host').getAttribute('data-dsp-source');
    (notes.observations as Record<string, unknown>).status_file = statusFile;
    (notes.observations as Record<string, unknown>).status_workspace = statusWs;
    (notes.observations as Record<string, unknown>).dsp_source_after_iq = dspSource;
    (notes.observations as Record<string, unknown>).status_file_mentions_demo =
      !!statusFile && /0000000|sigmf/i.test(statusFile);

    // Status bar crop / full (G25)
    const statusBar = page.getByTestId('status-bar');
    if ((await statusBar.count()) > 0) {
      await statusBar.screenshot({ path: path.join(OUT, '04-status-bar-g25.png') });
      (notes.captures as string[]).push('04-status-bar-g25.png');
      const box = await statusBar.boundingBox();
      (notes.observations as Record<string, unknown>).status_bar_height_px = box?.height ?? null;
    } else {
      await shot(page, '04-status-bar-missing-fullpage.png');
      (notes.captures as string[]).push('04-status-bar-missing-fullpage.png');
      (notes.observations as Record<string, unknown>).status_bar_present = false;
    }

    // Aux wave (D tip)
    if ((await page.getByTestId('aux-chart').count()) > 0) {
      await page.getByTestId('aux-chart').screenshot({
        path: path.join(OUT, '05-aux-wave-or-psd.png'),
      });
      (notes.captures as string[]).push('05-aux-wave-or-psd.png');
    }

    // Narrowband
    if ((await page.getByTestId('btn-workspace-narrowband').count()) > 0) {
      await page.getByTestId('btn-workspace-narrowband').click();
      await page.waitForTimeout(400);
      await shot(page, '06-narrowband.png');
      (notes.captures as string[]).push('06-narrowband.png');
      const stub = await page.getByTestId('workspace-narrowband-stub').count();
      (notes.observations as Record<string, unknown>).narrowband_stub_visible = stub > 0;
      await page.getByTestId('btn-workspace-wideband').click();
      await page.waitForTimeout(300);
    }

    // Right rails
    for (const [tab, name] of [
      ['rail-tab-display', '07-rail-display.png'],
      ['rail-tab-detect', '08-rail-detect.png'],
      ['rail-tab-marker', '09-rail-marker.png'],
      ['rail-tab-channel', '10-rail-channel.png'],
    ] as const) {
      if ((await page.getByTestId(tab).count()) > 0) {
        await page.getByTestId(tab).click();
        await page.waitForTimeout(350);
        await shot(page, name);
        (notes.captures as string[]).push(name);
      }
    }

    // Detect engines note (G26) — screenshot only; no fake PASS
    if ((await page.getByTestId('detect-page').count()) > 0) {
      await shot(page, '11-detect-page.png');
      (notes.captures as string[]).push('11-detect-page.png');
    }

    // Collapsed rail if control exists
    const collapse = page.getByTestId('btn-rail-collapse');
    if ((await collapse.count()) > 0) {
      await collapse.click();
      await page.waitForTimeout(300);
      await shot(page, '12-rail-collapsed.png');
      (notes.captures as string[]).push('12-rail-collapsed.png');
    }

    fs.writeFileSync(
      path.join(OUT, 'capture-notes.json'),
      JSON.stringify(notes, null, 2) + '\n',
      'utf8',
    );
  });
});
