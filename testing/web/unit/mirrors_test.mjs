import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const { orderMirrors, updateMirrorStat } = require('../../../web/js/core/utils.js');

describe('orderMirrors', () => {
  it('keeps the listed order when nothing has been measured', () => {
    assert.deepEqual(orderMirrors(['a', 'b', 'c'], {}), ['a', 'b', 'c']);
    assert.deepEqual(orderMirrors(['a', 'b'], null), ['a', 'b']);
  });

  it('puts the fastest measured mirror first', () => {
    assert.deepEqual(orderMirrors(['a', 'b', 'c'], { a: 1500, b: 600, c: 900 }), ['b', 'c', 'a']);
  });

  it('tries measured mirrors before unmeasured ones, which keep their order', () => {
    assert.deepEqual(orderMirrors(['a', 'b', 'c'], { c: 2000 }), ['c', 'a', 'b']);
  });

  it('does not change the list it was given', () => {
    const urls = ['a', 'b'];
    orderMirrors(urls, { b: 1 });
    assert.deepEqual(urls, ['a', 'b']);
  });
});

describe('updateMirrorStat', () => {
  it('stores the first sample as is', () => {
    assert.deepEqual(updateMirrorStat({}, 'a', 800), { a: 800 });
  });

  it('smooths later samples (60% old, 40% new) without touching other mirrors', () => {
    const stats = updateMirrorStat({ a: 1000, b: 500 }, 'a', 2000);
    assert.deepEqual(stats, { a: 1400, b: 500 });
  });
});
