# Bot-B G01 deepen — corner / fit / File depth (WIP / NOT PASS)

| Field | Value |
|-------|-------|
| Status | **WIP evidence** — not ACCEPTANCE PASS |
| Base tip | `3d7ab59` (includes PR#3 gestures/ROI + `360aba7`/`ffeff52`) |
| Rebuild | `17471a6` buildMenus corner BrandV2 + 适应全部/恢复默认 + File recent/folder/remove |
| Coexist | `MainChartHost` chartGesture untouched; `viewHistory` + `recordHistory:false` retained |

## Landed

| Item | Implementation |
|------|----------------|
| Corner BrandV2 | `menubar-brand` + version badge `A1.4.3 · 交互可靠性优化`; testids `title-brand-*` |
| Window controls | Top-right `window-controls` min/max/close (fullscreen / honest notes) |
| Fit all / restore | `uiStore.fitNavToFull` / `restoreDefaultNavView`; View menu items |
| File depth | 新建工程… / 打开工程文件夹… / 最近打开的工程 / 从工程移除当前文件 |
| Recent store | `apps/web/src/recentProjects.ts` (localStorage) |

## Screenshots (this tip)

- g01-menubar-corner-controls.png
- g01-menubar-view-fit-restore.png
- g01-menubar-file-depth.png

## Residuals / non-claims

- Folder project wizard still desktop-only (Web: picker + honest dialog).
- Minimize/close are chrome parity; browser cannot OS-minimize/close arbitrary tabs.
- No ACCEPTANCE_MATRIX PASS. G01 remains PARTIAL until Bot-A re-audits.
- Avoided large MainChartHost / uiStore rewrites (only two nav helpers added).
