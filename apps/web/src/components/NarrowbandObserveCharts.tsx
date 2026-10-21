/**
 * G06 observe charts: DDC'd IQ from sigmf_data_demo into WaveformChart + SpectrumChart.
 * Does not rewrite Bot-B shell chrome — only fills the honest empty chart slots.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { WaveformChart } from '@wss/charts/WaveformChart';
import { SpectrumChart } from '@wss/charts/SpectrumChart';
import { useUiStore } from '../store/uiStore';
import { useDspWorkerClient } from '../dsp/useDspWorkerClient';
import {
  computeNarrowbandObserveDdc,
  type NarrowbandObserveDdcResult,
} from '../dsp/narrowbandObserveDdc';

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

export function NarrowbandObserveCharts() {
  const client = useDspWorkerClient();
  const waveformMode = useUiStore((s) => s.narrowbandWaveformMode);
  const psdFft = useUiStore((s) => s.narrowbandPsdFft);
  const stftFft = useUiStore((s) => s.narrowbandStftFft);
  const freqMode = useUiStore((s) => s.narrowbandFreqMode);

  const [result, setResult] = useState<NarrowbandObserveDdcResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    void computeNarrowbandObserveDdc({
      client,
      waveformMode,
      psdFftSize: psdFft,
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
        setError(msg || 'narrowband DDC failed');
        setLoading(false);
      });
    return () => ac.abort();
  }, [client, waveformMode, psdFft, stftFft]);

  const statusText = error
    ? `DDC unavailable: ${error}`
    : loading && !result
      ? 'Loading sigmf_data_demo → DDC…'
      : null;

  const ready = Boolean(result) && !error;

  // RF axis offset for PSD/STFT labels when freqMode === 'rf' (display only).
  const rfOffset =
    freqMode === 'rf' && result
      ? result.loOffsetHz +
        (typeof result.inputSampleRateHz === 'number' ? 0 : 0)
      : 0;
  // For RF mode we shift displayed freq by capture center is not available here;
  // show baseband + LO as "RF-relative" offset around LO (honest: LO-centered).
  const psdXDomain = result
    ? {
        min: result.psd.xDomain.min + (freqMode === 'rf' ? result.loOffsetHz : 0),
        max: result.psd.xDomain.max + (freqMode === 'rf' ? result.loOffsetHz : 0),
        unit: 'Hz' as const,
        label: freqMode === 'rf' ? 'Freq (LO-centered)' : 'Frequency',
      }
    : null;

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

  void rfOffset;

  return (
    <>
      <div
        className="nb-observe-pipeline"
        data-testid="nb-observe-pipeline"
        data-nb-source="sigmf_data_demo"
        data-nb-pipeline="ddc"
        data-nb-lo-hz={result ? String(Math.round(result.loOffsetHz)) : undefined}
        data-nb-decimation={result ? String(result.decimation) : undefined}
        title={result?.pipelineLabel}
      >
        {result
          ? result.pipelineLabel
          : statusText ?? 'Waiting for DDC…'}
      </div>

      <div className="nb-observe-top">
        <PanelShell
          title="波形"
          testId="nb-panel-waveform"
          ready={ready}
          extraAttrs={{
            'data-nb-wave-source': 'sigmf_data_demo-ddc',
            'data-nb-wave-mode': waveformMode,
          }}
        >
          {result ? (
            <WaveformChart
              y={result.waveform.y}
              xDomain={result.waveform.xDomain}
              kind="waveform"
              height="100%"
              testId="nb-chart-waveform"
              windowX={null}
            />
          ) : (
            <Waiting text={statusText ?? '等待真实 DDC 波形'} />
          )}
        </PanelShell>

        <PanelShell
          title="功率谱密度"
          testId="nb-panel-psd"
          ready={ready && Boolean(result?.psd.y.length)}
          extraAttrs={{
            'data-nb-psd-source': 'sigmf_data_demo-ddc',
          }}
        >
          {result && psdXDomain && result.psd.y.length > 0 ? (
            <WaveformChart
              y={result.psd.y}
              xDomain={psdXDomain}
              kind="psd"
              height="100%"
              testId="nb-chart-psd"
              windowX={null}
            />
          ) : (
            <Waiting text={statusText ?? '等待真实 DDC PSD'} />
          )}
        </PanelShell>
      </div>

      <PanelShell
        title="时频谱"
        testId="nb-panel-stft"
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
            testId="nb-chart-stft"
            interactionEnabled={false}
          />
        ) : (
          <Waiting text={statusText ?? '等待真实 DDC 时频谱'} />
        )}
      </PanelShell>
    </>
  );
}
