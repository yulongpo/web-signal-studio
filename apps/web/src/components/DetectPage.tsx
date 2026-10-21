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

const POLL_MS = 500;

type OfflineReason = 'offline' | 'unauthorized' | null;

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

export function DetectPage() {
  const token = useUiStore((s) => s.localComputeToken);
  const setToken = useUiStore((s) => s.setLocalComputeToken);
  const baseUrl = useUiStore((s) => s.localComputeBaseUrl);
  const sampleRange = useUiStore((s) => s.detectSampleRange);
  const rangeSource = useUiStore((s) => s.detectSampleRangeSource);
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
  const pollTimer = useRef<number | null>(null);

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
    [applyCapsFailure, makeClient, stopPoll],
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
          // Draft DetectionCard fields — backend honors modelId/enginePath for .engine only.
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
      setTask({
        ...rec,
        // Hard rule: cancelled never keeps draw-able candidates.
        result: rec.status === 'cancelled' ? null : rec.result,
      });
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
            selectedEngineId || spectrumMode !== 0 || timeStrategy !== 'sample' || splitBursts
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
            : `预检通过 · engine=${selectedEngine?.id ?? 'n/a'} · strategy=${timeStrategy}`}
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
        tabIndex={-1}
      >
        <strong>检测采样范围</strong>
        <p className="detect-range-values" data-testid="detect-sample-range-values">
          [{sampleRange.start}, {sampleRange.end})
        </p>
        <p data-testid="detect-sample-range-source">
          {rangeSource === 'roi'
            ? '来自图上检测 ROI 确认。确认不会自动运行检测。'
            : rangeSource === 'file'
              ? '来自已打开工程的样本区间。'
              : '默认区间。尚未确认图上检测 ROI。'}
        </p>
        <p className="muted">十进制字符串，半开区间。</p>
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
