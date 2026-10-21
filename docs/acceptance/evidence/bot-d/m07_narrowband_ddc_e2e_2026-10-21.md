# Evidence: M-07 narrowband DDC E2E numerical hardening (Package E)

- **date**: 2026-10-21 (Asia/Shanghai)
- **owner**: Bot-D (`wss-wt-d` / `work/bot-d-dsp`)
- **baseline (pre-commit tip)**: `f9f4616`
- **commit**: `a9d11adf691a01f0b52ad2f83c26b467767d272d` (short `a9d11ad`)
- **matrix_pass_claimed**: **false**
- **ACCEPTANCE_MATRIX M-07**: **WIP** — awaiting Bot-G / QA re-review; this doc does **not** claim PASS

## Scope

Chunked IQ read → cancelable Worker `processDdc` → optional baseband STFT/PSD helper, plus hardened goldens comparing JS `ReferenceDdcEngine` vs `WasmReferenceDdcEngine`.

JS remains the **default** DDC / Worker path. WASM DDC is covered in tests only (optional engine).

Narrowband UI stub (`workspace-narrowband-stub`) is **unchanged** — no fake demod in UI.

## Fixture description (labeled synthetic — not live)

| Fixture | Description |
|---------|-------------|
| Synthetic complex tones (Float32 IQ) | In-memory tones at known Hz; labeled in tests as synthetic |
| PCM16 LE stereo IQ WAV via `buildPcm16LeStereoIqWav` | Format fixture for chunked `openIqWavFromArrayBuffer`; `label` / `sourceLabel` always contain `synthetic fixture` |
| Two-tone | Keep tone at LO (e.g. 10 kHz); reject tone at 30 kHz → after mix at 20 kHz, attenuated by default M=4 LPF |

**Not** claimed as live capture / SigMF field recording / hardware RF.

## Key files

| Path | Role |
|------|------|
| `apps/web/src/dsp/ddcFromChunkedReader.ts` | E2E helper: chunked read → `processDdc` → optional baseband STFT/PSD; requires `sourceLabel` |
| `apps/web/src/dsp/ddcFromChunkedReader.test.ts` | Web vitest: single-tone DC peak, two-tone, abort, empty-label guard |
| `packages/dsp-wasm/src/m07-narrowband-ddc-e2e.golden.test.ts` | Package goldens: WAV→chunked→Worker DDC, two-tone, cancel, JS vs WASM eps |
| `packages/dsp-wasm/src/worker/dsp-client.ts` | `createBrowserDspWorkerClientPreferWasmFft()` thin Bot-B assist |
| `docs/implementation/bot-d/WASM_FFT_WIRING_FOR_BOT_B.md` | Wiring note + DDC helper copy-paste |
| `docs/implementation/bot-d/P2D_STATUS.md` | Bot-D status |

## Exact re-run commands (from repo root on HH-laptop worktree)

```bash
# typecheck web
npm run typecheck -w @wss/web

# dsp-wasm goldens (includes Package E + prior M-07)
npx vitest run packages/dsp-wasm

# web DSP helper tests
npx vitest run apps/web/src/dsp/ddcFromChunkedReader.test.ts

# preferred: file-io still green
npx vitest run packages/file-io
```

PowerShell (HH-laptop):

```powershell
Set-Location D:\project\wss-wt-d
npm run typecheck -w @wss/web
npx vitest run packages/dsp-wasm
npx vitest run apps/web/src/dsp/ddcFromChunkedReader.test.ts
npx vitest run packages/file-io
```

## Expected assertions (numeric)

| Case | Assertion |
|------|-----------|
| Single-tone LO→DC | `outputSampleRateHz = sampleRateHz / decimation` (100e3/4 = **25000**); `nOut = floor(N/M)`; peak bin distance to DC ≤ **1**; DC-band energy fraction ≳ **0.8** (web) / **0.8** (pkg) |
| Two-tone | Peak near DC (dist ≤ **2**); DC-band fraction ≳ **0.55** (reject tone attenuated) |
| Cancel | `AbortSignal` → reject `{ name: 'AbortError' }` |
| JS vs WASM | `maxAbsDiff(js.samples, wasm.samples) ≤ 2e-5`; both peak near DC |
| sourceLabel | Empty/whitespace → `TypeError` (no silent fake IQ path) |

## Verify results (filled at commit time)

- typecheck `@wss/web`: `PASS (tsc -b @wss/web)`
- `npx vitest run packages/dsp-wasm`: `PASS — 11 files, 39 passed | 1 skipped (incl. m07-narrowband-ddc-e2e 4 passed)`
- `npx vitest run apps/web/src/dsp/ddcFromChunkedReader.test.ts`: `PASS — 4 passed (npm test -w @wss/web -- src/dsp/ddcFromChunkedReader.test.ts)`
- `npx vitest run packages/file-io`: `PASS — 3 files, 19 passed`

## QA notes

- Do **not** flip `ACCEPTANCE_MATRIX` M-07 to PASS from this evidence alone.
- `matrix_pass_claimed: false` — WIP awaiting Bot-G.
- MainChartHost / FSA UX ownership remains Bot-B; this package only adds callable DSP helpers.
