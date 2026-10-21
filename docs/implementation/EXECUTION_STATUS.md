# EXECUTION_STATUS

| Field | Value |
|------|-----|
| Phase | **P4** (B-P4-wasm-fft-project-detect-session) |
| Status | **DONE** (awaiting CAO merge) |
| Mode | ONE-SHOT FULL DELIVERY |
| Shared tree | D:\\project\\web_signal_studio (no Bot checkout) |
| Bot-B worktree | D:\\project\\wss-wt-b · work/bot-b-web-shell |
| Synced main tip (base) | f9f4616b5127fef84dfe73b2a590fa425efc3dd3 |
| Updated (Asia/Shanghai) | 2026-10-21 19:45:00 |

## P4 Bot-B (B-P4)

- [x] Optional wasm-fft: `resolveDspFftEngine` + `useDspWorkerClient` (`?engine=` / preference); default **js**; `fellBackToJs` = success
- [x] Project open/save ↔ StatusBar `status-project` + tree channel counts; clear empties UI
- [x] Detect ↔ IQ file session: gate without source; pass `sourcePath` when open; clear task on Clear IQ
- [x] M-01 evidence: `m01_project_io_2026-10-21.json` + PNGs + export probe (QA-G owns PASS)
- [x] M-05 evidence: `m05_workspace_2026-10-21.json` + PNGs; stub-explicit / no fake DDC asserted
- [x] Index: `docs/acceptance/evidence/bot-b/BOT_B_PROBE_INDEX.md`
- [x] Docs: BOT_B_SHELL.md + this file
- [x] vitest + Playwright + typecheck green

## Prior P3 (still green)

- [x] M-01 project IO + M-05 workspace + RAW/SigMF open (landed @ b82e324 merge)

## Rules

- Only work/bot-b-web-shell worktree; never write shared tree / signal_studio_rebuild.
- Never invent FFSCN/SCN detection candidates client-side.
- Draw only when succeeded + `verifiedForward===true` + `PYTORCH_*` engine.
- Sample indexes: decimal strings only.
- Do not invent v6 project fields; never silently rewrite source paths.
- Do **not** rewrite ACCEPTANCE_MATRIX PASS (QA-G only).
