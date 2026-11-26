export type Lab = [number, number, number];
export type Rgb = [number, number, number];

const srgbToLinear = (c: number): number => (c <= 0.040_45 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c: number): number => (c <= 0.003_130_8 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map(x => x + x).join('') : h.slice(0, 6);
  return [0, 2, 4].map(i => Number.parseInt(full.slice(i, i + 2), 16) / 255) as Rgb;
}

const toByte = (c: number): string =>
  Math.round(Math.max(0, Math.min(1, c)) * 255)
    .toString(16)
    .toUpperCase()
    .padStart(2, '0');

export const rgbToHex = (rgb: Rgb): string => `#${rgb.map(toByte).join('')}`;

export function linearToOklab([r, g, b]: Rgb): Lab {
  const l = Math.cbrt(0.412_221_470_8 * r + 0.536_332_536_3 * g + 0.051_445_992_9 * b);
  const m = Math.cbrt(0.211_903_498_2 * r + 0.680_699_545_1 * g + 0.107_396_956_6 * b);
  const s = Math.cbrt(0.088_302_461_9 * r + 0.281_718_837_6 * g + 0.629_978_700_5 * b);
  return [
    0.210_454_255_3 * l + 0.793_617_785 * m - 0.004_072_046_8 * s,
    1.977_998_495_1 * l - 2.428_592_205 * m + 0.450_593_709_9 * s,
    0.025_904_037_1 * l + 0.782_771_766_2 * m - 0.808_675_766 * s,
  ];
}

function oklabToLinear([L, a, b]: Lab): Rgb {
  const l = (L + 0.396_337_777_4 * a + 0.215_803_757_3 * b) ** 3;
  const m = (L - 0.105_561_345_8 * a - 0.063_854_172_8 * b) ** 3;
  const s = (L - 0.089_484_177_5 * a - 1.291_485_548 * b) ** 3;
  return [
    4.076_741_662_1 * l - 3.307_711_591_3 * m + 0.230_969_929_2 * s,
    -1.268_438_004_6 * l + 2.609_757_401_1 * m - 0.341_319_396_5 * s,
    -0.004_196_086_3 * l - 0.703_418_614_7 * m + 1.707_614_701 * s,
  ];
}

export const hexToOklab = (hex: string): Lab => linearToOklab(hexToRgb(hex).map(srgbToLinear) as Rgb);

export function hexToOklch(hex: string): [number, number, number] {
  const [L, a, b] = hexToOklab(hex);
  return [L, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
}

const EPS = 1e-6;
const inGamut = (rgb: Rgb): boolean => rgb.every(x => x >= -EPS && x <= 1 + EPS);

function oklchToLinear(L: number, C: number, H: number): Rgb {
  const rad = (H * Math.PI) / 180;
  return oklabToLinear([L, C * Math.cos(rad), C * Math.sin(rad)]);
}

/** OKLCH to sRGB hex. Out-of-gamut colors keep L and H and lose chroma until they fit (40-step bisection). */
export function oklchToHex(L: number, C: number, H: number): { chroma: number; hex: string } {
  const exact = oklchToLinear(L, C, H);
  if (inGamut(exact)) return { chroma: C, hex: rgbToHex(exact.map(linearToSrgb) as Rgb) };
  let lo = 0;
  let hi = C;
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinear(L, mid, H))) lo = mid;
    else hi = mid;
  }
  const fitted = oklchToLinear(L, lo, H).map(x => linearToSrgb(Math.max(0, Math.min(1, x)))) as Rgb;
  return { chroma: lo, hex: rgbToHex(fitted) };
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio. Alpha is ignored: only opaque colors are checked. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Machado, Oliveira and Fernandes (2009), severity 1.0, applied in linear sRGB. */
export const CVD = {
  deuteranopia: [
    [0.367_322, 0.860_646, -0.227_968],
    [0.280_085, 0.672_501, 0.047_413],
    [-0.011_82, 0.042_94, 0.968_881],
  ],
  normal: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  protanopia: [
    [0.152_286, 1.052_583, -0.204_868],
    [0.114_503, 0.786_281, 0.099_216],
    [-0.003_882, -0.048_116, 1.051_998],
  ],
  tritanopia: [
    [1.255_528, -0.076_749, -0.178_779],
    [-0.078_411, 0.930_809, 0.147_602],
    [0.004_733, 0.691_367, 0.303_9],
  ],
} as const;

export type Vision = keyof typeof CVD;

export function simulate(hex: string, vision: Vision): Lab {
  const lin = hexToRgb(hex).map(srgbToLinear);
  const m: readonly (readonly number[])[] = CVD[vision];
  const out = m.map(row =>
    Math.max(
      0,
      Math.min(
        1,
        row.reduce((sum, k, i) => sum + k * (lin[i] ?? 0), 0),
      ),
    ),
  );
  return linearToOklab(out as Rgb);
}

export const oklabDistance = (a: Lab, b: Lab): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
