# UI 对等可执行验收矩阵（Bot-A 增量 @ 17471a6）

| 字段 | 值 |
|------|-----|
| 时间（Asia/Shanghai） | 2026-10-21 21:25+ |
| 对应差距清单 | `UI_PARITY_GAP_AUDIT.md`（G01–G26 + INCREMENTAL DIFF） |
| **Web tip** | **`563458a`**（`origin/main` 已核对） |
| **桌面锚点** | **`17471a6`**（`rebuild/a143-native`） |
| 先验矩阵 | `866e699`（对照 Web `be885f2` / 上游 `0f108d0`） |
| **IQ 约束** | 仅 `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\` |
| **模型约束** | 仅该 rebuild 树内 `*.engine` |

## 增量说明（相对 866e699）

1. **加严**：G02（caption/导航分离/`f9f05bb`）、G06（跨页/overflow 保留/`a64117e`）、G18（「参考」「动态」/`696ce12`）。
2. **PARTIAL 退出条件**新增于 G11–G14、G19–G20、G26（见矩阵「PARTIAL 退出」列注释）。
3. 全局 PRE 不变；G26 与 PRE-2/3 对齐 Bot-E/Bot-G 文档，但 **UI 可选项仍不得出现 `.pth`**。

## 全局前置（所有用例）

| 步骤 | PASS 条件 |
|------|-----------|
| PRE-1 启动 Web 壳 | `data-testid="app-shell"` 可见；控制台无未捕获异常 |
| PRE-2 加载 IQ | 正式入口加载 **仅** `resources\sigmf_data_demo\0000000.sigmf-*`；其他 IQ → **整次 run FAIL（G26）** |
| PRE-3 检测模型 | 可选模型 **全部** 为 rebuild 树内 `.engine`；出现树外 `.pth`/`.onnx` 作为可选项 → **FAIL（G26）** |
| PRE-4 不改桌面树 | 全程不对 `D:\project\signal_studio_rebuild` 写入 |

判定：`PASS` / `FAIL` / `BLOCKED` / `PARTIAL`（仅实现 bot 自报进度；QA 关门仍要 PASS）/ `N/A`（仅 G23 系统标题栏）。

---

## 矩阵

| ID | Sev | 状态 | 观察点 / testid | 可执行 PASS 条件（必须全部满足） | 失败信号 / PARTIAL 退出 |
|----|-----|------|-----------------|----------------------------------|-------------------------|
| G01 | P0 | OPEN | `menubar` 或 `command-bar` | ① 顶栏菜单/命令栏≈34px；② 含文件与视图组；③ 打开/添加 IQ 从菜单可达且不依赖常驻 SpectrumToolbar | 无菜单；仅靠 SpectrumToolbar 打开 |
| G02 | P0 | OPEN（加严） | `chart-strip-nav/aux/main` | ① **不存在**夹在 aux↔main 的全局常驻 SpectrumToolbar；② 三图各自图头有模式/设置；③ **控件旁有 caption 标签**（或按钮自带可见文本）；④ overflow「更多」打开后编辑中的字段不被卸载丢失焦点（对 `f9f05bb`） | 36px 常驻条；裸控件无标签；overflow 丢编辑 |
| G03 | P0 | OPEN | `global-nav` | ① PRE-2 后非 placeholder 文案；② 滚轮改窗宽；③ 拖拽平移；④ 主图时间范围跟随 | 仍显示 placeholder |
| G04 | P0 | OPEN | `chart-aux` | ① Wave 与 PSD 非 placeholder；② 切换改 Y 轴语义 | ChartPlaceholder 标题仍在 |
| G05 | P0 | OPEN | splitter handles | ① 可拖改三图高度；② 双击复位默认预算±10%；③ 填满中央列 | CSS 锁死不可拖 |
| G06 | P0 | OPEN（加严） | `workspace-narrowband-*` | ① 无 `workspace-narrowband-stub`；② 多页/多图布局；③ 无伪解调文案；④ 改 STFT N/网格/频率后切换窄带页再返回，值保留（对 `a64117e`）；⑤ overflow 折叠后再展开，值保留 | stub；换页丢设置 |
| G07 | P0 | OPEN | `bottom-panel` | ① 三标签；② 收起≈29±6 / 展开≈150±20；③ 任务列表容器可空 | 无底栏 |
| G08 | P1 | OPEN | 左右栏 | ① 左 270–286 / 右 382–398；② 收起≈38±4；③ 可拖宽 | 锁死 220/280 |
| G09 | P1 | OPEN | `main-plot-footer` | ① ≈32px；② 游标+范围；③ 基于标记创建通道可点且不自动 DDC | 无底条 |
| G10 | P1 | OPEN | maximize / Esc | ① 最大化；② 恢复；③ Esc 优先取消创建 | Esc 行为颠倒 |
| G11 | P0 | PARTIAL | 主图手势 | ① navigate 态拖框≥8px → **视图放大到该矩形**；② 轴热区滚轮只缩该轴（desktop-axis）；③ 导航单击平移且 span 不变 | **PARTIAL 退出**：仅有 desktop-axis+box 但 box 只写标记/ROI、不放大视图 |
| G12 | P0 | PARTIAL | `chart-context-menu` | ① 右键菜单；② 持续创建；③ back/forward/fit/reset；④ 重叠标记列表 | **PARTIAL 退出**：仅有菜单壳/部分项 |
| G13 | P0 | PARTIAL | 图内标记 + `m06-panel` | ① 持续创建拖拽生成；② ≥1 控制点可改；③ Ctrl/Shift 多选；④ undo/redo 一致 | **PARTIAL 退出**：仅 box 一次性写入无控制点 |
| G14 | P0 | PARTIAL | 检测 ROI + 确认条 | ① 独立「检测 ROI」入口；② 确认条；③ Enter 写入并聚焦检测页；④ Esc 取消；⑤ 与时间策略 ROI 不混 | **PARTIAL 退出**：仅 select 工具+键盘而无确认条/独立入口 |
| G15 | P1 | OPEN | 视图历史 | back/forward；单文件≤40 | 无历史 |
| G16 | P1 | OPEN | 模式轴 | STFT↔Waterfall / Wave↔PSD 轴正确 | 轴文案错或 placeholder |
| G17 | P0 | OPEN | 检测页字段 | 模型+谱型+范围+策略+分支/高级+预检+disabled；模型皆 `.engine` | 仅 token 两按钮 |
| G18 | P1 | OPEN（加严） | display / channel | ① 显示页含网格/色阶/频率坐标；② 谱估计 Welch/Bartlett；③ 通道非单句占位；④ 摘要可见 **「参考」** 与 **「动态」**（对 `696ce12`），禁单独「电平」混称主文案 | 占位；仍写「电平 x / y dB」为主 |
| G19 | P1 | PARTIAL | 工程树 | ① 添加 IQ 向导；② 定位；③ 重命名/删除确认 | **PARTIAL 退出**：仅有 project-io API / sample 树 |
| G20 | P1 | PARTIAL | 打开 IQ | ① 菜单/命令栏入口；② SigMF 元数据预览；③ 默认/推荐 `sigmf_data_demo` | **PARTIAL 退出**：仅工具栏按钮或仅后端流 |
| G21 | P2 | OPEN | 样式 | `#0b1422`/`#121f32`；中文 12px；等宽坐标 | `#0f1419`+system-ui 为主 |
| G22 | P2 | OPEN | 几何 | inset 88/22/12/34±2；色阶右 70±2 | 明显偏离 |
| G23 | P2 | OPEN | 品牌 | 顶栏 BrandV2；系统标题栏 N/A 可接受 | 完全无品牌 |
| G24 | P2 | OPEN | 轴单位 | 绝对/相对或单位可切；无 `-0` | 固定单位且出现 -0 |
| G25 | P2 | DOCS | `status-bar` | ≈25px；就绪+t/f+文件；手势提示；dsp/fft 不取代主提示 | 仅诊断字段 |
| G26 | P0 | PARTIAL | runbook / picker | ① IQ=`sigmf_data_demo`；② 模型 glob/选项限于 rebuild `*.engine`；③ 不以 RadioAI/`.pth` 为验收主路径 | **PARTIAL 退出**：后端已限路径但 UI/capabilities 仍列出 `.pth` 可选项 |

---

## Playwright 建议断言（摘录）

```text
G01: expect(page.getByTestId('menubar')).toBeVisible()
G02: expect(page.getByTestId('SpectrumToolbar')).toHaveCount(0) // or not in aux-main slot
G03: expect(page.getByTestId('global-nav')).not.toContainText('placeholder')
G06: expect(page.getByTestId('workspace-narrowband-stub')).toHaveCount(0)
G11: // after navigate box-drag: view range shrinks (not only mark written)
G14: expect(page.getByTestId('detectionRoiConfirmation')).toBeVisible()
G18: expect(page.getByTestId('display-summary')).toContainText('参考')
G18: expect(page.getByTestId('display-summary')).toContainText('动态')
G26: // fixture path === ...\resources\sigmf_data_demo\...
```

## 计数

| 项 | 数量 |
|----|------|
| 总差距 ID | **26** |
| OPEN | 16（含加严 G02/G06/G18） |
| PARTIAL | 7（G11–G14, G19–G20, G26） |
| DOCS | 1（G25） |
| P0 | 14 IDs |
| P1 | 8 |
| P2 | 4 |

## Top 5 关键（更新）

1. **G02+G01** — 壳 IA + 图头 caption/导航分离（`f9f05bb`）
2. **G03–G05** — 三图真实化与 splitter
3. **G17+G14** — DetectionCard + 检测 ROI 确认条（清 G26 `.pth`）
4. **G11–G13** — 从 PARTIAL 补齐框选放大 / 右键完整 / 控制点
5. **G06+G07** — 窄带跨页保留（`a64117e`）+ 底栏

未改实现代码；供 CAO / 实现 bot 按 ID 认领。
