import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { ROOT, tempDir } from './helpers.ts';

describe('AC4: the packed tarball resolves every export', () => {
  const consumer = tempDir('kb-consumer-');
  const packDir = tempDir('kb-pack-');
  execFileSync('npm', ['pack', '--pack-destination', packDir], { cwd: ROOT, stdio: 'ignore' });
  const tarball = readFileSyncDir(packDir);
  const target = join(consumer, 'node_modules/@killb/design-system');
  mkdirSync(target, { recursive: true });
  execFileSync('tar', ['-xzf', join(packDir, tarball), '-C', target, '--strip-components', '1']);
  const require = createRequire(join(consumer, 'index.js'));

  const exportsList = [
    '@killb/design-system/tokens.json',
    '@killb/design-system/tokens.css',
    '@killb/design-system/mui',
    '@killb/design-system/mintlify.json',
    '@killb/design-system/fonts/Inter-Regular.woff2',
    '@killb/design-system/fonts/Inter-Medium.woff2',
    '@killb/design-system/fonts/Inter-Bold.woff2',
    '@killb/design-system/fonts/SpaceGrotesk-Regular.woff2',
    '@killb/design-system/fonts/SpaceGrotesk-Medium.woff2',
    '@killb/design-system/fonts/OFL-Inter.txt',
    '@killb/design-system/fonts/OFL-SpaceGrotesk.txt',
    '@killb/design-system/logos/killb-wordmark-yellow.svg',
    '@killb/design-system/logos/killb-wordmark-ink.svg',
  ];
  for (const specifier of exportsList) {
    it(specifier, () => assert.ok(require.resolve(specifier)));
  }
  it('ships the mui type declarations', () => {
    assert.match(readFileSync(join(target, 'dist/mui.d.ts'), 'utf8'), /lightThemeOptions: ThemeOptions/);
  });
  it('ships the logos with their brand colors', () => {
    assert.match(readFileSync(join(target, 'logos/killb-wordmark-yellow.svg'), 'utf8'), /fill="#FFC701"/);
    assert.match(readFileSync(join(target, 'logos/killb-wordmark-ink.svg'), 'utf8'), /fill="#111111"/);
  });
});

function readFileSyncDir(dir: string): string {
  return execFileSync('ls', [dir], { encoding: 'utf8' }).trim();
}

describe('Repository files', () => {
  const read = (path: string): string => readFileSync(join(ROOT, path), 'utf8');
  it('AC1: @Kill-B/dev owns every path', () => assert.equal(read('.github/CODEOWNERS').trim(), '* @Kill-B/dev'));
  it('AC2: MIT license and a trademark notice for the name and logos', () => {
    assert.match(read('LICENSE'), /^MIT License/);
    assert.match(read('TRADEMARK.md'), /not licensed under the MIT license/);
  });
  it('AC15: dist/ is ignored by git', () => assert.match(read('.gitignore'), /^dist\/$/m));
  it('AC17: the pull request template asks for the token-change evidence', () => {
    const template = read('.github/pull_request_template.md');
    for (const field of ['Reason:', 'light theme', 'dark theme', 'Contrast report', 'Commit type', 'BREAKING CHANGE']) {
      assert.ok(template.includes(field), field);
    }
  });
  it('AC11: release only runs for a push to main in this repository', () => {
    const release = read('.github/workflows/release.yml');
    assert.match(release, /github\.event\.workflow_run\.event == 'push'/);
    assert.match(release, /github\.event\.workflow_run\.head_repository\.full_name == github\.repository/);
    assert.match(read('package.json'), /"provenance": true/);
  });
  it('AC16: the breaking-change check runs on pull requests only, against their base', () => {
    const ci = read('.github/workflows/ci.yml');
    assert.match(
      ci,
      /if: github\.event_name == 'pull_request'\n\s+run: npm run check:breaking -- --base "origin\/\$\{\{ github\.base_ref \}\}"/,
    );
  });
  it('AC12: CI runs lint, format, typecheck, build, the font check, tests and the breaking check', () => {
    const ci = read('.github/workflows/ci.yml');
    for (const step of [
      'npm run lint',
      'npm run format:check',
      'npm run typecheck',
      'npm run build',
      'npm run check:fonts',
      'npm test',
      'npm run check:breaking',
    ]) {
      assert.ok(ci.includes(step), step);
    }
  });
});
