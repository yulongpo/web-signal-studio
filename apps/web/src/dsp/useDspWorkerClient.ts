/**
 * Lifecycle hook for a browser (or in-process fallback) DspWorkerClient.
 * Creates once on mount and closes on unmount. AbortSignal cancel is owned by callers.
 */
import { useEffect, useState } from 'react';
import {
  createBrowserDspWorkerClient,
  createDspWorkerClient,
  type DspWorkerClient,
} from '@wss/dsp-wasm';

export function useDspWorkerClient(): DspWorkerClient | null {
  const [client, setClient] = useState<DspWorkerClient | null>(null);

  useEffect(() => {
    let created: DspWorkerClient;
    try {
      created = createBrowserDspWorkerClient();
    } catch {
      // jsdom / Node preview: fall back to in-process backend (still cancelable).
      created = createDspWorkerClient();
    }
    setClient(created);
    return () => {
      void created.close();
    };
  }, []);

  return client;
}
