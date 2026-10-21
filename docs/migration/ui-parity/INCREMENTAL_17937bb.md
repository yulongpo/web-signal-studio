# UI parity gap patch — Web `17937bb` vs desktop `17471a6`

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 21:30:33 |
| Author | Bot-A (`work/bot-a-audit`) |
| Desktop | `rebuild/a143-native` **`17471a6`** = `17471a6488383b456281d12cb1a6d3d80290205d`（unchanged） |
| Prior Bot-A tip | `2000c1e` / `INCREMENTAL_196db21.md`（audit vs Web `196db21`） |
| **This Web tip** | **`17937bb`** = `17937bb3a735d0df7058a3714aa353a88abb0e23` |
| Scope | Incremental re-check of Bot-B/C/D claims only; **no implementation edits** |

## What landed on Web since `196db21`

| Commit | Subject | Claimed owner |
|--------|---------|---------------|
| `e897a25` / merge `b6cb302` | VerticalSplitter defaults nav=82 / aux=205 | Bot-C |
| `4379e84` / merge `0370cb0` | Nav/Aux host chrome + G02 SpectrumToolbar demotion | Bot-B |
| `c76e08a` / merge `17937bb` | Aux Wave raw IQ from `sigmf_data_demo` (chunked file-io) | Bot-D |
| `5f44de3` | UTF-8 import-sigmf-stream (Bot-F; out of this parity slice) | Bot-F |

## Evidence check (strict — no self-PASS)

### Bot-B — host / chrome / G02

| Claim | Verdict | Evidence |
|-------|---------|----------|
| Compose Nav/Aux/Main + VerticalSplitter | **OK** | `App.tsx` hosts `NavChartHost` / `AuxChartHost` / `MainChartHost` / `VerticalSplitter` |
| NavChrome zoom/pause/segments; settings NOT in nav | **OK** | `NavChrome.tsx` `data-testid="nav-chrome"`; e2e asserts Level absent from nav |
| Demote always-on SpectrumToolbar between aux↔main | **OK** | `App.tsx` **does not import** `SpectrumToolbar`; `AuxParamStrip` + `SpecParamStrip` on chart headers (`ChartParamStrip.tsx`) |
| Full G02 PASS (`f9f05bb` caption + overflow focus) | **NOT YET** | Spec strip still carries `data-testid="spectrum-toolbar"` / class `spectrum-toolbar`; no dedicated ChartControlStrip-style captions; overflow focus remount not proven |

→ **G02: OPEN → PARTIAL**. Residual blocks CLOSED.

### Bot-C — splitter 82/205

| Claim | Verdict | Evidence |
|-------|---------|----------|
| Store defaults 82 / 205 | **OK** | `uiStore.ts` `navPaneHeightPx: 82`, `auxPaneHeightPx: 205` |
| App / splitter `defaultPx` | **OK** | `App.tsx` `DESKTOP_NAV_DEFAULT=82`, `DESKTOP_AUX_DEFAULT=205`; short-window aux `176` |
| Drag + double-click reset | **OK** | `VerticalSplitter.tsx` pointer drag + `onDoubleClick` → `defaultPx` |
| Match desktop `enforceLayout` | **OK (±)** | Desktop `main_window.cpp` `enforceLayout`: nav=82, aux=`height()<850?176:205`. Web short threshold **900** (not 850) — soft mismatch only |
| e2e asserts defaults | **OK** | `bot-b-host-wiring.spec.ts`: `navH===82`, `auxH in [205,176]` |

→ **G05: PARTIAL → CLOSED** (ACCEPTANCE ①拖 ②双击 ③默认 82/205). Soft note: short-window H threshold 900 vs desktop 850.

### Bot-D — Wave raw IQ

| Claim | Verdict | Evidence |
|-------|---------|----------|
| Wave ≠ STFT envelope | **OK** | `auxWaveRawIq.ts` + `AuxChartHost.tsx`: `readAuxWaveRawIq` / IqRms; `data-aux-wave-source="sigmf_data_demo"`; `chartDisplayDerive.deriveWaveInWindow` demoted to tests-only |
| IQ only `resources\sigmf_data_demo` | **OK** | `DEFAULT_SIGMF_DATA_DEMO_DIR = D:\project\signal_studio_rebuild\resources\sigmf_data_demo`; stem `0000000` |
| PSD path | Display-only | Still `derivePsdInWindow` from spectrogram (not claimed as raw PSD) |
| Runtime / visual PASS | **NOT by Bot-A** | Unit tests `auxWaveRawIq.test.ts` present; Bot-A did **not** run Playwright this turn; `/@fs` demo load can fail off HH-laptop paths |

→ **G04: PARTIAL** (Wave residual from `196db21` **cleared in code**; FULL visual PASS deferred to QA). **Not CLOSED**.

### G03 chrome follow-up (Bot-B)

| Prior residual @ `196db21` | Now |
|----------------------------|-----|
| 无 zoom/pause / 导航图头 chrome；条高 36 | **Cleared**: `NavChrome` + pane default 82 |
| FULL: 滚轮改窗宽 | **Still open**: `NavigationChart.tsx` has drag window, **no `onWheel`** |

→ **G03: stays PARTIAL**.

## Status deltas vs `INCREMENTAL_196db21`

| ID | Was | Now | Notes |
|----|-----|-----|-------|
| G01 | OPEN | OPEN | 仍无 menubar |
| **G02** | OPEN | **PARTIAL** | Toolbar demoted; `f9f05bb` caption/overflow 未满 |
| G03 | PARTIAL | PARTIAL | chrome 残差清除；滚轮改窗宽仍缺 |
| G04 | PARTIAL | PARTIAL | Wave=raw IQ 代码路径已落地；QA 视觉未跑 |
| **G05** | PARTIAL | **CLOSED** | 默认 82/205 + 拖 + 双击；e2e 断言 |
| G06–G26 | (unchanged class) | same | 本轮未复审实现；状态沿用 `2000c1e` 表 |

## Counts after this patch

| 状态 | Count | IDs |
|------|-------|-----|
| OPEN | **12** | G01, G06–G10, G15–G18, G21–G24 |
| PARTIAL | **10** | G02–G04, G11–G14, G19–G20, G26 |
| DOCS | **1** | G25 |
| CLOSED | **1** | **G05** |

P0 still ~14 IDs in scope; **G05** exits P0 open set.

### Top remaining P0

1. **G01** — 顶栏菜单/命令栏  
2. **G02** — 图头 caption 标签 + overflow 保焦点（`f9f05bb`）  
3. **G03** — 导航滚轮改窗宽  
4. **G04** — QA 确认 raw IQ 可视曲线（代码已就绪）  
5. **G06 / G07** — 窄带去 stub + 底栏  
6. **G17 / G14** — DetectionCard + 独立 ROI 确认条  
7. **G11–G13** — 框选放大 / 右键完备 / 标记控制点  
8. **G26** — Detect UI 不得暴露 `.pth` 可选项  

## Canonical docs updated

- `artifacts/validation/ui-parity/INCREMENTAL_17937bb.md`（本文件）
- `artifacts/validation/ui-parity/baseline/UI_PARITY_GAP_AUDIT.md`
- `artifacts/validation/ui-parity/baseline/UI_PARITY_ACCEPTANCE.md`
- mirrors: `docs/migration/ui-parity/*`
- `docs/migration/UPSTREAM_BASELINE.json` / `UPSTREAM_SYNC_LOG.md`（桌面 tip 未变；记录 Web tip→`17937bb`）

**Constraints unchanged:** IQ = `resources\sigmf_data_demo` only; models = rebuild-tree `*.engine` only. No shared-tree checkout. No implementation edits.
