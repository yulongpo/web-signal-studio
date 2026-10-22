# BOT_D NB marker→DDC prep / P0#7

- synced base: `1112706aa496273db54cc60c065e8eb921647b7f` (origin/main)
- matrix_pass_claimed: false
- IQ: sigmf_data_demo only
- Ban: Bluestein / cascaded FirDecimator / Multitaper / Burg (not invented)

## Desktop entry points (signal_studio_rebuild @ 17471a6)

| Path | Role |
|------|------|
| `application/session.cpp` `Session::createChannelFromActiveMark` | Active mark → AnnotationChannelRequest → Channel; opens NB workspace |
| `application/annotation_service.cpp` `annotationChannelRequest` | Mark/segment RF box → center/bw; `outputSampleRateHz = min(fs, max(4e6, bw*1.3))` |
| `application/annotation_service.cpp` `AnnotationService::bindChannelSource` | Bind Channel.sourceMarkId + snapshot |
| `domain/project.h` `struct Channel` | `centerFrequencyHz`, `bandwidthHz`, `outputSampleRateHz`, `sourceMarkId`, `sourceTime` |
| `infrastructure/channel_processor.cpp` `makeChannelDspPlan` / `processChannelSamples` | Plan + NCO mix (`delta = sourceFc - channelFc`) + staged lowpass/decimate + rational resample |
| `ui/narrowband_workspace.cpp` | Observe charts consume ChannelSampleCache / channel_* helpers |

## Web current vs gap (pre/post this tip)

| Piece | Before | After P0#7 |
|-------|--------|------------|
| LO/BW source | Demo SigMF annotation index 0 only | Prefer `__wssM06` active channel, else active mark RF box; fallback demo-annotation |
| Rate | PoT decimation ≈ 4×BW | Desktop `min(fs,max(4e6,bw*1.3))` → single-stage L/M (no cascade invented) |
| Status | Generic `… → DDC` | Honest `真实 DDC · marker|channel|demo-annotation` + `data-nb-ddc-kind` |
| Multitaper/Burg | N/A | Explicitly absent from labels |

## Wait-for-A

CAO formal assign superseded wait-for-A; this tip lands DDC←active broadband marker wiring on Bot-D.