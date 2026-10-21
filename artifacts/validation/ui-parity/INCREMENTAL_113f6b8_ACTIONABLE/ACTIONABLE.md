# INCREMENTAL_113f6b8_ACTIONABLE — B/D/C 可立刻做 (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 07:46 Asia/Shanghai |
| Web tip | **`113f6b8`** = `113f6b8c73f456eb548cd57e314ee8da3f1bd861` (merge A `INCREMENTAL_1ec1eca`) |
| Desktop | **`17471a6`** `ui/spectral_settings_widget.cpp` + `app/main_window.cpp` `buildMenus` |
| Prior | `INCREMENTAL_1ec1eca/` @ `f3e78a9` |
| Rule | Docs-only; **matrix_pass_claimed=false**; G06/G17 **BLOCKED** (no invent); G02 stay **PARTIAL** |
| Machine | HH-laptop `D:\project\_wt_bot_a_audit` |

## Honesty fence (do not cross)

| Keep BLOCKED / not in this list as MET |
|----------------------------------------|
| Multitaper / DPSS NW / tapers / Burg order compute |
| non-PoT window length (`webFftSizeFromAnalysisSamples` PoT round stays) |
| Full STFT-DDC / decimate pipeline inside STFT engine |
| G06 eye/bitstream · G17 recognition elevation |
| True native QFileDialog (`data-native-qfiledialog=false`) |
| Full Qt DetectionWorker beyond LocalCompute |
| Pure G08 desktop pixel re-shot as sole deliverable |

**G02 remains PARTIAL** even after all items below land (PoT + Welch-only fence).

## References

| Side | Path |
|------|------|
| Desktop SpectralSettings | `D:\project\signal_studio_rebuild\ui\spectral_settings_widget.cpp` / `.h` |
| Desktop buildMenus | `D:\project\signal_studio_rebuild\app\main_window.cpp` `MainWindow::buildMenus` (~L442+) |
| Desktop spectral plan | `infrastructure/spectral_analysis.cpp` + Bot-D `BOT_D_G02_RESIDUAL_ab32f6e.md` |
| Web strip | `apps/web/src/components/ChartParamStrip.tsx` |
| Web STFT host | `apps/web/src/components/MainChartHost.tsx` |
| Web store | `apps/web/src/store/uiStore.ts` (`stftAutoNbPref` / `stftRemoveMeanPref` / `dsp*`) |
| Web shortcuts | `apps/web/src/hooks/useMenuBarShortcuts.ts` + `MenuBar.tsx` |
| Web contract | `packages/contracts/src/spectral.ts` (`resolveAnalysisSamples`, `STFT_BLOCKED_METHODS`) |
| Prior matrix | `artifacts/validation/ui-parity/INCREMENTAL_1ec1eca/MATRIX.md` |

---

## 1) G02 — full Qt SpectralSettings: landable **without** Multitaper/Burg/non-PoT/STFT-DDC

Desktop STFT widget fields (`psd=false`): Method, Window, Overlap%, SegmentMs, Kaiserβ, DPSS NW/tapers, Burg order, RemoveMean.  
**Already MET (leave):** Welch-only method + blocked list; Window/Overlap/stftN; Kaiserβ gate; auto-N (segmentMs=0) + RemoveMean prefs→DSP; strip AutoN/Mean0 publish.

| # | Owner | Item (concrete) | Effort | Blocker |
|---|-------|-----------------|--------|---------|
| **A1** | **B** (+ light **D** if store field) | **Fixed SegmentMs duration combo** when auto-N **off**: desktop `duration_` values `0.1 / 1 / 10 / 100` ms (`objectName` `stftSegmentMs`). Add `stftSegmentMsPref` + overflow `<select data-testid="select-stft-segment-ms">`; `MainChartHost` pass `segmentMilliseconds: pref` (not only omit). D `resolveAnalysisSamples` already supports `segmentMilliseconds > 0` → PoT fft via `webFftSizeFromAnalysisSamples`. | S–M | None if stay PoT |
| **A2** | **B** / **C** | **Display bandwidth → `bandwidthHz`** for auto-N: today host hardcodes `bandwidthHz: session.sampleRateHz` / synthetic `1e6`. Wire nav/zoom freq span (or main spectrogram visible BW) when available; fallback fs. Still no STFT-DDC. | M | Needs existing freq-span state (C if only in chart host) |
| **A3** | **D** | Publish **post-resolve** stamps: e.g. `dspAnalysisSamples` / `dspFftSizeActive` after auto/fixed SegmentMs resolve (strip already shows fft/seg; make auto-on `0.000 ms` + resolved N explicit). | S | None |
| **A4** | **B** | **PSD-only** `SpectrumStatistic` Mean/Max/Min chrome when aux/main is PSD (desktop `psdStatistic`); keep STFT `NA_PSD_ONLY` / never fake Mean on STFT strip. | M | Only if PSD compute path already consumes statistic (else D first) |
| **A5** | **B** | Persist SpectralSettings prefs into project JSON (mirror `spectral_settings_json.h` keys: window/overlap/segmentMs/kaiserBeta/removeMean/autoNb) via `packages/project-io` save/load. | M | Coordinate with F if project schema owner |
| **A6** | **B** | Desktop-like **validation tooltips** on Overlap/SegmentMs (`lastValidValue` / invalid draft) — chrome only; reject out-of-range without silent clamp. | S | None |

**Explicitly NOT A-list:** Multitaper method enable, NW/tapers, Burg order, non-PoT fftSize, STFT internal decimate/DDC.

---

## 2) G08 — buildMenus / shortcuts (landable wiring, not pixel-only)

**Already MET:** File New/Open JSON/Save; Edit Undo/Redo/Delete; View Back/Forward Alt+Left/Right; six-menu shell; `data-g08-shortcuts=wave23`.  
Menu **items** already present for fit/restore/rename/remove/demo (`MenuBar.tsx` testids) — gaps are mostly **shortcut / accel / SelectAll** parity.

| # | Owner | Item | Effort | Blocker |
|---|-------|------|--------|---------|
| **B1** | **B** | **Ctrl+A SelectAll marks** — desktop `main_window.cpp` ~L4234 `QKeySequence::SelectAll` ShortcutOverride. Extend `useMenuBarShortcuts` + MenuBar handler; skip typing targets. | S | Needs mark-select-all API in M-06 / uiStore (exists or thin wrapper) |
| **B2** | **B** | Add `data-accel` + `menubar-accel` labels for menu items that have handlers but no accel chrome (e.g. fit/restore if desktop later adds keys; at minimum mirror any rebuild shortcuts found). Today Fit/Restore have **no** `setShortcut` on desktop — **do not invent** fake keys; only wire keys that rebuild actually sets. | S | Verify rebuild before inventing |
| **B3** | **B** | **Open project folder** / **load sample** keyboard or consistent accel documentation; ensure `menu-open-project-folder` / `menu-load-sample` disabled/title honesty matches capability. | S | None |
| **B4** | **B** | Recent-projects menu edge: empty + clear already exist — add keyboard focus trap / Esc close parity with Qt menu (a11y), not pixel shot. | S | None |
| **B5** | **G** (optional) | Independent six-menu + SelectAll evidence pack after B1 — **not** a CLOSED claim. | S | After B1 |

**Not actionable as sole B tip:** full desktop chrome pixel diff / font metrics re-shot.

---

## 3) G07 — Worker: UI/state without inventing full Qt Worker

**Already MET:** LocalCompute client + `detectRunFeed` inspector (wave17). Residual = full Qt DetectionWorker.

| # | Owner | Item | Effort | Blocker |
|---|-------|------|--------|---------|
| **C1** | **B** | Detect feed: cancel/poll UX for `queued`/`running` (`BottomPanel.tsx` already has cancel path) — surface error/progress % from LocalCompute status JSON honestly; no fake Worker. | S–M | Depends on LocalCompute API fields |
| **C2** | **B** | Persist `data-native-worker="false"` / honest banner that only LocalCompute is live (if not already stamped). | S | None |
| **C3** | **E** / **D** | If LocalCompute supports SSE/WS progress — wire feed updates; still not Qt Worker. | M | API must exist |

**Not actionable:** shipping in-browser DetectionWorker clone of Qt.

---

## 4) G18 / G19 / G11 / G09 / G16 — evidence-backed next (no G06/G17 invent)

| # | Owner | Gap | Item | Effort | Blocker |
|---|-------|-----|------|--------|---------|
| **D1** | **C** | G18 | Soft regression only: keep mod STFT + observe multi-view linkedCursor; **do not** build recognition STFT panes (G17 BLOCKED). Optional: linkedCursor on existing non-recog NB aux charts if hosts exist without recog. | S | No recog invent |
| **D2** | **B** / **F** | G19 | Save path polish: `browserSaveFile.ts` `showSaveFilePicker` suggestedName/mime; keep `data-native-qfiledialog=false`. Engineering-tree add-file chrome vs desktop `showAddFileDialog` labels only. | S–M | Never claim native MET |
| **D3** | **C** | G11 | Hover sync / ClosedHand / remaining PlotWidget paint vs `ChartMarkOverlay` + `hoveredMarkId` (`m06-mark-session.ts`) — paint/gesture only. | M | None |
| **D4** | **B** / **C** | G09 OPEN | Main-chart bottom scale / range readout (UI-28 catalog) — first stub QLabel strip under main chart if missing. | M | Design from desktop screenshot |
| **D5** | **B** / **C** | G16 OPEN | Mode-wheel rules Wave/PSD/STFT/Waterfall (UI-09/10) — enable/disable aux modes per desktop rules without fake demod. | M | Needs desktop mode matrix note |

---

## Priority queue — 「B/D/C 可立刻做」 (top cut)

1. **A1** B — SegmentMs `0.1/1/10/100` when auto-N off → `resolveAnalysisSamples`  
2. **A2** B/C — real `bandwidthHz` from visible span (fallback fs)  
3. **A3** D — publish resolved analysisSamples / fft after auto  
4. **B1** B — Ctrl+A SelectAll marks in `useMenuBarShortcuts`  
5. **A5** B/F — persist spectral prefs in project JSON  
6. **A6** B — Overlap/SegmentMs validation tooltips  
7. **C1** B — Detect LocalCompute progress/cancel honesty  
8. **D2** B — Save picker mime/name polish (qfiledialog stays false)  
9. **D3** C — G11 hover/ClosedHand paint residual  
10. **A4** B — PSD-only SpectrumStatistic (STFT stays NA)  
11. **D4** B/C — G09 bottom scale stub  
12. **D5** B/C — G16 mode-wheel enable rules  
13. **B3** B — open-folder / load-sample honesty  
14. **C2** B — explicit no-Qt-Worker stamp  
15. **B4** B — recent-menu a11y Esc/focus  

---

## Counts (unchanged unless proof)

OPEN **7** · PARTIAL **16** · CLOSED **2** · DOCS **1**

| ID | Status |
|----|--------|
| G02 | **PARTIAL** (PoT auto-N/removeMean MET; Multitaper/Burg/non-PoT/STFT-DDC **BLOCKED**) |
| G08 | **PARTIAL** |
| G07 | **PARTIAL** |
| G18 | **PARTIAL** (recog panes residual; no invent) |
| G19 | **PARTIAL** (`data-native-qfiledialog=false`) |
| G11 | **PARTIAL** |
| G09 / G16 | **OPEN** |
| G06 / G17 | **BLOCKED** |

## Explicit

**matrix_pass_claimed: false**  
**ui_parity_pass_claimed: false**  
**pass_claimed: false**  
This tip is an **actionable checklist**, not a CLOSED/PASS claim.