// Builds dist/ from tokens/source.json. Fails, writing nothing, when the source is invalid or a check fails.
// Usage: node scripts/build.ts [--source tokens/source.json] [--out dist]
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve as resolvePath } from 'node:path';
import { parseArgs } from 'node:util';

import { contrastReport, describeContrast, describeSeparation, failures, separations } from '../src/checks.ts';
import { mintlifyJson, MUI_DTS, muiJs, tokensCss, tokensJson } from '../src/emit.ts';
import { resolve, type Source, SourceError } from '../src/source.ts';

const { values } = parseArgs({
  options: { out: { default: 'dist', type: 'string' }, source: { default: 'tokens/source.json', type: 'string' } },
});
const out = resolvePath(values.out);

let resolved;
try {
  resolved = resolve(JSON.parse(readFileSync(values.source, 'utf8')) as Source);
} catch (error) {
  if (error instanceof SourceError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}

const problems = failures(resolved);
if (problems.length > 0) {
  console.error(`Build failed: ${problems.length} check(s) below the floor.`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const report = [
  '# Contrast report',
  '',
  ...contrastReport(resolved).map(r => `- ${describeContrast(r)}`),
  '',
  '# Color-blind separation',
  '',
  ...separations(resolved).map(s => `- ${describeSeparation(s)}`),
  '',
].join('\n');

const staging = mkdtempSync(join(dirname(out), '.dist-'));
try {
  writeFileSync(join(staging, 'tokens.json'), `${JSON.stringify(tokensJson(resolved), null, 2)}\n`);
  writeFileSync(join(staging, 'tokens.css'), tokensCss(resolved));
  writeFileSync(join(staging, 'mui.js'), muiJs(resolved));
  writeFileSync(join(staging, 'mui.d.ts'), MUI_DTS);
  writeFileSync(join(staging, 'mintlify.json'), `${JSON.stringify(mintlifyJson(resolved), null, 2)}\n`);
  writeFileSync(join(staging, 'contrast-report.md'), report);
  rmSync(out, { force: true, recursive: true });
  mkdirSync(dirname(out), { recursive: true });
  renameSync(staging, out);
} catch (error) {
  rmSync(staging, { force: true, recursive: true });
  throw error;
}
console.log(`Built ${out}: ${contrastReport(resolved).length} contrast pairs and the color-blind check pass.`);
