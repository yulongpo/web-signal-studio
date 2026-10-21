# Bot-E ownership — local-compute

- Owner: Bot-E (detection + local compute)
- Protocol: docs/architecture/WEB_NATIVE_PROTOCOL.md v0.1.0
- Contract: services/local-compute/docs/DETECTION_PAGE_CONTRACT.md
- Hard rule: never fabricate FFSCN/SCN inference results

## Status (0.1.3-precheck)

- Structured `gpu` + `runtime` precheck on GET /capabilities
- Explicit task status machine; cancel wins over late BLOCKED
- Stub worker labeled STUB_NON_TENSORRT; never invents FFSCN/SCN results
- Worktree only: `D:\project\_wt_bot_e_local_compute` / `work/bot-e-local-compute`
