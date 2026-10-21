# Q-04 secrets / .gitignore sweep — Bot-G (P6)

- timestamp (Asia/Shanghai): 2026-10-21 19:41
- tip base: `1931398`

## Scan

- Pattern sweep over tracked text sources (excl. node_modules/dist/lockfiles): AWS AKIA, PEM/private keys, ghp_/github_pat_, Slack xox*, password/api_key/secret_key assignments.
- Result: **no hits**.
- Env files present: only `services/local-compute/.env.example` (placeholders; no live tokens).
- Tracked IQ fixtures are tiny/synthetic only (`tiny-iq.raw` 1 KiB, `tiny-iq.wav` ~1 KiB, `synthetic_iq_stereo.wav` ~195 KiB).

## .gitignore tighten

Added / reinforced ignores for:
- `.env` / `.env.*` (keep `!.env.example`), `**/.env.local`
- `**/secrets.*`, `**/credentials.json`, `**/credentials.*.json`
- `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks`, `id_rsa*`, `id_ed25519*`, `*.secret`, `*.token`
- Large / user assets: `*.iq`, `*.sigmf-data`, `**/user-data/`, `**/model-weights/`, `*.engine`, `*.trt`, `*.onnx`, `*.pth`, `*.pt`, `**/weights/*.bin`
- Delivery allowlist: `!artifacts/delivery/` + `!artifacts/delivery/manifest.json`
- License validation allowlist under `artifacts/validation/license/`

## Gate

- Q-04 → **PASS** (no committed secrets found; gitignore covers env/credentials/keys/large weights)
- Residual risk: human can still force-add ignored files; rely on PR review + CI secret scanning if/when enabled.
