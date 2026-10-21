# CI native bindings: oxlint + rolldown + lightningcss

## Failures (same class)

| Run | SHA | Conclusion | Error |
|-----|-----|------------|-------|
| https://github.com/yulongpo/web-signal-studio/actions/runs/39584274930 | b66413b (`fix(ci): ensure rolldown linux binding`) | failure | `Cannot find module '../lightningcss.linux-x64-gnu.node'` from `@tailwindcss/node/node_modules/lightningcss` during `vitest run` |
| https://github.com/yulongpo/web-signal-studio/actions/runs/39584380863 | 585d9d1 (origin/main tip after Bot-F channel snapshot merge) | failure | same lightningcss MODULE_NOT_FOUND on unit step |

Lint/typecheck already passed on both; only unit (vite config load → tailwind → nested lightningcss) failed.

## Fix

In `.github/workflows/ci.yml` `ensure linux native bindings` (apps-web + e2e), force-install all three known optionals in one `npm install --no-save`:

1. `@oxlint/binding-linux-x64-gnu` @ oxlint version
2. `@rolldown/binding-linux-x64-gnu` @ rolldown version
3. `lightningcss-linux-x64-gnu` @ nested `@tailwindcss/node/node_modules/lightningcss` version (fallback: top-level `lightningcss`)

Root cause class: optional platform bindings omitted from cross-platform lock (npm/cli#4828), same as prior oxlint/rolldown CI fixes.

## Base

Commit parent: `3583e1a` (Bot-E merge after 585d9d1; not 585d9d1/b66413b alone). Branch: `work/bot-g-qa`. Worktree-only; no push from Bot-G.