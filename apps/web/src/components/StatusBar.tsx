/**
 * PROVISIONAL — Bot-B bottom status bar.
 */
import { useUiStore } from '../store/uiStore';

export function StatusBar() {
  const activeTool = useUiStore((s) => s.activeTool);
  const cursor = useUiStore((s) => s.statusCursor);
  const fileLabel = useUiStore((s) => s.statusFileLabel);
  const channelLabel = useUiStore((s) => s.statusChannelLabel);
  const workspaceMode = useUiStore((s) => s.workspaceMode);

  return (
    <footer className="status-bar" data-testid="status-bar">
      <span data-testid="status-workspace">{workspaceMode}</span>
      <span className="status-sep" />
      <span data-testid="status-tool">Tool: {activeTool}</span>
      <span className="status-sep" />
      <span data-testid="status-time">t: {cursor.timeLabel}</span>
      <span data-testid="status-freq">f: {cursor.freqLabel}</span>
      <span className="status-spacer" />
      <span data-testid="status-file">{fileLabel}</span>
      <span className="status-sep" />
      <span data-testid="status-channel">{channelLabel}</span>
    </footer>
  );
}