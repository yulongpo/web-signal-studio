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
