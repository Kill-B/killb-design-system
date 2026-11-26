import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { describe, it } from 'node:test';

import { checkedPairs, contrastReport, failures, separations } from '../src/checks.ts';
import { resolve, validate } from '../src/source.ts';
import { build, clone, loadSource } from './helpers.ts';

describe('AC8: contrast floors', () => {
  it('checks 88 role pairs and 20 chart pairs, all passing with the approved values', () => {
    const pairs = checkedPairs();
    assert.equal(pairs.filter(p => !p.foreground.startsWith('viz-')).length, 88);
    assert.equal(pairs.filter(p => p.foreground.startsWith('viz-')).length, 20);
    assert.deepEqual(
      contrastReport(resolve(loadSource())).filter(r => !r.ok),
      [],
    );
  });
  it('fails a text pair below 4.5:1 and names the pair, both colors and the ratio', () => {
    const source = clone(loadSource());
    source.roles['text.secondary']!.light = 'neutral.400';
    const result = build(source);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /light: text\.secondary #A3A19D on surface\.default #FFFFFF is 2\.\d\d:1, needs 4\.5:1/,
    );
  });
  it('fails a focus ring below 3:1 in dark', () => {
    const source = clone(loadSource());
    source.roles['focus.ring']!.dark = 'neutral.800';
    const problems = failures(resolve(source));
    assert.ok(problems.some(p => p.includes('dark: focus.ring #2C2B29') && p.includes('needs 3:1')));
  });
  it('never fails on exempt roles', () => {
    const source = clone(loadSource());
    source.roles['text.disabled']!.light = 'neutral.100';
    source.roles['border.subtle']!.light = 'neutral.50';
    assert.deepEqual(failures(resolve(source)), []);
  });
});

describe('AC9: color-blind separation', () => {
  it('passes with the approved palettes', () => {
    assert.ok(separations(resolve(loadSource())).every(s => s.distance >= 0.1));
  });
  it('fails two close series and names them, the theme and the simulation', () => {
    const source = clone(loadSource());
    source.viz.dark.categorical[3] = '#80F0E0';
    const problems = failures(resolve(source));
    assert.ok(
      problems.some(p => /^color-blind dark: viz-3 and viz-4 are 0\.0\d\d apart under \w+/.test(p)),
      problems.join('\n'),
    );
  });
});

describe('AC19: invalid token source', () => {
  const cases: [string, (s: ReturnType<typeof loadSource>) => void, RegExp][] = [
    [
      'a role pointing to a missing step',
      s => (s.roles['text.primary']!.light = 'neutral.975'),
      /role text\.primary \(light\): "neutral\.975" is not a palette step/,
    ],
    [
      'a role with only one theme',
      s => delete (s.roles['brand.fill'] as Partial<Record<'dark' | 'light', string>>).dark,
      /role brand\.fill: no dark value/,
    ],
    [
      'an OKLCH value out of range',
      s => (s.palette.blue!['500'] = { c: 0.18, h: 400, l: 0.66 }),
      /palette blue\.500: OKLCH hue 400 is outside 0\.\.360/,
    ],
  ];
  for (const [name, mutate, message] of cases) {
    it(`fails on ${name}, names it and writes nothing`, () => {
      const source = clone(loadSource());
      mutate(source);
      assert.ok(validate(source).length > 0);
      const result = build(source);
      assert.equal(result.status, 1);
      assert.match(result.stderr, message);
      assert.equal(existsSync(result.dist), false);
    });
  }
});
