import { brotliDecompressSync } from 'node:zlib';

// WOFF2 known-table tags, by index (W3C WOFF2 §5.1).
const KNOWN_TAGS = [
  'cmap',
  'head',
  'hhea',
  'hmtx',
  'maxp',
  'name',
  'OS/2',
  'post',
  'cvt ',
  'fpgm',
  'glyf',
  'loca',
  'prep',
  'CFF ',
  'VORG',
  'EBDT',
  'EBLC',
  'gasp',
  'hdmx',
  'kern',
  'LTSH',
  'PCLT',
  'VDMX',
  'vhea',
  'vmtx',
  'BASE',
  'GDEF',
  'GPOS',
  'GSUB',
  'EBSC',
  'JSTF',
  'MATH',
  'CBDT',
  'CBLC',
  'COLR',
  'CPAL',
  'SVG ',
  'sbix',
  'acnt',
  'avar',
  'bdat',
  'bloc',
  'bsln',
  'cvar',
  'fdsc',
  'feat',
  'fmtx',
  'fvar',
  'gvar',
  'hsty',
  'just',
  'lcar',
  'mort',
  'morx',
  'opbd',
  'prop',
  'trak',
  'Zapf',
  'Silf',
  'Glat',
  'Gloc',
  'Feat',
  'Sill',
];

interface Entry {
  length: number;
  tag: string;
}

function readBase128(buf: Buffer, at: number): [number, number] {
  let value = 0;
  for (let i = 0; i < 5; i += 1) {
    const byte = buf[at + i];
    if (byte === undefined || (i === 0 && byte === 0x80)) throw new Error('Invalid WOFF2 UIntBase128');
    value = value * 128 + (byte & 0x7f);
    if ((byte & 0x80) === 0) return [value, at + i + 1];
  }
  throw new Error('Invalid WOFF2 UIntBase128');
}

/** Returns the raw bytes of one table from a WOFF2 file, or undefined when the font has no such table. */
export function woff2Table(file: Buffer, wanted: string): Buffer | undefined {
  if (file.toString('latin1', 0, 4) !== 'wOF2') throw new Error('Not a WOFF2 file');
  if (file.toString('latin1', 4, 8) === 'ttcf') throw new Error('WOFF2 font collections are not supported');
  const numTables = file.readUInt16BE(12);
  let at = 48;
  const entries: Entry[] = [];
  for (let i = 0; i < numTables; i += 1) {
    const flags = file[at]!;
    at += 1;
    let tag = KNOWN_TAGS[flags & 0x3f];
    if ((flags & 0x3f) === 63) {
      tag = file.toString('latin1', at, at + 4);
      at += 4;
    }
    const version = (flags >> 6) & 3;
    let origLength: number;
    [origLength, at] = readBase128(file, at);
    let length = origLength;
    const transformed = tag === 'glyf' || tag === 'loca' ? version === 0 : version !== 0;
    if (transformed) [length, at] = readBase128(file, at);
    entries.push({ length, tag: tag ?? '' });
  }
  const totalCompressed = file.readUInt32BE(20);
  const data = brotliDecompressSync(file.subarray(at, at + totalCompressed));
  let offset = 0;
  for (const entry of entries) {
    if (entry.tag === wanted) return data.subarray(offset, offset + entry.length);
    offset += entry.length;
  }
  return undefined;
}

/** OpenType feature tags listed in a font's GSUB table. */
export function gsubFeatures(file: Buffer): Set<string> {
  const gsub = woff2Table(file, 'GSUB');
  if (!gsub) return new Set();
  const list = gsub.readUInt16BE(6);
  const count = gsub.readUInt16BE(list);
  const tags = new Set<string>();
  for (let i = 0; i < count; i += 1) tags.add(gsub.toString('latin1', list + 2 + i * 6, list + 6 + i * 6));
  return tags;
}

export const AMOUNT_FEATURES = ['tnum', 'zero'];

/** Feature tags a font must carry but doesn't. */
export const missingFeatures = (file: Buffer, required: string[] = AMOUNT_FEATURES): string[] => {
  const present = gsubFeatures(file);
  return required.filter(tag => !present.has(tag));
};
