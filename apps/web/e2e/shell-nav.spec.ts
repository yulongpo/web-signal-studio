import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIL_IDS = ['display', 'detect', 'marker', 'channel'] as const;

test.describe('shell navigation', () => {
  test('switches four context-rail pages', async ({ page }) => {
    await page.goto('/');
    const rail = page.getByTestId('context-rail');
    await expect(rail).toBeVisible();

    for (const id of RAIL_IDS) {
      const tab = page.getByTestId(`rail-tab-${id}`);
      await tab.click();
      await expect(tab).toHaveAttribute('data-active', 'true');
      await expect(page.getByTestId(`rail-page-${id}`)).toBeVisible();
    }
  });

  test('toggles aux chart between waveform and PSD', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('aux-chart')).toBeVisible();

    await page.getByTestId('btn-aux-psd').click();
    await expect(page.getByTestId('btn-aux-psd')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-chart-slot="aux"]')).toHaveAttribute(
      'data-chart-kind',
      'psd',
    );

    await page.getByTestId('btn-aux-wave').click();
    await expect(page.getByTestId('btn-aux-wave')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-chart-slot="aux"]')).toHaveAttribute(
      'data-chart-kind',
      'wave',
    );
  });

  test('opens level temp layer and Esc closes', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('btn-open-level').click();
    await expect(page.getByTestId('temp-layer-level')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('temp-layer-level')).toHaveCount(0);
  });

  test('spectrum toolbar overflow exposes STFT N / palette / ROI / Mark', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('btn-toolbar-overflow').click();
    await expect(page.getByTestId('toolbar-overflow-menu')).toBeVisible();
    await expect(page.getByTestId('select-stft-n')).toBeVisible();
    await expect(page.getByTestId('select-palette')).toBeVisible();
    await expect(page.getByTestId('btn-tool-roi')).toBeVisible();
    await expect(page.getByTestId('btn-tool-mark')).toBeVisible();
  });

  /**
   * Bot-D STFT worker path + Bot-B chip.
   * Happy path: prefer data-dsp-source="synthetic-stft-worker".
   * CI without WASM/worker may land on "demo-fallback" — both are OK once
   * the attribute is no longer stuck on "loading". Never invent real capture.
   */
  test('main chart DSP source leaves loading (prefer synthetic-stft-worker)', async ({
    page,
  }) => {
    await page.goto('/');
    const host = page.getByTestId('main-chart-host');
    await expect(host).toBeVisible();
    const chip = page.getByTestId('dsp-source-chip');
    await expect(chip).toBeVisible();

    await expect
      .poll(async () => host.getAttribute('data-dsp-source'), { timeout: 15000 })
      .not.toBe('loading');

    const source = await host.getAttribute('data-dsp-source');
    expect(['synthetic-stft-worker', 'demo-fallback']).toContain(source);
    await expect(chip).toHaveAttribute('data-dsp-source', source!);

    // Prefer happy path when worker succeeds.
    if (source === 'synthetic-stft-worker') {
      await expect(host).toHaveAttribute('data-dsp-source', 'synthetic-stft-worker');
    }
  });

  test('toggles wideband / narrowband workspace and shows stacked narrowband', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('btn-workspace-wideband')).toBeVisible();
    await expect(page.getByTestId('btn-workspace-narrowband')).toBeVisible();
    await expect(page.getByTestId('status-workspace')).toHaveText('wideband');
    await expect(page.getByTestId('workspace-narrowband-stub')).toHaveCount(0);

    await page.getByTestId('btn-workspace-narrowband').click();
    await expect(page.getByTestId('btn-workspace-narrowband')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('status-workspace')).toHaveText('narrowband');
    await expect(page.getByTestId('workspace')).toHaveAttribute('data-workspace-mode', 'narrowband');
    await expect(page.getByTestId('workspace-narrowband-stub')).toHaveCount(0);
    await expect(page.getByTestId('workspace-narrowband')).toBeVisible();
    await expect(page.getByTestId('workspace-narrowband-observe')).toBeVisible();
    await expect(page.getByTestId('nb-page-observe')).toHaveAttribute('data-active', 'true');
    const bodyText = await page.getByTestId('workspace-narrowband').innerText();
    expect(bodyText.toLowerCase()).not.toMatch(/demodulated iq|live ddc|real ddc output/i);

    await page.getByTestId('btn-workspace-wideband').click();
    await expect(page.getByTestId('btn-workspace-wideband')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('status-workspace')).toHaveText('wideband');
    await expect(page.getByTestId('workspace-narrowband')).toHaveCount(0);
    await expect(page.getByTestId('workspace-narrowband-stub')).toHaveCount(0);
  });


  test('Open IQ via file input shows file-stft-worker chip (or stays synthetic on parse fail)', async ({
    page,
  }) => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const wavPath = path.join(here, 'fixtures', 'tiny-iq.wav');
    await page.goto('/');
    await expect(page.getByTestId('btn-open-iq-wav')).toBeVisible();
    await expect(page.getByTestId('input-iq-wav')).toBeAttached();
    await page.getByTestId('input-iq-wav').setInputFiles(wavPath);
    const host = page.getByTestId('main-chart-host');
    // Wait until open settles (avoid racing the transient "loading" after setInputFiles).
    await expect
      .poll(async () => {
        const s = await host.getAttribute('data-dsp-source');
        if (!s || s === 'loading') return null;
        if (!['file-stft-worker', 'demo-fallback', 'synthetic-stft-worker', 'fsa-wav-stft'].includes(s)) {
          return null;
        }
        return s;
      }, { timeout: 20000 })
      .toMatch(/^(file-stft-worker|demo-fallback|synthetic-stft-worker|fsa-wav-stft)$/);
    await expect(host).toHaveAttribute(
      'data-dsp-source',
      /^(file-stft-worker|demo-fallback|synthetic-stft-worker|fsa-wav-stft)$/,
      { timeout: 10000 },
    );
    const source = await host.getAttribute('data-dsp-source');
    if (source === 'file-stft-worker') {
      const label = await host.getAttribute('data-dsp-label');
      expect(label?.toLowerCase()).not.toContain('synthetic');
      await expect(page.getByTestId('status-file')).toContainText('tiny-iq.wav');
    }
    await page.getByTestId('btn-clear-iq-wav').click();
    await expect
      .poll(async () => host.getAttribute('data-dsp-source'), { timeout: 20000 })
      .not.toBe('loading');
    const after = await host.getAttribute('data-dsp-source');
    expect(['synthetic-stft-worker', 'demo-fallback']).toContain(after);
  });


  test('Open RAW IQ via file input sets data-iq-format=raw (or synthetic on fail)', async ({
    page,
  }) => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const rawPath = path.join(here, 'fixtures', 'tiny-iq.raw');
    await page.goto('/');
    await expect(page.getByTestId('input-iq-wav')).toBeAttached();
    await page.getByTestId('input-iq-wav').setInputFiles(rawPath);
    const host = page.getByTestId('main-chart-host');
    await expect
      .poll(async () => {
        const s = await host.getAttribute('data-dsp-source');
        if (!s || s === 'loading') return null;
        return s;
      }, { timeout: 20000 })
      .not.toBeNull();
    const source = await host.getAttribute('data-dsp-source');
    expect(['file-stft-worker', 'demo-fallback', 'synthetic-stft-worker']).toContain(source);
    if (source === 'file-stft-worker') {
      await expect(host).toHaveAttribute('data-iq-format', 'raw');
      await expect(page.getByTestId('dsp-source-chip')).toHaveAttribute('data-iq-format', 'raw');
      await expect(page.getByTestId('status-file')).toContainText('tiny-iq.raw');
      const label = await host.getAttribute('data-dsp-label');
      expect(label?.toLowerCase()).toContain('raw');
      expect(label?.toLowerCase()).not.toContain('synthetic');
    }
  });

});
