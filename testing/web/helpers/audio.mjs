// Tiny audio fixtures: silent WAV files every Chromium build can decode, served with Range support.

// `seconds` of silence as 8 kHz mono 8-bit PCM
export function silentWav(seconds = 60) {
  const rate = 8000;
  const data = Buffer.alloc(Math.round(rate * seconds), 0x80);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

// Answer a Playwright route like a CDN: 206 for "Range: bytes=a-b", 200 for the whole file
export function fulfillWithRange(route, body, contentType = 'audio/wav') {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Accept-Ranges': 'bytes' };
  const match = /bytes=(\d*)-(\d*)/.exec(route.request().headers().range || '');
  if (!match || (match[1] === '' && match[2] === '')) {
    route.fulfill({ status: 200, contentType, headers: { ...headers, 'Content-Length': String(body.length) }, body });
    return;
  }
  const start = match[1] === '' ? Math.max(0, body.length - Number(match[2])) : Number(match[1]);
  const end = match[1] !== '' && match[2] !== '' ? Math.min(Number(match[2]), body.length - 1) : body.length - 1;
  const chunk = body.subarray(start, end + 1);
  route.fulfill({
    status: 206,
    contentType,
    headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${body.length}`, 'Content-Length': String(chunk.length) },
    body: chunk
  });
}
