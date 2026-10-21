# UI parity gap patch — Web `ef2713a` vs desktop `17471a6`

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 21:55:00 |
| Author | Bot-A (`work/bot-a-audit`) |
| Desktop | `rebuild/a143-native` **`17471a6`** = `17471a6488383b456281d12cb1a6d3d80290205d`（unchanged） |
| **This Web tip** | **`ef2713a`** = `ef2713a735cc96407ff2dcf7156f08fffb74a6a3`（merge Bot-D narrowband DDC `a145d21` over `d8297d1`） |
| Base for sync | `origin/main` @ **`905cdad`**（已并入 `eb13771` INCREMENTAL_d8297d1） |
| Prior Bot-A | `INCREMENTAL_d8297d1.md`（G01+G06 PARTIAL；本文件相对 **d8297d1→ef2713a** 增量） |
| Scope | Evidence-check **narrowband DDC wiring → G06**；G01 无代码变更复核；refresh GAP/ACCEPTANCE；**no implementation edits**；**无矩阵 PASS** |

## Tip stack (d8297d1 → ef2713a)

| Commit | Role |
|--------|------|
| `d8297d1` | G06 壳 `6c17a53` + 截图 `95e24d0` + G01 MenuBar |
| `a145d21` | feat(web): narrowband observe DDC from sigmf_data_demo (Bot-D) |
| **`ef2713a`** | merge(bot-d): narrowband DDC observe wave/spectrum |
| `905cdad` | merge(bot-a): `eb13771`（本增量写作基线） |

**Diff scope（实现）:** 仅 6 文件 / +760 行：`narrowbandObserveDdc.ts`(+test)、`NarrowbandObserveCharts.tsx`、`NarrowbandWorkspace.tsx`（接观察页）、`auxWaveRawIq.ts` 小补、`App.css`。

---

## DDC → G06 影响（首要结论）

### 一句话

**窄带观察页已接上真实 Worker DDC（`sigmf_data_demo`→`ddcFromChunkedReader`→Wave/PSD/STFT），把 G06 的「观察页真图」子项从 NOT MET 推到 MET；G06 整体仍为 PARTIAL，不升 CLOSED，也不发 PASS。**

### 证据：这是真 DDC，不是 stub

| Path | Role |
|------|------|
| `apps/web/src/dsp/narrowbandObserveDdc.ts` | `computeNarrowbandObserveDdc`：`ensureDemoSigmfReader` → LO/窗/抽取自 annotation → `ddcFromChunkedReader` → wave/PSD/STFT；`pipelineLabel` 含 `DDC` + `not demod` |
| `apps/web/src/dsp/ddcFromChunkedReader.ts` | `client.processDdc`（Worker）；禁止 silent fake IQ（强制 `sourceLabel`） |
| `apps/web/src/dsp/auxWaveRawIq.ts` | IQ **仅** `D:\project\signal_studio_rebuild\resources\sigmf_data_demo` / stem `0000000` |
| `apps/web/src/components/NarrowbandObserveCharts.tsx` | 观察页填 `nb-panel-waveform` / `nb-panel-psd` / `nb-panel-stft`；`data-nb-*-source=sigmf_data_demo-ddc`；`data-testid=nb-observe-pipeline` |
| `apps/web/src/components/NarrowbandWorkspace.tsx` | `page==='observe'` 渲染 `<NarrowbandObserveCharts />`；调制/识别/解调仍诚实壳 |
| `apps/web/src/dsp/narrowbandObserveDdc.test.ts` | demo 在盘则跑：sourceLabel∋sigmf_data_demo、非 synthetic、wave/PSD/STFT 非空、AbortSignal |

### ACCEPTANCE 子项翻转（相对 `INCREMENTAL_d8297d1`）

| G06 子项 | @d8297d1 | @ef2713a | 说明 |
|----------|----------|----------|------|
| 无 stub / 四页区分 / 无伪解调 / overflow+跨页保留 | MET | **MET** | 壳未回退 |
| **观察页真 DDC Wave/PSD/STFT** | **NOT MET** | **MET** | Bot-D 接线；testid `nb-chart-waveform/psd/stft` + pipeline attrs |
| 调制 / 识别 / 解调 chrome 对等 | NOT MET | **NOT MET** | 仍 ChartPanel「等待真实…」诚实文案 |
| 标题「工作台」 | NOT MET | **NOT MET** | Web 仍 `narrowband-workspace` / 无「工作台」文案对等 |
| 桌面通道联动 LO / 交互 STFT / 像素 chrome | NOT MET | **NOT MET** | LO 来自 demo annotation；STFT `interactionEnabled={false}`；输入 capped `NB_OBSERVE_MAX_INPUT_SAMPLES=65536` |

### 为何不 CLOSED / 不 PASS

1. G06 ACCEPTANCE 要求 **全部** 子项满足；观察页真图只是其中一条。
2. 调制分析 / 深度学习识别 / 解调工作区仍为壳，非桌面 chrome。
3. 标题与 overflow 像素归属、通道选择驱动的 DDC（非仅 demo 自动源）未对等。
4. Bot-B WIP / 无 QA 视觉 PASS 声明；审计不自报 PASS。

**状态裁定：G06 保持 PARTIAL（深度前进，状态字不变）。**

---

## G01 — MenuBar（本 tip 无实现变更）

`d8297d1..ef2713a` **无** `MenuBar.tsx` / 菜单相关 diff。
**G01 保持 PARTIAL**（File+View+Open IQ ~34px MET；编辑/分析/帮助 NOT MET）。

---

## G06 — 窄带四页（壳 + 观察页 DDC）

### Desktop @ `17471a6`

`NarrowbandWorkspace` 多页 + `a64117e` 设置跨 overflow；观察页绑定真实 DDC/图。

### Web @ `ef2713a`

- 壳：同 `6c17a53`（四 tab + uiStore + overflow）。
- **新增：** 观察页 `NarrowbandObserveCharts` ← `computeNarrowbandObserveDdc`。
- 约束遵守：IQ=`resources\sigmf_data_demo`；本路径未引入 `.pth` / 非 rebuild `.engine`。

### Status：**G06 保持 PARTIAL**（观察页 DDC 子项 MET；整项未 CLOSED）

---

## Counts after this patch

| 状态 | Count | IDs |
|------|-------|-----|
| OPEN | **10** | G07–G10, G15–G18, G21–G24 |
| PARTIAL | **12** | G01, G02–G04, **G06**, G11–G14, G19–G20, G26 |
| DOCS | **1** | G25 |
| CLOSED | **1** | G05 |

Delta vs `INCREMENTAL_d8297d1`：**计数不变**；**G06 PARTIAL 证据加深**（观察页 DDC NOT MET→MET）。G01 不变。**无新增 CLOSED。无矩阵 PASS。**

### Top remaining P0

1. **G06** — 调制/识别/解调 chrome +「工作台」+ 通道联动交互（观察页 DDC 已落地）
2. **G01** — 编辑/分析/帮助全组
3. **G02** — f9f05bb caption/overflow
4. **G17** — DetectionCard + `.engine` 列表
5. **G03/G04** — 滚轮窗宽；raw IQ QA
6. **G07 / G11–G14** — 底栏；框选放大；右键/标记；ROI
7. **G26** — Detect UI 不得暴露 `.pth`

## Canonical docs

- `artifacts/validation/ui-parity/INCREMENTAL_ef2713a.md`（本文件；主交付）
- `INCREMENTAL_d8297d1.md` 保留为 G01+G06 壳阶段快照
- GAP / ACCEPTANCE baseline + `docs/migration/ui-parity/` mirrors