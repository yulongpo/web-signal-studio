# G18 handoff — declined by Bot-F (project-io)

| Field | Value |
|-------|-------|
| When | 2026-10-21 Asia/Shanghai |
| Base tip | `5d33611e178473977b2076c4ec817cde1175719e` |
| matrix_pass_claimed | false |

## Why declined

G18 = right-rail display/channel page fill + constantly visible summary text for reference level and dynamic range (desktop `696ce12` `displaySummary_`). ACCEPTANCE e2e:

- `page.getByTestId('display-summary')` contains reference / dynamic copy

This is **UI / display chrome**, not project persistence, session, tree, or marks IO. Owner: **Bot-B** (with channel DSP display fields possibly Bot-C/D). Bot-F does not implement G18 in this tip.
