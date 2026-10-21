# Bot-F P3F status (project-io / domain undo)

- **Branch:** `work/bot-f-project-io`
- **Worktree:** `D:\project\wss-wt-f`
- **Base:** main `682721a7d96b735e569579bff8dd26fb178d3fd0` (merged before this commit; includes Bot-C/D/E/G)
- **Tip:** this commit on `work/bot-f-project-io` (`git rev-parse HEAD`)

## Landed this turn
- Channel snapshot persistence: `attachChannelSnapshot` / `readChannelSnapshot` / `isAnnotationChannelSnapshotJson` on `@wss/project-io`; related ids (annotationId/segmentId/revisionId/sourceIdentity) written with wire snapshot; decimal begin/end strings survive serialize→parse.
- BigInt JSON boundary tests in `@wss/contracts` sample-index + `@wss/project-io`: past 2^53, uint64 max, 0, adjacent; prove numeric JSON.parse loses precision; reject leading zeros / scientific notation; project sampleCount/view/snapshot ranges stay string decimals.
- Web open/save wiring contract: `packages/project-io/src/project-session.ts` — `openProjectFromJsonText`, `saveProjectToJsonText`, annotation open/save, `summarizeLoadedProject` / `ProjectSessionSummary` (pure data). Exported from index with JSDoc for Bot-B.
- `parseProjectJson` documents that a JSON reviver cannot recover lost Number precision.
- Prior: domain undo stack (fed129e) retained via merge ancestry.

## Verify
- `npx vitest run --config vitest.config.ts packages/contracts packages/project-io packages/domain` -> 25 passed (3 files).
- Shared tree `D:\project\web_signal_studio` not written by Bot-F.
- Ancestry: `682721a` is ancestor of tip.