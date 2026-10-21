# G19 TOP#8 evidence - engineering tree + three-source marks (Bot-F)

- date: 2026-10-21 22:19:59 (Asia/Shanghai)
- base tip (origin/main): `c63f1de9e3e8e11c2a62b9e1f20a0ed5b719c3d4`
- HEAD pre-commit: `c63f1de9e3e8e11c2a62b9e1f20a0ed5b719c3d4`
- desktop reference: rebuild `c1f2cce` / tip `17471a6` (`ui/project_tree_presentation.h`)
- matrix_pass_claimed: false

## Expected (desktop)

- Project tree kinds include file/channel/marks/annotationSource/mark
- Three-source groups: ImportedLabel / Manual / Algorithm with distinct colors
- Compact source detail (rate, CF, samples); channel relation badges
- Soft-deleted marks retained under source group with deleted badge

## Delivered

- `engineeringTreeFromSession` + presentation fields + `listMarkNodes`
- G19 hook `getTree` / `listMarks` / `setAnnotations` / sourceGroupLabels
- Tests: `engineering-tree.test.ts` + updated g19 demo hook asserts

## Commands

```
npx vitest run --config vitest.config.ts packages/project-io
npm run typecheck -w @wss/web
```

## Result

project-io: 24 passed / 1 skipped. web typecheck: see commit message.

## Gaps for Bot-B

- Map `EngineeringTreeNode` into `ProjectTree` (widen kinds; replace SAMPLE_TREE)
- Wire selection/active/soft-delete UI to mark nodes
- Optional Playwright screenshot of three-source groups
