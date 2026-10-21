# CI failure — main `a904334` (post oxlint fix)

- timestamp (Asia/Shanghai): 2026-10-21 18:22
- run: https://github.com/yulongpo/web-signal-studio/actions/runs/39583728389
- conclusion: **failure** at `npm ci (apps/web)`
- error: `Missing: @wss/web@0.0.0 from lock file` (package.json name `@wss/web` vs lock / workspace root)
- prior: cc2b98e same class of failure; f6a40c2 was oxlint binding (fixed in 09deef9)

## Fix on work/bot-g-qa

1. Regenerate root `package-lock.json` so `apps/web` entry has `name: @wss/web`
2. Align `apps/web/package-lock.json` name to `@wss/web`
3. CI installs from **repo root** `npm ci` then `npm run … -w @wss/web`; keep oxlint linux binding step