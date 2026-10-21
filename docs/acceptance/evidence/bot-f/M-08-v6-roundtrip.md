# M-08 evidence — project v6 fixture roundtrip (Bot-F)

- date: 2026-10-21 19:42:57 (Asia/Shanghai)
- worktree: `D:\\project\\wss-wt-f`
- branch: `work/bot-f-project-io`
- base tip (`origin/main` at sync): `19313983fa535325dacf8f1317a9c8aa9bc18c91`
- HEAD at evidence capture (pre-commit): `19313983fa535325dacf8f1317a9c8aa9bc18c91`
- owner: Bot-F (project-io fixtures + roundtrip). **QA / Bot-G owns ACCEPTANCE_MATRIX PASS** — this doc does **not** flip M-08 to PASS.

## What was delivered

1. Fixtures under `packages/project-io/fixtures/`:
   - `v6-realistic-project.json` — native project v6 with past-2^53 view ranges, uint64-max `sampleCount`, two channels with embedded `sourceSnapshot` (`Algorithm` LocatedSegment + `Manual` UserRange), `boundRange` required for v6
   - `v6-annotations-three-sources.json` — annotations export with ImportedLabel / Manual / Algorithm sourceSets + past-safe `start`/`end` decimals
2. Automated fixture roundtrip tests: `packages/project-io/src/m08-v6-roundtrip.fixture.test.ts`
   - load → identity save → reload → structural equality
   - mutate name/activeChannel → save → reload (indexes stable)
   - double pretty-serialize idempotent
   - annotations three-source roundtrip

## Commands run

```
npx vitest run --config vitest.config.ts packages/project-io
```

## Result

| Suite | Tests | Status |
|-------|-------|--------|
| `project-io.test.ts` | 9 | pass |
| `m08-v6-roundtrip.fixture.test.ts` | 4 | pass |
| **Total** | **13** | **pass** |

Duration ~1s (vitest 3.2.7).

## BigInt / wire assertions covered

- `sampleCount` / view `begin`/`end` / snapshot `range`+`boundRange` stay **canonical decimal strings** (never JSON Number)
- Values past `Number.MAX_SAFE_INTEGER` (`9007199254741091`, `9007199254741992`) and uint64 max `18446744073709551615` round-trip via `openProjectFromJsonText` / `saveProjectToJsonText`
- Channel snapshot decode yields `bigint` in-memory (`readChannelSnapshot`)

## Matrix note

Do **not** mark `ACCEPTANCE_MATRIX` M-08 as PASS from this evidence alone. Hand off to QA/Bot-G.
