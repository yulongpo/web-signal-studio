# Bot-B Web UI Shell

Owner: Bot-B (`work/bot-b-web-shell`, worktree `D:\project\wss-wt-b`).

## Layout

| Region | Component / slot | Notes |
|--------|------------------|-------|
| Left | `ProjectTree` | Sample stub **or** `@wss/project-io` via `asProjectSessionHook` |
| Top of workspace | Global time nav strip | Placeholder |
| Aux chart | `data-chart-slot="aux"` | ChartPlaceholder; Bot-C fills |
| Toolbar | `SpectrumToolbar` | Primary + overflow + **wide/narrow workspace toggle** |
| Main chart | `data-chart-slot="main"` | MainChartHost — `@wss/charts` SpectrumChart + Bot-D STFT worker |
| Bottom | `StatusBar` | Workspace / tool / cursor / **dsp source** / file / channel |
| Right | `RightRail` | display / **detect** / marker / channel |
| Overlay | `TempLayers` | Level + Display |

## Workspace mode

- Store: `workspaceMode` (`wideband` | `narrowband` | `linked`).
- Toolbar: `btn-workspace-wideband` / `btn-workspace-narrowband` (StatusBar `status-workspace` stays in sync).
- Narrowband shows `workspace-narrowband-stub` banner — **stub only**, real DDC is Bot-D; never fake demod.

## STFT worker path (Bot-D + Bot-B polish)

- `MainChartHost` uses `useDspWorkerClient` + either:
  - **Opened IQ**: `@wss/file-io` FSA (`pickAndOpenIqWav`) or `<input type=file>` → `openIqWavFromBlob` → `stftFromChunkedReader` / `computeFileSpectrogram`
  - **No file / clear / open fail**: `computeMainSpectrogram` synthetic two-tone fixture
- Session: `iqFileSession` (ChunkedReader) + toolbar Open IQ / Clear IQ (`btn-open-iq-wav`, `btn-clear-iq-wav`, `input-iq-wav`).
- Host attribute `data-dsp-source`: `loading` | `synthetic-stft-worker` | `file-stft-worker` | `fsa-wav-stft` | `demo-fallback`.
- Explicit `sourceLabel`: file path never labeled synthetic; synthetic never claimed as live/capture.
- Visible chip `data-testid="dsp-source-chip"` (also mirrored on StatusBar `status-dsp-source`).
- AbortController cancel on re-open / unmount kept.
- Demo `synthPower` is loading/fallback only — never claimed as real capture.


## Project IO (`@wss/project-io` / Bot-F session)

- Contract: `docs/implementation/BOT_F_WEB_SESSION_CONTRACT.md`.
- Thin adapter: `apps/web/src/projectIo/sessionHook.ts` + `asProjectSessionHook` in `uiStore`.
- ProjectTree open/save/clear call `sessionHook()` → `ProjectSessionHookApi`.
- Primitives: `openProjectFromJsonText` / `summarizeLoadedProject` / `saveProjectToJsonText`.
- Sample indexes: decimal strings only.

## Detection page (`DetectPage`)

Follows `services/local-compute/docs/DETECTION_PAGE_CONTRACT.md`, `REAL_MODEL_INTEGRATION.md`, and Bot-E example client.

- Client: `LocalComputeClient` **class** in `apps/web/src/localCompute/client.ts`.
- Loopback assert; default base URL `http://127.0.0.1:8000`; override `VITE_LOCAL_COMPUTE_URL`.
- `GET /capabilities` gates FFSCN/SCN on `detection.ffscn` / `.scn === true`.
- Banner prefers `detection.uiMessages` (zh) + **code chips** (`detect-ui-code`); unknown codes (e.g. server `SOURCE_MISSING`) still render server zh/en — **never invent copy client-side**.
- Gate reasons: `detect-gate-reason-ffscn` / `detect-gate-reason-scn` with MODEL_MISSING_* / GPU_* chips.
- Optional debug chips: `gpu.uiCode`, `runtime.engine`, `runtime.canInventResults` (only if present).
- Draw candidates **only** when `status === 'succeeded'` AND `result.verifiedForward === true` AND `engine` starts with `PYTORCH_*`.
- `BLOCKED` / stub / missing verifiedForward → `detect-no-candidates`; ignore unexpected `candidates`/`boxes` keys.
- Offline/401: disabled buttons, no fake results.

### detect data-testids

`detect-page`, `detect-capabilities-banner`, `detect-ui-code`, `detect-btn-ffscn`, `detect-btn-scn`, `detect-btn-cancel`, `detect-task-status`, `detect-token-input`, `detect-refresh-caps`, `detect-gate-reason-ffscn`, `detect-gate-reason-scn`, `detect-debug-chips`, `detect-gpu-uicode`, `detect-runtime-engine`, `detect-can-invent`, `detect-no-candidates`, `detect-candidates`, `detect-candidate-item`, `detect-blocked-message`

### workspace data-testids

`btn-workspace-wideband`, `btn-workspace-narrowband`, `workspace-narrowband-stub`, `status-workspace`

### STFT data-testids

`main-chart-host` (`data-dsp-source`), `dsp-source-chip`, `status-dsp-source`, `btn-open-iq-wav`, `btn-clear-iq-wav`, `input-iq-wav`, `iq-open-error`

## Package

`@wss/web` deps: `@wss/charts`, `@wss/project-io`, `@wss/contracts`, `@wss/dsp-wasm`, `@wss/file-io`. Worktree only.
