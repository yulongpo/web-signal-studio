# G19–G20 evidence — engineering IO parity (Bot-F)

- date: 2026-10-21 21:05:20 (Asia/Shanghai)
- worktree: `D:\\project\\wss-wt-f`
- branch: `work/bot-f-project-io`
- base tip (`origin/main`): `be885f2dbfd9daa1b9965bf072d3cdcf69150118`
- HEAD pre-commit: `be885f2dbfd9daa1b9965bf072d3cdcf69150118`
- owner: Bot-F. **Does not** flip ACCEPTANCE_MATRIX PASS. Rebuild tree read-only.

## Scope (CAO)

配合 UI 对等：工程树 / 打开 SigMF / 导入流（G19–G20）。Desktop reference: `signal_studio_rebuild/docs/acceptance/ui-parity.md` UI-34..36 + `ImportController` add/commit row semantics.

## Allowed demo IQ path (enforced)

- `D:\\project\\signal_studio_rebuild\\resources\\sigmf_data_demo\\0000000.sigmf-meta`
- `D:\\project\\signal_studio_rebuild\\resources\\sigmf_data_demo\\0000000.sigmf-data`
- `D:\\project\\signal_studio_rebuild\\resources\\sigmf_data_demo\\0000000.json`

## Delivered APIs (Bot-B can call; no uiStore rewrite)

| Symbol | Module | Role |
|--------|--------|------|
| `importSigmfStream` | `packages/project-io/src/import-sigmf-stream.ts` | Append/replace SigMF into v6 project + ImportedLabel annotations + engineering tree |
| `engineeringTreeFromProject` | `engineering-tree.ts` | Left-rail tree model (ProjectTreeNode-compatible) |
| `createG19E2eHook` / `installG19E2eHook` | `g19-e2e-hook.ts` | `window.__wssG19` Playwright hook |
| allowlist helpers | `demo-iq-paths.ts` | Path gate for validation |

Web thin re-export: `apps/web/src/projectIo/index.ts`.

## Commands

```
npx vitest run --config vitest.config.ts packages/project-io
```

## Result

| Suite | Status |
|-------|--------|
| project-io (incl. g19-sigmf-import) | **22 passed, 1 skipped** (skip = non-HH demo-missing branch) |
| Demo open | sampleCount `400000` string; cf32_le; 20e6 Hz; 2.5e9 Hz CF; ≥4 ImportedLabel marks; companion `rfbench-v1` |

## Gaps for Bot-B

- Wire `installG19E2eHook(window)` in e2e bootstrap / map `getTree()` into `ProjectTree` (replace SAMPLE_TREE when session loaded).
- File-input / FSA still B-owned; F should keep providing `importSigmfStream` + hook only.
- Playwright UI screenshot for left tree after demo open is B's follow-up.
