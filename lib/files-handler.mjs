// Core API logic, kept separate from Netlify so it can be tested with a fake store.
import { timingSafeEqual, randomUUID } from 'node:crypto';

const MAX_BYTES = 5 * 1024 * 1024; // Netlify functions accept request bodies up to ~6 MB

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

function passwordOk(given, expected) {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createHandler({ getStore, getPassword }) {
  return async function handler(req, id) {
    const expected = getPassword();
    if (!expected) return json(500, { error: 'APP_PASSWORD is not set on the server.' });
    if (!passwordOk(req.headers.get('x-app-password'), expected)) {
      return json(401, { error: 'Wrong password.' });
    }

    const store = getStore();

    // GET /api/files  -> list saved files (newest first, metadata only)
    if (req.method === 'GET' && !id) {
      const { blobs } = await store.list();
      const items = await Promise.all(
        blobs.map(async ({ key }) => {
          const meta = await store.getMetadata(key);
          return meta ? { id: key, ...meta.metadata } : null;
        }),
      );
      items.sort((x, y) => (y?.savedAt || '').localeCompare(x?.savedAt || ''));
      return json(200, { files: items.filter(Boolean) });
    }

    // GET /api/files/:id -> one file with its content
    if (req.method === 'GET' && id) {
      const result = await store.getWithMetadata(id);
      if (!result) return json(404, { error: 'Not found.' });
      return json(200, { id, ...result.metadata, content: result.data });
    }

    // POST /api/files {name, content} -> save a new file
    if (req.method === 'POST' && !id) {
      let body;
      try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON.' }); }
      const name = String(body?.name || 'untitled.html').slice(0, 200);
      const content = typeof body?.content === 'string' ? body.content : null;
      if (content === null) return json(400, { error: 'content is required.' });
      const size = Buffer.byteLength(content);
      if (size > MAX_BYTES) return json(413, { error: 'File is larger than 5 MB.' });
      const savedAt = new Date().toISOString();
      const key = `${Date.now()}-${randomUUID().slice(0, 8)}`;
      const metadata = { name, savedAt, size };
      await store.set(key, content, { metadata });
      return json(201, { id: key, ...metadata });
    }

    // DELETE /api/files/:id
    if (req.method === 'DELETE' && id) {
      await store.delete(id);
      return json(200, { ok: true });
    }

    return json(405, { error: 'Method not allowed.' });
  };
}
