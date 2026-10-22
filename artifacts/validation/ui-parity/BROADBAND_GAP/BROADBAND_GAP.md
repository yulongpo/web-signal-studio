# BROADBAND_GAP — wideband / main spectrum shell completeness plan (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 08:33 Asia/Shanghai |
| Web tip | **`3a5aa11`** = `3a5aa11097ec4613fe9c2c3739b8472c13a1b758` |
| Prior Bot-A tip | `5ec91d8709a7a17c49206cf0f145539bf4ce62f4` (`INCREMENTAL_0df7960`) merged main @ `ce29329` |
| Desktop | **`17471a6`** = `17471a6488383b456281d12cb1a6d3d80290205d` (read-only `signal_studio_rebuild`) |
| Scope | **Wideband / main spectrum shell ONLY** — not narrowband demod page invention |
| Rule | Docs-only; **matrix_pass_claimed=false**; **ui_parity_pass_claimed=false**; no PASS |
| Fence (stay BLOCKED) | G06 eye/bitstream · G17 recognition · G02 Multitaper/Burg · non-PoT Bluestein · STFT-DDC as analysis path · G16 enable-matrix without desktop docs |
| Synthesized from | `INCREMENTAL_0df7960` / `bf2fa8d` / `555d001` / `2aea4cb` / `da9fdab` + spot-check `apps/web` vs rebuild |
| Mirror | `artifacts/validation/ui-parity/BROADBAND_GAP/` · canonical `docs/acceptance/evidence/bot-a/BROADBAND_GAP.md` |

---

## 1. Desktop broadband must-have checklist (cite rebuild)

Sources: `app/main_window.cpp` (`buildMenus`, graph splitters, plots), `ui/spectral_settings_widget.{h,cpp}`, `ui/chart_control_strip.h`, `ui/charts/chart_interaction.h`, `ui/charts/cursor_overlay.h`, `infrastructure/spectral_analysis.cpp` (`makeSpectralAnalysisPlan` / `bandwidth = view.frequency`), `infrastructure/spectral_settings_json.h`.

### 1.1 Shell / layout
| # | Must-have | Desktop cite |
|---|-----------|--------------|
| S1 | MenuBar 34px non-native + File/Edit/View/Analysis/Tools/Help | `MainWindow::buildMenus` |
| S2 | Tri-pane: Navigation + Auxiliary + Main charts + vertical splitters | `navigation_` / `auxiliary_` / `main_` |
| S3 | Chart control strips + overflow (“更多设置”) | `ChartControlStrip` |
| S4 | Bottom dock (scale / measured / inspector / project tree) | `bottomContent_` / viewData_ / cursorData_ |
| S5 | Status / gesture hints (docs-level OK) | StatusBar chrome |

### 1.2 Spectral params (wideband STFT path)
| # | Must-have | Desktop cite |
|---|-----------|--------------|
| P1 | Method Welch (landable); Multitaper/Burg UI exists but **web fence BLOCKED** | `SpectralSettingsWidget` method combo |
| P2 | Window / Overlap / SegmentMs (0 = auto N/B) / Kaiser β / RemoveMean | same widget + `SpectralParameters` |
| P3 | Analysis N from `bandwidth = view.frequency.upper−lower` + PoT / segment | `makeSpectralAnalysisPlan` |
| P4 | Persist `spectral_settings_json` (+ spectrogram bridge) | `spectral_settings_json.h` |
| P5 | Live strip stamps: analysis samples vs FFTn, segment ms, auto-N, removeMean | ChartControlStrip + DSP settle |

### 1.3 Interaction / data-flow
| # | Must-have | Desktop cite |
|---|-----------|--------------|
| I1 | MainMode TimeFrequency↔Waterfall; Aux Waveform↔Psd | mode enums in MainWindow / toolbar |
| I2 | Axis-aware zoom/pan (STFT: X=time Y=freq; Waterfall swap); box-zoom ≥8px | `chart_interaction.h` + PlotWidget |
| I3 | Linked cursor main↔aux (+ clear) | `cursor_overlay.h` / linked tests |
| I4 | Marks / ROI tools (create, multi-select polish residual OK as PARTIAL) | AnnotationPanel + mark tools |
| I5 | Bottom view ΔT/ΔF + cursor readout bound to physical view | `viewData_` / `cursorData_` |
| I6 | Worker / LocalCompute real STFT feed (Welch PoT path) | spectral pipeline |
| I7 | Project open/save + Open IQ (browser dialog honesty OK if stamped) | File menu + QFileDialog |
| I8 | Keyboard: Select-All, accel shortcuts on menus | `buildMenus` shortcuts |

**Out of broadband「完整」scope (explicitly excluded):** Narrowband demod pages, eye/bitstream (G06), recognition engine (G17), inventing G16 enable/disable matrix, Multitaper/Burg compute, non-PoT Bluestein, STFT-DDC as analysis sizing invent.

---

## 2. Web status table (honest @ `3a5aa11`)

Gap counts carried from `INCREMENTAL_0df7960`: **OPEN 5 · PARTIAL 18 · CLOSED 2 · DOCS 1** (G09/G16 already PARTIAL; OPEN ≈ G10 + G21–G24 theme residuals). G09 optional shot landed in `qa/web-ce29329` (still PARTIAL — not pixel MET).

| Item | Gap / ID | Web status | Evidence / residual |
|------|----------|------------|---------------------|
| MenuBar + shortcuts | G08 | **PARTIAL** | Six-menu shell + `useMenuBarShortcuts`; Qt pixel / full re-shot residual |
| Tri-pane + splitters | G03 / G05 | G03 **PARTIAL** · G05 **CLOSED** | Nav/Aux/Main hosts; 82/205 split CLOSED |
| SpecParamStrip / spectral prefs | G02 | **PARTIAL** | Welch + window/overlap/SegmentMs/auto-N/removeMean/Kaiser **MET** path; Multitaper/Burg **BLOCKED** |
| Auto-N + fixed SegmentMs BW | G02 / A2 | **MET** (under G02 PARTIAL fence) | `visibleBandwidthHz` auto + fixed |
| dspAnalysisSamples stamp | G02 / A3 | **MET** | SpecParamStrip vs FFTn |
| spectral_settings_json open/save | G02 / A5 | **MET** | `uiStore` read/apply |
| Mode-wheel STFT/WF/Wave/PSD | G16 | **PARTIAL** | Live `mode-wheel`; store consumers OK; **enable matrix BLOCKED** |
| Bottom scale ΔT/ΔF | G09 | **PARTIAL** | `BottomScaleChrome` + physical-view bind; screenshot pack `web-ce29329`; pixel parity not MET |
| Chart zoom/pan/box | G11 | **PARTIAL** | desktop-axis + box; polish residuals |
| Context menu / history | G12 / G15 | **PARTIAL** | present; dual-stack polish residual |
| Marks overlay | G11 / G13 | **PARTIAL** | `ChartMarkOverlay` backticks=16 honest |
| Linked cursor | G18 (wideband slice) | **PARTIAL** | Main/Aux linked **MET** slice; NB/recog panes **out of scope** / written BLOCKED |
| LocalCompute / Worker STFT | G07 | **PARTIAL** | real feed path; full Qt Worker residual |
| Project / IQ dialogs | G19 / G20 | **PARTIAL** | `data-native-qfiledialog=false` honesty; browser save |
| Detect / engine | G17 | **BLOCKED** (out of broadband完整) | no invent |
| Eye / bitstream | G06 | **BLOCKED** | no invent |
| Theme / brand pixels | G21–G24 | **OPEN** | P2 visual |
| Esc focus / misc chrome | G10 | **OPEN** | residual focus/Esc polish |
| StatusBar | G25 | **DOCS** | docs-level |

---

## 3. Immediately actionable (prioritized) — owners B/C/D/E/F

**Do first (non-invent, moves「完整」needle):**

1. **B — G08 soft close-out pack:** MenuBar inventory + accel PNG parity vs `17471a6` (no claim CLOSED unless pixel budget agreed).  
2. **C/B — G09 optional MET gate:** only if CAO wants; else keep PARTIAL with `web-ce29329` shots as evidence floor.  
3. **C — G11 polish:** axis-only pan / OpenHand residual vs desktop `chart_interaction` (wideband main only).  
4. **B — G19/G20 IQ open UX:** SpectrumToolbar/MenuBar Open IQ consistency; keep `data-native-qfiledialog=false` honest.  
5. **C — G12/G15 history:** unify view back/forward with MenuBar history (wideband).  
6. **B — G07 BottomPanel stamps:** deepen Worker/LocalCompute inspector honesty (created/updated/feed) without inventing Qt dock.  
7. **D — G02 fence maintain:** keep Welch/PoT + `resolveAnalysisSamples`; **refuse** Multitaper/Burg/non-PoT/STFT-DDC invent.  
8. **F — project-io:** hold A5 helpers stable; no dual-write invent.  
9. **E — demo IQ / fixtures:** ensure wideband demo project opens (G26 PARTIAL support).  
10. **B — G10 Esc/focus:** chart Esc clear + focus ring soft (if still OPEN).  
11. **G — QA:** broadband acceptance shot set per §4 (NOT PASS labeling).  
12. **B+C — G16 matrix:** **only after** desktop enable/disable table extracted from `17471a6` — until then **BLOCKED**.  
13. **C — marks polish (G13):** multi-select / handle residual — P1 after interaction polish.  
14. **B — strip overflow copy:** fix any stale “bandwidth=fs” honesty strings now that A2 fixed path MET.  
15. **A (audit):** refresh MATRIX only when apps land — no empty refresh.

**Explicitly NOT actionable now (BLOCKED):** G06 · G17 · G02 Multitaper/Burg · non-PoT Bluestein · STFT-DDC analysis invent · G16 enable-matrix invent · NB demod「完整」.

---

## 4. Minimal acceptance definition of「完整」(broadband) — no fake PASS

「完整」here means **wideband main-shell usable parity** against `17471a6` Welch/PoT path — **not** matrix PASS, **not** Multitaper/Burg, **not** NB demod.

**Behaviors (must demo):**
1. Open demo / IQ → Main STFT paints via LocalCompute; strip shows window/overlap/SegmentMs/auto-N/removeMean + `dspAnalysisSamples` ≠ FFTn when distinct.  
2. Pan/zoom/box on main; Waterfall mode swaps axes; Aux Wave/PSD follows store; linked cursor main↔aux clears.  
3. Auto-N **and** fixed SegmentMs both size from **visible bandwidth** (`visibleBandwidthHz`), not silent fs-only.  
4. BottomScale shows ΔT/ΔF with `data-axis-bind=physical-view` when host published spans.  
5. Project JSON round-trip restores spectral chrome prefs (A5).  
6. Mode-wheel live on chart-header (STFT/Waterfall/Wave/PSD); `data-matrix=insufficient` retained until desktop matrix exists.

**Screenshots (Bot-G pack, each NOT PASS / PARTIAL labeled):**
1. Full wideband shell (MenuBar + tri-pane + SpecParamStrip + BottomScale).  
2. Overflow spectral editors (auto-N on/off, SegmentMs, removeMean, Kaiser).  
3. Mode-wheel live + Waterfall toggle.  
4. BottomScale ΔT/ΔF crop (physical-view).  
5. Soft G08 accel / menu inventory.  
6. Optional: linked cursor + mark box (wideband only).

**Exit criteria language:** may say **「宽带主壳 usable / acceptance floor MET for landable Welch path」** — must **never** set `matrix_pass_claimed=true` or gap CLOSED for G02/G08/G09/G16 while fences remain.

---

## 5. Counts / claims

| Metric | Value |
|--------|-------|
| OPEN | **5** |
| PARTIAL | **18** |
| CLOSED | **2** (G05, G14) |
| DOCS | **1** (G25) |
| ChartMarkOverlay backticks | **16** |
| **matrix_pass_claimed** | **false** |
| **ui_parity_pass_claimed** | **false** |
| **pass_claimed** | **false** |

---

## 6. Paths

- Canonical: `docs/acceptance/evidence/bot-a/BROADBAND_GAP.md`  
- Mirror: `artifacts/validation/ui-parity/BROADBAND_GAP/BROADBAND_GAP.md` (+ this folder README pointer)