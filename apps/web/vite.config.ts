import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const chartsSrc = path.resolve(rootDir, '../../packages/charts/src')
const projectIoSrc = path.resolve(rootDir, '../../packages/project-io/src')
const contractsSrc = path.resolve(rootDir, '../../packages/contracts/src')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@wss/charts/SpectrumChart': path.resolve(chartsSrc, 'react/SpectrumChart.tsx'),
      '@wss/charts/HeatmapCanvas': path.resolve(chartsSrc, 'react/HeatmapCanvas.tsx'),
      '@wss/charts/lut/colormaps': path.resolve(chartsSrc, 'lut/colormaps.ts'),
      '@wss/charts/react': path.resolve(chartsSrc, 'react'),
      '@wss/charts': chartsSrc,
      '@wss/project-io': path.resolve(projectIoSrc, 'index.ts'),
      '@wss/contracts': path.resolve(contractsSrc, 'index.ts'),
    },
  },
  server: {
    port: 5173,
    fs: { allow: [path.resolve(rootDir, '../..')] },
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
