# Bot-F P3F status (project-io / domain undo)

- **Branch:** `work/bot-f-project-io`
- **Worktree:** `D:\project\wss-wt-f`
- **Base:** main `f6a40c23134b2940330c017737e03a0b4427ad1a` (project-io + contracts v6 skeleton)
- **Tip:** this commit on `work/bot-f-project-io` (`git rev-parse HEAD`)

## Landed this turn
- `@wss/domain` undo/redo: `UndoStack` / `HistoryStack` with `push`, `pushAlreadyApplied`, `undo`, `redo`, `canUndo`/`canRedo`, labels, `clear`, `limit` eviction.
- Reversible annotation ops: add / remove / replace / soft-delete; three-source `ImportedLabel|Manual|Algorithm` asserted first-class.
- Project ops: set file view-range (decimal wire strings), set active file/channel + mark selection.
- Vitest: push/undo/redo order, redo cleared on new push, limit eviction, BigInt-safe view range decimals, three-source CRUD.
- Contracts / project-io unchanged functionally; existing exports intact.

## Verify
- `npm test -- packages/contracts packages/project-io packages/domain` -> 16 passed.
- Shared tree `D:\project\web_signal_studio` not written by Bot-F.