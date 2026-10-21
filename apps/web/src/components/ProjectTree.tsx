/**
 * PROVISIONAL — Bot-B left project tree panel.
 * Open/save via Bot-F ProjectSessionHookApi (asProjectSessionHook → @wss/project-io).
 * Sample tree remains fallback.
 */
import { useRef } from 'react';
import { asProjectSessionHook, useUiStore } from '../store/uiStore';
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

function summaryToTree(
  name: string,
  files: Array<{ id: string; name: string; channelCount: number; sampleCount: string }>,
): ProjectTreeNode[] {
  return [
    {
      id: 'proj-loaded',
      label: name,
      kind: 'project',
      children: [
        {
          id: 'folder-files',
          label: 'IQ Files',
          kind: 'folder',
          children: files.map((f) => ({
            id: f.id,
            label: `${f.name} (${f.sampleCount} samples)`,
            kind: 'file' as const,
          })),
        },
      ],
    },
  ];
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Bot-F session surface — always read latest store state at action time. */
function sessionHook() {
  return asProjectSessionHook(useUiStore.getState());
}

export function ProjectTree() {
  const hasSample = useUiStore((s) => s.projectHasSample);
  const projectSource = useUiStore((s) => s.projectSource);
  const projectSummary = useUiStore((s) => s.projectSummary);
  const projectError = useUiStore((s) => s.projectError);
  const loadSampleProject = useUiStore((s) => s.loadSampleProject);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  const onFilePicked = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      sessionHook().openProjectFromText(text);
    };
    reader.onerror = () => {
      sessionHook().openProjectFromText('{'); // force parse error path without crashing shell
    };
    reader.readAsText(file);
  };

  const onPasteOpen = () => {
    const text = pasteRef.current?.value ?? '';
    sessionHook().openProjectFromText(text);
  };

  const onSave = () => {
    const text = sessionHook().saveProjectJsonText();
    if (text == null) return;
    const name = projectSummary?.name?.replace(/[^\w.-]+/g, '_') || 'project';
    downloadText(`${name}.json`, text);
  };

  const showSample = projectSource === 'sample' && hasSample;
  const showLoaded = projectSource === 'json' && projectSummary != null;
  const tree = showLoaded
    ? summaryToTree(projectSummary!.name, projectSummary!.files)
    : SAMPLE_TREE;

  return (
    <aside className="panel project-tree" data-testid="project-tree">
      <header className="panel-header">
        <h2>Project</h2>
        <div className="panel-header-actions">
          {showSample || showLoaded ? (
            <>
              {showLoaded ? (
                <button
                  type="button"
                  data-testid="btn-save-project"
                  className="btn-ghost"
                  onClick={onSave}
                >
                  Save
                </button>
              ) : null}
              <button
                type="button"
                data-testid="btn-clear-project"
                className="btn-ghost"
                onClick={() => sessionHook().clearProject()}
              >
                Clear
              </button>
            </>
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
        {!showSample && !showLoaded ? (
          <div className="empty-state" data-testid="project-tree-empty">
            <p>No project open.</p>
            <p className="muted">Load a sample tree stub or open native project JSON.</p>
            <div className="project-io-actions">
              <button
                type="button"
                data-testid="btn-open-project-file"
                className="btn-ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                Open file…
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                hidden
                data-testid="input-project-file"
                onChange={(e) => {
                  onFilePicked(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <textarea
                ref={pasteRef}
                className="project-paste"
                data-testid="input-project-paste"
                placeholder="Paste project JSON…"
                rows={4}
              />
              <button
                type="button"
                data-testid="btn-open-project-paste"
                className="btn-ghost"
                onClick={onPasteOpen}
              >
                Open pasted JSON
              </button>
            </div>
          </div>
        ) : (
          <>
            {showLoaded && projectSummary ? (
              <div className="project-summary" data-testid="project-summary">
                <p>
                  <strong>{projectSummary.name}</strong> · v{projectSummary.version} ·{' '}
                  {projectSummary.fileCount} file(s)
                </p>
              </div>
            ) : null}
            <ul
              className="tree-root"
              data-testid={showLoaded ? 'project-tree-loaded' : 'project-tree-sample'}
            >
              {tree.map((n) => (
                <TreeNodeView key={n.id} node={n} depth={0} />
              ))}
            </ul>
          </>
        )}
        {projectError ? (
          <p className="project-error" data-testid="project-error" role="alert">
            {projectError}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
