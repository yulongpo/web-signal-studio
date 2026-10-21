/**
 * Bot-B left project tree — G19 EngineeringTreeNode from @wss/project-io.
 * CN tree chrome vs desktop 17471a6 presentation (icons / sections / unread / tooltips).
 * Data model stays F-owned; this file only presents.
 */
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  engineeringTreeFromSession,
  engineeringTreeFromSummary,
  listMarkNodes,
  ANNOTATION_SOURCE_TREE_COLORS,
  type EngineeringTreeNode,
} from '@wss/project-io';
import { asProjectSessionHook, useUiStore } from '../store/uiStore';
import { SOURCE_KIND_CN } from './annotationTableMatrix';

/** Desktop relationText (project_tree_presentation.h) — display overlay only. */
const CN_RELATION: Record<string, string> = {
  Current: '来源当前',
  Changed: '来源已修改；保留创建快照',
  Missing: '来源已删除或缺失',
  Rejected: '来源质量：已忽略',
  Unconfirmed: '旧版段确认记录；保留创建快照',
  LegacyNeedsReview: '旧版来源待复核',
  'source current': '来源当前',
  'source changed; keep create snapshot': '来源已修改；保留创建快照',
  'source deleted or missing': '来源已删除或缺失',
  'source quality: ignored': '来源质量：已忽略',
  'legacy segment confirm; keep create snapshot': '旧版段确认记录；保留创建快照',
  'legacy source needs review': '旧版来源待复核',
};

/** Desktop channelBadges / file badges → Chinese chips. */
const CN_BADGE: Record<string, string> = {
  unread: '未读',
  diff: '差异',
  missing: '缺失',
  ignored: '已忽略',
  review: '复核',
  legacy: '旧版',
  pending: '待确认',
  invalid: '无效',
  loading: '读取中',
  partial: '未完整',
  failed: '失败',
};

/** Section / folder TitleRole chrome (desktop Chinese headers). */
const CN_SECTION: Record<string, string> = {
  Marks: '标注',
  Channels: '通道',
  'Detection runs': '检测运行',
  'IQ Files': 'IQ 文件',
  'Demo Project': '演示工程',
};

const GROUP_KINDS = new Set([
  'project',
  'folder',
  'marks',
  'annotationSource',
  'channels',
  'detectionRuns',
]);

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

function presentTitle(node: EngineeringTreeNode): string {
  const raw = (node.title || node.label || '').trim();
  return CN_SECTION[raw] ?? raw;
}

function presentBadge(code: string): string {
  return CN_BADGE[code] ?? CN_BADGE[code.toLowerCase()] ?? code;
}

function presentTooltip(node: EngineeringTreeNode): string {
  const title = presentTitle(node);
  const parts: string[] = [];
  const tip = node.tooltip?.trim();
  const src = node.sourceTooltip?.trim();
  if (tip) {
    // Rewrite known English relation lines inside tooltip.
    let rewritten = tip;
    for (const [en, cn] of Object.entries(CN_RELATION)) {
      if (rewritten.includes(en)) rewritten = rewritten.split(en).join(cn);
    }
    parts.push(rewritten);
  } else {
    parts.push(title);
    if (node.detail) parts.push(node.detail);
    if (src) parts.push(CN_RELATION[src] ?? src);
  }
  if (node.badges?.includes('unread') && !parts.some((p) => p.includes('未读'))) {
    parts.push('来源未读入');
  }
  return parts.filter(Boolean).join('\n');
}

function kindGlyph(kind: string, expanded: boolean): string {
  if (kind === 'folder' || kind === 'marks' || kind === 'channels' || kind === 'detectionRuns') {
    return expanded ? '▾' : '▸';
  }
  if (kind === 'project') return '◈';
  if (kind === 'annotationSource') return expanded ? '▾' : '▸';
  if (kind === 'file') return '▣';
  if (kind === 'channel') return '◇';
  if (kind === 'mark') return '';
  return '·';
}

function TreeNodeView({
  node,
  depth,
  onSelectMark,
  onSoftDeleteMark,
}: {
  node: EngineeringTreeNode;
  depth: number;
  onSelectMark: (markId: string, opts?: { additive?: boolean }) => void;
  onSoftDeleteMark: (markId: string, deleted: boolean) => void;
}) {
  const isMark = node.kind === 'mark' && Boolean(node.markId);
  const isGroup = GROUP_KINDS.has(node.kind);
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const [expanded, setExpanded] = useState(true);
  const color =
    node.color ??
    (node.sourceKind ? ANNOTATION_SOURCE_TREE_COLORS[node.sourceKind] : undefined);
  const title = presentTitle(node);
  const tooltip = presentTooltip(node);
  const glyph = kindGlyph(node.kind, expanded);

  const rowClass = [
    'tree-row',
    node.softDeleted ? 'tree-row-soft-deleted' : '',
    node.selected ? 'tree-row-selected' : '',
    node.active ? 'tree-row-active' : '',
    isGroup ? 'tree-row-group' : '',
    node.kind === 'file' || node.kind === 'channel' ? 'tree-row-twoline' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li
      data-testid={`tree-node-${node.id}`}
      data-tree-kind={node.kind}
      data-mark-id={node.markId}
      data-soft-deleted={node.softDeleted ? 'true' : 'false'}
      data-active={node.active ? 'true' : 'false'}
      data-selected={node.selected ? 'true' : 'false'}
      data-tree-title={title}
      data-has-tooltip={tooltip ? 'true' : 'false'}
      data-unread={node.badges?.includes('unread') ? 'true' : 'false'}
      data-expanded={hasChildren ? (expanded ? 'true' : 'false') : undefined}
    >
      <div className={rowClass} style={{ paddingLeft: 6 + depth * 14 }}>
        {node.active || (isMark && node.selected) ? (
          <span className="tree-active-bar" aria-hidden />
        ) : (
          <span className="tree-active-bar tree-active-bar-spacer" aria-hidden />
        )}
        {isMark ? (
          <span
            className={`tree-mark-check${node.selected ? ' tree-mark-check-on' : ''}`}
            data-testid={`tree-mark-check-${node.markId}`}
            aria-hidden
          />
        ) : (
          <button
            type="button"
            className="tree-glyph-btn"
            data-testid={`tree-glyph-${node.id}`}
            aria-label={hasChildren ? (expanded ? '折叠' : '展开') : title}
            disabled={!hasChildren}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) setExpanded((v) => !v);
            }}
          >
            <span
              className={`tree-glyph tree-glyph-${node.kind}`}
              style={color && !isGroup ? { color } : undefined}
            >
              {glyph || '·'}
            </span>
          </button>
        )}
        <span
          className={`tree-kind tree-kind-${node.kind}`}
          style={color ? { background: color } : undefined}
          aria-hidden
        />
        <button
          type="button"
          className="tree-label-btn"
          data-testid={isMark ? `tree-mark-${node.markId}` : `tree-label-${node.id}`}
          onClick={(e: MouseEvent<HTMLButtonElement>) => {
            if (isMark && node.markId) {
              onSelectMark(node.markId, {
                additive: e.metaKey || e.ctrlKey || e.shiftKey,
              });
              return;
            }
            if (hasChildren) setExpanded((v) => !v);
          }}
          title={tooltip}
        >
          <span className="tree-row-main">
            <span className="tree-label-line">
              <span className={`tree-label${node.active ? ' tree-label-active' : ''}`}>
                {title}
              </span>
              {node.count != null ? (
                <span className="tree-count" data-testid={`tree-count-${node.id}`}>
                  {node.count}
                </span>
              ) : null}
              {node.sourceKind ? (
                <span
                  className="tree-source-kind"
                  data-testid={`tree-source-${node.id}`}
                  data-source-kind={node.sourceKind}
                  data-source-cn={
                    SOURCE_KIND_CN[node.sourceKind as keyof typeof SOURCE_KIND_CN] ?? node.sourceKind
                  }
                >
                  {SOURCE_KIND_CN[node.sourceKind as keyof typeof SOURCE_KIND_CN] ?? node.sourceKind}
                </span>
              ) : null}
            </span>
            {node.detail || (node.badges && node.badges.length > 0) ? (
              <span className="tree-detail-line">
                {node.detail ? (
                  <span className="tree-detail" data-testid={`tree-detail-${node.id}`}>
                    {node.detail}
                  </span>
                ) : (
                  <span className="tree-detail tree-detail-empty" />
                )}
                {node.badges?.map((b) => (
                  <span
                    key={b}
                    className={`tree-badge-chip${b === 'unread' ? ' tree-badge-unread' : ''}`}
                    data-badge={b}
                    data-badge-cn={presentBadge(b)}
                    data-testid={`tree-badge-${node.id}-${b}`}
                  >
                    {presentBadge(b)}
                  </span>
                ))}
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
      {hasChildren && expanded ? (
        <ul className="tree-children">
          {node.children!.map((child) => (
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
    title: 'Demo Project',
    kind: 'project',
    count: 2,
    children: [
      {
        id: 'folder-iq',
        label: 'IQ Files',
        title: 'IQ Files',
        kind: 'folder',
        children: [
          {
            id: 'file-1',
            label: 'demo_wideband.iq',
            title: 'demo_wideband.iq',
            kind: 'file',
            detail: 'Fc 1.2 GHz · Fs 100 M S/s',
            tooltip: 'demo_wideband.iq\n演示宽带样例',
          },
          {
            id: 'file-2',
            label: 'demo_narrow.sigmf',
            title: 'demo_narrow.sigmf',
            kind: 'file',
            detail: 'Fc 915 MHz · Fs 2 M S/s',
            badges: ['unread'],
            tooltip: 'demo_narrow.sigmf\n来源未读入',
          },
        ],
      },
      {
        id: 'folder-channels',
        label: 'Channels',
        title: 'Channels',
        kind: 'channels',
        count: 1,
        children: [
          {
            id: 'ch-1',
            label: 'NB-1',
            title: 'NB-1',
            kind: 'channel',
            detail: 'Fc 915 M · BW 200 k',
            badges: ['diff'],
            sourceTooltip: 'source changed; keep create snapshot',
            tooltip: 'NB-1\nsource changed; keep create snapshot',
          },
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

  const onSelectMark = (markId: string, opts?: { additive?: boolean }) => {
    const hook = m06();
    if (!hook) {
      appendShellLog('标记选择需要 M-06 hook（未安装）');
      return;
    }
    const snap = hook.getState?.();
    const prev = snap?.selectedMarkIds ?? [];
    let next: string[];
    if (opts?.additive) {
      next = prev.includes(markId) ? prev.filter((id) => id !== markId) : [...prev, markId];
      if (next.length === 0) next = [markId];
    } else {
      next = [markId];
    }
    hook.setSelection({ activeMarkId: markId, selectedMarkIds: next });
    appendShellLog(
      opts?.additive ? `多选标记 ${next.join(',')}` : `选中标记 ${markId}`,
    );
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
    <aside className="panel project-tree" data-testid="project-tree" data-cn-chrome="true">
      <header className="panel-header">
        <h2>工程树</h2>
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
                  保存
                </button>
              ) : null}
              <button
                type="button"
                data-testid="btn-clear-project"
                className="btn-ghost"
                onClick={() => sessionHook().clearProject()}
              >
                清除
              </button>
            </>
          ) : (
            <button
              type="button"
              data-testid="btn-load-sample"
              className="btn-ghost"
              onClick={loadSampleProject}
            >
              样例
            </button>
          )}
        </div>
      </header>
      <div className="panel-body">
        {!showSample && !showLoaded ? (
          <div className="empty-state" data-testid="project-tree-empty">
            <p>尚未打开工程。</p>
            <p className="muted">加载样例树，或打开原生工程 JSON（IQ 仅 sigmf_data_demo）。</p>
            <div className="project-io-actions">
              <button
                type="button"
                data-testid="btn-open-project-file"
                className="btn-ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                打开文件…
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
                placeholder="粘贴工程 JSON…"
                rows={4}
              />
              <button
                type="button"
                data-testid="btn-open-project-paste"
                className="btn-ghost"
                onClick={onPasteOpen}
              >
                打开粘贴的 JSON
              </button>
            </div>
          </div>
        ) : (
          <>
            {showLoaded && projectSummary ? (
              <div className="project-summary" data-testid="project-summary">
                <p>
                  <strong>{projectSummary.name}</strong> · v{projectSummary.version} ·{' '}
                  {projectSummary.fileCount} 个文件 ·{' '}
                  {projectSummary.files.reduce((n, f) => n + f.channelCount, 0)} 通道
                </p>
                <p className="muted" data-testid="project-tree-mark-count">
                  树中标记: {markNodes.length}
                </p>
              </div>
            ) : null}
            <ul
              className="tree-root"
              data-testid={showLoaded ? 'project-tree-loaded' : 'project-tree-sample'}
              data-engineering="true"
              data-presentation="desktop-cn-chrome"
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
