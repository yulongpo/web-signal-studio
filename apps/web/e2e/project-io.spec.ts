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

  test('bad JSON shows error without crashing shell', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('input-project-paste').fill('{ not json');
    await page.getByTestId('btn-open-project-paste').click();
    await expect(page.getByTestId('project-error')).toBeVisible();
    await expect(page.getByTestId('app-shell')).toBeVisible();
  });
});
