# PARITY_TREE_LAYOUT_NB — 工程树 / 加信号解析 / 宽带布局字体中英 / 窄带三图 (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 08:53 Asia/Shanghai |
| Web tip | **`404dc7b`** = `404dc7b46e53d01ca6d2e85177ed581e59e02ae3` |
| Desktop | **`17471a6`** = `17471a6488383b456281d12cb1a6d3d80290205d` (read-only `D:\project\signal_studio_rebuild`) |
| Worktree | `D:\project\_wt_bot_a_audit` / `work/bot-a-audit` |
| Rule | Docs-only audit; **matrix_pass_claimed=false**; no PASS |
| IQ | only `resources\sigmf_data_demo` · models TensorRT `.engine` in rebuild · `data-native-qfiledialog=false` |
| **禁发明** | G06 eye/bitstream · G17 recognition · Multitaper/Burg · undocumented G16 enable-matrix |

User ask (two points): (1) Project tree + Add-signal/parse + broadband layout sizes/fonts/**zh-en no mix** match desktop exactly. (2) Narrowband: desktop already DDC from broadband marks; NB page = **only** time-domain waveform / power spectrum / time-freq — Web must align.

---

## 1. Desktop 对照源 (exact)

| Topic | Desktop paths @ `17471a6` |
|-------|----------------------------|
| Project tree | `ui/project_tree_presentation.h` · `app/main_window.cpp` (`QTreeWidget` / UserRoles / presentation roles Title/Detail/Badge) |
| Add signal / parse | `ui/import/signal_import_dialog.{h,cpp}` · `infrastructure/import_controller.{h,cpp}` · `infrastructure/sigmf_metadata.cpp` · `infrastructure/int16_iq_file.h` · `infrastructure/format_template_store` (via import dialog) · `MainWindow::showAddFileDialog` / `openIqAction` |
| Project persist | `infrastructure/project_store.{h,cpp}` |
| Wideband layout / splitters | `app/main_window.cpp` `graphSplitter` / `setSizes` / stylesheet `#workspace,#graphSplitter` · menuBar height **34** · brand corner |
| Fonts | `main_window.cpp` stylesheet: **Microsoft YaHei** + **Consolas** (12px-class chrome) |
| zh UI strings | Menu/buildMenus CN labels; import dialog CN; tree presentation CN-clean names |
| NB workspace | `ui/narrowband_workspace.{h,cpp}` — Observe page: panels **波形** / **功率谱(PSD)** / **时频图** + real **DDC** from mark/channel (`真实 DDC`); other pages exist on desktop but **user scope for parity = observe three charts only** |
| NB runtime shots | `artifacts/chart-regression/*narrowband*` · `docs/acceptance/chart-regression-2026-10-10/*narrowband*` (read-only refs) |
| Channel / DDC | `infrastructure/channel_processor.h` (via NB workspace includes) · Session channel from wideband mark |

---

## 2. Web status (honest @ `404dc7b`)

| Item | Status | Web cite / residual |
|------|--------|---------------------|
| **Project tree structure / roles** | **PARTIAL** | `apps/web/src/components/ProjectTree.tsx` + BottomPanel host; CN map exists but defaults still `IQ Files` / mixed muted copy; not pixel/role-exact vs `project_tree_presentation.h` |
| **Add signal UI (SignalImportDialog)** | **OPEN / PARTIAL** | **No** web `SignalImportDialog`; MenuBar/SpectrumToolbar/strip browser `<input type=file>` + `data-native-qfiledialog=false` · `data-g20=browser-picker` |
| **Signal parse (SigMF / IQ)** | **PARTIAL** | `packages/file-io` sigmf-reader/meta · `packages/project-io/src/import-sigmf-stream.ts` · demo one-click `openIqForMainChart` / E GAP9; full import-controller template/batch/preview **missing** |
| **Broadband layout sizes (splitter/menu 34 / 82·205)** | **PARTIAL** | G05 split **CLOSED** historically; MenuBar `34px` present; full Qt chrome/pixel (**G08/G21–24**) still PARTIAL/OPEN — **G21–24 not broadband-complete blockers** per prior CAO, but **user now asks exact size/font/i18n** → treat layout+font+i18n as **P0 residuals** without inventing theme |
| **Fonts (YaHei + Consolas)** | **OPEN / PARTIAL** | `App.css` uses `ui-monospace` / Cascadia / Consolas stack; **no Microsoft YaHei**; not desktop-exact |
| **zh/en labels (no mix)** | **OPEN / PARTIAL** | Menus mostly CN; residual EN: brand `Signal Studio` / `SS`, errors `IQ open failed`, tree `IQ Files` title, some testids-as-copy; **zh-en mixed = fail user bar** |
| **NB DDC from broadband mark** | **PARTIAL** | `narrowbandObserveDdc.ts` (+ mod/demod DDC files); Observe path real DDC from demo/mark; not claiming full desktop channel_processor parity |
| **NB three charts (wave / PSD / STFT)** | **PARTIAL** | `NarrowbandObserveCharts.tsx` has wave+psd+stft; layout/chrome vs desktop Observe splitter **not** pixel-closed |
| **NB extra pages (mod/demod/DL)** | **PARTIAL shell + BLOCKED invent** | Workspace still exposes 调制/解调/深度学习 tabs; eye/bitstream/recognition **BLOCKED** (correct fence). User scope: **do not invent**; prefer aligning **Observe-only** product surface to desktop three-chart — hide/demote extra pages only with CAO (no silent invent of demod/recog) |

**Counts (matrix carry, unchanged invent):** OPEN **5** · PARTIAL **18** · CLOSED **2** · DOCS **1** — this doc adds **focused residuals** above without flipping CLOSED.

---

## 3. ACTIONABLE (priority → owner)

### P0 — user two points
1. **B — i18n harden (zh-only chrome):** purge mixed EN user-visible strings (MenuBar errors, brand wordmark policy, ProjectTree default `IQ Files` → CN, empty-state copy). Keep accel Latin (Ctrl+S) OK.  
2. **B — Project tree presentation:** match `project_tree_presentation.h` Title/Detail/Badge/unread/CN cleanName; tooltips SourceToolTip; no EN leftover labels.  
3. **B+F — Add signal / parse:** F deepen SigMF/IQ parse + templates toward `import_controller`; B wire UI flow (dialog or honest multi-step) while keeping `data-native-qfiledialog=false` (browser picker ≠ claim native). Target: parity of **fields/parse results**, not fake Qt dialog pixels.  
4. **B — Fonts:** App shell font stack → desktop **Microsoft YaHei** (UI) + **Consolas** (mono/data) with fallbacks; sizes align 12px-class chrome.  
5. **B/C — Broadband layout sizes:** audit MenuBar 34 / graphSplitter ratios / strip 28 / bottom dock vs `main_window` stylesheet; C only if chart host min-sizes involved.  
6. **C — NB Observe three-chart layout:** wave / PSD / time-freq splitter + axis labels vs `narrowband_workspace.cpp` Observe page (`波形` / PSD / `时频图`); linked cursors within observe.  
7. **D — NB DDC from broadband mark:** ensure observe DDC input = active wideband mark/channel (desktop session channel); honest status `真实 DDC` vs failure; **no** Multitaper/Burg invent.  

### P1
8. **B — NB page surface policy (CAO):** confirm whether Web should **hide** mod/demod/DL tabs to match user “ONLY three charts” or keep BLOCKED shells — **do not invent** G06/G17 content.  
9. **G — shots:** tree + import + NB observe three-pane vs rebuild runtime PNGs (`artifacts/chart-regression/*narrowband*`).  

### BLOCKED (do not schedule invent)
- G06 eye/bitstream · G17 recognition scores/engine · Multitaper/Burg · G16 enable-matrix without desktop docs · fake native QFileDialog · non-demo IQ paths outside `sigmf_data_demo`

---

## 4. Minimal acceptance (no fake PASS)

**Tree / import / layout**
1. Tree nodes/labels/badges CN-only match desktop presentation roles on demo project.  
2. Add signal → parse SigMF demo → tree+main STFT update; stamps keep `data-native-qfiledialog=false`.  
3. Fonts YaHei+Consolas (or documented fallback); no zh-en mixed **user-visible** chrome.  
4. Layout sizes within agreed tolerance of desktop splitters/menu 34 (screenshot side-by-side).

**Narrowband**
5. From broadband mark → NB Observe shows **waveform + PSD + time-freq** fed by DDC; status honest.  
6. Side-by-side vs desktop NB runtime shots; **no** eye/bitstream/recognition invent.

**Claims:** may say floor PARTIAL/MET per item — **never** `matrix_pass_claimed=true`.

---

## 5. Claims

| Claim | Value |
|-------|-------|
| **matrix_pass_claimed** | **false** |
| **ui_parity_pass_claimed** | **false** |
| **pass_claimed** | **false** |

## Paths
- Canonical: `docs/acceptance/evidence/bot-a/PARITY_TREE_LAYOUT_NB.md`  
- Mirror: `artifacts/validation/ui-parity/PARITY_TREE_LAYOUT_NB/`