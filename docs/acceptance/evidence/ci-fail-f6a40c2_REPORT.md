# CI failure diagnosis — main `f6a40c2`

- timestamp (Asia/Shanghai): 2026-10-21 18:20
- worktree: `D:\project\wss-wt-g` @ `8c13686` (pre-fix commit)
- remote SHA: `f6a40c23134b2940330c017737e03a0b4427ad1a`
- run: https://github.com/yulongpo/web-signal-studio/actions/runs/39583037963
- job: apps/web lint typecheck unit build (id 119165049785)
- conclusion: **failure** at step **lint** (~0s after start); typecheck/unit/build skipped

## Root cause (evidence from job logs)

`npm run lint` → `oxlint` crashed:

```
Error: Cannot find native binding. ...
cause: Error: Cannot find module '@oxlint/binding-linux-x64-gnu'
```

`npm ci` in `apps/web` succeeded (119 packages) but did **not** install the Linux glibc x64 optional binding. Lockfile *lists* `@oxlint/binding-linux-x64-gnu@1.89.0` with `optional: true` + `os: linux` + `libc: glibc`; install still skipped (known npm optional-deps / cross-platform lock behavior; see npm/cli#4828). Windows worktree has only `binding-win32-x64-msvc` under `node_modules/@oxlint`, so local lint stays green while Ubuntu CI fails.

e2e job: skipped (`if: false`) — not part of this failure.

## Fix (work/bot-g-qa, worktree only)

`.github/workflows/ci.yml`: after `npm ci`, force-install matching binding:

```bash
VER="1.89.0"
npm install --no-save "@oxlint/binding-linux-x64-gnu@"
```

No push to shared main from Bot-G; CAO merges when ready. Re-run expectation: lint proceeds; further failures (if any) would be typecheck/unit/build — separate evidence.

## Non-goals this patch

- Does not add root `LICENSE` (legal/CAO).
- Does not enable e2e in CI.
- Does not rewrite package-lock on Linux (binding step is sufficient for ubuntu-latest).