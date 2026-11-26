// Fails when an Inter file lacks the OpenType features amounts rely on (tabular figures, slashed zero).
// Usage: node scripts/check-fonts.ts <fonts dir>
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { missingFeatures } from '../src/fonts.ts';

const dir = process.argv[2] ?? 'fonts';
const files = readdirSync(dir).filter(f => /^Inter-.*\.woff2$/.test(f));
if (files.length === 0) {
  console.error(`No Inter woff2 files in ${dir}.`);
  process.exit(1);
}
let failed = false;
for (const file of files) {
  const missing = missingFeatures(readFileSync(join(dir, file)));
  if (missing.length > 0) {
    failed = true;
    console.error(`${file}: missing OpenType feature(s) ${missing.join(', ')}`);
  } else {
    console.log(`${file}: tnum and zero present`);
  }
}
process.exit(failed ? 1 : 0);
