/**
 * G06 modulation charts: DDC IQ → constellation + STFT; eye stays BLOCKED.
 * Fills Bot-B modulation page slots — no fake classifier scores.
 * G18: modulation STFT receives linkedCursor like desktop modulationStft_->setLinkedCursor.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { SpectrumChart } from '@wss/charts/SpectrumChart';
import { useUiStore } from '../store/uiStore';
import { useDspWorkerClient } from '../dsp/useDspWorkerClient';
import {
  computeNarrowbandModulationDdc,
  type NarrowbandModulationDdcResult,
} from '../dsp/narrowbandModulationDdc';
import { ConstellationCanvas } from './ConstellationCanvas';
import { cssToTimeFreq, frameIndexFromPlotX } from './chartGesture';
import { resolveNbStftLinkedCursor } from './nbMultiViewLinked';

function PanelShell({
  title,
  testId,
  children,
  ready,
  extraAttrs,
}: {
  title: string;
  testId: string;
  children: ReactNode;
  ready: boolean;
  extraAttrs?: Record<string, string | number | undefined>;
}) {
  const attrs: Record<string, string> = {};
  if (extraAttrs) {
    for (const [k, v] of Object.entries(extraAttrs)) {
      if (v !== undefined) attrs[k] = String(v);
    }
  }
  return (
    <div
      className="nb-chart-panel"
      data-testid={testId}
      data-nb-chart-ready={ready ? 'true' : 'false'}
      {...attrs}
    >
      <div className="nb-chart-panel-title">{title}</div>
      <div className="nb-chart-panel-body nb-chart-panel-body-filled">{children}</div>
    </div>
  );
}

function Waiting({ text }: { text: string }) {
  return <span className="nb-chart-panel-status">{text}</span>;
}

export function NarrowbandModulationCharts() {
  const client = useDspWorkerClient();
  const stftFft = useUiStore((s) => s.narrowbandStftFft);
  const freqMode = useUiStore((s) => s.narrowbandFreqMode);
  const linkedCursor = useUiStore((s) => s.linkedCursor);
  const pinLinkedCursor = useUiStore((s) => s.pinLinkedCursor);
  const clearActivePinnedCursor = useUiStore((s) => s.clearActivePinnedCursor);

  const [result, setResult] = useState<NarrowbandModulationDdcResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    void computeNarrowbandModulationDdc({
      client,
      stftFftSize: stftFft,
      signal: ac.signal,
    })
      .then((r) => {
        if (ac.signal.aborted) return;
        setResult(r);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (/abort/i.test(msg)) return;
        setResult(null);
        setError(msg || 'modulation DDC failed');
        setLoading(false);
      });
    return () => ac.abort();
  }, [client, stftFft]);

  const statusText = error
    ? `DDC unavailable: ${error}`
    : loading && !result
      ? 'Loading sigmf_data_demo → DDC → constellation…'
      : null;

  const ready = Boolean(result) && !error;
  const stftFreq = result
    ? {
        min:
          result.stft.freqHz.min +
          (freqMode === 'rf' ? result.loOffsetHz : 0),
        max:
          result.stft.freqHz.max +
          (freqMode === 'rf' ? result.loOffsetHz : 0),
      }
    : null;

  // Desktop updateLinkedCursors: modulationStft_ gets same LinkedCursorState as observe STFT.
  // Mod page has no local dwell scrubber — pinned store only (no invented dwell).
  const stftLinkedCursor = resolveNbStftLinkedCursor({
    linkedPinned: linkedCursor.pinned,
    linkedTimeSec: linkedCursor.timeSec,
    linkedFrequencyHz: linkedCursor.frequencyHz,
    dwellTimeSec: null,
    resolvedFreqHz: null,
  });

  return (
    <>
      <div
        className="nb-observe-pipeline"
        data-testid="nb-modulation-pipeline"
        data-nb-source="sigmf_data_demo"
        data-nb-pipeline="ddc-constellation"
        data-nb-lo-hz={result ? String(Math.round(result.loOffsetHz)) : undefined}
        title={result?.pipelineLabel}
      >
        {result ? result.pipelineLabel : statusText ?? 'Waiting for DDC…'}
      </div>

      <div className="nb-mod-grid">
        <PanelShell
          title="星座"
          testId="nb-panel-constellation"
          ready={ready && Boolean(result && result.constellation.length > 0)}
          extraAttrs={{
            'data-nb-constellation-source': 'sigmf_data_demo-ddc',
            'data-nb-constellation-count': result?.constellation.length ?? 0,
          }}
        >
          {result && result.constellation.length > 0 ? (
            <ConstellationCanvas points={result.constellation} />
          ) : (
            <Waiting text={statusText ?? '等待真实 DDC 星座'} />
          )}
        </PanelShell>

        <PanelShell
          title="眼图"
          testId="nb-panel-eye"
          ready={false}
          extraAttrs={{
            'data-nb-eye-status': result?.eye.status ?? 'BLOCKED',
            'data-nb-eye-reason': result?.eye.reasonCode ?? 'EYE_TIMING_SYNC_MISSING',
          }}
        >
          <Waiting
            text={
              result?.eye.reasonZh ??
              'BLOCKED: 眼图需要符号定时同步（不在 Bot-D 树内）'
            }
          />
        </PanelShell>

        <PanelShell
          title="时频图"
          testId="nb-panel-mod-stft"
          ready={ready && Boolean(result && result.stft.frameCount > 0)}
          extraAttrs={{
            'data-nb-stft-source': 'sigmf_data_demo-ddc',
            'data-g18-nb-mod-stft-linked-cursor':
              stftLinkedCursor == null ? 'false' : 'true',
            'data-g18-linked-cursor': stftLinkedCursor == null ? 'false' : 'true',
          }}
        >
          {result &&
          stftFreq &&
          result.stft.frameCount > 0 &&
          result.stft.binCount > 0 ? (
            <div
              className="nb-stft-pin-host"
              data-testid="nb-mod-stft-pin-host"
              data-frame-count={result.stft.frameCount}
              data-g18-margin-map="true"
              title="单击钉住联动光标；Alt+单击清除"
              style={{ width: '100%', height: '100%', position: 'relative' }}
              onClick={(event) => {
                // Desktop bindGesture(modulationStft_): pin → updateLinkedCursors.
                if (event.altKey) {
                  clearActivePinnedCursor();
                  return;
                }
                const host = event.currentTarget.getBoundingClientRect();
                if (!(host.width > 0) || !(host.height > 0) || result.stft.frameCount <= 0)
                  return;
                const x = event.clientX - host.left;
                const y = event.clientY - host.top;
                const idx = frameIndexFromPlotX(x, host.width, result.stft.frameCount);
                if (idx == null) return;
                const { timeSec, freqHz } = cssToTimeFreq(
                  x,
                  y,
                  host.width,
                  host.height,
                  'stft',
                  result.stft.timeSec,
                  stftFreq,
                );
                pinLinkedCursor({
                  source: 'main',
                  timeSec,
                  frequencyHz: freqHz,
                  selectedFrame: idx,
                  centerTimeSec:
                    result.stft.timeSec.min +
                    (result.stft.timeSec.max - result.stft.timeSec.min) / 2,
                  centerFrequencyHz: (stftFreq.min + stftFreq.max) / 2,
                });
              }}
            >
              <SpectrumChart
                power={result.stft.power}
                binCount={result.stft.binCount}
                frameCount={result.stft.frameCount}
                mode="stft"
                freqHz={stftFreq}
                timeSec={result.stft.timeSec}
                height="100%"
                testId="nb-chart-mod-stft"
                interactionEnabled={false}
                linkedCursor={stftLinkedCursor}
              />
            </div>
          ) : (
            <Waiting text={statusText ?? '等待真实 DDC 时频图'} />
          )}
        </PanelShell>
      </div>
    </>
  );
}
