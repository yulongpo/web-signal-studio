/**
 * PROVISIONAL — Bot-B left project tree panel.
 */
import { useUiStore } from '../store/uiStore';
import type { ProjectTreeNode } from '../types/provisional';

const SAMPLE_TREE: ProjectTreeNode[] = [
  {
    id: 'proj-1',
    label: 'Demo Project',
    kind: 'project',
    children: [
      {
        id: 'folder-iq',
        label: 'IQ Files',
        kind: 'folder',
        children: [
          { id: 'file-1', label: 'demo_wideband.iq', kind: 'file' },
          { id: 'file-2', label: 'demo_narrow.sigmf', kind: 'file' },
        ],
      },
      {
        id: 'folder-ch',
        label: 'Channels',
        kind: 'folder',
        children: [
          { id: 'ch-0', label: 'CH0 · wideband', kind: 'channel' },
          { id: 'ch-1', label: 'CH1 · DDC stub', kind: 'channel' },
        ],
      },
    ],
  },
];

function TreeNodeView({ node, depth }: { node: ProjectTreeNode; depth: number }) {
  return (
    <li data-testid={`tree-node-${node.id}`}>
      <div className="tree-row" style={{ paddingLeft: 8 + depth * 12 }}>
        <span className={`tree-kind tree-kind-${node.kind}`} aria-hidden />
        <span className="tree-label">{node.label}</span>
      </div>
      {node.children && node.children.length > 0 ? (
        <ul className="tree-children">
          {node.children.map((child) => (
            <TreeNodeView key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ProjectTree() {
  const hasSample = useUiStore((s) => s.projectHasSample);
  const loadSampleProject = useUiStore((s) => s.loadSampleProject);
  const clearProject = useUiStore((s) => s.clearProject);

  return (
    <aside className="panel project-tree" data-testid="project-tree">
      <header className="panel-header">
        <h2>Project</h2>
        <div className="panel-header-actions">
          {hasSample ? (
            <button
              type="button"
              data-testid="btn-clear-project"
              className="btn-ghost"
              onClick={clearProject}
            >
              Clear
            </button>
          ) : (
            <button
              type="button"
              data-testid="btn-load-sample"
              className="btn-ghost"
              onClick={loadSampleProject}
            >
              Sample
            </button>
          )}
        </div>
      </header>
      <div className="panel-body">
        {!hasSample ? (
          <div className="empty-state" data-testid="project-tree-empty">
            <p>No project open.</p>
            <p className="muted">Load a sample tree stub or import IQ later (Bot-D).</p>
          </div>
        ) : (
          <ul className="tree-root" data-testid="project-tree-sample">
            {SAMPLE_TREE.map((n) => (
              <TreeNodeView key={n.id} node={n} depth={0} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}