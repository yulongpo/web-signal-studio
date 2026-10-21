# UI 对等差距审计（Bot-A 增量复核 @ 17471a6）

| 字段 | 值 |
|------|-----|
| 时间（Asia/Shanghai） | 2026-10-21 21:30:33+（rebase `17937bb`） |
| 复核方 | Bot-A（WSS-审计A）`work/bot-a-audit` worktree |
| **Web tip（origin/main）** | **`17937bb3a735d0df7058a3714aa353a88abb0e23`**（`17937bb`；相对 `2000c1e`/`196db21` 已前进） |
| **桌面上游 tip** | **`17471a6488383b456281d12cb1a6d3d80290205d`**（`rebuild/a143-native`） |
| 先验 Bot-A 文档 | `866e699` / G01–G26（对照 Web 当时 `be885f2`、上游 `0f108d0`，本地路径证据 `696ce12`） |
| 本地 rebuild（只读） | `D:\project\signal_studio_rebuild` @ `17471a6`（fetch 后与远端一致） |
| 远端 | https://github.com/yulongpo/signal_studio/tree/rebuild/a143-native |
| 范围 | 只读对照；**未改** `apps/`/`packages/`/`services/` 实现；未在共享树 `git checkout`；不 push `signal_studio` |
| 验收约束 | **IQ 仅** `resources\sigmf_data_demo`；**模型仅** rebuild 树内 TensorRT `*.engine` |

> 可执行 PASS 矩阵见同目录 `UI_PARITY_ACCEPTANCE.md`。镜像：`docs/migration/ui-parity/`。

---

## INCREMENTAL DIFF（相对 `866e699` / 上游 `0f108d0`）

### A. 桌面自 `0f108d0` → `17471a6` 驱动的缺口变化

| 驱动 SHA | 主题 | 影响 ID | 变化类型 | 说明 |
|----------|------|---------|----------|------|
| `f9f05bb` | 分离图表导航与标签图设置 | **G02** | **加严** | `ChartControlStrip`：控件 caption 标签、overflow 重挂载保焦点、导航区与设置字段分离；Web 若仅搬全局 Toolbar 仍 FAIL，且实现图头时须对等「标签+控件」而非裸下拉 |
| `a64117e` | 窄带设置跨 overflow / 换页保留 | **G06** | **加严** | `NarrowbandWorkspace::pageChanged`；STFT N / 频率 / 网格从 MainWindow 根解析；PASS 须验证换页与 overflow 后控件值不丢 |
| `696ce12` | 显示摘要「参考/动态」 | **G18** | **加严** | `displaySummary_` 文案：`参考 {level} {unit}` + `动态 {range} dB`（禁「电平」混称）；精度 2 位 |
| `6499a64` | 图头右对齐自适应控件 | G02 | 背景 | 与 f9f05bb 同属 strip 语义；Web 图头须右对齐/自适应折叠 |
| `2e26651` | 窄带统一 plot settings | G06 | 背景 | 分析页简化；Web 窄带多页不得伪解调 |
| `c1f2cce` | 工程树信号紧凑展示 | G19 | 背景 | 当前信号/源信息澄清 |
| `db58394`/`17471a6` | chart-header-labels 证据归档 | — | 证据 | 锁定原生截图/JSON；无新控件 API |

**未新增独立 G27**：上述全部折叠进既有 G02/G06/G18/G19 的加严 PASS，避免 ID 漂移。

### B0. Web `main@17937bb` 相对 `196db21` / Bot-A `2000c1e`（本轮）

| ID | 新状态 | 证据 | 仍缺（阻止 FULL PASS） |
|----|--------|------|------------------------|
| G02 | **PARTIAL**（自 OPEN） | `App.tsx` 不再 import `SpectrumToolbar`；`AuxParamStrip`/`SpecParamStrip` 挂 aux/main 图头；`NavChrome`；e2e `bot-b-host-wiring` | `f9f05bb` caption 标签分离未满；`data-testid="spectrum-toolbar"` 仍在图头；overflow 焦点未证 |
| G03 | PARTIAL | `NavChrome` zoom/pause/segments；条高默认 82 | `NavigationChart` **无 onWheel** 改窗宽 |
| G04 | PARTIAL | `auxWaveRawIq.ts` + `AuxChartHost` Wave=`sigmf_data_demo` IqRms；非 STFT envelope | Bot-A 未跑 e2e 视觉；`/@fs` 路径依赖；PSD 仍谱图派生 |
| G05 | **CLOSED**（自 PARTIAL） | `uiStore` 82/205；`VerticalSplitter` 拖+双击；e2e `navH===82` `auxH∈{205,176}`；对齐 `enforceLayout` | 短窗阈值 Web=900 vs 桌面=850（软差，不阻 CLOSED） |

详表：`artifacts/validation/ui-parity/INCREMENTAL_17937bb.md`。

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
| OPEN | G01, G06–G10, G15–G18, G21–G24 |
| PARTIAL | **G02–G04**, G11–G14, G19–G20, G26 |
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

## Web 现状（17937bb 只读）

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
| G01 | 布局 | 无顶部菜单栏 | `buildMenus()` | 无 menubar | **P0** | OPEN | 五组菜单/命令栏；Open IQ 从菜单可达 |
| G02 | 布局 | 常驻 Toolbar 取代图头；缺标签分离 | `ChartControlStrip`+`f9f05bb` | `AuxParamStrip`/`SpecParamStrip`；无 aux↔main 常驻条 @`17937bb` | **P0** | **PARTIAL**（**加严**残留） | 无全局常驻条；补 caption+overflow 焦点（`f9f05bb`） |
| G03 | 布局 | 全局时间导航（已嵌入 NavigationChart） | `navigationPlot` | `NavChrome`+`NavigationChart` @`17937bb` | **P0** | **PARTIAL** | 真实时间窗+拖窗+chrome；补滚轮改窗宽 |
| G04 | 布局 | 辅助图 Wave/PSD（派生曲线） | `auxPlot` | `auxWaveRawIq`/`sigmf_data_demo` IqRms @`17937bb` | **P0** | **PARTIAL** | Wave/PSD 切换；Wave=raw IQ 代码已落地；待 QA 视觉 |
| G05 | 布局 | 垂直 splitter（默认已对齐 82/205） | `graphSplitter` 82/205 | `VerticalSplitter` 默认 **82/205** @`17937bb` | **P0** | **CLOSED** | 可拖+双击复位；默认对齐 82/205 |
| G06 | 布局 | 窄带 stub；设置须跨页保留 | `NarrowbandWorkspace`+`a64117e` | stub | **P0** | OPEN（**加严**） | 非 stub；换页/overflow 后 STFT N·网格·频率保留；无伪解调 |
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
G01+G02（含 strip 标签分离）→ G03–G05 → G17 → G07 → G06（含跨页保留）→ 补齐 G11–G14 PARTIAL 退出 → **G26 清 `.pth` 可选项**。

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

上游仍锚定 **`17471a6`**。Web **`17937bb`** 本轮：**G02 OPEN→PARTIAL**（Bot-B 降级常驻 Toolbar）；**G05 PARTIAL→CLOSED**（Bot-C 默认 82/205）；G04 Wave raw IQ 代码落地仍标 PARTIAL（待 QA）；G03 chrome 残差清除但仍缺滚轮。未改实现代码。详见 `INCREMENTAL_17937bb.md`。
