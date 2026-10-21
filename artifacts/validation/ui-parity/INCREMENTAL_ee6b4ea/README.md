# INCREMENTAL_ee6b4ea — post-merge matrix refresh @ main (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:45 Asia/Shanghai |
| Web tip (audit subject) | **`ee6b4ea`** = `ee6b4eafe4eb4036df6e92a3dc3ad8bfc004ec54` (CAO merge of A `INCREMENTAL_31cc4bf` incl. tip `2323f12`) |
| Desktop | **`17471a6`** |
| Prior Bot-A | `INCREMENTAL_31cc4bf/` @ audit tip `2323f12` (`2323f12381ca6bbdc3e9da3d3813a1155d4359f4`) |
| Scope | **Post-merge sync + short matrix refresh** — no new apps/packages delta on tip |
| Rule | Read-only; **no matrix PASS**; G02 stay PARTIAL with D formal BLOCKED residuals |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |
| Folder | `artifacts/validation/ui-parity/INCREMENTAL_ee6b4ea/` |
| MATRIX | `artifacts/validation/ui-parity/INCREMENTAL_ee6b4ea/MATRIX.md` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `ee6b4eafe4eb4036df6e92a3dc3ad8bfc004ec54` | `origin/main` tip = audit subject (short `ee6b4ea`) |
| `2323f12` | Prior Bot-A INCREMENTAL_31cc4bf tip (CAO FYI + format fix) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** Tip is merge-only of prior A audit. Business evidence base remains wave29 G02 UI wire + G pack + CAO FYI.

## Diff vs prior (`2323f12` → `ee6b4ea`)

1. **No apps/packages tip delta** — `ee6b4ea` = merge(A) `INCREMENTAL_31cc4bf` onto main.
2. **Probes reconfirmed on tip:** wave29 strip live `data-auto-n=on|off`; `resolveAnalysisSamples` present; `STFT_BLOCKED_METHODS` present; G08 `data-g08-shortcuts=wave23`; G18 mod STFT stamp; recognition BLOCKED; `data-native-qfiledialog=false`; ChartMarkOverlay backticks **16**.
3. **Statuses unchanged** from `INCREMENTAL_31cc4bf` (incl. CAO FYI).

## Verdict summary (refresh)

| ID | Status | Honesty note |
|----|--------|--------------|
| **G02** | **PARTIAL** | PoT auto-N + removeMean (UI→DSP) **MET**; Multitaper/Burg **BLOCKED**; **non-PoT BLOCKED** (D formal); **STFT-DDC/decimate BLOCKED** (D formal); full Qt SpectralSettings residual → **not CLOSED** |
| **G08** | PARTIAL | wave23 + six-menu evidence retained; desktop pixel residual |
| **G18** | PARTIAL | mod STFT MET; recognition STFT panes residual |
| **G19** | PARTIAL | `data-native-qfiledialog=false` |
| **G17** / **G06** | PARTIAL — **BLOCKED** | no invent / no elevate |
| G07 / G11 | PARTIAL | residuals retained |
| G05 / G14 | CLOSED | unchanged |
| G25 | DOCS | unchanged |
| G01, G03–G04, G12–G13, G15, G20, G26 | PARTIAL | unchanged |
| G09–G10, G16, G21–G24 | OPEN | unchanged |

**Counts:** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

## TOP residual (max 8)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream **BLOCKED**
3. **G19 residual** — **true native QFileDialog** (`=false`)
4. **G18 residual** — recognition STFT panes
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — Multitaper/Burg **BLOCKED**; **non-PoT BLOCKED**; **STFT-DDC BLOCKED**; full Qt SpectralSettings
7. **G08 residual** — desktop Qt pixel / full `buildMenus` parity
8. **G11 residual** — PlotWidget paint *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**ui_parity_pass_claimed: false**  
**pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G02 remains **PARTIAL** — do **not** CLOSED on UI+PoT alone. G06/G17 **BLOCKED**. ChartMarkOverlay backticks = **16**.