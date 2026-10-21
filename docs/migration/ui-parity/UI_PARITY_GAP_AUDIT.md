# UI 对等差距审计（Bot-A 增量复核 @ 17471a6）

| 字段 | 值 |
|------|-----|
| 时间（Asia/Shanghai） | 2026-10-21 21:58:00（rebase `62d3b70` G01 menus + G shots） |
| 复核者 | Bot-A（WSS-审计A）`work/bot-a-audit` worktree |
| **Web tip（origin/main）** | **`62d3b70cae428e9161535e2cf908a27cf2bc82d4`**（B `e76ba97` 菜单 + G `c718171` 截图 + A `593948d`） |
| **桌面上游 tip** | **`17471a6488383b456281d12cb1a6d3d80290205d`**（`rebuild/a143-native`） |
| 先验 Bot-A 文档 | `INCREMENTAL_ef2713a.md` / `593948d`；本轮 `INCREMENTAL_62d3b70.md` |
| 本地 rebuild（只读） | `D:\project\signal_studio_rebuild` @ `17471a6` |
| 远端 | https://github.com/yulongpo/signal_studio/tree/rebuild/a143-native |
| 范围 | 只读对照；**未改** `apps/`/`packages/`/`services/` 实现；未在共享树 `git checkout`；不 push `signal_studio` |
| 验收约束 | **IQ 仅** `resources\sigmf_data_demo`；**模型仅** rebuild 树内 TensorRT `*.engine` |

> 可执行 PASS 矩阵见同目录 `UI_PARITY_ACCEPTANCE.md`。镜像：`docs/migration/ui-parity/`。
> **Explicit: Bot-A 不自报矩阵 PASS。**

---

## INCREMENTAL @ `62d3b70`（相对 `ef2713a`）

| ID | 先前 | @62d3b70 | 证据 |
|----|------|----------|------|
| **G01** | PARTIAL（仅 File+View） | **PARTIAL 加深** | `e76ba97`：Edit/Analysis/Tools/Help 组+testid；corner/rename/File 深度仍缺；Bot-B WIP **no PASS** |
| **G06** | PARTIAL（observe DDC MET） | **PARTIAL 不变** | `c718171`/`qa/web-905cdad` 强化非空 DDC；截图不 CLOSED；mod/DL/demod 仍壳 |
| G20 | PARTIAL | PARTIAL（加深） | 菜单 Open IQ 已有；元数据预览仍缺 |
| 其余 | 同前 | **不变** | 本 tip 无对应实现 diff；截图不升格 |

计数：**OPEN 10 · PARTIAL 12 · CLOSED 1（G05）· DOCS 1（G25）**。详表：`INCREMENTAL_62d3b70.md`。

---

## INCREMENTAL DIFF（相对 `866e699` / 上游 `0f108d0`）

### A. 桌面自 `0f108d0` → `17471a6` 驱动的缺口变化

| 驱动 SHA | 主题 | 影响 ID | 变化类型 | 说明 |
|----------|------|---------|----------|------|
| `f9f05bb` | 分离图表导航与标签图设置 | **G02** | **加严** | `ChartControlStrip`：控件 caption 标签、overflow 重挂载保焦点、导航区与设置字段分离；Web 若仅搬全局 Toolbar 仍 FAIL，且实现图头时须对等「标签+控件」而非裸下拉 |
| `a64117e` | 窄带设置跨 overflow / 换页保留 | **G06** | **加严** | `NarrowbandWorkspace::pageChanged`；STFT N / 频率 / 网格从 MainWindow 根解析；PASS 须验证换页与 overflow 后控件值不丢 |
| `696ce12` | 显示摘要「参考/动态」 | **G18** | **加严** | `displaySummary_` 文案：`参考 {level} {unit}` + `动态 {range} dB`（禁「电平」混称）；精度 2 位 |
| `6499a64` | 图头右对齐自适应控件 | G02 | 背景 | 与 f9f05bb 同属 strip 语义；Web 图头须右对齐/自适应折叠 |
| 2e26651 | 窄带统一 plot settings | G06 | 加严 | 分析页简化；Web 窄带多页无伪解调 |
| `c1f2cce` | 工程树信号紧凑展示 | G19 | 背景 | 当前信号/源信息澄清 |
| `db58394`/`17471a6` | chart-header-labels 证据归档 | — | 证据 | 锁定原生截图/JSON；无新控件 API |

**未新增独立 G27**：上述全部折叠进既有 G02/G06/G18/G19 的加严 PASS，避免 ID 漂移。

### B0. Web `main@62d3b70`（G01 menus + G shots；相对 `ef2713a`）

> 完整增量：`INCREMENTAL_62d3b70.md`。G01 PARTIAL 加深；G06 PARTIAL 不变；**no PASS**。

### B0z. Web `main@ef2713a`（历史）（G01+G06；相对 `fb2e020`）（G06 壳 `6c17a53` + 截图；相对 `fb2e020`）

> 完整增量：`INCREMENTAL_ef2713a.md（相对 d8297d1；观察页 DDC MET） / 历史 `INCREMENTAL_d8297d1.md``。截图包 `qa/web-6c17a53/`（stub=false，**no PASS**）。**G06 = PARTIAL（非 CLOSED）**。

### B0b. Web `main@fb2e020`（历史） 相对 `17937bb` / Bot-A `1be860d`（本轮截图 rebase）

| ID | 状态 | 代码（`17937bb`） | 截图 / COMPARISON_NOTES |
|----|------|-------------------|-------------------------|
| G01 | OPEN→**PARTIAL @d8297d1** | was no menubar | `MenuBar` 34px File+View+Open IQ；缺编辑/分析/帮助 → PARTIAL |
| G02 | PARTIAL | Toolbar demoted | COMPARISON_NOTES #3：截图不闭 chrome |
| G03 | PARTIAL | NavChrome+NavigationChart | `02-tri-chart-hosts`；滚轮仍缺 |
| G04 | PARTIAL | raw IQ 代码路径 | `05-aux-wave-or-psd`；Bot-G 未 PASS |
| G05 | **CLOSED** | 82/205+拖+双击 | hosts/splitters 可见；CLOSED 仍以代码为准 |
| G06 | OPEN->**PARTIAL @6c17a53**; **DDC sub MET @ef2713a** | was stub @fb2e020 | observe-page real Worker DDC; mod/DL/demod still shell; not CLOSED |
| G17 | OPEN | Detect 精简 | `08-rail-detect` 页级；engine picker 未验 |
| G25 | DOCS | StatusBar | ~28px+文件名；无 gesture-hint |
| G26 | PARTIAL | demo IQ | 捕获加载 `0000000`；Detect `.engine` 列表未验 |

详表：`INCREMENTAL_fb2e020.md`；证据：`qa/COMPARISON_NOTES.md`。

### B. Web `main@563458a` 相对 `866e699` 基线已闭合 / 部分闭合

| ID | 新状态 | 证据（origin/main） | 仍缺 |
|----|--------|---------------------|------|
| G11 | **PARTIAL** | `HeatmapCanvas`：`wheelModel="desktop-axis"`、`gesture` pan\|box；`MainChartHost` 接入 | 框选→**视图放大**（navigate 态）；导航区单击保 span；完整轴热区隔离验收 |
| G12 | **PARTIAL** | `MainChartHost` `onContextMenu` + `data-testid="chart-context-menu"` | 持续创建开关、视图 back/forward/fit/reset、重叠标记列表未齐 |
| G13 | **PARTIAL** | marker 工具 + box → `__wssM06.addManualMark` | 控制点拖改、Ctrl/Shift 多选、与列表双向一致 |
| G14 | **PARTIAL** | `activeTool==='select'` box→ROI；Enter 写入并 `setRightPage('detect')`；Esc 取消 | 独立「检测 ROI」命名入口；确认条 UI；与泛 select 语义分离 |
| G19 | **PARTIAL** | `packages/project-io`：`importSigmfStream`、`engineeringTreeFromProject`、`demo-iq-paths` allowlist；Bot-F 证据 | `ProjectTree` 仍 sample/JSON 优先；未完整接线工程树操作 |
| G20 | **PARTIAL** | SigMF 导入流 + demo 路径门禁 | 菜单/命令栏入口仍缺；SpectrumToolbar `btn-open-iq-wav` 仍在 |
| G25 | **DOCS** | Bot-G `QA_CHECKLIST` 已 fold G25 | StatusBar 实现语义仍偏 dsp/fft |
| G26 | **PARTIAL→近 CLOSED（后端/文档）** | Bot-E `ae69401` TRT `.engine` under rebuild；`demo-iq-paths`；QA PRE-2/3 | Detect UI 须只暴露树内 `.engine`；`model_layout` 仍枚举 `.pth`/`.onnx` 文件类型 → 不得作为 PASS 可选项 |

**仍 OPEN（无实质壳层闭合）**：G01–G10、G15–G18、G21–G24（G18 因桌面加严更关键）。

### C. 状态计数（本轮）

| 状态 | IDs |
|------|-----|
| OPEN | G07–G10, G15–G18, G21–G24 |
| PARTIAL | **G01**, G02–G04, **G06**, G11–G14, G19–G20, G26 |
| DOCS-only / 实现仍偏 | G25 |
| CLOSED | **G05** |

总数仍 **26**；P0 仍 14 条 ID，但 G11–G14/G26 可分波验收「PARTIAL 退出条件」见 ACCEPTANCE。

---

## 桌面目标结构（源码证据 @ 17471a6）

| 区域 | 桌面事实 | 关键证据 |
|------|----------|----------|
| 顶栏 | 34px 菜单栏；**无永久工具栏** | `MainWindow::buildMenus()` |
| 图头 | 每图 `ChartControlStrip`；标签与导航分离；overflow 保编辑 | `ui/chart_control_strip.h` @ `f9f05bb` |
| 左侧 | 工程树 ~278px；当前信号紧凑展示 | `c1f2cce` `project_tree_presentation.h` |
| 中央三图 | `graphSplitter`：navigation / aux / main | `main_window.cpp` |
| 右侧显示摘要 | `参考 …` / `动态 … dB` | `updatePropertyContext` @ `696ce12` |
| 窄带 | `NarrowbandWorkspace` + `pageChanged`；设置跨页保留 | `a64117e` |
| 检测 | `DetectionCard` + 树内 `.engine` | `ui/detection/detection_card.h` |
| 底部 | result/task/log | `bottomContent_` |

## Web 现状（`fb2e020` 只读；实现 `17937bb`）

| 区域 | Web 事实 | 关键证据 |
|------|----------|----------|
| 顶栏 | 无菜单栏；`SpectrumToolbar` 常驻 | `App.tsx` |
| 中央 | `NavChrome`+`NavigationChart` + `AuxParamStrip`+raw-IQ `WaveformChart` + `VerticalSplitter`(82/205) + `SpecParamStrip`；**无 aux↔main 常驻 SpectrumToolbar** | `App.tsx`；`NavChartHost`/`AuxChartHost`；Bot-C |
| 右侧 | 四页壳；Detect 精简闸门 | `RightRail` / `DetectPage` |
| 底部 | 缺失 | `App.tsx` |
| 窄带 | stub banner | `workspace-narrowband-stub` |
| 工程 IO | sample 树 + project-io SigMF API（未完全接线 UI） | `ProjectTree.tsx`；`packages/project-io` |
| 模型 | local-compute 指向 rebuild `.engine` | `model_layout.py`；Bot-E 证据 |

---

## 差距清单（复核后，状态列相对 866e699）

图例：严重度 P0/P1/P2。状态 OPEN / PARTIAL / DOCS。

| ID | 类别 | 差距 | 桌面证据 | Web 证据 | 严重度 | 状态 | PASS 摘要 |
|----|------|------|----------|----------|--------|------|-----------|
| G01 | 布局 | 顶栏菜单/命令栏 | `buildMenus()` height 34；文件/编辑/视图/分析/帮助 | `MenuBar.tsx` @`d8297d1`：34px + 文件/视图 + `menu-open-iq`；缺编辑/分析/帮助 | **P0** | **PARTIAL**（`62d3b70`/`e76ba97`：六组菜单；corner/rename 仍缺）| 补齐完整菜单树；不依赖 strip 作为唯一 Open IQ |
| G02 | 布局 | 常驻 Toolbar 取代图头；缺标签分离 | `ChartControlStrip`+`f9f05bb` | `AuxParamStrip`/`SpecParamStrip`；无 aux↔main 常驻条 @`17937bb` | **P0** | **PARTIAL**（**加严**残留） | 无全局常驻条；补 caption+overflow 焦点（`f9f05bb`） |
| G03 | 布局 | 全局时间导航（已嵌入 NavigationChart） | `navigationPlot` | `NavChrome`+`NavigationChart` @`17937bb` | **P0** | **PARTIAL** | 真实时间窗+拖窗+chrome；补滚轮改窗宽 |
| G04 | 布局 | 辅助图 Wave/PSD（派生曲线） | `auxPlot` | `auxWaveRawIq`/`sigmf_data_demo` IqRms @`17937bb` | **P0** | **PARTIAL** | Wave/PSD 切换；Wave=raw IQ 代码已落地；待 QA 视觉 |
| G05 | 布局 | 垂直 splitter（默认已对齐 82/205） | `graphSplitter` 82/205 | `VerticalSplitter` 默认 **82/205** @`17937bb` | **P0** | **CLOSED** | 可拖+双击复位；默认对齐 82/205 |
| G06 | layout | narrowband multi-page (stub replaced) | NarrowbandWorkspace+a64117e | NarrowbandObserveCharts+narrowbandObserveDdc @ef2713a (observe DDC MET); shell @6c17a53; mod/DL/demod still shell | **P0** | **PARTIAL** | mod/DL/demod chrome; title workbench; channel-linked/interactive STFT; item not CLOSED |
| G07 | 布局 | 缺底栏 | `bottomContent_` | 无 | **P0** | OPEN | 三标签；~29/150 |
| G08 | 布局 | 栏宽不一致 | 278/390 | 220/280 | **P1** | OPEN | 左~278 右~390；收起~38 |
| G09 | 布局 | 缺主图底条 | UI-28 | MISSING | **P1** | OPEN | 游标/范围/基于标记创建通道 |
| G10 | 布局 | 缺最大化/Esc 优先级 | UI-08 | MISSING | **P1** | OPEN | 最大化；Esc 先取消创建 |
| G11 | 交互 | 框选放大/轴隔离/导航保跨度 | UI-13..15 | desktop-axis+box 部分 | **P0** | **PARTIAL** | navigate 框选放大；轴滚轮隔离；导航单击保 span |
| G12 | 交互 | 右键菜单不完整 | UI-16/23/33 | 简易 context menu | **P0** | **PARTIAL** | 持续创建/历史/fit/reset/重叠列表 |
| G13 | 交互 | 标记控制点/多选不足 | AnnotationPanel | box→addManualMark | **P0** | **PARTIAL** | 控制点；Ctrl/Shift 多选；列表一致 |
| G14 | 交互 | 检测 ROI 未分名确认条 | `detectionRoiTool_` | select→ROI+Enter | **P0** | **PARTIAL** | 独立入口+确认条；Enter/Esc |
| G15 | 交互 | 无视图历史 | UI-17/18 | MISSING | **P1** | OPEN | back/forward；≤40 |
| G16 | 交互 | 模式轴规则 | UI-09/10 | aux placeholder | **P1** | OPEN | Wave/PSD/STFT/Waterfall 轴正确 |
| G17 | 功能 | DetectPage ≠ DetectionCard | `detection_card.h` | 精简闸门 | **P0** | OPEN | 字段级对等；仅 `.engine` |
| G18 | 功能 | 显示/通道占位；摘要语义 | `696ce12` 参考/动态 | 占位文案 | **P1** | OPEN（**加严**） | 显示页填实；摘要含「参考」「动态」 |
| G19 | 功能 | 工程树操作 | `showAddFileDialog`+`c1f2cce` | API PARTIAL / UI sample | **P1** | **PARTIAL** | 添加 IQ；定位；重命名/删除 |
| G20 | 功能 | Open IQ 入口 | `SignalImportDialog` | 工具栏+导入流 | **P1** | **PARTIAL** | 菜单入口+元数据预览；默认 demo |
| G21 | 视觉 | 色板/字号 | BrandV2 | `#0f1419` | **P2** | OPEN | hex/12px/Consolas |
| G22 | 视觉 | 图内边距 | 88/22/12/34 | 自有 | **P2** | OPEN | inset±2；色阶右70 |
| G23 | 视觉 | 品牌 lockup | brand corner | 无 | **P2** | OPEN | 顶栏 BrandV2；系统栏 N/A |
| G24 | 交互 | 相对偏移/单位/-0 | UI-32 | 部分 | **P2** | OPEN | 无 -0；可切换单位 |
| G25 | 功能 | 状态栏语义 | 25px 就绪+提示 | dsp/fft 挤占；QA 已记 | **P2** | DOCS | 就绪+t/f+文件为主 |
| G26 | 约束 | IQ/engine 门禁 | CAO | demo-iq-paths + TRT 近闭合 | **P0** | **PARTIAL** | 仅 demo IQ + 树内 `.engine` 可选 |

---

## 建议修复分波（更新）

### Wave P0
G01+G02（含 strip 标签分离）→ G03–G05 → G17 → G07 → G06 PARTIAL 收口（真图+四页 chrome）→ 补齐 G11–G14 PARTIAL 退出 → **G26 清 `.pth` 可选项**。

### Wave P1
G10/G15/G09/G19–G20 接线 / **G18 参考·动态** / G08/G16。

### Wave P2
G21–G25。

---

## Acceptance Constraints（强制）

1. **IQ**：仅 `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\`（`0000000.sigmf-data` / `.sigmf-meta` / `.json`）。
2. **模型**：仅 rebuild 树内 TensorRT `*.engine`（例：`out\vs2026-qt611-release_bin\detection-models\ffscn-gui-iq-v1\`、`...\scn-max-psd-v1\`）。`.pth` / 树外 `.onnx` 不得计入 PASS。
3. **上游锚点**：功能对等以 **`17471a6`** 为准（取代仅 `0f108d0`）。

## 截图路径（共享树只读）

`D:\project\web_signal_studio\artifacts\validation\ui-parity\baseline\`

## 结论

桌面仍 **`17471a6`**。Web tip **`ef2713a`** = G06 观察页 DDC（`a145d21`）+ 既有壳/G01；**G01 PARTIAL**；**G06 保持 PARTIAL（DDC 子项 MET）**；OPEN 10 / PARTIAL 12 / DOCS 1 / CLOSED 1=G05；**无矩阵 PASS**。详见 `INCREMENTAL_ef2713a.md`。
0d68e9/NarrowbandWorkspace.tsx）。相对 INCREMENTAL_fb2e020：**G06 OPEN→PARTIAL**（stub 已替换；真 DDC 图与四页 chrome 未 CLOSED）；OPEN 11 / PARTIAL 11 / DOCS 1 / CLOSED 1=G05。**无矩阵 PASS**。详见 INCREMENTAL_d8297d1.md。

> Bot-A 2026-10-21 21:55 Asia/Shanghai Web tip **ef2713a**: observe-page DDC criterion MET; **G06 stays PARTIAL**; G01 unchanged PARTIAL; OPEN 10 / PARTIAL 12 / DOCS 1 / CLOSED 1; see INCREMENTAL_ef2713a.md.
