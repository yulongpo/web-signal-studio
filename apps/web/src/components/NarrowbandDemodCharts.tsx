/**
 * G06 demodulation charts: DDC IQ → AM/FM/RMS envelope preview; bitstream BLOCKED.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { WaveformChart } from '@wss/charts/WaveformChart';
import { useDspWorkerClient } from '../dsp/useDspWorkerClient';
import {
  computeNarrowbandDemodDdc,
  type NarrowbandDemodDdcResult,
} from '../dsp/narrowbandDemodDdc';
import type { SimpleDemodMode } from '../dsp/simpleDemodFromIq';

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

const MODES: { id: SimpleDemodMode; label: string }[] = [
  { id: 'am_envelope', label: 'AM 包络' },
  { id: 'fm_discriminator', label: 'FM 鉴频' },
  { id: 'rms', label: 'RMS' },
];

export function NarrowbandDemodCharts() {
  const client = useDspWorkerClient();
  const [mode, setMode] = useState<SimpleDemodMode>('am_envelope');
  const [result, setResult] = useState<NarrowbandDemodDdcResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    void computeNarrowbandDemodDdc({
      client,
      mode,
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
        setError(msg || 'demod DDC failed');
        setLoading(false);
      });
    return () => ac.abort();
  }, [client, mode]);

  const statusText = error
    ? `DDC unavailable: ${error}`
    : loading && !result
      ? 'Loading sigmf_data_demo → DDC → demod preview…'
      : null;

  const ready = Boolean(result) && !error && Boolean(result?.waveform.y.length);

  return (
    <>
      <div
        className="nb-observe-pipeline"
        data-testid="nb-demod-pipeline"
        data-nb-source="sigmf_data_demo"
        data-nb-pipeline="ddc-simple-demod"
        data-nb-demod-mode={mode}
        data-nb-bitstream={result?.bitstream.status ?? 'BLOCKED'}
        title={result?.pipelineLabel}
      >
        {result ? result.pipelineLabel : statusText ?? 'Waiting for DDC…'}
      </div>

      <div className="nb-demod-toolbar" data-testid="nb-demod-toolbar">
        <label className="nb-field">
          <span>预览模式</span>
          <select
            data-testid="nb-select-demod-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as SimpleDemodMode)}
          >
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <span className="nb-honest" data-testid="nb-demod-bitstream-note">
          {result?.bitstream.reasonZh ??
            'BLOCKED: 比特流/协议解调不在树内；仅包络预览'}
        </span>
      </div>

      <PanelShell
        title="解调波形（预览）"
        testId="nb-panel-demod-wave"
        ready={ready}
        extraAttrs={{
          'data-nb-demod-source': 'sigmf_data_demo-ddc',
          'data-nb-demod-mode': mode,
        }}
      >
        {result && result.waveform.y.length > 0 ? (
          <WaveformChart
            y={result.waveform.y}
            xDomain={result.waveform.xDomain}
            kind="waveform"
            height="100%"
            testId="nb-chart-demod-wave"
            windowX={null}
          />
        ) : (
          <Waiting text={statusText ?? '等待真实 DDC 解调预览'} />
        )}
      </PanelShell>
    </>
  );
}
