/// <reference types="vite/client" />

import type { M06E2eHookApi } from '@wss/project-io';

interface ImportMetaEnv {
  readonly VITE_LOCAL_COMPUTE_URL?: string;
  readonly VITE_LOCAL_COMPUTE_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    /** Bot-F M-06 E2E hook (installM06E2eHook). Always-on thin install for Playwright. */
    __wssM06?: M06E2eHookApi;
  }
}

export {};
