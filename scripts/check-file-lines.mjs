// Fails when a frontend source file (.js/.css under web/) is longer than the hard ceiling.
// Files above the target size are listed as warnings so they get split when touched.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(root, 'web');
const EXTENSIONS = new Set(['.js', '.css', '.ts', '.tsx', '.jsx', '.vue', '.svelte']);
const TARGET_LINES = 150;
const MAX_LINES = 200;

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (EXTENSIONS.has(path.extname(entry.name))) yield full;
  }
}

const tooLong = [];
const aboveTarget = [];
for (const file of walk(SOURCE_DIR)) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length - 1;
  const rel = path.relative(root, file).replaceAll('\\', '/');
  if (lines > MAX_LINES) tooLong.push(`${rel} (${lines} lines)`);
  else if (lines > TARGET_LINES) aboveTarget.push(`${rel} (${lines} lines)`);
}

if (aboveTarget.length) {
  console.warn(`Above the ${TARGET_LINES}-line target (allowed up to ${MAX_LINES}):\n  ${aboveTarget.join('\n  ')}`);
}
if (tooLong.length) {
  console.error(`Over the ${MAX_LINES}-line ceiling, split these files:\n  ${tooLong.join('\n  ')}`);
  process.exit(1);
}
console.log(`check-file-lines: all frontend files are within ${MAX_LINES} lines.`);
