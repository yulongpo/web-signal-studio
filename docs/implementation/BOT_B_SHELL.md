# Bot-B Web UI Shell

Owner: Bot-B (`work/bot-b-web-shell`, worktree `D:\\project\\wss-wt-b`).

## Layout

| Region | Component / slot | Notes |
|--------|------------------|-------|
| Left | `ProjectTree` | Sample stub **or** `@wss/project-io` via `asProjectSessionHook` |
| Top of workspace | Global time nav strip | Placeholder |
| Aux chart | `data-chart-slot="aux"` | ChartPlaceholder; Bot-C fills |
| Toolbar | `SpectrumToolbar` | Primary + overflow + **wide/narrow workspace toggle** + Open IQ |
| Main chart | `data-chart-slot="main"` | MainChartHost — `@wss/charts` SpectrumChart + Bot-D STFT worker |
| Bottom | `StatusBar` | Workspace / tool / cursor / **dsp source** / file / channel |
| Right | `RightRail` | display / **detect** / marker / channel |
| Overlay | `TempLayers` | Level + Display |

## Workspace mode (M-05)

- Store: `workspaceMode` (`wideband` | `narrowband` | `linked`).
- Toolbar: `btn-workspace-wideband` / `btn-workspace-narrowband` (StatusBar `status-workspace` stays in sync).
- Narrowband shows `workspace-narrowband-stub` banner — **stub only**, real DDC is Bot-D; never fake demod / fake IQ.
- Switching wide ↔ narrow must not drop main chart host or detect page state (e2e `workspace.spec.ts`).
- Evidence: PNGs + companion JSON under `docs/acceptance/evidence/bot-b/` (`m05_workspace_*.png`, `m05_workspace_2026-10-21.json`, legacy `b-p3-workspace-*.png`). Index: `docs/acceptance/evidence/bot-b/BOT_B_PROBE_INDEX.md`. **QA-G owns PASS.**

## STFT worker path (Bot-D + Bot-B open chain)

- DSP FFT engine default **`js`**. Opt-in `wasm-fft` via `?engine=wasm-fft` or `uiStore.dspFftEnginePreference` → `createBrowserDspWorkerClient({ engine })` + `ready()`; `fellBackToJs` treated as success. See `docs/implementation/bot-d/WASM_FFT_WIRING_FOR_BOT_B.md`.
- Host/StatusBar expose `data-fft-engine` / `status-fft-engine`.
- `MainChartHost` uses `useDspWorkerClient` + either:
  - **Opened IQ**: FSA (`pickAndOpenIqWav`, WAV) or `<input type=file multiple>` → `openIqFromFiles` / `openIqFromFileBlob` → `stftFromChunkedReader` / `computeFileSpectrogram`
  - **No file / clear / open fail**: `computeMainSpectrogram` synthetic two-tone fixture
- Formats via `@wss/file-io` (no parser rewrite):
  - **wav** — `openIqWavFromBlob` / FSA `pickAndOpenIqWav`
  - **raw** — `.iq` / `.raw` / `.ci16` → `openRawCi16LeIq` (default sample rate `DEFAULT_RAW_SAMPLE_RATE_HZ` = 1e6 when no sidecar)
  - **sigmf** — select **both** `.sigmf-meta` + `.sigmf-data` → `openSigmfArrayBuffer`
- Session: `iqFileSession` carries `format: 'wav' | 'raw' | 'sigmf'`; chip/host expose `data-iq-format`.
- Host attribute `data-dsp-source`: `loading` | `synthetic-stft-worker` | `file-stft-worker` | `fsa-wav-stft` | `demo-fallback`.
- Explicit `sourceLabel` distinguishes WAV/RAW/SigMF; synthetic never claimed as live/capture.
- Visible chip `data-testid="dsp-source-chip"` (also mirrored on StatusBar `status-dsp-source`).
- AbortController cancel on re-open / unmount kept.

### Open-path blockers

- FSA picker remains **WAV-only** (`pickAndOpenIqWav` in `@wss/file-io`); RAW/SigMF use the file-input path.
- SigMF requires a meta+data **pair** in one multi-select; single-file SigMF is an explicit error (no silent path rewrite).

## Project IO (M-01 / `@wss/project-io` / Bot-F session)

- Contract: `docs/implementation/BOT_F_WEB_SESSION_CONTRACT.md`.
- Thin adapter: `apps/web/src/projectIo/sessionHook.ts` + `asProjectSessionHook` in `uiStore`.
- ProjectTree open/save/clear call `sessionHook()` → `ProjectSessionHookApi`.
- Primitives: `openProjectFromJsonText` / `summarizeLoadedProject` / `saveProjectToJsonText`.
- Sample indexes: **decimal strings only**; never invent v6 fields; never silently rewrite source paths.
- Playwright `project-io.spec.ts`: paste open → StatusBar/tree → save download → clear.
- Evidence: `m01_project_open/saved/cleared.png`, `m01_project_export_probe.json`, `m01_project_io_2026-10-21.json` (see BOT_B_PROBE_INDEX). **QA-G owns PASS.**
- StatusBar `status-project` mirrors loaded summary name/fileCount; clear empties project + file labels.

## Detection page (`DetectPage`)

Follows `services/local-compute/docs/DETECTION_PAGE_CONTRACT.md`, `REAL_MODEL_INTEGRATION.md`, and Bot-E example client.

- Client: `LocalComputeClient` **class** in `apps/web/src/localCompute/client.ts`.
- Loopback assert; default base URL `http://127.0.0.1:8000`; override `VITE_LOCAL_COMPUTE_URL`.
- `GET /capabilities` gates FFSCN/SCN on `detection.ffscn` / `.scn === true`.
- Banner prefers `detection.uiMessages` (zh) + **code chips** (`detect-ui-code`); unknown codes still render server zh/en — **never invent copy client-side**.
- Draw candidates **only** when `status === 'succeeded'` AND `result.verifiedForward === true` AND `engine` starts with `PYTORCH_*`.
- `BLOCKED` / stub / missing verifiedForward → `detect-no-candidates`.

### Detect ↔ open-file session

- FFSCN/SCN run buttons require an opened IQ file session (`iqFileSession`) **and** capabilities.
- Without IQ: gate shows `SOURCE_MISSING`; capabilities refresh still allowed.
- With IQ: `createTask` sends `sourcePath` = file name / label (never invent candidates).
- Clear IQ → clear detect task + re-disable run.

### detect data-testids

`detect-page`, `detect-iq-source`, `detect-capabilities-banner`, `detect-ui-code`, `detect-btn-ffscn`, `detect-btn-scn`, `detect-btn-cancel`, `detect-task-status`, `detect-token-input`, `detect-refresh-caps`, `detect-gate-reason-ffscn`, `detect-gate-reason-scn`, `detect-debug-chips`, `detect-gpu-uicode`, `detect-runtime-engine`, `detect-can-invent`, `detect-no-candidates`, `detect-candidates`, `detect-candidate-item`, `detect-blocked-message`

### workspace data-testids

`btn-workspace-wideband`, `btn-workspace-narrowband`, `workspace-narrowband-stub`, `status-workspace`

### STFT / open data-testids

`main-chart-host` (`data-dsp-source`, `data-iq-format`), `dsp-source-chip`, `status-dsp-source`, `btn-open-iq-wav`, `btn-clear-iq-wav`, `input-iq-wav`, `iq-open-error`

## Package B-P3-project-workspace-open

- A: M-01 project open/save/clear hardened + Playwright save→clear.
- B: M-05 workspace e2e (stub + state retention) + evidence PNGs.
- C: RAW/SigMF wired on file-input → chunked STFT; WAV unchanged.

## Package B-P4

- Optional wasm-fft (default js; query/store opt-in; fellBackToJs OK).
- Project open/save ↔ StatusBar (`status-project`) / tree channel counts tighter.
- Detect ↔ IQ file session gate + sourcePath on createTask.
- M-01/M-05 evidence JSON+PNG for QA-G (no matrix PASS claim).

## Package

`@wss/web` deps: `@wss/charts`, `@wss/project-io`, `@wss/contracts`, `@wss/dsp-wasm`, `@wss/file-io`. Worktree only.
