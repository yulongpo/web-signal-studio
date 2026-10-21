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
  NarrowbandPageId,
  NarrowbandWaveformMode,
  NarrowbandFreqMode,
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
  /** G03 full capture time extent (seconds). */
  navFullTime: { min: number; max: number };
  /** G03 linked time window for main/aux. */
  navWindowTime: { min: number; max: number };
  /** G15/G01 view navigation history for navWindowTime (max 40). */
  viewHistory: Array<{ min: number; max: number }>;
  viewHistoryIndex: number;
  /** G05 aux pane height (CSS px). */
  auxPaneHeightPx: number;
  /** G05 nav pane height (CSS px). */
  navPaneHeightPx: number;
  /** Bot-B nav chrome pause (does not invent live capture). */
  navPaused: boolean;
  /** Main spectrogram snapshot for nav/aux derive (display only). */
  spectrogramDisplay: {
    power: Float32Array;
    binCount: number;
    frameCount: number;
    freqHz: { min: number; max: number };
    timeSec: { min: number; max: number };
  } | null;
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

  /** Detection sample range stub — decimal strings only. */
  detectSampleRange: { start: string; end: string };
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

  /** G06 narrowband page + display settings (persist across page/overflow). */
  narrowbandPage: NarrowbandPageId;
  narrowbandPsdFft: number;
  narrowbandStftFft: number;
  narrowbandFreqMode: NarrowbandFreqMode;
  narrowbandGrid: boolean;
  narrowbandWaveformMode: NarrowbandWaveformMode;

  setActiveTool: (tool: ActiveTool) => void;
  setNarrowbandPage: (page: NarrowbandPageId) => void;
  setNarrowbandPsdFft: (n: number) => void;
  setNarrowbandStftFft: (n: number) => void;
  setNarrowbandFreqMode: (mode: NarrowbandFreqMode) => void;
  setNarrowbandGrid: (on: boolean) => void;
  setNarrowbandWaveformMode: (mode: NarrowbandWaveformMode) => void;
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
  setNavWindowTime: (
    win: { min: number; max: number },
    opts?: { recordHistory?: boolean },
  ) => void;
  viewHistoryBack: () => void;
  viewHistoryForward: () => void;
  setNavFullTime: (full: { min: number; max: number }) => void;
  setAuxPaneHeightPx: (px: number) => void;
  setNavPaneHeightPx: (px: number) => void;
  setNavPaused: (paused: boolean) => void;
  setSpectrogramDisplay: (
    snap: {
      power: Float32Array;
      binCount: number;
      frameCount: number;
      freqHz: { min: number; max: number };
      timeSec: { min: number; max: number };
    } | null,
  ) => void;
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
  setDetectSampleRange: (range: { start: string; end: string }) => void;
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
  navFullTime: { min: 0, max: 1 },
  navWindowTime: { min: 0, max: 1 },
  viewHistory: [{ min: 0, max: 1 }],
  viewHistoryIndex: 0,
  auxPaneHeightPx: 205,
  navPaneHeightPx: 82,
  spectrogramDisplay: null,
  navPaused: false,
  workspaceMode: 'wideband',
  narrowbandPage: 'observe',
  narrowbandPsdFft: 4096,
  narrowbandStftFft: 1024,
  narrowbandFreqMode: 'baseband',
  narrowbandGrid: true,
  narrowbandWaveformMode: 'iq',
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
  setNavWindowTime: (win, opts) => {
    const record = opts?.recordHistory !== false;
    set((s) => {
      const next = { min: win.min, max: win.max };
      const cur = s.navWindowTime;
      const same =
        Math.abs(cur.min - next.min) < 1e-15 && Math.abs(cur.max - next.max) < 1e-15;
      if (!record || same) {
        return { navWindowTime: next };
      }
      const truncated = s.viewHistory.slice(0, s.viewHistoryIndex + 1);
      truncated.push(next);
      const capped =
        truncated.length > 40 ? truncated.slice(truncated.length - 40) : truncated;
      return {
        navWindowTime: next,
        viewHistory: capped,
        viewHistoryIndex: capped.length - 1,
      };
    });
  },
  viewHistoryBack: () =>
    set((s) => {
      if (s.viewHistoryIndex <= 0) return s;
      const idx = s.viewHistoryIndex - 1;
      const win = s.viewHistory[idx];
      if (!win) return s;
      return { viewHistoryIndex: idx, navWindowTime: { ...win } };
    }),
  viewHistoryForward: () =>
    set((s) => {
      if (s.viewHistoryIndex >= s.viewHistory.length - 1) return s;
      const idx = s.viewHistoryIndex + 1;
      const win = s.viewHistory[idx];
      if (!win) return s;
      return { viewHistoryIndex: idx, navWindowTime: { ...win } };
    }),
  setNavFullTime: (full) => set({ navFullTime: { ...full } }),
  setAuxPaneHeightPx: (px) => set({ auxPaneHeightPx: px }),
  setNavPaneHeightPx: (px) => set({ navPaneHeightPx: px }),
  setNavPaused: (paused) => set({ navPaused: paused }),
  setSpectrogramDisplay: (snap) => set({ spectrogramDisplay: snap }),
  setWorkspaceMode: (mode) => set({ workspaceMode: mode }),
  setNarrowbandPage: (page) => set({ narrowbandPage: page }),
  setNarrowbandPsdFft: (n) => set({ narrowbandPsdFft: n }),
  setNarrowbandStftFft: (n) => set({ narrowbandStftFft: n }),
  setNarrowbandFreqMode: (mode) => set({ narrowbandFreqMode: mode }),
  setNarrowbandGrid: (on) => set({ narrowbandGrid: on }),
  setNarrowbandWaveformMode: (mode) => set({ narrowbandWaveformMode: mode }),

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
  setDetectSampleRange: (range) =>
    set({
      detectSampleRange: {
        start: String(range.start),
        end: String(range.end),
      },
    }),

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
