# ARCHITECTURE

## Goals
Web Signal Studio is a browser-first IQ/RF analysis product migrated from Qt Signal Studio (`rebuild/a143-native`), not a remote desktop of the Qt UI.

## Runtime topology
```
Browser (apps/web)
  ├─ UI shell / workspace / four-page rail
  ├─ charts (WebGL2 scalar texture + LUT; software fallback)
  ├─ domain state (BigInt indices, undo/redo)
  ├─ file-io (chunked File.slice / OPFS cache)
  ├─ dsp workers (PSD/STFT/DDC via WASM or TS)
  └─ compute adapter: BrowserCompute | LocalComputeService
Optional local-compute (services/local-compute)
  ├─ loopback only + session token
  ├─ capabilities / task / cancel / evidence
  └─ FFSCN/SCN TensorRT worker (EXTERNAL assets)
```

## Package ownership
| Package | Owner Bot | Notes |
|---|---|---|
| packages/contracts | Bot-F | shared schemas; others consume |
| packages/domain | Bot-F (+ CAO review) | physical coords, commands |
| packages/project-io | Bot-F | v6 read/write |
| packages/file-io | Bot-D | RAW/SigMF/WAV |
| packages/dsp-wasm | Bot-D | PSD/STFT/DDC |
| packages/charts | Bot-C | WebGL2 |
| apps/web | Bot-B | shell + wiring |
| services/local-compute | Bot-E | detection service |
| tests/, .github | Bot-G | QA/CI |

## Hard rules
- Sample indices: BigInt or decimal string; never Number for >2^53
- No whole-file ArrayBuffer for large IQ
- No fake FFSCN/SCN; DEMO features must be labeled
- Origin for local-compute must be checked; bind 127.0.0.1 only by default
- Writable root only: D:\project\web_signal_studio
