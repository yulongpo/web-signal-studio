/**
 * PROVISIONAL — Bot-B (Web UI/UX) owned UI/session types.
 * Shared domain/API contracts belong in packages/contracts (Bot-F).
 */

export type TempLayerId = 'level' | 'display' | 'spectral' | null;

export type FreqDisplayMode = 'rf' | 'baseband';

export type ActiveTool =
  | 'navigate'
  | 'select'
  | 'zoom'
  | 'marker'
  | 'measure'
  | 'detection-roi';

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
export type DspSourceKind =
  | 'loading'
  | 'synthetic-stft-worker'
  | 'file-stft-worker'
  | 'fsa-wav-stft'
  | 'demo-fallback';


/** G06 narrowband stacked pages (rebuild NarrowbandPage). */
export type NarrowbandPageId = 'observe' | 'modulation' | 'deepLearning' | 'demodulation';
export type NarrowbandWaveformMode = 'iq' | 'rms' | 'phase' | 'envelope';
export type NarrowbandFreqMode = 'baseband' | 'rf';


/** G07 bottom panel tab ids (rebuild bottomTabs). */
export type BottomPanelTab = 'marks' | 'tasks' | 'log';

/** G06 modulation / DL / demod chrome prefs (persist across page switch; no DSP). */
export type NarrowbandModulationType = 'unknown' | 'psk' | 'qam' | 'fsk' | 'ask';
export type NarrowbandDemodMode = 'none' | 'am' | 'fm' | 'psk' | 'qam';
