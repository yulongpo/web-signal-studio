# INCREMENTAL_23c38d0 — short G01 delta (no full reopen)

| Field | Value |
|-------|-------|
| When | 2026-10-21 22:20 Asia/Shanghai |
| Web tip | **`23c38d0`** = `2d12522` + Bot-B **`06911b3`** + Bot-A `778b03b` |
| Desktop | **`17471a6`** (`rebuild/a143-native`) |
| Prior | `INCREMENTAL_3d7ab59.md` (full reopen for gestures/ROI/Level) |
| Scope | **Short incremental** — evidence-check Bot-B G01 three areas only; **full reopen NOT needed** |
| Rule | Read-only audit; **no matrix PASS**; **do not self-declare PASS** |

## Verdict

- **Full reopen: NOT needed** (no PR#3-scale host/gesture churn; only MenuBar/File/View/chrome depth on top of audited `3d7ab59`).
- **G01: stays PARTIAL** (deepened) — three prior NOT MET → **MET**; residuals keep item out of CLOSED.
- Counts unchanged vs `INCREMENTAL_3d7ab59`: **OPEN 9 · PARTIAL 13 · CLOSED 1 (G05) · DOCS 1 (G25)**. **No PASS.**

## G01 — three Bot-B areas (`06911b3`) vs desktop `17471a6`

Desktop anchors: `main_window.cpp` File (新建工程 / 打开工程文件夹 / 最近打开的工程 / 从工程移除当前文件) + View (适应全部数据 / 恢复默认视图); title BrandV2 + `windowMinimize`/`Maximize`/`Close` (ui_tests / display_optimization_capture).

| Sub-item | Prior (`3d7ab59` / `360aba7`) | Now (`23c38d0` / `06911b3`) | Evidence |
|----------|-------------------------------|-----------------------------|----------|
| Corner BrandV2 + version badge | NOT MET | **MET** | `MenuBar` `menubar-brand` `data-brand="BrandV2"`; testids `title-brand-*`; CSS `.brand-v2` |
| Window controls min/max/close | NOT MET | **MET (chrome parity)** | `data-testid="window-controls"` + `window-minimize/maximize/close`; honest browser notes (no true OS minimize/tab-close) |
| View 适应全部数据 | NOT MET | **MET** | `menu-view-fit-all` → `uiStore.fitNavToFull` (nav window = `navFullTime`) |
| View 恢复默认视图 | NOT MET | **MET** | `menu-view-restore-defaults` → `restoreDefaultNavView` (history seed + STFT/wideband) |
| File 新建工程 | NOT MET | **MET (session clear)** | `menu-new-project`; clears Web session; **not** desktop folder-wizard |
| File 打开工程文件夹 | NOT MET | **MET (honest fallback)** | `menu-open-project-folder`; Directory Picker when available, else dialog pointing to JSON/desktop |
| File 最近打开的工程 | NOT MET | **MET** | `recentProjects.ts` localStorage + submenu `menu-recent-*` / clear |
| File 从工程移除当前文件 | NOT MET | **MET** | `menu-remove-current-file`; title notes source file not deleted |

**Regression vs prior G01 PARTIAL notes:** none. Rename + View back/forward + Edit/Analysis/Help from earlier tips still present; PR#3 gesture/ROI path untouched by `06911b3`.

**Why still PARTIAL / not CLOSED / no PASS**

1. Folder **project wizard** remains desktop-only (Web: clear + picker/dialog).
2. Window controls are **chrome parity** only (browser cannot OS-minimize/close arbitrary windows).
3. Recent store keeps **JSON text** in localStorage (desktop: filesystem paths via `QSettings`), size-capped.
4. Older residual: shared SpectrumToolbar / Open IQ strip vs pure command-bar chrome (overlaps G02).

Bot-B self-note `BOT_B_G01_MENUBAR.md`: WIP / **NOT PASS** — agrees; this audit does **not** elevate to CLOSED or PASS.

Screenshots / e2e: `artifacts/validation/ui-parity/bot-b/g01-menubar-corner-controls.png`, `g01-menubar-view-fit-restore.png`, `g01-menubar-file-depth.png`; `apps/web/e2e/g01-menubar.spec.ts` case `corner BrandV2 + window controls; fit/restore; File depth`.

## Other G-ids

No status flip from this tip beyond G01 depth. G02–G04, G06, G11–G15, G19–G20, G26 remain PARTIAL as in `INCREMENTAL_3d7ab59`. OPEN set unchanged (G07–G10, G16–G18, G21–G24).

## TOP OPEN (max 8, parallel-friendly)

Ordered for next-wave scheduling (independent owners where possible):

1. **G17** — Detect UI / engine picker / REAL_RUNTIME (OPEN P0)
2. **G06** — Narrowband residual: 调制/识别/解调壳 + workbench title / STFT interact (PARTIAL; observe DDC already MET)
3. **G02** — Kill aux↔main SpectrumToolbar; strip captions + `f9f05bb` overflow (PARTIAL)
4. **G14** — Detect ROI header tool + retire `select` alias (PARTIAL near-exit)
5. **G11** — navigate-mode drag-box zoom (not only zoom-box tool) (PARTIAL)
6. **G07** — Bottom panel / markers dock parity (OPEN P0)
7. **G13** — Full mark handles + continuous create (PARTIAL)
8. **G01** residuals — folder wizard honesty / OS-chrome limits **or** **G19** project-tree depth (pick one lane)

## Explicit

**No ACCEPTANCE_MATRIX PASS. No self-declared PASS. G01 not CLOSED.**
