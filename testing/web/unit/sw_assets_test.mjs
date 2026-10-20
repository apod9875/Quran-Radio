// The service worker installs with cache.addAll(), so one missing file breaks the whole install.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import { WEB_ROOT } from '../helpers/static-server.mjs';

const require = createRequire(import.meta.url);
const { STATIC_ASSETS } = require('../../../web/sw/config.js');

const indexHtml = fs.readFileSync(path.join(WEB_ROOT, 'index.html'), 'utf8');
const exists = (relative) => fs.existsSync(path.join(WEB_ROOT, relative));

function referenced(pattern) {
  return [...indexHtml.matchAll(pattern)].map((match) => match[1]);
}

const scripts = referenced(/<script src="([^"]+)"/g);
const styles = referenced(/<link rel="stylesheet" href="([^"]+)"/g);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

describe('service worker assets', () => {
  it('lists only files that exist', () => {
    for (const asset of STATIC_ASSETS.filter((a) => a !== './')) {
      assert.ok(exists(asset.replace(/^\.\//, '')), `${asset} is in STATIC_ASSETS but missing on disk`);
    }
  });

  it('precaches every script and stylesheet the page loads', () => {
    for (const file of [...scripts, ...styles]) {
      assert.ok(exists(file), `index.html references ${file}, which does not exist`);
      assert.ok(STATIC_ASSETS.includes(`./${file}`), `${file} is loaded by index.html but not precached`);
    }
  });

  it('has no duplicate entries', () => {
    assert.equal(new Set(STATIC_ASSETS).size, STATIC_ASSETS.length);
  });

  it('has no orphan scripts or stylesheets', () => {
    const loaded = new Set([...scripts, ...styles]);
    for (const dir of ['js', 'css']) {
      for (const full of walk(path.join(WEB_ROOT, dir))) {
        const relative = path.relative(WEB_ROOT, full).replaceAll('\\', '/');
        assert.ok(loaded.has(relative), `${relative} exists but index.html never loads it`);
      }
    }
  });

  it('imports only files that exist', () => {
    const sw = fs.readFileSync(path.join(WEB_ROOT, 'sw.js'), 'utf8');
    const block = /importScripts\(([^)]*)\)/s.exec(sw)[1];
    const imports = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    assert.ok(imports.length >= 4);
    for (const file of imports) assert.ok(exists(file.replace(/^\.\//, '')), `sw.js imports missing ${file}`);
  });

  it('keeps the manifest icons on disk', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(WEB_ROOT, 'manifest.json'), 'utf8'));
    const purposes = new Set(manifest.icons.filter((i) => i.sizes === '512x512').map((i) => i.purpose));
    assert.ok(purposes.has('any'), 'manifest needs a 512x512 icon with purpose "any"');
    for (const icon of manifest.icons) assert.ok(exists(icon.src), `${icon.src} is missing`);
  });
});
