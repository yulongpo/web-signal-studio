/**
 * Browser-honest save parity for Qt QFileDialog::getSaveFileName.
 * Prefer showSaveFilePicker; fall back to <a download>. Never fakes a native dialog.
 * Wave16: optional dialogTitle + filterDescription for picker chrome labels only.
 */
export type BrowserSaveResult =
  | { ok: true; method: 'showSaveFilePicker' | 'download-anchor' }
  | { ok: false; reason: string };

export async function browserSaveFile(input: {
  suggestedName: string;
  mimeType: string;
  contents: string | Blob;
  /** Qt dialog title echo — status/UI only; not a native QFileDialog. */
  dialogTitle?: string;
  /** File-type filter label shown to the browser picker when supported. */
  filterDescription?: string;
}): Promise<BrowserSaveResult> {
  const blob =
    typeof input.contents === 'string'
      ? new Blob([input.contents], { type: input.mimeType })
      : input.contents;

  const ext = '.' + (input.suggestedName.split('.').pop() || 'bin');
  const filterDescription =
    input.filterDescription?.trim() || input.mimeType || 'File';

  const w = window as Window & {
    showSaveFilePicker?: (opts: {
      suggestedName?: string;
      types?: Array<{ description?: string; accept: Record<string, string[]> }>;
    }) => Promise<{
      createWritable: () => Promise<{
        write: (b: Blob) => Promise<void>;
        close: () => Promise<void>;
      }>;
    }>;
  };

  if (typeof w.showSaveFilePicker === 'function') {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: input.suggestedName,
        types: [
          {
            description: filterDescription,
            accept: {
              [input.mimeType]: [ext],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { ok: true, method: 'showSaveFilePicker' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/abort|cancel/i.test(msg)) {
        return { ok: false, reason: 'cancelled' };
      }
      // fall through to anchor download
    }
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = input.suggestedName;
    a.rel = 'noopener';
    a.click();
    URL.revokeObjectURL(url);
    return { ok: true, method: 'download-anchor' };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
