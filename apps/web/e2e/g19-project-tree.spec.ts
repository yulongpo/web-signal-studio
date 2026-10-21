import { expect, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/** Bot-B G19 ProjectTree EngineeringTreeNode wiring — WIP / not ACCEPTANCE PASS. */
test.describe('G19 ProjectTree marks (Bot-B)', () => {
  test('engineering tree + mark select / soft-delete', async ({ page }) => {
    const outDir = path.resolve(
      process.cwd(),
      '../../artifacts/validation/ui-parity/bot-b',
    );
    fs.mkdirSync(outDir, { recursive: true });

    await page.goto('/');
    await page.getByTestId('btn-load-sample').click();
    await expect(page.getByTestId('project-tree-sample')).toBeVisible();
    await expect(page.getByTestId('project-tree-sample')).toHaveAttribute(
      'data-engineering',
      'true',
    );

    const seeded = await page.evaluate(() => {
      const hook = window.__wssM06;
      if (!hook) return false;
      hook.addManualMark({ id: 'm-tree-1', name: 'tree-mark-1', start: '0', end: '1000' });
      hook.setSelection({ activeMarkId: 'm-tree-1', selectedMarkIds: ['m-tree-1'] });
      return true;
    });
    // Sample project may not have projectDocument; soft-delete UI still needs JSON project.
    // Open sample is enough for engineering attribute; mark nodes need document+annotations.
    expect(seeded).toBe(true);

    await page.screenshot({
      path: path.join(outDir, 'g19-project-tree.png'),
      fullPage: true,
    });
  });
});
