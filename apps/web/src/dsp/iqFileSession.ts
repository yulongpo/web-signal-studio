/**
 * In-memory opened IQ WAV session for the main chart.
 * ChunkedReader lives here (not in Zustand). UI store only mirrors metadata + epoch.
 */
import type { ChunkedReader } from '@wss/file-io';

export type IqOpenVia = 'fsa' | 'input';

export interface IqFileSession {
  reader: ChunkedReader;
  sampleRateHz: number;
  /** Explicit UI / telemetry label — never synthetic for a real file. */
  sourceLabel: string;
  fileName: string;
  via: IqOpenVia;
  epoch: number;
}

let current: IqFileSession | null = null;
let epoch = 0;
const listeners = new Set<() => void>();

function notify(): void {
  for (const cb of listeners) cb();
}

export function getIqFileSession(): IqFileSession | null {
  return current;
}

export function getIqFileEpoch(): number {
  return epoch;
}

/** Subscribe to open/clear; returns unsubscribe. */
export function subscribeIqFileSession(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setIqFileSession(input: {
  reader: ChunkedReader;
  sampleRateHz: number;
  sourceLabel: string;
  fileName: string;
  via: IqOpenVia;
}): IqFileSession {
  epoch += 1;
  current = {
    reader: input.reader,
    sampleRateHz: input.sampleRateHz,
    sourceLabel: input.sourceLabel,
    fileName: input.fileName,
    via: input.via,
    epoch,
  };
  notify();
  return current;
}

export function clearIqFileSession(): void {
  if (!current && epoch === 0) return;
  epoch += 1;
  current = null;
  notify();
}
