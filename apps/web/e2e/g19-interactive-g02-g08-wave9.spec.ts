/**
 * wave9 probe: G19 interactive review bar + G02/G08 attrs. No PASS.
 */
import { test, expect } from '@playwright/test';

test.describe('wave9 G19 interactive + G02/G08', () => {
  test('review bar chrome present', async ({ page }) => {
    await page.goto('/');
    const bar = page.getByTestId('bottom-annotation-review-bar');
    await expect(bar).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('bottom-btn-locate-mark')).toBeVisible();
    await expect(page.getByTestId('bottom-btn-delete-marks')).toBeVisible();
    await expect(page.getByTestId('bottom-btn-segment-prev')).toBeVisible();
    await expect(page.locator('[data-qt-interactive="wave9"]').first()).toHaveCount(1);
  });

  test('G02/G08 wave9 attrs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-strip-nuance="wave9"]').first()).toHaveCount(1);
    await expect(page.locator('[data-shell-focus="wave9"]').first()).toHaveCount(1);
  });
});
