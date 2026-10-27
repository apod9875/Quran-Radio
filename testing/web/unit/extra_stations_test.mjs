// The pinned radio channels: unique ids, both languages, https mirrors, Bahrain on audio-only HLS.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

globalThis.window = {};
await import('../../../web/js/app/extra-stations.js');
const channels = globalThis.window.QR_EXTRA_STATIONS;

describe('QR_EXTRA_STATIONS', () => {
  it('has the five channels with unique ids', () => {
    assert.deepEqual(channels.map((c) => c.id), [900001, 900002, 900003, 900004, 900005]);
  });

  it('names every channel in Arabic and English and streams over https', () => {
    for (const c of channels) {
      assert.ok(c.names.ar && c.names.eng, `${c.id} names`);
      assert.ok(c.mirrors.length >= 1 && c.mirrors.every((u) => u.startsWith('https://')), `${c.id} mirrors`);
    }
  });

  it('plays Bahrain as audio-only HLS with a second path to fail over to', () => {
    const bahrain = channels.find((c) => c.id === 900005);
    assert.equal(bahrain.format, 'hls');
    assert.equal(bahrain.audioOnly, true);
    assert.equal(bahrain.mirrors.length, 2);
  });
});
