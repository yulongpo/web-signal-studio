# Bot-B Web UI Shell

Owner: Bot-B (`work/bot-b-web-shell`, worktree `D:\project\wss-wt-b`).

## Layout

| Region | Component / slot | Notes |
|--------|------------------|-------|
| Left | `ProjectTree` | Sample stub **or** `@wss/project-io` via `asProjectSessionHook` |
| Top of workspace | Global time nav strip | Placeholder |
| Aux chart | `data-chart-slot="aux"` | ChartPlaceholder; Bot-C fills |
| Toolbar | `SpectrumToolbar` | Primary + overflow |
| Main chart | `data-chart-slot="main"` | MainChartHost → `@wss/charts` SpectrumChart + Bot-D STFT worker |
| Bottom | `StatusBar` | Workspace / tool / cursor / **dsp source** / file / channel |
| Right | `RightRail` | display / **detect** / marker / channel |
| Overlay | `TempLayers` | Level + Display |

## STFT worker path (Bot-D + Bot-B polish)

- `MainChartHost` uses `useDspWorkerClient` + `computeMainSpectrogram`.
- Host attribute `data-dsp-source`: `loading` | `synthetic-stft-worker` | `demo-fallback`.
- Visible chip `data-testid="dsp-source-chip"` (also mirrored on StatusBar `status-dsp-source`).
- AbortController cancel on unmount kept.
- Demo `synthPower` is loading/fallback only — never claimed as real capture.

## Project IO (`@wss/project-io` / Bot-F session)

- Contract: `docs/implementation/BOT_F_WEB_SESSION_CONTRACT.md`.
- Thin adapter: `apps/web/src/projectIo/sessionHook.ts` + `asProjectSessionHook` in `uiStore`.
- ProjectTree open/save/clear call `sessionHook()` → `ProjectSessionHookApi`.
- Primitives: `openProjectFromJsonText` / `summarizeLoadedProject` / `saveProjectToJsonText`.
- Sample indexes: decimal strings only.

## Detection page (`DetectPage`)

Follows `services/local-compute/docs/DETECTION_PAGE_CONTRACT.md` and Bot-E example client.

- Client: `LocalComputeClient` **class** in `apps/web/src/localCompute/client.ts` (aligned with `services/local-compute/examples/detection-page-client.ts`).
- Loopback assert; default base URL `http://127.0.0.1:8000` (Vite `/api` proxy); override `VITE_LOCAL_COMPUTE_URL`.
- Token: `VITE_LOCAL_COMPUTE_TOKEN` / session field.
- `GET /capabilities` gates FFSCN/SCN; prefer `uiMessages.zh`.
- `POST /tasks` + poll + cancel; never invent candidates.
- Offline/401: disabled buttons, no fake results.

### detect data-testids

`detect-page`, `detect-capabilities-banner`, `detect-btn-ffscn`, `detect-btn-scn`, `detect-btn-cancel`, `detect-task-status`, `detect-token-input`, `detect-refresh-caps`

### STFT data-testids

`main-chart-host` (`data-dsp-source`), `dsp-source-chip`, `status-dsp-source`

## Package

`@wss/web` deps: `@wss/charts`, `@wss/project-io`, `@wss/contracts`, `@wss/dsp-wasm`, `@wss/file-io`. Worktree only.
