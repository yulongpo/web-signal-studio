# UI parity gap patch — Web `3d7ab59` vs desktop `17471a6`

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 22:08:00 |
| Author | Bot-A (`work/bot-a-audit`) |
| Desktop | `rebuild/a143-native` **`17471a6`** = `17471a6488383b456281d12cb1a6d3d80290205d`（unchanged） |
| **This Web tip** | **`3d7ab59`** = `3d7ab591a0e4ee09b6a03286b528f32c3196a45d` merge(pr3) of **`2e65e82`** over `23baf0d` |
| Prior Bot-A | `INCREMENTAL_360aba7.md` / `15b2072`（main 曾 @ `23baf0d`） |
| Scope | Evidence-check **G11–G15** 手势/标记、**Detect ROI 确认条**、**G02 Level 参考/动态**、**G01 回归**、**REAL_RUNTIME** 门禁备注；refresh GAP/ACCEPTANCE；**no implementation edits**；**无矩阵 PASS** |

## Tip stack

| Commit | Role |
|--------|------|
| `360aba7` / `15b2072` | B rename+history；Bot-A INCREMENTAL_360aba7 |
| `23baf0d` | merge(bot-a): 15b2072 → main |
| **`2e65e82`** | feat(charts): harden zoom、detection ROI range、real-runtime gating |
| **`3d7ab59`** | merge(pr3): cherry chart gestures / ROI / Level / real-runtime |

**实现 diff（相对 `23baf0d` / 审计基线 `360aba7`）**：`chartGesture.ts`、`ChartMarkOverlay.tsx`、`MainChartHost.tsx`、`DetectPage.tsx`、`TempLayers.tsx`、`HeatmapCanvas.tsx`、`viewTransform.ts`（`viewFromPhysicalBox` / `BOX_ZOOM_MIN_DIAGONAL_PX`）、`gating.ts` / contracts、`e2e/chart-gestures.spec.ts`、`e2e/detect-page.spec.ts`。

> 本文件**不**因 e2e 绿或 WIP 截图自报 PASS；不升格未证据闭合的 ID。

---

## G01 — 菜单栏（回归检查）

### 一句话

**`ffeff52` 的 rename + View back/forward 在 `3d7ab59` 仍在；PR#3 未回退 MenuBar。G01 保持 PARTIAL，不 CLOSED，不 PASS。**

### 子项

| 子项 | @360aba7 | @3d7ab59 | 裁定 |
|------|----------|----------|------|
| 六组菜单 + Open IQ + ~34px | MET | **MET** | 无回退 |
| Edit undo/redo/delete | MET | **MET** | 无回退 |
| **重命名当前标记** | MET | **MET** | `MenuBar` 仍有 `menu-edit-rename-mark` / `menu-rename-*` + `replaceMark` |
| **视图后退 / 前进** | MET | **MET** | `viewHistory` / `menu-view-back` / `menu-view-forward` 仍接线；图表另有独立 `historyRef`（见 G15） |
| 适应全部 / 恢复默认（View 菜单） | NOT MET | **NOT MET** | View 菜单仍无；**右键菜单**新增 fit/reset（算 G12，不顶替 G01 View 菜单项） |
| Corner min/max/close + BrandV2 | NOT MET | **NOT MET** | 未做 |
| File recent / 新建深度 | NOT MET | **NOT MET** | 未做 |

### 证据

| Path | Role |
|------|------|
| `apps/web/src/components/MenuBar.tsx` @`3d7ab59` | rename dialog + viewHistoryBack/Forward 仍在 |
| `apps/web/src/store/uiStore.ts` | `viewHistory` 封顶逻辑未删 |
| `2e65e82` diff | 未改 MenuBar |

**状态裁定：G01 保持 PARTIAL（无回归）。**

---

## G02 — Level 参考 / 动态（本 tip 增量）

### 一句话

**Level 临时层已用「参考」「动态」文案，并写入主图 `levels`；图头 caption/`f9f05bb` overflow 与「无全局常驻 Toolbar」仍未满足。G02 保持 PARTIAL（加深），不 PASS。**

| 子项 | 裁定 | 证据 |
|------|------|------|
| TempLayers 「参考 {n} dB」「动态 {n} dB」 | **MET** | `TempLayers.tsx` `level-ref-summary` / `level-range-summary`（对桌面 `696ce12` 用语） |
| 主图 colormap 随 Level | **MET** | `MainChartHost` `levelMax/levelMin` ← `level.refLevelDb` / `dynamicRangeDb` |
| 无 aux↔main 常驻 SpectrumToolbar | **NOT MET** | `App.tsx` 仍挂 `SpectrumToolbar`（含 `btn-open-level`） |
| 三图 strip caption + overflow 焦点 | **NOT MET** | 仍 `AuxParamStrip`/`SpecParamStrip`；无 `f9f05bb` 标签分离 |
| 右侧 displaySummary 「参考」「动态」常显 | **NOT MET** | 属 G18；右栏显示页仍偏占位 |

**状态裁定：G02 PARTIAL（Level 接线加深；chrome 残留）。**

---

## G11 — 框选放大 / 轴隔离 / 导航跨度

### 一句话

**`zoom-box` 工具可缩视图（≥8px 对角）；`desktop-axis` 滚轮轴隔离仍在。navigate 默认仍是 pan，非「导航态拖框即放大」。G11 保持 PARTIAL（加深）。**

| 子项 | 裁定 | 证据 |
|------|------|------|
| zoom-box 缩视图 | **MET** | `HeatmapCanvas` `gesture==="zoom-box"` → `viewFromPhysicalBox`；`BOX_ZOOM_MIN_DIAGONAL_PX=8`；e2e `zoom-box shrinks the view` |
| 轴热区滚轮隔离 | **MET** | `wheelModel="desktop-axis"`；e2e axis wheel |
| navigate 态拖框放大 | **NOT MET** | `activeTool==='navigate'` → `gesture='pan'`；须右键切「框选放大」/`activeTool==='zoom'` |
| 导航单击平移保 span | **未新证** | 本 tip 无 NavigationChart 变更；沿用 PARTIAL |

**状态裁定：G11 PARTIAL。**

---

## G12 — 右键菜单

### 一句话

**右键菜单已含导航 / 框选放大 / 持续创建 / 检测 ROI / 视图后退·前进·适配全图·重置 / 重叠标记命中。仍缺与桌面完全同构的部分项；G12 保持 PARTIAL（显著加深），不 CLOSED。**

| 子项 | 裁定 | 证据 |
|------|------|------|
| 右键菜单壳 | **MET** | `data-testid="chart-context-menu"` |
| 持续创建开关 | **MET** | `chart-menu-mark` aria-checked |
| back / forward | **MET** | `chart-menu-view-back` / `forward`（host `historyRef`） |
| fit / reset | **MET** | `chart-menu-view-fit` / `view-reset` |
| 重叠标记列表 | **MET** | `markContains` → `chart-menu-mark-hit-*` |
| 与桌面菜单项 1:1 | **NOT MET** | 未对照桌面全量 action 表关闭 |

**状态裁定：G12 PARTIAL。**

---

## G13 — 标记控制点 / 多选

### 一句话

**图内 `ChartMarkOverlay` + 角点 handle + Ctrl/Shift 多选 + `replaceMark` 已落地；持续创建仍为 box 一次性写入。G13 保持 PARTIAL（加深）。**

| 子项 | 裁定 | 证据 |
|------|------|------|
| marker 工具 box → `addManualMark` | **MET** | `MainChartHost.onBoxCommit`；e2e persistent mark |
| 角点拖改 | **PARTIAL MET** | 仅 active 标记一角 `chart-mark-handle`；非四角/边中点全套 |
| Ctrl/Shift 多选 | **MET** | `selectMark(..., ctrl/meta/shift)` |
| 与列表双向一致 | **MET（浅）** | 写入后 `setRightPage('marker')`；e2e `m06-mark-count` |
| 真·连续拖拽多框不松手连创 | **NOT MET** | 每框 pointer-up 写一条 |

**状态裁定：G13 PARTIAL。**

---

## G14 — 检测 ROI 确认条

### 一句话

**独立 `detection-roi` 工具 + `detection-roi-confirmation` 确认条（Enter 写入 / Esc 取消、不自动跑检测）已对齐桌面确认条语义。header 常驻「检测 ROI」钮与 `select` 别名清理仍残留 → 保持 PARTIAL（近退出），不 CLOSED，不 PASS。**

| 子项 | 裁定 | 证据 |
|------|------|------|
| 独立入口 | **MET** | `activeTool: 'detection-roi'`；`chart-menu-roi`；desktop `detectionRoiTool_` / `beginDetectionRoi` |
| 确认条 | **MET** | `data-testid="detection-roi-confirmation"` + confirm/cancel；desktop `detectionRoiConfirmation_` |
| Enter → 写入 + 聚焦检测页 | **MET** | `confirmRoi` → `setDetectSampleRange(roi,'roi')` + `setRightPage('detect')`；DetectPage focus range |
| Esc 取消 | **MET** | cancel 按钮 + keydown Esc；e2e |
| 确认不自动跑检测 | **MET** | copy「不会自动运行检测」；e2e `detect-task-status` idle、无 candidate |
| header 工具钮对等 | **NOT MET** | 桌面 `push("…检测 ROI")`；Web 仅右键/工具态 |
| `select` 仍写入 ROI | **残留** | `activeTool==='select'` 与 ROI 同路径（桌面独立） |

**状态裁定：G14 PARTIAL（加深，近 ACCEPTANCE 退出；故意不 CLOSED）。**

---

## G15 — 视图历史

### 一句话

**菜单 viewHistory 保留；主图另增 `historyRef`/`futureRef`（右键 back/forward/fit/reset）。双栈未统一 → 保持 PARTIAL。**

| 子项 | 裁定 | 说明 |
|------|------|------|
| MenuBar back/forward ≤40 | **MET** | 无回归 |
| 图表手势历史 | **MET** | `onViewCommit` → `pushCapped`；右键恢复 |
| 与桌面单一 session 历史语义 | **NOT MET** | nav 窗 `uiStore.viewHistory` ≠ 主图 `historyRef` |

**状态裁定：G15 PARTIAL。**

---

## REAL_RUNTIME 门禁（验收备注，非新 G-ID）

| 点 | 事实 | 对验收的影响 |
|----|------|----------------|
| UI 码 | contracts `LOCAL_COMPUTE_UI_CODES` 含 `REAL_RUNTIME`；DetectPage `detect-real-runtime` 仅当 caps 带该 message | **不**因出现 REAL_RUNTIME 横幅而把 G17 CLOSED |
| 绘制策略 | `shouldDrawDetectionCandidates` 要求 `verifiedForward` + real engine；拒绝 invent | ROI 确认与检测运行解耦（G14 子项） |
| stub | `STUB_RUNTIME` / `NO_FAKE_INFERENCE` 仍可禁用按钮 | G17/G26 仍 OPEN/PARTIAL |

---

## 其余 OPEN / PARTIAL（本 tip 无实质翻转）

| ID | 状态 | 说明 |
|----|------|------|
| G03–G04, G06, G19–G20, G26 | PARTIAL | 无本 tip 关闭证据 |
| G05 | CLOSED | 不变 |
| G07–G10, G16–G18, G21–G24 | OPEN | G18 仍 OPEN（右栏摘要未常显「参考」「动态」；Level 层进展记在 G02） |
| G25 | DOCS | 不变 |

**截图 / e2e 绿不单独 CLOSED。无矩阵 PASS。**

---

## Counts after this patch

| 状态 | Count | IDs |
|------|-------|-----|
| OPEN | **9** | G07–G10, G16–G18, G21–G24 |
| PARTIAL | **13** | **G01**, **G02**, G03–G04, **G06**, **G11–G15**, G19–G20, G26 |
| DOCS | **1** | G25 |
| CLOSED | **1** | G05 |

Delta vs `INCREMENTAL_360aba7`：G01 **无回归**；G02/G11–G15 **加深仍 PARTIAL**；G14 近退出但**不 CLOSED**；**无新 CLOSED。无矩阵 PASS。**

### Top remaining P0

1. **G01** — corner + View 菜单适应/恢复 + File 深度  
2. **G02** — 去掉常驻 Toolbar；strip caption/`f9f05bb`  
3. **G14** — header 检测 ROI 钮；去掉 `select`→ROI 别名后可再审 CLOSED  
4. **G11** — navigate 默认框选放大（或明确桌面也须切工具）  
5. **G17 / G06 / G26** — DetectionCard；窄带壳；engine picker  


---

## Evidence pack（Bot-G；合入 tip `2d12522`）

| Field | Value |
|-------|-------|
| Implementation tip（审计主体） | **`3d7ab59`** = `3d7ab591a0e4ee09b6a03286b528f32c3196a45d` |
| Evidence merge tip | **`2d12522`** = `2d125226d391ae6bef6a1ab4a0456b3e9aa1811d`（`qa/web-3d7ab59`） |
| Path | `artifacts/validation/ui-parity/qa/web-3d7ab59/` |
| Captures | zoom-box drag/applied；view-back menu/restored；roi-confirmation + detect-range；level popover/applied |
| `matrix_pass_claimed` / `ui_parity_pass_claimed` | **false**（capture-notes.json） |

**规则（本轮重申）**：截图包仅作接线/流程证据；**截图单独永不 CLOSED**；状态裁定仍以 **`3d7ab59` 源码** + 上述证据对照桌面 `17471a6`；**无矩阵 PASS**。

## Canonical docs

- `artifacts/validation/ui-parity/INCREMENTAL_3d7ab59.md`（本文件）**主交付**
- GAP / ACCEPTANCE + `docs/migration/ui-parity/` mirrors
- IQ 仅 `resources\sigmf_data_demo`；模型仅 rebuild `*.engine`

**Explicit: Bot-A does NOT claim ACCEPTANCE / matrix PASS.**
