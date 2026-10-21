/**
 * Spectrogram grid + physical-view tile source (Bot-C).
 *
 * Holds row-major power and physical freq/time extents. Given a ViewState
 * (axis ranges) + out size + preview|refine, crops by physical window then
 * downsamples via extractDisplayGrid. Output remains display-only.
 */

import type { ViewState } from "../interaction/viewTransform.js";
import {
  assertDisplayOnlyExtract,
  extractDisplayGrid,
  suggestExtractOutSize,
  type DisplayExtractResult,
  type DisplayReduce,
} from "./displayExtract.js";

export type SpectrogramOrientation = "stft" | "waterfall";

export interface FreqTimeExtent {
  freqHz: { min: number; max: number };
  timeSec: { min: number; max: number };
}

export interface SpectrogramGridSnapshot {
  /** Row-major power. Layout depends on orientation (see below). */
  power: Float32Array;
  frameCount: number;
  binCount: number;
  extent: FreqTimeExtent;
  /**
   * stft: width=frameCount (time), height=binCount (freq); index = bin*frameCount + frame
   * waterfall: width=binCount (freq), height=frameCount (time); index = frame*binCount + bin
   */
  orientation: SpectrogramOrientation;
}

export interface SpectrogramTileRequest {
  view: ViewState;
  outW: number;
  outH: number;
  mode: "preview" | "refine" | "idle";
  reduce?: DisplayReduce;
  /** Override plot CSS size for suggestExtractOutSize when outW/outH not forced. */
  plotCssWidth?: number;
  plotCssHeight?: number;
  /** When true, ignore outW/outH and pick via suggestExtractOutSize. */
  autoOutSize?: boolean;
}

export interface SpectrogramTileSource {
  /** Current contiguous grid snapshot (ring may unwrap). */
  getGrid(): SpectrogramGridSnapshot;
  /** Full physical extent of the stored grid (not the current view). */
  getExtent(): FreqTimeExtent;
  getOrientation(): SpectrogramOrientation;
  /**
   * Crop by physical view window, then downsample to display tile.
   * Result is display-only (assertDisplayOnlyExtract).
   */
  extractTile(req: SpectrogramTileRequest): DisplayExtractResult;
  /**
   * Append one frame (length === binCount). Only available when created with ringCapacity.
   * Oldest frames drop when capacity is full. No whole-history reallocation.
   */
  appendFrame?(frame: Float32Array): void;
  /** Current live frame count (≤ capacity when ring). */
  getFrameCount(): number;
}

export interface CreateSpectrogramTileSourceOptions {
  power?: Float32Array;
  frameCount: number;
  binCount: number;
  freqHz: { min: number; max: number };
  timeSec: { min: number; max: number };
  orientation?: SpectrogramOrientation;
  /**
   * Fixed ring capacity (frames). When set, power is optional (zeros until append).
   * Appends never reallocate the ring storage.
   */
  ringCapacity?: number;
}

/**
 * Fixed-capacity waterfall / STFT frame ring: append without reallocating history.
 * Contiguous snapshot unwraps oldest→newest into a reusable scratch buffer.
 */
export class SpectrogramRingBuffer {
  readonly capacity: number;
  readonly binCount: number;
  private readonly storage: Float32Array;
  private writeIdx = 0;
  private count = 0;
  private scratch: Float32Array | null = null;

  constructor(capacity: number, binCount: number) {
    if (capacity < 1) throw new Error("SpectrogramRingBuffer: capacity < 1");
    if (binCount < 1) throw new Error("SpectrogramRingBuffer: binCount < 1");
    this.capacity = capacity;
    this.binCount = binCount;
    this.storage = new Float32Array(capacity * binCount);
  }

  getFrameCount(): number {
    return this.count;
  }

  appendFrame(frame: Float32Array): void {
    if (frame.length < this.binCount) {
      throw new Error("SpectrogramRingBuffer.appendFrame: frame too short");
    }
    const dest = this.writeIdx * this.binCount;
    this.storage.set(frame.subarray(0, this.binCount), dest);
    this.writeIdx = (this.writeIdx + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  /**
   * Oldest→newest contiguous copy. Reuses one scratch buffer sized to capacity*binCount.
   * When not yet full, returns a subarray view of length count*binCount.
   */
  toContiguous(): { power: Float32Array; frameCount: number } {
    if (this.count === 0) {
      return { power: new Float32Array(0), frameCount: 0 };
    }
    if (this.count < this.capacity) {
      // Data occupies [0, count) in order (writeIdx === count).
      return {
        power: this.storage.subarray(0, this.count * this.binCount),
        frameCount: this.count,
      };
    }
    // Full: unwrap from writeIdx (oldest) around the ring.
    if (!this.scratch || this.scratch.length !== this.storage.length) {
      this.scratch = new Float32Array(this.storage.length);
    }
    const oldest = this.writeIdx;
    const firstLen = (this.capacity - oldest) * this.binCount;
    this.scratch.set(this.storage.subarray(oldest * this.binCount), 0);
    if (oldest > 0) {
      this.scratch.set(this.storage.subarray(0, oldest * this.binCount), firstLen);
    }
    return { power: this.scratch, frameCount: this.capacity };
  }
}

/** Map a physical range [a,b] onto a source axis of `size` samples covering [fullMin, fullMax]. */
export function physicalRangeToSourceWindow(
  fullMin: number,
  fullMax: number,
  viewMin: number,
  viewMax: number,
  size: number,
): { start: number; span: number } {
  const fullSpan = fullMax - fullMin;
  if (!(fullSpan > 0) || size < 1) {
    return { start: 0, span: Math.max(1, size) };
  }
  const start = ((viewMin - fullMin) / fullSpan) * size;
  const span = ((viewMax - viewMin) / fullSpan) * size;
  return { start, span: Math.max(span, 1e-9) };
}

/**
 * Convert ViewState physical domains into a source-pixel window for extractDisplayGrid.
 * Does not attach Hz/markers to the extract result — mapping only.
 */
export function viewToSourceWindow(
  grid: Pick<SpectrogramGridSnapshot, "frameCount" | "binCount" | "extent" | "orientation">,
  view: ViewState,
): { srcX: number; srcY: number; srcW: number; srcH: number; sourceWidth: number; sourceHeight: number } {
  const { extent, orientation, frameCount, binCount } = grid;
  if (orientation === "waterfall") {
    // cols = freq bins, rows = time frames
    const x = physicalRangeToSourceWindow(
      extent.freqHz.min,
      extent.freqHz.max,
      view.xDomain.min,
      view.xDomain.max,
      binCount,
    );
    const y = physicalRangeToSourceWindow(
      extent.timeSec.min,
      extent.timeSec.max,
      view.yDomain.min,
      view.yDomain.max,
      frameCount,
    );
    return {
      srcX: x.start,
      srcY: y.start,
      srcW: x.span,
      srcH: y.span,
      sourceWidth: binCount,
      sourceHeight: frameCount,
    };
  }
  // stft: cols = time frames, rows = freq bins
  const x = physicalRangeToSourceWindow(
    extent.timeSec.min,
    extent.timeSec.max,
    view.xDomain.min,
    view.xDomain.max,
    frameCount,
  );
  const y = physicalRangeToSourceWindow(
    extent.freqHz.min,
    extent.freqHz.max,
    view.yDomain.min,
    view.yDomain.max,
    binCount,
  );
  return {
    srcX: x.start,
    srcY: y.start,
    srcW: x.span,
    srcH: y.span,
    sourceWidth: frameCount,
    sourceHeight: binCount,
  };
}

/**
 * Build a display-path tile source over a spectrogram grid (optional ring).
 */
export function createSpectrogramTileSource(
  opts: CreateSpectrogramTileSourceOptions,
): SpectrogramTileSource {
  const orientation = opts.orientation ?? "stft";
  const binCount = opts.binCount;
  const extent: FreqTimeExtent = {
    freqHz: { ...opts.freqHz },
    timeSec: { ...opts.timeSec },
  };

  let ring: SpectrogramRingBuffer | null = null;
  let staticPower: Float32Array;
  let staticFrames: number;

  if (opts.ringCapacity != null) {
    ring = new SpectrogramRingBuffer(opts.ringCapacity, binCount);
    if (opts.power && opts.frameCount > 0) {
      const layoutFrames = opts.frameCount;
      for (let f = 0; f < layoutFrames; f++) {
        if (orientation === "stft") {
          // power[bin * frameCount + frame] → gather one frame across bins
          const frame = new Float32Array(binCount);
          for (let b = 0; b < binCount; b++) {
            frame[b] = opts.power[b * layoutFrames + f] ?? 0;
          }
          ring.appendFrame(frame);
        } else {
          // waterfall already frame-major: power[frame * binCount + bin]
          ring.appendFrame(opts.power.subarray(f * binCount, (f + 1) * binCount));
        }
      }
    }
    staticPower = new Float32Array(0);
    staticFrames = 0;
  } else {
    const need = opts.frameCount * binCount;
    if (!opts.power || opts.power.length < need) {
      throw new Error("createSpectrogramTileSource: power buffer too short");
    }
    staticPower = opts.power;
    staticFrames = opts.frameCount;
  }

  const snapshot = (): SpectrogramGridSnapshot => {
    if (ring) {
      const { power, frameCount } = ring.toContiguous();
      // Ring stores frame-major frames. For stft display layout we need bin-major rows.
      if (orientation === "stft" && frameCount > 0) {
        const transposed = new Float32Array(frameCount * binCount);
        for (let f = 0; f < frameCount; f++) {
          for (let b = 0; b < binCount; b++) {
            transposed[b * frameCount + f] = power[f * binCount + b] ?? 0;
          }
        }
        return { power: transposed, frameCount, binCount, extent, orientation };
      }
      return { power, frameCount, binCount, extent, orientation };
    }
    return {
      power: staticPower,
      frameCount: staticFrames,
      binCount,
      extent,
      orientation,
    };
  };

  const source: SpectrogramTileSource = {
    getGrid: snapshot,
    getExtent: () => ({
      freqHz: { ...extent.freqHz },
      timeSec: { ...extent.timeSec },
    }),
    getOrientation: () => orientation,
    getFrameCount: () => (ring ? ring.getFrameCount() : staticFrames),
    extractTile(req: SpectrogramTileRequest): DisplayExtractResult {
      const grid = snapshot();
      if (grid.frameCount < 1 || grid.binCount < 1 || grid.power.length === 0) {
        const outW = Math.max(1, req.outW);
        const outH = Math.max(1, req.outH);
        const empty: DisplayExtractResult = {
          data: new Float32Array(outW * outH),
          width: outW,
          height: outH,
          sourceWindow: { x: 0, y: 0, w: 1, h: 1 },
          displayOnly: true,
          reduce: req.reduce ?? (req.mode === "preview" ? "nearest" : "peak"),
          extractMs: 0,
        };
        assertDisplayOnlyExtract(empty);
        return empty;
      }

      let outW = req.outW;
      let outH = req.outH;
      if (req.autoOutSize) {
        const win = viewToSourceWindow(grid, req.view);
        const suggested = suggestExtractOutSize({
          sourceWidth: Math.max(1, Math.ceil(win.srcW)),
          sourceHeight: Math.max(1, Math.ceil(win.srcH)),
          plotCssWidth: req.plotCssWidth ?? outW,
          plotCssHeight: req.plotCssHeight ?? outH,
          mode: req.mode === "idle" ? "refine" : req.mode,
        });
        outW = suggested.outW;
        outH = suggested.outH;
      }

      const win = viewToSourceWindow(grid, req.view);
      const reduce =
        req.reduce ?? (req.mode === "preview" ? "nearest" : "peak");
      const result = extractDisplayGrid({
        source: grid.power,
        sourceWidth: win.sourceWidth,
        sourceHeight: win.sourceHeight,
        srcX: win.srcX,
        srcY: win.srcY,
        srcW: win.srcW,
        srcH: win.srcH,
        outW,
        outH,
        reduce,
      });
      assertDisplayOnlyExtract(result);
      return result;
    },
  };

  if (ring) {
    source.appendFrame = (frame: Float32Array) => {
      ring!.appendFrame(frame);
      // Stretch time extent to cover capacity window when full; keep caller's extent otherwise.
      // Caller owns physical timeSec mapping; we only grow frame count.
      void extent;
    };
  }

  return source;
}

/** Alias type name requested in the task brief. */
export type SpectrogramGrid = SpectrogramGridSnapshot;
