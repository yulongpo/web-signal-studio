# G17 AdaptiveValueEdit / Fs notes / ROI chrome (wave)

- **base**: `647978c514780a0991d0f5de02f94a0cf9f2e4f1` (origin/main after B/C)
- **HEAD**: `d77650e5d4c251720110b1be674c7b60129b0e03`
- **branch**: `work/bot-e-g17-adaptive-roi`
- **scope**: DetectionCard AdaptiveValueEdit parity, physical-times Fs notes, ROI/rangeOrigin chrome
- **recognition**: still **BLOCKED** (honest; no fake labels / no recognition engine)
- **matrix_pass_claimed**: false
- **PASS**: not claimed

## Landed
- `apps/web/src/components/adaptiveValue.ts` ? parse/format + `formatDetectionPhysicalTimes` (Fs-gated; honest without Fs)
- `apps/web/src/components/AdaptiveValueEdit.tsx` ? Enter/Tab commit, Esc discard, unit-aware
- `apps/web/src/components/adaptiveValue.test.ts` ? unit tests (vitest; local nm may be absent on worktree)
- `DetectPage.tsx` ? AdaptiveValueEdit on param fields; physical times details; `detectionRangeOrigin` + select ROI chrome
- `App.css` ? draft/invalid + calculation-details styles

## Still PARTIAL (honest)
- Active-segment list binding still PARTIAL (no invented segment list)
- Visible-region chart window alignment still PARTIAL note
- Recognition remains BLOCKED / out of scope

## No-fake
- No recognition inference invented
- No PASS / no matrix_pass_claimed
