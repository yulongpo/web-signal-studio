import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['packages/**/src/**/*.test.ts', 'packages/**/tests/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@wss/contracts': path.resolve(__dirname, 'packages/contracts/src/index.ts'),
      '@wss/domain': path.resolve(__dirname, 'packages/domain/src/index.ts'),
      '@wss/file-io': path.resolve(__dirname, 'packages/file-io/src/index.ts'),
      '@wss/dsp-wasm': path.resolve(__dirname, 'packages/dsp-wasm/src/index.ts'),
    },
  },
});
