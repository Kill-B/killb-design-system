import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { checkBreaking, cssProperties, type PublicNames, tokenPaths } from '../src/breaking.ts';

const names = (extra: Partial<PublicNames> = {}): PublicNames => ({
  cssProperties: ['--kb-text-primary', '--kb-space-16'],
  exports: ['./mui', './tokens.css'],
  tokens: ['color.role.light.text.primary', 'space.16'],
  ...extra,
});
const published = async (): Promise<{ kind: 'version'; names: PublicNames; version: string }> => ({
  kind: 'version',
  names: names(),
  version: '1.2.0',
});

describe('AC16: breaking-change check', () => {
  it('passes when nothing was removed', async () => {
    assert.equal((await checkBreaking(names(), published, [])).ok, true);
  });
  it('fails on a removed token, CSS property or export and names them', async () => {
    const current = names({ cssProperties: ['--kb-text-primary'], exports: ['./mui'], tokens: ['space.16'] });
    const result = await checkBreaking(current, published, ['feat: rename tokens']);
    assert.equal(result.ok, false);
    assert.match(result.message, /token color\.role\.light\.text\.primary/);
    assert.match(result.message, /CSS property --kb-space-16/);
    assert.match(result.message, /export \.\/tokens\.css/);
  });
  it('passes a removal declared with a BREAKING CHANGE footer', async () => {
    const current = names({ tokens: ['space.16'] });
    const result = await checkBreaking(current, published, ['feat: rename\n\nBREAKING CHANGE: text roles moved']);
    assert.equal(result.ok, true);
  });
  it('is skipped, with a log line, before any version is published', async () => {
    const result = await checkBreaking(names(), async () => ({ kind: 'none' }), []);
    assert.equal(result.ok, true);
    assert.match(result.message, /skipped/);
  });
  it('fails closed when the registry cannot be reached', async () => {
    const result = await checkBreaking(names(), async () => Promise.reject(new Error('ETIMEDOUT')), []);
    assert.equal(result.ok, false);
    assert.match(result.message, /could not be reached \(ETIMEDOUT\)/);
  });
  it('reads names from the built files', () => {
    assert.deepEqual(tokenPaths({ a: { b: { $type: 'color', $value: '#000' } }, $description: 'x' }), ['a.b']);
    assert.deepEqual(cssProperties(':root {\n  --kb-a: 1;\n  --kb-b-c: 2;\n}'), ['--kb-a', '--kb-b-c']);
  });
});
