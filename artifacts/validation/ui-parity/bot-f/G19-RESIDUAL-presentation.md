# G19 residual — badge / relation / compact-detail presentation (Bot-F)

| Field | Value |
|-------|-------|
| When | 2026-10-21 Asia/Shanghai |
| Base tip | `5d33611e178473977b2076c4ec817cde1175719e` |
| Desktop | `17471a6` / presentation `c1f2cce` |
| Status | **WIP evidence** — not ACCEPTANCE PASS |
| matrix_pass_claimed | **false** |

## Scope closed (project-io)

Deepened `EngineeringTreeNode` presentation vs desktop `c1f2cce` for Bot-B ProjectTree:

- `title` / `tooltip` / `sourceTooltip` on file, channel, mark, annotationSource nodes
- Channel relation normalize + detail map (`CHANNEL_SOURCE_RELATION_DETAILS`, `normalizeChannelSourceRelation`, `channelRelationDetail`) matching desktop relationText
- Compact channel detail: CF / BW / sample-rate / sourceTime / relation / create revision
- File / channel `unread` badge when view or sourceTime end exceeds availableSamples
- `detectionRuns` branch under each file when `file.detectionRuns` present
- Re-exports from `@wss/project-io` and thin `apps/web/src/projectIo`

## G18 decision

**Declined (handoff Bot-B / display UI).** G18 is right-rail `display-summary` constant copy for Level / reference / dynamic range (`696ce12`, ACCEPTANCE `display-summary` toContainText). Not persistence/session/tree/marks IO. No project-io code in this tip.

## Tests

```
npx vitest run packages/project-io/src/engineering-tree.test.ts packages/project-io/src/g19-sigmf-import.test.ts
# 7 passed | 1 skipped
```

## B gaps (still PARTIAL G19)

- ProjectTree should surface `node.tooltip` / `title` / richer `detail` (currently uses `title={node.detail}` on row)
- Chinese desktop relation strings vs ASCII detail codes (optional i18n in B)
- Full chrome parity (folder glyphs, multi-select UX) remains Bot-B
- G20 Open IQ UI still PARTIAL (not this tip)

## Non-claims

No ACCEPTANCE_MATRIX PASS. No self-declared PASS. G19 remains PARTIAL until B presentation wires tooltips/badges fully.
