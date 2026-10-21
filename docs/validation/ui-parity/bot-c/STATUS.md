# Bot-C short tip — G11 sourceKind colors + annotation hover sync (no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 00:55 |
| Base tip | 6ada5b0 |
| Branch | work/bot-c-charts |
| Desktop ref | 17471a6 PlotWidget sourceColor + setHoveredMark / AnnotationPanel ForegroundRole+hover |
| Self-check | ChartMarkOverlay backticks preserved (=16) |

## Landed

| ID | Landed | Note |
|----|--------|------|
| G11 sourceKind stroke/fill | ImportedLabel #65d2bd / Manual #edc56d / Algorithm #51c4e9 | data-source-kind + CSS; data-g11-source-kind |
| G11 annotation/table hover sync | setHoveredMark on M06 session (ephemeral) | chart overlay <-> BottomPanel + M06MarksPanel; data-g11-hover-sync |
| Table sourceKind foreground | row color by sourceKind | desktop AnnotationPanel ForegroundRole |

## Honest gaps / handoff

| Gap | Owner |
|-----|-------|
| G18 multi-chart linked-cursor / right-rail scrubber twin polish | **Bot-B** chrome (rail twin wave10/11 done); charts-owned multi-view sync still OPEN — deferred this tip |
| G06 / G17 | not in scope (CAO) |

## Evidence
- apps/web/src/components/ChartMarkOverlay.tsx
- apps/web/src/components/BottomPanel.tsx
- apps/web/src/components/M06MarksPanel.tsx
- apps/web/src/App.css
- packages/project-io/src/m06-mark-session.ts
- packages/project-io/src/m06-e2e-hook.ts
- artifacts/validation/ui-parity/bot-c/STATUS.md

**matrix_pass_claimed: false. No PASS.**
