/**
 * HTTP Range handling for cached audio. parseRange is pure so it can be unit tested.
 * Returns { start, end } for a satisfiable range, null when unsatisfiable (416),
 * and undefined when the header is malformed and should be ignored.
 */
function parseRange(header, total) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(header || '').trim());
  if (!match || (match[1] === '' && match[2] === '')) return undefined;

  if (match[1] === '') {
    const suffix = parseInt(match[2], 10);
    if (!suffix) return null;
    return { start: Math.max(0, total - suffix), end: total - 1 };
  }

  const start = parseInt(match[1], 10);
  const end = match[2] === '' ? total - 1 : Math.min(parseInt(match[2], 10), total - 1);
  if (start >= total || end < start) return null;
  return { start, end };
}

// Turn a cached 200 response into the 206 the media element asked for.
async function createPartialResponse(cachedResponse, rangeHeader) {
  const buffer = await cachedResponse.arrayBuffer();
  const total = buffer.byteLength;
  const type = cachedResponse.headers.get('Content-Type') || 'audio/mpeg';
  const range = parseRange(rangeHeader, total);

  if (range === undefined) {
    return new Response(buffer, {
      status: 200,
      headers: { 'Content-Type': type, 'Content-Length': String(total), 'Accept-Ranges': 'bytes' }
    });
  }
  if (range === null) {
    return new Response('', {
      status: 416,
      statusText: 'Range Not Satisfiable',
      headers: { 'Content-Range': `bytes */${total}` }
    });
  }

  const chunk = buffer.slice(range.start, range.end + 1);
  return new Response(chunk, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': type,
      'Content-Range': `bytes ${range.start}-${range.end}/${total}`,
      'Content-Length': String(chunk.byteLength),
      'Accept-Ranges': 'bytes'
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseRange, createPartialResponse };
}
