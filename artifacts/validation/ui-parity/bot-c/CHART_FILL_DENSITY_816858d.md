# Bot-C · CHART_FILL_DENSITY / GAP Q7-06·08·09·10 (no PASS)

| Field | Value |
|-------|-------|
| baseline_main | `27e3e294e0aed3afcb7a028bc15233b3a9d785f0` (merge bot-b PIXEL + A GAP `f54c404`) |
| branch | `work/bot-c-charts` |
| tip | _(stamped after commit)_ |
| desktop_ro | `17471a6488383b456281d12cb1a6d3d80290205d` |
| GAP cite | `docs/acceptance/evidence/bot-a/GAP_QUALITY_7f7aead.md` |
| B PIXEL | `PIXEL_SHELL_4K_816858d` / `shellMidLayout.ts` CSS vars consumed, not rewritten |
| matrix_pass_claimed | **false** |
| pass_claimed | **false** |
| ban | invent DSP · G06/G17 · G16 enable-matrix · fake PASS |

## Root cause

1. **Q7-08 blocky/sparse:** `suggestExtractOutSize` preview at 0.5×CSS; refine ignored DPR → under-dense GL texture on 4K.
2. **Q7-09 colorbar:** fixed `right=48` vs desktop **70/22**; strip not flush; 10px/5 ticks hard to read.
3. **Q7-06 01≡03:** STFT↔waterfall shared one HeatmapCanvas without remount; G pack SHA identical.
4. **Fill voids:** `%` height hosts lacked absolute/`minHeight:0`; NB panel bodies did not absolute-fill children.
5. **Black gutters:** perpetual mid-width right margin when colorScale off (48≫22).

## Fix (C-owned)

| Item | Change |
|------|--------|
| Margin/colorbar | `heatmapPlotMargin(show)` → **70/22**; `stripOffsetForMargin` flush (`plotGap=2`); DOM `data-colorbar-flush`; 11px / 7 ticks |
| Density | preview **0.85×CSS**; refine **CSS×DPR**; HeatmapCanvas passes `glSize.dpr` |
| Axis | `suggestedTickCount(pixelSpan)` 4…18 (~72px/tick) |
| 01≠03 | `MainChartHost` `key={chartMode}` + `data-mode-paint` |
| Fill | Heatmap/Waveform absolute inset on `%` height; App.css canvas children + NB panel body fill only |
| B vars | Consume `--nav-pane-h` / `--aux-pane-h` / `--shell-split-handle` / `--shell-scope-h` / `--shell-status-h` — **no** rail/grid/scope rewrite |
| Aux | Host still `getIqFileSession`+`readAuxWaveRawIq`; fill stamp only |

## Files

- `packages/charts/src/react/plotMargin.ts`, `HeatmapCanvas.tsx`, `WaveformChart.tsx`, `index.ts`, `react/index.ts`
- `packages/charts/src/overlay/{colorbar,axis}Overlay.ts` (+ tests)
- `packages/charts/src/tile/displayExtract.ts`
- `apps/web/src/components/{MainChartHost,AuxChartHost,chartGesture}.tsx`
- `apps/web/src/App.css` (C block after B PIXEL block)
- this evidence (+ artifacts mirror)

## Verify

```
cd packages/charts && npx vitest run src/overlay/colorbarOverlay.test.ts src/overlay/axisOverlay.scale.test.ts src/axis/physicalAxis.test.ts
cd apps/web && npx vitest run src/components/chartPartitionHonesty.test.ts
```

## B / D handoff

- **B:** PIXEL already on main @ 27e3e29 — C does not redo rails.
- **D:** Aux amplitude / NB mark-driven DDC when panes still empty with honest waiting stamps (Q7-07/10/11).

## Claims

| Claim | Value |
|-------|-------|
| matrix_pass_claimed | **false** |
| pass_claimed | **false** |
| G06/G17 invent | **false** |
