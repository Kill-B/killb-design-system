// Fails when a public name of the latest published version is gone and no commit declares BREAKING CHANGE.
// Usage (after npm run build): node scripts/check-breaking.ts [--base origin/main]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { checkBreaking, publicNames, type Published } from '../src/breaking.ts';

const PACKAGE = '@killb/design-system';
const { values } = parseArgs({ options: { base: { default: 'origin/main', type: 'string' } } });

const read = (dir: string): ReturnType<typeof publicNames> =>
  publicNames(
    JSON.parse(readFileSync(join(dir, 'dist/tokens.json'), 'utf8')),
    readFileSync(join(dir, 'dist/tokens.css'), 'utf8'),
    JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { exports?: object },
  );

async function fetchPublished(): Promise<Published> {
  let version: string;
  try {
    version = execFileSync('npm', ['view', PACKAGE, 'version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const stderr = String((error as { stderr?: Buffer | string }).stderr ?? '');
    if (/E404|404 Not Found/.test(stderr)) return { kind: 'none' };
    throw new Error(stderr.trim().split('\n').at(-1) ?? 'npm view failed');
  }
  const dir = mkdtempSync(join(tmpdir(), 'kb-published-'));
  try {
    execFileSync('npm', ['pack', `${PACKAGE}@${version}`, '--pack-destination', dir], { stdio: 'ignore' });
    const tarball = execFileSync('ls', [dir], { encoding: 'utf8' }).trim();
    execFileSync('tar', ['-xzf', join(dir, tarball), '-C', dir]);
    return { kind: 'version', names: read(join(dir, 'package')), version };
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
}

const messages = execFileSync('git', ['log', '--format=%B%x00', `${values.base}..HEAD`], { encoding: 'utf8' })
  .split('\0')
  .filter(m => m.trim());

const result = await checkBreaking(read('.'), fetchPublished, messages);
(result.ok ? console.log : console.error)(result.message);
process.exit(result.ok ? 0 : 1);
