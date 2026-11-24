// In-memory stand-in for a Netlify Blobs store, for local testing.
export function createFakeStore() {
  const m = new Map();
  return {
    async list() { return { blobs: [...m.keys()].map(key => ({ key, etag: '' })), directories: [] }; },
    async getMetadata(k) { return m.has(k) ? { etag: '', metadata: m.get(k).metadata } : null; },
    async getWithMetadata(k) { return m.has(k) ? { data: m.get(k).data, metadata: m.get(k).metadata } : null; },
    async set(k, data, { metadata } = {}) { m.set(k, { data, metadata }); },
    async delete(k) { m.delete(k); },
  };
}
