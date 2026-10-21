# Evidence: M-02 RAW / SigMF / WAV chunked read (Package M-02)

- **date**: 2026-10-21 (Asia/Shanghai)
- **owner**: Bot-D (`wss-wt-d` / `work/bot-d-dsp`)
- **baseline (pre-commit tip)**: `1931398`
- **commit**: `f1916c403526f913b1a2497e0b268217a3d9875f` (short `f1916c4`) (short `f1916c4`)
- **matrix_id**: **M-02**
- **matrix_pass_claimed**: **false**
- **ACCEPTANCE_MATRIX M-02**: **WIP** — awaiting Bot-G / QA; this doc does **not** claim PASS

## Scope

Unit + golden coverage for chunked IQ read across **RAW**, **SigMF**, and **WAV** in `packages/file-io`, including boundary cases (empty / one-frame / past-EOF / available-prefix / chunk budget / AbortSignal / header-trailer).

No live captures. All fixtures are synthetic or labeled e2e tiny files.

## Fixture description (labeled synthetic — not live)

| Fixture | Description |
|---------|-------------|
| Synthetic CI16 LE IQ ramp | `makeSyntheticCi16Buffer` with optional 0xaa header / 0xbb trailer |
| Synthetic SigMF meta+data | `makeSyntheticSigmfMeta` + ArrayBuffer dataset; offset/trailing from meta |
| e2e `tiny.sigmf-{meta,data}` | `apps/web/e2e/fixtures/` — 512 B CI16 LE, 128 frames, sample_rate 1e6, freq 915e6; description says synthetic |
| PCM16 LE stereo IQ WAV | `buildPcm16LeStereoIqWav` tone; ArrayBuffer + Blob paths |

**Not** claimed as live capture / field SigMF / hardware RF.

## Key files

| Path | Role |
|------|------|
| `packages/file-io/src/m02-chunked-formats.golden.test.ts` | Consolidated M-02 golden (RAW + SigMF + WAV boundaries) |
| `packages/file-io/src/raw-sigmf.test.ts` | Prior RAW/SigMF unit tests |
| `packages/file-io/src/wav-iq.test.ts` | Prior WAV + Blob + FSA tests |
| `packages/file-io/src/chunked-reader.test.ts` | ArrayBufferChunkedReader prefix/cancel |
| `packages/file-io/src/raw-reader.ts` / `sigmf-reader.ts` / `wav-reader.ts` / `blob-chunked-reader.ts` | Implementation |

## Exact re-run commands (from repo root on HH-laptop worktree)

```bash
npx vitest run packages/file-io
npm run typecheck -w @wss/web
```

PowerShell (HH-laptop):

```powershell
Set-Location D:\project\wss-wt-d
npx vitest run packages/file-io
npm run typecheck -w @wss/web
```

## Key boundary assertions

| Format | Case | Assertion |
|--------|------|-----------|
| RAW | header/trailer | payload offset 8; totalSamples exclude header+trailer |
| RAW | ranged | begin=4 end=7 → 6 floats; I≈4/32768 |
| RAW | empty / one / past-EOF | empty len=0; one len=2; past truncates to availableSamples |
| RAW | chunk budget | maxBytes=`DEFAULT_CHUNK_BYTES` caps sample count |
| RAW | cancel | AbortSignal → reject |
| SigMF | meta | datatype/sample_rate/offset/trailing parsed |
| SigMF | boundaries | empty/one/past-EOF/available-prefix/cancel |
| SigMF | tiny e2e | totalSamples=128; past-EOF truncates to 128 |
| WAV | empty/one/past-EOF | same pattern via openIqWavFromArrayBuffer |
| WAV | Blob | available-prefix partial; BlobChunkedReader mid-range; abort |

## Verify results (filled at commit time)

- `npx vitest run packages/file-io`: **PASS — 4 files, 31 passed** (incl. m02 golden 12 passed)
- `npm run typecheck -w @wss/web`: **PASS** (`tsc -b`)

## Dual-write

- Tracked review path: `docs/acceptance/evidence/bot-d/`
- Runtime mirror: `artifacts/validation/bot-d/` (gitignore whitelisted `*.json` / `*.md` like bot-c)

## QA notes

- Do **not** flip `ACCEPTANCE_MATRIX` M-02 to PASS from this evidence alone.
- `matrix_pass_claimed: false` — WIP awaiting Bot-G.
- Shared tree / rebuild: **no writes**. MainChartHost untouched.
