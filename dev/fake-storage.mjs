// Credential-free in-memory stand-in for the platform file bucket. Local only: it lives
// outside functions/ and dist/ so it never reaches the published package.
export function createFakeStorage() {
  const objects = new Map();

  const contentTypeOf = (path) => {
    if (path.endsWith('.json')) return 'application/json; charset=utf-8';
    if (path.endsWith('.jpg')) return 'image/jpeg';
    if (path.endsWith('.png')) return 'image/png';
    if (path.endsWith('.webp')) return 'image/webp';
    return 'application/octet-stream';
  };

  return {
    objects,
    async upload(path, bytes, options = {}) {
      if (path.includes('..') || path.startsWith('/')) throw new Error('invalid_path');
      if (objects.has(path) && options.upsert !== true) throw new Error('exists');
      const body = bytes instanceof Uint8Array ? bytes : new Uint8Array(await new Response(bytes).arrayBuffer());
      objects.set(path, { bytes: body, contentType: options.contentType ?? contentTypeOf(path) });
      return { path };
    },
    async download(path) {
      const entry = objects.get(path);
      if (!entry) return new Response('not_found', { status: 404 });
      return new Response(entry.bytes, { headers: { 'content-type': entry.contentType } });
    },
    async remove(paths) {
      for (const path of paths) objects.delete(path);
      return { deleted: paths };
    },
    async list(prefix) {
      return { keys: [...objects.keys()].filter((key) => key.startsWith(prefix)) };
    },
    async createSignedUrl(path, seconds) {
      if (!objects.has(path)) throw new Error('missing');
      return { signedUrl: `/fake-storage/${path}?expires=${Math.floor(Date.now() / 1000) + seconds}` };
    },
    async createSignedUploadUrl(path) {
      return { signedUrl: `/fake-storage/${path}` };
    },
  };
}
