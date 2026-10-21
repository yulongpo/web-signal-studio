# BOT_B_WAVE13 — G19 AdaptiveValueEdit-in-cell + Evidence + browser save (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `6df15bcae8fe32d93213e91acb83a12a578e708f` (`origin/main` = A INCREMENTAL_4c28588 + C G11 polish + wave12) |
| Desktop | `17471a6` AdaptiveValueEdit / AnnotationEvidenceWidget / QFileDialog |
| matrix_pass_claimed | **false** |

## Delivered

- **AdaptiveValueEdit-in-cell:** cols 4/5 Time + 6/7 Frequency use existing `AdaptiveValueEdit` (unit parse/format, Enter/Tab commit, Esc discard) → `replaceMark` via `applyCellNumeric`. Col 1 name remains plain text editCell.
- **Evidence widget:** `AnnotationEvidencePanel` reads real `originEvidence` facts (method/time/freq/mean/max/class/origin); honest `—` / empty when missing; raw JSON `<details>` only if keys exist. Never invents scores.
- **QFileDialog residuals:** `browserSaveFile` prefers `showSaveFilePicker`, falls back to download anchor; export JSON/CSV wired through it (`data-browser-save="wave13"`).

## Preserved

- C charts/gesture/ClosedHand; wave12 rail pin z-index stack; G07 no fake engines.

## Checks

- typecheck green

## Deferred

- Full Qt wheel-ignore already matched; Auxiliary 3-col evidence layout polish
- Native OS dialog chrome (browser APIs only)
- Matrix PASS
