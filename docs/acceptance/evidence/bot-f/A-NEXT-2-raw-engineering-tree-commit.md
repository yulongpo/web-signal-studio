# A Next #2 RAW → engineering-tree commit stream (Bot-F)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Worktree | `D:\project\wss-wt-f` |
| Branch | `work/bot-f-project-io` |
| Base tip (`origin/main` at tip) | `8f73f69461c044fc8bce3cc6efbc4f0903e0af06` |
| Desktop refs | `infrastructure/import_controller.*`, `raw_sample_reader.*` (`describeRawFile`), `ui/import/signal_import_dialog.cpp` (finish → `sources()` → `commitSource` → `markCommitted`) |
| Status | **WIP evidence** — not ACCEPTANCE PASS |
| matrix_pass_claimed | **false** |

## Scope (CAO A Next #2)

Implement / deepen **RAW → engineering-tree commit stream** (collaborate with B Add-signal wire). Align with desktop import; honest gaps in evidence. Ban PASS.

## Before vs after

| Path | Before (PARITY `a7fb002`) | After (this tip) |
|------|------------------------------|------------------|
| SigMF | `previewSigmfImport` → `importSigmfStream` → project + tree | unchanged |
| RAW | `describeRawIqWithTemplate` **preview only**; dialog note “待 F RAW commit API” | `importRawStream` / `importRawWithTemplate` → project + annotations stub + `engineeringTreeFromProject`; Add-signal confirm calls it |

## What RAW commit stream now does

1. Requires `confirmed: true` (desktop ImportController gate; same message as preview).
2. `describeRaw` sampleCount from `dataByteLength` + header/trailer (BigInt decimal string).
3. Validates fs/fc/bw/duration bounds like `describeRawFile` (“采样率、频率、时长或有效带宽无效”).
4. Writes `ProjectFileJson` (sampleFormat, declared/effectiveBandwidthHz, fingerprint `raw:…`).
5. `append` | `replace` into project; `activeFileId`; empty annotations (no SigMF marks).
6. Returns `tree` via `engineeringTreeFromProject`; row `format:'raw'`, `committed:true`.
7. `__wssG19.importRaw` / `importRawWithTemplate` for e2e; B dialog wired on confirm.

## Bot-B handoff

- `importRawWithTemplate({ path, dataByteLength, sampleRateHz, centerFrequencyHz, templateId, confirmed:true, project?, mode? })`
- `importRawStream` when sampleFormat already known
- Hook: `__wssG19.importRawWithTemplate` / `getTree` / `getState`
- Re-export: `apps/web/src/projectIo` + `AddSignalDialog` RAW confirm

## Honesty fence (NOT yet equal to desktop)

- **No SourceLoader poll / navigationEnvelope** — Ready means metadata validated, not disk mmap + envelope load; `canCommit` desktop also requires `load.loaded>0`.
- **No filesystem existence check** — caller supplies `dataByteLength` (browser `File.size`); desktop `QFileInfo` readable gate absent.
- **No WAV container re-check** on commit (desktop `readWavMetadata` consistency on startImport).
- **ChannelLayout** still desktop-only on template wire JSON; not on `SampleFormatDescriptor`.
- **No Multitaper / Burg / fake DSP**; chart open still via B `openIqFromFiles` (separate from project commit).
- Remainder bytes not forming a full frame → warning + truncating sampleCount (desktop `sampleCountForBytes` may error — document as soft gap).
- `matrix_pass_claimed=false`

## Tests

```
npx vitest run --config vitest.config.ts packages/project-io/src/import-raw-stream.test.ts packages/project-io
```

## Files

- `packages/project-io/src/import-raw-stream.ts` (new)
- `packages/project-io/src/import-raw-stream.test.ts` (new)
- `packages/project-io/src/import-sigmf-stream.ts` (`ImportStreamRow.format` `sigmf|raw`)
- `packages/project-io/src/g19-e2e-hook.ts` / `index.ts`
- `apps/web/src/projectIo/index.ts` / `AddSignalDialog.tsx` / `addSignalHonesty.test.ts`
- this evidence pair