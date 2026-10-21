# Bot-B host wiring evidence (NOT PASS)

| Field | Value |
|-------|-------|
| Status | **WIRING EVIDENCE ONLY** — do not treat as UI_PARITY PASS |
| Aligned to | Bot-A `INCREMENTAL_196db21.md` (G02 SpectrumToolbar still OPEN at 196db21; this tip demotes it) |
| Base | origin/main includes `196db21` (Bot-C G03–G05) |
| Rebuild | `17471a6` / f9f05bb nav vs label settings |

## Landed (Bot-B)

1. Compose C embeddables: NavChartHost, AuxChartHost, VerticalSplitter, MainChartHost.
2. NavChrome: 时域/功率/检测 + 时频/瀑布 + zoom/pause/segment (settings NOT in nav).
3. G02: SpectrumToolbar demoted — AuxParamStrip / SpecParamStrip on aux/spec headers; no always-on aux→main toolbar row.
4. Splitter defaults: nav 82 / aux 205 (short window aux 176).

## Screenshots (after e2e)

- wiring-hosts-overview.png
- wiring-nav-chrome.png
- wiring-aux-with-param-strip.png
- wiring-main-with-param-strip.png

## Not claimed

No ACCEPTANCE_MATRIX PASS. G01/G06/G07/G17 full PASS await A.
