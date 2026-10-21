import { describe, expect, it, beforeAll, afterEach } from 'vitest';
import { findPeakBins, frequencyToBin } from './fft.js';
import { ReferenceStftEngine, computeStft } from './stft.js';
import {
  isWasmFftAvailable,
  loadWasmFftModule,
  WasmReferenceStftEngine,
} from './wasm/index.js';
import { createDspWorkerClient, DspWorkerClient } from './worker/dsp-client.js';
import { InProcessAsyncBackend } from './worker/backends.js';

/**
 * dtype: float32 IQ in / float32 linear power out (same as JS STFT).
 * Eps accounts for transcendental + FP associativity between JS Math and WASM libm.
 */
const STFT_REL_EPS = 1e-6;
const STFT_ABS_FLOOR = 1e-18;

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

describe('WASM STFT golden (package C)', () => {
  beforeAll(async () => {
    expect(isWasmFftAvailable()).toBe(true);
    await loadWasmFftModule();
  });

  it('JS computeStft vs WasmReferenceStftEngine: frame count, peaks, powers within eps', async () => {
    const fftSize = 256;
    const hopSize = 128;
    const sampleRateHz = 256_000;
    const f1Hz = 40_000;
    const f2Hz = 80_000;
    const expected1 = frequencyToBin(f1Hz, sampleRateHz, fftSize);
    const expected2 = frequencyToBin(f2Hz, sampleRateHz, fftSize);
    const sampleCount = fftSize + hopSize * 3;
    const iq = synthesizeTwoToneIqF32({ sampleCount, sampleRateHz, f1Hz, f2Hz });

    const req = {
      begin: 0n,
      end: BigInt(sampleCount),
      fftSize,
      hopSize,
      window: 'hann' as const,
      sampleRateHz,
    };

    const jsResult = await new ReferenceStftEngine().analyze(req, iq);
    const wasmResult = await new WasmReferenceStftEngine().analyze(req, iq);

    expect(wasmResult.frameCount).toBe(jsResult.frameCount);
    expect(wasmResult.binCount).toBe(jsResult.binCount);
    expect(wasmResult.frameCenters).toEqual(jsResult.frameCenters);
    expect(wasmResult.linearPower.length).toBe(jsResult.linearPower.length);

    for (let f = 0; f < jsResult.frameCount; f++) {
      const jsRow = jsResult.linearPower.subarray(f * fftSize, (f + 1) * fftSize);
      const wasmRow = wasmResult.linearPower.subarray(f * fftSize, (f + 1) * fftSize);
      const jsPeaks = findPeakBins(Float64Array.from(jsRow), 2, 3).sort((a, b) => a - b);
      const wasmPeaks = findPeakBins(Float64Array.from(wasmRow), 2, 3).sort((a, b) => a - b);
      expect(jsPeaks).toEqual([expected1, expected2]);
      expect(wasmPeaks).toEqual(jsPeaks);

      for (let k = 0; k < fftSize; k++) {
        const a = jsRow[k]!;
        const b = wasmRow[k]!;
        const tol = Math.max(STFT_ABS_FLOOR, STFT_REL_EPS * Math.max(Math.abs(a), Math.abs(b)));
        expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);
      }
    }
  });

  it('injectable computeStft(..., wasmFft) matches ReferenceStftEngine', async () => {
    const { wasmFftRadix2WithModule } = await import('./wasm/WasmFftEngine.js');
    const mod = await loadWasmFftModule();
    const fftSize = 128;
    const hopSize = 64;
    const sampleRateHz = 128_000;
    const f1Hz = 16_000;
    const sampleCount = fftSize * 2;
    const iq = synthesizeTwoToneIqF32({
      sampleCount,
      sampleRateHz,
      f1Hz,
      f2Hz: 32_000,
    });
    const req = {
      begin: 0n,
      end: BigInt(sampleCount),
      fftSize,
      hopSize,
      window: 'rectangular' as const,
      sampleRateHz,
    };
    const js = await computeStft(req, iq);
    const wasm = await computeStft(req, iq, (buf, inv = false) =>
      wasmFftRadix2WithModule(mod, buf, inv),
    );
    expect(wasm.frameCount).toBe(js.frameCount);
    expect(wasm.linearPower.length).toBe(js.linearPower.length);
  });
});

describe('Optional Worker wasm-fft engine (package C, in-process)', () => {
  const clients: DspWorkerClient[] = [];
  afterEach(async () => {
    while (clients.length) {
      const c = clients.pop()!;
      await c.close();
    }
  });

  it('default engine is JS (configure not required)', async () => {
    const client = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    clients.push(client);
    const ready = await client.ready();
    expect(ready).toBeNull();

    const fftSize = 256;
    const hopSize = 128;
    const sampleRateHz = 256_000;
    const f1Hz = 40_000;
    const sampleCount = fftSize + hopSize * 2;
    const iq = synthesizeTwoToneIqF32({
      sampleCount,
      sampleRateHz,
      f1Hz,
      f2Hz: 80_000,
    });
    const result = await client.analyzeStft(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        fftSize,
        hopSize,
        window: 'hann',
        sampleRateHz,
      },
      iq,
    );
    expect(result.frameCount).toBeGreaterThanOrEqual(2);
    const expected = frequencyToBin(f1Hz, sampleRateHz, fftSize);
    const row = result.linearPower.subarray(0, fftSize);
    const peaks = findPeakBins(Float64Array.from(row), 2, 3);
    expect(peaks).toContain(expected);
  });

  it('engine wasm-fft configures and STFT peaks match JS path', async () => {
    const jsClient = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    const wasmClient = createDspWorkerClient({
      backend: new InProcessAsyncBackend(),
      engine: 'wasm-fft',
    });
    clients.push(jsClient, wasmClient);

    const configured = await wasmClient.ready();
    expect(configured).not.toBeNull();
    expect(configured!.engine).toBe('wasm-fft');
    expect(configured!.fellBackToJs).toBeFalsy();

    const fftSize = 256;
    const hopSize = 128;
    const sampleRateHz = 256_000;
    const f1Hz = 40_000;
    const f2Hz = 80_000;
    const expected1 = frequencyToBin(f1Hz, sampleRateHz, fftSize);
    const expected2 = frequencyToBin(f2Hz, sampleRateHz, fftSize);
    const sampleCount = fftSize + hopSize * 3;
    const iq = synthesizeTwoToneIqF32({ sampleCount, sampleRateHz, f1Hz, f2Hz });

    const req = {
      begin: 0n,
      end: BigInt(sampleCount),
      fftSize,
      hopSize,
      window: 'hann' as const,
      sampleRateHz,
    };

    const jsResult = await jsClient.analyzeStft(req, iq);
    const wasmResult = await wasmClient.analyzeStft(req, iq);

    expect(wasmResult.frameCount).toBe(jsResult.frameCount);
    for (let f = 0; f < jsResult.frameCount; f++) {
      const jsRow = jsResult.linearPower.subarray(f * fftSize, (f + 1) * fftSize);
      const wasmRow = wasmResult.linearPower.subarray(f * fftSize, (f + 1) * fftSize);
      const jsPeaks = findPeakBins(Float64Array.from(jsRow), 2, 3).sort((a, b) => a - b);
      const wasmPeaks = findPeakBins(Float64Array.from(wasmRow), 2, 3).sort((a, b) => a - b);
      expect(jsPeaks).toEqual([expected1, expected2]);
      expect(wasmPeaks).toEqual(jsPeaks);
    }
  });

  it('configureEngine("js") after wasm restores JS default', async () => {
    const client = createDspWorkerClient({
      backend: new InProcessAsyncBackend(),
      engine: 'wasm-fft',
    });
    clients.push(client);
    await client.ready();
    const back = await client.configureEngine('js');
    expect(back.engine).toBe('js');
    expect(back.fellBackToJs).toBeFalsy();
  });
});
