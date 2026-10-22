/**
 * Add-signal dialog (Bot-B) — wires F parse/templates APIs.
 * Desktop analogue: SignalImportDialog / ImportController preview+confirm.
 * Browser picker only: data-native-qfiledialog=false (never claim native Qt).
 * matrix_pass_claimed=false — field/result parity, not fake Qt pixels.
 */
import { useMemo, useRef, useState } from 'react';
import {
  describeRawIqWithTemplate,
  importRawWithTemplate,
  importSigmfStream,
  listBuiltinFormatTemplates,
  previewSigmfImport,
  suggestFromFilename,
  summarizeLoadedProject,
  type FormatTemplate,
  type ImportPreviewRow,
  type SourceSuggestionsJson,
} from '../projectIo';
import { useUiStore } from '../store/uiStore';
import { openIqFromFiles } from '../dsp/openIqForMainChart';

export type AddSignalDialogProps = {
  open: boolean;
  onClose: () => void;
};

type Kind = 'idle' | 'sigmf' | 'raw' | 'unknown';

function basename(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

function classifyName(name: string): Kind {
  const lower = name.toLowerCase();
  if (lower.endsWith('.sigmf-meta') || lower.endsWith('.sigmf-data')) return 'sigmf';
  if (
    lower.endsWith('.iq') ||
    lower.endsWith('.raw') ||
    lower.endsWith('.ci16') ||
    lower.endsWith('.bin') ||
    lower.endsWith('.dat')
  )
    return 'raw';
  if (lower.endsWith('.wav')) return 'raw';
  return 'unknown';
}

function statusLabel(status: ImportPreviewRow['status'] | undefined): string {
  switch (status) {
    case 'Ready':
      return '就绪';
    case 'Failed':
      return '失败';
    case 'Pending':
      return '待确认';
    case 'Reading':
      return '读取中';
    case 'Partial':
      return '部分';
    case 'Cancelled':
      return '已取消';
    default:
      return '—';
  }
}

export function AddSignalDialog({ open, onClose }: AddSignalDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templates = useMemo(() => listBuiltinFormatTemplates(), []);
  const [picked, setPicked] = useState<File[]>([]);
  const [kind, setKind] = useState<Kind>('idle');
  const [pathLabel, setPathLabel] = useState('');
  const [previewRow, setPreviewRow] = useState<ImportPreviewRow | null>(null);
  const [suggestions, setSuggestions] = useState<SourceSuggestionsJson | null>(null);
  const [templateId, setTemplateId] = useState<string>(templates[0]?.id ?? 'builtin-0');
  const [sampleRateHz, setSampleRateHz] = useState(1_000_000);
  const [centerFrequencyHz, setCenterFrequencyHz] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const metaHold = useRef<{ metaText: string; dataByteLength: number; companion?: string } | null>(
    null,
  );

  if (!open) return null;

  const reset = () => {
    setPicked([]);
    setKind('idle');
    setPathLabel('');
    setPreviewRow(null);
    setSuggestions(null);
    setConfirmed(false);
    setError(null);
    setNote(null);
    metaHold.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const close = () => {
    reset();
    onClose();
  };

  const runRawPreview = (
    files: File[],
    nextTemplateId: string,
    fs: number,
    fc: number,
    isConfirmed: boolean,
  ) => {
    const file = files[0];
    if (!file) return;
    const row = describeRawIqWithTemplate({
      path: file.name,
      dataByteLength: file.size,
      sampleRateHz: fs,
      centerFrequencyHz: fc,
      templateId: nextTemplateId,
      confirmed: isConfirmed,
      displayName: file.name,
    });
    setPreviewRow(row);
    setSuggestions(suggestFromFilename(file.name));
    if (row.status === 'Failed' && row.error) setError(row.error);
    else setError(null);
  };

  const onFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setBusy(true);
    setError(null);
    setNote(null);
    setPreviewRow(null);
    setSuggestions(null);
    metaHold.current = null;
    try {
      const files = Array.from(list);
      setPicked(files);
      const names = files.map((f) => f.name);
      const hasMeta = names.some((n) => n.toLowerCase().endsWith('.sigmf-meta'));
      const hasData = names.some((n) => n.toLowerCase().endsWith('.sigmf-data'));
      const primary = files[0]!;
      const detected = hasMeta || hasData ? 'sigmf' : classifyName(primary.name);
      setKind(detected);
      setPathLabel(names.join(', '));

      if (detected === 'sigmf') {
        const metaFile =
          files.find((f) => f.name.toLowerCase().endsWith('.sigmf-meta')) ?? primary;
        const dataFile = files.find((f) => f.name.toLowerCase().endsWith('.sigmf-data'));
        const companionFile = files.find(
          (f) =>
            f.name.toLowerCase().endsWith('.json') &&
            !f.name.toLowerCase().endsWith('.sigmf-meta'),
        );
        const metaText = await metaFile.text();
        const dataByteLength = dataFile?.size ?? 0;
        const companionJsonText = companionFile ? await companionFile.text() : undefined;
        metaHold.current = { metaText, dataByteLength, companion: companionJsonText };
        const { suggestions: sug, row } = previewSigmfImport({
          metaText,
          dataByteLength: dataByteLength || undefined,
          path: metaFile.name,
          displayName: metaFile.name,
          companionJsonText,
        });
        setSuggestions(sug);
        setPreviewRow(row);
        setConfirmed(row.status === 'Ready');
        if (row.status === 'Failed') setError(row.error ?? (sug.error || 'SigMF 预览失败'));
        if (!dataFile) {
          setNote('未同时选择 .sigmf-data；样本数可能未知。确认导入时需提供数据长度。');
        }
      } else if (detected === 'raw') {
        const hint = suggestFromFilename(primary.name);
        setSuggestions(hint);
        const fs = hint.sampleRateHz && hint.sampleRateHz > 0 ? hint.sampleRateHz : 1_000_000;
        const fc = hint.centerFrequencyHz ?? 0;
        setSampleRateHz(fs);
        setCenterFrequencyHz(fc);
        let tid = templateId;
        if (hint.format) {
          const match = templates.find(
            (t) =>
              t.sampleFormat.componentEncoding === hint.format?.componentEncoding &&
              t.sampleFormat.structure === hint.format?.structure,
          );
          if (match) {
            tid = match.id;
            setTemplateId(tid);
          }
        }
        setConfirmed(false);
        runRawPreview(files, tid, fs, fc, false);
      } else {
        setError('无法识别文件类型。请选择 SigMF（.sigmf-meta / .sigmf-data）或 RAW IQ。');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const onTemplateChange = (id: string) => {
    setTemplateId(id);
    if (kind === 'raw' && picked.length) {
      runRawPreview(picked, id, sampleRateHz, centerFrequencyHz, confirmed);
    }
  };

  const onFsChange = (v: number) => {
    setSampleRateHz(v);
    if (kind === 'raw' && picked.length) {
      runRawPreview(picked, templateId, v, centerFrequencyHz, confirmed);
    }
  };

  const onFcChange = (v: number) => {
    setCenterFrequencyHz(v);
    if (kind === 'raw' && picked.length) {
      runRawPreview(picked, templateId, sampleRateHz, v, confirmed);
    }
  };

  const onToggleConfirmed = (next: boolean) => {
    setConfirmed(next);
    if (kind === 'raw' && picked.length) {
      runRawPreview(picked, templateId, sampleRateHz, centerFrequencyHz, next);
    }
  };

  const onConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      if (kind === 'sigmf') {
        const hold = metaHold.current;
        if (!hold || !hold.metaText) {
          setError('缺少 SigMF meta，无法确认导入。');
          return;
        }
        if (!hold.dataByteLength) {
          setError('缺少 .sigmf-data 字节长度；请同时选择 meta 与 data。');
          return;
        }
        const metaName =
          picked.find((f) => f.name.toLowerCase().endsWith('.sigmf-meta'))?.name ??
          picked[0]?.name ??
          'signal.sigmf-meta';
        const existing = useUiStore.getState().projectDocument;
        const result = importSigmfStream({
          metaText: hold.metaText,
          dataByteLength: hold.dataByteLength,
          companionJsonText: hold.companion,
          path: metaName,
          displayName: basename(metaName),
          mode: existing ? 'append' : 'replace',
          project: existing ?? undefined,
          enforceDemoPath: false,
        });
        const summary = summarizeLoadedProject({
          document: result.project,
          version: 6,
        });
        const active =
          summary.files.find((f) => f.id === summary.activeFileId) ?? summary.files[0];
        useUiStore.setState({
          projectDocument: result.project,
          projectSummary: summary,
          projectError: null,
          projectSource: 'json',
          projectHasSample: false,
          statusFileLabel: active?.name ?? summary.name,
          statusChannelLabel: active ? `${active.channelCount} ch` : '—',
          detectSampleRange: {
            start: '0',
            end: active?.sampleCount ?? '0',
          },
          detectSampleRangeSource: 'file',
        });
        const dataFile = picked.find((f) => f.name.toLowerCase().endsWith('.sigmf-data'));
        const metaFile = picked.find((f) => f.name.toLowerCase().endsWith('.sigmf-meta'));
        if (dataFile && metaFile) {
          await openIqFromFiles([metaFile, dataFile]);
        }
        setNote(
          `已确认导入：${result.row.displayName}（样本 ${result.row.sampleCount}，Fs=${result.row.sampleRateHz}）。工程树已更新。`,
        );
        close();
        return;
      }

      if (kind === 'raw') {
        if (!confirmed || !previewRow || previewRow.status !== 'Ready') {
          setError('请勾选确认采样结构、采集参数，并使预览为就绪后再导入。');
          return;
        }
        const primary = picked[0];
        if (!primary) {
          setError('缺少 RAW 文件');
          return;
        }
        const existingRaw = useUiStore.getState().projectDocument;
        const rawResult = importRawWithTemplate({
          path: primary.name,
          dataByteLength: primary.size,
          sampleRateHz,
          centerFrequencyHz,
          templateId,
          confirmed: true,
          displayName: primary.name,
          mode: existingRaw ? 'append' : 'replace',
          project: existingRaw ?? undefined,
        });
        const rawSummary = summarizeLoadedProject({
          document: rawResult.project,
          version: 6,
        });
        const rawActive =
          rawSummary.files.find((f) => f.id === rawSummary.activeFileId) ?? rawSummary.files[0];
        useUiStore.setState({
          projectDocument: rawResult.project,
          projectSummary: rawSummary,
          projectError: null,
          projectSource: 'json',
          projectHasSample: false,
          statusFileLabel: rawActive?.name ?? rawSummary.name,
          statusChannelLabel: rawActive ? `${rawActive.channelCount} ch` : '—',
          detectSampleRange: {
            start: '0',
            end: rawActive?.sampleCount ?? '0',
          },
          detectSampleRangeSource: 'file',
        });
        const outcome = await openIqFromFiles(picked);
        if (!outcome.ok && outcome.reason !== 'cancelled') {
          setError(outcome.message);
          return;
        }
        setNote(
          `已确认导入 RAW：${rawResult.row.displayName}（样本 ${rawResult.row.sampleCount}，模板 ${templateId}）。工程树已更新。`,
        );
        close();
        return;
      }

      setError('请先选择可识别的信号文件。');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const tmpl: FormatTemplate | undefined = templates.find((t) => t.id === templateId);

  return (
    <div
      className="menubar-dialog-backdrop"
      data-testid="add-signal-dialog"
      data-native-qfiledialog="false"
      data-g20="browser-picker"
      data-add-signal="f-wire"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-signal-title"
    >
      <div className="menubar-dialog add-signal-dialog" style={{ width: 'min(640px, 94vw)' }}>
        <header className="menubar-dialog-header">
          <h2 id="add-signal-title" data-testid="add-signal-title">
            添加信号
          </h2>
          <button type="button" data-testid="add-signal-close" onClick={close} aria-label="关闭">
            ×
          </button>
        </header>
        <div className="menubar-dialog-body" data-testid="add-signal-body">
          <p className="muted" style={{ marginTop: 0 }}>
            浏览器文件选择器（非原生 QFileDialog）。解析预览接 F：listBuiltinFormatTemplates /
            previewSigmfImport / describeRawIqWithTemplate；SigMF 确认接 importSigmfStream。
          </p>

          <div className="add-signal-pick-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              data-testid="add-signal-pick"
              data-native-qfiledialog="false"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              选择文件…
            </button>
            <span data-testid="add-signal-path" className="muted">
              {pathLabel || '未选择文件'}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            data-testid="add-signal-input"
            data-native-qfiledialog="false"
            accept=".sigmf-meta,.sigmf-data,.iq,.raw,.ci16,.bin,.dat,.wav,.json,application/json"
            onChange={(e) => void onFiles(e.target.files)}
          />

          {kind === 'raw' ? (
            <fieldset
              data-testid="add-signal-raw-fields"
              style={{ marginTop: 12, borderColor: '#2c3b4f' }}
            >
              <legend>RAW / 模板</legend>
              <label style={{ display: 'block', marginBottom: 6 }}>
                格式模板
                <select
                  data-testid="add-signal-template"
                  value={templateId}
                  onChange={(e) => onTemplateChange(e.target.value)}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.builtin ? '（内置）' : ''}
                    </option>
                  ))}
                </select>
              </label>
              {tmpl ? (
                <p className="muted" data-testid="add-signal-template-detail">
                  {tmpl.id} · encoding={String(tmpl.sampleFormat.componentEncoding)} · structure=
                  {String(tmpl.sampleFormat.structure)}
                </p>
              ) : null}
              <label style={{ display: 'inline-block', marginRight: 12 }}>
                采样率 Fs (Hz)
                <input
                  data-testid="add-signal-fs"
                  type="number"
                  value={sampleRateHz}
                  onChange={(e) => onFsChange(Number(e.target.value))}
                  style={{ display: 'block', width: 160 }}
                />
              </label>
              <label style={{ display: 'inline-block' }}>
                中心频率 Fc (Hz)
                <input
                  data-testid="add-signal-fc"
                  type="number"
                  value={centerFrequencyHz}
                  onChange={(e) => onFcChange(Number(e.target.value))}
                  style={{ display: 'block', width: 160 }}
                />
              </label>
              <label style={{ display: 'block', marginTop: 8 }}>
                <input
                  data-testid="add-signal-confirmed"
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => onToggleConfirmed(e.target.checked)}
                />{' '}
                确认采样结构、编码及采集参数
              </label>
            </fieldset>
          ) : null}

          {kind === 'sigmf' ? (
            <p className="muted" data-testid="add-signal-sigmf-hint" style={{ marginTop: 12 }}>
              SigMF：预览使用 previewSigmfImport；确认调用 importSigmfStream（enforceDemoPath=false，浏览器路径）。
            </p>
          ) : null}

          {previewRow ? (
            <table
              data-testid="add-signal-preview"
              style={{ width: '100%', marginTop: 12, fontSize: 12, borderCollapse: 'collapse' }}
            >
              <tbody>
                <tr>
                  <th align="left">名称</th>
                  <td>{previewRow.displayName}</td>
                </tr>
                <tr>
                  <th align="left">类型</th>
                  <td>{previewRow.formatKind}</td>
                </tr>
                <tr>
                  <th align="left">状态</th>
                  <td data-testid="add-signal-preview-status">{statusLabel(previewRow.status)}</td>
                </tr>
                <tr>
                  <th align="left">Fs</th>
                  <td>{previewRow.sampleRateHz ?? '—'}</td>
                </tr>
                <tr>
                  <th align="left">Fc</th>
                  <td>{previewRow.centerFrequencyHz ?? '—'}</td>
                </tr>
                <tr>
                  <th align="left">样本数</th>
                  <td>{previewRow.sampleCount ?? '—'}</td>
                </tr>
                <tr>
                  <th align="left">datatype</th>
                  <td>{previewRow.datatype ?? '—'}</td>
                </tr>
                <tr>
                  <th align="left">来源</th>
                  <td>{previewRow.provenance || '—'}</td>
                </tr>
                {previewRow.warnings ? (
                  <tr>
                    <th align="left">警告</th>
                    <td>{previewRow.warnings}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          ) : null}

          {suggestions && suggestions.error === '' && kind !== 'idle' ? (
            <p className="muted" data-testid="add-signal-suggestions" style={{ marginTop: 8 }}>
              文件名提示：Fs={suggestions.sampleRateHz ?? '—'} Fc={suggestions.centerFrequencyHz ?? '—'}{' '}
              BW={suggestions.bandwidthHz ?? '—'}
            </p>
          ) : null}

          {error ? (
            <p data-testid="add-signal-error" style={{ color: '#f07178', marginTop: 8 }}>
              {error}
            </p>
          ) : null}
          {note ? (
            <p data-testid="add-signal-note" className="muted" style={{ marginTop: 8 }}>
              {note}
            </p>
          ) : null}
        </div>
        <div className="menubar-dialog-actions">
          <button type="button" data-testid="add-signal-cancel" onClick={close} disabled={busy}>
            取消
          </button>
          <button
            type="button"
            data-testid="add-signal-confirm"
            disabled={
              busy ||
              !previewRow ||
              (kind === 'sigmf' && previewRow.status !== 'Ready') ||
              (kind === 'raw' && (!confirmed || previewRow.status !== 'Ready'))
            }
            onClick={() => void onConfirm()}
          >
            确认添加
          </button>
        </div>
      </div>
    </div>
  );
}
