/**
 * Bot-G G01 corner / fit-restore / File depth @ tip 23c38d0.
 * Out: artifacts/validation/ui-parity/qa/web-23c38d0/
 * ui_parity_pass_claimed: false
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-23c38d0');
const TIP = '23c38d01fc176bbb8319431639640bf0c54ec3c9';
const DESKTOP_TIP = '17471a6488383b456281d12cb1a6d3d80290205d';

function ensure() {
  fs.mkdirSync(OUT, { recursive: true });
}

async function shot(page: Page, name: string) {
  ensure();
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}

test.describe('Bot-G G01 corner/fit/File (evidence, NOT PASS)', () => {
  test.setTimeout(120_000);

  test('BrandV2+window controls, view fit/restore, File menu @ 23c38d0', async ({ page }) => {
    ensure();
    const notes: Record<string, unknown> = {
      id: 'qa-web-23c38d0-g01-corner-fit-file',
      tip_web: TIP,
      tip_desktop_compare: DESKTOP_TIP,
      tip_feature: '6adcd75 / 06911b3 G01 BrandV2 corner + fit/restore + File depth',
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      captures: [] as string[],
      observations: {} as Record<string, unknown>,
    };

    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('menubar')).toBeVisible();

    // ----- 1) BrandV2 + window controls -----
    const brand = page.getByTestId('menubar-brand');
    await expect(brand).toHaveAttribute('data-brand', 'BrandV2');
    await expect(page.getByTestId('title-brand-icon')).toBeVisible();
    await expect(page.getByTestId('title-brand-wordmark')).toBeVisible();
    await expect(page.getByTestId('title-brand-version')).toBeVisible();
    await expect(page.getByTestId('window-controls')).toBeVisible();
    await expect(page.getByTestId('window-minimize')).toBeVisible();
    await expect(page.getByTestId('window-maximize')).toBeVisible();
    await expect(page.getByTestId('window-close')).toBeVisible();

    await shot(page, '01-brandv2-window-controls.png');
    (notes.captures as string[]).push('01-brandv2-window-controls.png');
    await page.getByTestId('menubar').screenshot({
      path: path.join(OUT, '01b-menubar-corner-crop.png'),
    });
    (notes.captures as string[]).push('01b-menubar-corner-crop.png');

    (notes.observations as Record<string, unknown>).brand = {
      data_brand: await brand.getAttribute('data-brand'),
      wordmark: (await page.getByTestId('title-brand-wordmark').innerText()).trim(),
      version: (await page.getByTestId('title-brand-version').innerText()).trim(),
      window_controls: true,
    };

    // ----- 2) View fit-all + restore defaults -----
    if ((await page.getByTestId('nav-zoom-in').count()) > 0) {
      await page.getByTestId('nav-zoom-in').click();
      await page.waitForTimeout(150);
    }
    await page.getByTestId('menubar-view').click();
    await expect(page.getByTestId('menubar-view-menu')).toBeVisible();
    await expect(page.getByTestId('menu-view-fit-all')).toBeVisible();
    await expect(page.getByTestId('menu-view-restore-defaults')).toBeVisible();
    await page.waitForTimeout(150);
    await shot(page, '02-view-fit-restore-menu.png');
    (notes.captures as string[]).push('02-view-fit-restore-menu.png');

    await page.getByTestId('menu-view-fit-all').click();
    await page.waitForTimeout(200);
    await shot(page, '02b-view-fit-all-applied.png');
    (notes.captures as string[]).push('02b-view-fit-all-applied.png');

    await page.getByTestId('menubar-view').click();
    await page.getByTestId('menu-view-restore-defaults').click();
    await expect(page.getByTestId('status-workspace')).toHaveText('wideband');
    await page.waitForTimeout(200);
    await shot(page, '02c-view-restore-defaults-applied.png');
    (notes.captures as string[]).push('02c-view-restore-defaults-applied.png');

    (notes.observations as Record<string, unknown>).view_fit_restore = {
      fit_all_testid: 'menu-view-fit-all',
      restore_testid: 'menu-view-restore-defaults',
      status_workspace_after_restore: await page
        .getByTestId('status-workspace')
        .innerText()
        .catch(() => null),
    };

    // ----- 3) File menu expanded (depth) -----
    await page.getByTestId('menubar-file').click();
    await expect(page.getByTestId('menubar-file-menu')).toBeVisible();
    await expect(page.getByTestId('menu-open-iq')).toBeVisible();
    await expect(page.getByTestId('menu-new-project')).toBeVisible();
    await expect(page.getByTestId('menu-open-project-folder')).toBeVisible();
    await expect(page.getByTestId('menu-recent-projects')).toBeVisible();
    await expect(page.getByTestId('menu-remove-current-file')).toBeVisible();
    await page.waitForTimeout(150);
    await shot(page, '03-file-menu-expanded.png');
    (notes.captures as string[]).push('03-file-menu-expanded.png');
    await page.getByTestId('menubar-file-menu').screenshot({
      path: path.join(OUT, '03b-file-menu-crop.png'),
    });
    (notes.captures as string[]).push('03b-file-menu-crop.png');

    const fileItems = [
      'menu-new-project',
      'menu-open-project-folder',
      'menu-open-project',
      'menu-load-sample',
      'menu-open-iq',
      'menu-clear-iq',
      'menu-save-project',
      'menu-recent-projects',
      'menu-remove-current-file',
      'menu-clear-project',
    ];
    const present: Record<string, boolean> = {};
    for (const id of fileItems) {
      present[id] = (await page.getByTestId(id).count()) > 0;
    }
    (notes.observations as Record<string, unknown>).file_menu_items = present;
    (notes.observations as Record<string, unknown>).gaps =
      'No PASS. Window min/max/close are chrome stubs in web; desktop OS chrome differs. Bot-B parallel wiring shots in bot-b/.';

    fs.writeFileSync(
      path.join(OUT, 'capture-notes.json'),
      JSON.stringify(notes, null, 2) + '\n',
      'utf8',
    );
  });
});
