# UI 对等可执行验收矩阵（Bot-A）

| 字段 | 值 |
|------|-----|
| 时间（Asia/Shanghai） | 2026-10-21 21:05+ |
| 对应差距清单 | `UI_PARITY_GAP_AUDIT.md`（G01–G26） |
| Web tip | `be885f2`（共享 main 只读对照） |
| 桌面锚点 | upstream-readonly `0f108d0` / 本地 rebuild `696ce12`（只读） |
| 观察方式 | 人工目视 + Playwright/testid（若已挂）+ 必要时对照桌面同操作 |
| **IQ 约束** | 仅 `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\` |
| **模型约束** | 仅该 rebuild 树内 `*.engine` |

## 全局前置（所有用例）

| 步骤 | PASS 条件 |
|------|-----------|
| PRE-1 启动 Web 壳 | `data-testid="app-shell"` 可见；控制台无未捕获异常 |
| PRE-2 加载 IQ | 通过正式打开入口加载 **仅** `resources\sigmf_data_demo\0000000.sigmf-*`；状态栏/`status-file` 反映该文件；使用其他 IQ 路径 → **整次 run FAIL（G26）** |
| PRE-3 检测模型（若测 G14/G17） | 可选模型列表 **全部** 解析自 rebuild 树内 `.engine`；出现树外 `.pth`/`.onnx` 作为可选项 → **FAIL（G26）** |
| PRE-4 不改桌面树 | 全程不对 `D:\project\signal_studio_rebuild` 写入 |

判定列：`PASS` / `FAIL` / `BLOCKED`（缺依赖）/ `N/A`（Web 明确豁免，仅 G23 系统标题栏）。

---

## 矩阵

| ID | Sev | 观察点 / testid（建议） | 可执行 PASS 条件（必须全部满足） | 失败信号 |
|----|-----|-------------------------|----------------------------------|----------|
| G01 | P0 | `menubar` 或 `command-bar`；菜单项「文件/编辑/视图/分析/帮助」 | ① 顶栏存在菜单或 Web 命令栏，高度视觉≈34px；② 至少含文件与视图组；③ 「打开/添加 IQ」从菜单可达且不依赖常驻 SpectrumToolbar | 无菜单；仅靠 SpectrumToolbar 打开文件 |
| G02 | P0 | `chart-strip-nav` / `chart-strip-aux` / `chart-strip-main` | ① **不存在**夹在 aux↔main 的全局常驻 SpectrumToolbar；② 三图各自图头有模式/设置控件；③ Wideband/STFT/Waterfall 等入口位于对应图头 | `SpectrumToolbar` 仍 36px 常驻独占一行 |
| G03 | P0 | `global-nav` | ① 加载 PRE-2 后导航区显示时间序列/窗，而非纯「placeholder」文案；② 滚轮改变窗宽；③ 拖拽平移时间窗；④ 窗变化反映到主图时间范围 | 仍显示 `Global time nav (placeholder)` |
| G04 | P0 | `chart-aux`；aux 模式切换 | ① Wave 与 PSD 均能显示非 placeholder 曲线；② 切换模式后 Y 轴语义变化（时域幅度 vs 功率谱）；③ 无「Bot-C placeholder」类字幕 | `ChartPlaceholder` 标题仍在 |
| G05 | P0 | 垂直 splitter handles | ① 三图之间可拖拽改变高度；② 双击分隔条恢复默认预算（导航≈82、辅助≈205 逻辑 px，或文档等价 ±10%）；③ 总高度仍填满中央区 | 高度仅 CSS 固定比例、不可拖 |
| G06 | P0 | `workspace-narrowband-*`（非 stub） | ① 切到窄带后 **不出现** `workspace-narrowband-stub`；② 出现多页/多图窄带布局（可只读）；③ UI 文案或行为均不宣称已解调/星座/眼图（无伪解调） | stub banner 仍在 |
| G07 | P0 | `bottom-panel`；`tab-result`/`tab-task`/`tab-log` | ① 底栏三标签存在；② 默认收起高度≈29±6px，展开≈150±20px；③ 任务页可渲染任务列表容器（可为空） | `App` 无底栏节点 |
| G08 | P1 | 左/右栏；resize handle | ① 默认左宽 270–286px、右宽 382–398px；② 收起目标≈38±4px；③ 存在拖拽改宽 | 锁死 220/280；收起 48px 无拖拽 |
| G09 | P1 | `main-plot-footer` | ① 主图下≈32px 条；② 显示游标读数与当前视图范围；③ 有活动标记时「基于标记创建窄带通道」可点且不自动跑 DDC | 无底条 |
| G10 | P1 | 图头 maximize；Esc | ① 最大化后仅该图占中央；② 再点或 Esc 恢复条带；③ 创建手势进行中按 Esc **先**取消创建，不直接退出最大化（对等 UI-08） | 无最大化；Esc 行为颠倒 |
| G11 | P0 | 主图指针手势 | ① 拖出对角线≥8px 的框选后视图放大到该矩形；② 在轴热区滚轮只缩放该轴；③ 导航区单击平移且 span 不变 | 仅整图 pan+wheel |
| G12 | P0 | 主图 `contextmenu` | ① 右键弹出菜单；② 含持续创建开关；③ 含视图 back/forward/fit/reset；④ 重叠标记时有可选列表 | 浏览器默认菜单或无菜单 |
| G13 | P0 | 图内标记 + `m06-panel` | ① 持续创建拖拽生成标记并出现在列表；② 选中后可见≥1 控制点并可改大小/位置；③ Ctrl/Shift 多选；④ undo/redo 与图内一致 | 仅 hook 列表、图上不能画 |
| G14 | P0 | `detectionRoiTool`；确认条 | ① 独立「检测 ROI」入口（非泛化 select）；② 框选后确认条出现；③ Enter 写入 ROI 并聚焦检测页；④ Esc 取消且不改 ROI；⑤ 与时间策略 ROI 控件不同名 | ROI 只 `setActiveTool('select')` |
| G15 | P1 | 视图历史 | ① 至少 2 次缩放后 back 回到前态；② forward 可用；③ 单文件历史条数上限 40（第 41 次丢最旧或等价） | 无历史 |
| G16 | P1 | 模式切换后坐标 | ① STFT↔Waterfall 主图轴映射符合 UX_SPEC；② Wave/PSD 辅图轴正确；③ 不出现模式与轴标签错绑 | 模式变了轴文案不变或 placeholder |
| G17 | P0 | 检测页字段 | ① 模型下拉 + 谱型下拉；② 范围来源（可见/ROI/段）；③ 时间策略；④ 分支与高级可折叠；⑤ 预检错误可见；⑥ 运行按钮在闸门失败时 disabled；⑦ 模型项均来自树内 `.engine` | 仅 token+FFSCN/SCN 两按钮 |
| G18 | P1 | `rail-page-display` / channel；谱估计弹层 | ① 显示页含网格/色阶/频率坐标控件；② 谱估计弹层含 Welch 或 Bartlett 至少其一；③ 通道页非单句占位 | `PAGE_BODY` 占位文案 |
| G19 | P1 | 工程树操作 | ① 「添加 IQ」打开对话框/向导；② 树节点可定位到图；③ 标记/通道可重命名或删除（有确认） | 仅 sample stub + JSON paste |
| G20 | P1 | 打开 IQ 流程 | ① 入口在菜单/命令栏；② 导入 UI 展示 SigMF 元数据预览；③ 默认或文档推荐路径为 `sigmf_data_demo` | 仅工具栏 `btn-open-iq-wav` |
| G21 | P2 | 计算样式 | ① 背景/面板接近 `#0b1422`/`#121f32`（允许 ±1 档文档色）；② 中文 UI 12px；③ 坐标等宽字体 | 仍 `#0f1419` + system-ui 13px 为主 |
| G22 | P2 | 画布几何 | ① 主图内容区 inset 左88/右22/上12/下34 ±2px；② 色阶开启右边距→70±2 | 边距明显偏离 |
| G23 | P2 | 品牌 | ① 顶栏左侧 BrandV2 lockup 可见；② 浏览器原生标题栏 → **N/A 可接受**（报告标注） | 完全无品牌 |
| G24 | P2 | 轴单位/相对 | ① 可切换绝对/相对或单位；② 读数无 `-0`；③ 与 UI-32 抽样一致 | 固定单位且出现 -0 |
| G25 | P2 | `status-bar` | ① 高度≈25±4px；② 含就绪（或等价）+ t/f + 文件名；③ 手势时有瞬时提示；④ dsp/fft 诊断不取代主提示 | 仅诊断字段、无就绪/提示 |
| G26 | P0 | runbook / 配置 | ① 验收脚本或文档写死 IQ=`resources\sigmf_data_demo`；② 模型 glob 限于 rebuild 树 `*.engine`；③ CI/手册若仍引用 RadioAI 或 `.pth` → FAIL | 旧基线越界路径仍当验收主路径 |

---

## Playwright 建议断言（摘录）

```text
G01: expect(page.getByTestId('menubar')).toBeVisible()
G03: expect(page.getByTestId('global-nav')).not.toContainText('placeholder')
G06: expect(page.getByTestId('workspace-narrowband-stub')).toHaveCount(0)
G07: expect(page.getByTestId('bottom-panel')).toBeVisible()
G14: expect(page.getByTestId('detectionRoiConfirmation')).toBeVisible() // after ROI drag
G17: expect(page.getByTestId('detectionModel')).toBeVisible()
G26: // load path assertion in fixture equals ...\resources\sigmf_data_demo\...
```

（testid 名允许实现时微调，但验收报告须映射回本表 ID。）

## 计数

| 项 | 数量 |
|----|------|
| 总差距 | **26**（原 24 + G25/G26） |
| P0 | 14（G01–G07, G11–G14, G17, G26） |
| P1 | 8（G08–G10, G15–G16, G18–G20） |
| P2 | 4（G21–G25） |

## Top 5 关键（建议优先）

1. **G02+G01** — 壳信息架构（去常驻工具栏 + 菜单/命令栏）
2. **G03–G05** — 三图真实化与 splitter
3. **G17+G14** — DetectionCard 字段与检测 ROI 确认流（含 `.engine` 门禁）
4. **G11–G13** — 框选/右键/持续标记
5. **G06+G07** — 窄带 workspace + 底栏任务/结果

未改实现代码；供 CAO / 实现 bot 按 ID 认领。