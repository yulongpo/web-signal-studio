# Bot-B Web UI Shell

Owner: Bot-B (`work/bot-b-web-shell`, worktree `D:\project\wss-wt-b`).

## Layout

| Region | Component / slot | Notes |
|--------|------------------|-------|
| Left | `ProjectTree` | Sample load/clear stub |
| Top of workspace | Global time nav strip | Placeholder |
| Aux chart | `data-chart-slot="aux"` | ChartPlaceholder; Bot-C fills |
| Toolbar | `SpectrumToolbar` | Primary: STFT/Waterfall, Wave/PSD, Level/Display; overflow: STFT N, palette, ROI, Mark |
| Main chart | `data-chart-slot="main"` | ChartPlaceholder; Bot-C WebGL2 |
| Bottom | `StatusBar` | Workspace / tool / cursor / file / channel |
| Right | `RightRail` | Four pages: display / detect / marker / channel |
| Overlay | `TempLayers` | Level + Display; one at a time |

## Temp layer rules

- Toggle same entry closes (reverts draft).
- Esc → revert draft + close.
- Outside mousedown → revert + close.
- Enter / Tab → commit legal draft (level requires `dynamicRangeDb > 0`).
- Opaque panel (`temp-layer-level` / `temp-layer-display`).

## Package

- App package name: `@wss/web`
- Charts embed: **do not** hard-import `@wss/charts` until Bot-C export surface is complete; use `data-chart-slot` hosts.

## Key `data-testid`s

- `app-shell`, `project-tree`, `global-nav`, `aux-chart`, `main-chart`, `spectrum-toolbar`
- `chart-aux`, `chart-main`, `data-chart-slot=aux|main`
- `btn-mode-stft`, `btn-mode-waterfall`, `btn-aux-wave`, `btn-aux-psd`
- `btn-open-level`, `btn-open-display`, `btn-toolbar-overflow`, `toolbar-overflow-menu`
- `temp-layer-level`, `temp-layer-display`
- `context-rail`, `rail-tab-{display|detect|marker|channel}`, `rail-page-{…}`, `rail-collapse`
- `status-bar`
