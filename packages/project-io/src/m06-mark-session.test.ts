import { describe, expect, it } from 'vitest';
import {
  sampleIndexToDecimal,
  SAMPLE_INDEX_MAX,
} from '@wss/contracts';
import { openProjectFromJsonText, readChannelSnapshot } from './index.js';
import { createM06E2eHook, installM06E2eHook, WSS_M06_HOOK_KEY } from './m06-e2e-hook.js';
import { M06MarkSession } from './m06-mark-session.js';

const PAST_BEGIN = sampleIndexToDecimal((1n << 53n) + 99n);
const PAST_END = sampleIndexToDecimal((1n << 53n) + 199n);

describe('M-06 MarkSession (marks + snapshot + undo)', () => {
  it('add/remove mark undo/redo preserves past-safe decimal strings', () => {
    const session = new M06MarkSession();
    session.addMark({
      id: 'm1',
      name: 'mark-1',
      sourceKind: 'Manual',
      start: PAST_BEGIN,
      end: PAST_END,
      lowerHz: 1e6,
      upperHz: 2e6,
    });
    expect(session.annotations.annotations).toHaveLength(1);
    expect(session.annotations.annotations[0]?.start).toBe(PAST_BEGIN);
    expect(typeof session.annotations.annotations[0]?.start).toBe('string');

    session.changeMarkSourceKind('m1', 'Algorithm');
    expect(session.annotations.annotations[0]?.sourceKind).toBe('Algorithm');

    session.undo();
    expect(session.annotations.annotations[0]?.sourceKind).toBe('Manual');
    session.undo();
    expect(session.annotations.annotations).toHaveLength(0);
    session.redo();
    expect(session.annotations.annotations[0]?.start).toBe(PAST_BEGIN);
  });

  it('channel snapshot attach via project-io encode undoes with bigint decode', () => {
    const session = new M06MarkSession();
    session.attachLocatedSegmentChannel({
      fileId: 'file-1',
      channelId: 'ch-1',
      annotationId: 'a1',
      segmentId: 's1',
      revisionId: 'r1',
      name: 'NB',
      begin: (1n << 53n) + 99n,
      end: SAMPLE_INDEX_MAX,
      lowerHz: 10,
      upperHz: 20,
      sourceKind: 'ImportedLabel',
    });

    const decoded = session.readChannelSnapshot('file-1', 'ch-1');
    expect(decoded).toBeDefined();
    expect(decoded!.range.time.begin).toBe((1n << 53n) + 99n);
    expect(decoded!.boundRange.time.end).toBe(SAMPLE_INDEX_MAX);
    expect(decoded!.sourceKind).toBe('ImportedLabel');

    const wire = session.project.files[0]!.channels![0]!.sourceSnapshot as {
      range: { time: { begin: unknown } };
    };
    expect(typeof wire.range.time.begin).toBe('string');
    expect(wire.range.time.begin).toBe(PAST_BEGIN);

    session.undo();
    expect(session.readChannelSnapshot('file-1', 'ch-1')).toBeUndefined();
    session.redo();
    expect(session.readChannelSnapshot('file-1', 'ch-1')!.range.time.begin).toBe(
      (1n << 53n) + 99n,
    );
  });

  it('exportJson round-trips project through openProjectFromJsonText', () => {
    const session = new M06MarkSession();
    session.setViewRange('file-1', {
      time: { begin: '0', end: PAST_BEGIN },
      frequency: { lowerHz: 0, upperHz: 1e6 },
    });
    session.setActiveSelection(
      { activeFileId: 'file-1', activeChannelId: 'ch-1', activeMarkId: 'm1', selectedMarkIds: ['m1'] },
      'file-1',
    );
    const { projectText } = session.exportJson();
    const opened = openProjectFromJsonText(projectText);
    expect(opened.document.version).toBe(6);
    expect(opened.document.files[0]?.view?.time.end).toBe(PAST_BEGIN);
    expect(typeof opened.document.files[0]?.view?.time.end).toBe('string');
    expect(opened.document.activeChannelId).toBe('ch-1');
  });
});

describe('M-06 E2E hook (Playwright-installable)', () => {
  it('createM06E2eHook drives marks/snapshot/undo and returns serializable state', () => {
    const hook = createM06E2eHook();
    let state = hook.addManualMark({ id: 'm1', start: PAST_BEGIN, end: PAST_END });
    expect(state.annotationCount).toBe(1);
    expect(state.canUndo).toBe(true);

    state = hook.attachChannelSnapshot({
      annotationId: 'a1',
      segmentId: 's1',
      revisionId: 'r1',
      begin: PAST_BEGIN,
      end: PAST_END,
      sourceKind: 'Algorithm',
    });
    expect(state.canUndo).toBe(true);

    const snap = hook.session.readChannelSnapshot('file-1', 'ch-1');
    expect(snap?.sourceKind).toBe('Algorithm');
    expect(snap?.range.time.begin).toBe((1n << 53n) + 99n);

    state = hook.setSelection({
      activeFileId: 'file-1',
      activeChannelId: 'ch-1',
      activeMarkId: 'm1',
      selectedMarkIds: ['m1'],
    });
    expect(state.activeMarkId).toBe('m1');

    state = hook.undo(); // selection
    state = hook.undo(); // snapshot
    expect(hook.session.readChannelSnapshot('file-1', 'ch-1')).toBeUndefined();
    state = hook.redo();
    expect(hook.session.readChannelSnapshot('file-1', 'ch-1')).toBeDefined();

    const exported = hook.exportJson();
    const opened = openProjectFromJsonText(exported.projectText);
    const ch = opened.document.files[0]!.channels![0]!;
    const decoded = readChannelSnapshot(ch, opened.version)!;
    expect(decoded.boundRange.time.end).toBe((1n << 53n) + 199n);
  });


  it('setHoveredMark is ephemeral and appears on getSnapshot', () => {
    const session = new M06MarkSession();
    expect(session.getSnapshot().hoveredMarkId ?? null).toBeNull();
    session.setHoveredMark('m-hover');
    expect(session.getSnapshot().hoveredMarkId).toBe('m-hover');
    session.setHoveredMark(null);
    expect(session.getSnapshot().hoveredMarkId ?? null).toBeNull();
    const hook = createM06E2eHook(session);
    hook.setHoveredMark('m2');
    expect(hook.getState().hoveredMarkId).toBe('m2');
    hook.setHoveredMark('');
    expect(hook.getState().hoveredMarkId ?? null).toBeNull();
  });

  it('installM06E2eHook mounts on window-like target under __wssM06', () => {
    const target: Record<string, unknown> = {};
    const hook = installM06E2eHook(target as { [typeof WSS_M06_HOOK_KEY]?: ReturnType<typeof createM06E2eHook> });
    expect(target[WSS_M06_HOOK_KEY]).toBe(hook);
    hook.addManualMark({ id: 'x', start: '1', end: '2' });
    expect(hook.getState().annotationCount).toBe(1);
  });
});
