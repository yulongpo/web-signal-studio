# Bot-B probe evidence index

> Owner of status PASS: **WSS-QA-G** only. Bot-B places evidence; does **not** claim PASS for open gates.

Updated: 2026-10-21 (Asia/Shanghai)  
Worktree: `D:\project\wss-wt-b` · branch `work/bot-b-web-shell`  
Base tip: **`f9f4616`** (B-P4)  
Package: **B-P4** (wasm-fft optional + project/detect session + M-01/M-05 evidence)

## Dual placement

| Kind | Tracked path |
|------|----------------|
| Screenshots + JSON probes | `docs/acceptance/evidence/bot-b/` |

## What each evidence file measures

| File | Gate | Measures |
|------|------|----------|
| `m01_project_io_2026-10-21.json` | **M-01 WIP** | Open → StatusBar/tree → save export → clear; decimal sample indexes; no invented v6 fields |
| `m01_project_export_probe.json` | M-01 | Exact exported project JSON from Playwright download |
| `m01_project_open.png` | M-01 | Screenshot after open (summary + StatusBar) |
| `m01_project_saved.png` | M-01 | Screenshot after save click |
| `m01_project_cleared.png` | M-01 | Screenshot after clear (empty tree + StatusBar) |
| `m05_workspace_2026-10-21.json` | **M-05 WIP** | Assertion log: status-workspace, stub-explicit, no fake DDC, chart/detect retained |
| `m05_workspace_wideband.png` / `b-p3-workspace-wideband.png` | M-05 | Wideband workspace screenshot |
| `m05_workspace_narrowband_stub.png` / `b-p3-workspace-narrowband-stub.png` | M-05 | Narrowband **stub** banner screenshot |

## How to re-run

```powershell
cd D:\project\wss-wt-b\apps\web
npm test
npm run typecheck
npx playwright test e2e/project-io.spec.ts e2e/workspace.spec.ts e2e/detect-page.spec.ts e2e/shell-nav.spec.ts
```

Evidence JSON/PNG are written by Playwright into this directory during the M-01 / M-05 specs.

## Related shell docs

- `docs/implementation/BOT_B_SHELL.md` — layout, testids, B-P4 notes
- `docs/implementation/bot-d/WASM_FFT_WIRING_FOR_BOT_B.md` — optional `engine: 'wasm-fft'`

**Do not set M-01 / M-05 PASS here.** QA verifies against these paths.
