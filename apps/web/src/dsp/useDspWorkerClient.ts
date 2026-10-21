/**
 * Lifecycle hook for a browser (or in-process fallback) DspWorkerClient.
 * Creates once on mount / engine preference change and closes on unmount.
 * Optional wasm-fft via resolveDspFftEngine (?engine= or uiStore); default 'js'.
 * fellBackToJs from ready() is treated as success with JS math.
 */
import { useEffect, useState } from 'react';
import {
  createBrowserDspWorkerClient,
  createDspWorkerClient,
  type DspWorkerClient,
} from '@wss/dsp-wasm';
import { useUiStore } from '../store/uiStore';
import { resolveDspFftEngine } from './resolveDspFftEngine';

export function useDspWorkerClient(): DspWorkerClient | null {
  const preference = useUiStore((s) => s.dspFftEnginePreference);
  const [client, setClient] = useState<DspWorkerClient | null>(null);

  useEffect(() => {
    const engine = resolveDspFftEngine(preference);
    let created: DspWorkerClient;
    let browserPath = true;
    try {
      created = createBrowserDspWorkerClient({ engine });
    } catch {
      // jsdom / Node preview: in-process backend; keep default js (no WASM worker).
      browserPath = false;
      created = createDspWorkerClient();
    }
    setClient(created);
    let cancelled = false;
    void (async () => {
      try {
        const configured = browserPath ? await created.ready() : null;
        if (cancelled) return;
        const fellBack = configured?.fellBackToJs === true;
        const active = fellBack
          ? 'js'
          : (configured?.engine ?? (browserPath ? engine : 'js'));
        useUiStore.getState().setDspFftEngineActive({
          requested: engine,
          active,
          fellBackToJs: fellBack,
        });
      } catch {
        if (cancelled) return;
        useUiStore.getState().setDspFftEngineActive({
          requested: engine,
          active: 'js',
          fellBackToJs: true,
        });
      }
    })();
    return () => {
      cancelled = true;
      void created.close();
    };
  }, [preference]);

  return client;
}
