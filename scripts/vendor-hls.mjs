// Copies the hls.js light build (pinned in package.json) into web/vendor/, where the page loads it
// on demand for the HLS live stations. Run after changing the hls.js version: node scripts/vendor-hls.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'node_modules', 'hls.js', 'dist', 'hls.light.min.js');
const target = path.join(root, 'web', 'vendor', 'hls.light.min.js');
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', 'hls.js', 'package.json'), 'utf8'));

const code = fs.readFileSync(source, 'utf8').replace(/\n\/\/# sourceMappingURL=.*\s*$/, '\n');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `/* hls.js ${version} (light build), Apache-2.0, https://github.com/video-dev/hls.js */\n${code}`);
console.log(`vendored hls.js ${version} -> web/vendor/hls.light.min.js`);
