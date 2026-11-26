import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { ROOT } from './helpers.ts';

const headings = (file: string): string[] =>
  [...readFileSync(join(ROOT, 'docs', file), 'utf8').matchAll(/^#{1,3} (.+)$/gm)].map(m => m[1]!.toLowerCase());

/** Internal tools and private repos a public file must never name. */
const DENYLIST = [
  /\bKIL-\d+\b/,
  /linear\.app/i,
  /\bLinear (issue|task|ticket)s?\b/i,
  /\bslack\b/i,
  /\bmetabase\b/i,
  /\bgranola\b/i,
  /\bsumsub\b/i,
  /killb-data/i,
  /killb-hub/i,
  /tarantino/i,
  /\bbackoffice\b/i,
  /claude\.ai/i,
  /\bmongodb\b/i,
  /\bwebflow\b/i,
  /src\/theme/,
  /Kill-B\/(?!killb-design-system\b|dev\b)[\w-]+/,
];

describe('AC13: public docs', () => {
  it('brand.md has every required section', () => {
    const h = headings('brand.md');
    for (const section of ['attributes', 'identity', 'logo rules', 'color', 'type', 'proportion', 'imagery']) {
      assert.ok(h.includes(section), section);
    }
  });
  it('design-system.md has every required section', () => {
    const h = headings('design-system.md');
    for (const section of [
      'principles',
      'tokens',
      'type',
      'space',
      'layout',
      'shape',
      'motion',
      'states',
      'data visualization',
      'components',
      'governance',
    ]) {
      assert.ok(h.includes(section), section);
    }
  });
  it('links the four component specs', () => {
    for (const component of ['button', 'amount-field', 'status-badge', 'money-table']) {
      assert.ok(headings(`components/${component}.md`).length > 0, component);
    }
  });
  it('no tracked text file names an issue id, an internal tool or a private repo', () => {
    const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
      cwd: ROOT,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(
        f =>
          /\.(md|json|ts|mjs|yml|txt|css)$/.test(f) && !f.startsWith('test/docs.test.ts') && f !== 'package-lock.json',
      );
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(join(ROOT, file), 'utf8');
      for (const pattern of DENYLIST) if (pattern.test(text)) hits.push(`${file}: ${pattern}`);
    }
    assert.deepEqual(hits, []);
  });
});
