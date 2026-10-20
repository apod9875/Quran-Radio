import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const { parseRange, createPartialResponse } = require('../../../web/sw/range.js');

describe('parseRange', () => {
  it('reads closed, open-ended and suffix ranges', () => {
    assert.deepEqual(parseRange('bytes=0-99', 1000), { start: 0, end: 99 });
    assert.deepEqual(parseRange('bytes=900-', 1000), { start: 900, end: 999 });
    assert.deepEqual(parseRange('bytes=-100', 1000), { start: 900, end: 999 });
  });

  it('clamps an end beyond the file instead of failing', () => {
    assert.deepEqual(parseRange('bytes=500-5000', 1000), { start: 500, end: 999 });
    assert.deepEqual(parseRange('bytes=-5000', 1000), { start: 0, end: 999 });
  });

  it('reports unsatisfiable ranges as null', () => {
    assert.equal(parseRange('bytes=1000-', 1000), null);
    assert.equal(parseRange('bytes=900-100', 1000), null);
    assert.equal(parseRange('bytes=-0', 1000), null);
  });

  it('ignores malformed headers', () => {
    assert.equal(parseRange('bytes=', 1000), undefined);
    assert.equal(parseRange('items=0-5', 1000), undefined);
    assert.equal(parseRange('', 1000), undefined);
  });
});

describe('createPartialResponse', () => {
  const source = () => new Response(Uint8Array.from({ length: 100 }, (_, i) => i), {
    headers: { 'Content-Type': 'audio/mpeg' }
  });

  it('answers 206 with the right slice and headers', async () => {
    const res = await createPartialResponse(source(), 'bytes=10-19');
    assert.equal(res.status, 206);
    assert.equal(res.headers.get('Content-Range'), 'bytes 10-19/100');
    assert.equal(res.headers.get('Content-Length'), '10');
    assert.deepEqual([...new Uint8Array(await res.arrayBuffer())], [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it('supports suffix ranges and clamps the end', async () => {
    const suffix = await createPartialResponse(source(), 'bytes=-3');
    assert.deepEqual([...new Uint8Array(await suffix.arrayBuffer())], [97, 98, 99]);
    const clamped = await createPartialResponse(source(), 'bytes=98-500');
    assert.equal(clamped.headers.get('Content-Range'), 'bytes 98-99/100');
  });

  it('answers 416 when the range starts past the end', async () => {
    const res = await createPartialResponse(source(), 'bytes=100-');
    assert.equal(res.status, 416);
    assert.equal(res.headers.get('Content-Range'), 'bytes */100');
  });

  it('answers the whole file for a malformed header', async () => {
    const res = await createPartialResponse(source(), 'garbage');
    assert.equal(res.status, 200);
    assert.equal((await res.arrayBuffer()).byteLength, 100);
  });
});
