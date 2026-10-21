/**
 * G19 AnnotationEvidenceWidget — Auxiliary 3-col chrome vs desktop 17471a6.
 * Facts from real originEvidence / annotation fields only; never invent scores.
 */
import { useMemo, useState } from 'react';
import type { AnnotationJson } from '@wss/contracts';

type FactKey =
  | 'method'
  | 'timeBasis'
  | 'uncertainty'
  | 'frequencyBasis'
  | 'currentRange'
  | 'originalRange'
  | 'observation'
  | 'mean'
  | 'maximum'
  | 'windows'
  | 'windowIds'
  | 'noise'
  | 'reason'
  | 'class'
  | 'format'
  | 'origin'
  | 'coordinates';

type FactDef = {
  key: FactKey;
  label: string;
  testId: string;
  from: (ev: Record<string, unknown> | null, ann: AnnotationJson) => string;
};

function str(v: unknown): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string' && v.trim() !== '') return v;
  if (Array.isArray(v)) {
    if (v.length === 0) return '—';
    return v.map((x) => str(x)).filter((x) => x !== '—').join(', ') || '—';
  }
  return '—';
}

function rangeFromAnn(ann: AnnotationJson, which: 'current' | 'original'): string {
  const ev = (ann.originEvidence ?? null) as Record<string, unknown> | null;
  if (which === 'original' && ev) {
    const o = str(ev.originalRange ?? ev.original_range);
    if (o !== '—') return o;
  }
  if (which === 'current' && ev) {
    const c = str(ev.currentRange ?? ev.current_range);
    if (c !== '—') return c;
  }
  const start = ann.start ?? ann.segments?.[0]?.start;
  const end = ann.end ?? ann.segments?.[0]?.end;
  const lo = ann.lowerHz ?? ann.segments?.[0]?.lowerHz;
  const hi = ann.upperHz ?? ann.segments?.[0]?.upperHz;
  const parts: string[] = [];
  if (start != null && end != null) parts.push(`${start}…${end}`);
  if (typeof lo === 'number' && typeof hi === 'number') {
    parts.push(`${(lo / 1e6).toPrecision(6)}–${(hi / 1e6).toPrecision(6)} MHz`);
  }
  return parts.length ? parts.join(' · ') : '—';
}

const FACTS: Record<FactKey, FactDef> = {
  method: {
    key: 'method',
    label: '原始精修',
    testId: 'annotation-evidence-method',
    from: (ev) => str(ev?.method ?? ev?.refineMethod ?? ev?.algorithm),
  },
  timeBasis: {
    key: 'timeBasis',
    label: '时间依据',
    testId: 'annotation-evidence-time-basis',
    from: (ev, ann) =>
      str(ev?.timeBasis ?? ev?.timeQuality ?? ann.observationTimeQuality),
  },
  uncertainty: {
    key: 'uncertainty',
    label: '不确定度',
    testId: 'annotation-evidence-uncertainty',
    from: (ev) => str(ev?.uncertainty ?? ev?.uncertaintySamples),
  },
  frequencyBasis: {
    key: 'frequencyBasis',
    label: '频率依据',
    testId: 'annotation-evidence-frequency',
    from: (ev, ann) =>
      str(
        ev?.frequencyBasis ??
          ev?.frequencyQuality ??
          ann.observationFrequencyFrame,
      ),
  },
  currentRange: {
    key: 'currentRange',
    label: '当前范围',
    testId: 'annotation-evidence-current-range',
    from: (_ev, ann) => rangeFromAnn(ann, 'current'),
  },
  originalRange: {
    key: 'originalRange',
    label: '原始范围',
    testId: 'annotation-evidence-original-range',
    from: (_ev, ann) => rangeFromAnn(ann, 'original'),
  },
  observation: {
    key: 'observation',
    label: '观察支持',
    testId: 'annotation-evidence-observation',
    from: (ev, ann) => {
      const o = str(ev?.observation ?? ev?.observationSupport);
      if (o !== '—') return o;
      if (ann.observation) {
        return `${ann.observation.start}…${ann.observation.end}`;
      }
      return '—';
    },
  },
  mean: {
    key: 'mean',
    label: 'mean',
    testId: 'annotation-evidence-mean',
    from: (ev) => str(ev?.scoreMean ?? ev?.mean ?? ev?.score_mean),
  },
  maximum: {
    key: 'maximum',
    label: 'max',
    testId: 'annotation-evidence-max',
    from: (ev) => str(ev?.scoreMax ?? ev?.maximum ?? ev?.score_max),
  },
  windows: {
    key: 'windows',
    label: '唯一窗口',
    testId: 'annotation-evidence-windows',
    from: (ev) => str(ev?.windows ?? ev?.uniqueWindows ?? ev?.windowCount),
  },
  windowIds: {
    key: 'windowIds',
    label: '窗口 IDs',
    testId: 'annotation-evidence-window-ids',
    from: (ev) => str(ev?.windowIds ?? ev?.window_ids),
  },
  noise: {
    key: 'noise',
    label: '噪底 / 轨迹',
    testId: 'annotation-evidence-noise',
    from: (ev) => str(ev?.noise ?? ev?.noiseFloor ?? ev?.trace),
  },
  reason: {
    key: 'reason',
    label: '回退 / 原因',
    testId: 'annotation-evidence-reason',
    from: (ev) => str(ev?.reason ?? ev?.fallbackReason ?? ev?.blockReason),
  },
  class: {
    key: 'class',
    label: '原始类别',
    testId: 'annotation-evidence-class',
    from: (ev, ann) => str(ev?.classLabel ?? ann.classLabel),
  },
  format: {
    key: 'format',
    label: 'formatId',
    testId: 'annotation-evidence-format',
    from: (ev) => str(ev?.formatId ?? ev?.format),
  },
  origin: {
    key: 'origin',
    label: 'originRef',
    testId: 'annotation-evidence-origin',
    from: (ev, ann) =>
      str(ev?.originRef ?? ev?.origin ?? ev?.sourceKind ?? ann.sourceKind),
  },
  coordinates: {
    key: 'coordinates',
    label: '坐标解释',
    testId: 'annotation-evidence-coordinates',
    from: (ev) =>
      str(ev?.coordinates ?? ev?.coordinateInterpretation ?? ev?.coordFrame),
  },
};

const TIME_KEYS: FactKey[] = ['method', 'timeBasis'];
const SCORE_KEYS: FactKey[] = ['mean', 'maximum', 'windows'];
const DIAG_KEYS: FactKey[] = ['noise', 'reason'];
const DETAIL_KEYS: FactKey[] = [
  'uncertainty',
  'frequencyBasis',
  'currentRange',
  'originalRange',
  'observation',
  'windowIds',
  'class',
  'format',
  'origin',
  'coordinates',
];

function FactRows({
  keys,
  ev,
  ann,
  emphasizeMean,
}: {
  keys: FactKey[];
  ev: Record<string, unknown> | null;
  ann: AnnotationJson;
  emphasizeMean?: boolean;
}) {
  return (
    <dl className="annotation-evidence-fact-rows">
      {keys.map((k) => {
        const def = FACTS[k];
        const value = def.from(ev, ann);
        return (
          <div
            key={k}
            className={
              emphasizeMean && k === 'mean'
                ? 'annotation-evidence-fact annotation-evidence-fact-metric'
                : 'annotation-evidence-fact'
            }
          >
            <dt>{def.label}</dt>
            <dd data-testid={def.testId} data-empty={value === '—' ? 'true' : 'false'}>
              {value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export type AnnotationEvidencePanelProps = {
  annotation: AnnotationJson | null;
  /** Qt Auxiliary = 3-col summary; Inspector = single list (legacy). Default auxiliary. */
  mode?: 'auxiliary' | 'inspector';
};

export function AnnotationEvidencePanel({
  annotation,
  mode = 'auxiliary',
}: AnnotationEvidencePanelProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const ev = useMemo(() => {
    if (!annotation?.originEvidence || typeof annotation.originEvidence !== 'object') {
      return null;
    }
    return annotation.originEvidence as Record<string, unknown>;
  }, [annotation]);

  const hasAny = useMemo(() => {
    if (!annotation) return false;
    return (Object.keys(FACTS) as FactKey[]).some(
      (k) => FACTS[k].from(ev, annotation) !== '—',
    );
  }, [annotation, ev]);

  const title = annotation
    ? annotation.name || annotation.id.slice(0, 12)
    : '未选择标注';

  return (
    <aside
      className="annotation-evidence-panel"
      data-testid="annotation-evidence-panel"
      data-qt-evidence="wave15"
      data-evidence-mode={mode}
      data-has-evidence={hasAny ? 'true' : 'false'}
    >
      <header className="annotation-evidence-title" data-testid="annotation-evidence-title">
        证据{mode === 'auxiliary' ? ' · 辅助三列' : ''}
      </header>

      {!annotation ? (
        <p className="muted" data-testid="annotation-evidence-empty">
          未选择标注；证据空闲（不伪造）
        </p>
      ) : mode === 'auxiliary' ? (
        <>
          <div
            className="annotation-auxiliary-evidence-summary"
            data-testid="annotation-auxiliary-evidence-summary"
            data-qt-auxiliary-cols="3"
          >
            <section
              className="annotation-auxiliary-col"
              data-testid="annotation-auxiliary-time-summary"
            >
              <h5 className="annotation-auxiliary-heading" data-testid="annotation-evidence-context">
                {title}
              </h5>
              <FactRows keys={TIME_KEYS} ev={ev} ann={annotation} />
              <p className="annotation-evidence-notice muted" data-testid="annotation-evidence-notice">
                {hasAny ? '仅显示已保存证据' : '暂无保存证据（originEvidence 空 / —）'}
              </p>
            </section>
            <section
              className="annotation-auxiliary-col"
              data-testid="annotation-auxiliary-score-summary"
            >
              <h5 className="annotation-auxiliary-heading">保存分数 / 唯一窗口</h5>
              <FactRows keys={SCORE_KEYS} ev={ev} ann={annotation} emphasizeMean />
            </section>
            <section
              className="annotation-auxiliary-col"
              data-testid="annotation-auxiliary-diagnostic-summary"
            >
              <h5 className="annotation-auxiliary-heading">噪底 / 轨迹 / 回退</h5>
              <FactRows keys={DIAG_KEYS} ev={ev} ann={annotation} />
              <p
                className="annotation-evidence-trace-stub muted"
                data-testid="annotation-evidence-trace-stub"
                data-blocked="true"
              >
                测量轨迹：—（无本地轨迹缓冲 · 不伪造）
              </p>
            </section>
          </div>
          <button
            type="button"
            className="annotation-evidence-details-toggle"
            data-testid="annotation-evidence-details-toggle"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((v) => !v)}
          >
            {detailsOpen ? '▼' : '▶'} 当前 / 原始 / 观察与来源详情
          </button>
          {detailsOpen ? (
            <div
              className="annotation-auxiliary-evidence-details"
              data-testid="annotation-auxiliary-evidence-details"
            >
              <FactRows keys={DETAIL_KEYS} ev={ev} ann={annotation} />
            </div>
          ) : null}
        </>
      ) : (
        <>
          {!hasAny ? (
            <p className="muted" data-testid="annotation-evidence-empty">
              暂无保存证据（originEvidence 空 / —）
            </p>
          ) : (
            <FactRows
              keys={[...TIME_KEYS, ...SCORE_KEYS, ...DIAG_KEYS, ...DETAIL_KEYS]}
              ev={ev}
              ann={annotation}
            />
          )}
        </>
      )}

      {ev && Object.keys(ev).length > 0 ? (
        <details className="annotation-evidence-raw" data-testid="annotation-evidence-raw">
          <summary>不可变原始字段</summary>
          <pre>{JSON.stringify(ev, null, 2)}</pre>
        </details>
      ) : null}
    </aside>
  );
}
