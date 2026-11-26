import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { resolve, type Source } from '../src/source.ts';

export const ROOT = join(import.meta.dirname, '..');

export const loadSource = (): Source => JSON.parse(readFileSync(join(ROOT, 'tokens/source.json'), 'utf8')) as Source;

export const resolved = (): ReturnType<typeof resolve> => resolve(loadSource());

export const tempDir = (prefix: string): string => mkdtempSync(join(tmpdir(), prefix));

/** Runs scripts/build.ts on a source object into a fresh directory; returns the result and the dist path. */
export function build(source: Source = loadSource()): { dist: string; status: number | null; stderr: string } {
  const dir = tempDir('kb-build-');
  const sourcePath = join(dir, 'source.json');
  writeFileSync(sourcePath, JSON.stringify(source));
  const dist = join(dir, 'dist');
  const run = spawnSync(process.execPath, [join(ROOT, 'scripts/build.ts'), '--source', sourcePath, '--out', dist], {
    encoding: 'utf8',
  });
  return { dist, status: run.status, stderr: run.stderr };
}

export const clone = <T>(value: T): T => structuredClone(value);
