/**
 * wave8 probe: G18 dwell pin chrome + G19/G02/G08 re-shot attrs.
 * Does not claim PASS; env may limit runtime.
 */
import { test, expect } from '@playwright/test';

test.describe('wave8 G18 pin + G19/G02/G08 deepen', () => {
  test('right-rail dwell pin + clear chrome wired', async ({ page }) => {
    await page.goto('/');
    const displayTab = page.getByTestId('rail-tab-display');
    if (await displayTab.count()) {
      await displayTab.click();
    }
    const pin = page.getByTestId('rail-dwell-pin');
    await expect(pin).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('rail-dwell-index-input').fill('2');
    await page.getByTestId('rail-dwell-pin-btn').click();
    await expect(page.getByTestId('display-summary')).toHaveAttribute('data-pinned-dwell', '2');
    await expect(page.getByTestId('display-summary')).toHaveAttribute('data-psd-mode', 'frame');
    await page.getByTestId('rail-dwell-clear-btn').click();
    await expect(page.getByTestId('display-summary')).toHaveAttribute('data-pinned-dwell', '');
  });

  test('G19 qt-reshot + G02/G08 attrs present', async ({ page }) => {
    await page.goto('/');
    const panel = page.locator('[data-qt-reshot="wave8-annotation-panel"]').first();
    await expect(panel).toHaveCount(1, { timeout: 15_000 });
    await expect(page.locator('[data-strip-nuance="wave8"]').first()).toHaveCount(1);
    await expect(page.locator('[data-shell-reshot="wave8"]').first()).toHaveCount(1);
  });
});
