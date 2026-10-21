# Bot-D P2-D status

- updated_at: 2026-10-21 (Asia/Shanghai)
- stage: Worker-wrap PSD/STFT/DDC + file-io integration
- worktree: `D:\\project\\wss-wt-d`
- branch: `work/bot-d-dsp`
- base: `509661f` (origin/main `682721a`)
- package_scope: `@wss/*`
- shared_tree (`D:\\project\\web_signal_studio`): **no writes**
- rebuild: **never touch**

## Delivered (this drop)

### Worker packaging (`packages/dsp-wasm/src/worker/`)
- `protocol.ts` — request kinds `psd|stft|ddc|cancel`; SampleIndex as decimal strings; IQ as transferable ArrayBuffer; responses `result|error|cancelled`
- `dsp-worker-handler.ts` — pure handler calling Reference* engines; sticky CancelRegistry by jobId; abort between stages
- `dsp-worker.ts` — browser `self.onmessage` entry
- `node-worker-entry.ts` — Node `worker_threads` entry
- `backends.ts` — `InProcessAsyncBackend` (default; setImmediate yields)
- `node-backend.ts` — `NodeWorkerBackend` (esbuild bundle → tmpdir → worker_threads)
- `dsp-client.ts` — `DspWorkerClient` + `createNodeDspWorkerClient()`; AbortSignal posts cancel and rejects AbortError

### Engine cancelability
- `computePsd` / `computeStft` / `computeDdc` are **async**; when `request.signal` is set, yield via `setImmediate` between frames/stages and `throwIfAborted`

### Tests
- `worker/dsp-client.test.ts` — in-process PSD/DDC + mid-job abort + already-aborted; **worker_threads** PSD + cancel
- `worker/file-io-dsp.integration.test.ts` — synthetic CI16 `openRawCi16LeIq` chunk → PSD/DDC + abort

### contracts
- Consume only. No ownership change.

## Test results

```
npx vitest run packages/file-io packages/dsp-wasm
 Test Files  7 passed (7)
      Tests  25 passed (25)

npx vitest run
 Test Files  10 passed (10)
      Tests  41 passed (41)
```
