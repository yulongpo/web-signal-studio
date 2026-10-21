/**
 * PROVISIONAL — Bot-B (Web UI/UX) owned UI/session types.
 * Shared domain/API contracts belong in packages/contracts (Bot-F).
 */

export type TempLayerId = 'level' | 'display' | 'spectral' | null;

export type FreqDisplayMode = 'rf' | 'baseband';

export type ActiveTool = 'navigate' | 'select' | 'zoom' | 'marker' | 'measure';

/** Stable right-rail page ids; contract + e2e use `detect` (not `detection`). */
export type RightPage = 'display' | 'detect' | 'marker' | 'channel';

export type ChartMode = 'stft' | 'waterfall';

export type AuxChartKind = 'wave' | 'psd';

export type WorkspaceMode = 'wideband' | 'narrowband' | 'linked';

export interface LevelSettings {
  refLevelDb: number;
  dynamicRangeDb: number;
  autoAdapt: boolean;
}

export interface DisplaySettings {
  freqMode: FreqDisplayMode;
  showGrid: boolean;
  showColorScale: boolean;
}

export interface ProjectTreeNode {
  id: string;
  label: string;
  kind: 'project' | 'folder' | 'file' | 'channel';
  children?: ProjectTreeNode[];
}

export interface StatusCursor {
  timeLabel: string;
  freqLabel: string;
}

/** Main-chart DSP power source (Bot-D worker path + Bot-B chip). */
export type DspSourceKind = 'loading' | 'synthetic-stft-worker' | 'demo-fallback';
