import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(here, 'fixtures', 'tiny-project.json');
const fixtureText = fs.readFileSync(fixturePath, 'utf8');

test.describe('project IO', () => {
  test('opens pasted tiny project JSON and shows summary', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('project-tree-empty')).toBeVisible();
    await page.getByTestId('input-project-paste').fill(fixtureText);
    await page.getByTestId('btn-open-project-paste').click();
    await expect(page.getByTestId('project-summary')).toContainText('tiny-fixture');
    await expect(page.getByTestId('project-tree-loaded')).toBeVisible();
    await expect(page.getByTestId('status-file')).toContainText('tiny.iq');
  });

  test('open → StatusBar/tree → save export → clear (decimal sample indexes)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('input-project-paste').fill(fixtureText);
    await page.getByTestId('btn-open-project-paste').click();

    await expect(page.getByTestId('project-summary')).toContainText('tiny-fixture');
    await expect(page.getByTestId('project-summary')).toContainText('v6');
    await expect(page.getByTestId('project-tree-loaded')).toContainText('1048576');
    await expect(page.getByTestId('status-file')).toContainText('tiny.iq');

    // Sample indexes stay decimal strings in the fixture / tree label (no scientific notation).
    const treeText = await page.getByTestId('project-tree-loaded').innerText();
    expect(treeText).toMatch(/1048576/);
    expect(treeText).not.toMatch(/1\.048576e\+6/i);

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-save-project').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/tiny-fixture.*\.json$/i);
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const saved = fs.readFileSync(downloadPath!, 'utf8');
    const parsed = JSON.parse(saved) as {
      version: number;
      name: string;
      files: Array<{ metadata: { sampleCount: string; name: string } }>;
    };
    expect(parsed.version).toBe(6);
    expect(parsed.name).toBe('tiny-fixture');
    expect(typeof parsed.files[0]?.metadata.sampleCount).toBe('string');
    expect(parsed.files[0]?.metadata.sampleCount).toBe('1048576');
    // Never invent v6 fields beyond what was opened.
    expect(saved).not.toMatch(/"ddc"/i);

    await page.getByTestId('btn-clear-project').click();
    await expect(page.getByTestId('project-tree-empty')).toBeVisible();
    await expect(page.getByTestId('status-file')).toContainText('No file');
    await expect(page.getByTestId('btn-save-project')).toHaveCount(0);
  });

  test('bad JSON shows error without crashing shell', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('input-project-paste').fill('{ not json');
    await page.getByTestId('btn-open-project-paste').click();
    await expect(page.getByTestId('project-error')).toBeVisible();
    await expect(page.getByTestId('app-shell')).toBeVisible();
  });
});
