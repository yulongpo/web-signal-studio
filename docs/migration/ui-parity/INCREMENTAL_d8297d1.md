# UI parity gap patch — Web `d8297d1` vs desktop `17471a6`

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 21:50:00 |
| Author | Bot-A (`work/bot-a-audit`) |
| Desktop | `rebuild/a143-native` **`17471a6`** = `17471a6488383b456281d12cb1a6d3d80290205d`（unchanged） |
| **This Web tip** | **`d8297d1`** = `d8297d140b0091a91d56b7c4d7b705a9fc3d4567`（merge Bot-B G01 MenuBar / `55f5aa8` over `95e24d0`） |
| G06 implementation | **`6c17a53`** = `6c17a53d4731ca0984b43a1e3cb837ae5c6224f7` |
| G06 screenshots | **`95e24d0`** + `qa/web-6c17a53/`（stub cleared, no PASS） |
| G01 implementation | **`f627e36`** feat menubar + merge `d8297d1` |
| Prior Bot-A | `INCREMENTAL_95e24d0.md`（G06 PARTIAL only；本文件**扩展 G01+G06**，supersede 单点焦点） |
| Scope | Evidence-check **G01 + G06**；refresh GAP/ACCEPTANCE；**no implementation edits**；截图不单独 CLOSED |

## Tip stack

| Commit | Role |
|--------|------|
| `6c17a53` | G06 NarrowbandWorkspace four-tab |
| `95e24d0` / `2509c69` | Bot-G `qa/web-6c17a53/` screenshots |
| `f627e36` | G01 MenuBar/command-bar ~34px File+View, Open IQ |
| `a8bb868` | stabilize Open IQ dsp-source poll after menubar remount |
| **`d8297d1`** | merge(bot-b): G01 MenuBar |

---

## G01 — MenuBar / command-bar

### Desktop @ `17471a6`

`app/main_window.cpp` `MainWindow::buildMenus()`：

- `menuBar()->setFixedHeight(34)`；非 native menu bar
- 菜单组：**文件 / 编辑 / 视图 / 分析 / 关于 / 帮助**
- 文件含「添加/打开信号」、打开工程 JSON/文件夹、演示工程等
- 左 brand corner + 右 controls corner

### Web evidence @ `d8297d1`

| Path | Role |
|------|------|
| `apps/web/src/components/MenuBar.tsx` | `data-testid="menubar"` + `command-bar`；`style height:34`；文件/视图 |
| `apps/web/src/App.tsx` | 渲染 `<MenuBar />` |
| `apps/web/src/App.css` | `.menubar` / `.command-bar` |
| `apps/web/e2e/g01-menubar.spec.ts` | height ±2 of 34；File/View；`menu-open-iq`；View→narrowband |
| `artifacts/validation/ui-parity/bot-b/BOT_B_G01_MENUBAR.md` | **WIP / NOT PASS** |
| `bot-b/g01-menubar-*.png` | default / file-menu / view-narrowband |

### ACCEPTANCE map（G01）

| Criterion | Evidence | Verdict |
|-----------|----------|---------|
| ① 顶栏菜单/命令栏 ~34px | `menubar` height 34；e2e ±2 | **MET** |
| ② 含文件与视图组 | `menubar-file` / `menubar-view` | **MET** |
| ③ 开/添加 IQ 从菜单可达（不唯依赖 SpectrumToolbar） | `menu-open-iq` → `openIqViaFsa` / file input | **MET** |
| 编辑/分析/帮助 全组 | Web 仅 File+View | **NOT MET** |
| 桌面 corner brand/controls 像素对等 | 有 `menubar-brand`；无完整右角控件条 | **PARTIAL chrome** |
| Bot-B 自标 | WIP，未摘 strip Open IQ | **同意 no PASS** |

### Status：**G01 OPEN → PARTIAL**

未 CLOSED：缺 编辑/分析/帮助；非完整桌面菜单树；Bot-B WIP。

---

## G06 — 窄带四页（延续 + 截图）

### Code @ `6c17a53`（仍在 `d8297d1`）

`NarrowbandWorkspace.tsx` 四 tab（信号观察/调制分析/深度学习识别/解调工作区）+ uiStore 持久化 + overflow；stub 组件移除。

### Screenshots @ `qa/web-6c17a53/`（via `95e24d0`）

| File | Note |
|------|------|
| `06-narrowband.png` | stub=false；四 tab 壳 |
| `06b` page-switch / `06c` overflow / `06d` demod | 设置保留；诚实解调文案 |
| `capture-notes.json` | `ui_parity_pass_claimed=false` |

**Strict：** 截图强化 stub 已清除，**不单独 CLOSED**。

### ACCEPTANCE map（G06）— 同前

| Criterion | Verdict |
|-----------|---------|
| 无 stub / 多页区分 / 无伪解调 / 跨页+overflow 保留 | **MET（壳+store）** |
| 真 DDC Wave/PSD/STFT；调制/识别/解调 chrome；标题「工作台」 | **NOT MET** |

### Status：**G06 保持 PARTIAL**（相对 fb2e020 OPEN→PARTIAL；本 tip 无进一步 CLOSED）

剩余子缺口：真图 Bot-D；splitter；调制/DL/解调 chrome；标签 工作区≠工作台；overflow 归属非像素对等。

---

## Counts after this patch

| 状态 | Count | IDs |
|------|-------|-----|
| OPEN | **10** | G07–G10, G15–G18, G21–G24 |
| PARTIAL | **12** | **G01**, G02–G04, **G06**, G11–G14, G19–G20, G26 |
| DOCS | **1** | G25 |
| CLOSED | **1** | G05 |

Delta vs `INCREMENTAL_95e24d0`：OPEN 11→10；PARTIAL 11→12；**G01 OPEN→PARTIAL**；G06 仍 PARTIAL；CLOSED 仍仅 G05。

### Top remaining P0

1. **G01** — 补齐编辑/分析/帮助；完整菜单树  
2. **G06** — 真 DDC 图 + 四页 chrome  
3. **G02** — f9f05bb caption/overflow 焦点  
4. **G17** — DetectionCard + engine 列表  
5. **G03/G04** — 滚轮改窗宽；raw IQ QA  
6. **G07 / G11–G14** — 底栏；框选放大；右键/标记；ROI  
7. **G26** — Detect UI 不得暴露 `.pth`

## Canonical docs

- `artifacts/validation/ui-parity/INCREMENTAL_d8297d1.md`（本文件；主交付）
- `INCREMENTAL_95e24d0.md` 保留为 G06-only 历史快照
- GAP / ACCEPTANCE baseline + `docs/migration/ui-parity/` mirrors
- `UPSTREAM_BASELINE.json` / `UPSTREAM_SYNC_LOG.md`

**Constraints：** IQ=`resources\sigmf_data_demo`；models=rebuild `*.engine` only。未改实现；未共享树 checkout。
