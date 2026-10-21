/**
 * PROVISIONAL — Bot-B UI/session store (Zustand).
 * Owner: Bot-B. Not a packages/contracts export.
 */

import { create } from 'zustand';
import type {
  ProjectDocumentJson,
  LocalComputeTaskRecord,
  LocalComputeCapabilities,
  SpectralWindowName,
  StftSupportedMethod,
  SpectrumStatisticName,
} from '@wss/contracts';
import { DEFAULT_KAISER_BETA } from '@wss/contracts';
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
  NarrowbandPsdMode,
  LinkedCursorState,
  LinkedCursorPinSource,
  NarrowbandFreqMode,
  BottomPanelTab,
  NarrowbandModulationType,
  NarrowbandDemodMode,
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
  /** G02 chrome pref: desired STFT window (drives next compute; != dspFftWindow publish). */
  stftWindowPref: SpectralWindowName;
  /** G02 chrome pref: desired overlap ratio [0,1). */
  stftOverlapPref: number;
  /** G02 chrome pref: Kaiser beta when window=kaiser (drives next compute; != dspKaiserBeta publish). */
  stftKaiserBetaPref: number;
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
  /** G18 multi-chart linked cursor (Main/Aux sync; not rail scrubber). */
  linkedCursor: LinkedCursorState;
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

  /**
   * G02 SpecParamStrip: last main-chart STFT window / overlap published by Bot-D.
   * null until a real STFT path settles (loading / demo-fallback stay null).
   * Chrome display is Bot-B/C; these fields are the subscribe source.
   */
  dspFftWindow: SpectralWindowName | null;
  /** Overlap ratio in [0, 1) derived from hop/fft of the last STFT. */
  dspFftOverlap: number | null;
  /** Hop size (samples) of the last STFT; null when unknown. */
  dspFftHopSize: number | null;
  /** FFT size actually used by last STFT (may differ from UI stftN until wired). */
  dspFftSizeActive: number | null;
  /**
   * G02 STFT method actually used. Web only implements 'welch'.
   * null until STFT settles; Multitaper/Burg/etc. stay BLOCKED (never published as fake).
   */
  dspSpectralMethod: StftSupportedMethod | null;
  /**
   * G02 segment duration ms derived from active fftSize/fs (desktop segmentMilliseconds).
   * Desktop auto N/B (0) is not implemented on web.
   */
  dspSegmentMs: number | null;
  /**
   * SpectrumStatistic — PSD-only on desktop STFT path. Always null for main STFT publish
   * (honest NA; Bot-B should stamp — / NA, not invent Mean).
   */
  dspSpectrumStatistic: SpectrumStatisticName | null;
  /** Kaiser β when window is kaiser; else null. */
  dspKaiserBeta: number | null;

  /** G06 narrowband page + display settings (persist across page/overflow). */
  narrowbandPage: NarrowbandPageId;
  narrowbandPsdFft: number;
  /** G18: 驻留帧谱/统计谱 UI slot; series computation owned by Bot-D. */
  narrowbandPsdMode: NarrowbandPsdMode;
  /** G18 pinned dwell for frame PSD (null = default last STFT frame). Pin UI is B/C. */
  narrowbandPinnedDwellIndex: number | null;
  narrowbandStftFft: number;
  narrowbandFreqMode: NarrowbandFreqMode;
  narrowbandGrid: boolean;
  narrowbandWaveformMode: NarrowbandWaveformMode;

  setActiveTool: (tool: ActiveTool) => void;
  setNarrowbandPage: (page: NarrowbandPageId) => void;
  setNarrowbandPsdFft: (n: number) => void;
  setNarrowbandPsdMode: (mode: NarrowbandPsdMode) => void;
  setNarrowbandPinnedDwellIndex: (index: number | null) => void;
  setNarrowbandStftFft: (n: number) => void;
  setNarrowbandFreqMode: (mode: NarrowbandFreqMode) => void;
  setNarrowbandGrid: (on: boolean) => void;
  setNarrowbandWaveformMode: (mode: NarrowbandWaveformMode) => void;

  /** G07 bottom panel (rebuild bottomContent_). */
  bottomPanelExpanded: boolean;
  bottomPanelTab: BottomPanelTab;
  bottomPanelHeightPx: number;
  shellLogLines: string[];
  taskProgress: { label: string; percent: number | null; detail: string };
  setBottomPanelExpanded: (open: boolean) => void;
  setBottomPanelTab: (tab: BottomPanelTab) => void;
  setBottomPanelHeightPx: (px: number) => void;
  appendShellLog: (line: string) => void;
  clearShellLog: () => void;
  setTaskProgress: (p: { label?: string; percent?: number | null; detail?: string }) => void;
  /** G07 live Detect feeds (real LocalComputeTaskRecord only; no invented runs). */
  detectRunFeed: LocalComputeTaskRecord[];
  detectRunSelectedId: string | null;
  upsertDetectRun: (rec: LocalComputeTaskRecord) => void;
  selectDetectRun: (runId: string | null) => void;
  clearDetectRunFeed: () => void;
  /** G07: last real LocalCompute capabilities snapshot (no invented engines). */
  detectCapabilities: LocalComputeCapabilities | null;
  setDetectCapabilities: (caps: LocalComputeCapabilities | null) => void;

  /** G06 page chrome prefs (no fake DSP). */
  nbModulationType: NarrowbandModulationType;
  nbSymbolRate: string;
  nbDlModelLabel: string;
  nbDlTargetRate: string;
  nbDlAllowResample: boolean;
  nbDemodMode: NarrowbandDemodMode;
  setNbModulationType: (t: NarrowbandModulationType) => void;
  setNbSymbolRate: (v: string) => void;
  setNbDlModelLabel: (v: string) => void;
  setNbDlTargetRate: (v: string) => void;
  setNbDlAllowResample: (v: boolean) => void;
  setNbDemodMode: (m: NarrowbandDemodMode) => void;
  setRightPage: (page: RightPage) => void;
  toggleRightPanel: () => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  openLayer: (layer: Exclude<TempLayerId, null>) => void;
  toggleLayer: (layer: Exclude<TempLayerId, null>) => void;
  closeTempLayer: (opts?: { revertDraft?: boolean }) => void;
  setChartMode: (mode: ChartMode) => void;
  setStftN: (n: number) => void;
  setStftWindowPref: (w: SpectralWindowName) => void;
  setStftOverlapPref: (overlap: number) => void;
  setStftKaiserBetaPref: (beta: number) => void;
  setPaletteId: (id: string) => void;
  setAuxChartKind: (kind: AuxChartKind) => void;
  setNavWindowTime: (
    win: { min: number; max: number },
    opts?: { recordHistory?: boolean },
  ) => void;
  viewHistoryBack: () => void;
  viewHistoryForward: () => void;
  /** Fit nav window to full IQ time (谱图全域 / 适应全部数据). */
  fitNavToFull: () => void;
  /** Restore default nav view + history seed (恢复默认视图). */
  restoreDefaultNavView: () => void;
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
  pinLinkedCursor: (opts: {
    source: LinkedCursorPinSource;
    timeSec?: number;
    frequencyHz?: number;
    selectedFrame?: number | null;
    /** View centers used when a dim is omitted (desktop 17471a6). */
    centerTimeSec?: number;
    centerFrequencyHz?: number;
  }) => void;
  clearLinkedCursor: () => void;
  /** Esc / clear-menu: active workspace pin (WB linkedCursor or NB dwell+restore statistical). */
  clearActivePinnedCursor: () => boolean;
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
  /** Publish or clear main STFT window/overlap (Bot-D G02). */
  setDspFftAnalysisParams: (
    params: {
      window: SpectralWindowName;
      overlap: number;
      hopSize: number;
      fftSize: number;
      method: StftSupportedMethod;
      segmentMs: number;
      /** null = NA (STFT has no SpectrumStatistic on desktop). */
      spectrumStatistic: SpectrumStatisticName | null;
      kaiserBeta: number | null;
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
  stftWindowPref: 'hann',
  stftOverlapPref: 0.75,
  stftKaiserBetaPref: DEFAULT_KAISER_BETA,
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
  narrowbandPsdMode: 'statistical',
  narrowbandPinnedDwellIndex: null,
  narrowbandStftFft: 1024,
  narrowbandFreqMode: 'baseband',
  narrowbandGrid: true,
  narrowbandWaveformMode: 'iq',
  bottomPanelExpanded: (() => {
    try {
      return localStorage.getItem('wss.bottomPanelExpanded.v1') !== '0';
    } catch {
      return false;
    }
  })(),
  bottomPanelTab: 'log',
  bottomPanelHeightPx: (() => {
    try {
      const raw = localStorage.getItem('wss.bottomPanelHeight.v1');
      if (raw == null) return 150;
      const n = Number(raw);
      if (!Number.isFinite(n)) return 150;
      return Math.max(100, Math.min(500, Math.round(n)));
    } catch {
      return 150;
    }
  })(),
  shellLogLines: ['Web shell ready · G07 bottom panel (no PASS)'],
  taskProgress: { label: '', percent: null, detail: '' },
  detectRunFeed: [],
  detectRunSelectedId: null,
  detectCapabilities: null,
  nbModulationType: 'unknown',
  nbSymbolRate: '1e6',
  nbDlModelLabel: '',
  nbDlTargetRate: '2.048e6',
  nbDlAllowResample: false,
  nbDemodMode: 'none',
  level: { ...DEFAULT_LEVEL },
  display: { ...DEFAULT_DISPLAY },
  levelDraft: null,
  displayDraft: null,
  statusCursor: { timeLabel: '—', freqLabel: '—' },
  linkedCursor: {
    pinned: false,
    timeSec: 0,
    frequencyHz: 0,
    selectedFrame: null,
  },
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
  dspFftWindow: null,
  dspFftOverlap: null,
  dspFftHopSize: null,
  dspFftSizeActive: null,
  dspSpectralMethod: null,
  dspSegmentMs: null,
  dspSpectrumStatistic: null,
  dspKaiserBeta: null,

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
  setStftWindowPref: (w) => set({ stftWindowPref: w }),
  setStftOverlapPref: (overlap) =>
    set({
      stftOverlapPref: Number.isFinite(overlap)
        ? Math.min(Math.max(overlap, 0), 0.999999)
        : 0.75,
    }),
  setStftKaiserBetaPref: (beta) =>
    set({
      stftKaiserBetaPref: Number.isFinite(beta)
        ? Math.min(Math.max(beta, 0), 30)
        : DEFAULT_KAISER_BETA,
    }),
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
  fitNavToFull: () => {
    const full = get().navFullTime;
    get().setNavWindowTime({ min: full.min, max: full.max });
  },
  restoreDefaultNavView: () => {
    const full = get().navFullTime;
    const win = { min: full.min, max: full.max };
    set({
      navWindowTime: win,
      viewHistory: [win],
      viewHistoryIndex: 0,
      chartMode: 'stft',
      workspaceMode: 'wideband',
    });
  },
  setNavFullTime: (full) => set({ navFullTime: { ...full } }),
  setAuxPaneHeightPx: (px) => set({ auxPaneHeightPx: px }),
  setNavPaneHeightPx: (px) => set({ navPaneHeightPx: px }),
  setNavPaused: (paused) => set({ navPaused: paused }),
  setSpectrogramDisplay: (snap) => set({ spectrogramDisplay: snap }),
  setWorkspaceMode: (mode) => set({ workspaceMode: mode }),
  setNarrowbandPage: (page) => set({ narrowbandPage: page }),
  setNarrowbandPsdFft: (n) => set({ narrowbandPsdFft: n }),
  setNarrowbandPsdMode: (mode) => set({ narrowbandPsdMode: mode }),
  setNarrowbandPinnedDwellIndex: (index) =>
    set({
      narrowbandPinnedDwellIndex:
        index == null || !Number.isFinite(index)
          ? null
          : Math.max(0, Math.floor(index)),
    }),
  setNarrowbandStftFft: (n) => set({ narrowbandStftFft: n }),
  setNarrowbandFreqMode: (mode) => set({ narrowbandFreqMode: mode }),
  setNarrowbandGrid: (on) => set({ narrowbandGrid: on }),
  setNarrowbandWaveformMode: (mode) => set({ narrowbandWaveformMode: mode }),
  setBottomPanelExpanded: (open) => {
    try {
      localStorage.setItem('wss.bottomPanelExpanded.v1', open ? '1' : '0');
    } catch {
      /* ignore */
    }
    set({ bottomPanelExpanded: open });
  },
  setBottomPanelTab: (tab) => set({ bottomPanelTab: tab }),
  setBottomPanelHeightPx: (px) => {
    const next = Math.max(100, Math.min(500, Math.round(px)));
    try {
      localStorage.setItem('wss.bottomPanelHeight.v1', String(next));
    } catch {
      /* ignore */
    }
    set({ bottomPanelHeightPx: next });
  },
  appendShellLog: (line) =>
    set((s) => {
      const next = [...s.shellLogLines, line];
      return { shellLogLines: next.length > 300 ? next.slice(next.length - 300) : next };
    }),
  clearShellLog: () => set({ shellLogLines: [] }),
  setTaskProgress: (p) =>
    set((s) => ({
      taskProgress: {
        label: p.label ?? s.taskProgress.label,
        percent: p.percent !== undefined ? p.percent : s.taskProgress.percent,
        detail: p.detail ?? s.taskProgress.detail,
      },
    })),
  upsertDetectRun: (rec) =>
    set((s) => {
      const rest = s.detectRunFeed.filter((r) => r.runId !== rec.runId);
      const next = [rec, ...rest].slice(0, 40);
      const selected =
        s.detectRunSelectedId && next.some((r) => r.runId === s.detectRunSelectedId)
          ? s.detectRunSelectedId
          : rec.runId;
      const pct =
        typeof rec.progress === 'number'
          ? Math.round(Math.max(0, Math.min(1, rec.progress)) * 100)
          : null;
      return {
        detectRunFeed: next,
        detectRunSelectedId: selected,
        taskProgress: {
          label: `Detect ${rec.kind}`,
          percent: pct,
          detail: `${rec.status} · ${rec.runId.slice(0, 8)}`,
        },
      };
    }),
  selectDetectRun: (runId) => set({ detectRunSelectedId: runId }),
  clearDetectRunFeed: () => set({ detectRunFeed: [], detectRunSelectedId: null }),
  setDetectCapabilities: (caps) => set({ detectCapabilities: caps }),
  setNbModulationType: (t) => set({ nbModulationType: t }),
  setNbSymbolRate: (v) => set({ nbSymbolRate: v }),
  setNbDlModelLabel: (v) => set({ nbDlModelLabel: v }),
  setNbDlTargetRate: (v) => set({ nbDlTargetRate: v }),
  setNbDlAllowResample: (v) => set({ nbDlAllowResample: v }),
  setNbDemodMode: (m) => set({ nbDemodMode: m }),

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
  pinLinkedCursor: (opts) =>
    set((st) => {
      const prev = st.linkedCursor;
      const timeSec =
        opts.timeSec != null && Number.isFinite(opts.timeSec)
          ? opts.timeSec
          : prev.pinned
            ? prev.timeSec
            : opts.centerTimeSec != null && Number.isFinite(opts.centerTimeSec)
              ? opts.centerTimeSec
              : prev.timeSec;
      const frequencyHz =
        opts.frequencyHz != null && Number.isFinite(opts.frequencyHz)
          ? opts.frequencyHz
          : prev.pinned
            ? prev.frequencyHz
            : opts.centerFrequencyHz != null && Number.isFinite(opts.centerFrequencyHz)
              ? opts.centerFrequencyHz
              : prev.frequencyHz;
      const selectFrame = opts.source === 'main' || opts.source === 'wave';
      const selectedFrame =
        opts.selectedFrame !== undefined
          ? opts.selectedFrame == null || !Number.isFinite(opts.selectedFrame)
            ? null
            : Math.max(0, Math.floor(opts.selectedFrame))
          : selectFrame
            ? prev.selectedFrame
            : prev.selectedFrame;
      return {
        linkedCursor: {
          pinned: true,
          timeSec,
          frequencyHz,
          selectedFrame,
        },
      };
    }),
  clearLinkedCursor: () =>
    set({
      linkedCursor: {
        pinned: false,
        timeSec: 0,
        frequencyHz: 0,
        selectedFrame: null,
      },
    }),
  clearActivePinnedCursor: () => {
    const st = get();
    if (st.workspaceMode === 'narrowband') {
      const hadPin = st.narrowbandPinnedDwellIndex != null;
      const wasFrame = st.narrowbandPsdMode === 'frame';
      const hadLinked = st.linkedCursor.pinned;
      if (!hadPin && !wasFrame && !hadLinked) return false;
      set({
        narrowbandPinnedDwellIndex: null,
        // Desktop Session::clearCursor drops framePsd -> averaged PSD.
        narrowbandPsdMode: 'statistical',
        // Also drop linked freq so NB PSD vline clears with Esc.
        linkedCursor: {
          pinned: false,
          timeSec: 0,
          frequencyHz: 0,
          selectedFrame: null,
        },
      });
      return true;
    }
    if (!st.linkedCursor.pinned) return false;
    set({
      linkedCursor: {
        pinned: false,
        timeSec: 0,
        frequencyHz: 0,
        selectedFrame: null,
      },
    });
    return true;
  },

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
  setDspFftAnalysisParams: (params) => {
    if (!params) {
      set({
        dspFftWindow: null,
        dspFftOverlap: null,
        dspFftHopSize: null,
        dspFftSizeActive: null,
        dspSpectralMethod: null,
        dspSegmentMs: null,
        dspSpectrumStatistic: null,
        dspKaiserBeta: null,
      });
      return;
    }
    const overlap = Number.isFinite(params.overlap)
      ? Math.min(Math.max(params.overlap, 0), 0.999999)
      : 0;
    const hopSize = Math.max(1, Math.floor(params.hopSize));
    const fftSize = Math.max(2, Math.floor(params.fftSize));
    const segmentMs = Number.isFinite(params.segmentMs) ? Math.max(0, params.segmentMs) : 0;
    const kaiserBeta =
      params.kaiserBeta != null && Number.isFinite(params.kaiserBeta)
        ? params.kaiserBeta
        : null;
    set({
      dspFftWindow: params.window,
      dspFftOverlap: overlap,
      dspFftHopSize: hopSize,
      dspFftSizeActive: fftSize,
      dspSpectralMethod: params.method,
      dspSegmentMs: segmentMs,
      dspSpectrumStatistic: params.spectrumStatistic,
      dspKaiserBeta: kaiserBeta,
    });
  },
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
