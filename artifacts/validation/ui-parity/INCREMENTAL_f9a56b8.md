# INCREMENTAL_f9a56b8 — short G11/G18/G19 (C bounds+STFT pin · B right-rail pin + G19/G02/G08) (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 00:30 Asia/Shanghai |
| Web tip (audit subject) | **`f9a56b8`** = merge C `e688975` + B `9e175d4` (ort keep C STFT/context + B right-rail) |
| Desktop | **`17471a6`** (`rebuild/a143-native`; PlotWidget updateHover + MarkEdit Move clamp; AnnotationPanel; LinkedCursor framePsd) |
| Prior Bot-A | `INCREMENTAL_5a0b035.md` @ `f0003ec` / tip `5a0b035` |
| Scope | **G11** view-bounds clamp + unselected PointingHand; **G18** STFT/right-rail dwell pin chrome; **G19** AnnotationPanel Qt re-shot; skim **G02/G08** |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `f9a56b86811a274b7f0e80e09d0401bd47710109` | `origin/main` tip = audit subject (merge C+B wave8) |
| `e688975f324c42d7830704781ec4e8b58e92a924` | Bot-C: G11 bounds + unselected PointingHand; G18 STFT pin chrome |
| `9e175d4119301e233307a5d1d9613674069ea2d8` | Bot-B wave8: G18 right-rail pin + G19/G02/G08 re-shot |
| `33bd755` / `701872b` | Bot-D G18 pinned dwell → frame PSD (ancestor; retained) |
| `f0003eca770eb59b067de63eb00302562a1c7956` | Prior Bot-A INCREMENTAL_5a0b035 |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip (unchanged) |

**ID map:** G11/G18(STFT click) = C `e688975`; G18(right-rail)/G19/G02/G08 = B `9e175d4`; merge `f9a56b8` kept both chrome paths (no conflict markers in tip).

## Diff vs prior (`5a0b035` → `f9a56b8`)

1. **C G11 bounds + unselected hover (`e688975`):** `applyMarkBodyDelta` optional `tMin/tMax/fMin/fMax` span-preserving clamp; Overlay body-drag passes `axes.time/freq` domains (`data-g11-bounds-clamp="true"`). `resolveMarkBodyHoverCursor` → unselected `pointer` (PointingHand), selected `move` / dragging `grabbing`; Move only when already selected (additive/first-select returns early). Overlay backticks still **10**. Unit tests: clamp + hover cursor. Residual: file-fullRange optional vs view-domain only; non-current-vs-unselected polish — **not CLOSED**.
2. **C G18 STFT pin chrome (`e688975`):** `nb-stft-pin-host` click → `setNarrowbandPinnedDwellIndex` + `setNarrowbandPsdMode('frame')`; Alt-click clear; `nb-btn-context-frame-psd` disabled until pinned; clear via `nb-btn-clear-pinned-dwell`. Store→DDC pin wire retained from D `33bd755`. Residual: pin maps full host width (no plot-margin exact sample map); linked-cursor scrubber polish — **not CLOSED**.
3. **B G18 right-rail / NB toolbar pin (`9e175d4`):** RightRail DisplayPage + NarrowbandWorkspace dwell pin/clear → same store setters; `data-dwell-pin-chrome="wave8"` / `nb-dwell-pin`. Ort merge kept C STFT/context + B right-rail. Residual: same chrome/scrubber nuances — **not CLOSED**.
4. **B G19 AnnotationPanel re-shot (`9e175d4`):** Headers aligned (`名称 / annotationId`, `起始 / ms`, `结束 / ms`, …); edit form inspector 起始/结束 ms + 下边频/上边频 MHz via `replaceMark`; `data-qt-reshot="wave8-annotation-panel"` on BottomPanel + M06. Prior edit-path empty/single/multi retained. Residual: full desktop interactive parity beyond range inspector — **not CLOSED**.
5. **B G02/G08 skim (`9e175d4`):** Strip `data-strip-unit` / level dB / overflow freq-unit + spacing QLabels; App `data-shell-reshot="wave8"` + `data-edge-side` left/right with prior hit-mins. Light deepen only — **not CLOSED**.

Bot notes: `artifacts/validation/ui-parity/bot-c/STATUS.md`; `artifacts/validation/ui-parity/bot-b/BOT_B_WAVE8_G19_G02_G08_G18.md` (`matrix_pass_claimed: false`). E2E `g18-dwell-pin-g19-g02-g08-wave8.spec.ts` (env may limit; not CLOSE evidence).

## Verdict summary

| ID | Prior (`5a0b035`) | Now (`f9a56b8`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G11** | PARTIAL (Overlay done; bounds/unselected residual) | **PARTIAL (deepened)** | view-bounds clamp + unselected PointingHand **MET**; file-fullRange / polish residual — **not CLOSED** |
| **G18** | PARTIAL (UI→store→DDC done; chrome residual) | **PARTIAL (deepened)** | STFT click pin + right-rail/NB pin chrome **MET**; margin-map / scrubber residual — **not CLOSED** |
| **G19** | PARTIAL (edit-path chrome done; re-shot residual) | **PARTIAL (deepened)** | Qt headers + range inspector re-shot **MET**; full interactive re-shot residual — **not CLOSED** |
| **G02** | PARTIAL (physical/Level/Display/STFT N done) | **PARTIAL (deepened, light)** | unit/freq/spacing QLabels **MET**; further strip residual — **not CLOSED** |
| **G08** | PARTIAL (edge hit attrs done) | **PARTIAL (deepened, light)** | shell-reshot stamps **MET**; full desktop re-shot residual — **not CLOSED** |
| G07 / G17 / G06 | prior PARTIAL | **unchanged** | no status flip |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G11 — bounds clamp + unselected PointingHand — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior ClosedHand body-drag / Overlay backticks=10 | MET (retained) | `85dab15` / prior INCREMENTAL_2d9e83b |
| View-bounds span clamp | **MET** | `applyMarkBodyDelta` t/f Min/Max; Overlay passes axes domains; `data-g11-bounds-clamp`; tests |
| Unselected hover PointingHand | **MET** | `resolveMarkBodyHoverCursor` → pointer; Move only if already selected; `data-g11-unselected-pointer` |
| File-fullRange clamp / non-current polish | residual | Bot-C: view clamp landed; file fullRange optional |

### G18 — dwell pin chrome (STFT + right-rail) — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior UI→store→DDC + frame series | MET (retained) | `4249d64` / `08b424e` / `0b6a113` / `33bd755` |
| STFT click pin / Alt clear / contextFramePsd | **MET** | `nb-stft-pin-host`; `nb-btn-context-frame-psd`; C `e688975` |
| Right-rail + NB toolbar pin/clear | **MET** | RightRail `data-dwell-pin-chrome`; `nb-dwell-pin`; B `9e175d4`; ort kept both |
| Plot-margin exact sample map / scrubber | residual | Bot-C/B deferred |

### G19 — AnnotationPanel Qt re-shot — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior edit-path empty/single/multi | MET (retained) | wave7 `5a0b035` |
| Qt headers + range inspector (ms/MHz) | **MET** | `ANNOTATION_TABLE_HEADERS`; BottomPanel edit form; `data-qt-reshot="wave8-annotation-panel"` |
| Full desktop interactive AnnotationPanel | residual | Bot-B deferred beyond range inspector |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition BLOCKED; interactive STFT
3. **G19 residual** — full desktop AnnotationPanel interactive parity (headers/range inspector **done** @ wave8)
4. **G11 residual** — file-fullRange clamp / non-current polish (view-bounds + PointingHand **done**)
5. **G18 residual** — plot-margin pin map / linked-cursor scrubber (STFT+rail pin chrome **done**)
6. **G07 residual** — full Qt Detect Worker beyond LocalCompute caps slots
7. **G02 residual** — remaining SpectrumToolbar/strip nuances (wave8 units/spacing **done**)
8. **G08 residual** — full desktop shell re-shot *(or G09/G16 OPEN)* (wave8 reshot stamps **done**)

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G11/G18/G19 remain PARTIAL (deepened), not CLOSED. No bucket flips.