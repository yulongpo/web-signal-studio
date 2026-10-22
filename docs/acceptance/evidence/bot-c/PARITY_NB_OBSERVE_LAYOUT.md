# PARITY_NB_OBSERVE_LAYOUT — Bot-C tip (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 08:55 Asia/Shanghai |
| Base | **`1112706`** = `1112706aa496273db54cc60c065e8eb921647b7f` |
| Desktop | **`17471a6`** = `17471a6488383b456281d12cb1a6d3d80290205d` (RO) |
| Branch | `work/bot-c-charts` @ HH-laptop `D:\project\wss-wt-c` |
| Owner | C = NB Observe three-chart layout / axis CN / linked cursor / chart-host splitter mins |
| Rule | **matrix_pass_claimed=false**; no G06/G17 invent; no G16 enable-matrix invent |

## Desktop cites (`narrowband_workspace.cpp` @ 17471a6)

- Observe page: vertical `narrowbandObserveSplitter` handleWidth **5**; top row Wave \| PSD (equal); bottom STFT; `setStretchFactor(0,1)/(1,1)`; default `setSizes({320, 640})`; persist `narrowband/observeSplitterState`.
- Panel heads: `chartHead` **fixedHeight 30**; titles **波形** / **功率谱密度** / **时频图**.
- Axis: `waveformAxisLabel` (I/Q / 幅度 RMS / 相位 / 包络); `frequencyAxisLabel_` **基带频率 (Hz)** \| **RF 频率 (Hz)**; `timeAxisLabel_` **源文件时间 (s)**; PSD Y power unit **dBFS/Hz**; tick font Consolas **8** on NB painter / BB `canvasFont` **10**.
- Linked cursor: `setLinkedCursor` across waveform_/psd_/stft_.

## Web delta (this tip)

1. **NB Observe splitter** — `NarrowbandObserveCharts.tsx` + `App.css`: `.nb-observe-split` top height CSS var (default **320**), `VerticalSplitter` `testId=nb-observe-splitter` height **5**, bottom `.nb-observe-stft` flex 1; persist `wss.nbObserveTopH.v1`.
2. **CN axis labels** — Observe passes `xLabel`/`yLabel`/`freqLabel`/`timeLabel`; `narrowbandObserveDdc` / `chartDisplayDerive` / `MainChartHost` / `NavChartHost` / `auxWaveRawIq` domain labels CN; `WaveformChart`/`SpectrumChart` defaults CN; `axisOverlay` font `10px Consolas`.
3. **Linked cursor** — retained G18 wave/PSD/STFT pin paths (`nbMultiViewLinked`, STFT scrubber); no invent.
4. **BB chart-host splitter mins** — `App.tsx` nav `minPx` **62** / `maxPx` **128**, aux `minPx` **116** (desktop `enforceLayout`); handle width **10** left to **B** (web VerticalSplitter still 6px chrome).

## B handoff

- Rail / theme / G10 / G21–24 / MenuBar fonts YaHei shell stack / project-tree i18n: **B**.
- BB `graphSplitter` handleWidth **10** vs web 6: **B** (or joint) — C only landed pane min clamps.

## Claims

| Claim | Value |
|-------|-------|
| matrix_pass_claimed | **false** |
| pass_claimed | **false** |
| G06/G17 invent | **false** |

## Paths

- Canonical: `docs/acceptance/evidence/bot-c/PARITY_NB_OBSERVE_LAYOUT.md`
- Mirror: `artifacts/validation/ui-parity/PARITY_NB_OBSERVE_LAYOUT/`
