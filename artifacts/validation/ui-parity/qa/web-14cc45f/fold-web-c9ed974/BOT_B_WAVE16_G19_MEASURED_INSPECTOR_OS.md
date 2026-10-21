# BOT_B_WAVE16 — G19 MeasuredEvidenceTrace + Inspector + OS dialog chrome (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `2bcef55b632ca2c3320b84eb5a43c1ecc5fb7cd6` (`origin/main`; C G18 linked-cursor + A INCREMENTAL_85596ed) |
| Desktop | `17471a6` AnnotationEvidenceWidget MeasuredEvidenceTrace / Inspector |
| matrix_pass_claimed | **false** |

## Delivered

- **MeasuredEvidenceTrace:** Parses real `originEvidence.timeAnalysis.trace` (or `originalFieldsJson` → timeAnalysis) only when `kind === measured-causal-mean-power-v1` with validated points/range — SVG envelope + threshold dash; attrs `data-measured-trace` / `data-measured-point-count` / `data-invented="false"`. No valid path → honest empty stub (never fake traces).
- **Inspector polish:** Mode toggle Auxiliary ↔ Inspector; Inspector shows fact grid, measured trace (or stub), score-definition copy vs Qt, raw fields retained.
- **QFileDialog (browser-honest):** Dialog title echo + richer filterDescription passed into `browserSaveFile` / picker types; status strings closer to Qt export messages; `data-os-dialog-chrome="wave16"`; **`data-native-qfiledialog="false"` retained** — no native claim. `browserSaveFile` still MET.

## Non-goals

- No true native QFileDialog (impossible on web).
- No chart host / linked-cursor / STFT scrubber (Bot-C).
- No G06 eye/bitstream/demod invention.
- Rail pin stays on D store; G18/G19 prior waves preserved.

## Checks

- typecheck green (record below)

## Deferred

- Full Qt Worker / shell re-shot; true OS native dialog; matrix PASS
