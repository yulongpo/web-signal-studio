/**
 * Local-compute / detection wire types for the web detection page.
 * Owner: Bot-E. Align with services/local-compute OpenAPI + DETECTION_PAGE_CONTRACT.md.
 * Does not claim FFSCN/SCN availability — consumers must gate on booleans from the server.
 */

/** Canonical decimal sample index string (uint64); never JSON Number for large indexes. */
export type DecimalSampleIndex = string;

export interface LocalComputeUiMessage {
  code: string;
  severity: 'info' | 'warning' | 'error' | string;
  en: string;
  zh: string;
}

export interface LocalComputeDetectionCapabilities {
  ffscn: boolean;
  scn: boolean;
  reasons: string[];
  uiMessages: LocalComputeUiMessage[];
}

export interface LocalComputeDspCapabilities {
  fft: boolean;
  psd: boolean;
  stft: boolean;
  ddc: boolean;
  reasons: string[];
}

export interface LocalComputeModelInfo {
  id: string;
  path?: string | null;
  sha256?: string | null;
  present: boolean;
  notes?: string | null;
}

/** Structured GPU probe; runtimeVerified stays false until CUDA/TRT is verified. */
export interface LocalComputeGpuPrecheck {
  toolchainVisible: boolean;
  runtimeVerified: boolean;
  name?: string | null;
  driverVersion?: string | null;
  reason?: string | null;
  uiCode?: string | null;
}

/** Engine/runtime identity. Stub today; canInventResults is always false. */
export interface LocalComputeRuntimePrecheck {
  engine: string;
  tensorrtVerified: boolean;
  cudaVerified: boolean;
  canInventResults: boolean;
  modelSearchRoots: string[];
  ffscnPresent: boolean;
  scnPresent: boolean;
  ffscnReady: boolean;
  scnReady: boolean;
}

export interface LocalComputeCapabilities {
  protocolVersion: string;
  serviceVersion: string;
  bindAddressPolicy: string;
  bindHost: string;
  authRequired: boolean;
  dsp: LocalComputeDspCapabilities;
  detection: LocalComputeDetectionCapabilities;
  models: LocalComputeModelInfo[];
  gpu: LocalComputeGpuPrecheck;
  runtime: LocalComputeRuntimePrecheck;
  notes: string[];
}

export interface LocalComputeSampleRange {
  /** Inclusive start — decimal string */
  start: DecimalSampleIndex;
  /** Exclusive end — decimal string */
  end: DecimalSampleIndex;
}

export interface LocalComputeTaskCreateRequest {
  kind: string;
  params?: Record<string, unknown>;
  sourcePath?: string | null;
  sampleRange?: LocalComputeSampleRange | null;
  sampleIndices?: DecimalSampleIndex[];
}

export interface LocalComputeTaskCreateResponse {
  runId: string;
}

export type LocalComputeTaskStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'BLOCKED';

export interface LocalComputeTaskRecord {
  runId: string;
  kind: string;
  status: LocalComputeTaskStatus;
  progress: number;
  request: Record<string, unknown>;
  result: Record<string, unknown> | null;
  evidence: Array<Record<string, unknown>>;
  blockReasons: string[];
  message?: string | null;
  messageZh?: string | null;
  uiMessages: LocalComputeUiMessage[];
  /** Compact transition log, e.g. ["queued","running","cancelled"] */
  statusHistory?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalComputeTaskCancelResponse {
  runId: string;
  status: LocalComputeTaskStatus;
  message?: string | null;
  messageZh?: string | null;
}

/** Stable uiMessage codes documented in DETECTION_PAGE_CONTRACT.md (aligned with Bot-B DetectPage). */
export const LOCAL_COMPUTE_UI_CODES = [
  'GPU_MISSING',
  'GPU_UNVERIFIED',
  'GPU_PROBE_ERROR',
  'TORCH_MISSING',
  'TORCH_CPU_ONLY',
  'TORCH_CUDA_OK',
  'MODEL_MISSING_FFSCN',
  'MODEL_MISSING_SCN',
  'MODEL_PATH_MISSING',
  'MODEL_HOME_MISSING',
  'MODEL_HASH_MISMATCH',
  'WEIGHT_HASH_MISMATCH',
  'MODEL_HASH_UNAVAILABLE',
  'MODEL_LOAD_FAILED',
  'SOURCE_MISSING',
  'INFERENCE_FAILED',
  'STUB_RUNTIME',
  'REAL_RUNTIME',
  'NO_FAKE_INFERENCE',
] as const;

export type LocalComputeUiCode = (typeof LOCAL_COMPUTE_UI_CODES)[number];

/**
 * STUB_RUNTIME bilingual copy — MUST match services/local-compute UI_COPY and
 * apps/web/src/localCompute/gating.test.ts fixture (Bot-B banner gating).
 */
export const LOCAL_COMPUTE_STUB_RUNTIME_COPY = {
  code: 'STUB_RUNTIME',
  severity: 'error',
  en: 'Local compute is in stub mode (no TensorRT). Detection will not invent results.',
  zh: '本地计算处于占位模式（无 TensorRT），检测不会伪造结果。',
} as const;

/** Stub engine label until real TensorRT/PyTorch runtime is verified. */
export const LOCAL_COMPUTE_STUB_ENGINE = 'STUB_NON_TENSORRT' as const;

/** Real engines reported when verifiedForward=true (never invent these). */
export const LOCAL_COMPUTE_REAL_ENGINES = ['PYTORCH_CUDA', 'PYTORCH_CPU'] as const;
