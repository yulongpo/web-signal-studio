# Bot-F P3F status (project-io / domain undo)

- **Branch:** `work/bot-f-project-io`
- **Worktree:** `D:\project\wss-wt-f`
- **Base:** main merge tip that included Bot-F `ff4140e` + CI `b66413b` (`585d9d1…`)
- **Tip:** this commit on `work/bot-f-project-io` (`git rev-parse HEAD`)

## Landed this turn
- Domain boundary hardening for three-source marks + undo:
  - `makeChangeAnnotationSourceKindCommand` — switches ImportedLabel|Manual|Algorithm; undoes without touching start/end decimals.
  - `makeSetChannelSourceSnapshotCommand` — set/clear opaque `sourceSnapshot` on a project channel (no domain→project-io dependency; pair with project-io `attachChannelSnapshot` / encode at the call site).
  - Soft-delete already only flips `deleted`; boundary tests assert sourceKind + decimals stay intact.
- Boundary tests: invalid/lowercase kind reject on assert/add/replace/changeKind; empty undo/redo no-op; `clear()` zeroes depths; `pushAlreadyApplied` does not double-apply; interleaved annotation + selection/view full undo; BigInt mark indices past 2^53 through add→replace→undo→redo; sourceSet physicalSamples/availableSamples decimal strings; channel snapshot undo.

## Prior (retained)
- Channel snapshot persistence + BigInt JSON boundaries + `project-session` open/save contract (ff4140e).
- Domain undo stack (fed129e) via merge ancestry.

## Verify
- `npx vitest run --config vitest.config.ts packages/contracts packages/project-io packages/domain`
- Shared tree `D:\project\web_signal_studio` not written by Bot-F.
- Ancestry: `b66413b` and `585d9d1` are ancestors of tip (or tip is `585d9d1` + this commit).
