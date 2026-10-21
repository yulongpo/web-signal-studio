# BOT_B_WAVE7 — short deepen G19/G07/G02/G08

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `e14612c29d8ff08ec9eae6495c2b2c63a0271339` (`origin/main`) |
| Desktop | `17471a6` read-only |
| matrix_pass_claimed | **false** |

## Delivered

- **G19** Edit-path evidence: `data-edit-path="replaceMark"`, `data-edit-selection` empty/single/multi; empty-state hints on BottomPanel + M06 when no selection (edit disabled).
- **G07** Multi-engine Worker chrome from **real** LocalCompute capabilities only: `detectCapabilities` in uiStore (DetectPage mirrors getCapabilities); BottomPanel engine slots FFSCN/SCN available|unavailable + models present/missing; honesty banner — no invented engines/runs.
- **G02** Strip more complete: physical caption QLabel; Aux 电平/显示 QLabels; overflow live STFT N.
- **G08** Shell edge polish: `data-shell-edge` left/right/bottom + hit min attrs; widened resize hit targets via CSS `::after`.

## Checks

- typecheck green
- e2e spec `g19-g07-g02-g08-wave7.spec.ts` (env may limit runtime)

## Deferred

- Desktop AnnotationPanel full interactive re-shot
- Fake/blocked Detect engines still not invented
- G06 recognition/demod; matrix PASS
