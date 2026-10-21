# UI parity gap patch — Web `62d3b70` vs desktop `17471a6`

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 21:58:00 |
| Author | Bot-A (`work/bot-a-audit`) |
| Desktop | `rebuild/a143-native` **`17471a6`** = `17471a6488383b456281d12cb1a6d3d80290205d`（unchanged） |
| **This Web tip** | **`62d3b70`** = `62d3b70cae428e9161535e2cf908a27cf2bc82d4` |
| Prior Bot-A | `INCREMENTAL_ef2713a.md` @ `593948d`（观察页 DDC MET；G01/G06 PARTIAL） |
| Scope | Evidence-check **G01**（B `e76ba97` 菜单）+ **G06**（G `c718171` 截图包）+ 其余 OPEN/PARTIAL 是否仅因菜单/截图变化；refresh GAP/ACCEPTANCE；**no implementation edits**；**无矩阵 PASS** |

## Tip stack（相对 `ef2713a` / `905cdad`）

| Commit | Role |
|--------|------|
| `ef2713a` / `905cdad` | 观察页 DDC + prior Bot-A `eb13771` |
| **`e76ba97`** | feat(web): G01 Edit/Analysis/Tools/Help menus（Bot-B） |
| `0fe40ca` | merge(bot-b): G01 menus |
| **`c718171`** | qa(bot-g): G01 menubar + NB observe DDC filled @905cdad（**no PASS**） |
| `ad4feba` | merge(bot-g): shot pack |
| `593948d` | Bot-A INCREMENTAL_ef2713a |
| **`62d3b70`** | merge(bot-a): 合入上列 |

**实现 diff（相对审计基线 `ef2713a`）:** 仅 `MenuBar.tsx` +298/−10（B）；G 为证据包，无新窄带 DSP。

---

## G01 — 菜单栏（重点）

### 一句话

**Edit / Analysis / Tools / Help 顶层组已从「缺席」变为「有菜单 + 诚实接线」；G01 仍为 PARTIAL（加深），不 CLOSED，不发 PASS。**

### Desktop @ `17471a6`

`MainWindow::buildMenus()`（`app/main_window.cpp:442+`）：

- 高度 **34px**；`setNativeMenuBar(false)`
- **TopLeft** BrandAssets 角标；**TopRight** 最小化/最大化/关闭 `windowControls`
- 菜单树：文件 / 编辑 / 视图 / 分析 / 工具 / 帮助
- 编辑：撤销/重做标记、删除所选、**重命名当前标记（已接线）**
- 视图：后退/前进（真历史）、适应全部、恢复默认
- 分析：宽带信号检测、选择检测 ROI
- 工具：关于 Signal Studio；帮助：鼠标交互帮助（长文案）

### Web @ `62d3b70`（`e76ba97`）

| 子项 | @ef2713a / d8297d1 | @62d3b70 | 裁定 |
|------|--------------------|----------|------|
| ~34px `menubar`/`command-bar` | MET | **MET** | `style={{ height: 34 }}`；e2e ±2px；G/B 截图 |
| 文件 + Open IQ | MET | **MET** | `menu-open-iq`；清 IQ / 工程 JSON / 样例 / 保存 |
| **编辑(E) 组** | **NOT MET** | **MET（壳+部分接线）** | `menubar-edit`；undo/redo/delete via `__wssM06`；打开标记页 |
| **分析(A) 组** | **NOT MET** | **MET（壳+入口）** | Detect 页 + ROI→`select`+detect |
| **工具(T) / 帮助(H)** | **NOT MET** | **MET（对话框）** | About；鼠标交互帮助 |
| 视图宽/窄带等 | MET 部分 | **MET 部分** | 有；back/forward **disabled**（诚实 → G15） |
| 重命名标记 | n/a | **NOT MET** | `menu-edit-rename-mark` **disabled**「未接入」 |
| 角标 corner（min/max/close + BrandV2） | NOT MET | **NOT MET** | Web 仅 `menubar-brand` 文案；无桌面 TopRight controls |
| 文件「最近工程 / 新建 / 移除当前文件」深度 | NOT MET | **NOT MET** | Web 子集；无 recent menu |

### 证据

| Path | Role |
|------|------|
| `apps/web/src/components/MenuBar.tsx` @`e76ba97` | 六组菜单；M06 undo/redo；Analysis→Detect/ROI；Help dialog |
| `apps/web/e2e/g01-menubar.spec.ts` | 显式断言 edit/analysis/tools/help；**标注 WIP / not ACCEPTANCE PASS** |
| `artifacts/validation/ui-parity/bot-b/BOT_B_G01_MENUBAR.md` | Bot-B：**WIP evidence — NOT PASS** |
| `bot-b/g01-menubar-{default,file,edit,analysis,help-dialog,view-narrowband}.png` | 接线截图（不升格 CLOSED） |
| `qa/web-905cdad/` + `COMPARISON_NOTES.md` | Bot-G 对 905cdad 的 menubar 34px 观测；`ui_parity_pass_claimed: false` |

### 为何仍 PARTIAL / 不 CLOSED / 不 PASS

1. ACCEPTANCE G01 FULL 仍要求桌面 corner 控件完整对等 — **未做**。
2. 编辑「重命名」诚实 disabled；视图历史仍 disabled（属 G15）。
3. File 动作深度低于 `buildMenus()`（无 recent / 新建工程文件夹流等）。
4. Bot-B / Bot-G **明确 no PASS**；截图不单独关门。

**状态裁定：G01 保持 PARTIAL（菜单树子项大幅 MET；整项未 CLOSED）。**

---

## G06 — 窄带四页 + DDC + 证据包

### 一句话

**Bot-G `c718171` / `qa/web-905cdad` 强化「观察页 DDC 非空」证据；相对 `INCREMENTAL_ef2713a`，G06 状态字不变：仍 PARTIAL。截图永不 CLOSED。**

### 相对 ef2713a

| 子项 | @ef2713a | @62d3b70 | 说明 |
|------|----------|----------|------|
| 无 stub / 四 tab / 无伪解调 / overflow 跨页 | MET | **MET** | 无回退 |
| 观察页真 DDC Wave/PSD/STFT | **MET** | **MET** | 代码未变；G 包 `nb_*_ready: true`、pipeline `ddc` |
| 调制 / 识别 / 解调 chrome | NOT MET | **NOT MET** | COMPARISON_NOTES：demod 仍诚实空 |
| 标题「工作台」/ 通道联动交互 STFT | NOT MET | **NOT MET** | 未因截图改变 |

### 证据包（不升格）

- `qa/web-905cdad/06-narrowband-observe-ddc.png` + `06b/c/d-nb-panel-*.png`
- `capture-notes.json`: `nb_charts_non_empty: true`, `nb_pipeline_kind: "ddc"`, LO 2151808, R=16；**`matrix_pass_claimed: false`**
- `web-6c17a53/06-narrowband-EMPTY-DDC-STALE.txt` 标明旧空壳过期

**状态裁定：G06 保持 PARTIAL。**

---

## 其余 OPEN / PARTIAL（菜单或截图是否改状态）

| ID | 先前 | @62d3b70 | 说明 |
|----|------|----------|------|
| G02–G04, G11–G14, G19, G26 | PARTIAL | **PARTIAL** | 本 tip 无对应实现 diff |
| G05 | CLOSED | **CLOSED** | 不变 |
| G07–G10, G15–G18, G21–G24 | OPEN | **OPEN** | 菜单未补底栏/DetectionCard/显示摘要等 |
| G20 | PARTIAL | **PARTIAL（证据加深）** | 菜单 Open IQ 已 MET 子项①；元数据预览仍缺 → 不 CLOSED |
| G25 | DOCS | **DOCS** | 不变 |
| G15 | OPEN | OPEN | View back/forward 仍 disabled（诚实占位，非历史实现） |

**原则：截图 / 菜单 WIP 文档单独不得把任何 ID 标 CLOSED；本轮无新 CLOSED。无矩阵 PASS。**

---

## Counts after this patch

| 状态 | Count | IDs |
|------|-------|-----|
| OPEN | **10** | G07–G10, G15–G18, G21–G24 |
| PARTIAL | **12** | **G01**, G02–G04, **G06**, G11–G14, G19–G20, G26 |
| DOCS | **1** | G25 |
| CLOSED | **1** | G05 |

Delta vs `INCREMENTAL_ef2713a`：**计数不变**；**G01 PARTIAL 证据加深**（Edit/Analysis/Help 组 MET）；**G06 证据包加深**（状态字不变）。**无新 CLOSED。无矩阵 PASS。**

### Top remaining P0

1. **G01** — corner 控件 + 重命名接线 + File 深度（菜单树已齐）
2. **G06** — 调制/识别/解调 chrome +「工作台」+ 通道联动交互 STFT
3. **G02** — f9f05bb caption/overflow
4. **G17** — DetectionCard + `.engine` 列表
5. **G03/G04** — 滚轮窗宽；raw IQ QA
6. **G07 / G11–G14** — 底栏；框选放大；右键/标记；ROI
7. **G26** — Detect UI 不得暴露 `.pth`

## Canonical docs

- `artifacts/validation/ui-parity/INCREMENTAL_62d3b70.md`（本文件；主交付）
- `INCREMENTAL_ef2713a.md` 保留为 DDC 阶段快照
- GAP / ACCEPTANCE baseline + `docs/migration/ui-parity/` mirrors
- IQ 仅 `resources\sigmf_data_demo`；模型仅 rebuild 树内 `*.engine`

**Explicit: Bot-A does NOT claim ACCEPTANCE / matrix PASS.**