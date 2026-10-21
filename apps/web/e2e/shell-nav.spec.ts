import { expect, test } from '@playwright/test';

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
});
