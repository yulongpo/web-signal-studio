/**
 * Bot-G pack @ 647978c: G19 table/paging, G07 panels, G02 overflow, G08 bottom height,
 * G11 overview OpenHand. Impl: B d7d44c1 + C 2ac1f9b (base 9248453 wave). Desktop 17471a6.
 * ui_parity_pass_claimed: false
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-647978c');
const TIP = '647978c514780a0991d0f5de02f94a0cf9f2e4f1';
const IMPL_B = 'd7d44c119d2490edc5b3f6735da39f276efc59b7';
const IMPL_C = '2ac1f9bda46f48cdf837d9a4485b7f32308b7ffc';
const IMPL_BASE_924 = '9248453b0f58375bd50e93719a6371574c3d0a84';
const DESKTOP = '17471a6488383b456281d12cb1a6d3d80290205d';
const REPO = path.resolve(process.cwd(), '../..');

function ensure() { fs.mkdirSync(OUT, { recursive: true }); }
async function shot(page: Page, name: string) {
  ensure();
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}
function copyDoc(rel: string, dest: string) {
  const src = path.join(REPO, rel);
  if (!fs.existsSync(src)) return null;
  fs.copyFileSync(src, path.join(OUT, dest));
  return dest;
}

test.describe('Bot-G pack 647978c NOT PASS', () => {
  test.setTimeout(180_000);

  test('G19 table/paging + G07 + G02 overflow + G08 bottom + G11 overview OpenHand', async ({ page }) => {
    ensure();
    const notes: any = {
      id: 'qa-web-647978c-g19-g07-g02-g08-g11',
      tip_web_evidence: TIP,
      tip_impl_b: IMPL_B,
      tip_impl_c: IMPL_C,
      tip_impl_baseline_9248453: IMPL_BASE_924,
      tip_desktop_compare: DESKTOP,
      matrix_pass_claimed: false,
      ui_parity_pass_claimed: false,
      captures: [] as string[],
      docs: [] as string[],
      observations: {} as any,
    };
    const push = (n: string) => notes.captures.push(n);
    const o = notes.observations;

    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 20000 });

    // ----- G08 bottom height -----
    await page.getByTestId('bottom-tab-marks').click();
    const panel = page.getByTestId('bottom-panel');
    await expect(panel).toHaveAttribute('data-expanded', 'true');
    const handle = page.getByTestId('bottom-panel-resize');
    await expect(handle).toBeVisible();
    const beforeH = Number(await panel.getAttribute('data-bottom-height'));
    expect(beforeH).toBeGreaterThanOrEqual(100);
    expect(beforeH).toBeLessThanOrEqual(500);
    await shot(page, '01-g08-bottom-height-before.png');
    push('01-g08-bottom-height-before.png');
    const hBox = await handle.boundingBox();
    expect(hBox).toBeTruthy();
    await page.mouse.move(hBox!.x + hBox!.width / 2, hBox!.y + hBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(hBox!.x + hBox!.width / 2, hBox!.y - 80, { steps: 6 });
    await page.mouse.up();
    const afterH = Number(await panel.getAttribute('data-bottom-height'));
    expect(afterH).toBeGreaterThanOrEqual(100);
    expect(afterH).toBeLessThanOrEqual(500);
    await shot(page, '01b-g08-bottom-height-after.png');
    push('01b-g08-bottom-height-after.png');
    await handle.screenshot({ path: path.join(OUT, '01c-g08-bottom-resize-handle.png') }).catch(() => {});
    push('01c-g08-bottom-resize-handle.png');
    o.g08 = { before: beforeH, after: afterH, clamped_100_500: true };

    // ----- G19 table / paging (bottom + rail) -----
    await expect(page.getByTestId('bottom-annotation-table-header')).toBeVisible();
    await expect(page.getByTestId('bottom-annotation-paging')).toBeVisible();
    await expect(page.getByTestId('bottom-annotation-page-size')).toContainText('200');
    await expect(page.getByTestId('bottom-annotation-quality-menu')).toBeVisible();
    await shot(page, '02-g19-bottom-table-paging.png');
    push('02-g19-bottom-table-paging.png');
    if (await page.getByTestId('bottom-annotation-table').count()) {
      await page.getByTestId('bottom-annotation-table').screenshot({
        path: path.join(OUT, '02b-g19-bottom-table-crop.png'),
      });
      push('02b-g19-bottom-table-crop.png');
    }
    await page.getByTestId('rail-tab-marker').click();
    await expect(page.getByTestId('annotation-paging')).toBeVisible();
    await expect(page.getByTestId('annotation-table-header')).toBeVisible();
    await expect(page.getByTestId('annotation-page-size')).toContainText('200');
    await shot(page, '02c-g19-rail-table-paging.png');
    push('02c-g19-rail-table-paging.png');
    await page.getByTestId('m06-panel').screenshot({
      path: path.join(OUT, '02d-g19-rail-panel-crop.png'),
    });
    push('02d-g19-rail-panel-crop.png');
    o.g19 = {
      bottom_page_size: await page.getByTestId('bottom-annotation-page-size').innerText(),
      rail_page_size: await page.getByTestId('annotation-page-size').innerText(),
      quality_menu: (await page.getByTestId('bottom-annotation-quality-menu').count()) > 0,
      table_header: true,
    };

    // ----- G07 fuller panels -----
    await page.getByTestId('bottom-tab-marks').click();
    await expect(page.getByTestId('bottom-pane-marks')).toHaveAttribute('data-panel-shell', 'annotation-panel');
    await shot(page, '03-g07-annotation-panel.png');
    push('03-g07-annotation-panel.png');
    await page.getByTestId('bottom-tab-tasks').click();
    await expect(page.getByTestId('bottom-pane-tasks')).toHaveAttribute('data-panel-shell', 'detection-panel');
    await expect(page.getByTestId('bottom-detect-table-header')).toBeVisible();
    await expect(page.getByTestId('bottom-detect-inspector')).toBeVisible();
    await expect(page.getByTestId('bottom-detect-status-filter')).toBeVisible();
    await shot(page, '03b-g07-detection-panel-fuller.png');
    push('03b-g07-detection-panel-fuller.png');
    if (await page.getByTestId('bottom-detection-shell').count()) {
      await page.getByTestId('bottom-detection-shell').screenshot({
        path: path.join(OUT, '03c-g07-detection-shell-crop.png'),
      });
      push('03c-g07-detection-shell-crop.png');
    }
    o.g07 = {
      marks_shell: 'annotation-panel',
      tasks_shell: 'detection-panel',
      detect_table: true,
      detect_inspector: true,
    };

    // ----- G02 overflow -----
    await page.getByTestId('btn-toolbar-overflow').click();
    await expect(page.getByTestId('toolbar-overflow-menu')).toBeVisible();
    await expect(page.getByTestId('overflow-qlabel-stft')).toContainText('STFT');
    await expect(page.getByTestId('overflow-qlabel-palette')).toContainText('色板');
    await shot(page, '04-g02-overflow-qlabel.png');
    push('04-g02-overflow-qlabel.png');
    await page.getByTestId('toolbar-overflow-menu').screenshot({
      path: path.join(OUT, '04b-g02-overflow-menu-crop.png'),
    });
    push('04b-g02-overflow-menu-crop.png');
    o.g02 = {
      stft: await page.getByTestId('overflow-qlabel-stft').innerText(),
      palette: await page.getByTestId('overflow-qlabel-palette').innerText(),
    };
    await page.keyboard.press('Escape');

    // ----- G11 overview OpenHand -----
    const nav = page.getByTestId('navigation-chart');
    await expect(nav).toBeVisible({ timeout: 15000 });
    const nBox = await nav.boundingBox();
    expect(nBox).toBeTruthy();
    const fullMin = Number(await nav.getAttribute('data-full-min'));
    const fullMax = Number(await nav.getAttribute('data-full-max'));
    const winMin = Number(await nav.getAttribute('data-window-min'));
    const winMax = Number(await nav.getAttribute('data-window-max'));
    const span = Math.max(1e-12, fullMax - fullMin);
    const midT = (winMin + winMax) / 2;
    const midX = nBox!.x + ((midT - fullMin) / span) * nBox!.width;
    await page.mouse.move(midX, nBox!.y + nBox!.height * 0.5);
    let navCur = await nav.getAttribute('data-nav-overview-cursor');
    if (navCur !== 'grab') {
      // PointerEvent dispatch fallback (same GL-canvas issue as main chart)
      await nav.evaluate((el, xRatio) => {
        const r = el.getBoundingClientRect();
        el.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true, cancelable: true,
          clientX: r.left + r.width * xRatio,
          clientY: r.top + r.height * 0.5,
          pointerId: 1, pointerType: 'mouse', isPrimary: true,
        }));
      }, (midT - fullMin) / span);
      navCur = await nav.getAttribute('data-nav-overview-cursor');
    }
    await expect.poll(async () => nav.getAttribute('data-nav-overview-cursor'), { timeout: 5000 }).toBe('grab');
    await shot(page, '05-g11-overview-openhand.png');
    push('05-g11-overview-openhand.png');
    await nav.screenshot({ path: path.join(OUT, '05b-g11-overview-nav-crop.png') });
    push('05b-g11-overview-nav-crop.png');

    // drag → grabbing if possible
    await page.mouse.move(midX, nBox!.y + nBox!.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(midX + 40, nBox!.y + nBox!.height * 0.5, { steps: 5 });
    let dragCur = await nav.getAttribute('data-nav-overview-cursor');
    await shot(page, '05c-g11-overview-closedhand-drag.png');
    push('05c-g11-overview-closedhand-drag.png');
    await page.mouse.up();
    o.g11_overview = {
      hover_cursor: await nav.getAttribute('data-nav-overview-cursor'),
      drag_cursor_during: dragCur,
      window: { winMin, winMax, fullMin, fullMax },
      note: 'data-nav-overview-cursor grab = OpenHand on overview window @ 17471a6',
    };

    // docs
    const docs: string[] = [];
    for (const [src, dest] of [
      ['artifacts/validation/ui-parity/bot-b/BOT_B_G19_TABLE_PAGING.md', 'BOT_B_G19_TABLE_PAGING.md'],
      ['artifacts/validation/ui-parity/bot-b/BOT_B_G07_BOTTOM.md', 'BOT_B_G07_BOTTOM.md'],
      ['artifacts/validation/ui-parity/bot-b/BOT_B_G02_STRIP.md', 'BOT_B_G02_STRIP.md'],
      ['artifacts/validation/ui-parity/bot-b/BOT_B_G08_COLUMNS.md', 'BOT_B_G08_COLUMNS.md'],
      ['artifacts/validation/ui-parity/bot-c/STATUS.md', 'BOT_C_STATUS.md'],
    ] as const) {
      const d = copyDoc(src, dest);
      if (d) docs.push(d);
    }
    notes.docs = docs;
    o.gaps =
      'No PASS. Evidence tip 647978c; impl B d7d44c1 + C 2ac1f9b (9248453 wave). Desktop 17471a6 ref only. Typecheck expected green after B M06MarksPanel fix.';

    fs.writeFileSync(path.join(OUT, 'capture-notes.json'), JSON.stringify(notes, null, 2) + '\n');

    const cmp = `# web-647978c vs desktop 17471a6 (Bot-G, NOT PASS)

| Field | Value |
|-------|--------|
| Asia/Shanghai | 2026-10-21 |
| Evidence HEAD | \`${TIP}\` (\`647978c\`) |
| Impl B | \`${IMPL_B}\` (\`d7d44c1\` G19 table/paging + G07/G02/G08) |
| Impl C | \`${IMPL_C}\` (\`2ac1f9b\` G11 overview OpenHand) |
| Prior baseline | \`${IMPL_BASE_924}\` (\`9248453\`) |
| Desktop | \`${DESKTOP}\` (\`17471a6\`, reused) |
| Pack | \`qa/web-647978c/\` |
| **ui_parity_pass_claimed** | **false** |
| **matrix_pass_claimed** | **false** |

## Themes (CAO)

| Theme | Evidence | Note |
|-------|----------|------|
| G08 底高 | \`01-*\` | data-bottom-height clamp 100–500 + resize |
| G19 表/分页 | \`02-*\` | table header + paging page-size 200 + quality |
| G07 面板 | \`03-*\` | fuller annotation + detection shells |
| G02 overflow | \`04-*\` | overflow QLabel STFT/色板 |
| G11 overview OpenHand | \`05-*\` | \`data-nav-overview-cursor=grab\` |

## Gaps

1. Not UI_PARITY / matrix PASS — CAO decides.
2. Desktop interactive not re-shot.
3. G19/G07/G02/G08/G11 deepened wiring only — not CLOSED.

## Reproduce

\`\`\`text
cd apps/web && npx playwright test e2e/bot-g-pack-647978c-capture.spec.ts
\`\`\`
`;
    fs.writeFileSync(path.join(OUT, 'COMPARISON_NOTES.md'), cmp);
    const shared = path.join(REPO, 'artifacts/validation/ui-parity/qa/COMPARISON_NOTES.md');
    if (fs.existsSync(shared)) {
      fs.appendFileSync(shared, `\n\n---\n\n## web-647978c @ 647978c (Bot-G, NOT PASS)\n\n` + cmp.split('\n').slice(2).join('\n'));
    }
  });
});
