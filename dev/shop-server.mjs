// Local shop service host. It runs the real published handler against the in-memory
// fake bucket and, only here, lets a ?user=<id> query stand in for a signed-in account.
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { createAppHandler } from '../functions/handler.mjs';
import { createFakeStorage } from './fake-storage.mjs';

const SKIP_RESPONSE_HEADERS = new Set(['content-encoding', 'transfer-encoding', 'connection', 'keep-alive']);

export function encodeUserContext(userId, name = 'Owner Account') {
  const payload = {
    user_id: userId,
    name,
    picture: '',
    site_id: 'local-dev-site',
    host_id: 'local-dev-host',
    session_expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
  return Buffer.from(JSON.stringify(payload), 'utf8')
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function toWebRequest(req, port) {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else if (value !== undefined) headers.set(key, value);
  }
  // Local fixture identity only: the deployed entry point has no such switch and the
  // Gateway strips caller-supplied context headers before the Function sees them.
  const fixtureUser = url.searchParams.get('user');
  if (fixtureUser !== null && fixtureUser !== '') headers.set('x-qoder-user-context', encodeUserContext(fixtureUser));
  else headers.delete('x-qoder-user-context');
  url.searchParams.delete('user');
  const method = req.method ?? 'GET';
  const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req);
  return new Request(url.toString(), { method, headers, body });
}

export function createShopDevServer(port = 8000) {
  const storage = createFakeStorage();
  const handler = createAppHandler({ storage });

  const server = createServer(async (req, res) => {
    try {
      if ((req.url ?? '').startsWith('/fake-storage/')) {
        const path = decodeURIComponent((req.url ?? '').slice('/fake-storage/'.length).split('?')[0]);
        const object = storage.objects.get(path);
        if (!object) {
          res.writeHead(404).end('missing');
          return;
        }
        res.writeHead(200, { 'content-type': object.contentType, 'content-length': String(object.bytes.byteLength) }).end(object.bytes);
        return;
      }
      const response = await handler(await toWebRequest(req, port));
      const body = Buffer.from(await response.arrayBuffer());
      const headers = {};
      response.headers.forEach((value, key) => { if (!SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) headers[key] = value; });
      if (response.status === 302 && headers.location?.startsWith('/')) headers.location = `http://127.0.0.1:${port}${headers.location}`;
      res.writeHead(response.status, headers).end(body);
    } catch (error) {
      res.writeHead(500, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'local_host_failure', detail: String(error?.message ?? error) }));
    }
  });

  return { server, storage, handler };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.argv[2] ?? 8000);
  const { server } = createShopDevServer(port);
  server.listen(port, '127.0.0.1', () => {
    console.log(`Ram Rass shop service (local fake) on http://127.0.0.1:${port}/functions/v1/app?action=catalogue`);
  });
}
