/**
 * In-memory opened IQ session for the main chart (WAV / RAW / SigMF).
 * ChunkedReader lives here (not in Zustand). UI store only mirrors metadata + epoch.
 */
import type { ChunkedReader } from '@wss/file-io';

export type IqOpenVia = 'fsa' | 'input';

/** Distinguishes open path for chip / StatusBar (never invent capture claims). */
export type IqFileFormat = 'wav' | 'raw' | 'sigmf';

export interface IqFileSession {
  reader: ChunkedReader;
  sampleRateHz: number;
  /** Explicit UI / telemetry label — never synthetic for a real file. */
  sourceLabel: string;
  fileName: string;
  via: IqOpenVia;
  format: IqFileFormat;
  epoch: number;
}

let current: IqFileSession | null = null;
let epoch = 0;
let openDepth = 0;
let openBusy = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const cb of listeners) cb();
}

function setOpenBusy(next: boolean): void {
  if (openBusy === next) return;
  openBusy = next;
  notify();
}

/** Chart shows loading for the whole async open, not only after the session lands. */
export function beginIqFileOpen(): void {
  openDepth += 1;
  setOpenBusy(true);
}

export function endIqFileOpen(): void {
  openDepth = Math.max(0, openDepth - 1);
  setOpenBusy(openDepth > 0);
}

export function getIqFileOpenBusy(): boolean {
  return openBusy;
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
  format: IqFileFormat;
}): IqFileSession {
  epoch += 1;
  current = {
    reader: input.reader,
    sampleRateHz: input.sampleRateHz,
    sourceLabel: input.sourceLabel,
    fileName: input.fileName,
    via: input.via,
    format: input.format,
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
