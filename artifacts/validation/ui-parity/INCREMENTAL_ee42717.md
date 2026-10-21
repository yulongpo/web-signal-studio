# INCREMENTAL_ee42717 — G11/G18 (C) + G17 segment/visible (E) delta (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-21 23:54 Asia/Shanghai |
| Web tip (audit subject) | **`ee42717`** = merge Bot-E `3d3f3e5` over Bot-C `4611be6` (G11 mark-edge 8 handles + G18 PSD mode UI) |
| Desktop | **`17471a6`** (`rebuild/a143-native`; `PlotWidget::edgeCursor` / 8 handles; narrowband 驻留帧谱/统计谱; DetectionCard rangeOrigin) |
| Prior Bot-A | `INCREMENTAL_f5171fc.md` @ `98d858d` / content tip `f5171fc` |
| Supersedes | Planned **INCREMENTAL_4611be6** (CAO retarget mid-audit to `ee42717`; C @ `4611be6` folded herein) |
| Scope | Focus **G11 mark-edge 8 handles**, **G18 PSD mode UI slots** (DSP→D), **G17 active-segment + visible navWindow align** (recognition BLOCKED) |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `ee42717448479fe4904e8acaaa25b85f6c0107c1` | `origin/main` tip = audit subject (`merge(bot-e): G17 active-segment + visible-region`) |
| `3d3f3e5d059a8fe5efe2a1fcf03cc04e4ebe0e45` | Bot-E: G17 active-segment list + visible↔navWindow align |
| `4611be637a20a28e7591a2cd149bd30bcc19fcb3` | Bot-C: G11 mark-edge 8 handles + G18 PSD mode UI slot |
| `98d858d10a1e70995039b20307538d14c70df6df` | Prior Bot-A INCREMENTAL_f5171fc |
| `f5171fc` | Prior audit subject (pre-C/E this wave) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip (unchanged) |

**ID map:** G11 = mark-edge SizeFDiag/BDiag/Hor/Ver (C) · G18 = 驻留帧谱/统计谱 UI slot (C; series D) · G17 = active-segment list + visible-region align (E; recognition BLOCKED).

## Diff vs prior (`f5171fc` → `ee42717`)

1. **C G11 mark-edge** (`4611be6`): `resolveMarkEdgeCursor` + **8 handles** (nw/n/ne/e/se/s/sw/w) on current mark; CSS per-edge (`nwse`/`nesw`/`ew`/`ns`); `data-g11-mark-edge` / `data-handle-count="8"` / `data-mark-edge-cursor`. Matches desktop `PlotWidget::edgeCursor` + `handles`. Unit tests corners/edges/move. Residual: mark **body** drag ClosedHand (`draggingMove`) not fully wired in overlay pointer path; hover-hit without current still limited. **Not CLOSED.**
2. **C G18 PSD mode UI** (`4611be6`): `narrowbandPsdMode` (`frame`|`statistical`) in uiStore; NB toolbar `nb-select-psd-mode` (驻留帧谱/统计谱); RightRail `display-summary` shows mode label + `data-psd-mode`. Handoff `G18-PSD-MODE-HANDOFF.md` — **DSP series still Bot-D** (UI does not change observe PSD curve). **Not CLOSED.**
3. **E G17 active-segment + visible align** (`3d3f3e5`): `listActiveMarkSegments()` from `__wssM06` (real segments / compat start-end; empty = honest empty, no invented rows); `detectionActiveSegment` select enabled when segments exist; `visible` origin syncs `navWindowTime`→sample indexes via `secondsToSampleIndex`+Fs; `available-file` uses `availablePrefix().availableSamples`. Evidence `G17_SEGMENT_VISIBLE_ALIGN.md`. **Recognition still BLOCKED.** Prior Adaptive/Fs/ROI chrome retained. **Not CLOSED.**

## Verdict summary

| ID | Prior (`f5171fc`) | Now (`ee42717`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G11** | PARTIAL (deepened); mark-edge residual | **PARTIAL (deepened)** | 8-handle edgeCursor **MET** (`4611be6`); body-drag ClosedHand / non-current hover residual → **not CLOSED** |
| **G18** | PARTIAL (deepened); PSD mode C/D `—` | **PARTIAL (deepened)** | PSD mode UI slot **MET** (`4611be6`); frame vs statistical **series** still D → **not CLOSED** |
| **G17** | PARTIAL (deepened); active-segment + visible align residual + recognition BLOCKED | **PARTIAL (deepened)** | active-segment list + visible↔navWindow **MET** (`3d3f3e5`); recognition **BLOCKED** → **not CLOSED** |
| G19 / G07 / G02 / G08 / G06 | prior | **unchanged** (membership) | no status flip |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G11 — mark-edge 8 handles — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior axis OpenHand/ClosedHand + axis-only pan + overview OpenHand | MET (retained) | `363744f` / `3535889` / `2ac1f9b` |
| 8 handles (corners + edge midpoints) | **MET** (was NOT) | `ChartMarkOverlay` HANDLES; `data-handle-count="8"` |
| Per-edge cursors SizeFDiag/BDiag/Hor/Ver | **MET** (was NOT) | `resolveMarkEdgeCursor`; App.css per-edge classes |
| Mark body SizeAll / ClosedHand while body-drag | **PARTIAL** | cursor `move` on selected rect; `draggingMove→grabbing` helper present but overlay drag path does not flip to grabbing |
| Hover-hit resize without current selection | **NOT MET** / limited | handles only on `isCurrent` |

Bot-C: `artifacts/validation/ui-parity/bot-c/STATUS.md` (`No self-PASS`). **Not CLOSED.**

### G18 — PSD mode UI slot — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior 参考/动态 + STFT N·palette shell | MET (retained) | prior B tips |
| Mode select 驻留帧谱 / 统计谱 | **MET** (was NOT) | `nb-select-psd-mode`; `narrowbandPsdMode` |
| display-summary mode label | **MET** (was NOT) | RightRail `data-psd-mode` / label text |
| Frame vs statistical PSD **series** / pinned STFT-frame dwell | **NOT MET** | Bot-D handoff; series unchanged when mode flips |

Bot-C: `artifacts/validation/ui-parity/bot-c/G18-PSD-MODE-HANDOFF.md` (`matrix_pass_claimed: false`). **Not CLOSED.**

### G17 — active-segment + visible align — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior AdaptiveValueEdit / Fs notes / rangeOrigin+ROI chrome | MET (retained) | `72f208c` |
| Active-segment real list binding | **MET** (was NOT) | `listActiveMarkSegments`; enabled select when segments exist |
| Visible-region ↔ main-chart navWindow | **MET** (was NOT) | `applyVisibleRange` + `navWindowTime` effect |
| available-file ↔ IQ availablePrefix | **MET** (deepened) | `availableFileSampleEnd` |
| Recognition engine / labels | **BLOCKED** | honest; no fake path |

Bot-E: `docs/acceptance/evidence/bot-e/G17_SEGMENT_VISIBLE_ALIGN.md` (`matrix_pass_claimed: false`). **Not CLOSED.**

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED** (E; active-segment + visible align landed)
2. **G06 residual** — eye/bitstream/recognition stay BLOCKED; workbench title + interactive STFT (D/F)
3. **G19 residual** — full Qt AnnotationPanel beyond Qt-ish table/paging/quality (B)
4. **G11 residual** — mark body-drag ClosedHand + non-current hover hit (C; 8-handle edgeCursor landed)
5. **G18 residual** — frame vs statistical PSD **series** / pinned dwell (D; UI slot landed)
6. **G07 residual** — live Detect Worker feeds / full Qt port (B)
7. **G02 residual** — broader strip/SpectrumToolbar chrome nuances (B)
8. **G08 residual** — rail collapse-to-min (≈0 px) re-verify *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G11 / G18 / G17 remain PARTIAL (deepened), not CLOSED. No bucket flips this wave.  
This tip **supersedes** any draft INCREMENTAL_4611be6 — C @ `4611be6` is covered here under subject `ee42717`.