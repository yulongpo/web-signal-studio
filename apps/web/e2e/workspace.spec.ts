import { expect, test } from '@playwright/test';
import path from 'node:path';
import { ensureEvidenceDir, writeEvidenceJson } from './evidenceWrite';

test.describe('workspace wide/narrow (M-05)', () => {
  test('narrowband stays explicit stub; toggle keeps main chart + detect page', async ({
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
    await expect(page.getByTestId('workspace-narrowband-stub')).toBeVisible();
    await expect(page.getByTestId('workspace-narrowband-stub')).toContainText(/stub/i);
    const stubText = await page.getByTestId('workspace-narrowband-stub').innerText();
    expect(stubText.toLowerCase()).not.toMatch(/demodulated iq|live ddc|real ddc output/i);
    const stubExplicit = /stub/i.test(stubText);
    const noFakeDdc = !/demodulated iq|live ddc|real ddc output/i.test(
      stubText.toLowerCase(),
    );

    await expect(host).toBeVisible();
    await expect(page.getByTestId('dsp-source-chip')).toBeVisible();
    await expect(page.getByTestId('rail-page-detect')).toBeVisible();
    await expect(page.getByTestId('detect-page')).toBeVisible();
    const afterNarrow = await host.getAttribute('data-dsp-source');
    expect(afterNarrow).not.toBe('loading');

    const evidenceDir = ensureEvidenceDir();
    await page.screenshot({
      path: path.join(evidenceDir, 'b-p3-workspace-narrowband-stub.png'),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(evidenceDir, 'm05_workspace_narrowband_stub.png'),
      fullPage: true,
    });

    await page.getByTestId('btn-workspace-wideband').click();
    await expect(page.getByTestId('status-workspace')).toHaveText('wideband');
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
      base_tip: 'f9f4616',
      package: 'B-P4',
      assertions: {
        initial_status_workspace: 'wideband',
        narrowband_status_workspace: 'narrowband',
        restored_status_workspace: 'wideband',
        stub_banner_visible_in_narrowband: stubExplicit,
        stub_explicit_no_fake_ddc: noFakeDdc,
        stub_text_contains_stub: stubExplicit,
        main_chart_retained_after_narrow: afterNarrow !== null && afterNarrow !== 'loading',
        main_chart_retained_after_wide: afterWide !== null && afterWide !== 'loading',
        detect_page_retained: true,
        dsp_source_before: beforeSource,
        dsp_source_after_narrow: afterNarrow,
        dsp_source_after_wide: afterWide,
      },
      testids: [
        'btn-workspace-wideband',
        'btn-workspace-narrowband',
        'workspace-narrowband-stub',
        'status-workspace',
        'main-chart-host',
        'dsp-source-chip',
        'detect-page',
        'rail-page-detect',
      ],
      artifacts: [
        'b-p3-workspace-wideband.png',
        'b-p3-workspace-narrowband-stub.png',
        'm05_workspace_wideband.png',
        'm05_workspace_narrowband_stub.png',
        'm05_workspace_2026-10-21.json',
      ],
      note: 'Narrowband is stub-only until Bot-D DDC. Evidence for QA-G; no matrix PASS claim.',
    });
  });
});
