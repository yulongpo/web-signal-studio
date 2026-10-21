# INCREMENTAL_93de5db — short G11 body-drag ClosedHand (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 00:07 Asia/Shanghai |
| Web tip (audit subject) | **`93de5db`** = merge of C `612c8a1` (G11 ClosedHand) + prior audit `ee161f9` / content tip `91ae551` |
| Desktop | **`17471a6`** (`rebuild/a143-native`; PlotWidget::updateHover + MarkEdit Move → SizeAll / ClosedHand) |
| Prior Bot-A | `INCREMENTAL_91ae551.md` @ `ee161f9` / content tip `91ae551` |
| Scope | **G11** selected-mark **body-drag ClosedHand** only (short tip) |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `93de5db46405b717d2d046a0bcb4fc46ce4b10a9` | `origin/main` tip = audit subject (merge C + INCREMENTAL_91ae551) |
| `612c8a174178918b6103bdc82a7ec5c493a9f074` | Bot-C: G11 mark body-drag ClosedHand cursor |
| `ee161f9625a4e3d78b8cce1033a82f6a3ea7296a` | Prior Bot-A INCREMENTAL_91ae551 |
| `91ae5511d1e3668fd0b1a90c55de0b4ef10634e9` | Prior content tip (B wave5) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip (unchanged) |

**ID map:** G11 = body-drag ClosedHand (C `612c8a1`).

## Diff vs prior (`91ae551` → `93de5db`)

1. **C G11 body-drag ClosedHand** (`612c8a1`): Intent matches desktop MarkEdit Move @ `17471a6` — selected body hover **SizeAll** (`move`) + drag **ClosedHand** (`grabbing`); preserves prior 8-handle edge cursors.
2. **Helpers MET:** `resolveMarkEdgeCursor({ edge:'move', draggingMove })` → `move` / `grabbing` (`chartHitZone.ts` + unit test); `applyMarkBodyDelta` keeps time/freq span (`chartGesture.ts` + unit test); `App.css` `.chart-mark-rect[data-body-dragging='true'] { cursor: grabbing }`; probes `data-g11-body-drag` / `data-body-dragging` / `data-body-drag-cursor`.
3. **Overlay BLOCKER (not CLOSED):** `ChartMarkOverlay.tsx` at `612c8a1`/`93de5db` has **all template literals stripped** (0 backticks vs 10 at `91ae551`). Landed JSX is invalid: `className={chart-mark-rect}`, `data-testid={chart-mark-}`, mangled handle `className` / `aria-label`. Body-drag pointer capture + cursor wiring cannot compile/run as shipped. Bot-C STATUS also notes bounds-clamp residual + unselected mark PointingHand-until-selected.
4. **Prior G11 MET retained in intent:** axis OpenHand/ClosedHand, overview OpenHand, 8-handle edgeCursor — unchanged helpers; overlay breakage may also regress handle chrome until repaired.

## Verdict summary

| ID | Prior (`91ae551`) | Now (`93de5db`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G11** | PARTIAL (deepened); body-drag ClosedHand residual | **PARTIAL (deepened)** | helpers + CSS + probes **MET** (`612c8a1`); **ChartMarkOverlay.tsx template-literal corruption BLOCKS runtime** + bounds/unselected residual → **not CLOSED** |
| G17 / G06 / G19 / G18 / G07 / G02 / G08 | prior PARTIAL | **unchanged** | no status flip |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G11 — body-drag ClosedHand — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior 8-handle edgeCursor | MET (retained intent) | `4611be6`; helpers intact |
| Prior axis/overview OpenHand/ClosedHand | MET (retained) | prior C tips |
| `resolveMarkEdgeCursor` SizeAll/ClosedHand | **MET** | `draggingMove` → `grabbing`; unit test |
| `applyMarkBodyDelta` span-preserving Move | **MET** | `chartGesture.ts` + unit test |
| CSS `cursor: grabbing` while body-dragging | **MET** | `App.css` `data-body-dragging` |
| Overlay body pointer-capture + cursor apply | **BLOCKED / NOT MET as shipped** | `ChartMarkOverlay.tsx` template literals stripped at `612c8a1` (0 backticks) — invalid JSX |
| Desktop bounds clamp / unselected hover | residual | Bot-C STATUS honest gap |
| Non-current hover hit | residual | prior TOP |

## TOP residual (max 8, parallel-friendly)

1. **G11 residual** — **repair ChartMarkOverlay.tsx template literals** (C blocker); then re-verify body-drag ClosedHand + bounds clamp + unselected/non-current hover
2. **G17 residual** — recognition **BLOCKED** (adaptiveValue chrome repaired)
3. **G06 residual** — eye/bitstream/recognition BLOCKED; workbench title + interactive STFT (D/F)
4. **G19 residual** — inline edit / full desktop AnnotationPanel re-shot (B)
5. **G18 residual** — wire `psdMode` into `computeNarrowbandObserveDdc`; pinned dwell (D)
6. **G07 residual** — full Qt Detect Worker / multi-engine beyond LocalCompute feed (B)
7. **G02 residual** — remaining strip/SpectrumToolbar chrome nuances (B)
8. **G08 residual** — right-rail collapse edge / desktop re-shot *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G11 remains PARTIAL (deepened), not CLOSED. No bucket flips.  
Blocker for CLOSE: corrupted `ChartMarkOverlay.tsx` at tip `93de5db` (introduced in `612c8a1`).
