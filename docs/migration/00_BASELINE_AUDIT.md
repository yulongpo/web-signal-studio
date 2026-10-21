# 00_BASELINE_AUDIT

## Source identity
- repo: yulongpo/signal_studio
- branch: rebuild/a143-native
- HEAD: 0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af
- note: matches master-prompt reference SHA (2026-10-21); re-checked via git ls-remote
- stack: C++20 / Qt 6.11.1 Widgets / QRhi D3D11
- local readonly mirror: D:\project\web_signal_studio\.work\upstream-readonly
- local rebuild path (READONLY, never write): D:\project\signal_studio_rebuild

## Module map (source)
| Area | Paths | Capability status |
|---|---|---|
| Domain/application | domain/, application/ | REAL: coords, project, markers, detection contracts, commands, session |
| Infrastructure IO/DSP | infrastructure/ | REAL: RAW/SigMF/IQ WAV, PSD/STFT, CPU DDC/FIR/resampler, project v6 |
| UI | app/, ui/ | REAL: wide/narrow workspaces, W0–W6 UX, four-page sidebar |
| Detection worker | tools/detection_worker/ | REAL on compatible GPU+models: FFSCN/SCN TensorRT; EXTERNAL asset |
| Tests/docs | tests/, docs/ | REAL evidence for U4/R6/a143-native |

## Demo vs real (must not inflate on Web)
- REAL: IQ load, waveform/PSD/STFT, markers, CPU DDC channels, project v6, FFSCN/SCN when models+GPU present
- DEMO (labeled): narrowband constellation/eye/modulation recognition/demod
- EXTERNAL: TensorRT/CUDA DLLs, model packs under out/ (not in git clone)

## a143-native UX (W0–W6) — must preserve
- Single-row chart toolbar; PSD/STFT independent settings; unique colormap
- Transient settings layers with draft rules; four-page right rail
- Detection first screen simplified; explicit ROI/current-view; history derive; runId cancel
- Param commit only on Enter/Tab/in-app focus change

## Web migration notes
- Do not port Qt Widgets/QRhi; reuse Qt-free domain/DSP where license+build allow
- Browser path: File API + Workers/WASM + WebGL2
- Optional local-compute service for TensorRT; degrade without fake results
