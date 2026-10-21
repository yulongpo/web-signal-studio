# EXECUTION_STATUS

| Field | Value |
|------|-------|
| Phase | **P4+** (B-M02-evidence-assist) |
| Status | **DONE** (awaiting CAO merge) |
| Mode | ONE-SHOT FULL DELIVERY |
| Shared tree | D:\\project\\web_signal_studio (no Bot checkout) |
| Bot-B worktree | D:\\project\\wss-wt-b · work/bot-b-web-shell |
| Synced main tip (base) | 19313983fa535325dacf8f1317a9c8aa9bc18c91 |
| Updated (Asia/Shanghai) | 2026-10-21 19:55:00 |

## P4+ Bot-B (B-M02-evidence-assist)

- [x] Playwright M-02: WAV / RAW / SigMF chunked open + evidence JSON/PNG
- [x] Vitest: e2e fixtures open via `openIqFromFiles` (decimal sample counts)
- [x] Index: `docs/acceptance/evidence/bot-b/BOT_B_PROBE_INDEX.md` M-02 section
- [x] Docs: BOT_B_SHELL.md + this file (no ACCEPTANCE_MATRIX edits)
- [x] file-io alignment pointers (Bot-D unit tests + our e2e fixtures)
- [x] vitest + Playwright + typecheck green

## Prior P4 (still green)

- [x] Optional wasm-fft; project/detect session; M-01/M-05 evidence (merged @ 01d121e / QA PASS @ 1931398)

## Prior P3 (still green)

- [x] M-01 project IO + M-05 workspace + RAW/SigMF open (landed @ b82e324 merge)

## Rules

- Only work/bot-b-web-shell worktree; never write shared tree / signal_studio_rebuild.
- Never invent FFSCN/SCN detection candidates client-side.
- Draw only when succeeded + `verifiedForward===true` + `PYTORCH_*` engine.
- Sample indexes: decimal strings only.
- Do not invent v6 project fields; never silently rewrite source paths.
- Do **not** rewrite ACCEPTANCE_MATRIX PASS (QA-G only).
