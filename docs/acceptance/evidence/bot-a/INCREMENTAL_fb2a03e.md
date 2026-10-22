# INCREMENTAL_fb2a03e — G §4 shot score + E demo IQ (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 08:47 Asia/Shanghai |
| Web tip / base | **`fb2a03e`** = `fb2a03e7783356cf0007a7b418afe6e555d699d1` |
| Desktop | **`17471a6`** |
| Prior A | `fbd68994c66529d5cc06921210d6e60add4f7195` / `INCREMENTAL_f01d582` (superseded for G §4 update) |
| G pack | `artifacts/validation/ui-parity/qa/web-f01d582/` (+ export twin) |
| E | `BROADBAND_GAP9_WIDEBAND_DEMO_IQ.md` (`87f2725`) |
| Plan | `BROADBAND_GAP.md` §4 |
| Rule | Docs-only; **matrix_pass_claimed=false**; no PASS; no G06/G17 invent |
| After tip | **PAUSE** empty refresh until next user instruction |

## Counts (unchanged)

OPEN **5** · PARTIAL **18** · CLOSED **2** · DOCS **1** · backticks **16**

## G §4 status: **PENDING → PARTIAL** (shot floor landed; not pixel MET)

**Cite:** `qa/web-f01d582/COMPARISON_NOTES.md`, `QA_CHECKLIST.md`, `capture-notes.json` (all `pass_claimed: false`). Merge `082868d` / tip `fb2a03e`.

| BROADBAND_GAP §4 shot | Evidence | Score |
|----------------------|----------|-------|
| 1 Full wideband shell (MenuBar + tri-pane + strip + BottomScale) | `01-wideband-shell-stft-strip.png` / `01b-…waterfall.png` | **present** |
| 2 Overflow spectral (auto-N on/off, SegmentMs; removeMean/Kaiser) | `03-fixed-segment-ms.png` / `03b-auto-n-on.png` | **present** for auto-N + SegmentMs; removeMean/Kaiser **no dedicated crop** → soft residual |
| 3 Mode-wheel live + Waterfall | `05-mode-wheel-live.png` (+ `01b`) | **present** (`data-matrix=insufficient` OK) |
| 4 BottomScale ΔT/ΔF physical-view | `04-…` / `04b-…crop` | **present** (`data-axis-bind=physical-view`) |
| 5 Soft G08 accel / menu inventory | `06-menubar-open-iq-stamps.png` / `06b` | **present** |
| 6 Optional linked cursor + mark | `02-pan-zoom-aux-cursor.png` | **partial** — cursor shown; `g18_linked=false`; mark box not required |

**Verdict:** G §4 acceptance **shot pack PARTIAL** — six required categories largely covered; **not** pixel-parity MET vs `17471a6`; **not** matrix PASS; **not** gap CLOSED invent. Extra: SigMF demo `06c` (E path); G10 maximize `06d/06e` soft.

**Shot paths (worktree):**  
`artifacts/validation/ui-parity/qa/web-f01d582/`  
`artifacts/validation/ui-parity/qa/web-f01d582-export/`

## Carry prior gap statuses (@ f01d582 / 81493fe)

| Gap | Status |
|-----|--------|
| G12 / G15 | **PARTIAL** (shared history) |
| G08 / G19 / G20 / G07 | **PARTIAL** (B soft) |
| G09 / G11 | **PARTIAL** |
| G10 | **OPEN** (Esc soft; maximize shots soft only) |
| G02 | **PARTIAL** · Multitaper **BLOCKED** |
| G16 | **PARTIAL** / matrix **BLOCKED** |
| G06 / G17 | **BLOCKED** |
| G21–G24 | **OPEN** (non-blockers) |
| E demo IQ (#9) | **PARTIAL→deepened** (one-click fixtures landed; not PASS) |

## Explicit

**matrix_pass_claimed: false** · **ui_parity_pass_claimed: false** · **pass_claimed: false**  
**PAUSE** after this tip — no empty refresh until next user instruction.