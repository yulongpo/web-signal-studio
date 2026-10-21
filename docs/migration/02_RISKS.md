# 02_RISKS

1. GitHub target repo create/push blocked until HH-laptop `gh` authenticated (PAT with repo scope).
2. TensorRT/models not in git; detection REAL path needs local assets — expect PARTIAL_BLOCKED without them.
3. uint64 sample indices — must use BigInt/decimal strings; JS Number unsafe above 2^53.
4. Large IQ files — forbid whole-file ArrayBuffer; require chunked File.slice / streaming.
5. Do not write D:\project\signal_studio_rebuild or push yulongpo/signal_studio.
6. Multi-bot merge conflicts on shared contracts — CAO owns contracts ownership.
