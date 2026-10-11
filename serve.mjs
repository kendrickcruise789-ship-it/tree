import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('./dist', import.meta.url)));
const PORTS = [8080, 8081, 8082, 8083, 4173];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

const handler = async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const requested = decodeURIComponent(url.pathname);
  // Resolve inside ROOT only — reject anything that escapes it
  const target = resolve(join(ROOT, normalize(requested === '/' ? 'index.html' : requested)));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  let file = target;
  try {
    let info = await stat(file);
    if (info.isDirectory()) {
      file = join(file, 'index.html');
      info = await stat(file);
    }
    const stream = createReadStream(file);
    res.writeHead(200, {
      'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      'content-length': info.size,
      'cache-control': 'no-cache',
    });
    stream.pipe(res);
    stream.on('error', () => res.end());
  } catch {
    // Real files answer 404; only extension-less routes fall back to the app shell
    if (extname(requested)) {
      res.writeHead(404).end('Not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME['.html'], 'cache-control': 'no-cache' });
    createReadStream(join(ROOT, 'index.html')).pipe(res);
  }
};

const tryListen = (port) =>
  new Promise((accept) => {
    const server = createServer(handler);
    server.once('error', () => accept(null));
    server.listen(port, '127.0.0.1', () => accept({ server, port }));
  });

for (const port of PORTS) {
  const bound = await tryListen(port);
  if (bound) {
    const address = `http://localhost:${bound.port}`;
    console.log(`\n  Clotex is running:  ${address}\n  Stop with Ctrl+C, or just close this window.\n`);
    if (!process.env.NO_BROWSER) {
      spawn('cmd', ['/c', 'start', '', address], { stdio: 'ignore', detached: true }).unref();
    }
    break;
  }
}
