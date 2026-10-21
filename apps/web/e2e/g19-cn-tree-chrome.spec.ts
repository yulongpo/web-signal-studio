import { expect, test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/** Bot-B G19 CN tree chrome — WIP / not ACCEPTANCE PASS. */
test.describe('G19 CN tree chrome (Bot-B)', () => {
  const outDir = path.resolve(
    process.cwd(),
    '../../artifacts/validation/ui-parity/bot-b',
  );

  test('CN section headers, badges, glyphs, tooltips', async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });
    await page.goto('/');
    await page.getByTestId('btn-load-sample').click();
    const root = page.getByTestId('project-tree-sample');
    await expect(root).toHaveAttribute('data-presentation', 'desktop-cn-chrome');
    await expect(page.getByTestId('project-tree')).toHaveAttribute(
      'data-cn-chrome',
      'true',
    );
    // Chinese section chrome
    await expect(page.getByTestId('tree-label-folder-iq')).toContainText('IQ 文件');
    await expect(page.getByTestId('tree-label-folder-channels')).toContainText(
      '通道',
    );
    await expect(page.getByTestId('tree-label-proj-sample')).toContainText(
      '演示工程',
    );
    // unread badge Chinese
    await expect(page.getByTestId('tree-badge-file-2-unread')).toContainText(
      '未读',
    );
    await expect(page.getByTestId('tree-badge-ch-1-diff')).toContainText('差异');
    // glyph + expand
    await expect(page.getByTestId('tree-glyph-folder-iq')).toBeVisible();
    await page.getByTestId('tree-glyph-folder-iq').click();
    await expect(page.getByTestId('tree-node-folder-iq')).toHaveAttribute(
      'data-expanded',
      'false',
    );
    await page.getByTestId('tree-glyph-folder-iq').click();
    await expect(page.getByTestId('tree-node-folder-iq')).toHaveAttribute(
      'data-expanded',
      'true',
    );
    // tooltip has CN relation rewrite
    const ch = page.getByTestId('tree-label-ch-1');
    const tip = await ch.getAttribute('title');
    expect(tip ?? '').toContain('来源已修改');
    await page.screenshot({
      path: path.join(outDir, 'g19-cn-tree-chrome.png'),
      fullPage: true,
    });
  });
});
