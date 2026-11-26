import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { brotliCompressSync } from 'node:zlib';

import { missingFeatures } from '../src/fonts.ts';
import { ROOT, tempDir } from './helpers.ts';

/** A minimal WOFF2 with one GSUB table whose FeatureList holds the given tags. */
function fakeWoff2(tags: string[]): Buffer {
  const gsub = Buffer.alloc(10 + tags.length * 6);
  gsub.writeUInt16BE(1, 0);
  gsub.writeUInt16BE(8, 6);
  gsub.writeUInt16BE(tags.length, 8);
  tags.forEach((tag, i) => gsub.write(tag, 10 + i * 6, 'latin1'));
  const data = brotliCompressSync(gsub);
  const header = Buffer.alloc(48);
  header.write('wOF2', 0, 'latin1');
  header.write('\u0000\u0001\u0000\u0000', 4, 'latin1');
  header.writeUInt16BE(1, 12);
  header.writeUInt32BE(data.length, 20);
  const directory = Buffer.from([28, gsub.length]);
  return Buffer.concat([header, directory, data]);
}

describe('AC10: amount features in Inter', () => {
  it('the shipped Inter files carry tnum and zero', () => {
    const files = readdirSync(join(ROOT, 'fonts')).filter(f => f.startsWith('Inter-'));
    assert.equal(files.length, 3);
    for (const f of files) assert.deepEqual(missingFeatures(readFileSync(join(ROOT, 'fonts', f))), [], f);
  });
  it('the check fails for an Inter file without them', () => {
    const dir = tempDir('kb-fonts-');
    writeFileSync(join(dir, 'Inter-Regular.woff2'), fakeWoff2(['kern', 'liga']));
    const run = spawnSync(process.execPath, [join(ROOT, 'scripts/check-fonts.ts'), dir], { encoding: 'utf8' });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Inter-Regular\.woff2: missing OpenType feature\(s\) tnum, zero/);
  });
  it('the check passes for a file that has them', () => {
    assert.deepEqual(missingFeatures(fakeWoff2(['tnum', 'zero'])), []);
  });
});

describe('AC2: font licenses', () => {
  it('ships one OFL 1.1 text per family', () => {
    for (const family of ['Inter', 'SpaceGrotesk']) {
      const text = readFileSync(join(ROOT, 'fonts', `OFL-${family}.txt`), 'utf8');
      assert.match(text, /SIL OPEN FONT LICENSE Version 1\.1/);
    }
  });
});
