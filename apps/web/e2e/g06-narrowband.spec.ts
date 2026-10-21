import { expect, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/** Bot-B G06 evidence capture — WIP / not ACCEPTANCE PASS. */
test.describe('G06 narrowband stacked workspace (Bot-B)', () => {
  test('stacked pages + settings persist; screenshots to bot-b/', async ({ page }) => {
    const outDir = path.resolve(
      process.cwd(),
      '../../artifacts/validation/ui-parity/bot-b',
    );
    fs.mkdirSync(outDir, { recursive: true });

    await page.goto('/');
    await page.getByTestId('btn-workspace-narrowband').click();
    await expect(page.getByTestId('workspace-narrowband-stub')).toHaveCount(0);
    await expect(page.getByTestId('workspace-narrowband')).toBeVisible();
    await expect(page.getByTestId('workspace-narrowband-observe')).toBeVisible();

    await page.screenshot({
      path: path.join(outDir, 'g06-narrowband-observe.png'),
      fullPage: true,
    });

    await page.getByTestId('nb-select-stft-fft').selectOption('2048');
    await page.getByTestId('nb-select-freq-mode').selectOption('rf');
    await page.getByTestId('nb-check-grid').uncheck();
    await page.getByTestId('nb-page-modulation').click();
    await expect(page.getByTestId('workspace-narrowband-modulation')).toBeVisible();
    await page.getByTestId('nb-page-observe').click();
    await expect(page.getByTestId('nb-select-stft-fft')).toHaveValue('2048');
    await expect(page.getByTestId('nb-select-freq-mode')).toHaveValue('rf');
    await expect(page.getByTestId('nb-check-grid')).not.toBeChecked();

    await page.screenshot({
      path: path.join(outDir, 'g06-narrowband-page-switch.png'),
      fullPage: true,
    });

    await page.getByTestId('nb-btn-overflow').click();
    await expect(page.getByTestId('nb-overflow-menu')).toBeVisible();
    await expect(page.getByTestId('nb-overflow-stft-fft')).toHaveValue('2048');
    await page.screenshot({
      path: path.join(outDir, 'g06-narrowband-overflow.png'),
      fullPage: true,
    });

    await page.getByTestId('nb-page-demodulation').click();
    const demod = await page.getByTestId('workspace-narrowband-demodulation').innerText();
    expect(demod.toLowerCase()).not.toMatch(/demodulated iq|live ddc|real ddc output/i);
    expect(demod).toMatch(/无伪解调|等待真实/);
  });
});
