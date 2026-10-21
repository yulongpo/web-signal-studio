# BOT_B_WAVE6 — G19 edit / G07 worker chrome / G02 / G08 right collapse

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `93de5db46405b717d2d046a0bcb4fc46ce4b10a9` (`origin/main`) |
| Desktop rebuild | `17471a6` (read-only) |
| matrix_pass_claimed | **false** |

## Delivered vs rebuild 17471a6

- **G19** Inline mark edit UX (name/note) via existing `replaceMark` on M06MarksPanel + BottomPanel; `data-annotation-edit="inline-replaceMark"`; dblclick row / 编辑 button. No fake marks.
- **G07** Detect Worker residual chrome: table columns time/status/kind/%/runId; inspector progress/runId/history/blockReasons/result honesty; cancelled status filter. Still only real `detectRunFeed` LocalCompute records.
- **G02** Broader strip: live `N={stftN}` + palette id QLabels; overflow IQ + workspace QLabels; aux 波形/PSD captions retained/extended.
- **G08** Right column collapse-to-min (8px) via dblclick on `shell-col-resize-right`; persist `rightCollapsed` in `wss.shellColumns.v1`; syncs `setRightPanelCollapsed`.

## Adjacent CI unblock

- Restored template literals in `ChartMarkOverlay.tsx` mangled on main @ `612c8a1` (ClosedHand tip). Preserves body-drag ClosedHand behavior. Not a PASS claim.

## Evidence

- e2e `apps/web/e2e/g19-g07-g02-g08-wave6.spec.ts`
- shots when env allows: `g19-edit-wave6.png`, `g07-worker-chrome-wave6.png`, `g02-broader-wave6.png`, `g08-right-collapse-wave6.png`

## Not claimed / deferred

- ACCEPTANCE_MATRIX PASS / CLOSED
- G06 recognition/demod; multi-engine Detect beyond LocalCompute
- Desktop interactive re-shot full AnnotationPanel
