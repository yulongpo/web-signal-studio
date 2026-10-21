/**
 * PROVISIONAL - Bot-B bottom status bar.
 * Mirrors workspace, DSP source/engine, project summary, and file/channel labels.
 */
import { useUiStore } from '../store/uiStore';

export function StatusBar() {
  const activeTool = useUiStore((s) => s.activeTool);
  const cursor = useUiStore((s) => s.statusCursor);
  const fileLabel = useUiStore((s) => s.statusFileLabel);
  const channelLabel = useUiStore((s) => s.statusChannelLabel);
  const workspaceMode = useUiStore((s) => s.workspaceMode);
  const dspSource = useUiStore((s) => s.dspSource);
  const fftActive = useUiStore((s) => s.dspFftEngineActive);
  const projectSource = useUiStore((s) => s.projectSource);
  const projectSummary = useUiStore((s) => s.projectSummary);

  const projectLabel =
    projectSource === 'json' && projectSummary
      ? `${projectSummary.name} (${projectSummary.fileCount} file(s))`
      : projectSource === 'sample'
        ? 'sample'
        : '-';

  const fftLabel = fftActive
    ? fftActive.fellBackToJs
      ? `${fftActive.requested}→js`
      : fftActive.active
    : 'js';

  return (
    <footer className="status-bar" data-testid="status-bar">
      <span data-testid="status-workspace">{workspaceMode}</span>
      <span className="status-sep" />
      <span data-testid="status-tool">Tool: {activeTool}</span>
      <span className="status-sep" />
      <span data-testid="status-time">t: {cursor.timeLabel}</span>
      <span data-testid="status-freq">f: {cursor.freqLabel}</span>
      <span className="status-sep" />
      <span
        className="status-dsp"
        data-testid="status-dsp-source"
        data-dsp-source={dspSource}
      >
        dsp: {dspSource}
      </span>
      <span
        className="status-fft"
        data-testid="status-fft-engine"
        data-fft-requested={fftActive?.requested ?? 'js'}
        data-fft-active={fftActive?.active ?? 'js'}
        data-fft-fallback={fftActive?.fellBackToJs ? 'true' : 'false'}
      >
        fft: {fftLabel}
      </span>
      <span className="status-sep" />
      <span
        data-testid="status-project"
        data-project-source={projectSource}
      >
        project: {projectLabel}
      </span>
      <span className="status-spacer" />
      <span data-testid="status-file">{fileLabel}</span>
      <span className="status-sep" />
      <span data-testid="status-channel">{channelLabel}</span>
    </footer>
  );
}
