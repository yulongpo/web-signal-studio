/**
 * G19 Qt AnnotationPanel column matrix helpers vs desktop 17471a6 annotation_panel.cpp.
 * Honest empties; never invent scores or channel counts.
 */
import type { AnnotationJson, AnnotationSourceKind, ReviewStatus } from '@wss/contracts';

export const ANNOTATION_TABLE_HEADERS = [
  '',
  '名称 / annotationId',
  '来源',
  '当前段',
  '起始 / ms',
  '结束 / ms',
  '中心 / MHz',
  '带宽 / kHz',
  'mean',
  '质量',
  '通道',
] as const;

export const SOURCE_KIND_CN: Record<AnnotationSourceKind, string> = {
  ImportedLabel: '原始标签',
  Manual: '手动',
  Algorithm: '算法',
};

export const QUALITY_LABEL_CN: Record<ReviewStatus, string> = {
  Pending: '待判断',
  Accepted: '已采纳',
  Rejected: '已忽略',
};

export type AnnotationTableRow = {
  id: string;
  name: string;
  nameCell: string;
  sourceKind: AnnotationSourceKind | string | undefined;
  sourceLabel: string;
  segmentLabel: string;
  startMs: string;
  endMs: string;
  centerMhz: string;
  bandwidthKhz: string;
  mean: string;
  reviewStatus: ReviewStatus;
  qualityLabel: string;
  channelLabel: string;
  start: string;
  end: string;
  deleted: boolean;
  lowerHz?: number;
  upperHz?: number;
};

function dash(v: string | number | null | undefined): string {
  if (v == null || v === '') return '—';
  return String(v);
}

function fmtNum(n: number, digits: number): string {
  if (!Number.isFinite(n)) return '—';
  return Number(n.toPrecision(digits)).toString();
}

function activeSegment(ann: AnnotationJson) {
  const segs = ann.segments ?? [];
  if (segs.length === 0) return null;
  if (ann.activeSegmentId) {
    const hit = segs.find((s) => s.id === ann.activeSegmentId);
    if (hit) return { seg: hit, index: segs.indexOf(hit) };
  }
  return { seg: segs[0], index: 0 };
}

function sampleToMs(sample: string | undefined, sampleRateHz: number | null | undefined): string {
  if (sample == null || sample === '' || !sampleRateHz || !(sampleRateHz > 0)) return '—';
  const n = Number(sample);
  if (!Number.isFinite(n)) return '—';
  return fmtNum((n / sampleRateHz) * 1000, 10);
}

function readScoreMean(ann: AnnotationJson): string {
  const ev = ann.originEvidence as Record<string, unknown> | undefined;
  if (!ev) return '—';
  const raw = ev.scoreMean ?? ev.mean ?? ev.score_mean;
  if (typeof raw === 'number' && Number.isFinite(raw)) return fmtNum(raw, 4);
  if (typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))) {
    return fmtNum(Number(raw), 4);
  }
  return '—';
}

export function annotationToTableRow(
  ann: AnnotationJson,
  opts: {
    sampleRateHz?: number | null;
    channelCountByAnnotationId?: Record<string, number>;
  } = {},
): AnnotationTableRow {
  const reviewStatus = (ann.reviewStatus ?? 'Pending') as ReviewStatus;
  const sourceKind = ann.sourceKind;
  const sourceLabel =
    sourceKind && sourceKind in SOURCE_KIND_CN
      ? SOURCE_KIND_CN[sourceKind as AnnotationSourceKind]
      : dash(sourceKind);

  const active = activeSegment(ann);
  const segmentLabel = active
    ? `第 ${active.index + 1}/${(ann.segments ?? []).length} 段`
    : '时间未定位';

  const startSample = active?.seg.start ?? ann.start;
  const endSample = active?.seg.end ?? ann.end;
  const lowerHz = active?.seg.lowerHz ?? ann.lowerHz;
  const upperHz = active?.seg.upperHz ?? ann.upperHz;

  let centerMhz = '—';
  let bandwidthKhz = '—';
  if (lowerHz != null && upperHz != null && Number.isFinite(lowerHz) && Number.isFinite(upperHz)) {
    centerMhz = fmtNum((lowerHz + upperHz) / 2e6, 12);
    bandwidthKhz = fmtNum((upperHz - lowerHz) / 1000, 9);
  }

  const revCount = Array.isArray(ann.revisions) ? ann.revisions.length : 0;
  const idShort = ann.id.length > 24 ? ann.id.slice(0, 24) : ann.id;
  const nameCell = `${ann.name || ann.id}\n${idShort} · r${revCount}`;

  const chCount = opts.channelCountByAnnotationId?.[ann.id];
  const channelLabel =
    typeof chCount === 'number' && chCount > 0 ? `${chCount} 个快照` : '—';

  return {
    id: ann.id,
    name: ann.name || ann.id,
    nameCell,
    sourceKind,
    sourceLabel,
    segmentLabel,
    startMs: sampleToMs(startSample, opts.sampleRateHz),
    endMs: sampleToMs(endSample, opts.sampleRateHz),
    centerMhz,
    bandwidthKhz,
    mean: readScoreMean(ann),
    reviewStatus,
    qualityLabel: QUALITY_LABEL_CN[reviewStatus],
    channelLabel,
    start: startSample != null ? String(startSample) : '',
    end: endSample != null ? String(endSample) : '',
    deleted: ann.deleted === true,
    lowerHz,
    upperHz,
  };
}
