/**
 * Package E — narrowband DDC E2E numerical acceptance hardening.
 * Fixtures are labeled synthetic (WAV / Float32 IQ), not live capture.
 * Does NOT claim ACCEPTANCE_MATRIX M-07 PASS (QA/Bot-G).
 */
import { describe, expect, it, afterEach, beforeAll } from 'vitest';
import {
  buildPcm16LeStereoIqWav,
  openIqWavFromArrayBuffer,
} from '@wss/file-io';
import { fftRadix2, isPowerOfTwo } from './fft.js';
import { ReferenceDdcEngine } from './ddc.js';
import { makeWindow } from './windows.js';
import {
  isWasmFftAvailable,
  loadWasmFftModule,
  WasmReferenceDdcEngine,
} from './wasm/index.js';
import { createDspWorkerClient, type DspWorkerClient } from './worker/dsp-client.js';
import { InProcessAsyncBackend } from './worker/backends.js';

/** SYNTHETIC FIXTURE ONLY — complex tones in memory. */
function synthesizeComplexToneIqF32(options: {
  sampleCount: number;
  sampleRateHz: number;
  tones: Array<{ freqHz: number; amp?: number; phaseRad?: number }>;
}): Float32Array {
  const { sampleCount, sampleRateHz, tones } = options;
  const out = new Float32Array(sampleCount * 2);
  for (let n = 0; n < sampleCount; n++) {
    let re = 0;
    let im = 0;
    for (const t of tones) {
      const a = t.amp ?? 1;
      const ph = (2 * Math.PI * t.freqHz * n) / sampleRateHz + (t.phaseRad ?? 0);
      re += a * Math.cos(ph);
      im += a * Math.sin(ph);
    }
    out[n * 2] = re;
    out[n * 2 + 1] = im;
  }
  return out;
}

function makeFixtureToneWav(options: {
  sampleCount: number;
  sampleRateHz: number;
  tones: Array<{ freqHz: number; amp?: number }>;
}): ArrayBuffer {
  const ampScale = 16000;
  const iq = new Int16Array(options.sampleCount * 2);
  for (let n = 0; n < options.sampleCount; n++) {
    let re = 0;
    let im = 0;
    for (const t of options.tones) {
      const a = (t.amp ?? 1) * ampScale;
      const p = (2 * Math.PI * t.freqHz * n) / options.sampleRateHz;
      re += a * Math.cos(p);
      im += a * Math.sin(p);
    }
    iq[n * 2] = Math.max(-32768, Math.min(32767, Math.round(re)));
    iq[n * 2 + 1] = Math.max(-32768, Math.min(32767, Math.round(im)));
  }
  return buildPcm16LeStereoIqWav({
    sampleRateHz: options.sampleRateHz,
    iqInt16: iq,
  });
}

function powerSpectrumIq(iq: Float32Array, fftSize: number): Float64Array {
  if (!isPowerOfTwo(fftSize)) throw new Error('fftSize pow2');
  const win = makeWindow('hann', fftSize);
  const frame = new Float64Array(fftSize * 2);
  const use = Math.min(iq.length / 2, fftSize);
  const start = Math.max(0, iq.length / 2 - use);
  for (let n = 0; n < use; n++) {
    const src = (start + n) * 2;
    const w = win[n]!;
    frame[n * 2] = iq[src]! * w;
    frame[n * 2 + 1] = iq[src + 1]! * w;
  }
  fftRadix2(frame, false);
  const power = new Float64Array(fftSize);
  for (let k = 0; k < fftSize; k++) {
    const re = frame[k * 2]!;
    const im = frame[k * 2 + 1]!;
    power[k] = re * re + im * im;
  }
  return power;
}

function bandEnergy(power: Float64Array, centerBin: number, halfWidth: number): number {
  let s = 0;
  for (let k = centerBin - halfWidth; k <= centerBin + halfWidth; k++) {
    const idx = ((k % power.length) + power.length) % power.length;
    s += power[idx]!;
  }
  return s;
}

function peakBin(power: Float64Array): number {
  let best = 0;
  let bestVal = -1;
  for (let k = 0; k < power.length; k++) {
    if (power[k]! > bestVal) {
      bestVal = power[k]!;
      best = k;
    }
  }
  return best;
}

function maxAbsDiffF32(a: Float32Array, b: Float32Array): number {
  let m = 0;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i]! - b[i]!);
    if (d > m) m = d;
  }
  return m;
}

/** JS vs WASM DDC sample eps (F32 store + libm); same order as wasm-m07.golden. */
const DDC_SAMPLE_ABS_EPS = 2e-5;

const clients: DspWorkerClient[] = [];

afterEach(async () => {
  while (clients.length) {
    await clients.pop()!.close();
  }
});

describe('Package E: narrowband DDC E2E (Worker + chunked fixture)', () => {
  it('fixture WAV → chunked read → Worker processDdc → tone at LO near DC', async () => {
    const sampleRateHz = 100_000;
    const f0 = 10_000;
    const decimation = 4;
    const sampleCount = 4096;
    const label = 'synthetic fixture: Package E WAV→Worker DDC single-tone';
    const buf = makeFixtureToneWav({
      sampleCount,
      sampleRateHz,
      tones: [{ freqHz: f0 }],
    });
    const { reader } = openIqWavFromArrayBuffer({
      id: 'pkg-e-wav-ddc',
      buffer: buf,
      label,
    });

    // Force multiple chunks (~2 KiB IQ bytes ≈ 512 complex samples)
    const maxBytes = 2048;
    const parts: Float32Array[] = [];
    let cursor = 0n;
    const end = BigInt(sampleCount);
    while (cursor < end) {
      const chunk = await reader.read({ begin: cursor, end, maxBytes });
      if (chunk.end <= chunk.begin) break;
      parts.push(chunk.samples);
      cursor = chunk.end;
    }
    expect(parts.length).toBeGreaterThan(1);
    let total = 0;
    for (const p of parts) total += p.length;
    const iq = new Float32Array(total);
    let o = 0;
    for (const p of parts) {
      iq.set(p, o);
      o += p.length;
    }

    const client = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    clients.push(client);
    const ddc = await client.processDdc(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        loHz: f0,
        sampleRateHz,
        interpolation: 1,
        decimation,
      },
      iq,
    );

    expect(ddc.outputSampleRateHz).toBe(25_000);
    const nOut = Number(ddc.end - ddc.begin);
    expect(nOut).toBe(Math.floor(sampleCount / decimation));
    expect(ddc.samples.length).toBe(nOut * 2);

    const fftSize = 512;
    const power = powerSpectrumIq(ddc.samples, fftSize);
    const totalP = [...power].reduce((a, b) => a + b, 0);
    const dcEnergy = bandEnergy(power, 0, 2) + power[fftSize - 1]! + power[fftSize - 2]!;
    expect(dcEnergy / totalP).toBeGreaterThan(0.8);
    const pb = peakBin(power);
    expect(Math.min(pb, fftSize - pb)).toBeLessThanOrEqual(1);
  });

  it('two-tone Worker DDC: keep near DC, reject image', async () => {
    const sampleRateHz = 100_000;
    const fKeep = 10_000;
    const fReject = 30_000;
    const decimation = 4;
    const sampleCount = 8192;
    const iq = synthesizeComplexToneIqF32({
      sampleCount,
      sampleRateHz,
      tones: [
        { freqHz: fKeep, amp: 1 },
        { freqHz: fReject, amp: 1 },
      ],
    });
    const client = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    clients.push(client);
    const ddc = await client.processDdc(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        loHz: fKeep,
        sampleRateHz,
        interpolation: 1,
        decimation,
      },
      iq,
    );

    const fftSize = 512;
    const power = powerSpectrumIq(ddc.samples, fftSize);
    const totalP = [...power].reduce((a, b) => a + b, 0);
    const dcEnergy = bandEnergy(power, 0, 2) + power[fftSize - 1]! + power[fftSize - 2]!;
    // After mix: reject → 20 kHz; default LPF for M=4 attenuates → most energy near DC
    expect(dcEnergy / totalP).toBeGreaterThan(0.55);
    const pb = peakBin(power);
    expect(Math.min(pb, fftSize - pb)).toBeLessThanOrEqual(2);
  });

  it('cancels mid-DDC via AbortSignal', async () => {
    const sampleRateHz = 100_000;
    const sampleCount = 16384;
    const iq = synthesizeComplexToneIqF32({
      sampleCount,
      sampleRateHz,
      tones: [{ freqHz: 8_000 }],
    });
    const client = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    clients.push(client);
    const ac = new AbortController();
    const pending = client.processDdc(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        loHz: 8_000,
        sampleRateHz,
        interpolation: 1,
        decimation: 4,
        signal: ac.signal,
      },
      iq,
      ac.signal,
    );
    ac.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('Package E: JS ReferenceDdcEngine vs WasmReferenceDdcEngine', () => {
  beforeAll(async () => {
    expect(isWasmFftAvailable()).toBe(true);
    await loadWasmFftModule();
  });

  it('same two-tone input → samples within eps; both peak near DC', async () => {
    const sampleRateHz = 100_000;
    const fKeep = 10_000;
    const fReject = 30_000;
    const decimation = 4;
    const sampleCount = 4096;
    const iq = synthesizeComplexToneIqF32({
      sampleCount,
      sampleRateHz,
      tones: [
        { freqHz: fKeep, amp: 1 },
        { freqHz: fReject, amp: 1 },
      ],
    });
    const req = {
      begin: 0n,
      end: BigInt(sampleCount),
      loHz: fKeep,
      sampleRateHz,
      interpolation: 1,
      decimation,
    };

    const js = await new ReferenceDdcEngine().process(req, iq);
    const wasm = await new WasmReferenceDdcEngine().process(req, iq);

    expect(js.outputSampleRateHz).toBe(wasm.outputSampleRateHz);
    expect(js.outputSampleRateHz).toBe(25_000);
    expect(js.samples.length).toBe(wasm.samples.length);
    expect(maxAbsDiffF32(js.samples, wasm.samples)).toBeLessThanOrEqual(DDC_SAMPLE_ABS_EPS);

    for (const samples of [js.samples, wasm.samples]) {
      const power = powerSpectrumIq(samples, 512);
      const pb = peakBin(power);
      expect(Math.min(pb, 512 - pb)).toBeLessThanOrEqual(2);
    }
  });
});
