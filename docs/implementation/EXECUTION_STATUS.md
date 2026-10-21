# EXECUTION_STATUS

| Field | Value |
|------|-----|
| Phase | **P3** (B-P3-project-workspace-open) |
| Status | **DONE** (awaiting CAO merge) |
| Mode | ONE-SHOT FULL DELIVERY |
| Shared tree | D:\\project\\web_signal_studio (no Bot checkout) |
| Bot-B worktree | D:\\project\\wss-wt-b — work/bot-b-web-shell |
| Synced main tip (base) | c0079437e1ac0ee7822e5fade1b3a2bca0f65295 |
| Updated (Asia/Shanghai) | 2026-10-21 19:30:00 |

## P3 Bot-B (B-P3-project-workspace-open)

- [x] M-01: Project open/save/clear via Bot-F `ProjectSessionHookApi` / `asProjectSessionHook`
- [x] Playwright `project-io.spec.ts`: open JSON → StatusBar/tree → save export → clear; sample indexes decimal strings
- [x] M-05: Wide/narrow workspace e2e; narrowband **stub only** (no fake DDC/IQ); switch keeps main chart + detect
- [x] Evidence: `docs/acceptance/evidence/bot-b/b-p3-workspace-*.png` (from Playwright)
- [x] Open path: WAV + RAW (`openRawCi16LeIq`) + SigMF pair (`openSigmfArrayBuffer`); chip `data-iq-format`
- [x] FSA remains WAV-only (file-io); RAW/SigMF via file input — noted in BOT_B_SHELL
- [x] Docs: BOT_B_SHELL.md + this file

## Prior P1 (still green)

- [x] Compose shell + DetectPage gating / WEIGHT_HASH_MISMATCH / STFT chip
- [x] Open IQ WAV → `stftFromChunkedReader`; synthetic fixture fallback

## Rules

- Only work/bot-b-web-shell worktree; never write shared tree / signal_studio_rebuild.
- Never invent FFSCN/SCN detection candidates client-side.
- Draw only when succeeded + `verifiedForward===true` + `PYTORCH_*` engine.
- Sample indexes: decimal strings only.
- Do not invent v6 project fields; never silently rewrite source paths.
