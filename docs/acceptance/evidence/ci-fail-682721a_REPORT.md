# CI failure — main `682721a` (post lock/@wss sync)

- timestamp (Asia/Shanghai): 2026-10-21 18:24
- run: https://github.com/yulongpo/web-signal-studio/actions/runs/39584103562
- npm ci / oxlint binding / lint / typecheck: **success**
- unit: **failure** — vitest/rolldown `Cannot find native binding` / missing `@rolldown/binding-*-` (same optional-deps class as oxlint)
- build: skipped

## Fix on work/bot-g-qa

CI step `ensure linux native bindings` now force-installs both:

- `@oxlint/binding-linux-x64-gnu`
- `@rolldown/binding-linux-x64-gnu`