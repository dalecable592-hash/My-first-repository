// Local server: serves public/ and the /api/files API with an in-memory store.
// Usage: APP_PASSWORD=secret node test/dev-server.mjs   (then open http://localhost:8888)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHandler } from '../lib/files-handler.mjs';
import { createFakeStore } from './fake-store.mjs';

const fake = createFakeStore();
const handler = createHandler({ getStore: () => fake, getPassword: () => process.env.APP_PASSWORD });
const port = Number(process.env.PORT || 8888);

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  const m = url.pathname.match(/^\/api\/files(?:\/([^/]+))?\/?$/);
  if (m) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const r = await handler(new Request(url, { method: req.method, headers: req.headers, body }), m[1] && decodeURIComponent(m[1]));
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(await r.text()); return;
  }
  try {
    const html = await readFile(new URL('../public/index.html', import.meta.url));
    res.writeHead(200, { 'content-type': 'text/html' }); res.end(html);
  } catch { res.writeHead(404); res.end(); }
}).listen(port, () => console.log(`http://localhost:${port}`));
