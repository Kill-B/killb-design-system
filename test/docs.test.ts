import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { ROOT } from './helpers.ts';

const headings = (file: string): string[] =>
  [...readFileSync(join(ROOT, 'docs', file), 'utf8').matchAll(/^#{1,3} (.+)$/gm)].map(m => m[1]!.toLowerCase());

/** Patterns a public file must never contain: issue ids, other repos of the organization, private links. */
const PATTERNS = [/\b[A-Z]{2,5}-\d{1,5}\b/, /Kill-B\/(?!killb-design-system\b|dev\b)[\w-]+/, /claude\.ai/];

/**
 * Internal tool and repository names, kept as truncated SHA-256 hashes so this public file doesn't list them.
 * Each lowercase word of a file is hashed and looked up here.
 */
const DENIED_WORD_HASHES = new Set([
  '43987e8071340643',
  '877c3aec832cd410',
  '7930172fa3e0d4a2',
  '89601a2c41e3b6bc',
  '0b70a091c8733225',
  '503932c4b7ebe860',
  '216bcc30793e0a76',
  'cfefd8223cf58909',
  '7d90b60c8676bdd0',
  '87f7ccd3e87428e0',
  '1cc9a79bdaf09793',
  '77e5604feeaf6e01',
  'ac1a20b319f11cc4',
  'da1c4bafddc2302e',
  '79f96bfae3ff35e2',
  '7975edd9e7393c22',
  '738e22f0acab814c',
  '6de1be36afd7a16d',
]);

const hash = (word: string): string => createHash('sha256').update(word).digest('hex').slice(0, 16);
const deniedWords = (text: string): string[] =>
  [...new Set(text.toLowerCase().match(/[a-z0-9][a-z0-9.-]*[a-z0-9]/g) ?? [])].filter(w =>
    DENIED_WORD_HASHES.has(hash(w)),
  );

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
      for (const pattern of PATTERNS) if (pattern.test(text)) hits.push(`${file}: ${String(pattern)}`);
      for (const word of deniedWords(text)) hits.push(`${file}: an internal name (hash ${hash(word)})`);
    }
    assert.deepEqual(hits, []);
  });
});
