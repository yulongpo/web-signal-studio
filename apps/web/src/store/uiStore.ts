/**
 * PROVISIONAL — Bot-B UI/session store (Zustand).
 * Owner: Bot-B. Not a packages/contracts export.
 */

import { create } from 'zustand';
import type { ProjectDocumentJson } from '@wss/contracts';
import {
  openProjectFromJsonText,
  saveProjectToJsonText,
  summarizeLoadedProject,
  type ProjectSessionSummary,
  type ProjectSessionHookApi,
} from '@wss/project-io';
import type {
  ActiveTool,
  AuxChartKind,
  ChartMode,
  DisplaySettings,
  LevelSettings,
  RightPage,
  TempLayerId,
  WorkspaceMode,
  DspSourceKind,
} from '../types/provisional';
import {
  DEFAULT_DETECT_SAMPLE_RANGE,
  DEFAULT_LOCAL_COMPUTE_BASE_URL,
  resolveLocalComputeBaseUrl,
} from '../localCompute/client';

const DEFAULT_LEVEL: LevelSettings = {
  refLevelDb: -20,
  dynamicRangeDb: 70,
  autoAdapt: true,
};

const DEFAULT_DISPLAY: DisplaySettings = {
  freqMode: 'rf',
  showGrid: true,
  showColorScale: true,
};

function envLocalComputeUrl(): string | undefined {
  try {
    return import.meta.env?.VITE_LOCAL_COMPUTE_URL as string | undefined;
  } catch {
    return undefined;
  }
}

function envLocalComputeToken(): string {
  try {
    return (import.meta.env?.VITE_LOCAL_COMPUTE_TOKEN as string | undefined) ?? '';
  } catch {
    return '';
  }
}

export interface UiState {
  activeTool: ActiveTool;
  rightPage: RightPage;
  rightPanelCollapsed: boolean;
  openTempLayer: TempLayerId;
  chartMode: ChartMode;
  stftN: number;
  paletteId: string;
  auxChartKind: AuxChartKind;
  workspaceMode: WorkspaceMode;
  level: LevelSettings;
  display: DisplaySettings;
  /** Drafts while a temp layer is open; committed only on Enter/Tab or explicit Apply. */
  levelDraft: LevelSettings | null;
  displayDraft: DisplaySettings | null;
  statusCursor: { timeLabel: string; freqLabel: string };
  statusFileLabel: string;
  statusChannelLabel: string;
  projectHasSample: boolean;

  /** Loaded native project (null = none). */
  projectDocument: ProjectDocumentJson | null;
  projectSummary: ProjectSessionSummary | null;
  projectError: string | null;
  projectSource: 'none' | 'sample' | 'json';

  /** Detection sample range — decimal strings only. */
  detectSampleRange: { start: string; end: string };
  /** Where the current range came from. ROI confirm does not run detection. */
  detectSampleRangeSource: 'default' | 'roi' | 'file';
  localComputeBaseUrl: string;
  localComputeToken: string;

  /** Main chart DSP source for StatusBar / chip (Bot-D worker path). */
  dspSource: DspSourceKind;

  /**
   * Optional DSP Worker FFT engine preference (Bot-D Package C).
   * Default 'js'. URL ?engine=wasm-fft still wins via resolveDspFftEngine.
   */
  dspFftEnginePreference: 'js' | 'wasm-fft';
  /** Last ready()/configure result mirrored for StatusBar / chip. */
  dspFftEngineActive: {
    requested: 'js' | 'wasm-fft';
    active: 'js' | 'wasm-fft';
    fellBackToJs: boolean;
  } | null;

  setActiveTool: (tool: ActiveTool) => void;
  setRightPage: (page: RightPage) => void;
  toggleRightPanel: () => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  openLayer: (layer: Exclude<TempLayerId, null>) => void;
  toggleLayer: (layer: Exclude<TempLayerId, null>) => void;
  closeTempLayer: (opts?: { revertDraft?: boolean }) => void;
  setChartMode: (mode: ChartMode) => void;
  setStftN: (n: number) => void;
  setPaletteId: (id: string) => void;
  setAuxChartKind: (kind: AuxChartKind) => void;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  updateLevelDraft: (patch: Partial<LevelSettings>) => void;
  updateDisplayDraft: (patch: Partial<DisplaySettings>) => void;
  commitLevelDraft: () => void;
  commitDisplayDraft: () => void;
  revertLevelDraft: () => void;
  revertDisplayDraft: () => void;
  setStatusCursor: (timeLabel: string, freqLabel: string) => void;
  loadSampleProject: () => void;
  clearProject: () => void;
  openProjectFromText: (text: string) => { ok: true } | { ok: false; error: string };
  saveProjectJsonText: () => string | null;
  setLocalComputeToken: (token: string) => void;
  setLocalComputeBaseUrl: (url: string) => void;
  setDetectSampleRange: (
    range: { start: string; end: string },
    source?: 'default' | 'roi' | 'file',
  ) => void;
  setDspSource: (source: DspSourceKind) => void;
  setStatusFileLabel: (label: string) => void;
  setDspFftEnginePreference: (engine: 'js' | 'wasm-fft') => void;
  setDspFftEngineActive: (
    active: {
      requested: 'js' | 'wasm-fft';
      active: 'js' | 'wasm-fft';
      fellBackToJs: boolean;
    } | null,
  ) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  activeTool: 'navigate',
  rightPage: 'display',
  rightPanelCollapsed: false,
  openTempLayer: null,
  chartMode: 'stft',
  stftN: 1024,
  paletteId: 'viridis',
  auxChartKind: 'wave',
  workspaceMode: 'wideband',
  level: { ...DEFAULT_LEVEL },
  display: { ...DEFAULT_DISPLAY },
  levelDraft: null,
  displayDraft: null,
  statusCursor: { timeLabel: '—', freqLabel: '—' },
  statusFileLabel: 'No file',
  statusChannelLabel: '—',
  projectHasSample: false,

  projectDocument: null,
  projectSummary: null,
  projectError: null,
  projectSource: 'none',

  detectSampleRange: { ...DEFAULT_DETECT_SAMPLE_RANGE },
  detectSampleRangeSource: 'default',
  localComputeBaseUrl: resolveLocalComputeBaseUrl(envLocalComputeUrl(), null),
  localComputeToken: envLocalComputeToken(),

  dspSource: 'loading',
  dspFftEnginePreference: 'js',
  dspFftEngineActive: null,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setRightPage: (page) => set({ rightPage: page }),
  toggleRightPanel: () =>
    set((s) => ({ rightPanelCollapsed: !s.rightPanelCollapsed })),
  setRightPanelCollapsed: (collapsed) => set({ rightPanelCollapsed: collapsed }),

  openLayer: (layer) => {
    const s = get();
    if (s.openTempLayer && s.openTempLayer !== layer) {
      get().closeTempLayer({ revertDraft: true });
    }
    if (layer === 'level') {
      set({ openTempLayer: 'level', levelDraft: { ...get().level } });
    } else if (layer === 'display') {
      set({ openTempLayer: 'display', displayDraft: { ...get().display } });
    } else {
      set({ openTempLayer: 'spectral' });
    }
  },

  toggleLayer: (layer) => {
    const s = get();
    if (s.openTempLayer === layer) {
      get().closeTempLayer({ revertDraft: true });
    } else {
      get().openLayer(layer);
    }
  },

  closeTempLayer: (opts) => {
    const revert = opts?.revertDraft !== false;
    const s = get();
    if (revert) {
      if (s.openTempLayer === 'level') set({ levelDraft: null });
      if (s.openTempLayer === 'display') set({ displayDraft: null });
    }
    set({ openTempLayer: null, levelDraft: null, displayDraft: null });
  },

  setChartMode: (mode) => set({ chartMode: mode }),
  setStftN: (n) => set({ stftN: n }),
  setPaletteId: (id) => set({ paletteId: id }),
  setAuxChartKind: (kind) => set({ auxChartKind: kind }),
  setWorkspaceMode: (mode) => set({ workspaceMode: mode }),

  updateLevelDraft: (patch) =>
    set((s) => ({
      levelDraft: { ...(s.levelDraft ?? s.level), ...patch },
    })),
  updateDisplayDraft: (patch) =>
    set((s) => ({
      displayDraft: { ...(s.displayDraft ?? s.display), ...patch },
    })),

  commitLevelDraft: () => {
    const draft = get().levelDraft;
    if (!draft) return;
    if (!(draft.dynamicRangeDb > 0)) return;
    set({ level: { ...draft }, levelDraft: null, openTempLayer: null });
  },
  commitDisplayDraft: () => {
    const draft = get().displayDraft;
    if (!draft) return;
    set({ display: { ...draft }, displayDraft: null, openTempLayer: null });
  },
  revertLevelDraft: () => set({ levelDraft: { ...get().level } }),
  revertDisplayDraft: () => set({ displayDraft: { ...get().display } }),

  setStatusCursor: (timeLabel, freqLabel) =>
    set({ statusCursor: { timeLabel, freqLabel } }),

  loadSampleProject: () =>
    set({
      projectHasSample: true,
      projectSource: 'sample',
      projectDocument: null,
      projectSummary: null,
      projectError: null,
      statusFileLabel: 'demo_wideband.iq',
      statusChannelLabel: 'CH0',
      statusCursor: { timeLabel: '0.000 s', freqLabel: '915.000 MHz' },
    }),

  clearProject: () =>
    set({
      projectHasSample: false,
      projectSource: 'none',
      projectDocument: null,
      projectSummary: null,
      projectError: null,
      statusFileLabel: 'No file',
      statusChannelLabel: '—',
      statusCursor: { timeLabel: '—', freqLabel: '—' },
      detectSampleRange: { ...DEFAULT_DETECT_SAMPLE_RANGE },
      detectSampleRangeSource: 'default',
    }),

  openProjectFromText: (text) => {
    try {
      const opened = openProjectFromJsonText(text);
      const summary = summarizeLoadedProject(opened);
      const activeFile =
        summary.files.find((f) => f.id === summary.activeFileId) ?? summary.files[0];
      const sampleEnd = activeFile?.sampleCount ?? DEFAULT_DETECT_SAMPLE_RANGE.end;
      set({
        projectDocument: opened.document,
        projectSummary: summary,
        projectError: null,
        projectSource: 'json',
        projectHasSample: false,
        statusFileLabel: activeFile?.name ?? summary.name,
        statusChannelLabel:
          summary.activeChannelId ??
          (activeFile
            ? `${activeFile.channelCount} ch`
            : `${summary.files.reduce((n, f) => n + f.channelCount, 0)} ch`),
        statusCursor: { timeLabel: '0.000 s', freqLabel: '—' },
        detectSampleRange: { start: '0', end: sampleEnd },
        detectSampleRangeSource: 'file',
      });
      return { ok: true as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ projectError: message });
      return { ok: false as const, error: message };
    }
  },

  saveProjectJsonText: () => {
    const doc = get().projectDocument;
    if (!doc) return null;
    try {
      return saveProjectToJsonText(doc, { pretty: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ projectError: message });
      return null;
    }
  },

  setLocalComputeToken: (token) => set({ localComputeToken: token }),
  setLocalComputeBaseUrl: (url) =>
    set({
      localComputeBaseUrl: resolveLocalComputeBaseUrl(null, url) || DEFAULT_LOCAL_COMPUTE_BASE_URL,
    }),
  setDetectSampleRange: (range, source) =>
    set((s) => ({
      detectSampleRange: {
        start: String(range.start),
        end: String(range.end),
      },
      detectSampleRangeSource: source ?? s.detectSampleRangeSource,
    })),

  setDspSource: (source) => set({ dspSource: source }),
  setStatusFileLabel: (label) => set({ statusFileLabel: label }),
  setDspFftEnginePreference: (engine) => set({ dspFftEnginePreference: engine }),
  setDspFftEngineActive: (active) => set({ dspFftEngineActive: active }),
}));


/**
 * Thin Bot-F session-hook adapter: project open/save surface from uiStore.
 * See docs/implementation/BOT_F_WEB_SESSION_CONTRACT.md.
 */
export function asProjectSessionHook(
  state: Pick<
    UiState,
    | 'openProjectFromText'
    | 'saveProjectJsonText'
    | 'clearProject'
    | 'projectSummary'
    | 'projectDocument'
  >,
): ProjectSessionHookApi {
  return {
    openProjectFromText: state.openProjectFromText,
    saveProjectJsonText: state.saveProjectJsonText,
    clearProject: state.clearProject,
    projectSummary: state.projectSummary,
    projectDocument: state.projectDocument,
  };
}
