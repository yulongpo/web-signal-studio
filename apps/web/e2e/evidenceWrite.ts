/**
 * Write Bot-B acceptance evidence under docs/acceptance/evidence/bot-b/.
 * Companion JSON + screenshots for M-01 / M-02 / M-05 / M-06. Does NOT claim matrix PASS (QA-G only).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const BOT_B_EVIDENCE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../docs/acceptance/evidence/bot-b',
);

export function ensureEvidenceDir(): string {
  fs.mkdirSync(BOT_B_EVIDENCE_DIR, { recursive: true });
  return BOT_B_EVIDENCE_DIR;
}

export function writeEvidenceJson(filename: string, payload: unknown): string {
  const dir = ensureEvidenceDir();
  const full = path.join(dir, filename);
  fs.writeFileSync(full, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  return full;
}
