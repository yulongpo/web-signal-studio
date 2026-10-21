import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureEvidenceDir, writeEvidenceJson } from './evidenceWrite';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(here, 'fixtures', 'tiny-project.json');
const fixtureText = fs.readFileSync(fixturePath, 'utf8');

test.describe('project IO (M-01)', () => {
  test('opens pasted tiny project JSON and shows summary', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('project-tree-empty')).toBeVisible();
    await page.getByTestId('input-project-paste').fill(fixtureText);
    await page.getByTestId('btn-open-project-paste').click();
    await expect(page.getByTestId('project-summary')).toContainText('tiny-fixture');
    await expect(page.getByTestId('project-tree-loaded')).toBeVisible();
    await expect(page.getByTestId('status-file')).toContainText('tiny.iq');
    await expect(page.getByTestId('status-project')).toContainText('tiny-fixture');
  });

  test('open → StatusBar/tree → save export → clear + evidence artifacts', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('input-project-paste').fill(fixtureText);
    await page.getByTestId('btn-open-project-paste').click();

    await expect(page.getByTestId('project-summary')).toContainText('tiny-fixture');
    await expect(page.getByTestId('project-summary')).toContainText('v6');
    await expect(page.getByTestId('project-tree-loaded')).toContainText('1048576');
    await expect(page.getByTestId('status-file')).toContainText('tiny.iq');
    await expect(page.getByTestId('status-project')).toContainText('tiny-fixture');
    await expect(page.getByTestId('status-project')).toHaveAttribute(
      'data-project-source',
      'json',
    );

    const treeText = await page.getByTestId('project-tree-loaded').innerText();
    expect(treeText).toMatch(/1048576/);
    expect(treeText).not.toMatch(/1\.048576e\+6/i);
    expect(treeText).toMatch(/\d+ ch/);

    const evidenceDir = ensureEvidenceDir();
    await page.screenshot({
      path: path.join(evidenceDir, 'm01_project_open.png'),
      fullPage: true,
    });

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
    expect(saved).not.toMatch(/"ddc"/i);

    // Persist exported JSON probe next to screenshots for QA-G.
    const exportProbePath = path.join(evidenceDir, 'm01_project_export_probe.json');
    fs.writeFileSync(exportProbePath, saved, 'utf8');

    await page.screenshot({
      path: path.join(evidenceDir, 'm01_project_saved.png'),
      fullPage: true,
    });

    await page.getByTestId('btn-clear-project').click();
    await expect(page.getByTestId('project-tree-empty')).toBeVisible();
    await expect(page.getByTestId('status-file')).toContainText('No file');
    await expect(page.getByTestId('status-project')).toContainText('-');
    await expect(page.getByTestId('status-project')).toHaveAttribute(
      'data-project-source',
      'none',
    );
    await expect(page.getByTestId('btn-save-project')).toHaveCount(0);

    await page.screenshot({
      path: path.join(evidenceDir, 'm01_project_cleared.png'),
      fullPage: true,
    });

    writeEvidenceJson('m01_project_io_2026-10-21.json', {
      id: 'm01_project_io',
      gate: 'M-01',
      date: '2026-10-21',
      matrix_pass_claimed: false,
      base_tip: 'f9f4616',
      package: 'B-P4',
      assertions: {
        open_shows_summary: true,
        status_project_reflects_name: true,
        status_file_reflects_active_file: true,
        tree_sample_count_decimal_string: '1048576',
        tree_shows_channel_count: true,
        save_export_version: 6,
        save_sampleCount_type: 'string',
        save_sampleCount_value: '1048576',
        no_invented_ddc_field: true,
        clear_empties_tree_and_statusbar: true,
      },
      testids: [
        'project-summary',
        'project-tree-loaded',
        'project-tree-empty',
        'status-project',
        'status-file',
        'status-channel',
        'btn-save-project',
        'btn-clear-project',
        'input-project-paste',
        'btn-open-project-paste',
      ],
      artifacts: [
        'm01_project_open.png',
        'm01_project_saved.png',
        'm01_project_cleared.png',
        'm01_project_export_probe.json',
        'm01_project_io_2026-10-21.json',
      ],
      note: 'Evidence for QA-G. Bot-B does not claim ACCEPTANCE_MATRIX PASS.',
    });
  });

  test('bad JSON shows error without crashing shell', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('input-project-paste').fill('{ not json');
    await page.getByTestId('btn-open-project-paste').click();
    await expect(page.getByTestId('project-error')).toBeVisible();
    await expect(page.getByTestId('app-shell')).toBeVisible();
  });
});
