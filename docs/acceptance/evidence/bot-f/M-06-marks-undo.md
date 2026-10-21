# M-06 evidence — marks / channel snapshot / undo-redo (Bot-F)

- date: 2026-10-21 19:48:49 (Asia/Shanghai)
- worktree: `D:\\project\\wss-wt-f`
- branch: `work/bot-f-project-io`
- base tip (`origin/main` at handoff): `8f09dbca0c97201c70f41645624bed57efb3e50f`
- HEAD at evidence capture (pre-commit): `ffaa6f8daa702d7b540c44f9efcf36e88d20e40b`
- M-06 commit: `0cd92b9d4ab5c74657c708122f17eb6e6fbc0de3`
- owner: Bot-F (domain + project-io). **QA / Bot-G owns ACCEPTANCE_MATRIX PASS** — this doc does **not** flip M-06 to PASS.

## What was delivered

1. **Domain** (already present, covered by tests): `UndoStack` + mark/view/selection/channel-snapshot commands
2. **`packages/project-io/src/m06-mark-session.ts`** — `M06MarkSession` facade: marks + `attachChannelSnapshot` / `readChannelSnapshot` + undo/redo + `exportJson`
3. **`packages/project-io/src/m06-e2e-hook.ts`** — Playwright-installable hook (`window.__wssM06` via `installM06E2eHook`)
4. Unit tests: `m06-mark-session.test.ts` (5) + existing `undo-stack.test.ts` (18)
5. Web thin re-export of M-06 symbols from `apps/web/src/projectIo`

## E2E hook API (`__wssM06`)

| Method | Role |
|--------|------|
| `getState()` | Serializable undo/selection snapshot |
| `addManualMark` / `removeMark` / `changeSourceKind` | Mark ops |
| `attachChannelSnapshot` / `clearChannelSnapshot` | Channel snapshot via project-io encode |
| `setSelection` | Active file/channel/mark ids |
| `undo` / `redo` | History |
| `exportJson()` | Project + annotations text (decimal indexes) |

Bot-B can `installM06E2eHook(window)` in a test build / e2e bootstrap; Bot-F does not edit uiStore.

## Commands run

```
npx vitest run --config vitest.config.ts packages/project-io packages/domain
```

## Result

| Suite | Tests | Status |
|-------|-------|--------|
| `undo-stack.test.ts` | 18 | pass |
| `sample-range.test.ts` | 5 | pass |
| `project-io.test.ts` | 9 | pass |
| `m08-v6-roundtrip.fixture.test.ts` | 4 | pass |
| `m06-mark-session.test.ts` | 5 | pass |
| **Total** | **41** | **pass** |

## Matrix note

Do **not** mark `ACCEPTANCE_MATRIX` M-06 as PASS from this evidence alone. Hand off to QA/Bot-G. Playwright UI wiring remains Bot-B.
