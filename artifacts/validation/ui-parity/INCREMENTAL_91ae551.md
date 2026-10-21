# INCREMENTAL_91ae551 — G18 PSD + adaptiveValue + B wave5 G19/G07/G02/G08 (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 00:05 Asia/Shanghai |
| Web tip (audit subject) | **`91ae551`** = Bot-B wave5 over `1c7643d` (adaptiveValue) over D `0b6a113` (G18 PSD series) |
| Desktop | **`17471a6`** (`rebuild/a143-native`; AnnotationPanel columns; Detect tasks; strip QLabels; bottom/left collapse-to-min; NB 驻留帧谱/统计谱) |
| Prior Bot-A | `INCREMENTAL_ee42717.md` @ `1923d16` / content tip `ee42717` |
| Supersedes | Draft **INCREMENTAL_1c7643d** (CAO retarget mid-audit to `91ae551`; D/adaptiveValue folded herein) |
| Scope | **G18** frame/statistical real draw; **G17** adaptiveValue repair; **G19** full Qt column matrix; **G07** detectRunFeed; **G02** broader chrome; **G08** collapse-to-min |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `91ae5511d1e3668fd0b1a90c55de0b4ef10634e9` | `origin/main` tip = audit subject (Bot-B wave5) |
| `1c7643d8c740f6ed05d0dcf93b451f2a1c97348e` | adaptiveValue.ts template literal fix |
| `0b6a113798f1d01399b767c589e1ea2a1f9922d8` | Bot-D: G18 NB PSD frame vs statistical series |
| `1923d16` | Prior Bot-A INCREMENTAL_ee42717 |
| `ee42717` | Prior audit subject |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip (unchanged) |

**ID map:** G18 = PSD series (D) · G17 = adaptiveValue repair · G19/G07/G02/G08 = Bot-B wave5.

## Diff vs prior (`ee42717` → `91ae551`)

1. **D G18 PSD series** (`0b6a113`): `buildFramePsdFromStft` / `buildStatisticalPsd` / `selectNarrowbandPsdSeries`; both `psdFrame`+`psdStatistical` retained; tests assert frame ≠ statistical. Charts stamp `data-nb-psd-mode` / `data-nb-psd-series-kind` and re-run on mode change. **Gap:** `NarrowbandObserveCharts` omits `psdMode` in `computeNarrowbandObserveDdc({...})` → DDC defaults to `'statistical'`. Pinned `contextFramePsd` residual. **Not CLOSED.**
2. **adaptiveValue fix** (`1c7643d`): restores `formatAdaptiveValue` + `formatDetectionPhysicalTimes` template literals (G17 Fs/Adaptive chrome). Recognition still **BLOCKED**. **Not CLOSED.**
3. **B G19 full column matrix** (`91ae551`): `annotationTableMatrix.ts` — check · 名字/annotationId · 来源 · 当前段 · 开始/ms · 结束/ms · 中心/MHz · 带宽/kHz · mean · 质量 · 通道; honest `—`; BottomPanel + M06 `data-column-matrix="qt-full"`. Residual: inline edit / full desktop interactive re-shot. **Not CLOSED.**
4. **B G07 detectRunFeed** (`91ae551`): `uiStore.detectRunFeed` + `upsertDetectRun` from DetectPage LocalCompute polls; BottomPanel list/inspector/refresh/cancel on real runIds; honest empty (`data-live-feed="local-compute"`). No fake FFSCN/SCN/demod/recognition. Residual: full Qt Detect Worker port / multi-engine chrome. **Not CLOSED.**
5. **B G02 broader chrome** (`91ae551`): mode/workspace QLabels; overflow 参考·动态 + 图头标题; aux 辅助图 caption. Residual: further strip nuances. **Not CLOSED.**
6. **B G08 collapse-to-min** (`91ae551`): bottom dblclick → 29px tabs (`data-collapsed-min`, persist expanded); left dblclick → 8px (`data-shell-left-collapsed`, `wss.shellColumns.v1`). Prior 100–500 height + 278/390 resize retained. Residual: right-rail collapse edge / full desktop re-shot. **Not CLOSED.**

## Verdict summary

| ID | Prior (`ee42717`) | Now (`91ae551`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G18** | PARTIAL (deepened); UI slot MET, series → D | **PARTIAL (deepened)** | series + tests **MET** (`0b6a113`); UI→DDC `psdMode` wiring + pinned dwell residual → **not CLOSED** |
| **G17** | PARTIAL (deepened); recognition BLOCKED | **PARTIAL (deepened)** | adaptiveValue template repair **MET** (`1c7643d`); recognition **BLOCKED** → **not CLOSED** |
| **G19** | PARTIAL (deepened); full Qt columns residual | **PARTIAL (deepened)** | full Qt column matrix **MET** (`91ae551`); edit/re-shot residual → **not CLOSED** |
| **G07** | PARTIAL (deepened); live Detect residual | **PARTIAL (deepened)** | LocalCompute `detectRunFeed` **MET**; full Qt Worker residual → **not CLOSED** |
| **G02** | PARTIAL (deepened); broader chrome residual | **PARTIAL (deepened)** | mode/workspace/overflow/aux QLabels **MET**; further chrome residual → **not CLOSED** |
| **G08** | PARTIAL (deepened); collapse-to-min unverified | **PARTIAL (deepened)** | bottom 29px + left 8px collapse+persist **MET**; right-rail/re-shot residual → **not CLOSED** |
| G11 / G06 | prior | **unchanged** | no status flip |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G18 — PSD frame vs statistical — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior UI slot 驻留帧谱/统计谱 | MET (retained) | `4611be6` |
| Frame/statistical series helpers + both retained | **MET** | `0b6a113` `narrowbandObserveDdc.ts` |
| Tests: mode switch replaces arrays | **MET** | `narrowbandObserveDdc.test.ts` |
| Charts pass `psdMode` into DDC | **NOT MET** | deps + data-attrs only; call site omits `psdMode` |
| Desktop pinned dwell / `contextFramePsd` | **NOT MET** | handoff residual |

### G17 — adaptiveValue repair — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior Adaptive/Fs/ROI + segment/visible | MET (retained) | `72f208c` / `3d3f3e5` |
| `formatAdaptiveValue` / `formatDetectionPhysicalTimes` | **MET** (repaired) | `1c7643d` |
| Recognition | **BLOCKED** | honest |

### G19 — full Qt column matrix — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior table/paging/quality | MET (retained) | `d7d44c1` |
| Full Qt header set (11 cols) | **MET** | `annotationTableMatrix.ts`; `data-column-matrix="qt-full"` |
| Honest empties (Fs/mean/channel) | **MET** | `—` when absent |
| Inline edit / desktop interactive re-shot | **NOT MET** / limited | Bot-B deferred |

### G07 — live Detect feed — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior fuller docks shell | MET (retained) | `d7d44c1` |
| `detectRunFeed` from LocalCompute polls | **MET** | DetectPage → `upsertDetectRun` → BottomPanel |
| Honest empty / no fake engines | **MET** | e2e `data-live-feed`; Bot-B STATUS |
| Full Qt Detect Worker / multi-engine | **NOT MET** | deferred / BLOCKED siblings |

### G02 — broader chrome — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior STFT点数/色板/overflow QLabel | MET (retained) | prior B |
| mode/workspace + overflow 参考·动态 + aux 辅助图 | **MET** | ChartParamStrip / e2e |
| Further strip nuances | residual | Bot-B deferred full re-shot |

### G08 — collapse-to-min — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior bottom height 100–500 + side resize | MET (retained) | `d7d44c1` / `d54af1b` |
| Bottom collapse → 29px + persist | **MET** | `data-collapsed-min`; e2e |
| Left collapse → 8px + persist | **MET** | `data-shell-left-collapsed`; `wss.shellColumns.v1` |
| Right-rail dblclick / full desktop re-shot | residual | not CLOSED |

Bot-B: `artifacts/validation/ui-parity/bot-b/BOT_B_WAVE5_G19_G07_G02_G08.md` (`matrix_pass_claimed: false`).

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED** (adaptiveValue chrome repaired)
2. **G06 residual** — eye/bitstream/recognition BLOCKED; workbench title + interactive STFT (D/F)
3. **G19 residual** — inline edit / full desktop AnnotationPanel re-shot beyond column matrix (B)
4. **G11 residual** — mark body-drag ClosedHand + non-current hover hit (C)
5. **G18 residual** — wire `psdMode` into `computeNarrowbandObserveDdc`; pinned dwell (D; series landed)
6. **G07 residual** — full Qt Detect Worker / multi-engine beyond LocalCompute feed (B)
7. **G02 residual** — remaining strip/SpectrumToolbar chrome nuances (B)
8. **G08 residual** — right-rail collapse edge / desktop re-shot *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G18 / G17 / G19 / G07 / G02 / G08 remain PARTIAL (deepened), not CLOSED. No bucket flips.  
This tip **supersedes** draft INCREMENTAL_1c7643d — D `0b6a113` + adaptiveValue `1c7643d` are covered under subject `91ae551`.