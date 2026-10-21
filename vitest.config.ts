import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: [
      'packages/contracts/**/*.test.ts',
      'packages/domain/**/*.test.ts',
      'packages/file-io/**/*.test.ts',
      'packages/dsp-wasm/**/*.test.ts',
      'packages/project-io/**/*.test.ts',
    ],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@wss/contracts': path.resolve(__dirname, 'packages/contracts/src/index.ts'),
      '@wss/domain': path.resolve(__dirname, 'packages/domain/src/index.ts'),
      '@wss/file-io': path.resolve(__dirname, 'packages/file-io/src/index.ts'),
      '@wss/dsp-wasm': path.resolve(__dirname, 'packages/dsp-wasm/src/index.ts'),
      '@wss/project-io': path.resolve(__dirname, 'packages/project-io/src/index.ts'),
      '@wss/charts': path.resolve(__dirname, 'packages/charts/src/index.ts'),
    },
  },
});
