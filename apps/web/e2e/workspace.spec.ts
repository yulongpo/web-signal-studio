import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../docs/acceptance/evidence/bot-b',
);

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

    await expect(host).toBeVisible();
    await expect(page.getByTestId('dsp-source-chip')).toBeVisible();
    await expect(page.getByTestId('rail-page-detect')).toBeVisible();
    await expect(page.getByTestId('detect-page')).toBeVisible();
    const afterNarrow = await host.getAttribute('data-dsp-source');
    expect(afterNarrow).not.toBe('loading');

    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.screenshot({
      path: path.join(evidenceDir, 'b-p3-workspace-narrowband-stub.png'),
      fullPage: true,
    });

    await page.getByTestId('btn-workspace-wideband').click();
    await expect(page.getByTestId('status-workspace')).toHaveText('wideband');
    await expect(page.getByTestId('workspace-narrowband-stub')).toHaveCount(0);
    await expect(host).toBeVisible();
    await expect(page.getByTestId('detect-page')).toBeVisible();

    await page.screenshot({
      path: path.join(evidenceDir, 'b-p3-workspace-wideband.png'),
      fullPage: true,
    });
  });
});
