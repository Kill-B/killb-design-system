import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { build, resolved, ROOT, tempDir } from './helpers.ts';

const approved = JSON.parse(readFileSync(join(ROOT, 'test/fixtures/approved.json'), 'utf8')) as {
  palette: Record<string, Record<string, string>>;
  role: Record<'dark' | 'light', Record<string, string>>;
  viz: Record<'dark' | 'light', { categorical: string[] }>;
};

const { dist, status } = build();
const css = readFileSync(join(dist, 'tokens.css'), 'utf8');

/** Reads a value from parsed JSON by a dotted path. */
const at = (value: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], value);

const json: unknown = JSON.parse(readFileSync(join(dist, 'tokens.json'), 'utf8'));
const mintlify: unknown = JSON.parse(readFileSync(join(dist, 'mintlify.json'), 'utf8'));

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `${selector} block missing`);
  return css.slice(start, css.indexOf('}', start));
}

describe('AC3: generated colors equal the approved set', () => {
  it('builds', () => assert.equal(status, 0));
  const r = resolved();
  for (const [scale, steps] of Object.entries(approved.palette)) {
    it(`palette ${scale}`, () => {
      for (const [step, hex] of Object.entries(steps))
        assert.equal(r.palette[scale]?.[step]?.hex, hex, `${scale}.${step}`);
    });
  }
  for (const theme of ['light', 'dark'] as const) {
    it(`roles in ${theme}`, () => {
      assert.deepEqual(Object.keys(r.roles[theme]).sort(), Object.keys(approved.role[theme]).sort());
      for (const [role, hex] of Object.entries(approved.role[theme]))
        assert.equal(r.roles[theme][role], hex.toUpperCase(), role);
    });
    it(`categorical viz in ${theme}`, () =>
      assert.deepEqual(r.viz[theme].categorical, approved.viz[theme].categorical));
  }
  it('names the examples from the Spec', () => {
    assert.equal(r.palette.yellow?.['400']?.hex, '#FFC701');
    assert.equal(r.palette.yellow?.['700']?.hex, '#935F00');
    assert.equal(r.palette.orange?.['500']?.hex, '#E66700');
    assert.equal(r.palette.neutral?.['950']?.hex, '#111110');
  });
});

describe('AC5: tokens.css themes', () => {
  it('never reacts to prefers-color-scheme', () => assert.doesNotMatch(css, /prefers-color-scheme/));
  it('sets light values on :root', () => {
    const root = block(':root');
    assert.match(root, /--kb-surface-canvas: #FAFAF9;/);
    assert.match(root, /--kb-viz-1: #325EC6;/);
    assert.match(root, /--kb-elevation-1: 0 1px 2px 0px #1111100D;/);
  });
  it('switches roles, every viz property and elevation only under [data-theme="dark"]', () => {
    const dark = block('[data-theme="dark"]');
    assert.match(dark, /--kb-surface-canvas: #111110;/);
    for (const name of [
      ...['1', '2', '3', '4', '5'].map(n => `--kb-viz-${n}`),
      ...['1', '2', '3', '4', '5', '6', '7', '8'].map(n => `--kb-viz-seq-${n}`),
      ...['neg-3', 'neg-2', 'neg-1', 'mid', 'pos-1', 'pos-2', 'pos-3'].map(n => `--kb-viz-div-${n}`),
      ...['0', '1', '2', '3', '4'].map(n => `--kb-elevation-${n}`),
    ]) {
      assert.match(dark, new RegExp(`${name}:`), name);
    }
    assert.match(dark, /--kb-viz-1: #919FFF;/);
    assert.doesNotMatch(dark, /--kb-space-|--kb-yellow-/);
  });
  it('declares the shipped fonts', () => assert.equal(css.match(/@font-face/g)?.length, 5));
});

describe('AC6: MUI theme options', async () => {
  const dir = tempDir('kb-mui-');
  copyFileSync(join(dist, 'mui.js'), join(dir, 'mui.mjs'));
  const mod = (await import(join(dir, 'mui.mjs'))) as Record<string, unknown>;
  const light = mod.lightThemeOptions;
  const dark = mod.darkThemeOptions;

  it('imports with no dependencies installed', () => {
    const run = spawnSync(process.execPath, ['-e', `import('${join(dir, 'mui.mjs')}').then(() => process.exit(0))`], {
      cwd: dir,
    });
    assert.equal(run.status, 0);
  });
  it('primary is the brand yellow with ink text in both themes', () => {
    for (const t of [light, dark]) {
      assert.equal(at(t, 'palette.primary.main'), '#FFC701');
      assert.equal(at(t, 'palette.primary.contrastText'), '#111110');
    }
  });
  it('warning is orange: #E66700 in light, #FF8F51 in dark', () => {
    assert.equal(at(light, 'palette.warning.main'), '#E66700');
    assert.equal(at(dark, 'palette.warning.main'), '#FF8F51');
  });
  it('uses Inter and Space Grotesk with weights 400, 500 and 700', () => {
    assert.match(String(at(light, 'typography.fontFamily')), /^Inter,/);
    assert.match(String(at(light, 'typography.h1.fontFamily')), /^"Space Grotesk",/);
    assert.deepEqual(
      ['fontWeightRegular', 'fontWeightMedium', 'fontWeightBold'].map(k => at(light, `typography.${k}`)),
      [400, 500, 700],
    );
  });
  it('font sizes are steps of the type scale', () => {
    const scale = new Set(['13px', '16px', '20px', '25px', '31px', '39px', '49px', '61px', '76px', '95px']);
    for (const [variant, style] of Object.entries(at(light, 'typography') as Record<string, unknown>)) {
      if (style && typeof style === 'object') {
        const size = String(at(style, 'fontSize'));
        assert.ok(scale.has(size), `${variant}: ${size}`);
      }
    }
  });
  it('breakpoints, shape and shadows follow the tokens', () => {
    assert.deepEqual(at(light, 'breakpoints.values'), { lg: 1024, md: 768, sm: 480, xl: 1280, xs: 0 });
    assert.equal(at(light, 'shape.borderRadius'), 8);
    const shadows = at(light, 'shadows') as string[];
    assert.equal(shadows.length, 25);
    assert.equal(shadows[0], 'none');
    assert.equal(shadows[1], '0 1px 2px 0px #1111100D');
    assert.equal(shadows[3], shadows[1]);
    assert.equal(shadows[4], '0 4px 8px -2px #1111101A, 0 2px 4px -2px #1111100F');
    assert.equal(shadows[16], '0 24px 48px -12px #1111102E');
    assert.equal((at(dark, 'shadows') as string[])[16], '0 24px 48px -12px #000000B3');
  });
});

describe('AC7: Mintlify block', () => {
  it('has the exact colors and font families', () => {
    assert.deepEqual(mintlify, {
      colors: { dark: '#935F00', light: '#FFC701', primary: '#935F00' },
      fonts: { body: { family: 'Inter' }, heading: { family: 'Space Grotesk' } },
    });
  });
});

describe('AC18: font weights', () => {
  it('tokens.json has exactly 400, 500 and 700', () => {
    const weights = Object.values(at(json, 'typography.weight') as Record<string, { $value: number }>).map(
      w => w.$value,
    );
    assert.deepEqual(weights.sort(), [400, 500, 700]);
  });
  it('tokens.css has exactly 400, 500 and 700', () => {
    const weights = [...css.matchAll(/--kb-font-weight-[\w-]+: (\d+);/g)].map(m => Number(m[1]));
    assert.deepEqual(weights.sort(), [400, 500, 700]);
    assert.doesNotMatch(css, /font-weight[\w-]*: 600/);
  });
});

describe('Contract names', () => {
  it('tokens.json has the contracted paths', () => {
    for (const path of [
      'color.viz.light.categorical.5',
      'color.viz.dark.sequential.8',
      'color.viz.light.diverging.neg-3',
      'elevation.2.$extensions.com.killb.themes',
      'layout.maxWidth.reading',
      'layout.columns',
      'breakpoint.2xl',
    ]) {
      if (path.includes('com.killb')) {
        assert.ok((at(json, 'elevation.2.$extensions') as Record<string, unknown>)['com.killb.themes'], path);
      } else {
        assert.ok(at(json, path), path);
      }
    }
    assert.equal(at(json, 'typography.feature.amount.$value'), '"tnum" 1, "zero" 1');
  });
  it('tokens.css has the contracted properties', () => {
    for (const name of [
      '--kb-yellow-400',
      '--kb-text-primary',
      '--kb-font-display',
      '--kb-font-size-7xl',
      '--kb-line-height-xs',
      '--kb-letter-spacing-md',
      '--kb-font-feature-amount',
      '--kb-space-160',
      '--kb-radius-full',
      '--kb-duration-instant',
      '--kb-ease-standard',
      '--kb-width-app',
    ]) {
      assert.match(css, new RegExp(`${name}:`), name);
    }
    assert.doesNotMatch(css, /--kb-breakpoint|--kb-gutter|--kb-margin|--kb-columns/);
  });
});
