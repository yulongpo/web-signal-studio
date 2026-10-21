# UI 对等差距审计（只读）

| 字段 | 值 |
|------|-----|
| 时间（Asia/Shanghai） | 2026-10-21 20:51:51 |
| Web tip | `be885f2dbfd9daa1b9965bf072d3cdcf69150118`（`D:\project\web_signal_studio` main） |
| 桌面参考 | `D:\project\signal_studio_rebuild` 分支 `rebuild/a143-native` |
| 远端 | https://github.com/yulongpo/signal_studio/tree/rebuild/a143-native |
| 范围 | 只读对照；未改代码、未 push |
| 方法 | 读 `app/main_window.*` / `ui/*` / UX_SPEC / ui-parity / CONTROL_INVENTORY；对照 `apps/web` 壳组件与 `@wss/charts`；本地截图 |

## 桌面目标结构（源码+验收文档）

| 区域 | 桌面事实 |
|------|----------|
| 顶栏 | 34px **菜单栏**（文件/编辑/视图/分析/工具），**无永久工具栏**、无 IQ 标签行 |
| 左侧 | 工程树：添加 IQ / 导出 / 元数据 / 标记与通道分组；默认可 ~270px，可收起 38px |
| 中央三图 | 垂直 splitter：全局时间导航 → 辅助图（波形/PSD/检测证据）→ 主图（时频/瀑布）；各图**独立图头控件条** + 最大化 |
| 主图底条 | 游标/视图范围/标记状态/「基于标记创建窄带通道」 |
| 右侧 | 四页 `contextDisplay|Detection|Annotation|Channel`，可收起；检测卡完整；参数策略 ParameterInputPolicy |
| 底部 | 结果/后台任务/日志三标签，默认收起 ~29px，展开 ~150px |
| 状态栏 | ~25px：就绪、时间、频率、文件、交互提示 |
| 窄带 | `workspaceStack` 切到 `NarrowbandWorkspace`（多页真实图表 + DDC/分析），非 stub |
| 主题 | 背景 `#0b1422` / 面板 `#121f32` / 边框 `#293f56` / 文字 `#dbe8f8`；Segoe/YaHei 12px；等宽 Consolas |

## Web 现状（be885f2）

| 区域 | Web 事实 |
|------|----------|
| 顶栏 | **无菜单栏**；`SpectrumToolbar` 单行常驻（Wideband/Narrowband/STFT/Waterfall/Wave/PSD/Open IQ/Level/Display/More） |
| 左侧 | `ProjectTree`：sample 树 + JSON paste 开/存；无原生「添加 IQ 对话框」、无完整树交互 |
| 中央 | CSS grid：global-nav **placeholder** → aux **ChartPlaceholder** → 单行 toolbar → 主图 `SpectrumChart` → status；**无 splitter 拖拽/双击复位** |
| 右侧 | 四页壳有（显示/检测/标记/通道）；显示/通道多为占位文案；检测为 local-compute 精简页；标记为 M-06 hook 面板 |
| 底部 | **缺失** 结果/任务/日志面板 |
| 窄带 | 仅 stub banner：「窄带工作区占位…不伪解调」 |
| 图表交互 | pan + wheel zoom + cursor；**无**框选放大、轴独立滚轮、右键菜单、持续标记、最大化、视图历史 |
| 视觉 | `#0f1419` 系自拟暗色；system-ui 13px；非桌面色板/密度 |

---

## 差距清单

| ID | 类别 | 差距 | 桌面证据 | Web 证据 | 严重度 |
|----|------|------|----------|----------|--------|
| G01 | 布局 | 无顶部菜单栏（文件/编辑/视图/分析/工具）；工程 IO 入口不在菜单 | `buildMenus()`；ui-parity「34px 菜单栏」 | `App.tsx` 无 menu | **P0** |
| G02 | 布局 | 常驻单行 SpectrumToolbar 取代「各图图头控件」；与桌面「无永久工具栏」冲突 | UX_SPEC「标题栏放高频控件」；ui-parity「没有永久工具栏」 | `SpectrumToolbar.tsx` 常驻 36px | **P0** |
| G03 | 布局 | 全局时间导航为 placeholder，无 PlotWidget Navigation、无滚轮缩放/拖窗/停读 | `navigationPlot`；UX_SPEC 导航图 | `global-nav` 文案 placeholder | **P0** |
| G04 | 布局 | 辅助图为 ChartPlaceholder，无真实波形/PSD/证据切换与独立 Y 轴 | `auxPlot` + `waveMode/psdMode/detectionEvidenceMode` | `ChartPlaceholder` aux slot | **P0** |
| G05 | 布局 | 三图无垂直 splitter（拖/键盘/双击恢复默认高度预算） | `graphSplitter` / `enforceLayout` | CSS `grid-template-rows` 固定比例 | **P0** |
| G06 | 布局 | 窄带工作区仅 stub，无 NarrowbandWorkspace 多页/真 DDC 图 | `NarrowbandWorkspace` + `workspaceStack` | `workspace-narrowband-stub` banner | **P0** |
| G07 | 布局 | 缺失底部「结果 / 后台任务 / 日志」面板与检测任务列表 | `bottomContent_` / `detectionPanel` | `App.tsx` 无 bottom | **P0** |
| G08 | 布局 | 左栏宽度/收起、右栏宽度与桌面断点不一致；无 PanelResizeHandle | resourceWidth 278 / property 390；收起 38px | 固定 220 / 280；右栏仅 collapse 到 48px | **P1** |
| G09 | 布局 | 缺失主图底条（游标/视图范围/基于标记创建通道） | ui-parity「主图底部 32px」 | 无对应组件 | **P1** |
| G10 | 布局 | 缺失图最大化遮罩与 Esc 手势优先级 | `toggleMaximized` / maxHost | 无 | **P1** |
| G11 | 交互 | 无框选放大（≥8px）、无轴拖拽平移隔离、无导航外单击保跨度 | chart_interaction + UI-13..15 | HeatmapCanvas 仅 pan+wheel | **P0** |
| G12 | 交互 | 无右键菜单（持续创建、视图历史 back/forward/fit/reset、遮盖标记列表） | UI-16/23/33 | 无 context menu | **P0** |
| G13 | 交互 | 无持续标记创建/移动/八控制点缩放/多选 Ctrl·Shift | AnnotationPanel + PlotWidget | M06 面板仅 hook 列表+undo/redo | **P0** |
| G14 | 交互 | 检测 ROI 工具与时间策略 ROI 未分名、无框选确认聚焦检测页 | `detectionRoiTool` / `selectDetectionRoi` | toolbar overflow「ROI」仅 `setActiveTool('select')` | **P0** |
| G15 | 交互 | 视图历史（每文件≤40）与 Esc/失焦/失捕获回滚未实现 | UI-17/18/33 | 无 | **P1** |
| G16 | 交互 | 辅助/主图模式切换未绑定真实坐标系方向规则 | UI-09/10 | 模式按钮切 store，aux 仍 placeholder | **P1** |
| G17 | 功能 | 检测页非桌面 DetectionCard：缺模型/谱型双下拉、范围来源、策略、阈值、分支/高级折叠、预检、derive/openRunSource | `detection_card.*` + CONTROL_INVENTORY | `DetectPage.tsx` token+FFSCN/SCN 按钮+banner | **P0** |
| G18 | 功能 | 显示页/通道页占位；无 SpectralSettings 弹层（Welch/Bartlett/…）与色表唯一编辑器语义 | `SpectralSettingsWidget` / settings_popover | TempLayers level/display 简化；palette 在 overflow | **P1** |
| G19 | 功能 | 工程树缺添加 IQ 对话框、导出、树内标记/通道操作、定位/重命名/删除 | `showAddFileDialog` / AnnotationPanel | ProjectTree sample + JSON paste | **P1** |
| G20 | 功能 | Open IQ 在工具栏（FSA/input），非菜单+导入对话框预览 | `SignalImportDialog` | `btn-open-iq-wav` | **P1** |
| G21 | 视觉 | 色板/字号/间距/控件密度未对齐桌面 BrandV2 | ui-parity 颜色基线；`ui/brand` | `App.css` 自拟 | **P2** |
| G22 | 视觉 | 图内边距（左88/右22/上12/下34）、色阶条占位未对齐 | ui-parity 画布边距 | charts 自有布局 | **P2** |
| G23 | 视觉 | 无品牌 lockup / 窗口无边框自定义标题栏行为 | `brand_assets` / window chrome | 浏览器原生 chrome | **P2**（Web 可部分 N/A） |
| G24 | 交互 | 物理轴有，但缺大坐标相对偏移/单位切换/负零防护的验收级行为 | UI-32 | `physicalAxis.ts` 部分有 | **P2** |

---

## 建议修复分波

### Wave P0 — 壳布局与主路径（先「看起来像」再「用起来像」）
1. **壳重排**：菜单栏（或 Web 等价 command bar）+ 取消常驻总工具栏；控件下沉到 nav/aux/main **各自图头**（ChartControlStrip 对等）。
2. **三图真实化**：导航图（时间窗）+ 辅助 Wave/PSD（可先 PSD/波形真曲线）+ 主 STFT/瀑布；垂直 splitter + `enforceLayout` 高度预算。
3. **右侧四页内容填实**：显示页（视图/网格/色阶/频率坐标）、检测卡首屏字段、标记检查器、通道摘要；保留收起。
4. **底部任务/结果/日志** 最小面板（可先接 local-compute 任务列表）。
5. **窄带**：至少用 stacked workspace 切换真实窄带图布局（可先只读演示通道，仍禁止伪解调）。

### Wave P1 — 交互手势与工程流
1. 框选放大、轴隔离滚轮/拖拽、导航保跨度、最大化、Esc 取消优先级。
2. 右键菜单 + 视图历史；持续标记与 ROI（检测 ROI ≠ 策略 ROI）。
3. DetectionCard 字段级对等 + ParameterInputPolicy；谱估计弹层。
4. 工程树：添加 IQ / 打开保存入口与桌面流程对齐（Web 用 FSA+导入向导）。

### Wave P2 — 像素级与品牌
1. 对齐 `#0b1422` 色板、12px 中文 UI、等宽坐标、图内边距与色阶条预算。
2. BrandV2 资源；响应断点收窄栏 38px。
3. 4K/150% 逻辑尺寸验收探针（Web DPR）。

---

## 截图路径

目录：`D:\project\web_signal_studio\artifacts\validation\ui-parity\baseline\`

| 文件 | 说明 |
|------|------|
| `desktop-main-window-primary.png` | 短启 a143-native W6 runtime SignalStudio 后主屏捕获（~5s，可能未完全绘满） |
| `desktop-ref-wideband-release.png` | 归档参考：宽带验收图 |
| `desktop-ref-narrowband-release.png` | 归档参考：窄带验收图 |
| `DESKTOP_SCREENSHOT_NOTE.txt` | 启动路径与说明 |
| `web-shell-default.png` | Web 默认壳 |
| `web-wideband.png` | 宽带模式 |
| `web-narrowband-stub.png` | 窄带 stub |
| `web-right-rail-detect.png` | 右栏检测页 |
| `web-right-rail-display.png` | 右栏显示页 |
| `web-right-rail-marker.png` | 右栏标记页 |
| `web-right-rail-channel.png` | 右栏通道页 |
| `web-rail-collapsed.png` | 右栏收起 |
| `web-temp-layer-level.png` | Level 临时层 |

桌面可执行文件（本轮短启）：  
`D:\project\signal_studio_rebuild\out\tasks\wideband-ux-optimization\a143-native\W6\local-builds\dependency-refusal-published\missing-models\runtime\SignalStudio.exe`

Web 进程已停（5173）。

---

## 样例数据与权重（绝对路径，未复制）

### IQ / SigMF
| 路径 | 约大小 | 备注 |
|------|--------|------|
| `D:\project\signal_studio_rebuild\resources\narrowband_demo.iq` | 1,048,576 | 窄带演示 IQ |
| `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\0000000.sigmf-data` | 3,200,000 | SigMF data |
| `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\0000000.sigmf-meta` | 1,677 | SigMF meta |
| `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\0000000.json` | — | 同目录 |
| `D:\project\01RadioAI\bin\data\spectrum_data\*.dat` | 多文件 | RadioAI 频谱落盘样例（多段） |

### 检测权重 / ONNX
| 路径 | 约大小 | 备注 |
|------|--------|------|
| `D:\project\FFSCN_train2\weights\model_epoch_0210.pth` | 11,079,751 | FFSCN pth |
| `D:\project\FFSCN_train2\FFSCN_TEST_GUI\config\epoch_1200.pth` | 11,145,701 | FFSCN TEST GUI |
| `D:\project\FFSCN_train2\FFSCN_TEST_GUI\config\epoch_1200_backbone.pth` | — | backbone |
| `D:\project\FFSCN_train2\deliverables\ffscn_release_20260908\FFSCN_60MHz_package\` | 包目录 | 发布包（含 weights） |
| `D:\project\train_SCN\SCN_pretrained\epoch_105.pth` | 29,554,583 | SCN |
| `D:\project\SCN_based_PSD_Detection\models\ffscn_17.onnx` | 12,543,958 | ffscn-17 onnx |
| `D:\project\signal_studio_rebuild\out\tasks\wideband-detection\M3\assets\controls\ffscn_17.onnx` | — | 桌面任务资产副本 |
| `D:\project\01RadioAI\bin\models\scn_model.onnx` | 156,876,574 | SCN onnx（大） |
| `D:\project\01RadioAI\bin\models\scn_model_encode_221108.onnx` 等 | — | 多处 haisignal 副本 |

---

## 结论

当前 Web（be885f2）是 **PROVISIONAL 壳 + 主图 STFT + 精简检测闸门**，与 `rebuild/a143-native` 桌面在 **壳布局、三图工作区、窄带、底部任务、标记/ROI 手势、DetectionCard** 上差距为结构性（多项 P0），不是微调。用户「完全一致」要求需按上表 P0→P1→P2 分波落地；本审计未改代码。
