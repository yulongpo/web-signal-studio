# UI parity gap patch — Web `360aba7` vs desktop `17471a6`

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 22:00:00 |
| Author | Bot-A (`work/bot-a-audit`) |
| Desktop | `rebuild/a143-native` **`17471a6`** = `17471a6488383b456281d12cb1a6d3d80290205d`（unchanged） |
| **This Web tip** | **`360aba7`** = `360aba7` merge(bot-b) of **`ffeff52`** over `62d3b70` |
| Prior Bot-A | `INCREMENTAL_62d3b70.md` / `a126c37`（六组菜单加深；本文件叠 `ffeff52`） |
| Scope | Evidence-check **G01** rename + View back/forward（`ffeff52`）+ 继承 62d3b70 G06/G 截图结论；refresh GAP/ACCEPTANCE；**no implementation edits**；**无矩阵 PASS** |

## Tip stack

| Commit | Role |
|--------|------|
| `62d3b70` | B 六组菜单 + G 截图 + A `593948d` |
| **`ffeff52`** | feat(web): G01 residual — **rename mark** + **view history back/forward** |
| **`360aba7`** | merge(bot-b): 合入 `ffeff52` |
| Bot-A worktree | merge main → then this incremental |

**实现 diff（相对 `62d3b70`）:** `MenuBar.tsx`、`uiStore.ts`（viewHistory ≤40）、`MainChartHost` sync `recordHistory:false`、e2e + bot-b rename/history 截图。

> 62d3b70 阶段结论（Edit/Analysis/Help 组出现、G06 DDC MET、截图不 CLOSED）仍成立；本文件只增量裁定 `ffeff52` 是否翻转状态字。

---

## G01 — 菜单栏（`ffeff52` 残留）

### 一句话

**重命名标记与视图后退/前进已从「disabled/未接入」变为真实接线；G01 仍为 PARTIAL（再加深），不 CLOSED，不发 PASS。**

### 相对 `INCREMENTAL_62d3b70` 子项翻转

| 子项 | @62d3b70 | @360aba7 / `ffeff52` | 裁定 |
|------|----------|----------------------|------|
| 六组菜单 + Open IQ + ~34px | MET | **MET** | 无回退 |
| Edit undo/redo/delete + 打开标记页 | MET | **MET** | 无回退 |
| **重命名当前标记** | **NOT MET**（disabled） | **MET** | 对话框 + `__wssM06.session.replaceMark`；testid `menu-edit-rename-mark` / `menu-rename-input` / apply |
| **视图后退 / 前进** | **NOT MET**（disabled） | **MET** | `uiStore.viewHistory` + `viewHistoryBack/Forward`；enable 依 index |
| 适应全部 / 恢复默认视图 | NOT MET | **NOT MET** | View 菜单仍无桌面这两项 |
| TopRight corner min/max/close + BrandV2 | NOT MET | **NOT MET** | 未做 |
| File recent / 新建工程文件夹深度 | NOT MET | **NOT MET** | 未做 |

### 证据

| Path | Role |
|------|------|
| `apps/web/src/components/MenuBar.tsx` @`ffeff52` | rename dialog；`menu-view-back` / `menu-view-forward` |
| `apps/web/src/store/uiStore.ts` | `viewHistory` 封顶 40；`setNavWindowTime` 默认 `recordHistory` |
| `apps/web/src/components/MainChartHost.tsx` | 同步窗用 `{ recordHistory: false }` |
| `apps/web/e2e/g01-menubar.spec.ts` | rename + zoom→back→forward 用例 |
| `bot-b/BOT_B_G01_MENUBAR.md` | **WIP / NOT PASS** |
| `bot-b/g01-menubar-edit-rename.png` / `g01-menubar-view-history.png` | 接线证据（不升格 CLOSED） |
| Desktop `buildMenus()` | `renameMark`；`backAction_`/`forwardAction_`；另有「适应全部」「恢复默认」 |

### 为何仍 PARTIAL / 不 PASS

1. Corner 窗口控件与 BrandV2 角标仍缺。
2. View 仍缺「适应全部数据」「恢复默认视图」。
3. File 深度（recent / 新建工程文件夹 / 移除当前文件确认流）仍短。
4. Bot-B 明确 **NOT PASS**；审计不自报 PASS。

**状态裁定：G01 保持 PARTIAL（rename + history 子项 MET）。**

---

## G15 — 视图历史（连带）

| @62d3b70 | @360aba7 | 说明 |
|----------|----------|------|
| OPEN | **PARTIAL** | 菜单 back/forward + store ≤40 已落地；完整手势/适应全部/恢复默认/与桌面 session 历史语义仍可能缺口；**不 CLOSED** |

---

## G06 — 窄带（本 tip 无 DSP 变更）

继承 `INCREMENTAL_62d3b70` / `ef2713a`：**PARTIAL 不变**（观察页 DDC MET；调制/识别/解调壳；截图不 CLOSED）。`ffeff52` 未改窄带。

---

## 其余 OPEN / PARTIAL

| ID | 状态 | 说明 |
|----|------|------|
| G02–G04, G11–G14, G19–G20, G26 | PARTIAL | 无本 tip 实现 diff |
| G05 | CLOSED | 不变 |
| G07–G10, G16–G18, G21–G24 | OPEN | 不变（G15 已离开 OPEN） |
| G25 | DOCS | 不变 |
| G20 | PARTIAL | 菜单 Open IQ 已有；元数据预览仍缺 |

**截图 / WIP 文档不单独 CLOSED。无矩阵 PASS。**

---

## Counts after this patch

| 状态 | Count | IDs |
|------|-------|-----|
| OPEN | **9** | G07–G10, G16–G18, G21–G24 |
| PARTIAL | **13** | **G01**, G02–G04, **G06**, G11–G14, **G15**, G19–G20, G26 |
| DOCS | **1** | G25 |
| CLOSED | **1** | G05 |

Delta vs `INCREMENTAL_62d3b70`：G01 再加深（rename/history MET）；**G15 OPEN→PARTIAL**；G06 不变。**无新 CLOSED。无矩阵 PASS。**

### Top remaining P0

1. **G01** — corner + View 适应/恢复默认 + File 深度
2. **G06** — 调制/识别/解调 chrome +「工作台」+ 通道联动交互 STFT
3. **G02** — f9f05bb caption/overflow
4. **G17** — DetectionCard + `.engine`
5. **G03/G04 / G07 / G11–G14 / G26** — 同前

## Canonical docs

- `artifacts/validation/ui-parity/INCREMENTAL_360aba7.md`（本文件；**主交付**）
- `INCREMENTAL_62d3b70.md` 保留为六组菜单阶段快照
- GAP / ACCEPTANCE + `docs/migration/ui-parity/` mirrors
- IQ 仅 `resources\sigmf_data_demo`；模型仅 rebuild `*.engine`

**Explicit: Bot-A does NOT claim ACCEPTANCE / matrix PASS.**