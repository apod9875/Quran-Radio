// Serves web/ for the browser tests and applies the "/*" headers from web/_headers,
// so a CSP that blocks the app fails the tests instead of failing in production.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../web');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg'
};

function globalHeaders() {
  const text = fs.readFileSync(path.join(WEB_ROOT, '_headers'), 'utf8');
  const headers = {};
  let inGlobalBlock = false;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) { inGlobalBlock = false; continue; }
    if (!line.startsWith(' ')) { inGlobalBlock = line.trim() === '/*'; continue; }
    if (!inGlobalBlock) continue;
    const index = line.indexOf(':');
    headers[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return headers;
}

// allowOrigins: extra origins (e.g. a local stream server) the CSP should let the app reach
// port: 0 (default) picks a free port
export async function startStaticServer({ allowOrigins = [], port: listenPort = 0 } = {}) {
  const headers = globalHeaders();
  if (headers['Content-Security-Policy'] && allowOrigins.length) {
    headers['Content-Security-Policy'] = headers['Content-Security-Policy']
      .replace(/(connect-src|media-src)([^;]*)/g, `$1$2 ${allowOrigins.join(' ')}`);
  }
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.join(WEB_ROOT, relative);
    if (!file.startsWith(WEB_ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, headers);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      ...headers,
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(file).pipe(res);
  });

  await new Promise((resolve) => server.listen(listenPort, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); })
  };
}
