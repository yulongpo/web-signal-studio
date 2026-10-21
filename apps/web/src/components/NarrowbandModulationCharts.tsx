/**
 * G06 modulation charts: DDC IQ → constellation + STFT; eye stays BLOCKED.
 * Fills Bot-B modulation page slots — no fake classifier scores.
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
          title="时频谱"
          testId="nb-panel-mod-stft"
          ready={ready && Boolean(result && result.stft.frameCount > 0)}
          extraAttrs={{
            'data-nb-stft-source': 'sigmf_data_demo-ddc',
          }}
        >
          {result &&
          stftFreq &&
          result.stft.frameCount > 0 &&
          result.stft.binCount > 0 ? (
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
            />
          ) : (
            <Waiting text={statusText ?? '等待真实 DDC 时频谱'} />
          )}
        </PanelShell>
      </div>
    </>
  );
}
