/**
 * G19 AnnotationEvidenceWidget chrome vs desktop 17471a6.
 * Shows saved originEvidence facts only — never invents scores or analysis.
 */
import type { AnnotationJson } from '@wss/contracts';

const FACTS: { key: string; label: string; testId: string; from: (ev: Record<string, unknown>, ann: AnnotationJson) => string }[] = [
  {
    key: 'method',
    label: '原始精修',
    testId: 'annotation-evidence-method',
    from: (ev) => str(ev.method ?? ev.refineMethod ?? ev.algorithm),
  },
  {
    key: 'timeBasis',
    label: '时间依据',
    testId: 'annotation-evidence-time-basis',
    from: (ev, ann) =>
      str(ev.timeBasis ?? ev.timeQuality ?? ann.observationTimeQuality),
  },
  {
    key: 'uncertainty',
    label: '不确定度',
    testId: 'annotation-evidence-uncertainty',
    from: (ev) => str(ev.uncertainty ?? ev.uncertaintySamples),
  },
  {
    key: 'frequencyBasis',
    label: '频率依据',
    testId: 'annotation-evidence-frequency',
    from: (ev, ann) =>
      str(ev.frequencyBasis ?? ev.frequencyQuality ?? ann.observationFrequencyFrame),
  },
  {
    key: 'mean',
    label: 'mean',
    testId: 'annotation-evidence-mean',
    from: (ev) => str(ev.scoreMean ?? ev.mean ?? ev.score_mean),
  },
  {
    key: 'maximum',
    label: 'maximum',
    testId: 'annotation-evidence-max',
    from: (ev) => str(ev.scoreMax ?? ev.maximum ?? ev.score_max),
  },
  {
    key: 'class',
    label: '类别',
    testId: 'annotation-evidence-class',
    from: (ev, ann) => str(ev.classLabel ?? ann.classLabel),
  },
  {
    key: 'origin',
    label: '来源',
    testId: 'annotation-evidence-origin',
    from: (ev, ann) => str(ev.origin ?? ev.sourceKind ?? ann.sourceKind),
  },
];

function str(v: unknown): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'string' && v.trim() !== '') return v;
  return '—';
}

export type AnnotationEvidencePanelProps = {
  annotation: AnnotationJson | null;
};

export function AnnotationEvidencePanel({ annotation }: AnnotationEvidencePanelProps) {
  const ev =
    annotation?.originEvidence && typeof annotation.originEvidence === 'object'
      ? (annotation.originEvidence as Record<string, unknown>)
      : null;
  const hasAny =
    ev != null &&
    FACTS.some((f) => {
      const v = f.from(ev, annotation!);
      return v !== '—';
    });

  return (
    <aside
      className="annotation-evidence-panel"
      data-testid="annotation-evidence-panel"
      data-qt-evidence="wave13"
      data-has-evidence={hasAny ? 'true' : 'false'}
    >
      <header className="annotation-evidence-title" data-testid="annotation-evidence-title">
        证据
      </header>
      {!annotation ? (
        <p className="muted" data-testid="annotation-evidence-empty">
          未选择标注；证据空闲（不伪造）
        </p>
      ) : !hasAny ? (
        <p className="muted" data-testid="annotation-evidence-empty">
          暂无保存证据（originEvidence 空 / —）
        </p>
      ) : (
        <dl className="annotation-evidence-facts">
          {FACTS.map((f) => {
            const value = f.from(ev!, annotation);
            return (
              <div key={f.key} className="annotation-evidence-fact">
                <dt>{f.label}</dt>
                <dd data-testid={f.testId} data-empty={value === '—' ? 'true' : 'false'}>
                  {value}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
      {ev && Object.keys(ev).length > 0 ? (
        <details className="annotation-evidence-raw" data-testid="annotation-evidence-raw">
          <summary>原始字段</summary>
          <pre>{JSON.stringify(ev, null, 2)}</pre>
        </details>
      ) : null}
    </aside>
  );
}
