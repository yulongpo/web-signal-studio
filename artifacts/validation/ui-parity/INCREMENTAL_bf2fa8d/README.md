# INCREMENTAL_bf2fa8d — D4 axis-bind deepen + SegmentMs MET + D5 live (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 08:21 Asia/Shanghai |
| Web tip | **`bf2fa8d`** = `bf2fa8decbe4bcd2e8f1224e87d2831f2c408cf3` |
| Desktop | **`17471a6`** |
| Prior A tip on main | `27a3511` (`INCREMENTAL_555d001` merge) — this tip is newer |
| Supersedes audit tip | `655761a` / `INCREMENTAL_555d001` (`655761ae96b7535a89563fe7cdb7f839458b8d87`) |
| Scope | C D4 physical-view axis bind; C A2 fixed-SegmentMs BW; B D5 live mode-wheel |
| Rule | Docs-only; **matrix_pass_claimed=false**; no G06/G17 invent; apps delta present |
| Evidence | `docs/acceptance/evidence/bot-a/INCREMENTAL_bf2fa8d/` + `artifacts/validation/ui-parity/INCREMENTAL_bf2fa8d/` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `bf2fa8decbe4bcd2e8f1224e87d2831f2c408cf3` | `origin/main` tip |
| `661ab26` / `dacc9a2` / `a57930c` | C D4 axis-bind + A2 SegmentMs BW |
| `e9d84be` | B D5 mode-wheel live on chart-header-toolbar |
| `27a351108135d4a1f8158b8838401cf7d58bd6ad` | Prior Bot-A merge on main |
| `655761ae96b7535a89563fe7cdb7f839458b8d87` | Superseded Bot-A tip `INCREMENTAL_555d001` |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop |

## D4 G09 — axis-bind (**PARTIAL** deepened; not MET)

**Cite:** `physicalViewSpans.ts`; `MainChartHost` `publishPhysicalSpans` / `mainChartPhysicalSpans`; `BottomScaleChrome` `data-axis-bind=physical-view`; `WAVE-D4-G09-AXIS-BIND-A2-G16.md`.

| Check | Result |
|-------|--------|
| Prior residual **C axis tick bind** | **closed** (physical-view spans → BottomScale ΔT/ΔF; Waterfall axis-swap in `physicalSpansFromView`) |
| AxisOverlay tick **paint** on HeatmapCanvas | already **MET** (unchanged) |
| `data-g09=partial` retained; screenshot vs rebuild | **not claimed** → stays **PARTIAL** |

**Verdict:** **PARTIAL** (functional bind landed). Residual: optional pixel/screenshot parity vs `17471a6` — do **not** claim MET.

## SegmentMs / A2 fixed path (**MET**)

**Cite:** `a57930c`; `WAVE33-A2-FIXED-SEGMENTMS-BW-HANDOFF.md`; `MainChartHost` fixed-SegmentMs uses `analysisBandwidthHz` + fs fallback; `visibleBandwidthHz` covers auto + fixed.

| Check | Result |
|-------|--------|
| Auto-N visible BW (prior) | **MET** retained |
| Fixed-SegmentMs `bandwidthHz` (was fs-only residual) | **closed** → **MET** |
| No STFT-DDC / non-PoT invent | **honest** |

**A2 overall:** **MET** (auto-N + fixed-SegmentMs).

## D5 G16 — live mode-wheel (**PARTIAL** deepened)

**Cite:** `BOT_B_D5_G16_LIVE_8a5b548.md`; `ChartParamStrip` `data-testid=mode-wheel` `data-live-dom=true` on `chart-header-toolbar`; demoted `SpectrumToolbar` → `mode-wheel-demoted`.

| Check | Result |
|-------|--------|
| Live DOM `data-g16` wrapper (prior G gap) | **landed** |
| STFT/Waterfall/Wave/PSD store setters | **landed** |
| **C G16 consumers** | **actionable / effectively landed** via existing `MainChartHost.chartMode` + `AuxChartHost.auxChartKind` (no new blocked consumer work for basic modes) |
| `data-matrix=insufficient` enable/disable matrix | **residual** — **no invent**; wait desktop matrix |

**Verdict:** **PARTIAL**. Prior “C G16 consumers blocked” → **movable/done** for store consumers; remaining matrix work is **not** inventable.

## Soft fences (unchanged BLOCKED)

| Item | Status |
|------|--------|
| ⑥ D non-PoT / STFT-DDC | **BLOCKED** |
| G18 recognition STFT written | **BLOCKED** |
| G06 / G17 | **BLOCKED** |
| G02 Multitaper / Burg | **BLOCKED** (G02 stays **PARTIAL** overall) |
| A3 / A5 | **MET** retained |

## Counts

Prior @ `555d001`: OPEN **5** · PARTIAL **18**.  
This tip deepens G09/G16 within PARTIAL; closes A2 residual under G02 — **no OPEN→CLOSED**.  
**Counts:** OPEN **5** · PARTIAL **18** · CLOSED **2** · DOCS **1**  
**backticks:** **16** · `data-native-qfiledialog=false`

## Explicit

**matrix_pass_claimed: false** · **ui_parity_pass_claimed: false** · **pass_claimed: false**