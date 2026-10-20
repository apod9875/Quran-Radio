// Release notes: every app version users get has notes in both languages.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import { WEB_ROOT } from '../helpers/static-server.mjs';

const require = createRequire(import.meta.url);
const { CACHE_STATIC } = require('../../../web/sw/config.js');
const { compareVersions } = require('../../../web/js/core/utils.js');

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(WEB_ROOT, 'js/app/releases.js'), 'utf8'), sandbox);
const releases = sandbox.window.QR_RELEASES;

describe('release notes', () => {
  it('have notes for the version being shipped (CACHE_STATIC)', () => {
    const shipped = /v(\d+\.\d+\.\d+)$/.exec(CACHE_STATIC)[1];
    assert.equal(releases[0].version, shipped, `add a release entry for ${shipped} in web/js/app/releases.js`);
  });

  it('are newest first, with unique versions and real dates', () => {
    for (let i = 1; i < releases.length; i++) {
      assert.equal(compareVersions(releases[i - 1].version, releases[i].version), 1, `${releases[i - 1].version} before ${releases[i].version}`);
    }
    releases.forEach((r) => assert.ok(!Number.isNaN(Date.parse(r.date)), `${r.version} date`));
  });

  it('say the same things in Arabic and English', () => {
    releases.forEach((r) => {
      assert.ok(r.ar.length > 0, `${r.version} has notes`);
      assert.equal(r.ar.length, r.eng.length, `${r.version}: as many Arabic as English lines`);
      [...r.ar, ...r.eng].forEach((line) => assert.ok(line.trim().length > 5));
    });
  });
});

describe('compareVersions', () => {
  it('compares number by number', () => {
    assert.equal(compareVersions('3.10.0', '3.9.1'), 1);
    assert.equal(compareVersions('3.7.0', '3.7.0'), 0);
    assert.equal(compareVersions('3.6', '3.6.1'), -1);
  });
});
