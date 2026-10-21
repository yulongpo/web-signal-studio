# Bot-D P2-D status

- updated_at: 2026-10-21 (Asia/Shanghai)
- stage: Package A — IQ WAV + FSA chunked read → DSP Worker STFT
- worktree: D:\\project\\wss-wt-d
- branch: work/bot-d-dsp
- base: 9f6ec00 (origin/main tip at Package A start; typecheck-green tip)
- package_scope: @wss/*
- shared_tree (D:\\project\\web_signal_studio): **no writes**
- rebuild: **read-only reference** (wav_metadata.h/.cpp restricted profile)

## Delivered (Package A)

### packages/file-io
- wav-meta.ts — RIFF/WAVE parse for restricted PCM16 LE stereo IQ (Qt parity: full RIFF validate before publish; no RF center; reject RF64/RIFX/float/extensible)
- wav-reader.ts — describeWav / openIqWavFromArrayBuffer / openIqWavFromBlob (payload-only via dataOffset)
- lob-chunked-reader.ts — BlobChunkedReader via lob.slice().arrayBuffer(); available-prefix + DEFAULT_CHUNK_BYTES + AbortSignal
- sa.ts — detectFsaCapabilities, openFromFileSystemFileHandle, pickAndOpenIqWav; FsaUnsupportedError when picker missing (no crash)
- uildPcm16LeStereoIqWav — in-memory format fixture builder (tests only)
- Exported decodeToFloat32Iq for shared decode path
- Exports from index.ts

### STFT loop helper (pps/web/src/dsp/)
- stftFromChunkedReader.ts — chunked IQ Float32 → DspWorkerClient.analyzeStft with AbortSignal
- Does **not** replace MainChartHost synthetic fixture; requires explicit sourceLabel

### Tests
- packages/file-io/src/wav-iq.test.ts — descriptor, boundaries (empty/one/past EOF/chunk budget), cancel, blob open, FSA fake handle + unsupported
- packages/dsp-wasm/src/worker/wav-stft.integration.test.ts — fixture WAV → STFT finite power + abort
- pps/web/src/dsp/stftFromChunkedReader.test.ts — multi-chunk loop + abort

### contracts
- Consume only (ChunkReadRequest/Response, DEFAULT_CI16_LE_IQ, DEFAULT_CHUNK_BYTES, SampleIndex). No ownership change.

### Browser Worker
- Untouched. Package A uses existing createDspWorkerClient / InProcess path in tests; browser Worker path remains as previously delivered.

## Prior drop (Browser Worker + synthetic chart STFT)

### Browser Worker (packages/dsp-wasm/src/worker/)
- rowser-backend.ts — BrowserWorkerBackend via globalThis.Worker + Vite-friendly 
ew URL('./dsp-worker.ts', import.meta.url)
- createBrowserDspWorkerClient; AbortSignal cancel via existing protocol

### apps/web wiring (unchanged by Package A chart path)
- computeMainSpectrogram.ts — labeled synthetic two-tone IQ → STFT (sourceLabel: 'synthetic fixture')
- MainChartHost.tsx — data-dsp-source="synthetic-stft-worker"

## Verify commands

`
npx vitest run packages/file-io
npx vitest run packages/dsp-wasm
npm run typecheck -w @wss/web
npm run test -w @wss/web
`
