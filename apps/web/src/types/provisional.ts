/**
 * PROVISIONAL — Bot-B (Web UI/UX) owned UI/session types.
 * Shared domain/API contracts belong in packages/contracts (Bot-F).
 * Do not promote these into packages/contracts without CAO + Bot-F review.
 */

export type ActiveTool =
  | 'navigate'
  | 'zoom'
  | 'pan'
  | 'measure'
  | 'roi'
  | 'mark'
  | 'none';

export type RightPage = 'display' | 'detection' | 'annotation' | 'channel';

export type TempLayerId = 'level' | 'display' | 'spectral' | null;

export type ChartMode = 'stft' | 'waterfall';

export type AuxChartKind = 'waveform' | 'psd';

export type WorkspaceMode = 'wideband' | 'narrowband';

export type FreqDisplayMode = 'rf' | 'baseband';

/** PROVISIONAL committed level settings (UX-P01). */
export interface LevelSettings {
  refLevelDb: number;
  dynamicRangeDb: number;
  autoAdapt: boolean;
}

/** PROVISIONAL committed display settings (UX-P01). */
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