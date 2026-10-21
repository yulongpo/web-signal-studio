# CI native bindings: oxlint + rolldown + lightningcss

## Failures (same class)

| Run | SHA | Conclusion | Error |
|-----|-----|------------|-------|
| https://github.com/yulongpo/web-signal-studio/actions/runs/39584274930 | b66413b (`fix(ci): ensure rolldown linux binding`) | failure | `Cannot find module '../lightningcss.linux-x64-gnu.node'` from `@tailwindcss/node/node_modules/lightningcss` during `vitest run` |
| https://github.com/yulongpo/web-signal-studio/actions/runs/39584380863 | 585d9d1 (origin/main tip after Bot-F channel snapshot merge) | failure | same lightningcss MODULE_NOT_FOUND on unit step |
| https://github.com/yulongpo/web-signal-studio/actions/runs/39584927890 | eba42f4 (merge of Bot-G eecef2f bindings step) | failure | `ERR_PACKAGE_PATH_NOT_EXPORTED: Package subpath './package.json' is not defined by "exports"` in `@tailwindcss/node` during **ensure linux native bindings** (before npm install of bindings). Cause: `require.resolve('@tailwindcss/node/package.json')` under Node 22. |

Lint/typecheck already passed on the first two; only unit (vite config load -> tailwind -> nested lightningcss) failed. The third failed earlier, in the bindings step itself.

## Fix

In `.github/workflows/ci.yml` `ensure linux native bindings` (apps-web + e2e), force-install all three known optionals in one `npm install --no-save`:

1. `@oxlint/binding-linux-x64-gnu` @ oxlint version
2. `@rolldown/binding-linux-x64-gnu` @ rolldown version
3. `lightningcss-linux-x64-gnu` @ nested `@tailwindcss/node/node_modules/lightningcss` version (fallback: top-level `lightningcss`)

LCV detection uses filesystem checks (`[ -f .../package.json ]` then `node -p "require('./.../package.json').version"`), not `require.resolve('@tailwindcss/node/package.json')`, which Node 22 rejects via package `exports`.

Root cause class: optional platform bindings omitted from cross-platform lock (npm/cli#4828), same as prior oxlint/rolldown CI fixes; plus Node 22 package-exports blocking the previous LCV probe.

## Base

Commit parent: `27f71e8` (origin/main tip after Bot-F project-io merge; includes eba42f4). Branch: `work/bot-g-qa`. Worktree-only; no push from Bot-G.
