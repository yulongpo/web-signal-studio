# Bot-G web-5fc5788 vs desktop 17471a6 (NOT PASS)

- HEAD/sync: 5fc5788b65c8b070cf29cf23e7492e845fe455ad
- Impl D StftRequest: 3aaac7d
- Desktop: 17471a6488383b456281d12cb1a6d3d80290205d
- A-on-base: 24539f2 INCREMENTAL_ba3bb76 (merged at 5fc5788)
- Supersedes: web-ba3bb76 / 7dbcbff
- ui_parity_pass_claimed: false
- g06_g17_claimed: false

## Priority (store reachability; B strip chrome deferred)
- stft_publish_forced: {"dspFftWindow":"kaiser","dspFftOverlap":0.5,"dspFftHopSize":512,"dspFftSizeActive":1024,"dspSpectralMethod":"welch","dspSegmentMs":10.24,"dspSpectrumStatistic":null,"dspKaiserBeta":8.6,"dspSource":"synthetic-stft-worker","hasSetter":true}
- stft_publish_welch: {"dspFftWindow":"hann","dspFftOverlap":0.75,"dspFftHopSize":256,"dspFftSizeActive":1024,"dspSpectralMethod":"welch","dspSegmentMs":5,"dspSpectrumStatistic":null,"dspKaiserBeta":null,"dspSource":"synthetic-stft-worker","hasSetter":true}
- stft_publish_cleared: {"dspFftWindow":null,"dspFftOverlap":null,"dspFftHopSize":null,"dspFftSizeActive":null,"dspSpectralMethod":null,"dspSegmentMs":null,"dspSpectrumStatistic":null,"dspKaiserBeta":null,"dspSource":"synthetic-stft-worker","hasSetter":true}
- stft_publish_host: {"dspFftWindow":"hann","dspFftOverlap":0.75,"dspFftHopSize":256,"dspFftSizeActive":1024,"dspSpectralMethod":"welch","dspSegmentMs":1.024,"dspSpectrumStatistic":null,"dspKaiserBeta":null,"dspSource":"synthetic-stft-worker","hasSetter":true}
- stft_contract: {"via":"unavailable-in-browser"}
- strip_soft: {"window":"hann","overlap":"0.75","hop":"256","fftn":"1024","method_attr_present":false,"segment_attr_present":false,"note":"B tip not arrived — method/segment strip stamps may be absent; store is source of truth"}
- g08_soft: {"g08":"wave23","wave":"wave23"}

## Captures
- 01-stft-request-store-reachable.png
- 01b-strip-window-overlap-soft.png
- 02-g08-menubar-soft.png
- fold-web-2091dc0/* (14 files)

## Gaps
- no data-dsp-spectral-method strip attr yet (expected: B tip not arrived; store reachable)

No PASS claimed. No G06/G17 invention.