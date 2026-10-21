# Bot-C G11/G14/G02/G13 STATUS (WIP — do not self-claim PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 22:25 |
| Base tip | cf1b3f8 (origin/main; CAO bump from c63f1de) |
| Branch | work/bot-c-charts |
| Scope | G11 navigate box-zoom; G14 Detection ROI header + retire select; G02 physical caption; G13 mark handles / continuous create |
| Out of scope | Bot-B chrome polish beyond ROI entry remap; Wave raw IQ (Bot-D); short-window aux=176 |
| Desktop对照 | signal_studio_rebuild @ 17471a6 |
| Push | tip on origin/work/bot-c-charts |

## Landed (honest)

| ID | Landed | Known gap |
|----|--------|-----------|
| G11 | `navigate` → HeatmapCanvas `zoom-box` (≥8px); NavigationChart click outside keeps span (`data-nav-click-keeps-span`) | Axis-only pan still the plot-body pan substitute; no middle-button pan. Nav create-drag still resizes window (by design). |
| G14 | Header `btn-header-detection-roi`; overflow/MenuBar/NavChrome → `detection-roi`; confirmation bar Enter/Esc unchanged; `select` no longer writes ROI | `ActiveTool` union still lists `select` (Bot-B provisional type); leftover callers get a note, not ROI. |
| G02 | Charts-side `chart-physical-caption` on HeatmapCanvas (live physical X/Y + units); axis overlay labels unchanged | Caption is overlay text, not f9f05bb control-widget captions; Bot-B strip chrome remains Bot-B. |
| G13 | Four corner handles + live pointermove resize; Ctrl/Shift multi-select kept; `data-continuous-create` while marker tool active | Undo/redo list sync still via existing M06 session; waterfall mark CSS mapping still STFT-oriented (pre-existing). |

## Evidence
- artifacts/validation/ui-parity/bot-c/STATUS.md (+ this dual-write)
- apps/web/e2e/chart-gestures.spec.ts (navigate zoom / caption / header ROI)
- Prior G03–G05 pngs retained

## Tests
- charts: `npm run typecheck` + `npm test` → 62 passed
- web: `npm run typecheck` + `npm test` → 61 passed
- e2e (filtered once): navigate zoom / physical caption / header ROI → 3 passed (ANGLE+SwiftShader)
- e2e full suite re-run hit `ERR_CONNECTION_REFUSED` on webServer — not treated as product fail; not a PASS claim

**No self-PASS.**
