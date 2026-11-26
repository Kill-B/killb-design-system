import { hexToOklch, oklchToHex } from './color.ts';

export type Theme = 'dark' | 'light';
export const THEMES: readonly Theme[] = ['light', 'dark'];

type Step = { c: number; h: number; l: number } | { hex: string };
type ShadowLayer = { blur: number; color: string; spread: number; y: number };

export interface Source {
  elevation: Record<string, Record<Theme, ShadowLayer[]>>;
  layout: {
    columns: number;
    gutter: Record<string, number>;
    margin: Record<string, number>;
    maxWidth: Record<string, number>;
  };
  motion: { duration: Record<string, number>; easing: Record<string, [number, number, number, number]> };
  palette: Record<string, Record<string, Step>>;
  radius: Record<string, number>;
  roles: Record<string, Record<Theme, string>>;
  space: number[];
  breakpoint: Record<string, number>;
  typography: {
    base: number;
    family: Record<string, string[]>;
    feature: Record<string, string>;
    ratio: number;
    scale: Record<string, { letterSpacing: number; lineHeight: number; n: number }>;
    weight: Record<string, number>;
  };
  viz: Record<Theme, { categorical: string[]; diverging: Record<string, string>; sequential: string[] }>;
}

export interface PaletteColor {
  hex: string;
  oklch: string;
}

export interface Resolved {
  palette: Record<string, Record<string, PaletteColor>>;
  roles: Record<Theme, Record<string, string>>;
  source: Source;
  viz: Record<Theme, { categorical: string[]; diverging: Record<string, string>; sequential: string[] }>;
}

export class SourceError extends Error {
  readonly problems: string[];

  constructor(problems: string[]) {
    super(`Token source is invalid:\n${problems.map(p => `  - ${p}`).join('\n')}`);
    this.problems = problems;
  }
}

const HEX = /^#[0-9A-Fa-f]{6}$/;

function stepProblems(name: string, step: Step): string[] {
  if ('hex' in step) return HEX.test(step.hex) ? [] : [`${name}: "${step.hex}" is not a #RRGGBB color`];
  const out: string[] = [];
  if (!(Number.isFinite(step.l) && step.l >= 0 && step.l <= 1))
    out.push(`${name}: OKLCH lightness ${step.l} is outside 0..1`);
  if (!(Number.isFinite(step.c) && step.c >= 0 && step.c <= 0.4))
    out.push(`${name}: OKLCH chroma ${step.c} is outside 0..0.4`);
  if (!(Number.isFinite(step.h) && step.h >= 0 && step.h < 360))
    out.push(`${name}: OKLCH hue ${step.h} is outside 0..360`);
  return out;
}

/** Checks the source and returns every problem at once, each naming the token. */
export function validate(source: Source): string[] {
  const problems: string[] = [];
  for (const [scale, steps] of Object.entries(source.palette ?? {})) {
    for (const [step, value] of Object.entries(steps))
      problems.push(...stepProblems(`palette ${scale}.${step}`, value));
  }
  const ref = (where: string, value: unknown): void => {
    if (typeof value !== 'string') {
      problems.push(`${where}: missing value`);
      return;
    }
    if (HEX.test(value)) return;
    const [scale, step] = value.split('.');
    if (!scale || !step || !source.palette?.[scale]?.[step]) {
      problems.push(`${where}: "${value}" is not a palette step`);
    }
  };
  for (const [role, themes] of Object.entries(source.roles ?? {})) {
    for (const theme of THEMES) {
      if (!themes || !(theme in themes)) problems.push(`role ${role}: no ${theme} value`);
      else ref(`role ${role} (${theme})`, themes[theme]);
    }
  }
  for (const theme of THEMES) {
    const viz = source.viz?.[theme];
    if (!viz) {
      problems.push(`viz: no ${theme} palette`);
      continue;
    }
    viz.categorical.forEach((v, i) => {
      if (!HEX.test(v)) problems.push(`viz ${theme} categorical ${i + 1}: "${v}" is not a #RRGGBB color`);
    });
    viz.sequential.forEach((v, i) => ref(`viz ${theme} sequential ${i + 1}`, v));
    for (const [k, v] of Object.entries(viz.diverging)) ref(`viz ${theme} diverging ${k}`, v);
  }
  return problems;
}

const fmt = (n: number, d: number): string => n.toFixed(d);

export function resolve(source: Source): Resolved {
  const problems = validate(source);
  if (problems.length > 0) throw new SourceError(problems);
  const palette: Resolved['palette'] = {};
  for (const [scale, steps] of Object.entries(source.palette)) {
    palette[scale] = {};
    for (const [step, value] of Object.entries(steps)) {
      if ('hex' in value) {
        const [l, c, h] = hexToOklch(value.hex);
        palette[scale][step] = { hex: value.hex.toUpperCase(), oklch: `oklch(${fmt(l, 3)} ${fmt(c, 3)} ${fmt(h, 0)})` };
      } else {
        const { chroma, hex } = oklchToHex(value.l, value.c, value.h);
        palette[scale][step] = { hex, oklch: `oklch(${fmt(value.l, 3)} ${fmt(chroma, 3)} ${fmt(value.h, 0)})` };
      }
    }
  }
  const color = (value: string): string => {
    if (HEX.test(value)) return value.toUpperCase();
    const [scale, step] = value.split('.') as [string, string];
    return palette[scale]![step]!.hex;
  };
  const roles = { dark: {}, light: {} } as Resolved['roles'];
  for (const [role, themes] of Object.entries(source.roles)) {
    for (const theme of THEMES) roles[theme][role] = color(themes[theme]);
  }
  const viz = {} as Resolved['viz'];
  for (const theme of THEMES) {
    const v = source.viz[theme];
    viz[theme] = {
      categorical: v.categorical.map(x => x.toUpperCase()),
      diverging: Object.fromEntries(Object.entries(v.diverging).map(([k, x]) => [k, color(x)])),
      sequential: v.sequential.map(color),
    };
  }
  return { palette, roles, source, viz };
}

export const fontSize = (source: Source, n: number): number =>
  Math.round(source.typography.base * source.typography.ratio ** n);
