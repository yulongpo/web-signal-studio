# M-10 evidence — BigInt sample-index protocol (Bot-F)

- date: 2026-10-21 19:46:36 (Asia/Shanghai)
- worktree: `D:\\project\\wss-wt-f`
- branch: `work/bot-f-project-io`
- base tip (`origin/main` at handoff): `8f09dbca0c97201c70f41645624bed57efb3e50f`
- HEAD at evidence capture (pre-commit): `8f09dbca0c97201c70f41645624bed57efb3e50f`
- M-10 commit: `2cdc34ab47805bd40e215ec0b1debb3f32b0ee30`
- owner: Bot-F (contracts + domain). **QA / Bot-G owns ACCEPTANCE_MATRIX PASS** — this doc does **not** flip M-10 to PASS.

## Protocol under test

- In-memory: `bigint` (`SampleIndex`)
- Wire (JSON / Workers / WASM): **canonical uint64 decimal strings** (no leading zeros except `"0"`)
- Never JSON Number for indexes that may exceed `Number.MAX_SAFE_INTEGER`
- Domain `SampleRange` half-open `[begin, end)` aligns via `sampleRangeToJson` / `sampleRangeFromJson` → `TimeRangeJson`

## What was delivered

1. `packages/contracts/src/sample-index.test.ts` — extended with M-10 compare/clamp/assert + wire serialization protocol checks
2. `packages/domain/src/sample-range.ts` — `sampleRangeToJson` / `sampleRangeFromJson` / `makeSampleRangeFromUnknown`
3. `packages/domain/src/sample-range.test.ts` — domain alignment roundtrip + past-2^53 range ops
4. `packages/domain/package.json` — `test` script

## Commands run

```
npx vitest run --config vitest.config.ts packages/contracts packages/domain
```

## Result

| Suite | Tests | Status |
|-------|-------|--------|
| `sample-index.test.ts` | 12 | pass |
| `sample-range.test.ts` | 5 | pass |
| `undo-stack.test.ts` | 18 | pass |
| **Total** | **35** | **pass** |

## Matrix note

Do **not** mark `ACCEPTANCE_MATRIX` M-10 as PASS from this evidence alone. Hand off to QA/Bot-G.
