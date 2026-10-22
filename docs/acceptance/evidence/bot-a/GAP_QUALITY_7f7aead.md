# GAP_QUALITY_7f7aead — visual quality vs desktop 17471a6 (OPEN only / no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 10:53 Asia/Shanghai |
| Web tip | **`7f7aead`** = `7f7aead43b066ff8332d6e4ddc023db3ddc64f08` |
| origin/main base | **`816858d`** = `816858d1db7fa169f459dc2e591f20c8ddc393bb` |
| Desktop | **`17471a6`** (HH-laptop 4K RO `signal_studio_rebuild`) |
| Pack (inspected) | `C:\Users\Admin\Downloads\wss-shots-7f7aead-quality\` (mirror `artifacts/validation/ui-parity/qa/web-7f7aead-quality\`) |
| Viewport claimed | 3840×2160 |
| **matrix_pass_claimed** | **false** |
| PASS | **none** — user complaint: visual still far from desktop |

## Harsh summary

DOM gates in pack NOTES claim tree/partition/colorscale “ok”, but **pixel inspection shows shell still looks sparse, charts underfilled, aux/NB traces empty or blocky, and zh/en chrome mixed**. Shot **01 ≡ 03** (identical SHA256) means the labeled STFT capture is a **duplicate of the tree/waterfall shell** — not a trustworthy STFT proof. Quality is **not** desktop-parity.

Pack files inspected (Read on every PNG):  
`01-project-tree-loaded.png` · `01b-project-tree-crop.png` · `02-broadband-waterfall-4k.png` · `02b-display-colorscale-crop.png` · `03-broadband-stft-4k.png` · `05-narrowband-observe-4k.png` · `06-nb-ddc-pipeline-state.png` (+ NOTES/MANIFEST).

Verified: SHA256(`01`)=SHA256(`03`)=`8E8B3A1E6F99CCF035EB305898D159B212DDFD350EDC9594A495243B49F14026`.

## OPEN gaps (owners B / C / D only)

| ID | Gap (what looks wrong) | Evidence | Owner | Actionable |
|----|------------------------|----------|-------|------------|
| Q7-01 | **Viewport / density:** app chrome + charts pinned to top ~¼–⅓ of 4K frame; huge black void below — not desktop full-window fill | `01` `02` `03` `05` | **B** | Force shell root + splitters to fill `100vh`/client area; kill fixed undersized chart stack height |
| Q7-02 | **Partition ratios:** left tree + right rail too narrow/cramped; main chart band too short vs desktop tri-pane density | `01` `02` `05` | **B** | Restore desktop-like rail widths + graphSplitter default sizes (nav/aux/main heights) |
| Q7-03 | **Fonts 4K:** tree/chrome text tiny; axis ticks hard to read; not YaHei/Consolas desktop weight | `01b` `02` `05` | **B** | Raise shell/tree font-size scale for 4K; keep YaHei UI + Consolas mono |
| Q7-04 | **zh/en mix:** MenuBar brand `Signal Studio`/`SS`; right-rail EN fields; NB header `DDC` mixed into CN | `01` `02` `05` `06` | **B** | zh-only user chrome (tech units OK); purge EN chrome strings |
| Q7-05 | **Tree presentation:** redundant twin labels (`原始标签 0` + colored `原始标签`); sparse row chrome vs dense desktop tree | `01b` | **B** | Match `project_tree_presentation.h` single-line Title/Detail/Badge; kill duplicate chips |
| Q7-06 | **Shot 01≡03:** labeled STFT shot is byte-identical to tree/shell capture — **no distinct STFT visual** | `01` vs `03` hashes | **C** | Ensure STFT mode paints distinct heatmap (freq×time) before any re-shot; verify mode toggle actually swaps canvas |
| Q7-07 | **Aux / upper chart empty-flat:** broadband upper pane shows near-empty axes / flat line — not desktop aux wave/PSD energy | `01` `02` `03` | **D** (+C scale) | Feed opened IQ into aux host with correct amplitude domain; fix empty-buffer path |
| Q7-08 | **Waterfall blocky / sparse:** low-res color blocks, large uniform voids; weak vs desktop fine spectrogram | `02` `01` | **C** | Raise STFT/waterfall texture resolution, colormap mapping, axis ticks; match desktop density |
| Q7-09 | **Colorbar quality:** crop tiny/blurry; ticks/dB hard to read; thin strip vs desktop legend | `02b` `02` | **C** | Readable colorbar overlay (tick font, width, dB labels) on heatmap |
| Q7-10 | **NB Observe empty wave/PSD:** top charts grid-only; STFT strip thin — not desktop three-chart filled Observe | `05` | **C** / **D** | C: layout heights + paint; D: drive Observe from active broadband mark (not only demo-annotation fallback) |
| Q7-11 | **NB DDC honesty residual:** status `真实 DDC · 演示标注（无活动宽带标记/通道）` — no mark-driven DDC in shot | `06` + NOTES | **D** | Require active mark/channel → `real-marker`/`real-channel` before claiming NB visual parity |
| Q7-12 | **BB vs desktop resemblance:** overall still “web sparse shell” — missing desktop tool density, filled panes, crisp axes | `01`–`05` vs desktop refs in prior packs | **B**+**C** | Joint: B shell density + C chart fill until side-by-side no longer “empty product” |

## TOP actionable (severity order)

1. **B** — Fill 4K viewport; fix graphSplitter / rail proportions (Q7-01/02).  
2. **C** — Fix STFT/waterfall paint + colorbar readability; eliminate 01≡03 mode failure (Q7-06/08/09).  
3. **D** — Aux + NB chart data feed (opened IQ / mark DDC) so panes are not empty (Q7-07/10/11).  
4. **B** — 4K fonts + zh-only chrome + tree presentation (Q7-03/04/05).  
5. **C+D** — NB Observe three-chart visual parity vs desktop (Q7-10).  

## Explicit

- **OPEN count:** **12**  
- **No PASS** · **matrix_pass_claimed: false**  
- **禁发明:** G06 eye/bitstream · G17 recognition · G16 enable-matrix · Multitaper · Burg  
- Pack NOTES `gaps: []` is **DOM-gate optimism** — **overruled by pixel inspection** above  

## Paths
- `docs/acceptance/evidence/bot-a/GAP_QUALITY_7f7aead.md`  
- Pack: `C:\Users\Admin\Downloads\wss-shots-7f7aead-quality` · repo mirror `artifacts/validation/ui-parity/qa/web-7f7aead-quality`