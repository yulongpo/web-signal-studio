/**
 * PROVISIONAL — Bot-B detection page (RightRail detect tab).
 * Follows DETECTION_PAGE_CONTRACT.md. Never invents FFSCN/SCN candidates.
 * Uses Bot-E-aligned LocalComputeClient (class API).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  LocalComputeCapabilities,
  LocalComputeTaskRecord,
} from '@wss/contracts';
import { useUiStore } from '../store/uiStore';
import {
  LocalComputeClient,
  LocalComputeClientError,
  isTerminalStatus,
} from '../localCompute/client';
import {
  bannerTextsFromCapabilities,
  canRunDetect,
} from '../localCompute/gating';

const POLL_MS = 500;

type OfflineReason = 'offline' | 'unauthorized' | null;

export function DetectPage() {
  const token = useUiStore((s) => s.localComputeToken);
  const setToken = useUiStore((s) => s.setLocalComputeToken);
  const baseUrl = useUiStore((s) => s.localComputeBaseUrl);
  const sampleRange = useUiStore((s) => s.detectSampleRange);

  const [caps, setCaps] = useState<LocalComputeCapabilities | null>(null);
  const [offlineReason, setOfflineReason] = useState<OfflineReason>('offline');
  const [bannerLines, setBannerLines] = useState<string[]>([
    '未连接本地计算服务（loopback）。',
  ]);
  const [task, setTask] = useState<LocalComputeTaskRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorLine, setErrorLine] = useState<string | null>(null);
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
      setBannerLines(['鉴权失败（401）。请填写正确的 Bearer token。']);
    } else if (err instanceof LocalComputeClientError && err.status === 0) {
      setOfflineReason('offline');
      setBannerLines(['本地计算服务不可达（offline）。']);
    } else {
      setOfflineReason('offline');
      const msg = err instanceof Error ? err.message : String(err);
      setBannerLines([`Capabilities 失败：${msg}`]);
    }
  }, []);

  const refreshCapabilities = useCallback(async () => {
    setErrorLine(null);
    try {
      const client = makeClient();
      const next = await client.getCapabilities();
      setCaps(next);
      setOfflineReason(null);
      const lines = bannerTextsFromCapabilities(next.detection, 'zh');
      setBannerLines(
        lines.length
          ? lines
          : [
              `协议 ${next.protocolVersion} · 服务 ${next.serviceVersion} · FFSCN=${String(next.detection.ffscn)} SCN=${String(next.detection.scn)}`,
            ],
      );
    } catch (err) {
      applyCapsFailure(err);
    }
  }, [applyCapsFailure, makeClient]);

  useEffect(() => {
    void refreshCapabilities();
    return () => stopPoll();
  }, [refreshCapabilities, stopPoll]);

  const online = offlineReason === null;
  const authorized = offlineReason !== 'unauthorized';
  const ffscnOk = canRunDetect(caps?.detection, 'ffscn', online, authorized);
  const scnOk = canRunDetect(caps?.detection, 'scn', online, authorized);

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
            if (rec.status === 'BLOCKED') {
              const blockedLines = bannerTextsFromCapabilities(
                {
                  ffscn: false,
                  scn: false,
                  reasons: rec.blockReasons ?? [],
                  uiMessages: rec.uiMessages ?? [],
                },
                'zh',
              );
              if (blockedLines.length) setBannerLines(blockedLines);
              else if (rec.messageZh) setBannerLines([rec.messageZh]);
            }
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
        params: {},
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
      const res = await client.cancelTask(runId);
      setTask((prev) =>
        prev
          ? {
              ...prev,
              status: res.status,
              message: res.message ?? prev.message,
              messageZh: res.messageZh ?? prev.messageZh,
            }
          : prev,
      );
      setBusy(false);
      stopPoll();
    } catch (err) {
      setErrorLine(err instanceof Error ? err.message : String(err));
    }
  };

  const statusLine = (() => {
    if (!task) return 'idle';
    const progress =
      typeof task.progress === 'number' ? ` ${Math.round(task.progress * 100)}%` : '';
    const msg = task.messageZh || task.message || '';
    return `${task.status}${progress}${msg ? ` — ${msg}` : ''}`;
  })();

  return (
    <div className="detect-page" data-testid="detect-page">
      <div
        className="detect-banner"
        data-testid="detect-capabilities-banner"
        data-offline={offlineReason ?? 'online'}
      >
        {bannerLines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>

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
          onClick={() => void runDetect('ffscn.detect')}
        >
          FFSCN 检测
        </button>
        <button
          type="button"
          data-testid="detect-btn-scn"
          disabled={!scnOk || busy}
          onClick={() => void runDetect('scn.detect')}
        >
          SCN 检测
        </button>
        <button
          type="button"
          data-testid="detect-btn-cancel"
          disabled={!task?.runId || !busy}
          onClick={() => void cancelRun()}
        >
          取消
        </button>
      </div>

      <p className="detect-range muted">
        sampleRange: [{sampleRange.start}, {sampleRange.end})（十进制字符串）
      </p>

      <div className="detect-task" data-testid="detect-task-status">
        {statusLine}
      </div>

      {errorLine ? (
        <p className="detect-error" data-testid="detect-error">
          {errorLine}
        </p>
      ) : null}

      {/* Never render candidate boxes from client invention. */}
      {task?.status === 'BLOCKED' || task?.result == null ? null : null}
    </div>
  );
}
