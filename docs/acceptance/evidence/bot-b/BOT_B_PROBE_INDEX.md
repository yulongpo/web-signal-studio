# Bot-B probe evidence index

> Owner of status PASS: **WSS-QA-G** only. Bot-B places evidence; does **not** claim PASS for open gates.

Updated: 2026-10-21 (Asia/Shanghai)  
Worktree: `D:\project\wss-wt-b` · branch `work/bot-b-web-shell`  
Base tip: **`9cb46b8886cfe6411db99e383221c06e66696886`**  
Package: **B-M06-playwright-e2e** (marks / channel snapshot / undo-redo UI)

## Dual placement

| Kind | Tracked path |
|------|----------------|
| Screenshots + JSON probes | `docs/acceptance/evidence/bot-b/` |

## What each evidence file measures

| File | Gate | Measures |
|------|------|----------|
| `m01_project_io_2026-10-21.json` | **M-01** | Open → StatusBar/tree → save export → clear; decimal sample indexes; no invented v6 fields |
| `m01_project_export_probe.json` | M-01 | Exact exported project JSON from Playwright download |
| `m01_project_open.png` / `m01_project_saved.png` / `m01_project_cleared.png` | M-01 | Project IO screenshots |
| `m02_chunked_open_2026-10-21.json` | **M-02** | WAV / RAW / SigMF open via file-input → chunked STFT; fixture paths; sample counts as decimal strings; `data-iq-format` / chip / labels |
| `m02_chunked_open_wav.png` / `m02_chunked_open_raw.png` / `m02_chunked_open_sigmf.png` | M-02 | Optional open screenshots per format |
| `m05_workspace_2026-10-21.json` | **M-05** | Assertion log: status-workspace, stub-explicit, no fake DDC, chart/detect retained |
| `m05_workspace_wideband.png` / `b-p3-workspace-wideband.png` | M-05 | Wideband workspace screenshot |
| `m05_workspace_narrowband_stub.png` / `b-p3-workspace-narrowband-stub.png` | M-05 | Narrowband **stub** banner screenshot |
| `m06_marks_undo_2026-10-21.json` | **M-06 WIP** | Playwright UI: `__wssM06` add/remove/snapshot/undo/redo + marker panel testids; past-safe decimal indexes |
| `m06_marks_panel.png` | M-06 | Marker rail panel screenshot after snapshot redo |

## M-06 (Bot-B Playwright UI)

- Hook: `installM06E2eHook(window)` in `apps/web/src/main.tsx` → `window.__wssM06` (Bot-F `packages/project-io`)
- Panel: `M06MarksPanel` on right-rail **marker** page (`m06-panel`, `m06-mark-list`, `m06-btn-undo` / `m06-btn-redo`, `m06-snapshot-status`)
- Spec: `apps/web/e2e/m06-marks.spec.ts`
- Unit (Bot-F): see `docs/acceptance/evidence/bot-f/M-06-marks-undo.md`

## M-02 fixtures (Bot-B e2e)

| Format | Relative path(s) | Sample count (decimal) |
|--------|------------------|------------------------|
| WAV | `apps/web/e2e/fixtures/tiny-iq.wav` | `256` |
| RAW CI16 LE | `apps/web/e2e/fixtures/tiny-iq.raw` | `256` |
| SigMF | `apps/web/e2e/fixtures/tiny.sigmf-meta` + `tiny.sigmf-data` | `128` |

Open path: `<input type=file multiple data-testid="input-iq-wav">` → `openIqFromFiles` → `@wss/file-io` → `stftFromChunkedReader`.

## How to re-run

```powershell
cd D:\project\wss-wt-b\apps\web
npm test
npm run typecheck
npx playwright test e2e/m06-marks.spec.ts e2e/m02-chunked-open.spec.ts e2e/shell-nav.spec.ts e2e/project-io.spec.ts e2e/workspace.spec.ts e2e/detect-page.spec.ts
```

**Do not set M-01 / M-02 / M-05 / M-06 PASS here.** QA verifies against these paths.
