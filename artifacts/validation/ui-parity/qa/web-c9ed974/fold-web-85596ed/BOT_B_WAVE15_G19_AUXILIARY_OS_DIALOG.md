# BOT_B_WAVE15 — G19 Auxiliary 3-col + extra Qt facts + OS dialog chrome (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `b88443e308c99a18053b446d02d4ecf2f8b9cb73` (`origin/main`) |
| Desktop | `17471a6` AnnotationEvidenceWidget Auxiliary 3-col |
| matrix_pass_claimed | **false** |

## Delivered

- **Auxiliary 3-col:** `AnnotationEvidencePanel` `mode="auxiliary"` — time / scores / diagnostics columns (`data-qt-auxiliary-cols="3"`), details toggle for remaining facts; honest `—` from real `originEvidence` + annotation range fields only.
- **Extra Qt facts:** uncertainty, frequencyBasis, current/original range, observation, windows/windowIds, noise, reason, class, format, origin, coordinates (bound when present).
- **OS dialog chrome:** filter select + suggested filename + status (`data-os-dialog-chrome="wave15"`); **`browserSaveFile` unchanged (MET)** — no native QFileDialog claim (`data-native-qfiledialog="false"`).

## Non-goals

- No chart host / STFT scrubber / linked-cursor sync (Bot-C).
- No G06 eye/bitstream/demod invention.
- Rail pin stays on existing D pin store.

## Checks

- typecheck green

## Deferred

- MeasuredEvidenceTrace plot; full Inspector mode polish; matrix PASS
