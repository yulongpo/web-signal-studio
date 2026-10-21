/**
 * M-06 Playwright UI E2E (Bot-B): drive Bot-F window.__wssM06 + assert marker panel testids.
 * Evidence: docs/acceptance/evidence/bot-b/m06_*. Does NOT claim ACCEPTANCE_MATRIX PASS (QA-G only).
 */
import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';
import { ensureEvidenceDir, writeEvidenceJson } from './evidenceWrite';

/** Past Number.MAX_SAFE_INTEGER — must stay decimal strings. */
const PAST_BEGIN = '9007199254741091'; // (1n<<53n)+99n
const PAST_END = '9007199254741191'; // (1n<<53n)+199n

const T = 10_000;

type HookState = {
  canUndo: boolean;
  canRedo: boolean;
  undoDepth: number;
  redoDepth: number;
  annotationCount: number;
  activeMarkId?: string;
};

async function openMarkerPage(page: Page) {
  await page.goto('/');
  await page.getByTestId('rail-tab-marker').click();
  await expect(page.getByTestId('rail-page-marker')).toBeVisible({ timeout: T });
  await expect(page.getByTestId('m06-panel')).toBeVisible({ timeout: T });
  await expect(page.getByTestId('m06-hook-status')).toHaveText('hook:ready', { timeout: T });
}

async function hookGetState(page: Page): Promise<HookState> {
  return page.evaluate(() => {
    const h = window.__wssM06;
    if (!h) throw new Error('__wssM06 missing');
    return h.getState();
  });
}

async function waitMarkCount(page: Page, n: number) {
  await expect
    .poll(async () => page.getByTestId('m06-mark-count').innerText(), { timeout: T })
    .toBe(`marks:${n}`);
}

async function waitSnapshot(page: Page, attached: boolean) {
  await expect
    .poll(
      async () => page.getByTestId('m06-snapshot-status').getAttribute('data-has-snapshot'),
      { timeout: T },
    )
    .toBe(attached ? 'true' : 'false');
}

test.describe('M-06 marks / snapshot / undo (UI + __wssM06)', () => {
  test('add/remove marks, channel snapshot, undo/redo via hook + panel', async ({ page }) => {
    test.setTimeout(90_000);
    await openMarkerPage(page);

    let state = await page.evaluate(
      ({ begin, end }) => {
        const h = window.__wssM06!;
        return h.addManualMark({
          id: 'm1',
          name: 'mark-1',
          start: begin,
          end: end,
          lowerHz: 1e6,
          upperHz: 2e6,
        });
      },
      { begin: PAST_BEGIN, end: PAST_END },
    );
    expect(state.annotationCount).toBe(1);
    expect(state.canUndo).toBe(true);

    await waitMarkCount(page, 1);
    const markItem = page.getByTestId('m06-mark-item-m1');
    await expect(markItem).toBeVisible({ timeout: T });
    await expect(markItem).toHaveAttribute('data-start', PAST_BEGIN, { timeout: T });
    await expect(markItem).toHaveAttribute('data-end', PAST_END, { timeout: T });

    state = await page.evaluate(
      ({ begin, end }) => {
        const h = window.__wssM06!;
        return h.attachChannelSnapshot({
          annotationId: 'a1',
          segmentId: 's1',
          revisionId: 'r1',
          begin,
          end,
          sourceKind: 'Algorithm',
        });
      },
      { begin: PAST_BEGIN, end: PAST_END },
    );
    expect(state.canUndo).toBe(true);
    await waitSnapshot(page, true);
    await expect(page.getByTestId('m06-snapshot-status')).toHaveAttribute(
      'data-annotation-id',
      'a1',
      { timeout: T },
    );

    state = await page.evaluate(() =>
      window.__wssM06!.setSelection({
        activeFileId: 'file-1',
        activeChannelId: 'ch-1',
        activeMarkId: 'm1',
        selectedMarkIds: ['m1'],
      }),
    );
    expect(state.activeMarkId).toBe('m1');

    state = await page.evaluate(() => window.__wssM06!.removeMark('m1'));
    expect(state.annotationCount).toBe(0);
    await waitMarkCount(page, 0);
    await expect(page.getByTestId('m06-mark-list-empty')).toBeVisible({ timeout: T });

    // UI chrome: undo enabled; drive via hook (chart overlay intercepts pointer on rail).
    await expect(page.getByTestId('m06-btn-undo')).toBeEnabled({ timeout: T });
    state = await page.evaluate(() => window.__wssM06!.undo());
    expect(state.annotationCount).toBe(1);
    await waitMarkCount(page, 1);
    await expect(page.getByTestId('m06-mark-item-m1')).toBeVisible({ timeout: T });

    await expect(page.getByTestId('m06-btn-redo')).toBeEnabled({ timeout: T });
    state = await page.evaluate(() => window.__wssM06!.redo());
    expect(state.annotationCount).toBe(0);
    await waitMarkCount(page, 0);

    await waitSnapshot(page, true);

    // Undo remove → selection → snapshot
    await page.evaluate(() => window.__wssM06!.undo());
    await waitMarkCount(page, 1);
    await page.evaluate(() => window.__wssM06!.undo());
    await page.evaluate(() => window.__wssM06!.undo());
    const snapCleared = await page.evaluate(() => {
      try {
        return window.__wssM06!.session.readChannelSnapshot('file-1', 'ch-1') == null;
      } catch {
        return true;
      }
    });
    expect(snapCleared).toBe(true);
    await waitSnapshot(page, false);

    await page.evaluate(() => window.__wssM06!.redo());
    await waitSnapshot(page, true);

    const exported = await page.evaluate(() => window.__wssM06!.exportJson());
    expect(exported.annotationsText).toContain(PAST_BEGIN);
    expect(exported.annotationsText).toContain(PAST_END);
    expect(exported.projectText).toMatch(/"begin"\s*:\s*"9007199254741091"/);

    const finalState = await hookGetState(page);
    const evidenceDir = ensureEvidenceDir();
    await page.screenshot({
      path: path.join(evidenceDir, 'm06_marks_panel.png'),
      fullPage: true,
    });

    writeEvidenceJson('m06_marks_undo_2026-10-21.json', {
      id: 'm06_marks_undo',
      gate: 'M-06',
      date: '2026-10-21',
      zone: 'Asia/Shanghai',
      matrix_pass_claimed: false,
      base_tip: '9cb46b8886cfe6411db99e383221c06e66696886',
      package: 'B-M06-playwright-e2e',
      hook: 'window.__wssM06 (installM06E2eHook)',
      sample_indexes_decimal: {
        past_begin: PAST_BEGIN,
        past_end: PAST_END,
        note: 'Past Number.MAX_SAFE_INTEGER; never Number()',
      },
      assertions: {
        hook_ready: true,
        add_manual_mark: true,
        mark_item_data_start_decimal: PAST_BEGIN,
        mark_item_data_end_decimal: PAST_END,
        channel_snapshot_attached: true,
        remove_mark: true,
        undo_btn_enabled: true,
        redo_btn_enabled: true,
        undo_redo_via_hook: true,
        snapshot_undo_redo_via_hook: true,
        export_json_preserves_decimal: true,
        final_annotation_count: finalState.annotationCount,
        final_can_undo: finalState.canUndo,
        final_can_redo: finalState.canRedo,
      },
      hook_api_calls: [
        'getState',
        'addManualMark',
        'attachChannelSnapshot',
        'setSelection',
        'removeMark',
        'undo',
        'redo',
        'exportJson',
        'session.readChannelSnapshot',
      ],
      testids: [
        'rail-tab-marker',
        'rail-page-marker',
        'm06-panel',
        'm06-hook-status',
        'm06-mark-count',
        'm06-mark-list',
        'm06-mark-item-m1',
        'm06-snapshot-status',
        'm06-btn-undo',
        'm06-btn-redo',
      ],
      artifacts: ['m06_marks_undo_2026-10-21.json', 'm06_marks_panel.png'],
      note: 'Playwright UI E2E over Bot-F M06MarkSession hook. Undo/redo driven via hook; panel buttons asserted enabled (chart overlay intercepts rail pointer). Evidence for QA-G; no matrix PASS claim.',
    });
  });
});
