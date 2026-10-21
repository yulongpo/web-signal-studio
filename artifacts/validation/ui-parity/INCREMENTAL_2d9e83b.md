# INCREMENTAL_2d9e83b — G11 Overlay restore + G18 UI→store→DDC (no PASS)

> Supersedes draft `INCREMENTAL_aeacc5f` (same G11/D evidence; adds C `4249d64` UI→store).

| Field | Value |
|-------|-------|
| When | 2026-10-22 00:13 Asia/Shanghai |
| Web tip (audit subject) | **`2d9e83b`** = merge of C `4249d64` (G18 UI→store) on `aeacc5f` (D `08b424e` + B `85dab15` + audit `1a21cce`) |
| Desktop | **`17471a6`** (`rebuild/a143-native`; MarkEdit Move SizeAll/ClosedHand; narrowband PSD mode) |
| Prior Bot-A | `INCREMENTAL_93de5db.md` @ `1a21cce` / tip `93de5db` |
| Scope | **G11** Overlay backticks + ClosedHand body-drag re-verify; **G18** full chain UI→store→DDC. Wave6 G19/G07/G02/G08 noted light. |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `2d9e83b075ff3eb29f580be7418c89793c4bc482` | `origin/main` tip = audit subject |
| `4249d648fe55ae530dbfc63555d4d46e7dad28ed` | Bot-C: G18 UI→store probe + STATUS |
| `aeacc5ff81f9c77d5c8dfbd0b77a8002283919de` | Prior tip (D G18 DDC wire + B Overlay) |
| `08b424e38fc08df78f9b2101a8124ba0a3860ec8` | Bot-D: store→DDC/plot `psdMode` wire |
| `85dab158509ac3de94584b7f6cfd7f2aa9c352df` | Bot-B: wave6 + ChartMarkOverlay backticks restore |
| `1a21cce5a3b5e2cfe8ace1d8b21b6f5479351b06` | Prior Bot-A INCREMENTAL_93de5db |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip (unchanged) |

**ID map:** G11 = Overlay restore + ClosedHand body-drag; G18 = UI→store→DDC full chain.

## Diff vs prior (`93de5db` → `2d9e83b`)

1. **B Overlay unblock (`85dab15` on `aeacc5f`):** Backticks **0 @ `93de5db` → 10 @ `2d9e83b`**. Valid JSX restored. Prior BLOCKER **cleared**.
2. **G11 ClosedHand re-verify:** Runtime-capable path MET — `resolveMarkEdgeCursor` move/grabbing; pointer-capture body drag; probes + CSS `cursor: grabbing`. Residuals: no view-bounds clamp in `applyMarkBodyDelta`; unselected omit SizeAll until selected → **not CLOSED**.
3. **D store→DDC (`08b424e`):** `psdMode` passed into `computeNarrowbandObserveDdc`; client `psdPlot`; frameIndex gated to frame mode; unit mode-swap. Prior “unwired DDC” residual **cleared**.
4. **C UI→store (`4249d64`):** Proves `nb-select-psd-mode` → `setNarrowbandPsdMode` updates store (unit); Workspace select + RightRail `data-psd-mode` present. Completes **UI→store→DDC** chain with D. Broader desktop PSD/dwell chrome still residual → **not CLOSED**.
5. **B wave6 (adjacent):** inline edit / worker chrome / strip / right-collapse — PARTIAL deepened light only.

## Verdict summary

| ID | Prior (`93de5db`) | Now (`2d9e83b`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G11** | PARTIAL (deepened); Overlay **0-backtick BLOCKER** | **PARTIAL (deepened)** | Overlay **BLOCKER CLEARED** (10 backticks); ClosedHand path MET; bounds/unselected residual → **not CLOSED** |
| **G18** | PARTIAL (deepened); `psdMode` unwired | **PARTIAL (deepened)** | UI→store (`4249d64`) + store→DDC (`08b424e`) **MET**; broader PSD chrome residual → **not CLOSED** |
| G19 / G07 / G02 / G08 | PARTIAL | **PARTIAL (deepened, light)** | B wave6; not CLOSED |
| G17 / G06 | prior PARTIAL | **unchanged** | recognition / eye-bitstream BLOCKED |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts:** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G11 — Overlay + ClosedHand — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Overlay 0-backtick BLOCKER | **CLEARED** | 10 backticks @ `2d9e83b` (`85dab15`) |
| Mangling gone | **MET** | no `className={chart-mark-rect}` |
| SizeAll/ClosedHand helpers | **MET** | `resolveMarkEdgeCursor` + unit test |
| Body pointer-capture + cursor | **MET** | Overlay + CSS `data-body-dragging` |
| View-bounds clamp on Move | residual | `applyMarkBodyDelta` no clamp |
| Unselected/non-current hover | residual | `bodyCursor` only if selected |

### G18 — UI→store→DDC — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| UI select → store | **MET** | `nb-select-psd-mode` → `setNarrowbandPsdMode`; `uiStore.narrowbandPsdMode.test.ts` (`4249d64`) |
| Store → DDC kwarg | **MET** | `NarrowbandObserveCharts` passes `psdMode` (`08b424e`) |
| Dual series + mode select | **MET** | `selectNarrowbandPsdSeries` / `plotYForNarrowbandPsdMode` |
| Statistical ignores pinned dwell | **MET** | `frameIndexForMode` frame-only |
| Broader desktop PSD/dwell chrome | residual | beyond mode chain |

## TOP residual (max 8)

1. **G11 residual** — view-bounds clamp; unselected/non-current hover (Overlay **done**)
2. **G17 residual** — recognition **BLOCKED**
3. **G06 residual** — eye/bitstream/recognition BLOCKED; interactive STFT
4. **G19 residual** — desktop AnnotationPanel re-shot (inline edit MET @ wave6)
5. **G18 residual** — broader PSD/dwell chrome (UI→store→DDC **done**)
6. **G07 residual** — multi-engine beyond LocalCompute
7. **G02 residual** — remaining strip chrome nuances
8. **G08 residual** — remaining shell edge / re-shot *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G11/G18 remain PARTIAL (deepened), not CLOSED. No bucket flips.  
Draft `INCREMENTAL_aeacc5f` superseded by this tip (not committed).
