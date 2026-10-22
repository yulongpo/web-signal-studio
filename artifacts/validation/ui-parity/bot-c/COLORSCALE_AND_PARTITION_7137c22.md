# Bot-C · COLORSCALE_VISIBLE + BB/NB chart partition (no PASS)

**baseline_main:** `7137c2292409d8e11e51b96ec3abbff3ef4b276d` (origin/main)
**branch:** `work/bot-c-charts`
**tip:** (stamped after commit)
**desktop_ro:** `17471a6488383b456281d12cb1a6d3d80290205d`
**matrix_pass_claimed:** false
**pass_claimed:** false
**ban:** invent DSP · G06/G17 · G16 enable-matrix · fake PASS

## A) display-colorscale visible (G web-ab29e28-quality residual)

### What G saw
- `artifacts/validation/ui-parity/qa/web-ab29e28-quality`: waterfall PNG ok; `[data-testid=display-colorscale]` `visible:false`.

### Root cause
- Canvas `ColorbarOverlay` already painted LUT+dB ticks when `showColorScale` (default true).
- No DOM node for Playwright; only `TempLayers` checkbox used that testid (mounted only while display temp layer open).

### Fix (C charts)
- `colorScaleTickLabels()` + HeatmapCanvas right-gutter DOM legend `data-testid="display-colorscale"` when `showColorScale && colorScaleDb`.
- Vitest: `packages/charts` colorbarOverlay.test.ts (2 passed).

## B) Broadband vs Narrowband chart-area partition (4K / desktop workspaceStack)

### Desktop cite (`main_window.cpp` @ 17471a6)
- `workspaceStack_` QStackedWidget: index0 = `graphSplitter` (nav|aux|main), index1 = `NarrowbandWorkspace`.
- Modes are **XOR** — never nest BB nav/aux under NB page.
- BB `enforceLayout`: nav clamp 62–128 (default 82), aux min 116 (default 205 / short 176), main min 80; handleWidth 10.

### Web before
- Always mounted Nav+Aux+splitters; only swapped `MainChartHost` vs `NarrowbandWorkspace` inside main slot → **NB page still showed BB nav/aux** (mix).

### Fix (C-owned hosts / panes)
- `App.tsx`: `workspaceMode === 'narrowband'` → mount **only** `NarrowbandWorkspace` in chart area (`data-chart-partition=narrowband-only`); wideband/linked → BB nav|aux|main (`broadband-nav-aux-main`).
- Hide BB `SpecParamStrip` / `NavChrome` / `AuxParamStrip` on NB path.
- CSS `.workspace.workspace-nb`: `1fr / auto / 28px` (nb charts | bottom | status).
- Honesty test: `apps/web/src/components/chartPartitionHonesty.test.ts` (3 passed).
- BB pane mins retained: nav 62–128, aux 116–360, handleWidth 10 (prior C landing).

### B handoff (not landed here)
- Shell L/R rails, MenuBar / project-tree i18n, bottom-dock chrome: **B**.
- Workspace mode **entry chrome** lives on MenuBar + SpecParamStrip (B). SpecParamStrip is BB-only after this tip; entering NB still via MenuBar / BB strip before switch. If CAO wants a persistent mode toggle on NB page chrome beyond `nb-return-wideband`, that is **B**.
- Full 4K side-rail collapse thresholds (990/1150/…) from `enforceLayout`: **B**.

## Files
- `packages/charts/src/overlay/colorbarOverlay.ts` (+ test)
- `packages/charts/src/react/HeatmapCanvas.tsx`
- `packages/charts/src/index.ts`
- `apps/web/src/App.tsx` / `App.css`
- `apps/web/src/components/chartPartitionHonesty.test.ts`
- this evidence (+ artifacts mirror)

## Verify
```
cd packages/charts && npx vitest run src/overlay/colorbarOverlay.test.ts
cd apps/web && npx vitest run src/components/chartPartitionHonesty.test.ts
# manual / G:
# BB waterfall → getByTestId('display-colorscale') visible
# NB mode → no getByTestId('global-nav') / aux-chart; workspace data-chart-partition=narrowband-only
```

## Claims
| Claim | Value |
|-------|-------|
| matrix_pass_claimed | **false** |
| pass_claimed | **false** |
| G06/G17 invent | **false** |