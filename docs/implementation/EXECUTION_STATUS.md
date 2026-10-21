# EXECUTION_STATUS

| Field | Value |
|------|-------|
| Phase | **P4+** (B-M06-playwright-e2e) |
| Status | **DONE** (awaiting CAO merge) |
| Mode | ONE-SHOT FULL DELIVERY |
| Shared tree | D:\project\web_signal_studio (no Bot checkout) |
| Bot-B worktree | D:\project\wss-wt-b · work/bot-b-web-shell |
| Synced main tip (base) | 9cb46b8886cfe6411db99e383221c06e66696886 |
| Updated (Asia/Shanghai) | 2026-10-21 20:15:00 |

## P4+ Bot-B (B-M06-playwright-e2e)

- [x] `installM06E2eHook(window)` always-on in main.tsx
- [x] M06MarksPanel on marker rail + testids
- [x] Playwright `e2e/m06-marks.spec.ts` (marks / snapshot / undo-redo)
- [x] Evidence `m06_marks_undo_2026-10-21.json` + `m06_marks_panel.png`
- [x] Index + BOT_B_SHELL (no ACCEPTANCE_MATRIX edits)
- [x] typecheck + Playwright m06 green

## Prior P4+ (still green)

- [x] B-M02-evidence-assist (merged @ 8f09dbc; QA M-02 PASS @ a701126)

## Prior P4 (still green)

- [x] Optional wasm-fft; project/detect session; M-01/M-05 evidence (QA PASS)

## Prior P3 (still green)

- [x] M-01 project IO + M-05 workspace + RAW/SigMF open

## Rules

- Only work/bot-b-web-shell worktree; never write shared tree / signal_studio_rebuild.
- Never invent FFSCN/SCN detection candidates client-side.
- Draw only when succeeded + `verifiedForward===true` + `PYTORCH_*` engine.
- Sample indexes: decimal strings only.
- Do not invent v6 project fields; never silently rewrite source paths.
- Do **not** rewrite ACCEPTANCE_MATRIX PASS (QA-G only).
