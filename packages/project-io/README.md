# @wss/project-io

Bot-F skeleton for native **project v6** and **annotations** persistence.

## BigInt / sample-index protocol

- In memory: `bigint` (`SampleIndex`).
- On the wire (JSON, Workers, WASM boundaries): **canonical decimal strings**.
- Canonical form: unsigned decimal, no leading zeros except `"0"`, range `0 .. 2^64-1`.
- **Never** serialize sample indexes as JSON `Number` — values past `Number.MAX_SAFE_INTEGER` (2^53−1) lose precision.
- Project time ranges use `begin` / `end` inside `time`.
- Annotation ranges use `start` / `end` (not begin/end) plus `lowerHz` / `upperHz`.

## Schemas

| Document | schema string | version |
|----------|---------------|---------|
| Project root | `signal-studio-native-project` | write **6**, load **1–6** |
| Annotations export | `signalstudio-annotations-v1` | — |

## Status

Load/save here is a typed parse/serialize skeleton (no full undo stack, no shard store yet).
