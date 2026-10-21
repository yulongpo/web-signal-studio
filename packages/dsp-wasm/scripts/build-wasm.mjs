/**
 * Build packages/dsp-wasm/wasm/dsp_fft.{js,wasm} with emcc.
 * Requires EMSDK env (run emsdk_env.bat first) or emcc on PATH.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');
const src = path.join(pkgRoot, 'native', 'fft_radix2.cpp');
const outDir = path.join(pkgRoot, 'wasm');
const outJs = path.join(outDir, 'dsp_fft.js');

fs.mkdirSync(outDir, { recursive: true });

function findEmcc() {
  if (process.env.EMSDK) {
    const cand = path.join(process.env.EMSDK, 'upstream', 'emscripten', process.platform === 'win32' ? 'emcc.bat' : 'emcc');
    if (fs.existsSync(cand)) return cand;
    const exe = path.join(process.env.EMSDK, 'upstream', 'emscripten', 'emcc.exe');
    if (fs.existsSync(exe)) return exe;
  }
  return process.platform === 'win32' ? 'emcc.bat' : 'emcc';
}

const emcc = findEmcc();
const args = [
  src,
  '-O2',
  '-std=c++17',
  '-sWASM=1',
  '-sMODULARIZE=1',
  '-sEXPORT_ES6=1',
  '-sEXPORT_NAME=createDspFftModule',
  '-sENVIRONMENT=web,worker,node',
  '-sALLOW_MEMORY_GROWTH=1',
  '-sFILESYSTEM=0',
  `-sEXPORTED_FUNCTIONS=["_fft_radix2","_malloc","_free"]`,
  `-sEXPORTED_RUNTIME_METHODS=["HEAPF64"]`,
  '-sASSERTIONS=0',
  '-o',
  outJs,
];

console.log('emcc:', emcc);
console.log('args:', args.join(' '));

const r = spawnSync(emcc, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

if (r.status !== 0) {
  console.error('emcc failed with status', r.status);
  process.exit(r.status ?? 1);
}

const wasmPath = path.join(outDir, 'dsp_fft.wasm');
if (!fs.existsSync(wasmPath) || !fs.existsSync(outJs)) {
  console.error('missing outputs', { wasmPath, outJs });
  process.exit(1);
}
console.log('built', outJs, 'and', wasmPath);
console.log('sizes', fs.statSync(outJs).size, fs.statSync(wasmPath).size);
