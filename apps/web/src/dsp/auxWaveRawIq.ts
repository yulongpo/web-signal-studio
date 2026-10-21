/**
 * Aux Wave raw-IQ path (Bot-D): chunked SigMF read from sigmf_data_demo only.
 * Display uses desktop-style IqRms overview (RMS magnitude per display bucket)
 * from interleaved float32 IQ — not STFT spectrogram envelope.
 *
 * Default demo dir (Windows laptop):
 *   D:\project\signal_studio_rebuild\resources\sigmf_data_demo
 * Override with VITE_SIGMF_DATA_DEMO_DIR. Never invent synthetic IQ as live DSP.
 */
import {
  openSigmfArrayBuffer,
  type ChunkedReader,
} from '@wss/file-io';

/** Canonical demo capture stem under the demo directory. */
export const SIGMF_DATA_DEMO_STEM = '0000000';

/**
 * Absolute directory containing 0000000.sigmf-meta / .sigmf-data.
 * Configurable; default is the rebuild resources tree (read-only).
 */
export const DEFAULT_SIGMF_DATA_DEMO_DIR =
  'D:\\project\\signal_studio_rebuild\\resources\\sigmf_data_demo';

export function resolveSigmfDataDemoDir(
  override?: string | null,
): string {
  const fromEnv =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof (import.meta.env as { VITE_SIGMF_DATA_DEMO_DIR?: string })
      .VITE_SIGMF_DATA_DEMO_DIR === 'string'
      ? (import.meta.env as { VITE_SIGMF_DATA_DEMO_DIR?: string })
          .VITE_SIGMF_DATA_DEMO_DIR
      : undefined;
  const raw = (override ?? fromEnv ?? DEFAULT_SIGMF_DATA_DEMO_DIR).trim();
  return raw.replace(/[/\\]+$/, '');
}

/** Vite /@fs/ URL for an absolute host path (dev server only). */
export function viteFsUrlFor(absPath: string): string {
  const normalized = absPath.replace(/\\/g, '/');
  const withSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  // Windows drive paths become /D:/... which Vite /@fs accepts.
  return `/@fs${withSlash}`;
}

export type DemoSigmfAnnotation = {
  sampleStart: number;
  sampleCount: number;
  freqLowerHz?: number;
  freqUpperHz?: number;
  label?: string;
};

export type DemoSigmfHandle = {
  reader: ChunkedReader;
  sampleRateHz: number;
  totalSamples: bigint;
  /** Honest source label — never "synthetic" for this disk demo. */
  sourceLabel: string;
  demoDir: string;
  stem: string;
  /** Capture center RF (Hz) from SigMF captures[0], if present. */
  centerFrequencyHz?: number;
  /** Parsed annotations for LO / window defaults (demo only). */
  annotations: DemoSigmfAnnotation[];
};


function parseDemoAnnotations(raw: unknown): DemoSigmfAnnotation[] {
  if (!Array.isArray(raw)) return [];
  const out: DemoSigmfAnnotation[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const sampleStart = Number(rec["core:sample_start"]);
    const sampleCount = Number(rec["core:sample_count"]);
    if (!Number.isFinite(sampleStart) || !Number.isFinite(sampleCount) || sampleCount <= 0) {
      continue;
    }
    const freqLower = Number(rec["core:freq_lower_edge"]);
    const freqUpper = Number(rec["core:freq_upper_edge"]);
    const label = typeof rec["core:label"] === "string" ? rec["core:label"] : undefined;
    out.push({
      sampleStart,
      sampleCount,
      freqLowerHz: Number.isFinite(freqLower) ? freqLower : undefined,
      freqUpperHz: Number.isFinite(freqUpper) ? freqUpper : undefined,
      label,
    });
  }
  return out;
}

let cached: DemoSigmfHandle | null = null;
let loadPromise: Promise<DemoSigmfHandle> | null = null;

export function clearDemoSigmfCache(): void {
  cached = null;
  loadPromise = null;
}

async function loadMetaAndDataFromFs(demoDir: string): Promise<{
  metaText: string;
  data: ArrayBuffer;
}> {
  // Node / vitest: direct filesystem read of the allowed demo tree only.
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const metaPath = path.join(demoDir, `${SIGMF_DATA_DEMO_STEM}.sigmf-meta`);
  const dataPath = path.join(demoDir, `${SIGMF_DATA_DEMO_STEM}.sigmf-data`);
  const metaText = await fs.readFile(metaPath, 'utf8');
  const dataBuf = await fs.readFile(dataPath);
  return {
    metaText,
    data: dataBuf.buffer.slice(
      dataBuf.byteOffset,
      dataBuf.byteOffset + dataBuf.byteLength,
    ),
  };
}

async function loadMetaAndDataFromViteFs(demoDir: string, signal?: AbortSignal): Promise<{
  metaText: string;
  data: ArrayBuffer;
}> {
  const metaUrl = viteFsUrlFor(
    `${demoDir.replace(/\\/g, '/')}/${SIGMF_DATA_DEMO_STEM}.sigmf-meta`,
  );
  const dataUrl = viteFsUrlFor(
    `${demoDir.replace(/\\/g, '/')}/${SIGMF_DATA_DEMO_STEM}.sigmf-data`,
  );
  const metaRes = await fetch(metaUrl, { signal });
  if (!metaRes.ok) {
    throw new Error(
      `sigmf_data_demo meta fetch failed (${metaRes.status}): ${metaUrl}`,
    );
  }
  const dataRes = await fetch(dataUrl, { signal });
  if (!dataRes.ok) {
    throw new Error(
      `sigmf_data_demo data fetch failed (${dataRes.status}): ${dataUrl}`,
    );
  }
  return {
    metaText: await metaRes.text(),
    data: await dataRes.arrayBuffer(),
  };
}

function isNodeFsAvailable(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    typeof process.versions.node === 'string'
  );
}

/**
 * Open (and cache) ChunkedReader for sigmf_data_demo / 0000000.
 * Browser: Vite /@fs/ fetch. Node/vitest: node:fs of the same directory.
 */
export async function ensureDemoSigmfReader(options: {
  demoDir?: string | null;
  signal?: AbortSignal;
} = {}): Promise<DemoSigmfHandle> {
  const demoDir = resolveSigmfDataDemoDir(options.demoDir);
  if (cached && cached.demoDir === demoDir) return cached;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const { metaText, data } = isNodeFsAvailable()
      ? await loadMetaAndDataFromFs(demoDir)
      : await loadMetaAndDataFromViteFs(demoDir, options.signal);

    if (options.signal?.aborted) {
      throw options.signal.reason instanceof Error
        ? options.signal.reason
        : new DOMException('Aborted', 'AbortError');
    }

    const handle = openSigmfArrayBuffer({
      id: `demo-sigmf:${demoDir}/${SIGMF_DATA_DEMO_STEM}`,
      meta: metaText,
      data,
      label: `sigmf_data_demo disk: ${demoDir}\\${SIGMF_DATA_DEMO_STEM}`,
      dataPathStub: `${demoDir}\\${SIGMF_DATA_DEMO_STEM}.sigmf-data`,
    });
    const sampleRateHz = handle.meta.sampleRateHz;
    if (!sampleRateHz || !(sampleRateHz > 0)) {
      throw new Error('sigmf_data_demo meta missing core:sample_rate');
    }
    const prefix = handle.reader.availablePrefix();
    const opened: DemoSigmfHandle = {
      reader: handle.reader,
      sampleRateHz,
      totalSamples: prefix.availableSamples,
      sourceLabel: `sigmf_data_demo:${SIGMF_DATA_DEMO_STEM} (${demoDir})`,
      demoDir,
      stem: SIGMF_DATA_DEMO_STEM,
      centerFrequencyHz: handle.meta.centerFrequencyHz,
      annotations: parseDemoAnnotations(handle.meta.raw.annotations),
    };
    cached = opened;
    return opened;
  })();

  try {
    return await loadPromise;
  } catch (err) {
    loadPromise = null;
    throw err;
  }
}

export type WaveIqSeries = {
  y: Float32Array;
  xDomain: { min: number; max: number; unit: string; label: string };
  sourceLabel: string;
  sampleBegin: bigint;
  sampleEnd: bigint;
  points: number;
};

/**
 * Map linked nav window onto demo sample indices.
 * When spectrogram full span is provided, use proportional mapping so the
 * Wave tracks the nav window even if main IQ duration ≠ demo duration.
 * Otherwise map absolute seconds via demo sampleRateHz.
 */
export function windowToDemoSampleRange(
  win: { min: number; max: number },
  totalSamples: bigint,
  sampleRateHz: number,
  fullTime: { min: number; max: number } | null,
): { begin: bigint; end: bigint } {
  const total = totalSamples < 0n ? 0n : totalSamples;
  if (total <= 1n) return { begin: 0n, end: total };

  let f0: number;
  let f1: number;
  if (fullTime && fullTime.max > fullTime.min) {
    const span = fullTime.max - fullTime.min;
    f0 = (win.min - fullTime.min) / span;
    f1 = (win.max - fullTime.min) / span;
  } else {
    const durationSec = Number(total) / sampleRateHz;
    f0 = durationSec > 0 ? win.min / durationSec : 0;
    f1 = durationSec > 0 ? win.max / durationSec : 1;
  }

  f0 = Math.max(0, Math.min(1, f0));
  f1 = Math.max(0, Math.min(1, f1));
  if (f1 <= f0) {
    const mid = f0;
    f0 = Math.max(0, mid - 1e-9);
    f1 = Math.min(1, mid + 1e-9);
  }

  let begin = BigInt(Math.floor(f0 * Number(total)));
  let end = BigInt(Math.ceil(f1 * Number(total)));
  if (begin < 0n) begin = 0n;
  if (end > total) end = total;
  if (end <= begin) {
    end = begin + 1n <= total ? begin + 1n : total;
  }
  return { begin, end };
}

/**
 * Desktop-style IqRms overview: for each display point, RMS of |z| over the
 * sample bucket (probes capped), from interleaved float32 IQ.
 */
export function iqRmsOverview(
  interleavedIq: Float32Array,
  points: number,
): Float32Array {
  const sampleCount = Math.floor(interleavedIq.length / 2);
  const out = new Float32Array(Math.max(1, points));
  if (sampleCount <= 0) return out;
  const n = out.length;
  for (let x = 0; x < n; x++) {
    const first = Math.floor((x * sampleCount) / n);
    const last = Math.max(first + 1, Math.floor(((x + 1) * sampleCount) / n));
    const bucket = last - first;
    const probeCount = Math.min(bucket, 2048);
    let power = 0;
    for (let p = 0; p < probeCount; p++) {
      const idx =
        probeCount === bucket
          ? first + p
          : first + Math.floor((p * bucket) / probeCount);
      const i = interleavedIq[idx * 2] ?? 0;
      const q = interleavedIq[idx * 2 + 1] ?? 0;
      power += i * i + q * q;
    }
    out[x] = Math.sqrt(power / Math.max(1, probeCount));
  }
  return out;
}

const DEFAULT_MAX_POINTS = 2048;
/** Cap read size so one aux paint stays within DEFAULT_CHUNK_BYTES (4 MiB). */
const MAX_READ_SAMPLES = 256_000;

/**
 * Chunked read of demo SigMF IQ for the linked time window → WaveformChart y.
 */
export async function readAuxWaveRawIq(options: {
  win: { min: number; max: number };
  fullTime?: { min: number; max: number } | null;
  maxPoints?: number;
  demoDir?: string | null;
  signal?: AbortSignal;
}): Promise<WaveIqSeries> {
  const handle = await ensureDemoSigmfReader({
    demoDir: options.demoDir,
    signal: options.signal,
  });
  const { begin, end } = windowToDemoSampleRange(
    options.win,
    handle.totalSamples,
    handle.sampleRateHz,
    options.fullTime ?? null,
  );

  let readEnd = end;
  if (readEnd - begin > BigInt(MAX_READ_SAMPLES)) {
    readEnd = begin + BigInt(MAX_READ_SAMPLES);
  }

  const response = await handle.reader.read({
    begin,
    end: readEnd,
    signal: options.signal,
  });

  const maxPoints = options.maxPoints ?? DEFAULT_MAX_POINTS;
  const y = iqRmsOverview(response.samples, maxPoints);

  return {
    y,
    xDomain: {
      min: options.win.min,
      max: options.win.max,
      unit: 's',
      label: 'Time',
    },
    sourceLabel: handle.sourceLabel,
    sampleBegin: response.begin,
    sampleEnd: response.end,
    points: y.length,
  };
}
