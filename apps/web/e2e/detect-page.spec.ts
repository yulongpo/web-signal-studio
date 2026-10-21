import { expect, test } from '@playwright/test';

const BLOCKED_CAPS = {
  protocolVersion: '0.1.0',
  serviceVersion: 'test',
  bindAddressPolicy: 'loopback-only',
  bindHost: '127.0.0.1',
  authRequired: true,
  dsp: { fft: true, psd: false, stft: false, ddc: false, reasons: [] },
  detection: {
    ffscn: false,
    scn: false,
    reasons: ['BLOCKED: stub'],
    uiMessages: [
      {
        code: 'STUB_RUNTIME',
        severity: 'error',
        en: 'Local compute is in stub mode (no TensorRT). Detection will not invent results.',
        zh: '本地计算处于占位模式（无 TensorRT），检测不会伪造结果。',
      },
    ],
  },
  models: [],
  notes: [],
};

/** CORS so absolute loopback :8000 fulfill is readable from the Vite origin. */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

test.describe('detection page', () => {
  test('opens detect tab; mocked capabilities disable buttons and show zh banner', async ({
    page,
  }) => {
    await page.route('**/capabilities', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify(BLOCKED_CAPS),
      });
    });

    await page.goto('/');
    await page.getByTestId('rail-tab-detect').click();
    await expect(page.getByTestId('detect-page')).toBeVisible();
    await expect(page.getByTestId('detect-capabilities-banner')).toContainText('占位模式');
    await expect(page.getByTestId('detect-btn-ffscn')).toBeDisabled();
    await expect(page.getByTestId('detect-btn-scn')).toBeDisabled();
    await expect(page.getByTestId('detect-token-input')).toBeVisible();
    await expect(page.getByTestId('detect-refresh-caps')).toBeVisible();
    await expect(page.getByTestId('detect-task-status')).toBeVisible();
  });

  test('offline capabilities keep buttons disabled', async ({ page }) => {
    await page.route('**/capabilities', async (route) => {
      await route.abort('connectionfailed');
    });
    await page.goto('/');
    await page.getByTestId('rail-tab-detect').click();
    await expect(page.getByTestId('detect-btn-ffscn')).toBeDisabled();
    await expect(page.getByTestId('detect-btn-scn')).toBeDisabled();
    await expect(page.getByTestId('detect-capabilities-banner')).toBeVisible();
  });
});
