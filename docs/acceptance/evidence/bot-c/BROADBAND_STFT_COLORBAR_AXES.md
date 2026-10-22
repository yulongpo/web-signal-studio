# Bot-C · Broadband STFT/waterfall visual close (axes + colorScale)

**base:** `ef0e273` (GAP_QUALITY_8f73f69 on main; includes HOTFIX 70a2d9b)
**tip:** 27671b3
**matrix_pass_claimed:** false
**ban:** invent DSP · G06/G17 · G16 enable-matrix · fake PASS

## Desktop refs (`signal_studio_rebuild` @ `17471a6`)

| Item | Desktop evidence | Web before | Web after (this tip) |
|------|------------------|------------|----------------------|
| Axis titles / ticks | `ui/charts/plot_widget.cpp` `displayUnit` + `axisScale` → `频率 (MHz)` / `时间 (ms)` scaled ticks | AxisOverlay raw `toPrecision` / scientific; title kept caller `频率 (Hz)` | AxisOverlay uses `physicalCaption.displayUnit` for ticks + titles |
| STFT ↔ Waterfall axis swap | same file: Waterfall X=freq Y=time | Already MET via SpectrumChart/MainChartHost | unchanged (retained) |
| Color scale strip | `plot_widget.cpp` `file->display.colorScale` strip @ `width-38`, LUT + dB ticks from `referenceLevelDb` / `dynamicRangeDb` | `uiStore.display.showColorScale` existed but **not painted** on heatmap | `ColorbarOverlay` + `HEATMAP_PLOT_MARGIN.right=48`; MainChartHost wires `showColorScale` + `colorScaleDb` |
| Empty Aux Wave | Desktop Aux Waveform reads **opened file IQ** (`session` auxiliaryMode Waveform) | Aux Wave **hardwired** to `sigmf_data_demo` via `readAuxWaveRawIq` / Vite `/@fs` | **Not invented opened-file IQ.** Honest empty-state + `data-aux-wave-feed=sigmf_data_demo_only`. Root cause below. |

## Empty Wave — root cause (honest)

1. **Feed:** `apps/web/src/dsp/auxWaveRawIq.ts` opens **only** `sigmf_data_demo/0000000` (not the MainChartHost opened WAV / FSA / synthetic path).
2. **Host:** `AuxChartHost` calls that reader when `auxChartKind==='wave'`. On fetch/fs failure → waiting/error panel (looks "empty").
3. **Mode:** If aux kind is PSD, Wave path is idle (expected).
4. **Not C-owned alone:** Wiring Aux Wave to the **same opened IQ** as Main STFT needs Bot-D chunked reader for the live file handle (or shared store of interleaved IQ). C will not invent a second DSP envelope from STFT.

**Waits on:** Bot-D (opened-file chunked IQ handle for aux) + optional Bot-B chrome if aux mode/enable matrix docs appear. C can host-wire once D exposes the reader.

## Files touched

- `packages/charts/src/react/plotMargin.ts` — right gutter 48; `HEATMAP_COLORBAR`
- `packages/charts/src/overlay/colorbarOverlay.ts` (+ test)
- `packages/charts/src/overlay/axisOverlay.ts` (+ scale test)
- `packages/charts/src/react/HeatmapCanvas.tsx` — paint colorScale
- `packages/charts/src/index.ts` — export ColorbarOverlay
- `apps/web/src/components/MainChartHost.tsx` — wire display.showColorScale + level dB
- `apps/web/src/components/AuxChartHost.tsx` — honest empty copy / feed attr

## Verify

```
vitest run src/overlay/colorbarOverlay.test.ts src/overlay/axisOverlay.scale.test.ts src/axis/physicalCaption.test.ts
```
(7 passed @ tip)