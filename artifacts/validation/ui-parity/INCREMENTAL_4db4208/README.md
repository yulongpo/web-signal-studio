# INCREMENTAL_4db4208 — post-merge matrix refresh @ main (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:47 Asia/Shanghai |
| Web tip (audit subject) | **`4db4208`** = `4db4208e50c8f4ae1a3d56d01c797c9347117a41` (CAO merge of A `INCREMENTAL_ee6b4ea`) |
| Desktop | **`17471a6`** |
| Prior Bot-A | `INCREMENTAL_ee6b4ea/` @ audit tip `9a0bd6e` (`9a0bd6e4960375f3810badfb7017a911e5c75ddc`) |
| Scope | **Post-merge sync + short matrix refresh** — no new apps/packages delta |
| Rule | Read-only; **no matrix PASS**; G02 stay PARTIAL with D formal BLOCKED residuals |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |
| Folder | `artifacts/validation/ui-parity/INCREMENTAL_4db4208/` |
| MATRIX | `artifacts/validation/ui-parity/INCREMENTAL_4db4208/MATRIX.md` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `4db4208e50c8f4ae1a3d56d01c797c9347117a41` | `origin/main` tip = audit subject (short `4db4208`) |
| `9a0bd6e` | Prior Bot-A INCREMENTAL_ee6b4ea (base) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

## Diff vs prior (`9a0bd6e` → `4db4208`)

1. **No apps/packages tip delta** — merge(A) `INCREMENTAL_ee6b4ea` only.
2. **Probes reconfirmed:** wave29 live auto-N; `resolveAnalysisSamples`; `STFT_BLOCKED_METHODS`; G08 wave23; G18 mod STFT; recognition BLOCKED; `data-native-qfiledialog=false`; backticks **16**.
3. **Statuses unchanged.**

## Verdict summary (refresh)

| ID | Status | Honesty note |
|----|--------|--------------|
| **G02** | **PARTIAL** | PoT auto-N/removeMean **MET**; Multitaper/Burg **BLOCKED**; **non-PoT BLOCKED**; **STFT-DDC BLOCKED** → **not CLOSED** |
| **G08** | PARTIAL | wave23 + six-menu; desktop pixel residual |
| **G18** | PARTIAL | mod STFT MET; recog panes residual |
| **G19** | PARTIAL | `data-native-qfiledialog=false` |
| **G17** / **G06** | PARTIAL — **BLOCKED** | no invent |
| G07 / G11 | PARTIAL | residuals retained |
| G05 / G14 | CLOSED | unchanged |
| G25 | DOCS | unchanged |
| G01, G03–G04, G12–G13, G15, G20, G26 | PARTIAL | unchanged |
| G09–G10, G16, G21–G24 | OPEN | unchanged |

**Counts:** OPEN **7** · PARTIAL **16** · CLOSED **2** · DOCS **1**. **No PASS.**

## TOP residual (max 8)

1. **G17** — recognition **BLOCKED**
2. **G06** — eye/bitstream **BLOCKED**
3. **G19** — true native QFileDialog (`=false`)
4. **G18** — recognition STFT panes
5. **G07** — full Qt Detect Worker
6. **G02** — Multitaper/Burg **BLOCKED**; **non-PoT BLOCKED**; **STFT-DDC BLOCKED**; full Qt SpectralSettings
7. **G08** — desktop Qt pixel / full `buildMenus`
8. **G11** / G09·G16 OPEN

## Explicit

**matrix_pass_claimed: false**  
**ui_parity_pass_claimed: false**  
**pass_claimed: false**  
G02 remains **PARTIAL** — do **not** CLOSED. G06/G17 **BLOCKED**. backticks = **16**.