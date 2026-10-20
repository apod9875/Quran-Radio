// A local stand-in for a live radio stream.
//   /endless  an Icecast-like response that never ends (a streaming WAV of silence, so it also plays)
//   /silent   accepts the connection and never sends a byte (a stalled stream)
import http from 'node:http';

function streamingWavHeader() {
  const rate = 8000;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(0xffffffff, 4); // unknown length: it is a live stream
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write('data', 36);
  header.writeUInt32LE(0xffffffff, 40);
  return header;
}

export async function startStreamServer() {
  const sockets = new Set();
  const server = http.createServer((req, res) => {
    const mode = new URL(req.url, 'http://x').pathname.split('/').pop();
    res.writeHead(200, {
      'Content-Type': 'audio/wav',
      'Accept-Ranges': 'none',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    if (mode === 'silent') return;
    res.write(streamingWavHeader());
    const chunk = Buffer.alloc(64 * 1024, 0x80);
    const timer = setInterval(() => res.write(chunk), 100);
    res.on('close', () => clearInterval(timer));
  });
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    endlessUrl: `http://127.0.0.1:${port}/endless`,
    silentUrl: `http://127.0.0.1:${port}/silent`,
    close: () => new Promise((resolve) => {
      sockets.forEach((socket) => socket.destroy());
      server.close(resolve);
    })
  };
}
