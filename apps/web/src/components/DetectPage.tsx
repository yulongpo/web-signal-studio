/**
 * PROVISIONAL — Bot-B detection page (RightRail detect tab).
 * Follows DETECTION_PAGE_CONTRACT.md + REAL_MODEL_INTEGRATION.md.
 * Never invents FFSCN/SCN candidates. Draw only when verifiedForward + real engine
 * (TENSORRT_CUDA / PYTORCH_CUDA / PYTORCH_CPU).
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type {
  LocalComputeCapabilities,
  LocalComputeTaskRecord,
  LocalComputeUiMessage,
} from '@wss/contracts';
import { useUiStore } from '../store/uiStore';
import {
  LocalComputeClient,
  LocalComputeClientError,
  isTerminalStatus,
} from '../localCompute/client';
import {
  canRunDetectWithSource,
  candidatesForDraw,
  gateDisableReason,
  iqSourceGateReason,
  isKnownUiCode,
  pickUiMessageText,
  shouldDrawDetectionCandidates,
  uiMessagesForBanner,
} from '../localCompute/gating';
import {
  getIqFileEpoch,
  getIqFileSession,
  subscribeIqFileSession,
} from '../dsp/iqFileSession';
import { AdaptiveValueEdit } from './AdaptiveValueEdit';
import { formatDetectionPhysicalTimes } from './adaptiveValue';
import { secondsToSampleIndex } from './chartGesture';

const POLL_MS = 500;

type OfflineReason = 'offline' | 'unauthorized' | null;

/** Desktop DetectionCard defaults @ signal_studio_rebuild 17471a6 (domain/detection.h). */
type DetectionCardParams = {
  fftSize: number;
  hopMilliseconds: number;
  modelFrames: number;
  modelHopFrames: number;
  scoreThreshold: number;
  nmsIou: number;
  topK: number;
  bandwidthMarginDb: number;
  sampleEdgeRatio: number;
  smoothMilliseconds: number;
  minOnMilliseconds: number;
  minOffMilliseconds: number;
  coarseSplitGapMilliseconds: number;
  coarseMinBurstMilliseconds: number;
  batchSize: number;
  minHits: number;
  maxMiss: number;
  mergeFrequencyHz: number;
};

const DEFAULT_DETECTION_PARAMS: DetectionCardParams = {
  fftSize: 65536,
  hopMilliseconds: 1,
  modelFrames: 10,
  modelHopFrames: 5,
  scoreThreshold: 0.7,
  nmsIou: 0.3,
  topK: 512,
  bandwidthMarginDb: 6,
  sampleEdgeRatio: 0.6,
  smoothMilliseconds: 1,
  minOnMilliseconds: 5,
  minOffMilliseconds: 10,
  coarseSplitGapMilliseconds: 20,
  coarseMinBurstMilliseconds: 10,
  batchSize: 2,
  minHits: 2,
  maxMiss: 1,
  mergeFrequencyHz: 100000,
};


function UiCodeChip({ code }: { code: string }) {
  const known = isKnownUiCode(code);
  return (
    <span
      className={`detect-code-chip${known ? ' detect-code-chip-known' : ''}`}
      data-testid="detect-ui-code"
      data-code={code}
      data-known={known ? 'true' : 'false'}
    >
      {code}
    </span>
  );
}

function BannerMessages({
  messages,
  fallbackLines,
}: {
  messages: LocalComputeUiMessage[];
  fallbackLines: string[];
}) {
  if (messages.length) {
    return (
      <>
        {messages.map((m, i) => (
          <p key={`${m.code}-${i}`} data-testid="detect-banner-line" data-code={m.code}>
            <UiCodeChip code={m.code} />{' '}
            <span>{pickUiMessageText(m, 'zh')}</span>
          </p>
        ))}
      </>
    );
  }
  return (
    <>
      {fallbackLines.map((line, i) => (
        <p key={i} data-testid="detect-banner-line">
          {line}
        </p>
      ))}
    </>
  );
}


type DetectSegmentOption = {
  id: string;
  annotationId: string;
  start: string;
  end: string;
  label: string;
};

/** List real mark segments for DetectionCard — never invents empty fake rows. */
function listActiveMarkSegments(): DetectSegmentOption[] {
  const hook = typeof window !== 'undefined' ? window.__wssM06 : undefined;
  if (!hook) return [];
  const anns = (hook.session.annotations.annotations ?? []).filter((a) => !a.deleted);
  const snap = hook.getState?.();
  const activeId = snap?.activeMarkId ?? null;
  const focus = (activeId ? anns.find((a) => a.id === activeId) : null) ?? anns[0] ?? null;
  if (!focus) return [];
  const segs = focus.segments ?? [];
  if (segs.length > 0) {
    return segs.map((seg, index) => ({
      id: seg.id,
      annotationId: focus.id,
      start: String(seg.start),
      end: String(seg.end),
      label: `\u6d3b\u52a8\u6bb5 ${index + 1} \u00b7 [${seg.start}, ${seg.end})`,
    }));
  }
  // Compat projection: annotation start/end when segments[] absent (contracts note).
  if (focus.start != null && focus.end != null) {
    const id = focus.activeSegmentId || `${focus.id}:compat`;
    return [
      {
        id,
        annotationId: focus.id,
        start: String(focus.start),
        end: String(focus.end),
        label: `\u6d3b\u52a8\u6bb5 1 \u00b7 [${focus.start}, ${focus.end})`,
      },
    ];
  }
  return [];
}

function availableFileSampleEnd(iq: { reader: { availablePrefix: () => { availableSamples: bigint } } } | null): string | null {
  if (!iq) return null;
  try {
    const n = iq.reader.availablePrefix().availableSamples;
    if (n <= 0n) return null;
    return n.toString();
  } catch {
    return null;
  }
}

export function DetectPage() {
  const token = useUiStore((s) => s.localComputeToken);
  const setToken = useUiStore((s) => s.setLocalComputeToken);
  const baseUrl = useUiStore((s) => s.localComputeBaseUrl);
  const upsertDetectRun = useUiStore((s) => s.upsertDetectRun);
  const setDetectCapabilities = useUiStore((s) => s.setDetectCapabilities);
  const sampleRange = useUiStore((s) => s.detectSampleRange);
  const rangeSource = useUiStore((s) => s.detectSampleRangeSource);
  const setDetectSampleRange = useUiStore((s) => s.setDetectSampleRange);
  const setActiveTool = useUiStore((s) => s.setActiveTool);
  const rangeRef = useRef<HTMLElement>(null);

  const iqEpoch = useSyncExternalStore(
    subscribeIqFileSession,
    getIqFileEpoch,
    getIqFileEpoch,
  );
  const iqSession = getIqFileSession();
  const hasIqSource = iqSession != null;
  // Prefer concrete file name as sourcePath label; never invent a filesystem path.
  const iqSourcePath = iqSession?.fileName ?? iqSession?.sourceLabel ?? null;

  const [caps, setCaps] = useState<LocalComputeCapabilities | null>(null);
  const [offlineReason, setOfflineReason] = useState<OfflineReason>('offline');
  const [bannerFallback, setBannerFallback] = useState<string[]>([
    '未连接本地计算服务（loopback）。',
  ]);
  const [task, setTask] = useState<LocalComputeTaskRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorLine, setErrorLine] = useState<string | null>(null);
  /** Selectable tree-internal .engine only (G26: .pth never selectable). */
  const [selectedEngineId, setSelectedEngineId] = useState<string>('');
  const [spectrumMode, setSpectrumMode] = useState<number>(0);
  const [timeStrategy, setTimeStrategy] = useState<'sample' | 'roi' | 'coarse'>('sample');
  const [splitBursts, setSplitBursts] = useState(false);
  /** Desktop detectionRangeOrigin — visible / available-file / active-segment / custom. */
  const [rangeOrigin, setRangeOrigin] = useState<
    'visible' | 'available-file' | 'active-segment' | 'custom'
  >('visible');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [m06Tick, setM06Tick] = useState(0);
  const navWindowTime = useUiStore((s) => s.navWindowTime);
  const [params, setParams] = useState<DetectionCardParams>(DEFAULT_DETECTION_PARAMS);
  const pollTimer = useRef<number | null>(null);

  const setParam = <K extends keyof DetectionCardParams>(key: K, value: DetectionCardParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const paramsDirty = useMemo(() => {
    return (Object.keys(DEFAULT_DETECTION_PARAMS) as (keyof DetectionCardParams)[]).some(
      (k) => params[k] !== DEFAULT_DETECTION_PARAMS[k],
    );
  }, [params]);


  // Mirror chart/file ROI confirm into DetectionCard rangeOrigin chrome (no auto-run).
  useEffect(() => {
    if (rangeSource === 'roi') setRangeOrigin('custom');
    else if (rangeSource === 'file') setRangeOrigin('available-file');
  }, [rangeSource]);

  const sampleRateHz = iqSession?.sampleRateHz ?? null;
  const physicalTimes = useMemo(
    () =>
      formatDetectionPhysicalTimes({
        sampleRateHz,
        fftSize: params.fftSize,
        hopMilliseconds: params.hopMilliseconds,
        modelFrames: params.modelFrames,
        modelHopFrames: params.modelHopFrames,
      }),
    [sampleRateHz, params.fftSize, params.hopMilliseconds, params.modelFrames, params.modelHopFrames],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      if (window.__wssM06) setM06Tick((t) => t + 1);
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  const segmentOptions = useMemo(() => {
    void m06Tick;
    return listActiveMarkSegments();
  }, [m06Tick]);

  useEffect(() => {
    if (!segmentOptions.length) {
      if (selectedSegmentId) setSelectedSegmentId('');
      return;
    }
    if (!segmentOptions.some((s) => s.id === selectedSegmentId)) {
      setSelectedSegmentId(segmentOptions[0]!.id);
    }
  }, [segmentOptions, selectedSegmentId]);

  const applyVisibleRange = useCallback(() => {
    const fs = sampleRateHz;
    if (fs == null || !(fs > 0)) return false;
    const start = secondsToSampleIndex(navWindowTime.min, fs);
    const endRaw = secondsToSampleIndex(navWindowTime.max, fs);
    if (start == null || endRaw == null) return false;
    let end = endRaw;
    try {
      if (BigInt(end) <= BigInt(start)) end = (BigInt(start) + 1n).toString();
    } catch {
      return false;
    }
    setDetectSampleRange({ start, end }, 'default');
    return true;
  }, [navWindowTime.max, navWindowTime.min, sampleRateHz, setDetectSampleRange]);

  const applyAvailableFileRange = useCallback(() => {
    const end = availableFileSampleEnd(iqSession);
    if (end == null) return false;
    setDetectSampleRange({ start: '0', end }, 'file');
    return true;
  }, [iqSession, setDetectSampleRange]);

  const applyActiveSegmentRange = useCallback(
    (segId: string) => {
      const seg = segmentOptions.find((s) => s.id === segId);
      if (!seg) return false;
      setDetectSampleRange({ start: seg.start, end: seg.end }, 'default');
      return true;
    },
    [segmentOptions, setDetectSampleRange],
  );

  // Visible-region ↔ main-chart navWindow alignment (Qt file->view).
  useEffect(() => {
    if (rangeOrigin !== 'visible') return;
    applyVisibleRange();
  }, [rangeOrigin, applyVisibleRange, navWindowTime.min, navWindowTime.max, sampleRateHz]);

  // available-file ↔ IQ availablePrefix (honest; no invented length).
  useEffect(() => {
    if (rangeOrigin !== 'available-file') return;
    applyAvailableFileRange();
  }, [rangeOrigin, applyAvailableFileRange, iqEpoch]);

  // active-segment ↔ real mark segment range.
  useEffect(() => {
    if (rangeOrigin !== 'active-segment') return;
    if (!selectedSegmentId) return;
    applyActiveSegmentRange(selectedSegmentId);
  }, [rangeOrigin, selectedSegmentId, applyActiveSegmentRange]);



  const makeClient = useCallback(
    () => new LocalComputeClient({ baseUrl, token }),
    [baseUrl, token],
  );

  const stopPoll = useCallback(() => {
    if (pollTimer.current != null) {
      window.clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const applyCapsFailure = useCallback((err: unknown) => {
    setCaps(null);
    setDetectCapabilities(null);
    setTask(null);
    if (err instanceof LocalComputeClientError && err.status === 401) {
      setOfflineReason('unauthorized');
      setBannerFallback(['鉴权失败（401）。请填写正确的 Bearer token。']);
    } else if (err instanceof LocalComputeClientError && err.status === 0) {
      setOfflineReason('offline');
      setBannerFallback(['本地计算服务不可达（offline）。']);
    } else {
      setOfflineReason('offline');
      const msg = err instanceof Error ? err.message : String(err);
      setBannerFallback([`Capabilities 失败：${msg}`]);
    }
  }, []);

  const refreshCapabilities = useCallback(async () => {
    setErrorLine(null);
    try {
      const client = makeClient();
      const next = await client.getCapabilities();
      setCaps(next);
      setDetectCapabilities(next);
      setOfflineReason(null);
      if (!next.detection.uiMessages?.length) {
        setBannerFallback([
          `协议 ${next.protocolVersion} · 服务 ${next.serviceVersion} · FFSCN=${String(next.detection.ffscn)} SCN=${String(next.detection.scn)}`,
        ]);
      } else {
        setBannerFallback([]);
      }
    } catch (err) {
      applyCapsFailure(err);
    }
  }, [applyCapsFailure, makeClient]);

  useEffect(() => {
    void refreshCapabilities();
    return () => stopPoll();
  }, [refreshCapabilities, stopPoll]);

  // Clear detect task when IQ file session drops (never keep stale result).
  useEffect(() => {
    if (hasIqSource) return;
    setTask(null);
    setBusy(false);
    stopPoll();
  }, [iqEpoch, hasIqSource, stopPoll]);

  const online = offlineReason === null;
  const authorized = offlineReason !== 'unauthorized';
  // Prefer capabilities/auth reasons; SOURCE_MISSING only when caps would otherwise allow.
  const ffscnCapsOk = canRunDetectWithSource(
    caps?.detection,
    'ffscn',
    online,
    authorized,
    true,
  );
  const scnCapsOk = canRunDetectWithSource(
    caps?.detection,
    'scn',
    online,
    authorized,
    true,
  );
  const ffscnOk = ffscnCapsOk && hasIqSource;
  const scnOk = scnCapsOk && hasIqSource;
  const iqGate = iqSourceGateReason(hasIqSource, 'zh');
  const ffscnReason = ffscnCapsOk
    ? iqGate
    : gateDisableReason(caps?.detection, 'ffscn', online, authorized, 'zh');
  const scnReason = scnCapsOk
    ? iqGate
    : gateDisableReason(caps?.detection, 'scn', online, authorized, 'zh');

  const bannerMessages = useMemo(
    () => uiMessagesForBanner(caps?.detection, task),
    [caps?.detection, task],
  );

  const pollUntilDone = useCallback(
    async (runId: string) => {
      stopPoll();
      const client = makeClient();
      const tick = async () => {
        try {
          const rec = await client.getTask(runId);
          setTask(rec);
          upsertDetectRun(rec);
          if (isTerminalStatus(rec.status)) {
            setBusy(false);
            // Hard rule: never draw invented candidates from result when blocked/stub.
            return;
          }
          pollTimer.current = window.setTimeout(() => {
            void tick();
          }, POLL_MS);
        } catch (err) {
          setBusy(false);
          applyCapsFailure(err);
        }
      };
      await tick();
    },
    [applyCapsFailure, makeClient, stopPoll, upsertDetectRun],
  );

  const runDetect = async (kind: 'ffscn.detect' | 'scn.detect') => {
    if (busy) return;
    setErrorLine(null);
    setTask(null);
    setBusy(true);
    const client = makeClient();
    try {
      const { runId } = await client.createTask({
        kind,
        params: {
          modelId: selectedEngine?.id || selectedEngineId || undefined,
          enginePath: selectedEngine?.path ?? undefined,
          spectrumMode,
          timeStrategy,
          splitBursts,
          rangeOrigin,
          // Full DetectionCard grid (desktop objectNames) — TRT honors score/nms/topK/fft/hop/frames when present.
          fftSize: params.fftSize,
          hopMilliseconds: params.hopMilliseconds,
          hopSeconds: params.hopMilliseconds / 1000,
          modelFrames: params.modelFrames,
          modelHopFrames: params.modelHopFrames,
          scoreThreshold: params.scoreThreshold,
          nmsIou: params.nmsIou,
          topK: params.topK,
          bandwidthMarginDb: params.bandwidthMarginDb,
          sampleEdgeRatio: params.sampleEdgeRatio,
          smoothMilliseconds: params.smoothMilliseconds,
          minOnMilliseconds: params.minOnMilliseconds,
          minOffMilliseconds: params.minOffMilliseconds,
          coarseSplitGapMilliseconds: params.coarseSplitGapMilliseconds,
          coarseMinBurstMilliseconds: params.coarseMinBurstMilliseconds,
          batchSize: params.batchSize,
          minHits: params.minHits,
          maxMiss: params.maxMiss,
          mergeFrequencyHz: params.mergeFrequencyHz,
        },
        // Real opened IQ label/file name only — never invent a path or candidates.
        sourcePath: iqSourcePath,
        sampleRange: {
          start: String(sampleRange.start),
          end: String(sampleRange.end),
        },
      });
      await pollUntilDone(runId);
    } catch (err) {
      setBusy(false);
      if (err instanceof LocalComputeClientError && (err.status === 401 || err.status === 0)) {
        applyCapsFailure(err);
      } else {
        setErrorLine(err instanceof Error ? err.message : String(err));
      }
    }
  };

  const cancelRun = async () => {
    const runId = task?.runId;
    if (!runId) return;
    const client = makeClient();
    try {
      // Exact runId cancel is terminal (desktop: cancel wins; frozen display).
      await client.cancelTask(runId);
      stopPoll();
      setBusy(false);
      // Re-fetch full record so statusHistory / result=null stay honest.
      const rec = await client.getTask(runId);
      const next = {
        ...rec,
        // Hard rule: cancelled never keeps draw-able candidates.
        result: rec.status === 'cancelled' ? null : rec.result,
      };
      setTask(next);
      upsertDetectRun(next);
    } catch (err) {
      setErrorLine(err instanceof Error ? err.message : String(err));
    }
  };

  const canCancel =
    !!task?.runId &&
    (busy || task.status === 'queued' || task.status === 'running');


  const engineOptions = useMemo(() => {
    const models = caps?.models ?? [];
    return models
      .map((m) => {
        const path = m.path ?? '';
        const isEngine =
          path.toLowerCase().endsWith('.engine') ||
          m.id.toLowerCase().includes('.engine');
        const isPth = /\.(pth|pt)$/i.test(path) || /\.(pth|pt)$/i.test(m.id);
        const family = /^scn[:/]/i.test(m.id) || /scn/i.test(path) ? 'scn' : 'ffscn';
        return { ...m, isEngine, isPth, family };
      })
      .filter((m) => m.isEngine && m.present && !m.isPth);
  }, [caps?.models]);

  useEffect(() => {
    if (!engineOptions.length) {
      if (selectedEngineId) setSelectedEngineId('');
      return;
    }
    if (!selectedEngineId || !engineOptions.some((m) => m.id === selectedEngineId)) {
      setSelectedEngineId(engineOptions[0].id);
    }
  }, [engineOptions, selectedEngineId]);

  const selectedEngine = engineOptions.find((m) => m.id === selectedEngineId) ?? null;

  const phaseIndex = (() => {
    if (!task) return -1;
    if (task.status === 'queued') return 0;
    if (task.status === 'running') {
      const p = typeof task.progress === 'number' ? task.progress : 0;
      if (p < 0.25) return 1;
      if (p < 0.65) return 2;
      if (p < 0.95) return 3;
      return 3;
    }
    if (task.status === 'succeeded' || task.status === 'BLOCKED' || task.status === 'failed' || task.status === 'cancelled') {
      return 4;
    }
    return -1;
  })();

  const phaseNames = ['排队', '谱帧', '推理 / 关联', '精修 / 发布', '完成'] as const;

  const preflightIssue = (() => {
    if (!online) return '本地计算服务离线';
    if (!authorized) return '鉴权失败';
    if (!hasIqSource) return '未打开 IQ（仅 resources\\sigmf_data_demo）';
    if (!selectedEngine) return '无可选树内 .engine（或缺模型）';
    if (!caps?.detection.ffscn && !caps?.detection.scn) return '检测族未就绪（诚实 BLOCKED）';
    return '';
  })();

  const statusLine = (() => {
    if (!task) return 'idle';
    const progress =
      typeof task.progress === 'number' ? ` ${Math.round(task.progress * 100)}%` : '';
    const msg = task.messageZh || task.message || '';
    return `${task.status}${progress}${msg ? ` — ${msg}` : ''}`;
  })();

  const realRuntimeMsg =
    caps?.detection.uiMessages?.find((message) => message.code === 'REAL_RUNTIME') ?? null;

  useEffect(() => {
    if (rangeSource !== 'roi') return;
    rangeRef.current?.focus();
  }, [rangeSource, sampleRange.start, sampleRange.end]);

  const runtime = caps?.runtime ?? null;
  const drawOk = shouldDrawDetectionCandidates(task, runtime);
  const drawCandidates = candidatesForDraw(task, runtime);

  return (
    <div className="detect-page" data-testid="detect-page">
      <div
        className="detect-banner"
        data-testid="detect-capabilities-banner"
        data-offline={offlineReason ?? 'online'}
      >
        <BannerMessages messages={bannerMessages} fallbackLines={bannerFallback} />
        {task?.status === 'BLOCKED' && task.messageZh ? (
          <p data-testid="detect-blocked-message">{task.messageZh}</p>
        ) : null}
        {task?.status === 'cancelled' ? (
          <p data-testid="detect-cancelled-message" data-frozen="true">
            {task.messageZh || task.message || '已取消 · 冻结显示，不绘制候选'}
          </p>
        ) : null}
      </div>

      {(caps?.gpu?.uiCode || caps?.runtime) && (
        <div className="detect-debug-chips" data-testid="detect-debug-chips">
          {caps?.gpu?.uiCode ? (
            <span data-testid="detect-gpu-uicode" data-code={caps.gpu.uiCode}>
              gpu:{caps.gpu.uiCode}
            </span>
          ) : null}
          {caps?.runtime?.engine ? (
            <span data-testid="detect-runtime-engine" data-engine={caps.runtime.engine}>
              engine:{caps.runtime.engine}
            </span>
          ) : null}
          {caps?.runtime && 'tensorrtVerified' in caps.runtime ? (
            <span
              data-testid="detect-tensorrt-verified"
              data-tensorrt-verified={String(caps.runtime.tensorrtVerified)}
            >
              trt:{String(caps.runtime.tensorrtVerified)}
            </span>
          ) : null}
          {caps?.runtime && 'canInventResults' in caps.runtime ? (
            <span
              data-testid="detect-can-invent"
              data-can-invent={String(caps.runtime.canInventResults)}
            >
              invent:{String(caps.runtime.canInventResults)}
            </span>
          ) : null}
          {caps?.runtime && 'ffscnPresent' in caps.runtime ? (
            <span
              data-testid="detect-ffscn-present"
              data-present={String(caps.runtime.ffscnPresent)}
              data-ready={String(caps.runtime.ffscnReady)}
            >
              ffscn:{caps.runtime.ffscnPresent ? 'present' : 'absent'}
              {caps.runtime.ffscnReady ? '/ready' : '/not-ready'}
            </span>
          ) : null}
          {caps?.runtime && 'scnPresent' in caps.runtime ? (
            <span
              data-testid="detect-scn-present"
              data-present={String(caps.runtime.scnPresent)}
              data-ready={String(caps.runtime.scnReady)}
            >
              scn:{caps.runtime.scnPresent ? 'present' : 'absent'}
              {caps.runtime.scnReady ? '/ready' : '/not-ready'}
            </span>
          ) : null}
          {caps?.runtime?.modelSearchRoots?.length ? (
            <span
              data-testid="detect-model-roots"
              data-count={String(caps.runtime.modelSearchRoots.length)}
              title={caps.runtime.modelSearchRoots.join('\n')}
            >
              roots:{caps.runtime.modelSearchRoots.length}
            </span>
          ) : null}
        </div>
      )}

      <section
        className="detection-card"
        data-testid="detection-card"
        data-object-name="detectionCard"
      >
        <header className="detection-card-header">
          <strong>DetectionCard</strong>
          <span className="muted">对照桌面 ui/detection/detection_card @ 17471a6</span>
        </header>

        <div className="detection-profile-row" data-testid="detection-profile-row">
          <label className="detect-field" data-testid="detection-model-field">
            <span>模型 / .engine</span>
            <select
              data-testid="detection-engine-select"
              data-object-name="detectionModel"
              value={selectedEngineId}
              disabled={!engineOptions.length || busy}
              onChange={(e) => setSelectedEngineId(e.target.value)}
            >
              {!engineOptions.length ? (
                <option value="">无可选 .engine（保持 BLOCKED）</option>
              ) : (
                engineOptions.map((m) => (
                  <option key={m.id} value={m.id} data-family={m.family}>
                    {m.family.toUpperCase()} · {m.id}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="detect-field" data-testid="detection-spectrum-field">
            <span>谱样式</span>
            <select
              data-testid="detection-spectrum-mode"
              data-object-name="detectionSpectrumMode"
              value={spectrumMode}
              disabled={busy}
              onChange={(e) => setSpectrumMode(Number(e.target.value))}
            >
              <option value={0}>模型默认</option>
              <option value={1}>瞬时谱（窗末帧）</option>
              <option value={2}>平均谱</option>
              <option value={3}>最大谱</option>
              <option value={4}>最小谱</option>
            </select>
          </label>
        </div>

        <div
          className="detection-strategy-row"
          data-testid="detection-time-strategy"
          data-object-name="detectionTimeStrategy"
          data-strategy={timeStrategy}
        >
          <span className="detection-strategy-label">时间策略</span>
          {(
            [
              ['sample', '采样区间', 'detectionStrategySample'],
              ['roi', '时频窗口', 'detectionStrategyRoi'],
              ['coarse', '粗检测', 'detectionStrategyCoarse'],
            ] as const
          ).map(([id, label, obj]) => (
            <button
              key={id}
              type="button"
              className={timeStrategy === id ? 'strategy-active' : ''}
              data-testid={`detection-strategy-${id}`}
              data-object-name={obj}
              data-checked={timeStrategy === id ? 'true' : 'false'}
              disabled={busy}
              onClick={() => setTimeStrategy(id)}
            >
              {label}
            </button>
          ))}
          <label className="detection-split-bursts" data-testid="detection-split-bursts">
            <input
              type="checkbox"
              data-object-name="detectionSplitBursts"
              checked={splitBursts}
              disabled={busy}
              onChange={(e) => setSplitBursts(e.target.checked)}
            />
            拆分突发
          </label>
        </div>


        <div
          className="detection-param-grid"
          data-testid="detection-param-grid"
          data-object-name="detectionParameterGrid"
          data-strategy={timeStrategy}
          data-split={splitBursts ? 'true' : 'false'}
        >
          <div className="detection-param-section" data-testid="detection-timing-section" data-object-name="detectionTimingParameters">
            <strong>谱帧 / 时序</strong>
            <div className="detection-param-row">
              <label className="detect-field" data-testid="detection-fft-size-field">
                <span>FFT N</span>
                <input
                  type="number"
                  data-testid="detection-fft-size"
                  data-object-name="detectionFftSize"
                  min={32}
                  max={262144}
                  step={1}
                  value={params.fftSize}
                  disabled={busy}
                  onChange={(e) => setParam('fftSize', Math.max(32, Number(e.target.value) || 32))}
                />
              </label>
              <label className="detect-field" data-testid="detection-hop-ms-field">
                <span>谱步长 / ms</span>
                <AdaptiveValueEdit
                  kind="Scalar"
                  data-testid="detection-hop-milliseconds"
                  data-object-name="detectionHopMilliseconds"
                  value={params.hopMilliseconds}
                  disabled={busy}
                  title="数值（桌面 AdaptiveValueEdit Scalar）；Enter/Tab 提交，Esc 撤销"
                  onCommit={(v) => setParam('hopMilliseconds', Math.max(0.001, v))}
                />
              </label>
            </div>
            <div className="detection-param-row">
              <label className="detect-field" data-testid="detection-model-frames-field">
                <span>模型帧数</span>
                <input
                  type="number"
                  data-testid="detection-model-frames"
                  data-object-name="detectionModelFrames"
                  min={1}
                  max={256}
                  value={params.modelFrames}
                  disabled={busy}
                  onChange={(e) => setParam('modelFrames', Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
              <label className="detect-field" data-testid="detection-model-hop-frames-field">
                <span>滑动帧数</span>
                <input
                  type="number"
                  data-testid="detection-model-hop-frames"
                  data-object-name="detectionModelHopFrames"
                  min={1}
                  max={256}
                  value={params.modelHopFrames}
                  disabled={busy}
                  onChange={(e) => setParam('modelHopFrames', Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
            </div>
            <p
              className="muted detection-physical-times"
              data-testid="detection-physical-times"
              data-object-name="detectionPhysicalTimes"
              data-has-fs={physicalTimes.hasFs ? 'true' : 'false'}
              title={physicalTimes.details}
            >
              {physicalTimes.summary}
            </p>
            <details className="detection-calculation-details" data-testid="detection-calculation-details" data-object-name="detectionCalculationDetails">
              <summary>计算详情（Fs 说明）</summary>
              <pre
                className="muted"
                data-testid="detection-calculation-details-text"
                data-object-name="detectionCalculationDetailsText"
              >
                {physicalTimes.details}
              </pre>
            </details>
          </div>

          <div className="detection-param-section" data-testid="detection-threshold-section" data-object-name="detectionThresholdParameters">
            <strong>置信阈值</strong>
            <label className="detect-field" data-testid="detection-score-threshold-field">
              <span>置信阈值（score threshold）</span>
              <AdaptiveValueEdit
                  kind="Scalar"
                  data-testid="detection-score-threshold"
                  data-object-name="detectionScoreThreshold"
                  value={params.scoreThreshold}
                  disabled={busy}
                  title="数值；Enter/Tab 提交，Esc 撤销"
                  onCommit={(v) => setParam('scoreThreshold', Math.min(1, Math.max(0, v)))}
                />
            </label>
          </div>

          <div className="detection-param-section" data-testid="detection-branch-section" data-object-name="detectionBranchParameters">
            <strong>分支 / 后处理</strong>
            <div className="detection-param-row">
              <label className="detect-field" data-testid="detection-nms-iou-field">
                <span>重叠抑制（NMS IoU）</span>
                <AdaptiveValueEdit
                  kind="Scalar"
                  data-testid="detection-nms-iou"
                  data-object-name="detectionNmsIou"
                  value={params.nmsIou}
                  disabled={busy}
                  title="数值；Enter/Tab 提交，Esc 撤销"
                  onCommit={(v) => setParam('nmsIou', Math.min(1, Math.max(0, v)))}
                />
              </label>
              <label className="detect-field" data-testid="detection-topk-field">
                <span>候选上限</span>
                <input
                  type="number"
                  data-testid="detection-topk"
                  data-object-name="detectionTopK"
                  min={1}
                  max={10000}
                  value={params.topK}
                  disabled={busy}
                  onChange={(e) => setParam('topK', Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
            </div>
            <div className="detection-param-row" data-testid="detection-margin-fields" data-enabled={timeStrategy !== 'coarse' ? 'true' : 'false'}>
              <label className="detect-field" data-testid="detection-bandwidth-margin-field">
                <span>噪底裕量 / dB</span>
                <AdaptiveValueEdit
                  kind="Scalar"
                  data-testid="detection-bandwidth-margin-db"
                  data-object-name="detectionBandwidthMarginDb"
                  value={params.bandwidthMarginDb}
                  disabled={busy || timeStrategy === 'coarse'}
                  title="数值；Enter/Tab 提交，Esc 撤销"
                  onCommit={(v) => setParam('bandwidthMarginDb', Math.max(0, v))}
                />
              </label>
            </div>
            <div className="detection-param-row" data-testid="detection-fine-fields" data-enabled={timeStrategy !== 'coarse' ? 'true' : 'false'}>
              <label className="detect-field">
                <span>边缘比例</span>
                <AdaptiveValueEdit
                  kind="Scalar"
                  data-testid="detection-sample-edge-ratio"
                  data-object-name="detectionSampleEdgeRatio"
                  value={params.sampleEdgeRatio}
                  disabled={busy || timeStrategy === 'coarse'}
                  title="数值；Enter/Tab 提交，Esc 撤销"
                  onCommit={(v) => setParam('sampleEdgeRatio', Math.min(1, Math.max(0, v)))}
                />
              </label>
              <label className="detect-field">
                <span>平滑 / ms</span>
                <AdaptiveValueEdit
                  kind="Scalar"
                  data-testid="detection-smooth-milliseconds"
                  data-object-name="detectionSmoothMilliseconds"
                  value={params.smoothMilliseconds}
                  disabled={busy || timeStrategy === 'coarse'}
                  title="数值；Enter/Tab 提交，Esc 撤销"
                  onCommit={(v) => setParam('smoothMilliseconds', Math.max(0, v))}
                />
              </label>
            </div>
            <div className="detection-param-row" data-testid="detection-fine-split-fields" data-enabled={timeStrategy !== 'coarse' && splitBursts ? 'true' : 'false'}>
              <label className="detect-field">
                <span>min on / ms</span>
                <AdaptiveValueEdit
                  kind="Scalar"
                  data-testid="detection-min-on-milliseconds"
                  data-object-name="detectionMinOnMilliseconds"
                  value={params.minOnMilliseconds}
                  disabled={busy || timeStrategy === 'coarse' || !splitBursts}
                  title="数值；Enter/Tab 提交，Esc 撤销"
                  onCommit={(v) => setParam('minOnMilliseconds', Math.max(0, v))}
                />
              </label>
              <label className="detect-field">
                <span>min off / ms</span>
                <AdaptiveValueEdit
                  kind="Scalar"
                  data-testid="detection-min-off-milliseconds"
                  data-object-name="detectionMinOffMilliseconds"
                  value={params.minOffMilliseconds}
                  disabled={busy || timeStrategy === 'coarse' || !splitBursts}
                  title="数值；Enter/Tab 提交，Esc 撤销"
                  onCommit={(v) => setParam('minOffMilliseconds', Math.max(0, v))}
                />
              </label>
            </div>
            <div className="detection-param-row" data-testid="detection-coarse-split-fields" data-enabled={timeStrategy === 'coarse' && splitBursts ? 'true' : 'false'}>
              <label className="detect-field">
                <span>粗分段间隔 / ms</span>
                <AdaptiveValueEdit
                  kind="Scalar"
                  data-testid="detection-coarse-split-gap-milliseconds"
                  data-object-name="detectionCoarseSplitGapMilliseconds"
                  value={params.coarseSplitGapMilliseconds}
                  disabled={busy || timeStrategy !== 'coarse' || !splitBursts}
                  title="数值；Enter/Tab 提交，Esc 撤销"
                  onCommit={(v) => setParam('coarseSplitGapMilliseconds', Math.max(0, v))}
                />
              </label>
              <label className="detect-field">
                <span>最短粗事件 / ms</span>
                <AdaptiveValueEdit
                  kind="Scalar"
                  data-testid="detection-coarse-min-burst-milliseconds"
                  data-object-name="detectionCoarseMinBurstMilliseconds"
                  value={params.coarseMinBurstMilliseconds}
                  disabled={busy || timeStrategy !== 'coarse' || !splitBursts}
                  title="数值；Enter/Tab 提交，Esc 撤销"
                  onCommit={(v) => setParam('coarseMinBurstMilliseconds', Math.max(0, v))}
                />
              </label>
            </div>
            <p className="muted" data-testid="detection-branch-help" data-object-name="detectionBranchHelp">
              细策略显示边缘/平滑/min on·off；粗策略+拆分显示粗分段字段。桌面同逻辑 enable。
            </p>
          </div>

          <details className="detection-param-section detection-advanced" data-testid="detection-advanced-section" data-object-name="detectionAdvancedParameters">
            <summary>高级（batch / tracker / merge）</summary>
            <div className="detection-param-row">
              <label className="detect-field">
                <span>batch</span>
                <input
                  type="number"
                  data-testid="detection-batch-size"
                  data-object-name="detectionBatchSize"
                  min={1}
                  max={2}
                  value={params.batchSize}
                  disabled={busy}
                  onChange={(e) => setParam('batchSize', Math.min(2, Math.max(1, Number(e.target.value) || 1)))}
                />
              </label>
              <label className="detect-field">
                <span>minHits</span>
                <input
                  type="number"
                  data-testid="detection-min-hits"
                  data-object-name="detectionMinHits"
                  min={1}
                  max={10000}
                  value={params.minHits}
                  disabled={busy}
                  onChange={(e) => setParam('minHits', Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
              <label className="detect-field">
                <span>maxMiss</span>
                <input
                  type="number"
                  data-testid="detection-max-miss"
                  data-object-name="detectionMaxMiss"
                  min={0}
                  max={10000}
                  value={params.maxMiss}
                  disabled={busy}
                  onChange={(e) => setParam('maxMiss', Math.max(0, Number(e.target.value) || 0))}
                />
              </label>
              <label className="detect-field">
                <span>merge / Hz</span>
                <AdaptiveValueEdit
                  kind="Frequency"
                  data-testid="detection-merge-frequency-hz"
                  data-object-name="detectionMergeFrequencyHz"
                  value={params.mergeFrequencyHz}
                  disabled={busy}
                  title="Hz、kHz、MHz、GHz；无单位=Hz。Enter/Tab 提交，Esc 撤销"
                  onCommit={(v) => setParam('mergeFrequencyHz', Math.max(0, v))}
                />
              </label>
            </div>
          </details>
        </div>

        <section
          className="detect-engine-inventory"
          data-testid="detect-engine-inventory"
          data-model-count={String(caps?.models?.length ?? 0)}
          data-selectable-count={String(engineOptions.length)}
        >
          <strong>检测模型清单（树内 .engine 可选）</strong>
          {!caps?.models?.length ? (
            <p className="muted" data-testid="detect-engine-empty">
              capabilities 尚未返回 models，或未发现权重。缺 engine 时保持 BLOCKED（禁假）。
            </p>
          ) : (
            <ul data-testid="detect-engine-list">
              {caps.models.map((m) => {
                const path = m.path ?? '';
                const isEngine =
                  path.toLowerCase().endsWith('.engine') ||
                  m.id.toLowerCase().includes('.engine');
                const isPth = /\.(pth|pt)$/i.test(path) || /\.(pth|pt)$/i.test(m.id);
                const selectable = isEngine && m.present && !isPth;
                return (
                  <li
                    key={m.id}
                    data-testid="detect-engine-item"
                    data-model-id={m.id}
                    data-present={m.present ? 'true' : 'false'}
                    data-engine={isEngine ? 'true' : 'false'}
                    data-pth={isPth ? 'true' : 'false'}
                    data-blocked-pth={isPth ? 'true' : 'false'}
                    data-selectable={selectable ? 'true' : 'false'}
                    data-selected={selectedEngineId === m.id ? 'true' : 'false'}
                    title={path || m.id}
                  >
                    <button
                      type="button"
                      className="detect-engine-pick"
                      disabled={!selectable || busy}
                      data-testid="detect-engine-pick"
                      onClick={() => selectable && setSelectedEngineId(m.id)}
                    >
                      <code>{m.id}</code>
                    </button>
                    {m.present ? ' · present' : ' · absent'}
                    {isEngine ? ' · .engine' : ''}
                    {isPth ? ' · .pth 不可选(G26)' : ''}
                    {selectable ? ' · 可选' : ''}
                    {selectedEngineId === m.id ? ' · 已选' : ''}
                    {m.notes ? ` · ${m.notes}` : ''}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="muted">
            仅树内 rebuild detection-models 的 .engine 可选；.pth 永不入选。IQ 仅
            resources\\sigmf_data_demo。窄带识别保持 BLOCKED。
          </p>
        </section>

        <p
          className="detection-draft-note"
          data-testid="detection-draft-note"
          data-object-name="detectionParameterDraftNote"
          data-visible={
            selectedEngineId || spectrumMode !== 0 || timeStrategy !== 'sample' || splitBursts || paramsDirty
              ? 'true'
              : 'false'
          }
        >
          草稿仅用于下一次任务 · Enter/点击运行提交 · 刷新保留草稿
        </p>
        <p
          className="detection-preflight"
          data-testid="detection-preflight"
          data-object-name="detectionPreflight"
          data-preflight-ok={preflightIssue ? 'false' : 'true'}
        >
          {preflightIssue
            ? `预检：${preflightIssue}`
            : `预检通过 · engine=${selectedEngine?.id ?? 'n/a'} · strategy=${timeStrategy} · score=${params.scoreThreshold} · hopMs=${params.hopMilliseconds}`}
        </p>
        <p
          className="detection-run-summary"
          data-testid="detection-run-summary"
          data-object-name="detectionRunSummary"
        >
          {task
            ? `运行 ${task.runId.slice(0, 8)}… · ${task.status} · ${Math.round((task.progress || 0) * 100)}%`
            : '无未完成运行 · 当前参数用于下一次'}
        </p>
        <div
          className="detection-phase-bar"
          data-testid="detection-phase-progress"
          data-object-name="detectionPhaseProgress"
          data-completed-stage={String(phaseIndex)}
          hidden={phaseIndex < 0}
        >
          {phaseNames.map((name, index) => (
            <span
              key={name}
              className="detection-phase-step"
              data-testid="detection-phase-step"
              data-active={index <= phaseIndex ? 'true' : 'false'}
              title={name}
            />
          ))}
        </div>
      </section>

      <label className="detect-field">
        <span>Bearer token</span>
        <input
          type="password"
          data-testid="detect-token-input"
          value={token}
          autoComplete="off"
          placeholder="VITE_LOCAL_COMPUTE_TOKEN / session"
          onChange={(e) => setToken(e.target.value)}
        />
      </label>

      <div className="detect-actions">
        <button
          type="button"
          data-testid="detect-refresh-caps"
          className="btn-ghost"
          onClick={() => void refreshCapabilities()}
        >
          刷新能力
        </button>
        <button
          type="button"
          data-testid="detect-btn-ffscn"
          disabled={!ffscnOk || busy}
          title={ffscnReason?.text}
          aria-description={ffscnReason?.text}
          onClick={() => void runDetect('ffscn.detect')}
        >
          FFSCN 检测
        </button>
        <button
          type="button"
          data-testid="detect-btn-scn"
          disabled={!scnOk || busy}
          title={scnReason?.text}
          aria-description={scnReason?.text}
          onClick={() => void runDetect('scn.detect')}
        >
          SCN 检测
        </button>
        <button
          type="button"
          data-testid="detect-btn-cancel"
          disabled={!canCancel}
          title={
            canCancel
              ? `取消运行 ${task?.runId ?? ''}`
              : '无可取消的运行中任务'
          }
          onClick={() => void cancelRun()}
        >
          取消
        </button>
      </div>

      {!ffscnOk && ffscnReason ? (
        <p className="detect-gate-reason" data-testid="detect-gate-reason-ffscn">
          {ffscnReason.code ? <UiCodeChip code={ffscnReason.code} /> : null}{' '}
          <span>FFSCN：{ffscnReason.text}</span>
        </p>
      ) : null}
      {!scnOk && scnReason ? (
        <p className="detect-gate-reason" data-testid="detect-gate-reason-scn">
          {scnReason.code ? <UiCodeChip code={scnReason.code} /> : null}{' '}
          <span>SCN：{scnReason.text}</span>
        </p>
      ) : null}

            <p
        className="detect-iq-source muted"
        data-testid="detect-iq-source"
        data-has-iq={hasIqSource ? 'true' : 'false'}
      >
        IQ source:{' '}
        {hasIqSource && iqSourcePath
          ? iqSourcePath
          : '（未打开 — 检测入口已门控，仍可刷新 capabilities）'}
      </p>
      {realRuntimeMsg ? (
        <p
          className="detect-real-runtime"
          data-testid="detect-real-runtime"
          data-code="REAL_RUNTIME"
          data-engine={caps?.runtime?.engine ?? ''}
          data-tensorrt-verified={String(caps?.runtime?.tensorrtVerified ?? false)}
          data-can-invent={String(caps?.runtime?.canInventResults ?? false)}
        >
          <UiCodeChip code="REAL_RUNTIME" />{' '}
          <span>{pickUiMessageText(realRuntimeMsg, 'zh')}</span>
          {caps?.runtime?.engine ? (
            <span className="muted"> · engine:{caps.runtime.engine}</span>
          ) : null}
        </p>
      ) : null}

      <section
        ref={rangeRef}
        className="detect-range-card"
        data-testid="detect-sample-range"
        data-start={sampleRange.start}
        data-end={sampleRange.end}
        data-range-source={rangeSource}
        data-range-origin={rangeOrigin}
        tabIndex={-1}
      >
        <strong>检测范围</strong>
        <label className="detect-field" data-testid="detection-range-origin-field">
          <span>范围来源</span>
          <select
            data-testid="detection-range-origin"
            data-object-name="detectionRangeOrigin"
            value={rangeOrigin}
            disabled={busy}
            onChange={(e) => {
              const next = e.target.value as typeof rangeOrigin;
              setRangeOrigin(next);
              if (next === 'available-file') applyAvailableFileRange();
              if (next === 'visible') applyVisibleRange();
              if (next === 'active-segment' && selectedSegmentId) {
                applyActiveSegmentRange(selectedSegmentId);
              }
              // custom waits for chart ROI confirm — do not invent a range.
            }}
          >
            <option value="visible">当前可见区域</option>
            <option value="available-file">全可用文件</option>
            <option value="active-segment">活动标记的单段</option>
            <option value="custom">自定义 ROI</option>
          </select>
        </label>
        <label
          className="detect-field"
          data-testid="detection-active-segment-field"
          data-visible={rangeOrigin === 'active-segment' ? 'true' : 'false'}
          style={{ display: rangeOrigin === 'active-segment' ? undefined : 'none' }}
        >
          <span>活动段</span>
          <select
            data-testid="detection-active-segment"
            data-object-name="detectionActiveSegment"
            disabled={busy || segmentOptions.length === 0}
            value={selectedSegmentId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedSegmentId(id);
              applyActiveSegmentRange(id);
            }}
            title={
              segmentOptions.length
                ? '来自当前活动标记的真实段（不伪造）'
                : '无可用活动段—不伪造段列表'
            }
          >
            {segmentOptions.length === 0 ? (
              <option value="">（无可用活动段）</option>
            ) : (
              segmentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))
            )}
          </select>
        </label>
        <p
          className="detect-range-values"
          data-testid="detect-sample-range-values"
          data-object-name="detectionRequestedRange"
        >
          [{sampleRange.start}, {sampleRange.end})
        </p>
        <p data-testid="detect-sample-range-source">
          {rangeOrigin === 'custom' || rangeSource === 'roi'
            ? '来自图上检测 ROI 确认。确认不会自动运行检测。'
            : rangeOrigin === 'available-file' || rangeSource === 'file'
              ? '来自已打开 IQ / 工程的可用样本区间。'
              : rangeOrigin === 'active-segment'
                ? segmentOptions.length
                  ? '来自当前活动标记段（真实列表）。'
                  : '活动标记段：当前无可用段（不伪造）。'
                : '当前可见区域（与主图 navWindow 对齐）。'}
        </p>
        <button
          type="button"
          data-testid="select-detection-roi"
          data-object-name="selectDetectionRoi"
          disabled={busy}
          onClick={() => {
            setRangeOrigin('custom');
            setActiveTool('detection-roi');
          }}
        >
          选择单个检测 ROI…
        </button>
        <p className="muted">十进制字符串，半开区间。选 ROI 后切主图 detection-roi 工具；确认不自动跑检测。</p>
      </section>

      <div className="detect-task" data-testid="detect-task-status">
        {statusLine}
      </div>

      {errorLine ? (
        <p className="detect-error" data-testid="detect-error">
          {errorLine}
        </p>
      ) : null}

      {/* Never render candidate boxes from client invention or BLOCKED/stub results. */}
      {task == null ? null : drawOk ? (
        <ul className="detect-candidates" data-testid="detect-candidates">
          {drawCandidates.map((c, i) => (
            <li key={i} data-testid="detect-candidate-item">
              {typeof c === 'object' && c != null ? JSON.stringify(c) : String(c)}
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="detect-no-candidates"
          data-testid="detect-no-candidates"
          data-blocked={task.status === 'BLOCKED' ? 'true' : 'false'}
          data-cancelled={task.status === 'cancelled' ? 'true' : 'false'}
          data-frozen={
            task.status === 'cancelled' || task.status === 'BLOCKED' ? 'true' : 'false'
          }
        >
          {task.status === 'BLOCKED'
            ? '任务 BLOCKED：不绘制候选框（无伪造结果）。'
            : task.status === 'cancelled'
              ? '任务已取消：冻结显示，不绘制候选（result=null）。'
              : '无已核验前向结果，不绘制候选。'}
        </div>
      )}
    </div>
  );
}
