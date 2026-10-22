# PARITY SigMF/IQ parse + format templates (Bot-F)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Worktree | `D:\project\wss-wt-f` |
| Branch | `work/bot-f-project-io` |
| Base tip (`origin/main` at start) | `10ee4cd29cdba2d87cf9dc48fd5da7ff3caf5abe` |
| Desktop refs | `infrastructure/import_controller.*`, `format_template_store.*`, `sigmf_metadata.cpp`, `source_metadata.*`, `raw_sample_reader.*` (`describeRawFile`) |
| Status | **WIP evidence** — not ACCEPTANCE PASS |
| matrix_pass_claimed | **false** |

## Scope (CAO PARITY)

加深 SigMF/IQ parse + templates 向桌面 `import_controller` / `FormatTemplateStore` / `readSigmfMetadata`；字段与解析结果对等；导出稳定 API 供 Bot-B Add-signal UI 接线。禁假 PASS。

## Parity achieved (concrete fields)

| Desktop | Web (this tip) |
|---------|----------------|
| Builtin templates 通用 CI16/CF32/CI8/CU8/实数 Int16 ADC (`builtin-0..4`) | `listBuiltinFormatTemplates` / `FormatTemplateStore` |
| Template JSON `signal-studio-format-templates` v1 | `encodeFormatTemplatesJson` / `decodeFormatTemplatesJson` + desktop `sampleFormat` keys |
| `core:offset` = external sample index (NOT disk header) | `ParsedSigmfMeta.externalSampleOffset`; warning text mirrors desktop |
| Disk header = first capture `core:header_bytes` | `format.headerBytes` from capture only |
| Trailer = `core:trailing_bytes` | `format.trailerBytes` |
| Datatype `c\|r` + `i8\|u8\|i16\|i32\|f32\|f64` + endian rules | `datatypeToSampleFormat` rejects u16/u32; endian required for multi-byte |
| Require `global` / `captures` / `annotations` + version `1.x.x` | `parseSigmfMeta` throws `SigmfMetaError` |
| `SourceSuggestions` (Fs/Fc/BW/format/error/warnings/conflicts/provenance/locks) | `SourceSuggestionsJson` + `suggestSourceMetadata` / `suggestFromSigmfMeta` |
| Filename FS/FC/BW + `(C\|R)(I8…)` hints | `suggestFromFilename` |
| `describeRawFile` → sampleCount from format+bytes | `describeRawIqForImport` / `describeRawIqWithTemplate` |
| ImportRow confirmed gate ("请确认采样结构…") | `confirmed:false` → Failed with same message |
| ImportStatus Ready/Failed/Pending… | `ImportPreviewRow.status` / deepened `ImportStreamStatus` |
| `ImportController.add` commit path | existing `importSigmfStream` (+ warnings/provenance/sampleFormat on row) |

## Bot-B Add-signal handoff (call these)

From `@wss/project-io` or `apps/web/src/projectIo`:

1. **Templates picker:** `listBuiltinFormatTemplates()` / `FormatTemplateStore` / `encode|decodeFormatTemplatesJson`
2. **After file pick (SigMF):** `previewSigmfImport({ metaText, dataByteLength, path })` → show `row` + `suggestions`; on confirm → `importSigmfStream(...)` then `engineeringTreeFromSession`
3. **After file pick (raw IQ):** `describeRawIqWithTemplate({ templateId, dataByteLength, sampleRateHz, centerFrequencyHz, confirmed:true, path })`
4. **Filename prefill:** `suggestFromFilename(path)` or `suggestSourceMetadata({ path, metaText? })`
5. **E2E / window hook:** `installG19E2eHook(window)` → `__wssG19.previewSigmf` / `previewRawWithTemplate` / `listFormatTemplates` / `importSigmf` / `getTree`

B owns: file input / FSA, Add-signal dialog chrome, mapping tree into left rail, commit UX. F does **not** implement UI.

## Tests

```
npx vitest run --config vitest.config.ts packages/file-io/src/raw-sigmf.test.ts packages/project-io
```

## Honesty fence

- `matrix_pass_claimed=false`
- No Multitaper / Burg / fake DSP claims
- Annotations still mapped to ImportedLabel only when `importSigmfStream` is called (desktop warns they are not auto-converted; web documents the explicit opt-in)
- ChannelLayout remains desktop-only on wire JSON (encode always writes `interleaved`); not yet on `SampleFormatDescriptor`
