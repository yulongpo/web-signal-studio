# Bot-C G11/G02 residual STATUS (WIP — do not self-claim PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 22:42 |
| Base tip | e9153b8 (origin/main; CAO bump from ef89727) |
| Branch | work/bot-c-charts |
| Scope | G11 navigate/box-zoom residual; G02 physical caption toward desktop axis units |
| Out of scope | **G18** display-summary / 「参考」「动态」 — **Bot-B chrome**, not charts |
| Desktop对照 | signal_studio_rebuild @ 17471a6 (also f9f05bb strip labels = Bot-B) |
| Push | tip on origin/work/bot-c-charts |

## Landed (honest)

| ID | Landed | Known gap / note |
|----|--------|------------------|
| G11 | Box-zoom commit rule aligned to desktop: **both** CSS edges `>= 8` via `isBoxZoomLargeEnough` (was diagonal hypot). `data-box-zoom-min-edge-px`. Crosshair cursor on zoom-box/box. Navigate still maps to `zoom-box`; axis drag still pans. | Middle-button pan: **N/A on desktop 17471a6** (no MiddleButton handler in plot_widget). Plot-body pan under navigate remains intentionally replaced by box-zoom. Nav chart create-drag still resizes window (by design). |
| G02 | Charts-side `chart-physical-caption` uses `formatPhysicalCaptionPair` — zh 频率/时间 titles + auto MHz/kHz/Hz / s/ms/us scaling mirroring desktop `displayUnit`. Scaled data-* attrs for probes. | **Not** f9f05bb `ChartControlStrip` QLabel captions / 「更多设置」 overflow — that remains **Bot-B** strip chrome. Axis overlay tick drawing unchanged. |
| G18 | **Skipped (not charts-owned).** Acceptance: `display-summary` 参考/动态 + Welch/Bartlett — right-rail display chrome → **Bot-B**. | — |

## Evidence
- artifacts/validation/ui-parity/bot-c/STATUS.md (+ this dual-write under docs/acceptance/ui-parity/bot-c/)
- packages/charts/src/axis/physicalCaption.ts (+ unit tests)
- packages/charts/src/interaction/viewTransform.ts (`BOX_ZOOM_MIN_EDGE_PX` / `isBoxZoomLargeEnough`)
- apps/web/e2e/chart-gestures.spec.ts (edge attr + caption unit attrs)

## Tests
- charts: `npm run typecheck` + `npm test` — 67 passed (incl. physicalCaption + box-zoom edge rule)
- web: `npm run typecheck` — ok
- e2e filtered: not re-run this tip (prior navigate/caption coverage retained; attrs extended)

**No self-PASS.**