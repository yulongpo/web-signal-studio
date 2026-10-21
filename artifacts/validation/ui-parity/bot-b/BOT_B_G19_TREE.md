# Bot-B G19 ProjectTree wiring (WIP / NOT PASS)

| Field | Value |
|-------|-------|
| Status | **WIP evidence** — not ACCEPTANCE PASS |
| Base tip | `cf1b3f8` (F G19 on main) |
| APIs | `engineeringTreeFromSession` / `listMarkNodes` / `EngineeringTreeNode` |

## Landed

- ProjectTree renders `EngineeringTreeNode` tree (three-source groups when annotations present).
- Mark click → `__wssM06.setSelection`.
- Soft-delete / restore → `__wssM06.session.setMarkDeleted`.

## Non-claims

- No ACCEPTANCE_MATRIX PASS. Full desktop tree parity still PARTIAL.
