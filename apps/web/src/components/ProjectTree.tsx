/**
 * Bot-B left project tree — G19 EngineeringTreeNode from @wss/project-io.
 * Three-source marks via engineeringTreeFromSession + listMarkNodes.
 * Mark select / soft-delete through window.__wssM06 (Bot-F M06 session).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  engineeringTreeFromSession,
  engineeringTreeFromSummary,
  listMarkNodes,
  ANNOTATION_SOURCE_TREE_COLORS,
  type EngineeringTreeNode,
} from '@wss/project-io';
import { asProjectSessionHook, useUiStore } from '../store/uiStore';

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sessionHook() {
  return asProjectSessionHook(useUiStore.getState());
}

function m06() {
  return typeof window !== 'undefined' ? window.__wssM06 : undefined;
}

function TreeNodeView({
  node,
  depth,
  onSelectMark,
  onSoftDeleteMark,
}: {
  node: EngineeringTreeNode;
  depth: number;
  onSelectMark: (markId: string) => void;
  onSoftDeleteMark: (markId: string, deleted: boolean) => void;
}) {
  const isMark = node.kind === 'mark' && Boolean(node.markId);
  const color =
    node.color ??
    (node.sourceKind ? ANNOTATION_SOURCE_TREE_COLORS[node.sourceKind] : undefined);

  return (
    <li
      data-testid={`tree-node-${node.id}`}
      data-tree-kind={node.kind}
      data-mark-id={node.markId}
      data-soft-deleted={node.softDeleted ? 'true' : 'false'}
      data-active={node.active ? 'true' : 'false'}
      data-selected={node.selected ? 'true' : 'false'}
      data-tree-title={node.title || node.label}
      data-has-tooltip={node.tooltip || node.sourceTooltip ? 'true' : 'false'}
      data-unread={node.badges?.includes('unread') ? 'true' : 'false'}
    >
      <div
        className={`tree-row${node.softDeleted ? ' tree-row-soft-deleted' : ''}${
          node.selected || node.active ? ' tree-row-selected' : ''
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        <span
          className={`tree-kind tree-kind-${node.kind}`}
          style={color ? { background: color } : undefined}
          aria-hidden
        />
        <button
          type="button"
          className="tree-label-btn"
          data-testid={isMark ? `tree-mark-${node.markId}` : `tree-label-${node.id}`}
          onClick={() => {
            if (isMark && node.markId) onSelectMark(node.markId);
          }}
          title={node.tooltip || node.sourceTooltip || node.detail || node.title || node.label}
        >
          <span className="tree-row-main">
            <span className="tree-label-line">
              <span className="tree-label">{node.title || node.label}</span>
              {node.count != null ? (
                <span className="tree-count" data-testid={`tree-count-${node.id}`}>
                  {node.count}
                </span>
              ) : null}
              {node.sourceKind ? (
                <span className="tree-source-kind" data-testid={`tree-source-${node.id}`}>
                  {node.sourceKind}
                </span>
              ) : null}
              {node.badges?.map((b) => (
                <span key={b} className={`tree-badge-chip${b === 'unread' ? ' tree-badge-unread' : ''}`} data-badge={b} data-testid={`tree-badge-${node.id}-${b}`}>
                  {b}
                </span>
              ))}
            </span>
            {node.detail ? (
              <span className="tree-detail" data-testid={`tree-detail-${node.id}`}>
                {node.detail}
              </span>
            ) : null}
          </span>
        </button>
        {isMark && node.markId ? (
          <button
            type="button"
            className="tree-mark-action"
            data-testid={`tree-mark-soft-delete-${node.markId}`}
            title={node.softDeleted ? '恢复标记（软删除撤销）' : '软删除标记'}
            onClick={(e) => {
              e.stopPropagation();
              onSoftDeleteMark(node.markId!, !node.softDeleted);
            }}
          >
            {node.softDeleted ? '恢复' : '删除'}
          </button>
        ) : null}
      </div>
      {node.children && node.children.length > 0 ? (
        <ul className="tree-children">
          {node.children.map((child) => (
            <TreeNodeView
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelectMark={onSelectMark}
              onSoftDeleteMark={onSoftDeleteMark}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

const SAMPLE_FALLBACK: EngineeringTreeNode[] = [
  {
    id: 'proj-sample',
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
    ],
  },
];

export function ProjectTree() {
  const hasSample = useUiStore((s) => s.projectHasSample);
  const projectSource = useUiStore((s) => s.projectSource);
  const projectSummary = useUiStore((s) => s.projectSummary);
  const projectDocument = useUiStore((s) => s.projectDocument);
  const projectError = useUiStore((s) => s.projectError);
  const loadSampleProject = useUiStore((s) => s.loadSampleProject);
  const appendShellLog = useUiStore((s) => s.appendShellLog);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);
  const [m06Tick, setM06Tick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (m06()) setM06Tick((t) => t + 1);
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  void m06Tick;

  const tree: EngineeringTreeNode[] = useMemo(() => {
    const hook = m06();
    const snap = hook?.getState?.();
    const annotations = hook?.session?.annotations;
    if (projectDocument) {
      return engineeringTreeFromSession(projectDocument, {
        annotations,
        activeFileId: snap?.activeFileId,
        activeMarkId: snap?.activeMarkId,
        selectedMarkIds: snap?.selectedMarkIds,
        includeEmptySourceGroups: true,
      });
    }
    if (projectSource === 'sample' && projectSummary) {
      return engineeringTreeFromSummary(projectSummary);
    }
    if (projectSource === 'sample' && hasSample) return SAMPLE_FALLBACK;
    return [];
  }, [projectDocument, projectSummary, projectSource, hasSample, m06Tick]);

  const markNodes = useMemo(() => listMarkNodes(tree), [tree]);

  const onSelectMark = (markId: string) => {
    const hook = m06();
    if (!hook) {
      appendShellLog('标记选择需要 M-06 hook（未安装）');
      return;
    }
    hook.setSelection({ activeMarkId: markId, selectedMarkIds: [markId] });
    appendShellLog(`选中标记 ${markId}`);
    setM06Tick((t) => t + 1);
  };

  const onSoftDeleteMark = (markId: string, deleted: boolean) => {
    const hook = m06();
    if (!hook) {
      appendShellLog('软删除需要 M-06 hook（未安装）');
      return;
    }
    hook.session.setMarkDeleted(markId, deleted);
    appendShellLog(deleted ? `软删除标记 ${markId}` : `恢复标记 ${markId}`);
    setM06Tick((t) => t + 1);
  };

  const onFilePicked = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      sessionHook().openProjectFromText(text);
    };
    reader.onerror = () => {
      sessionHook().openProjectFromText('{');
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
  const hasTree = tree.length > 0;

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
                  {projectSummary.fileCount} file(s) ·{' '}
                  {projectSummary.files.reduce((n, f) => n + f.channelCount, 0)} ch
                </p>
                <p className="muted" data-testid="project-tree-mark-count">
                  marks in tree: {markNodes.length}
                </p>
              </div>
            ) : null}
            <ul
              className="tree-root"
              data-testid={showLoaded ? 'project-tree-loaded' : 'project-tree-sample'}
              data-engineering="true" data-presentation="desktop-compact"
            >
              {hasTree
                ? tree.map((n) => (
                    <TreeNodeView
                      key={n.id}
                      node={n}
                      depth={0}
                      onSelectMark={onSelectMark}
                      onSoftDeleteMark={onSoftDeleteMark}
                    />
                  ))
                : null}
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
