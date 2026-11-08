// Project lint rules. Exit 1 on any violation.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RULES = [
  { id: 'no-console', re: /\bconsole\.(log|debug)\(/, why: 'no debug logging in src', srcOnly: true },
  { id: 'no-var', re: /^\s*var\s/m, why: 'use const or let' },
  { id: 'no-only', re: /\b(test|describe|it)\.only\(/, why: 'focused tests skip the rest of the suite' },
];

function walk(dir) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.mjs') ? [p] : [];
  });
}

const problems = [];
for (const [root, files] of [['src', walk('src')], ['test', walk('test')]]) {
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const rule of RULES) {
      if (rule.srcOnly && root !== 'src') continue;
      if (rule.re.test(text)) problems.push(`${file}: ${rule.id} (${rule.why})`);
    }
  }
}
if (problems.length) {
  console.error(`lint error: ${problems.length} problem(s)\n${problems.join('\n')}`);
  process.exit(1);
}
