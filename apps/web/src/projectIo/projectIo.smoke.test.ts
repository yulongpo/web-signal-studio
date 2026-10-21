import { describe, expect, it } from 'vitest';
import {
  openProjectFromJsonText,
  saveProjectToJsonText,
  summarizeLoadedProject,
  type ProjectSessionHookApi,
} from './index';
import type { ProjectSessionHookApi as HookFromSession } from './sessionHook';
import { asProjectSessionHook, useUiStore } from '../store/uiStore';

describe('projectIo thin adapter (Bot-F)', () => {
  it('re-exports open/save/summary primitives', () => {
    expect(typeof openProjectFromJsonText).toBe('function');
    expect(typeof saveProjectToJsonText).toBe('function');
    expect(typeof summarizeLoadedProject).toBe('function');
  });

  it('exposes ProjectSessionHookApi as a type-only contract', () => {
    const stub: ProjectSessionHookApi = {
      openProjectFromText: () => ({ ok: false, error: 'not wired' }),
      saveProjectJsonText: () => null,
      clearProject: () => {},
      projectSummary: null,
      projectDocument: null,
    };
    const also: HookFromSession = stub;
    expect(also.projectDocument).toBeNull();
    expect(stub.openProjectFromText('').ok).toBe(false);
  });

  it('asProjectSessionHook adapts uiStore to ProjectSessionHookApi', () => {
    const api = asProjectSessionHook(useUiStore.getState());
    expect(typeof api.openProjectFromText).toBe('function');
    expect(typeof api.saveProjectJsonText).toBe('function');
    expect(typeof api.clearProject).toBe('function');
    expect(api.projectDocument).toBeNull();
    expect(api.projectSummary).toBeNull();
  });
});

describe('project session open/save/clear via asProjectSessionHook', () => {
  const tiny = JSON.stringify({
    schema: 'signal-studio-native-project',
    version: 6,
    name: 'smoke-tiny',
    activeFileId: 'file-1',
    files: [
      {
        metadata: {
          id: 'file-1',
          name: 'smoke.iq',
          path: 'smoke.iq',
          sampleRateHz: 1000000,
          centerFrequencyHz: 915000000,
          sampleCount: '1048576',
        },
        view: {
          time: { begin: '0', end: '1048576' },
          frequency: { lowerHz: 900000000, upperHz: 930000000 },
        },
      },
    ],
  });

  it('round-trips tiny project and keeps sampleCount as decimal string', () => {
    useUiStore.getState().clearProject();
    const api = asProjectSessionHook(useUiStore.getState());
    const opened = api.openProjectFromText(tiny);
    expect(opened.ok).toBe(true);
    const summary = useUiStore.getState().projectSummary;
    expect(summary?.name).toBe('smoke-tiny');
    expect(summary?.files[0]?.sampleCount).toBe('1048576');
    expect(typeof summary?.files[0]?.sampleCount).toBe('string');
    expect(useUiStore.getState().statusFileLabel).toContain('smoke.iq');
    expect(useUiStore.getState().detectSampleRange.end).toBe('1048576');

    const saved = asProjectSessionHook(useUiStore.getState()).saveProjectJsonText();
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved!) as {
      files: Array<{ metadata: { sampleCount: string } }>;
    };
    expect(parsed.files[0]?.metadata.sampleCount).toBe('1048576');

    asProjectSessionHook(useUiStore.getState()).clearProject();
    expect(useUiStore.getState().projectDocument).toBeNull();
    expect(useUiStore.getState().projectSource).toBe('none');
    expect(useUiStore.getState().statusFileLabel).toBe('No file');
  });
});
