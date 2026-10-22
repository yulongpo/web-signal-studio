# BROADBAND_GAP #9 — wideband demo IQ fixtures (Bot-E)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Gap | BROADBAND_GAP #9 (Bot-A plan item 9: demo IQ / fixtures) |
| Branch | `work/bot-e-broadband-gap9-fixtures` |
| Base tip | `f01d58215aec970e450d88402bb21a4200dc2040` (`origin/main`) |
| HEAD tip | `959de2ea96fe1d12c12adea9013c6f857c592943` |
| matrix_pass_claimed | **false** |
| ui_parity_pass_claimed | **false** |
| Recognition | unchanged — no fake FFSCN/SCN invent; Detect still gated on real IQ + caps |

**This is GAP prep / evidence only. Do NOT treat as PASS / MET for the acceptance matrix.**

---

## 1. Fixture root (only allowed path)

```
D:\project\signal_studio_rebuild\resources\sigmf_data_demo
```

- Rebuild tree is **read-only** for Bot-E.
- Forbidden: any other IQ path; copying demo binaries into the web tree; inventing synthetic live capture claims.
- Vite already allowlists this dir for `/@fs` (`apps/web/vite.config.ts` `server.fs.allow`).
- Shared constants: `DEFAULT_SIGMF_DATA_DEMO_DIR` / `SIGMF_DATA_DEMO_STEM` in `apps/web/src/dsp/auxWaveRawIq.ts`; `SIGMF_DEMO_*` in `packages/project-io/src/demo-iq-paths.ts`.

---

## 2. Inventory (HH-laptop, 2026-10-22)

| File | Size | Role |
|------|------|------|
| `0000000.sigmf-meta` | 1677 B | SigMF meta |
| `0000000.sigmf-data` | 3_200_000 B | Interleaved IQ payload |
| `0000000.json` | 2728 B | rfbench-v1 sidecar (events; not required for open) |

**Meta (from `.sigmf-meta`):**

| Key | Value |
|-----|-------|
| `core:datatype` | `cf32_le` |
| `core:sample_rate` | **20_000_000 Hz (20 MHz)** — suitable **wideband** demo |
| `captures[0].core:frequency` | **2_500_000_000 Hz (2.5 GHz)** |
| samples (data / 8 B cf32) | **400_000** complex samples ≈ 0.02 s |
| annotations | 4 emitters (64qam / 2gmsk / bpsk / 64qam) with freq edges + SNR |

**Wideband suitability:** Fs=20 MHz with multi-emitter annotations spanning ~±8 MHz around Fc — appropriate for main-spectrum / Detect shell demos. Folder is **not** empty; only this one stem pair exists under the allowlist.

---

## 3. One-click / one-shot load into wideband shell

### A. UI one-click (new Bot-E helper — preferred)

1. Start web app (`apps/web`, Vite dev) on HH-laptop with the demo folder present.
2. Ensure workspace is **Wideband** (`btn-workspace-wideband` / StatusBar `status-workspace` = `wideband`).
3. Click either:
   - Spectrum toolbar **Load demo IQ** — `data-testid="btn-load-demo-iq"`
   - Menu **File → Load wideband demo IQ (sigmf_data_demo)** — `data-testid="menu-load-demo-iq"`
4. Helper: `openDemoIqForMainChart()` in `apps/web/src/dsp/openIqForMainChart.ts`
   - Calls `ensureDemoSigmfReader()` (Vite `/@fs` or `node:fs`) against **only** the allowlisted dir + stem `0000000`.
   - Publishes into `iqFileSession` with `via: 'demo'`, `format: 'sigmf'`.
5. Main chart STFT should settle to `data-dsp-source="demo-sigmf-stft"` (`MainChartHost`); StatusBar file label shows `0000000.sigmf-data`.
6. Detect page then sees `hasIqSource=true` (same session) — still **no** invented recognition.

### B. Manual / Playwright nearest path (pre-existing)

Spectrum toolbar **Open IQ** OR Menu → Open IQ → pick BOTH:

- `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\0000000.sigmf-meta`
- `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\0000000.sigmf-data`

E2E pattern (Bot-G): `input-iq-wav.setInputFiles([SIGMF_META, SIGMF_DATA])` — see `apps/web/e2e/bot-g-ui-parity-capture.spec.ts`.

### C. Vitest evidence (Node fs)

```
cd apps/web
npx vitest run src/dsp/openDemoIqForMainChart.test.ts
```

Skips if fixtures missing; when present expects `via=demo`, Fs=20e6, sourceLabel contains `sigmf_data_demo`.

---

## 4. Code touch list (this tip)

| Path | Change |
|------|--------|
| `apps/web/src/dsp/iqFileSession.ts` | `IqOpenVia` += `'demo'` |
| `apps/web/src/types/provisional.ts` | `DspSourceKind` += `'demo-sigmf-stft'` |
| `apps/web/src/dsp/openIqForMainChart.ts` | `openDemoIqForMainChart()` |
| `apps/web/src/dsp/openDemoIqForMainChart.test.ts` | disk fixture test |
| `apps/web/src/components/SpectrumToolbar.tsx` | `btn-load-demo-iq` |
| `apps/web/src/components/MenuBar.tsx` | `menu-load-demo-iq` |
| `apps/web/src/components/MainChartHost.tsx` | chip / `kindForVia` for demo |

No IQ binaries copied into the web tree.

---

## 5. Explicit non-claims

- **matrix_pass_claimed: false**
- Not G26 CLOSED; G26 remains PARTIAL until Detect engine UX + QA pack say otherwise.
- Not recognition PASS; FFSCN/SCN still require live caps + real model path honesty.
- `loadSampleProject()` (`demo_wideband.iq` status label only) is **not** a real IQ load — do not confuse with this helper.

---

## 6. Tip SHAs

| | SHA |
|--|-----|
| base | `f01d58215aec970e450d88402bb21a4200dc2040` |
| HEAD | `959de2ea96fe1d12c12adea9013c6f857c592943` |
