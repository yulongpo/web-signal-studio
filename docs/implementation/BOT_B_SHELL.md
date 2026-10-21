# Bot-B Web UI Shell

Owner: Bot-B (`work/bot-b-web-shell`, worktree `D:\project\wss-wt-b`).

## Layout

| Region | Component / slot | Notes |
|--------|------------------|-------|
| Left | `ProjectTree` | Sample stub **or** `@wss/project-io` open/save |
| Top of workspace | Global time nav strip | Placeholder |
| Aux chart | `data-chart-slot="aux"` | ChartPlaceholder; Bot-C fills |
| Toolbar | `SpectrumToolbar` | Primary + overflow |
| Main chart | `data-chart-slot="main"` | MainChartHost -> @wss/charts SpectrumChart |
| Bottom | `StatusBar` | Workspace / tool / cursor / file / channel |
| Right | `RightRail` | display / **detect** / marker / channel |
| Overlay | `TempLayers` | Level + Display |

## Project IO (`@wss/project-io`)

- Open: paste JSON or file input.
- Uses `openProjectFromJsonText` / `summarizeLoadedProject` / `saveProjectToJsonText`.
- Open failure shows `project-error`; shell stays up.
- Sample tree remains fallback.
- Sample indexes: decimal strings only.

## Detection page (`DetectPage`)

Follows `services/local-compute/docs/DETECTION_PAGE_CONTRACT.md`.

- Base URL: `VITE_LOCAL_COMPUTE_URL` or `http://127.0.0.1:8765`.
- Token: `VITE_LOCAL_COMPUTE_TOKEN` / session field.
- `GET /capabilities` gates FFSCN/SCN; prefer `uiMessages.zh`.
- `POST /tasks` + poll + cancel; never invent candidates.
- Offline/401: disabled buttons, no fake results.

### detect data-testids

`detect-page`, `detect-capabilities-banner`, `detect-btn-ffscn`, `detect-btn-scn`, `detect-btn-cancel`, `detect-task-status`, `detect-token-input`, `detect-refresh-caps`

## Package

`@wss/web` deps: `@wss/charts`, `@wss/project-io`, `@wss/contracts`. Worktree only.
