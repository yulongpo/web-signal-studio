# Bot-C short tip — G11 unselected polish (no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 00:47 |
| Base tip | 4c28588 |
| Branch | work/bot-c-charts |
| Desktop ref | 17471a6 PlotWidget mark paint + updateHover (dashed unselected, hover tip) |
| Self-check | ChartMarkOverlay backticks preserved (was 10; +6 intentional new templates for title/tip) |

## Landed

| ID | Landed | Note |
|----|--------|------|
| G11 unselected polish | dashed 1px + low fill; hover tip name · click-to-select; title hint | data-g11-unselected-polish; PointingHand retained |
| G11 selected/current contrast | solid selected; current inset retained | CSS hierarchy vs desktop alpha/pen widths |

## Honest gaps

| Gap | Owner |
|-----|-------|
| Per-sourceKind stroke colors (Imported/Manual/Algorithm) | C later / light |
| Hover sync into annotation table (setHoveredMark cross-panel) | B/C |
| Right-rail scrubber twin / multi-chart linked-cursor | B/C |

## Evidence
- apps/web/src/components/ChartMarkOverlay.tsx
- apps/web/src/App.css
- artifacts/validation/ui-parity/bot-c/STATUS.md

**matrix_pass_claimed: false. No PASS.**
