/**
 * P0#7: Resolve Narrowband Observe DDC drive from broadband active mark/channel.
 * Mirrors desktop Session::createChannelFromActiveMark → annotationChannelRequest
 * → Channel.{centerFrequencyHz,bandwidthHz,outputSampleRateHz} → channel_processor LO.
 *
 * Web DDC LO convention (ddc.ts): tone at loHz mixes to DC →
 *   loOffsetHz = channelCenterRfHz - sourceCenterFrequencyHz
 * (desktop NCO uses opposite signed delta with matching oscillator direction).
 *
 * Does NOT invent Bluestein / cascaded FirDecimator / Multitaper / Burg.
 * IQ remains sigmf_data_demo via the existing single-stage rational DDC path.
 */

export type ObserveDdcDriveKind = 'channel' | 'mark' | 'demo-annotation';

export type ObserveBroadbandDrive = {
  kind: 'channel' | 'mark';
  /** Channel id or mark/annotation id. */
  id: string;
  /** RF center Hz (absolute). */
  centerFrequencyHz: number;
  /** RF bandwidth Hz (upper - lower). */
  bandwidthHz: number;
  /** Desktop annotationChannelRequest: min(fs, max(4e6, bw * 1.3)). */
  outputSampleRateHz: number;
  /** Optional half-open sample window from mark/channel sourceTime. */
  sampleBegin?: bigint;
  sampleEnd?: bigint;
  sourceMarkId?: string;
  label?: string;
};

export type ResolvedObserveDdcDrive = {
  kind: ObserveDdcDriveKind;
  id: string | null;
  centerFrequencyHz: number | null;
  bandwidthHz: number | null;
  loOffsetHz: number;
  interpolation: number;
  decimation: number;
  outputSampleRateHz: number;
  sampleBegin?: bigint;
  sampleEnd?: bigint;
  label?: string;
  /** Honest UI stamp — never claims Multitaper/Burg. */
  statusStamp: string;
  pipelineLabel: string;
  /** data-nb-ddc-kind */
  ddcKindAttr: 'real-channel' | 'real-marker' | 'real-demo-annotation';
};

export type BroadbandMarkLike = {
  id: string;
  name?: string;
  lowerHz?: number;
  upperHz?: number;
  start?: string;
  end?: string;
  deleted?: boolean;
  activeSegmentId?: string;
  /** Annotation segments — RF may live here when top-level lower/upper absent. */
  segments?: Array<{
    id?: string;
    lowerHz?: number;
    upperHz?: number;
    start?: string;
    end?: string;
  }>;
};

export type BroadbandChannelLike = {
  id: string;
  name?: string;
  sourceMarkId?: string;
  centerFrequencyHz?: number;
  bandwidthHz?: number;
  outputSampleRateHz?: number;
  sourceTime?: { begin?: string; end?: string };
  /** Channel snapshot range (project-io). */
  sourceSnapshot?: {
    range?: {
      time?: { begin?: string; end?: string };
      frequency?: { lowerHz?: number; upperHz?: number };
    };
    boundRange?: {
      time?: { begin?: string; end?: string };
      frequency?: { lowerHz?: number; upperHz?: number };
    };
  } | Record<string, unknown>;
};

/**
 * Desktop annotationChannelRequest output rate:
 *   min(sampleRateHz, max(4e6, bandwidthHz * 1.3))
 */
export function desktopOutputSampleRateHz(
  sampleRateHz: number,
  bandwidthHz: number,
): number {
  if (!(sampleRateHz > 0) || !Number.isFinite(sampleRateHz)) {
    throw new RangeError(`desktopOutputSampleRateHz: bad sampleRateHz ${sampleRateHz}`);
  }
  if (!(bandwidthHz > 0) || !Number.isFinite(bandwidthHz)) {
    throw new RangeError(`desktopOutputSampleRateHz: bad bandwidthHz ${bandwidthHz}`);
  }
  return Math.min(sampleRateHz, Math.max(4e6, bandwidthHz * 1.3));
}

/**
 * Map desktop output rate onto the existing single-stage rational DDC
 * (interpolation/decimation). No cascaded ×2 FirDecimator stages.
 */
export function rationalResampleForOutputRate(
  sampleRateHz: number,
  outputSampleRateHz: number,
): { interpolation: number; decimation: number } {
  if (!(sampleRateHz > 0) || !(outputSampleRateHz > 0)) {
    return { interpolation: 1, decimation: 1 };
  }
  // Prefer decimate-only when out <= fs (typical for narrowband extract).
  if (outputSampleRateHz <= sampleRateHz + 1e-9) {
    const dec = Math.max(1, Math.round(sampleRateHz / outputSampleRateHz));
    return { interpolation: 1, decimation: Math.min(4096, dec) };
  }
  // Rare: output > fs → upsample then keep.
  const interp = Math.max(1, Math.round(outputSampleRateHz / sampleRateHz));
  return { interpolation: Math.min(4096, interp), decimation: 1 };
}

/** Prefer top-level RF; else active/first segment (AnnotationJson shape). */
export function markRfEdges(mark: BroadbandMarkLike): {
  lowerHz: number;
  upperHz: number;
  start?: string;
  end?: string;
} | null {
  if (mark.deleted) return null;
  let lo = mark.lowerHz;
  let hi = mark.upperHz;
  let start = mark.start;
  let end = mark.end;
  const segs = mark.segments ?? [];
  if (
    (lo == null || hi == null || !Number.isFinite(lo) || !Number.isFinite(hi) || !(hi > lo)) &&
    segs.length > 0
  ) {
    const active =
      (mark.activeSegmentId
        ? segs.find((s) => s.id === mark.activeSegmentId)
        : undefined) ?? segs[0];
    if (active) {
      lo = active.lowerHz;
      hi = active.upperHz;
      start = start ?? active.start;
      end = end ?? active.end;
    }
  }
  if (
    lo == null ||
    hi == null ||
    !Number.isFinite(lo) ||
    !Number.isFinite(hi) ||
    !(hi > lo)
  ) {
    return null;
  }
  return { lowerHz: lo, upperHz: hi, start, end };
}

export function markRfCenterBandwidth(mark: BroadbandMarkLike): {
  centerFrequencyHz: number;
  bandwidthHz: number;
} | null {
  const edges = markRfEdges(mark);
  if (!edges) return null;
  return {
    centerFrequencyHz: (edges.lowerHz + edges.upperHz) / 2,
    bandwidthHz: edges.upperHz - edges.lowerHz,
  };
}

function snapshotFreq(ch: BroadbandChannelLike): {
  centerFrequencyHz: number;
  bandwidthHz: number;
  sampleBegin?: bigint;
  sampleEnd?: bigint;
} | null {
  const snap = ch.sourceSnapshot as
    | {
        range?: {
          time?: { begin?: string; end?: string };
          frequency?: { lowerHz?: number; upperHz?: number };
        };
        boundRange?: {
          time?: { begin?: string; end?: string };
          frequency?: { lowerHz?: number; upperHz?: number };
        };
      }
    | undefined;
  const freq =
    snap?.boundRange?.frequency ??
    snap?.range?.frequency ??
    undefined;
  if (
    !freq ||
    !Number.isFinite(freq.lowerHz) ||
    !Number.isFinite(freq.upperHz) ||
    !(freq.upperHz! > freq.lowerHz!)
  ) {
    return null;
  }
  const time = snap?.boundRange?.time ?? snap?.range?.time;
  let sampleBegin: bigint | undefined;
  let sampleEnd: bigint | undefined;
  if (time?.begin != null && time?.end != null) {
    try {
      sampleBegin = BigInt(time.begin);
      sampleEnd = BigInt(time.end);
    } catch {
      sampleBegin = undefined;
      sampleEnd = undefined;
    }
  }
  return {
    centerFrequencyHz: (freq.lowerHz! + freq.upperHz!) / 2,
    bandwidthHz: freq.upperHz! - freq.lowerHz!,
    sampleBegin,
    sampleEnd,
  };
}

export function channelRfCenterBandwidth(ch: BroadbandChannelLike): {
  centerFrequencyHz: number;
  bandwidthHz: number;
  outputSampleRateHz?: number;
  sampleBegin?: bigint;
  sampleEnd?: bigint;
  sourceMarkId?: string;
  label?: string;
} | null {
  let center = ch.centerFrequencyHz;
  let bw = ch.bandwidthHz;
  let sampleBegin: bigint | undefined;
  let sampleEnd: bigint | undefined;

  if (
    center == null ||
    bw == null ||
    !Number.isFinite(center) ||
    !Number.isFinite(bw) ||
    !(bw > 0)
  ) {
    const fromSnap = snapshotFreq(ch);
    if (!fromSnap) return null;
    center = fromSnap.centerFrequencyHz;
    bw = fromSnap.bandwidthHz;
    sampleBegin = fromSnap.sampleBegin;
    sampleEnd = fromSnap.sampleEnd;
  }

  if (ch.sourceTime?.begin != null && ch.sourceTime?.end != null) {
    try {
      sampleBegin = BigInt(ch.sourceTime.begin);
      sampleEnd = BigInt(ch.sourceTime.end);
    } catch {
      /* keep snapshot times */
    }
  }

  return {
    centerFrequencyHz: center!,
    bandwidthHz: bw!,
    outputSampleRateHz:
      ch.outputSampleRateHz != null &&
      Number.isFinite(ch.outputSampleRateHz) &&
      ch.outputSampleRateHz > 0
        ? ch.outputSampleRateHz
        : undefined,
    sampleBegin,
    sampleEnd,
    sourceMarkId: ch.sourceMarkId,
    label: ch.name,
  };
}

function parseSampleIndex(raw: string | undefined): bigint | undefined {
  if (raw == null || raw === '') return undefined;
  try {
    return BigInt(raw);
  } catch {
    return undefined;
  }
}

/**
 * Prefer active channel (desktop Session.activeChannel), else active mark.
 * Returns null when neither yields a finite RF box — caller falls back to
 * demo SigMF annotation (still real DDC, different drive kind).
 */
export function resolveBroadbandDrive(input: {
  sampleRateHz: number;
  activeChannelId?: string | null;
  channels?: BroadbandChannelLike[] | null;
  activeMarkId?: string | null;
  marks?: BroadbandMarkLike[] | null;
}): ObserveBroadbandDrive | null {
  const { sampleRateHz } = input;
  if (!(sampleRateHz > 0)) return null;

  const channels = input.channels ?? [];
  const marks = input.marks ?? [];

  if (input.activeChannelId) {
    const ch = channels.find((c) => c.id === input.activeChannelId);
    if (ch) {
      const rf = channelRfCenterBandwidth(ch);
      if (rf) {
        const outRate =
          rf.outputSampleRateHz ??
          desktopOutputSampleRateHz(sampleRateHz, rf.bandwidthHz);
        return {
          kind: 'channel',
          id: ch.id,
          centerFrequencyHz: rf.centerFrequencyHz,
          bandwidthHz: rf.bandwidthHz,
          outputSampleRateHz: outRate,
          sampleBegin: rf.sampleBegin,
          sampleEnd: rf.sampleEnd,
          sourceMarkId: rf.sourceMarkId,
          label: rf.label ?? ch.id,
        };
      }
    }
  }

  if (input.activeMarkId) {
    const mark = marks.find((m) => m.id === input.activeMarkId);
    if (mark) {
      const edges = markRfEdges(mark);
      if (edges) {
        const bandwidthHz = edges.upperHz - edges.lowerHz;
        return {
          kind: 'mark',
          id: mark.id,
          centerFrequencyHz: (edges.lowerHz + edges.upperHz) / 2,
          bandwidthHz,
          outputSampleRateHz: desktopOutputSampleRateHz(
            sampleRateHz,
            bandwidthHz,
          ),
          sampleBegin: parseSampleIndex(edges.start),
          sampleEnd: parseSampleIndex(edges.end),
          label: mark.name ?? mark.id,
        };
      }
    }
  }

  return null;
}

export function resolveObserveDdcDrive(input: {
  sourceCenterFrequencyHz: number | null | undefined;
  sampleRateHz: number;
  drive: ObserveBroadbandDrive | null;
  /** Fallback LO when no broadband drive (demo annotation path). */
  fallbackLoOffsetHz?: number;
  fallbackInterpolation?: number;
  fallbackDecimation?: number;
}): ResolvedObserveDdcDrive {
  const fs = input.sampleRateHz;
  const srcFc =
    input.sourceCenterFrequencyHz != null &&
    Number.isFinite(input.sourceCenterFrequencyHz)
      ? input.sourceCenterFrequencyHz
      : 0;

  if (input.drive) {
    const d = input.drive;
    const loOffsetHz = d.centerFrequencyHz - srcFc;
    const { interpolation, decimation } = rationalResampleForOutputRate(
      fs,
      d.outputSampleRateHz,
    );
    const kindLabel = d.kind === 'channel' ? '通道' : '标记';
    const statusStamp = `真实 DDC · ${kindLabel} ${d.id}`;
    const pipelineLabel = `sigmf_data_demo → 真实 DDC (${kindLabel} ${d.id}, Fc ${d.centerFrequencyHz.toFixed(0)} Hz, BW ${d.bandwidthHz.toFixed(0)} Hz, LO ${loOffsetHz.toFixed(0)} Hz, R=${interpolation}/${decimation}) · not demod · no Multitaper/Burg`;
    return {
      kind: d.kind,
      id: d.id,
      centerFrequencyHz: d.centerFrequencyHz,
      bandwidthHz: d.bandwidthHz,
      loOffsetHz,
      interpolation,
      decimation,
      outputSampleRateHz: d.outputSampleRateHz,
      sampleBegin: d.sampleBegin,
      sampleEnd: d.sampleEnd,
      label: d.label,
      statusStamp,
      pipelineLabel,
      ddcKindAttr: d.kind === 'channel' ? 'real-channel' : 'real-marker',
    };
  }

  const lo = input.fallbackLoOffsetHz ?? 0;
  const interpolation = input.fallbackInterpolation ?? 1;
  const decimation = input.fallbackDecimation ?? 16;
  return {
    kind: 'demo-annotation',
    id: null,
    centerFrequencyHz: null,
    bandwidthHz: null,
    loOffsetHz: lo,
    interpolation,
    decimation,
    outputSampleRateHz: fs / decimation,
    statusStamp: '真实 DDC · 演示标注（无活动宽带标记/通道）',
    pipelineLabel: `sigmf_data_demo → 真实 DDC (演示标注, LO ${lo.toFixed(0)} Hz, R=${interpolation}/${decimation}) · not demod · no Multitaper/Burg`,
    ddcKindAttr: 'real-demo-annotation',
  };
}

/**
 * Read active broadband drive from window.__wssM06 (M06 session).
 * Safe in SSR / missing hook → null.
 */
export function readBroadbandDriveFromM06(sampleRateHz: number): ObserveBroadbandDrive | null {
  if (typeof window === 'undefined') return null;
  const hook = (
    window as unknown as {
      __wssM06?: {
        getState?: () => {
          activeChannelId?: string;
          activeMarkId?: string;
          activeFileId?: string;
        };
        session?: {
          project?: {
            activeChannelId?: string;
            activeFileId?: string;
            files?: Array<{
              metadata?: { id?: string };
              channels?: BroadbandChannelLike[];
              activeMarkId?: string;
            }>;
          };
          annotations?: { annotations?: BroadbandMarkLike[] };
        };
      };
    }
  ).__wssM06;
  if (!hook?.session) return null;

  const state = hook.getState?.() ?? {};
  const project = hook.session.project;
  const fileId =
    state.activeFileId ??
    project?.activeFileId ??
    project?.files?.[0]?.metadata?.id;
  const file = project?.files?.find((f) => f.metadata?.id === fileId) ?? project?.files?.[0];
  const activeChannelId = state.activeChannelId ?? project?.activeChannelId ?? null;
  const activeMarkId = state.activeMarkId ?? file?.activeMarkId ?? null;
  const marks = hook.session.annotations?.annotations ?? [];

  return resolveBroadbandDrive({
    sampleRateHz,
    activeChannelId,
    channels: file?.channels ?? [],
    activeMarkId,
    marks,
  });
}
