# G18 NB recognition STFT panes — written BLOCKED (wave32 ④)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 07:47 |
| Base | `113f6b8` (origin/main at sync) |
| Branch | `work/bot-c-charts` |
| Desktop ref | `17471a6` / `signal_studio_rebuild` `NarrowbandWorkspace::updateLinkedCursors` → `recognitionStft_->setLinkedCursor` |
| Decision | **BLOCKED** — no landable linkedCursor tip |
| matrix_pass_claimed | false |

## Verdict

Web deep-learning (“识别”) page still has **no `SpectrumChart` / heatmap host** for recognition STFT. Desktop has a real `recognitionStft_` Heatmap that joins the linked-cursor fan-out. Wiring `linkedCursor` like mod STFT tip `80d25bd` would invent chrome on a status-only panel; **not done**. Recognition algorithm / G06 / G17 **not invented**.

## Evidence paths (web @ `113f6b8`)

| Path | What it shows |
|------|----------------|
| `apps/web/src/components/NarrowbandWorkspace.tsx` ~L27–45 `ChartPanel` | Title + status span only; no chart import |
| `apps/web/src/components/NarrowbandWorkspace.tsx` ~L357–387 `page === 'deepLearning'` | `nb-panel-dl-stft` = `ChartPanel` with `status={BLOCKED: RECOGNITION_ENGINE_MISSING}`; **no `SpectrumChart`** |
| `apps/web/src/components/NarrowbandWorkspace.tsx` | Grep: **zero** `SpectrumChart` / `HeatmapCanvas` imports in this file |
| `apps/web/src/dsp/narrowbandPageDspContracts.ts` ~L116–151 | `NARROWBAND_RECOGNITION_BLOCKED` / `computeNarrowbandRecognition` always BLOCKED; labels `[]` |
| `apps/web/src/components/nbMultiViewLinked.ts` L1–6 | Comment: recognition web pane still BLOCKED chrome |
| `apps/web/src/components/NarrowbandModulationCharts.tsx` | Contrast: mod STFT **does** host `SpectrumChart` + `linkedCursor` (MET @ `80d25bd`) |

## Evidence paths (desktop rebuild)

| Path | What it shows |
|------|----------------|
| `D:\project\signal_studio_rebuild\ui\narrowband_workspace.cpp` ~L1157 | `recognitionStftPanel` Heatmap widget |
| same ~L1396–1397 | `bindGesture(recognitionStft_, Heatmap)`; in `charts_` list |
| same ~L1553–1556 `updateLinkedCursors` | `for (… recognitionStft_) chart->setLinkedCursor(cursor)` |
| same ~L1904 | `recognitionStft_->setRaster(stft, …)` — real STFT feed |

## Why not a tip

1. No SpectrumChart on `nb-panel-dl-stft` → nowhere to attach `resolveNbStftLinkedCursor`.
2. Filling a fake spectrogram / inventing recognition STFT feed = inventing G06/G17-adjacent chrome — forbidden.
3. Prefer written BLOCKED over empty cursor stamps on a status panel.

## Unblock (not Bot-C this wave)

Someone else must land a **real** recognition-channel STFT/heatmap (engine or honest empty raster host with data path), then Bot-C can mirror mod STFT linkedCursor. Until then G18 recog STFT remains BLOCKED residual; G18 overall stays PARTIAL.

## Not claimed

- PASS / CLOSED for G18 or G06/G17
- Any recognition algorithm, scores, or STFT feed
