import fs from 'node:fs';
import path from 'node:path';

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function appendLog(brainDir: string, file: string, line: string) {
  ensureDir(brainDir);
  const p = path.join(brainDir, file);
  fs.appendFileSync(p, line.endsWith('\n') ? line : line + '\n', 'utf8');
}

export function upsertJSON<T extends object>(brainDir: string, file: string, patch: Partial<T>) {
  ensureDir(brainDir);
  const p = path.join(brainDir, file);
  let cur: any = {};
  if (fs.existsSync(p)) {
    try { cur = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { cur = {}; }
  }
  const next = { ...cur, ...patch };
  fs.writeFileSync(p, JSON.stringify(next, null, 2), 'utf8');
  return next as T;
}

export function readJSON<T extends object>(brainDir: string, file: string, fallback: T) {
  const p = path.join(brainDir, file);
  if (!fs.existsSync(p)) return fallback;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) as T; } catch { return fallback; }
}
