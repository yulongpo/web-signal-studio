import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const chartsSrc = path.resolve(rootDir, '../../packages/charts/src')
const dspWasmSrc = path.resolve(rootDir, '../../packages/dsp-wasm/src')
const fileIoSrc = path.resolve(rootDir, '../../packages/file-io/src')
const projectIoSrc = path.resolve(rootDir, '../../packages/project-io/src')
const contractsSrc = path.resolve(rootDir, '../../packages/contracts/src')
const domainSrc = path.resolve(rootDir, '../../packages/domain/src')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@wss/charts/SpectrumChart': path.resolve(chartsSrc, 'react/SpectrumChart.tsx'),
      '@wss/charts/HeatmapCanvas': path.resolve(chartsSrc, 'react/HeatmapCanvas.tsx'),
      '@wss/charts/WaveformChart': path.resolve(chartsSrc, 'react/WaveformChart.tsx'),
      '@wss/charts/NavigationChart': path.resolve(chartsSrc, 'react/NavigationChart.tsx'),
      '@wss/charts/VerticalSplitter': path.resolve(chartsSrc, 'react/VerticalSplitter.tsx'),
      '@wss/charts/lut/colormaps': path.resolve(chartsSrc, 'lut/colormaps.ts'),
      '@wss/charts/react': path.resolve(chartsSrc, 'react'),
      '@wss/charts': chartsSrc,
      '@wss/dsp-wasm': path.resolve(dspWasmSrc, 'index.ts'),
      '@wss/file-io': path.resolve(fileIoSrc, 'index.ts'),
      '@wss/project-io': path.resolve(projectIoSrc, 'index.ts'),
      '@wss/contracts': path.resolve(contractsSrc, 'index.ts'),
      '@wss/domain': path.resolve(domainSrc, 'index.ts'),
    },
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@wss/dsp-wasm', '@wss/file-io', '@wss/contracts', '@wss/project-io', '@wss/domain'],
  },
  server: {
    port: 5173,
    fs: {
      allow: [
        path.resolve(rootDir, '../..'),
        // Bot-D aux Wave: read-only chunked IQ from rebuild demo SigMF (not copied into web tree).
        'D:/project/signal_studio_rebuild/resources/sigmf_data_demo',
      ],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/*.e2e.*',
      '**/playwright.config.*',
    ],
  },
})