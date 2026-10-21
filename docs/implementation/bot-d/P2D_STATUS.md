# Bot-D P2-D status

- updated_at: 2026-10-21 (Asia/Shanghai)
- stage: Package E — narrowband DDC E2E numerical acceptance hardening
- worktree: D:\\project\\wss-wt-d
- branch: work/bot-d-dsp
- base: f9f4616 (origin/main tip at package start; includes Bot-G re-review + prior M-07)
- package_scope: @wss/*
- shared_tree (D:\\project\\web_signal_studio): **no writes**
- rebuild: **read-only reference**
- MainChartHost: **untouched** (Bot-B)
- narrowband UI stub: **untouched** (no fake demod)
- ACCEPTANCE_MATRIX M-07: **not** marked PASS (`matrix_pass_claimed: false`; QA/Bot-G)

## Delivered (Package E)

### E2E helper (web)
- `apps/web/src/dsp/ddcFromChunkedReader.ts`
  - ChunkedReader → `DspWorkerClient.processDdc` → optional baseband STFT/PSD
  - AbortSignal cancel; required `sourceLabel` (no silent fake IQ)
  - Params: `loOffsetHz`, interp/decim, optional `firTaps`

### Goldens / tests
- `apps/web/src/dsp/ddcFromChunkedReader.test.ts`
- `packages/dsp-wasm/src/m07-narrowband-ddc-e2e.golden.test.ts`
  - Fixture WAV → multi-chunk read → Worker DDC → DC peak
  - Two-tone image rejection
  - Abort mid-DDC
  - JS `ReferenceDdcEngine` vs `WasmReferenceDdcEngine` (eps ≤ 2e-5)

### Evidence (reviewable; no PASS claim)
- `docs/acceptance/evidence/bot-d/m07_narrowband_ddc_e2e_2026-10-21.md`
- `docs/acceptance/evidence/bot-d/m07_narrowband_ddc_e2e_2026-10-21.json`

### Bot-B assist (small)
- `createBrowserDspWorkerClientPreferWasmFft()` on dsp-client
- Wiring doc updated with DDC helper copy-paste
- Does **not** replace narrowband stub UI

## Prior packages
- M-07: WASM FIR / rational resample / LO mix + DDC golden
- C: WASM STFT + optional Worker `wasm-fft`
- B: Emscripten FFT/PSD
- A: IQ WAV + FSA → STFT Worker helpers

## Verify

```
npm run typecheck -w @wss/web
npx vitest run packages/dsp-wasm
npx vitest run apps/web/src/dsp/ddcFromChunkedReader.test.ts
npx vitest run packages/file-io
```
