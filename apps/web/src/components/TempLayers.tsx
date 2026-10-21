/**
 * PROVISIONAL — Bot-B temporary settings layers (level / display).
 * One at a time; Esc reverts+closes; outside click closes; Enter/Tab commit legal draft.
 */
import { useEffect, useRef } from 'react';
import { useUiStore } from '../store/uiStore';

export function TempLayers() {
  const openTempLayer = useUiStore((s) => s.openTempLayer);
  const levelDraft = useUiStore((s) => s.levelDraft);
  const displayDraft = useUiStore((s) => s.displayDraft);
  const closeTempLayer = useUiStore((s) => s.closeTempLayer);
  const updateLevelDraft = useUiStore((s) => s.updateLevelDraft);
  const updateDisplayDraft = useUiStore((s) => s.updateDisplayDraft);
  const commitLevelDraft = useUiStore((s) => s.commitLevelDraft);
  const commitDisplayDraft = useUiStore((s) => s.commitDisplayDraft);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openTempLayer) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeTempLayer({ revertDraft: true });
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (openTempLayer === 'level') commitLevelDraft();
        if (openTempLayer === 'display') commitDisplayDraft();
      }
    };

    const onPointer = (e: MouseEvent) => {
      const el = panelRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        // Outside click closes without committing (same as Esc for drafts).
        closeTempLayer({ revertDraft: true });
      }
    };

    window.addEventListener('keydown', onKey);
    // Defer so the opening click does not immediately close.
    const t = window.setTimeout(() => {
      window.addEventListener('mousedown', onPointer);
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer);
    };
  }, [
    openTempLayer,
    closeTempLayer,
    commitLevelDraft,
    commitDisplayDraft,
  ]);

  if (!openTempLayer || openTempLayer === 'spectral') return null;

  if (openTempLayer === 'level' && levelDraft) {
    return (
      <div className="temp-layer-host" role="presentation">
        <div
          ref={panelRef}
          className="temp-layer-panel"
          data-testid="temp-layer-level"
          role="dialog"
          aria-label="Level settings"
        >
          <header className="temp-layer-header">
            <strong>Level</strong>
            <button
              type="button"
              className="btn-ghost"
              data-testid="temp-layer-close"
              onClick={() => closeTempLayer({ revertDraft: true })}
            >
              Esc
            </button>
          </header>
          <label className="temp-field">
            <span data-testid="level-ref-summary">
              参考 {levelDraft.refLevelDb.toFixed(2)} dB
            </span>
            <input
              type="number"
              data-testid="level-ref"
              value={levelDraft.refLevelDb}
              onChange={(e) =>
                updateLevelDraft({ refLevelDb: Number(e.target.value) })
              }
              onWheel={(event) => event.currentTarget.blur()}
            />
          </label>
          <label className="temp-field">
            <span data-testid="level-range-summary">
              动态 {levelDraft.dynamicRangeDb.toFixed(2)} dB
            </span>
            <input
              type="number"
              data-testid="level-range"
              value={levelDraft.dynamicRangeDb}
              onChange={(e) =>
                updateLevelDraft({ dynamicRangeDb: Number(e.target.value) })
              }
              onWheel={(event) => event.currentTarget.blur()}
            />
          </label>
          <label className="temp-field temp-field-check">
            <input
              type="checkbox"
              data-testid="level-auto"
              checked={levelDraft.autoAdapt}
              onChange={(e) => updateLevelDraft({ autoAdapt: e.target.checked })}
            />
            <span>Auto adapt</span>
          </label>
          <div className="temp-layer-actions">
            <button
              type="button"
              data-testid="level-apply"
              onClick={() => commitLevelDraft()}
            >
              Apply (Enter)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (openTempLayer === 'display' && displayDraft) {
    return (
      <div className="temp-layer-host" role="presentation">
        <div
          ref={panelRef}
          className="temp-layer-panel"
          data-testid="temp-layer-display"
          role="dialog"
          aria-label="Display settings"
        >
          <header className="temp-layer-header">
            <strong>Display</strong>
            <button
              type="button"
              className="btn-ghost"
              data-testid="temp-layer-close"
              onClick={() => closeTempLayer({ revertDraft: true })}
            >
              Esc
            </button>
          </header>
          <label className="temp-field">
            <span>Frequency mode</span>
            <select
              data-testid="display-freq-mode"
              value={displayDraft.freqMode}
              onChange={(e) =>
                updateDisplayDraft({
                  freqMode: e.target.value as 'rf' | 'baseband',
                })
              }
            >
              <option value="rf">RF</option>
              <option value="baseband">Baseband</option>
            </select>
          </label>
          <label className="temp-field temp-field-check">
            <input
              type="checkbox"
              data-testid="display-grid"
              checked={displayDraft.showGrid}
              onChange={(e) => updateDisplayDraft({ showGrid: e.target.checked })}
            />
            <span>Show grid</span>
          </label>
          <label className="temp-field temp-field-check">
            <input
              type="checkbox"
              data-testid="display-colorscale"
              checked={displayDraft.showColorScale}
              onChange={(e) =>
                updateDisplayDraft({ showColorScale: e.target.checked })
              }
            />
            <span>Color scale</span>
          </label>
          <div className="temp-layer-actions">
            <button
              type="button"
              data-testid="display-apply"
              onClick={() => commitDisplayDraft()}
            >
              Apply (Enter)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
