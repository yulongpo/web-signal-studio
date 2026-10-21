/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOCAL_COMPUTE_URL?: string;
  readonly VITE_LOCAL_COMPUTE_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
