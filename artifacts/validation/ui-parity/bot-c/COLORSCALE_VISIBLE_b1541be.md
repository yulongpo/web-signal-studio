# Bot-C · COLORSCALE_VISIBLE (display-colorscale DOM)

**baseline_main:** `b1541be9dc22db41a60abf66d985c6ab3275de47` (origin/main @ rebase)
**tip:** (see git HEAD after commit)
**branch:** `work/bot-c-charts`
**matrix_pass_claimed:** false
**pass_claimed:** false
**ban:** invent DSP · G06/G17 · G16 enable-matrix · fake PASS

## What G saw (web-ab29e28-quality)

- Pack: `artifacts/validation/ui-parity/qa/web-ab29e28-quality`
- Shot 03 waterfall image present (`03-colorbar-waterfall.png`)
- Locator `[data-testid="display-colorscale"]` → `visible: false` / `text: null`
- Gap note: `03 display-colorscale not visible — PARTIAL`

## Root cause

1. Canvas `ColorbarOverlay` already paints the LUT strip + dB ticks when `uiStore.display.showColorScale` (default **true**) and `MainChartHost` passes `colorScaleDb`.
2. That paint is **pixels only** — no DOM node for Playwright.
3. The only existing `data-testid="display-colorscale"` lived on Bot-B `TempLayers` **checkbox**, mounted only while the display temp layer is open. G's waterfall shot never opens that layer → `isVisible() === false`.

## Fix (C-owned charts)

- Export `colorScaleTickLabels()` from `packages/charts/src/overlay/colorbarOverlay.ts`.
- When `showColorScale && colorScaleDb`, `HeatmapCanvas` mounts a right-gutter DOM legend:
  - `data-testid="display-colorscale"` (strip + tick text + `dB`)
  - sized in `HEATMAP_PLOT_MARGIN.right` / `HEATMAP_COLORBAR` geometry
  - `pointer-events: none`; canvas overlay still draws the real LUT
- Unit test extended (2 passed).

## Files touched

- `packages/charts/src/overlay/colorbarOverlay.ts`
- `packages/charts/src/overlay/colorbarOverlay.test.ts`
- `packages/charts/src/react/HeatmapCanvas.tsx`
- `packages/charts/src/index.ts`
- `docs/acceptance/evidence/bot-c/COLORSCALE_VISIBLE_b1541be.md` (+ artifacts mirror)

## Verify

```
# unit
cd packages/charts && npx vitest run src/overlay/colorbarOverlay.test.ts

# Playwright (G pack / manual)
page.getByTestId('btn-mode-waterfall').click()
await expect(page.getByTestId('display-colorscale')).toBeVisible()
# or cont evaluate: offsetParent !== null + textContent has dB ticks
```

Manual: wideband → waterfall with IQ loaded; right gutter shows color strip + dB tick labels.

## Honesty

- Does **not** claim matrix / UI parity PASS.
- Does **not** invent G06/G17.
- TempLayers checkbox still uses the same testid when that panel is open (B-owned); G waterfall path does not open it, so the chart legend is the match.