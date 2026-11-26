import { contrast, CVD, oklabDistance, simulate, type Vision } from './color.ts';
import { type Resolved, type Theme, THEMES } from './source.ts';

export const TEXT_FLOOR = 4.5;
export const UI_FLOOR = 3;
export const CVD_FLOOR = 0.1;

const SURFACES: Record<Theme, string[]> = {
  dark: ['surface.canvas', 'surface.default', 'surface.raised'],
  light: ['surface.canvas', 'surface.default', 'surface.sunken'],
};
const TEXT_ROLES = ['text.primary', 'text.secondary', 'text.brand', 'text.link'];
const STATUSES = ['success', 'warning', 'error', 'info'];
const UI_ROLES = ['border.strong', 'focus.ring'];
const CHART_GROUNDS: Record<Theme, string[]> = {
  dark: ['neutral.900', 'neutral.950'],
  light: ['#FFFFFF', 'neutral.50'],
};

/** Roles never checked: disabled text is exempt in WCAG, subtle borders are decorative. */
export const EXEMPT_ROLES = ['text.disabled', 'border.subtle'];

export interface Pair {
  background: string;
  floor: number;
  foreground: string;
  theme: Theme;
}

/** The checked pairs listed in the Spec's Contract: 44 role pairs and 10 chart pairs per theme. */
export function checkedPairs(): Pair[] {
  const pairs: Pair[] = [];
  for (const theme of THEMES) {
    const add = (foreground: string, background: string, floor: number): void => {
      pairs.push({ background, floor, foreground, theme });
    };
    for (const surface of SURFACES[theme]) {
      for (const role of TEXT_ROLES) add(role, surface, TEXT_FLOOR);
      for (const status of STATUSES) add(`${status}.fg`, surface, TEXT_FLOOR);
      for (const role of UI_ROLES) add(role, surface, UI_FLOOR);
    }
    for (const status of STATUSES) {
      add(`${status}.fg`, `${status}.subtle`, TEXT_FLOOR);
      add(`${status}.on-fill`, `${status}.fill`, TEXT_FLOOR);
    }
    add('brand.on-fill', 'brand.fill', TEXT_FLOOR);
    add('brand.on-fill', 'brand.fill-hover', TEXT_FLOOR);
    add('brand.on-fill', 'brand.fill-pressed', TEXT_FLOOR);
    add('text.inverse', 'surface.inverse', TEXT_FLOOR);
    add('text.primary', 'brand.subtle', TEXT_FLOOR);
    add('text.secondary', 'brand.subtle', TEXT_FLOOR);
    for (let i = 1; i <= 5; i += 1) {
      for (const ground of CHART_GROUNDS[theme]) add(`viz-${i}`, ground, UI_FLOOR);
    }
  }
  return pairs;
}

export interface ContrastResult extends Pair {
  backgroundHex: string;
  foregroundHex: string;
  ok: boolean;
  ratio: number;
}

function colorOf(resolved: Resolved, theme: Theme, name: string): string {
  if (name.startsWith('#')) return name.toUpperCase();
  const viz = /^viz-(\d)$/.exec(name);
  if (viz) return resolved.viz[theme].categorical[Number(viz[1]) - 1] ?? '';
  const role = resolved.roles[theme][name];
  if (role) return role;
  const [scale, step] = name.split('.') as [string, string];
  return resolved.palette[scale]?.[step]?.hex ?? '';
}

export function contrastReport(resolved: Resolved): ContrastResult[] {
  return checkedPairs().map(pair => {
    const foregroundHex = colorOf(resolved, pair.theme, pair.foreground);
    const backgroundHex = colorOf(resolved, pair.theme, pair.background);
    const ratio = contrast(foregroundHex, backgroundHex);
    return { ...pair, backgroundHex, foregroundHex, ok: ratio >= pair.floor, ratio };
  });
}

export const describeContrast = (r: ContrastResult): string =>
  `${r.theme}: ${r.foreground} ${r.foregroundHex} on ${r.background} ${r.backgroundHex} is ${r.ratio.toFixed(2)}:1, needs ${r.floor}:1`;

export interface Separation {
  a: number;
  b: number;
  distance: number;
  theme: Theme;
  vision: Vision;
}

/** The closest pair of categorical series for each theme and vision. */
export function separations(resolved: Resolved): Separation[] {
  const out: Separation[] = [];
  for (const theme of THEMES) {
    const series = resolved.viz[theme].categorical;
    for (const vision of Object.keys(CVD) as Vision[]) {
      let worst: Separation | undefined;
      for (let i = 0; i < series.length; i += 1) {
        for (let j = i + 1; j < series.length; j += 1) {
          const distance = oklabDistance(simulate(series[i]!, vision), simulate(series[j]!, vision));
          if (!worst || distance < worst.distance) worst = { a: i + 1, b: j + 1, distance, theme, vision };
        }
      }
      if (worst) out.push(worst);
    }
  }
  return out;
}

export const describeSeparation = (s: Separation): string =>
  `${s.theme}: viz-${s.a} and viz-${s.b} are ${s.distance.toFixed(3)} apart under ${s.vision}, needs ${CVD_FLOOR}`;

/** Every failure, as one readable line each. Empty means the tokens pass. */
export function failures(resolved: Resolved): string[] {
  return [
    ...contrastReport(resolved)
      .filter(r => !r.ok)
      .map(r => `contrast ${describeContrast(r)}`),
    ...separations(resolved)
      .filter(s => s.distance < CVD_FLOOR)
      .map(s => `color-blind ${describeSeparation(s)}`),
  ];
}
