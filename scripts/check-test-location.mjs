// Fails when a test file or test folder lives anywhere except the root testing/ folder.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', '.git', '.gradle', 'build', '.kotlin', 'testing', '.aistudio']);
const TEST_DIR_NAMES = new Set(['__tests__', '__mocks__', '__snapshots__', 'androidTest']);
const TEST_FILE = /(_test|\.test|\.spec)\.[a-z0-9]+$|(Test|Tests)\.kt$/;

const offenders = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replaceAll('\\', '/');
    if (entry.isDirectory()) {
      const isKotlinTestRoot = rel.endsWith('src/test');
      if (TEST_DIR_NAMES.has(entry.name) || isKotlinTestRoot) offenders.push(`${rel}/ (test folder)`);
      else walk(full);
    } else if (TEST_FILE.test(entry.name)) {
      offenders.push(rel);
    }
  }
}

walk(root);

if (offenders.length) {
  console.error(`Tests must live under testing/. Move these:\n  ${offenders.join('\n  ')}`);
  process.exit(1);
}
console.log('check-test-location: no test files outside testing/.');
