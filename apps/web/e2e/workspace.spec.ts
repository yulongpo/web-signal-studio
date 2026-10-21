import { expect, test } from '@playwright/test';
import path from 'node:path';
import { ensureEvidenceDir, writeEvidenceJson } from './evidenceWrite';

test.describe('workspace wide/narrow (M-05)', () => {
  test('narrowband stacked workspace; settings persist; detect page retained', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByTestId('btn-workspace-wideband')).toBeVisible();
    await expect(page.getByTestId('btn-workspace-narrowband')).toBeVisible();
    await expect(page.getByTestId('status-workspace')).toHaveText('wideband');
    await expect(page.getByTestId('workspace-narrowband-stub')).toHaveCount(0);

    const host = page.getByTestId('main-chart-host');
    await expect
      .poll(async () => host.getAttribute('data-dsp-source'), { timeout: 15000 })
      .not.toBe('loading');
    const beforeSource = await host.getAttribute('data-dsp-source');
    expect([
      'synthetic-stft-worker',
      'demo-fallback',
      'file-stft-worker',
      'fsa-wav-stft',
    ]).toContain(beforeSource);

    await page.getByTestId('rail-tab-detect').click();
    await expect(page.getByTestId('rail-page-detect')).toBeVisible();
    await expect(page.getByTestId('detect-page')).toBeVisible();

    await page.getByTestId('btn-workspace-narrowband').click();
    await expect(page.getByTestId('btn-workspace-narrowband')).toHaveAttribute(
      'data-active',
      'true',
    );
    await expect(page.getByTestId('status-workspace')).toHaveText('narrowband');
    await expect(page.getByTestId('workspace')).toHaveAttribute(
      'data-workspace-mode',
      'narrowband',
    );
    await expect(page.getByTestId('workspace-narrowband-stub')).toHaveCount(0);
    await expect(page.getByTestId('workspace-narrowband')).toBeVisible();
    await expect(page.getByTestId('nb-panel-waveform')).toBeVisible();
    await expect(page.getByTestId('nb-panel-psd')).toBeVisible();
    await expect(page.getByTestId('nb-panel-stft')).toBeVisible();
    const nbText = await page.getByTestId('workspace-narrowband').innerText();
    expect(nbText.toLowerCase()).not.toMatch(/demodulated iq|live ddc|real ddc output/i);
    const noFakeDdc = !/demodulated iq|live ddc|real ddc output/i.test(nbText.toLowerCase());

    await page.getByTestId('nb-select-stft-fft').selectOption('2048');
    await page.getByTestId('nb-select-freq-mode').selectOption('rf');
    await page.getByTestId('nb-check-grid').uncheck();
    await page.getByTestId('nb-page-modulation').click();
    await expect(page.getByTestId('workspace-narrowband-modulation')).toBeVisible();
    await page.getByTestId('nb-page-observe').click();
    await expect(page.getByTestId('nb-select-stft-fft')).toHaveValue('2048');
    await expect(page.getByTestId('nb-select-freq-mode')).toHaveValue('rf');
    await expect(page.getByTestId('nb-check-grid')).not.toBeChecked();
    await expect(page.getByTestId('workspace-narrowband')).toHaveAttribute('data-nb-stft-fft', '2048');
    await expect(page.getByTestId('workspace-narrowband')).toHaveAttribute('data-nb-freq-mode', 'rf');
    await expect(page.getByTestId('workspace-narrowband')).toHaveAttribute('data-nb-grid', 'false');

    await page.getByTestId('nb-btn-overflow').click();
    await expect(page.getByTestId('nb-overflow-menu')).toBeVisible();
    await expect(page.getByTestId('nb-overflow-stft-fft')).toHaveValue('2048');
    await page.getByTestId('nb-btn-overflow').click();
    await expect(page.getByTestId('nb-overflow-menu')).toHaveCount(0);
    await expect(page.getByTestId('nb-select-stft-fft')).toHaveValue('2048');

    await expect(host).toHaveCount(0);
    await expect(page.getByTestId('dsp-source-chip')).toHaveCount(0);
    await expect(page.getByTestId('rail-page-detect')).toBeVisible();
    await expect(page.getByTestId('detect-page')).toBeVisible();
    const afterNarrow = null;

    const evidenceDir = ensureEvidenceDir();
    await page.screenshot({
      path: path.join(evidenceDir, 'b-p3-workspace-narrowband.png'),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(evidenceDir, 'm05_workspace_narrowband.png'),
      fullPage: true,
    });

    await page.getByTestId('btn-workspace-wideband').click();
    await expect(page.getByTestId('status-workspace')).toHaveText('wideband');
    await expect(page.getByTestId('workspace-narrowband')).toHaveCount(0);
    await expect(page.getByTestId('workspace-narrowband-stub')).toHaveCount(0);
    await expect(host).toBeVisible();
    await expect(page.getByTestId('detect-page')).toBeVisible();
    const afterWide = await host.getAttribute('data-dsp-source');

    await page.screenshot({
      path: path.join(evidenceDir, 'b-p3-workspace-wideband.png'),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(evidenceDir, 'm05_workspace_wideband.png'),
      fullPage: true,
    });

    writeEvidenceJson('m05_workspace_2026-10-21.json', {
      id: 'm05_workspace',
      gate: 'M-05',
      date: '2026-10-21',
      matrix_pass_claimed: false,
      base_tip: '58ac64c',
      package: 'B-G06',
      assertions: {
        initial_status_workspace: 'wideband',
        narrowband_status_workspace: 'narrowband',
        restored_status_workspace: 'wideband',
        stub_banner_visible_in_narrowband: false,
        stacked_workspace_visible: true,
        stub_explicit_no_fake_ddc: noFakeDdc,
        settings_persist_across_pages: true,
        main_chart_hidden_in_narrowband: true,
        main_chart_retained_after_wide: afterWide !== null && afterWide !== 'loading',
        detect_page_retained: true,
        dsp_source_before: beforeSource,
        dsp_source_after_narrow: afterNarrow,
        dsp_source_after_wide: afterWide,
      },
      testids: [
        'btn-workspace-wideband',
        'btn-workspace-narrowband',
        'workspace-narrowband',
        'status-workspace',
        'main-chart-host',
        'detect-page',
        'rail-page-detect',
      ],
      artifacts: [
        'b-p3-workspace-wideband.png',
        'b-p3-workspace-narrowband.png',
        'm05_workspace_wideband.png',
        'm05_workspace_narrowband.png',
        'm05_workspace_2026-10-21.json',
      ],
      note: 'G06 stacked narrowband shell (WIP). Settings persist in uiStore. No fake demod. No matrix PASS claim.',
    });
  });
});
