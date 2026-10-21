/**
 * wave12: rail dwell pin must be hit-testable (not covered by workspace canvas).
 * No PASS.
 */
import { test, expect } from '@playwright/test';

test.describe('wave12 rail pin clickability', () => {
  test('rail-dwell-pin-btn is visible and receives click', async ({ page }) => {
    await page.goto('/');
    const displayTab = page.getByTestId('rail-tab-display');
    if (await displayTab.count()) await displayTab.click();
    const pin = page.getByTestId('rail-dwell-pin-btn');
    await expect(pin).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('rail-dwell-pin')).toHaveAttribute('data-rail-stack', 'wave12');
    // elementFromPoint at button center should be the button (or a child), not a canvas
    const ok = await pin.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const top = document.elementFromPoint(x, y);
      if (!top) return false;
      if (top.tagName.toLowerCase() === 'canvas') return false;
      return el === top || el.contains(top);
    });
    expect(ok).toBe(true);
    await pin.click({ force: false });
  });
});
