# UI 对等差距审计（Bot-A 复核补强）

| 字段 | 值 |
|------|-----|
| 时间（Asia/Shanghai） | 2026-10-21 21:05+ |
| 复核方 | Bot-A（WSS-审计A）`work/bot-a-audit` worktree |
| Web tip（共享 main 只读） | `be885f2dbfd9daa1b9965bf072d3cdcf69150118` |
| 桌面上游只读镜像 | `.work/upstream-readonly` @ `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af`（`rebuild/a143-native`） |
| 桌面本地可执行树（只读） | `D:\project\signal_studio_rebuild` tip `696ce12`（ahead origin 3；路径证据仍有效） |
| 远端 | https://github.com/yulongpo/signal_studio/tree/rebuild/a143-native |
| 范围 | 只读对照；**未改** `apps/`/`packages/` 实现；未 push；未在共享树 `git checkout` |
| 方法 | 复核既有 G01–G24；对照 `app/main_window.*`、`ui/*`、`docs/acceptance/ui-parity.md`、a143-native CONTROL_INVENTORY；对照 `apps/web` + `@wss/charts`；为每条补可执行 PASS |
| 验收约束 | **IQ 仅** `resources\sigmf_data_demo`；**模型仅** rebuild 树内 TensorRT `*.engine`（见文末 Acceptance Constraints） |

> 本文件在既有 baseline `UI_PARITY_GAP_AUDIT.md`（G01–G24）上独立复核补强。可执行 PASS 矩阵见同目录 `UI_PARITY_ACCEPTANCE.md`。

## 桌面目标结构（源码证据）

| 区域 | 桌面事实 | 关键证据 |
|------|----------|----------|
| 顶栏 | 34px 菜单栏（文件/编辑/视图/分析/帮助）；**无永久工具栏**、无 IQ 标签行 | `MainWindow::buildMenus()`；`menuBar()->setFixedHeight(34)`；`docs/acceptance/ui-parity.md` |
| 左侧 | 工程树 ~278px；收起 38px；添加 IQ / 导出 / 元数据 / 标记与通道 | `resourceWidth_ = 278`；`showAddFileDialog` |
| 中央三图 | `graphSplitter`：`navigationPlot` → `auxPlot` → 主图；各图独立 `ChartControlStrip` + 最大化 | `main_window.cpp` objectName；`ui/chart_control_strip.h` |
| 主图底条 | 游标/视图范围/标记状态/「基于标记创建窄带通道」 | `docs/acceptance/ui-parity.md`「主图底部 32px」；UI-28 |
| 右侧 | 四页 `contextDisplay|Detection|Annotation|Channel` | `inspectorIds` in `main_window.cpp` |
| 底部 | `bottomContent_`：`resultTab`/`taskTab`/`logTab`（+ DetectionPanel）；默认收起 ~29px / 展开 ~150px | `bottomContent_`；UI-04 |
| 状态栏 | 25px Consolas；就绪 + 交互提示 | `statusBar()->setFixedHeight(25)` |
| 窄带 | `workspaceStack` ↔ `NarrowbandWorkspace` 多页 | `ui/narrowband_workspace.h`；`workspaceStack_` |
| 检测 | `DetectionCard`：model/spectrumMode/rangeKind/strategy/branches/advanced + `ParameterInputPolicy` | `ui/detection/detection_card.h` |
| 主题 | `#0b1422` / `#121f32` / `#293f56` / `#dbe8f8`；12px | ui-parity + BrandV2 |

## Web 现状（be885f2 只读）

| 区域 | Web 事实 | 关键证据 |
|------|----------|----------|
| 顶栏 | **无菜单栏**；`SpectrumToolbar` 常驻 36px | `App.tsx`；`SpectrumToolbar.tsx`；`App.css` `grid-template-rows: 36px …` |
| 左侧 | `ProjectTree` sample/JSON paste；宽 220px | `ProjectTree.tsx`；`App.css` `220px 1fr 280px` |
| 中央 | `global-nav` placeholder；aux=`ChartPlaceholder`；主图 `MainChartHost`/`SpectrumChart`；**无 splitter** | `App.tsx` `data-testid="global-nav"` / `chart-aux` |
| 右侧 | 四页壳；display/channel 占位文案；detect=`DetectPage`；marker=`M06MarksPanel` | `RightRail.tsx` |
| 底部 | **缺失** 结果/任务/日志 | `App.tsx` 无 bottom |
| 窄带 | stub banner | `workspace-narrowband-stub` |
| 图表交互 | HeatmapCanvas：pan + wheel zoom；无框选/右键/历史/最大化 | `packages/charts/.../HeatmapCanvas.tsx` |
| 视觉 | `#0f1419` 自拟；system-ui | `App.css` |

---

## 差距清单（复核后）

图例：严重度 P0=阻塞「看起来/用起来像」主路径；P1=交互/工程流；P2=像素/品牌。WEB「MISSING」=无对等组件/testid。

| ID | 类别 | 差距 | 桌面证据 | Web 证据 | 严重度 | PASS 摘要（详见 ACCEPTANCE） |
|----|------|------|----------|----------|--------|------------------------------|
| G01 | 布局 | 无顶部菜单栏；工程 IO 不在菜单 | `buildMenus()`；菜单 文件/编辑/视图/分析/帮助 | `App.tsx` 无 menu / menubar testid | **P0** | 存在 menubar（或 Web command-bar 等价）含五组入口；Open IQ 从菜单可达 |
| G02 | 布局 | 常驻 SpectrumToolbar 取代各图图头控件 | ui-parity「没有永久工具栏」；`ChartControlStrip` | `SpectrumToolbar.tsx` 常驻 | **P0** | 取消全局常驻总工具栏；nav/aux/main 各有图头控件条 |
| G03 | 布局 | 全局时间导航为 placeholder | `navigationPlot` | `global-nav` placeholder | **P0** | 真实时间导航；滚轮/拖窗；加载 sigmf_data_demo 后非纯文案 |
| G04 | 布局 | 辅助图 ChartPlaceholder | `auxPlot` wave/psd/evidence | `ChartPlaceholder` `chart-aux` | **P0** | Wave/PSD 真实曲线；切换改坐标系 |
| G05 | 布局 | 无垂直 splitter / enforceLayout | `graphSplitter`；`enforceLayout`；UI-07 | CSS 固定 rows | **P0** | 可拖改高；双击复位桌面预算 |
| G06 | 布局 | 窄带仅 stub | `NarrowbandWorkspace` + `workspaceStack` | `workspace-narrowband-stub` | **P0** | stacked workspace 非 stub；禁止伪解调 |
| G07 | 布局 | 缺底部结果/任务/日志 | `bottomContent_` tabs | `App.tsx` 无 bottom | **P0** | 三标签；展开~150/收起~29；可列任务 |
| G08 | 布局 | 左右栏宽度/收起不一致 | 278/390；收起 38px | 220/280；收起 48px | **P1** | 左~270–278、右~390±8；收起~38；可拖 |
| G09 | 布局 | 缺主图底条 | ui-parity 32px；UI-28 | MISSING | **P1** | 游标/范围/标记状态；基于标记创建通道 |
| G10 | 布局 | 缺最大化与 Esc 优先级 | `toggleMaximized`；UI-08 | MISSING | **P1** | 最大化/恢复；Esc 优先取消创建 |
| G11 | 交互 | 无框选放大/轴隔离/导航保跨度 | UI-13..15 | HeatmapCanvas pan+wheel | **P0** | ≥8px 框选放大；轴滚轮隔离；导航单击保跨度 |
| G12 | 交互 | 无右键菜单 | UI-16/23/33 | MISSING | **P0** | 持续创建/历史/fit/reset/遮盖标记列表 |
| G13 | 交互 | 无持续标记创建/控制点/多选 | AnnotationPanel | M06 仅 hook+undo/redo | **P0** | 拖拽创建；控制点；Ctrl/Shift 多选 |
| G14 | 交互 | 检测 ROI 未分名、无确认条 | `detectionRoiTool_`；confirmation | ROI→`setActiveTool('select')` | **P0** | 独立检测 ROI；Enter/Esc 确认条；聚焦检测页 |
| G15 | 交互 | 无视图历史与回滚 | UI-17/18/33；≤40 | MISSING | **P1** | back/forward；每文件≤40；Esc/失焦回滚 |
| G16 | 交互 | 模式未绑真实坐标规则 | UI-09/10 | store 切、aux 仍 placeholder | **P1** | Wave/PSD/STFT/Waterfall 轴规则正确 |
| G17 | 功能 | DetectPage ≠ DetectionCard | `detection_card.h` 双下拉+strategy/branches | DetectPage 精简闸门 | **P0** | 字段级对等；模型仅树内 `.engine` |
| G18 | 功能 | 显示/通道占位；无 SpectralSettings | `SpectralSettingsWidget` | RightRail 占位文案 | **P1** | 显示页填实；Welch/Bartlett 弹层；通道摘要 |
| G19 | 功能 | 工程树缺添加 IQ 与树操作 | `showAddFileDialog` | sample+JSON paste | **P1** | 导入向导；定位/重命名/删除 |
| G20 | 功能 | Open IQ 在工具栏 | `SignalImportDialog` | `btn-open-iq-wav` | **P1** | 菜单入口+预览；默认 `sigmf_data_demo` |
| G21 | 视觉 | 色板/字号未对齐 | BrandV2 / ui-parity | `#0f1419` | **P2** | hex/12px/Consolas 对齐 |
| G22 | 视觉 | 图内边距未对齐 | 88/22/12/34；色阶右70 | charts 自有 | **P2** | inset ±2px；色阶右边距70 |
| G23 | 视觉 | 无品牌 lockup | brand corner | 浏览器 chrome | **P2** | 顶栏 BrandV2；系统标题栏可 N/A |
| G24 | 交互 | 相对偏移/单位/负零不足 | UI-32 | `physicalAxis.ts` 部分 | **P2** | 单位/相对偏移；无 -0 |
| G25 | 功能 | 状态栏语义偏离（dsp/fft 诊断挤占） | 25px 就绪+提示 | `StatusBar.tsx` 含 dsp/fft/project | **P2** | ≈25px；就绪/时/频/文件/提示为主 |
| G26 | 约束 | 验收 IQ/模型路径门禁 | CAO 约束；树内 `.engine` | 旧基线含 RadioAI/.pth/onnx | **P0** | 仅 `sigmf_data_demo` + 树内 `.engine` |

---

## 建议修复分波

### Wave P0
壳重排（G01/G02）→ 三图+splitter（G03–G05）→ DetectionCard（G17）→ 底栏（G07）→ 窄带（G06）→ 框选/右键/ROI（G11/G12/G14）→ **门禁 G26**。

### Wave P1
G10/G15/G09/G19/G20/G18/G08/G16。

### Wave P2
G21/G22/G23/G24/G25。

---

## Acceptance Constraints（强制）

1. **IQ**：仅 `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\`（`0000000.sigmf-data` / `.sigmf-meta` / `.json`）。
2. **模型**：仅 rebuild 树内 TensorRT `*.engine`。`.pth` / 树外 `.onnx` 不得计入 PASS。
3. **上游锚点**：功能对等以 `0f108d0` 为准；本地 `696ce12` 仅路径/微调参考。

## 截图路径（共享树只读，未复制）

`D:\project\web_signal_studio\artifacts\validation\ui-parity\baseline\`

## 结论

Web（`be885f2`）仍为 PROVISIONAL 壳 + 主图 STFT + 精简检测闸门。相对 a143-native，多项 P0 为结构性差距。本轮新增 **G25**（状态栏）与 **G26**（验收门禁）。PASS 细节见 `UI_PARITY_ACCEPTANCE.md`。未改实现代码。