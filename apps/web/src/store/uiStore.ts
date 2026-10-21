/**
 * PROVISIONAL — Bot-B UI/session store (Zustand).
 * Owner: Bot-B. Not a packages/contracts export.
 */

import { create } from 'zustand';
import type {
  ActiveTool,
  AuxChartKind,
  ChartMode,
  DisplaySettings,
  LevelSettings,
  RightPage,
  TempLayerId,
  WorkspaceMode,
} from '../types/provisional';

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

  setActiveTool: (tool) => set({ activeTool: tool }),
  setRightPage: (page) => set({ rightPage: page }),
  toggleRightPanel: () =>
    set((s) => ({ rightPanelCollapsed: !s.rightPanelCollapsed })),
  setRightPanelCollapsed: (collapsed) => set({ rightPanelCollapsed: collapsed }),

  openLayer: (layer) => {
    const s = get();
    // Opening another closes previous (revert its draft).
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
    // Legal draft stub: dynamic range > 0
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
      statusFileLabel: 'demo_wideband.iq',
      statusChannelLabel: 'CH0',
      statusCursor: { timeLabel: '0.000 s', freqLabel: '915.000 MHz' },
    }),
  clearProject: () =>
    set({
      projectHasSample: false,
      statusFileLabel: 'No file',
      statusChannelLabel: '—',
      statusCursor: { timeLabel: '—', freqLabel: '—' },
    }),
}));
