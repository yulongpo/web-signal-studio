/**
 * M-03 numerical golden: PSD/STFT via @wss/dsp-wasm synthetic fixtures.
 * Stable Float32 peak bins — not probe prose.
 */
import { describe, expect, it } from "vitest";
import {
  ReferencePsdEngine,
  ReferenceStftEngine,
  findPeakBins,
  frequencyToBin,
} from "@wss/dsp-wasm";
import {
  assertDisplayOnlyExtract,
  extractDisplayGrid,
  FORBIDDEN_DISPLAY_EXTRACT_KEYS,
} from "../tile/displayExtract.js";
import { createSpectrogramTileSource } from "../tile/spectrogramGrid.js";

function synthesizeTwoToneIqF32(options: {
  sampleCount: number;
  sampleRateHz: number;
  f1Hz: number;
  f2Hz: number;
  amp1?: number;
  amp2?: number;
}): Float32Array {
  const { sampleCount, sampleRateHz, f1Hz, f2Hz } = options;
  const a1 = options.amp1 ?? 1;
  const a2 = options.amp2 ?? 0.7;
  const out = new Float32Array(sampleCount * 2);
  for (let n = 0; n < sampleCount; n++) {
    const p1 = (2 * Math.PI * f1Hz * n) / sampleRateHz;
    const p2 = (2 * Math.PI * f2Hz * n) / sampleRateHz;
    out[n * 2] = a1 * Math.cos(p1) + a2 * Math.cos(p2);
    out[n * 2 + 1] = a1 * Math.sin(p1) + a2 * Math.sin(p2);
  }
  return out;
}

const PSD_GOLDEN = {
  fftSize: 1024,
  sampleRateHz: 1_024_000,
  f1Hz: 50_000,
  f2Hz: 120_000,
  expectedBins: [50, 120] as const,
  toleranceBins: 1,
} as const;

const STFT_GOLDEN = {
  fftSize: 256,
  hopSize: 128,
  sampleRateHz: 256_000,
  f1Hz: 40_000,
  f2Hz: 80_000,
  expectedBins: [40, 80] as const,
  toleranceBins: 1,
  minPeakFracOfMax: 0.15,
} as const;

describe("M-03 PSD numerical golden (dsp-wasm fixture)", () => {
  it("places PSD peaks at Float32-stable golden bins", async () => {
    const { fftSize, sampleRateHz, f1Hz, f2Hz, expectedBins, toleranceBins } = PSD_GOLDEN;
    expect(frequencyToBin(f1Hz, sampleRateHz, fftSize)).toBe(expectedBins[0]);
    expect(frequencyToBin(f2Hz, sampleRateHz, fftSize)).toBe(expectedBins[1]);
    const iq = synthesizeTwoToneIqF32({ sampleCount: fftSize * 4, sampleRateHz, f1Hz, f2Hz });
    const result = await new ReferencePsdEngine().analyze(
      { begin: 0n, end: BigInt(fftSize * 4), fftSize, window: "hann", overlap: 0.5, sampleRateHz },
      iq,
    );
    expect(result.linearPower).toBeInstanceOf(Float32Array);
    expect(result.linearPower.length).toBe(fftSize);
    const power = Float64Array.from(result.linearPower);
    const peaks = findPeakBins(power, 2, 3).sort((a, b) => a - b);
    expect(peaks).toHaveLength(2);
    expect(Math.abs(peaks[0]! - expectedBins[0])).toBeLessThanOrEqual(toleranceBins);
    expect(Math.abs(peaks[1]! - expectedBins[1])).toBeLessThanOrEqual(toleranceBins);
    const sorted = [...result.linearPower].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)]!;
    expect(result.linearPower[expectedBins[0]]!).toBeGreaterThan(median * 10);
    expect(result.linearPower[expectedBins[1]]!).toBeGreaterThan(median * 10);
  });
});

describe("M-03 STFT numerical golden (dsp-wasm fixture)", () => {
  it("concentrates STFT energy at golden bins; display extract stays displayOnly", async () => {
    const g = STFT_GOLDEN;
    expect(frequencyToBin(g.f1Hz, g.sampleRateHz, g.fftSize)).toBe(g.expectedBins[0]);
    expect(frequencyToBin(g.f2Hz, g.sampleRateHz, g.fftSize)).toBe(g.expectedBins[1]);
    const sampleCount = g.fftSize + g.hopSize * 3;
    const iq = synthesizeTwoToneIqF32({
      sampleCount,
      sampleRateHz: g.sampleRateHz,
      f1Hz: g.f1Hz,
      f2Hz: g.f2Hz,
    });
    const result = await new ReferenceStftEngine().analyze(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        fftSize: g.fftSize,
        hopSize: g.hopSize,
        window: "hann",
        sampleRateHz: g.sampleRateHz,
      },
      iq,
    );
    expect(result.linearPower).toBeInstanceOf(Float32Array);
    expect(result.binCount).toBe(g.fftSize);
    expect(result.frameCount).toBeGreaterThanOrEqual(3);
    for (let f = 0; f < result.frameCount; f++) {
      const row = result.linearPower.subarray(f * g.fftSize, (f + 1) * g.fftSize);
      const power = Float64Array.from(row);
      const peaks = findPeakBins(power, 2, 3).sort((a, b) => a - b);
      expect(peaks).toHaveLength(2);
      expect(Math.abs(peaks[0]! - g.expectedBins[0])).toBeLessThanOrEqual(g.toleranceBins);
      expect(Math.abs(peaks[1]! - g.expectedBins[1])).toBeLessThanOrEqual(g.toleranceBins);
      const max = Math.max(...row);
      expect(row[g.expectedBins[0]]! / max).toBeGreaterThan(g.minPeakFracOfMax);
      expect(row[g.expectedBins[1]]! / max).toBeGreaterThan(g.minPeakFracOfMax);
    }
    const extracted = extractDisplayGrid({
      source: result.linearPower,
      sourceWidth: result.binCount,
      sourceHeight: result.frameCount,
      srcX: 0,
      srcY: 0,
      srcW: result.binCount,
      srcH: result.frameCount,
      outW: 64,
      outH: 32,
      reduce: "peak",
    });
    assertDisplayOnlyExtract(extracted);
    for (const key of FORBIDDEN_DISPLAY_EXTRACT_KEYS) {
      expect(extracted).not.toHaveProperty(key);
    }
    const tileSrc = createSpectrogramTileSource({
      power: result.linearPower,
      frameCount: result.frameCount,
      binCount: result.binCount,
      freqHz: { min: -g.sampleRateHz / 2, max: g.sampleRateHz / 2 },
      timeSec: { min: 0, max: 1 },
      orientation: "waterfall",
    });
    const tile = tileSrc.extractTile({
      view: {
        xDomain: { min: -g.sampleRateHz / 4, max: g.sampleRateHz / 4 },
        yDomain: { min: 0, max: 1 },
      },
      outW: 32,
      outH: 16,
      mode: "refine",
    });
    expect(tile.displayOnly).toBe(true);
    assertDisplayOnlyExtract(tile);
  });
});
