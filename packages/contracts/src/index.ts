/** Shared contracts — Bot-F is owner; others import only. */
export type SampleIndex = bigint | string;

export interface HalfOpenRange {
  begin: string; // decimal sample index
  end: string;   // exclusive
}

export type MarkerSource = 'sample_label' | 'manual' | 'algorithm';

export interface ProjectV6Meta {
  format: 'signal-studio-native-project';
  version: 6;
}
