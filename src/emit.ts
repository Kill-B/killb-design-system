import { fontSize, type Resolved, type Source, type Theme, THEMES } from './source.ts';

type Layer = Source['elevation'][string][Theme][number];

const px = (n: number): string => `${n}px`;
const dash = (role: string): string => role.replace('.', '-');
const stack = (families: string[]): string => families.map(f => (f.includes(' ') ? `"${f}"` : f)).join(', ');
const shadowCss = (layers: Layer[]): string =>
  layers.length === 0 ? 'none' : layers.map(l => `0 ${px(l.y)} ${px(l.blur)} ${px(l.spread)} ${l.color}`).join(', ');
const shadowDtcg = (layers: Layer[]): 'none' | object[] =>
  layers.length === 0
    ? 'none'
    : layers.map(l => ({ blur: px(l.blur), color: l.color, offsetX: '0px', offsetY: px(l.y), spread: px(l.spread) }));
const SEQUENCE_STEPS = (n: number): string[] => Array.from({ length: n }, (_, i) => String(i + 1));

export const FONT_FILES = [
  { family: 'Space Grotesk', file: 'SpaceGrotesk-Regular.woff2', weight: 400 },
  { family: 'Space Grotesk', file: 'SpaceGrotesk-Medium.woff2', weight: 500 },
  { family: 'Inter', file: 'Inter-Regular.woff2', weight: 400 },
  { family: 'Inter', file: 'Inter-Medium.woff2', weight: 500 },
  { family: 'Inter', file: 'Inter-Bold.woff2', weight: 700 },
] as const;

export function tokensJson(r: Resolved): object {
  const s = r.source;
  const tok = (type: string, value: unknown, description?: string): object =>
    description ? { $description: description, $type: type, $value: value } : { $type: type, $value: value };
  const role: Record<Theme, Record<string, Record<string, object>>> = { dark: {}, light: {} };
  for (const theme of THEMES) {
    for (const [name, hex] of Object.entries(r.roles[theme])) {
      const [group, key] = name.split('.') as [string, string];
      const groupTokens = (role[theme][group] ??= {});
      groupTokens[key] = tok('color', hex);
    }
  }
  const viz = Object.fromEntries(
    THEMES.map(theme => {
      const v = r.viz[theme];
      return [
        theme,
        {
          categorical: Object.fromEntries(v.categorical.map((hex, i) => [String(i + 1), tok('color', hex)])),
          diverging: Object.fromEntries(Object.entries(v.diverging).map(([k, hex]) => [k, tok('color', hex)])),
          sequential: Object.fromEntries(
            v.sequential.map((hex, i) => [SEQUENCE_STEPS(v.sequential.length)[i], tok('color', hex)]),
          ),
        },
      ];
    }),
  );
  return {
    $description: 'KillB design tokens. Generated from tokens/source.json; do not edit.',
    breakpoint: Object.fromEntries(Object.entries(s.breakpoint).map(([k, v]) => [k, tok('dimension', px(v))])),
    color: {
      palette: Object.fromEntries(
        Object.entries(r.palette).map(([scale, steps]) => [
          scale,
          Object.fromEntries(Object.entries(steps).map(([step, c]) => [step, tok('color', c.hex, c.oklch)])),
        ]),
      ),
      role,
      viz,
    },
    elevation: Object.fromEntries(
      Object.entries(s.elevation).map(([n, themes]) => [
        n,
        {
          $extensions: { 'com.killb.themes': { dark: shadowDtcg(themes.dark) } },
          $type: 'shadow',
          $value: shadowDtcg(themes.light),
        },
      ]),
    ),
    layout: {
      columns: tok('number', s.layout.columns),
      gutter: Object.fromEntries(Object.entries(s.layout.gutter).map(([k, v]) => [k, tok('dimension', px(v))])),
      margin: Object.fromEntries(Object.entries(s.layout.margin).map(([k, v]) => [k, tok('dimension', px(v))])),
      maxWidth: Object.fromEntries(Object.entries(s.layout.maxWidth).map(([k, v]) => [k, tok('dimension', px(v))])),
    },
    motion: {
      duration: Object.fromEntries(Object.entries(s.motion.duration).map(([k, v]) => [k, tok('duration', `${v}ms`)])),
      easing: Object.fromEntries(Object.entries(s.motion.easing).map(([k, v]) => [k, tok('cubicBezier', v)])),
    },
    radius: Object.fromEntries(Object.entries(s.radius).map(([k, v]) => [k, tok('dimension', px(v))])),
    space: Object.fromEntries(s.space.map(v => [String(v), tok('dimension', px(v))])),
    typography: {
      family: Object.fromEntries(Object.entries(s.typography.family).map(([k, v]) => [k, tok('fontFamily', v)])),
      feature: Object.fromEntries(Object.entries(s.typography.feature).map(([k, v]) => [k, tok('other', v)])),
      scale: Object.fromEntries(
        Object.entries(s.typography.scale).map(([step, t]) => [
          step,
          {
            fontSize: tok('dimension', px(fontSize(s, t.n)), `${s.typography.base} x ${s.typography.ratio}^${t.n}`),
            letterSpacing: tok('dimension', `${t.letterSpacing}em`),
            lineHeight: tok('dimension', px(t.lineHeight)),
          },
        ]),
      ),
      weight: Object.fromEntries(Object.entries(s.typography.weight).map(([k, v]) => [k, tok('fontWeight', v)])),
    },
  };
}

function themedVars(r: Resolved, theme: Theme): string[] {
  const v = r.viz[theme];
  return [
    ...Object.entries(r.roles[theme]).map(([name, hex]) => `--kb-${dash(name)}: ${hex};`),
    ...v.categorical.map((hex, i) => `--kb-viz-${i + 1}: ${hex};`),
    ...v.sequential.map((hex, i) => `--kb-viz-seq-${i + 1}: ${hex};`),
    ...Object.entries(v.diverging).map(([k, hex]) => `--kb-viz-div-${k}: ${hex};`),
    ...Object.entries(r.source.elevation).map(([n, t]) => `--kb-elevation-${n}: ${shadowCss(t[theme])};`),
  ];
}

export function tokensCss(r: Resolved): string {
  const s = r.source;
  const block = (selector: string, lines: string[]): string =>
    `${selector} {\n${lines.map(l => `  ${l}`).join('\n')}\n}\n`;
  const faces = FONT_FILES.map(
    f =>
      `@font-face {\n  font-family: "${f.family}";\n  src: url("../fonts/${f.file}") format("woff2");\n  font-weight: ${f.weight};\n  font-style: normal;\n  font-display: swap;\n}\n`,
  );
  const root = [
    ...Object.entries(r.palette).flatMap(([scale, steps]) =>
      Object.entries(steps).map(([step, c]) => `--kb-${scale}-${step}: ${c.hex};`),
    ),
    ...themedVars(r, 'light'),
    ...Object.entries(s.typography.family).map(([k, v]) => `--kb-font-${k}: ${stack(v)};`),
    ...Object.entries(s.typography.scale).flatMap(([step, t]) => [
      `--kb-font-size-${step}: ${px(fontSize(s, t.n))};`,
      `--kb-line-height-${step}: ${px(t.lineHeight)};`,
      `--kb-letter-spacing-${step}: ${t.letterSpacing}em;`,
    ]),
    ...Object.entries(s.typography.weight).map(([k, v]) => `--kb-font-weight-${k}: ${v};`),
    ...Object.entries(s.typography.feature).map(([k, v]) => `--kb-font-feature-${k}: ${v};`),
    ...s.space.map(v => `--kb-space-${v}: ${px(v)};`),
    ...Object.entries(s.radius).map(([k, v]) => `--kb-radius-${k}: ${px(v)};`),
    ...Object.entries(s.motion.duration).map(([k, v]) => `--kb-duration-${k}: ${v}ms;`),
    ...Object.entries(s.motion.easing).map(([k, v]) => `--kb-ease-${k}: cubic-bezier(${v.join(', ')});`),
    ...Object.entries(s.layout.maxWidth).map(([k, v]) => `--kb-width-${k}: ${px(v)};`),
  ];
  return [
    '/* KillB design tokens. Generated from tokens/source.json; do not edit. */\n',
    ...faces,
    block(':root', root),
    block('[data-theme="dark"]', themedVars(r, 'dark')),
  ].join('\n');
}

/** MUI shadows: elevation 1 to 4 sit on indexes 1, 4, 8 and 16; the indexes between repeat the level below. */
const MUI_LEVEL_STARTS = [0, 1, 4, 8, 16];

function muiOptions(r: Resolved, theme: Theme): object {
  const s = r.source;
  const role = r.roles[theme];
  const pick = (name: string): string => role[name]!;
  const status = (name: string): object => ({
    contrastText: pick(`${name}.on-fill`),
    dark: pick(`${name}.fg`),
    light: pick(`${name}.subtle`),
    main: pick(`${name}.fill`),
  });
  const level = (index: number): number => MUI_LEVEL_STARTS.findLastIndex(start => index >= start);
  const shadows = Array.from({ length: 25 }, (_, i) => shadowCss(s.elevation[String(level(i))]![theme]));
  const t = (step: string, family: string, weight: number): object => {
    const scale = s.typography.scale[step]!;
    return {
      fontFamily: stack(s.typography.family[family]!),
      fontSize: px(fontSize(s, scale.n)),
      fontWeight: weight,
      letterSpacing: `${scale.letterSpacing}em`,
      lineHeight: px(scale.lineHeight),
    };
  };
  const w = s.typography.weight as Record<'bold' | 'medium' | 'regular', number>;
  return {
    breakpoints: {
      values: { lg: s.breakpoint.lg, md: s.breakpoint.md, sm: s.breakpoint.sm, xl: s.breakpoint.xl, xs: 0 },
    },
    palette: {
      background: { default: pick('surface.canvas'), paper: pick('surface.default') },
      divider: pick('border.subtle'),
      error: status('error'),
      info: status('info'),
      mode: theme,
      primary: {
        contrastText: pick('brand.on-fill'),
        dark: pick('brand.fill-pressed'),
        light: pick('brand.fill-hover'),
        main: pick('brand.fill'),
      },
      secondary: { contrastText: pick('text.inverse'), main: pick('surface.inverse') },
      success: status('success'),
      text: { disabled: pick('text.disabled'), primary: pick('text.primary'), secondary: pick('text.secondary') },
      warning: status('warning'),
    },
    shadows,
    shape: { borderRadius: s.radius.sm },
    typography: {
      body1: t('md', 'text', w.regular),
      body2: t('xs', 'text', w.regular),
      button: { ...t('md', 'text', w.medium), textTransform: 'none' },
      caption: t('xs', 'text', w.regular),
      fontFamily: stack(s.typography.family.text!),
      fontWeightBold: w.bold,
      fontWeightLight: w.regular,
      fontWeightMedium: w.medium,
      fontWeightRegular: w.regular,
      h1: t('5xl', 'display', w.regular),
      h2: t('4xl', 'display', w.regular),
      h3: t('3xl', 'display', w.regular),
      h4: t('2xl', 'display', w.medium),
      h5: t('xl', 'display', w.medium),
      h6: t('lg', 'text', w.medium),
      overline: { ...t('xs', 'text', w.medium), letterSpacing: '0.06em', textTransform: 'uppercase' },
      subtitle1: t('md', 'text', w.medium),
      subtitle2: t('xs', 'text', w.medium),
    },
  };
}

export function muiJs(r: Resolved): string {
  const json = (o: object): string => JSON.stringify(o, null, 2);
  return [
    '// KillB MUI theme options. Generated from tokens/source.json; do not edit.',
    '// Usage: createTheme(lightThemeOptions) or createTheme(darkThemeOptions).',
    `export const lightThemeOptions = ${json(muiOptions(r, 'light'))};`,
    `export const darkThemeOptions = ${json(muiOptions(r, 'dark'))};`,
    '',
  ].join('\n');
}

export const MUI_DTS = [
  "import type { ThemeOptions } from '@mui/material/styles';",
  '',
  'export declare const lightThemeOptions: ThemeOptions;',
  'export declare const darkThemeOptions: ThemeOptions;',
  '',
].join('\n');

export function mintlifyJson(r: Resolved): object {
  return {
    colors: {
      dark: r.roles.light['text.brand'],
      light: r.roles.dark['text.brand'],
      primary: r.roles.light['text.brand'],
    },
    fonts: {
      body: { family: r.source.typography.family.text![0] },
      heading: { family: r.source.typography.family.display![0] },
    },
  };
}
