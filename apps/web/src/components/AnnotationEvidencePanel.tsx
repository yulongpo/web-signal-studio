/**
 * G19 AnnotationEvidenceWidget — Auxiliary 3-col + Inspector + MeasuredEvidenceTrace vs desktop 17471a6.
 * Facts / traces from real originEvidence only; never invent scores or fake envelopes.
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

const EMPTY = '\u2014';

function str(v: unknown): string {
  if (v == null || v === '') return EMPTY;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string' && v.trim() !== '') return v;
  if (Array.isArray(v)) {
    if (v.length === 0) return EMPTY;
    return v.map((x) => str(x)).filter((x) => x !== EMPTY).join(', ') || EMPTY;
  }
  return EMPTY;
}

function rangeFromAnn(ann: AnnotationJson, which: 'current' | 'original'): string {
  const ev = (ann.originEvidence ?? null) as Record<string, unknown> | null;
  if (which === 'original' && ev) {
    const o = str(ev.originalRange ?? ev.original_range);
    if (o !== EMPTY) return o;
  }
  if (which === 'current' && ev) {
    const c = str(ev.currentRange ?? ev.current_range);
    if (c !== EMPTY) return c;
  }
  const start = ann.start ?? ann.segments?.[0]?.start;
  const end = ann.end ?? ann.segments?.[0]?.end;
  const lo = ann.lowerHz ?? ann.segments?.[0]?.lowerHz;
  const hi = ann.upperHz ?? ann.segments?.[0]?.upperHz;
  const parts: string[] = [];
  if (start != null && end != null) parts.push(`${start}\u2013${end}`);
  if (typeof lo === 'number' && typeof hi === 'number') {
    parts.push(`${(lo / 1e6).toPrecision(6)}\u2013${(hi / 1e6).toPrecision(6)} MHz`);
  }
  return parts.length ? parts.join(' \u00b7 ') : EMPTY;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function resolveTimeAnalysis(
  ev: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!ev) return null;
  const direct = asRecord(ev.timeAnalysis);
  if (direct) return direct;
  const raw = ev.originalFieldsJson ?? ev.original_fields_json;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      const obj = asRecord(parsed);
      return obj ? asRecord(obj.timeAnalysis) ?? obj : null;
    } catch {
      return null;
    }
  }
  if (asRecord(raw)) {
    const obj = asRecord(raw)!;
    return asRecord(obj.timeAnalysis) ?? obj;
  }
  return null;
}

const FACTS: Record<FactKey, FactDef> = {
  method: {
    key: 'method',
    label: '\u539f\u59cb\u7cbe\u4fee',
    testId: 'annotation-evidence-method',
    from: (ev) => str(ev?.method ?? ev?.refineMethod ?? ev?.algorithm),
  },
  timeBasis: {
    key: 'timeBasis',
    label: '\u65f6\u95f4\u4f9d\u636e',
    testId: 'annotation-evidence-time-basis',
    from: (ev, ann) =>
      str(ev?.timeBasis ?? ev?.timeQuality ?? ann.observationTimeQuality),
  },
  uncertainty: {
    key: 'uncertainty',
    label: '\u4e0d\u786e\u5b9a\u5ea6',
    testId: 'annotation-evidence-uncertainty',
    from: (ev) => str(ev?.uncertainty ?? ev?.uncertaintySamples),
  },
  frequencyBasis: {
    key: 'frequencyBasis',
    label: '\u9891\u7387\u4f9d\u636e',
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
    label: '\u5f53\u524d\u8303\u56f4',
    testId: 'annotation-evidence-current-range',
    from: (_ev, ann) => rangeFromAnn(ann, 'current'),
  },
  originalRange: {
    key: 'originalRange',
    label: '\u539f\u59cb\u8303\u56f4',
    testId: 'annotation-evidence-original-range',
    from: (_ev, ann) => rangeFromAnn(ann, 'original'),
  },
  observation: {
    key: 'observation',
    label: '\u89c2\u5bdf\u652f\u6301',
    testId: 'annotation-evidence-observation',
    from: (ev, ann) => {
      const o = str(ev?.observation ?? ev?.observationSupport);
      if (o !== EMPTY) return o;
      if (ann.observation) {
        return `${ann.observation.start}\u2013${ann.observation.end}`;
      }
      return EMPTY;
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
    label: '\u552f\u4e00\u7a97\u53e3',
    testId: 'annotation-evidence-windows',
    from: (ev) => str(ev?.windows ?? ev?.uniqueWindows ?? ev?.windowCount),
  },
  windowIds: {
    key: 'windowIds',
    label: '\u7a97\u53e3 IDs',
    testId: 'annotation-evidence-window-ids',
    from: (ev) => str(ev?.windowIds ?? ev?.window_ids),
  },
  noise: {
    key: 'noise',
    label: '\u566a\u5e95 / \u8f68\u8ff9',
    testId: 'annotation-evidence-noise',
    from: (ev) => {
      const ta = resolveTimeAnalysis(ev);
      if (ta && typeof ta.noise === 'number' && Number.isFinite(ta.noise)) {
        const coarse = ta.coarseParametersApplied === true;
        return (
          (coarse ? '\u8c31\u5bc6\u5ea6\u566a\u5e95\uff08dB\uff09 ' : '\u5e26\u9650\u7ebf\u6027\u529f\u7387\u566a\u5e95 ') +
          String(ta.noise)
        );
      }
      return str(ev?.noise ?? ev?.noiseFloor);
    },
  },
  reason: {
    key: 'reason',
    label: '\u56de\u9000 / \u539f\u56e0',
    testId: 'annotation-evidence-reason',
    from: (ev) => str(ev?.reason ?? ev?.fallbackReason ?? ev?.blockReason),
  },
  class: {
    key: 'class',
    label: '\u539f\u59cb\u7c7b\u522b',
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
    label: '\u5750\u6807\u89e3\u91ca',
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
const INSPECTOR_KEYS: FactKey[] = [
  ...TIME_KEYS,
  'uncertainty',
  'frequencyBasis',
  'currentRange',
  'originalRange',
  'observation',
  ...SCORE_KEYS,
  'windowIds',
  ...DIAG_KEYS,
  'class',
  'format',
  'origin',
  'coordinates',
];

/** Qt MeasuredEvidenceTrace: only from saved timeAnalysis.trace; never invent. */
export type MeasuredTraceModel = {
  valid: boolean;
  points: Array<{ x: number; y: number }>;
  maximum: number;
  threshold: number;
  pointCount: number;
  kind: string | null;
  reason: string;
};

export function parseMeasuredTrace(
  ev: Record<string, unknown> | null,
): MeasuredTraceModel {
  const empty = (reason: string): MeasuredTraceModel => ({
    valid: false,
    points: [],
    maximum: 0,
    threshold: -1,
    pointCount: 0,
    kind: null,
    reason,
  });
  const timeEvidence = resolveTimeAnalysis(ev);
  if (!timeEvidence) return empty('no-timeAnalysis');
  const thresholdRaw = timeEvidence.comparisonThreshold;
  const threshold =
    typeof thresholdRaw === 'number' && Number.isFinite(thresholdRaw)
      ? thresholdRaw
      : -1;
  const trace = asRecord(timeEvidence.trace);
  if (!trace) return empty('no-trace');
  const kind = typeof trace.kind === 'string' ? trace.kind : null;
  const savedPoints = Array.isArray(trace.points) ? trace.points : null;
  if (!savedPoints || savedPoints.length < 2 || savedPoints.length > 512) {
    return empty('point-count');
  }
  if (kind !== 'measured-causal-mean-power-v1') {
    return empty('kind-mismatch');
  }
  const beginStr = String(trace.sourceOriginSample ?? '');
  const endStr = String(trace.sourceSupportEndSample ?? '');
  const begin = Number(beginStr);
  const end = Number(endStr);
  if (
    !Number.isFinite(begin) ||
    !Number.isFinite(end) ||
    begin >= end ||
    !/^\d+$/.test(beginStr) ||
    !/^\d+$/.test(endStr)
  ) {
    return empty('range-invalid');
  }
  const points: Array<{ x: number; y: number }> = [];
  let maximum = 0;
  let previous = begin;
  for (const item of savedPoints) {
    if (!Array.isArray(item) || item.length !== 2) return empty('pair-shape');
    const sampleStr = String(item[0] ?? '');
    const sample = Number(sampleStr);
    const power = typeof item[1] === 'number' ? item[1] : Number(item[1]);
    if (
      !/^\d+$/.test(sampleStr) ||
      !Number.isFinite(sample) ||
      sample < previous ||
      sample >= end ||
      !Number.isFinite(power) ||
      power < 0
    ) {
      return empty('point-invalid');
    }
    points.push({ x: (sample - begin) / (end - begin), y: power });
    maximum = Math.max(maximum, power);
    previous = sample;
  }
  const valid = points.length >= 2 && maximum > 0;
  return {
    valid,
    points: valid ? points : [],
    maximum: valid ? maximum : 0,
    threshold,
    pointCount: valid ? points.length : 0,
    kind,
    reason: valid ? 'ok' : 'max-nonpositive',
  };
}

function MeasuredEvidenceTrace({ model }: { model: MeasuredTraceModel }) {
  const w = 320;
  const h = 70;
  const area = { left: 2, top: 3, width: w - 4, height: h - 21 };
  const pathD =
    model.valid && model.points.length > 0
      ? model.points
          .map((p, i) => {
            const x = area.left + p.x * area.width;
            const y =
              area.top + area.height - (p.y / model.maximum) * area.height;
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
          })
          .join(' ')
      : '';
  const threshY =
    model.valid &&
    model.threshold >= 0 &&
    model.threshold <= model.maximum &&
    model.maximum > 0
      ? area.top + area.height - (model.threshold / model.maximum) * area.height
      : null;

  return (
    <div
      className="annotation-measured-evidence-trace"
      data-testid="annotation-measured-evidence-trace"
      data-object-name="annotationMeasuredEvidenceTrace"
      data-measured-trace={model.valid ? 'valid' : 'empty'}
      data-measured-point-count={String(model.pointCount)}
      data-measured-kind={model.kind ?? ''}
      data-measured-reason={model.reason}
      data-invented="false"
      hidden={!model.valid}
      style={{ height: 70 }}
    >
      {model.valid ? (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          width="100%"
          height={70}
          role="img"
          aria-label={'\u5df2\u4fdd\u5b58\u7684\u5b9e\u6d4b\u5305\u7edc / \u7ebf\u6027\u529f\u7387'}
          data-testid="annotation-measured-evidence-svg"
        >
          <rect
            x={area.left}
            y={area.top}
            width={area.width}
            height={area.height}
            fill="#0d2233"
          />
          <line
            x1={area.left}
            y1={area.top}
            x2={area.left + area.width}
            y2={area.top}
            stroke="#26465d"
          />
          <line
            x1={area.left}
            y1={area.top + area.height}
            x2={area.left + area.width}
            y2={area.top + area.height}
            stroke="#26465d"
          />
          {pathD ? (
            <path d={pathD} fill="none" stroke="#61c3ca" strokeWidth={1.5} />
          ) : null}
          {threshY != null ? (
            <line
              x1={area.left}
              y1={threshY}
              x2={area.left + area.width}
              y2={threshY}
              stroke="#e4b26d"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          ) : null}
          <text x={2} y={h - 4} fill="#94b3c6" fontSize={10}>
            {'\u5df2\u4fdd\u5b58\u7684\u5b9e\u6d4b\u5305\u7edc / \u7ebf\u6027\u529f\u7387'}
          </text>
        </svg>
      ) : null}
    </div>
  );
}

function MeasuredTraceStub({ model }: { model: MeasuredTraceModel }) {
  return (
    <p
      className="annotation-evidence-trace-stub muted"
      data-testid="annotation-evidence-trace-stub"
      data-measured-trace="empty"
      data-measured-point-count="0"
      data-measured-reason={model.reason}
      data-blocked="true"
      data-invented="false"
    >
      {'\u6d4b\u91cf\u8f68\u8ff9\uff1a\u2014\uff08\u65e0\u6709\u6548 timeAnalysis.trace \u00b7 \u4e0d\u4f2a\u9020\uff09'}
    </p>
  );
}

function FactRows({
  keys,
  ev,
  ann,
  emphasizeMean,
  layout,
}: {
  keys: FactKey[];
  ev: Record<string, unknown> | null;
  ann: AnnotationJson;
  emphasizeMean?: boolean;
  layout?: 'rows' | 'grid';
}) {
  return (
    <dl
      className={
        layout === 'grid'
          ? 'annotation-evidence-facts'
          : 'annotation-evidence-fact-rows'
      }
    >
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
            <dd
              data-testid={def.testId}
              data-empty={value === EMPTY ? 'true' : 'false'}
            >
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
  /** Qt Auxiliary = 3-col summary; Inspector = fact grid + MeasuredEvidenceTrace. Default auxiliary. */
  mode?: 'auxiliary' | 'inspector';
};

export function AnnotationEvidencePanel({
  annotation,
  mode = 'auxiliary',
}: AnnotationEvidencePanelProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'auxiliary' | 'inspector'>(mode);
  const ev = useMemo(() => {
    if (
      !annotation?.originEvidence ||
      typeof annotation.originEvidence !== 'object'
    ) {
      return null;
    }
    return annotation.originEvidence as Record<string, unknown>;
  }, [annotation]);

  const measured = useMemo(() => parseMeasuredTrace(ev), [ev]);

  const hasAny = useMemo(() => {
    if (!annotation) return false;
    return (Object.keys(FACTS) as FactKey[]).some(
      (k) => FACTS[k].from(ev, annotation) !== EMPTY,
    );
  }, [annotation, ev]);

  const title = annotation
    ? annotation.name || annotation.id.slice(0, 12)
    : '\u672a\u9009\u62e9\u6807\u6ce8';

  const activeMode = viewMode;

  return (
    <aside
      className="annotation-evidence-panel"
      data-testid="annotation-evidence-panel"
      data-qt-evidence="wave16"
      data-evidence-mode={activeMode}
      data-has-evidence={hasAny ? 'true' : 'false'}
      data-measured-point-count={String(measured.pointCount)}
    >
      <header className="annotation-evidence-header">
        <div
          className="annotation-evidence-title"
          data-testid="annotation-evidence-title"
        >
          {'\u8bc1\u636e'}
          {activeMode === 'auxiliary'
            ? ' \u00b7 \u8f85\u52a9\u4e09\u5217'
            : ' \u00b7 \u68c0\u67e5\u5668'}
        </div>
        <div
          className="annotation-evidence-mode-toggle"
          data-testid="annotation-evidence-mode-toggle"
          role="group"
          aria-label="evidence mode"
        >
          <button
            type="button"
            data-testid="annotation-evidence-mode-auxiliary"
            data-active={activeMode === 'auxiliary' ? 'true' : 'false'}
            className={activeMode === 'auxiliary' ? 'is-active' : undefined}
            onClick={() => setViewMode('auxiliary')}
          >
            Auxiliary
          </button>
          <button
            type="button"
            data-testid="annotation-evidence-mode-inspector"
            data-active={activeMode === 'inspector' ? 'true' : 'false'}
            className={activeMode === 'inspector' ? 'is-active' : undefined}
            onClick={() => setViewMode('inspector')}
          >
            Inspector
          </button>
        </div>
      </header>

      {!annotation ? (
        <p className="muted" data-testid="annotation-evidence-empty">
          {'\u672a\u9009\u62e9\u6807\u6ce8\uff1b\u8bc1\u636e\u7a7a\u95f2\uff08\u4e0d\u4f2a\u9020\uff09'}
        </p>
      ) : activeMode === 'auxiliary' ? (
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
              <h5
                className="annotation-auxiliary-heading"
                data-testid="annotation-evidence-context"
              >
                {title}
              </h5>
              <FactRows keys={TIME_KEYS} ev={ev} ann={annotation} />
              <p
                className="annotation-evidence-notice muted"
                data-testid="annotation-evidence-notice"
              >
                {hasAny
                  ? '\u4ec5\u663e\u793a\u5df2\u4fdd\u5b58\u8bc1\u636e'
                  : `\u6682\u65e0\u4fdd\u5b58\u8bc1\u636e\uff08originEvidence ${EMPTY} / ${EMPTY}\uff09`}
              </p>
            </section>
            <section
              className="annotation-auxiliary-col"
              data-testid="annotation-auxiliary-score-summary"
            >
              <h5 className="annotation-auxiliary-heading">
                {'\u4fdd\u5b58\u5206\u6570 / \u552f\u4e00\u7a97\u53e3'}
              </h5>
              <FactRows
                keys={SCORE_KEYS}
                ev={ev}
                ann={annotation}
                emphasizeMean
              />
            </section>
            <section
              className="annotation-auxiliary-col"
              data-testid="annotation-auxiliary-diagnostic-summary"
            >
              <h5 className="annotation-auxiliary-heading">
                {'\u566a\u5e95 / \u8f68\u8ff9 / \u56de\u9000'}
              </h5>
              <FactRows keys={DIAG_KEYS} ev={ev} ann={annotation} />
              {measured.valid ? (
                <MeasuredEvidenceTrace model={measured} />
              ) : (
                <MeasuredTraceStub model={measured} />
              )}
            </section>
          </div>
          <button
            type="button"
            className="annotation-evidence-details-toggle"
            data-testid="annotation-evidence-details-toggle"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((v) => !v)}
          >
            {detailsOpen ? '\u25bc' : '\u25b6'}{' '}
            {'\u5f53\u524d / \u539f\u59cb / \u89c2\u5bdf\u4e0e\u6765\u6e90\u8be6\u60c5'}
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
          <h5
            className="annotation-evidence-inspector-title"
            data-testid="annotation-evidence-context"
          >
            {title}
          </h5>
          <p
            className="annotation-evidence-notice muted"
            data-testid="annotation-evidence-notice"
          >
            {hasAny
              ? '\u4ec5\u663e\u793a\u5df2\u4fdd\u5b58\u8bc1\u636e\uff1b\u4e0d\u8865\u9f50\u6216\u91cd\u7b97'
              : `\u6682\u65e0\u4fdd\u5b58\u8bc1\u636e\uff08originEvidence ${EMPTY} / ${EMPTY}\uff09`}
          </p>
          {!hasAny ? (
            <p className="muted" data-testid="annotation-evidence-empty">
              {`\u6682\u65e0\u4fdd\u5b58\u8bc1\u636e\uff08originEvidence ${EMPTY} / ${EMPTY}\uff09`}
            </p>
          ) : (
            <FactRows
              keys={INSPECTOR_KEYS}
              ev={ev}
              ann={annotation}
              layout="grid"
            />
          )}
          {measured.valid ? (
            <MeasuredEvidenceTrace model={measured} />
          ) : (
            <MeasuredTraceStub model={measured} />
          )}
          <p
            className="annotation-evidence-score-definition muted"
            data-testid="annotation-evidence-score-definition"
          >
            {
              'mean / max\uff1a\u5bf9\u8c61\u5173\u8054\u552f\u4e00\u7a97\u53e3\u7684\u5206\u6570\u5e73\u5747 / \u6700\u5927\u503c\uff1b\u663e\u793a\u4fdd\u5b58\u503c\uff0c\u4e0d\u8865\u9f50\u6216\u91cd\u7b97\u7f3a\u5931\u660e\u7ec6\u3002\u5206\u6570\u672a\u6821\u51c6\uff0c\u4e0d\u80fd\u89e3\u91ca\u4e3a\u8bc6\u522b\u7f6e\u4fe1\u5ea6\u6216 CNR\u3002'
            }
          </p>
        </>
      )}

      {ev && Object.keys(ev).length > 0 ? (
        <details
          className="annotation-evidence-raw"
          data-testid="annotation-evidence-raw"
        >
          <summary>{'\u4e0d\u53ef\u53d8\u539f\u59cb\u5b57\u6bb5'}</summary>
          <pre>{JSON.stringify(ev, null, 2)}</pre>
        </details>
      ) : null}
    </aside>
  );
}
